/* ════════════════════════════════════════════════════════════════
   SNAPSHOT SUPABASE — first prebuild step.

   Fetch every view the site reads ONCE into .data-snapshot/ and run
   the whole build off that single consistent sample (the build step
   sets SUPABASE_FIXTURES=.data-snapshot, the reader the fixture
   mechanism already implements).

   Why: pages used to fetch independently — one call per module per
   worker, ~17 samples of the DB per build — and a build that raced
   the pipeline's table rewrite rendered half its pages from a
   half-written view (run 29184251764: one pass saw 61 of 97 rows,
   88 projects flipped columns between passes). One snapshot = one
   moment in time for every page, and 17× less read egress.

   REQUIRE_SNAPSHOT=1 (set in deploy.yml) turns a failed or empty v3
   snapshot into a FAILED build — better no deploy than a gutted one.
   Without it (local runs), failure just warns and the build falls
   back to fetching directly.
   ════════════════════════════════════════════════════════════════ */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const SUPABASE_URL = process.env.SNAPSHOT_SUPABASE_URL || "https://lyetvabfgaidvqrbmaoy.supabase.co";
const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";
const OUT = process.env.SNAPSHOT_DIR || ".data-snapshot";
const REQUIRED = "backlog_listing_public_v3";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// selects are supersets of every caller's query — the fixture reader
// replays the file for whatever narrower query a caller makes.
// v3 is the ONLY backlog view the build reads; base is pulled solely as a
// fallback when v3 is empty (the build's fetchBacklogFull tries v3 → base),
// so we skip that redundant pull on every healthy build. (There is no
// backlog_listing_public_v2 — it was superseded by v3 and 404s.)
const V3_Q = "select=*&limit=500";
const FALLBACKS = [
  ["backlog_listing_public", "select=*&limit=500"],
];
const OTHERS = [
  ["backlog_projects", "select=*&limit=2000"],
  ["micro_market_data", "select=*&limit=200"],
  ["project_configurations", "select=*&limit=2000"],
  ["project_extended_details", "select=*&limit=300"],
  // QPR modules for the construction & sales report (expected_pct_at_qpr + R2 proof
  // PDFs), plus expected_roi, which carries the Truth Score's own pillar
  // breakdown — the scores and weights the score is actually built from.
  // Still a lean select: the table's raw_html column is large and unused here.
  // `overrides` JSONB carries the delivered_oc_date / delivered_certificate_url
  // (OC/CC) keys the Legal pillar reads. `legal_health` is the forensic legal
  // read — the single source of truth for the Legal pillar (headline, flags,
  // risk_breakdown, case_entries w/ per-case source_url, sources, retrieval_date).
  ["backlog_project_data", "select=id,construction_pace,sales_velocity,expected_roi,overrides,legal_health&limit=2000"],
  /* The developer's full RERA project ledger (name · location · type ·
     status · delivery timing), grouped by developer in fetchDeveloperLedger.
     Powers the "see the developer's projects" list under Developer DNA. */
  ["projects", "select=project_name,developer_name,location,type,status,oc_cc_available,actual_oc_date,is_delayed,delay_months&limit=2000"],
  /* The developers page fetches this at build and renders a whole section
     from it. It was NOT snapshotted, so every local build was blind to
     that section — the curated cards looked like the entire page here
     while production also showed a live table underneath them, saying
     something different about the same developers. A fixture set that
     omits a view the build reads is a fixture set that hides bugs. */
  ["developers_overview", "select=*&limit=100"],
  /* Per-developer forensic financials — financial_health carries the analyst's
     per-metric 0–100 scores (metric_scores) behind the five Financial-health
     meters. Snapshotted so the meters read the real per-metric signal instead
     of the single financial_band flattened onto all five. (Same lesson as
     developers_overview above: a fixture set that omits a view the build reads
     is a fixture set that hides bugs.) */
  ["developer_health", "select=developer_name,financial_health&limit=200"],
];

const fixtures = process.env.SUPABASE_FIXTURES;
if (fixtures && fixtures !== OUT) {
  console.log(`[snapshot] SUPABASE_FIXTURES preset (${fixtures}) — snapshot skipped`);
  process.exit(0);
}

/* ── Reuse the cached snapshot on code deploys — the egress fix ──
   A code push doesn't change the DB, so it doesn't need a fresh sample. When a
   usable snapshot has been restored from the CI cache and this run wasn't asked
   to refresh (SNAPSHOT_REFRESH=1, set only by the schedule and the manual "Run
   workflow" button), keep it and pull NOTHING — a code deploy then costs zero
   Supabase egress. A refresh run, or a missing/empty cache, falls through and
   pulls fresh as before (REQUIRE_SNAPSHOT still guards an empty result). */
async function cachedSnapshotRows() {
  try {
    const rows = JSON.parse(await readFile(`${OUT}/${REQUIRED}.json`, "utf8"));
    return Array.isArray(rows) && rows.length > 0 ? rows.length : 0;
  } catch { return 0; }
}
if (process.env.SNAPSHOT_REFRESH !== "1") {
  const n = await cachedSnapshotRows();
  if (n > 0) {
    console.log(`[snapshot] reusing cached ${OUT} (${n} ${REQUIRED} rows) — code deploy, no DB pull, zero Supabase egress. Schedule / "Run workflow" (SNAPSHOT_REFRESH=1) re-pulls.`);
    process.exit(0);
  }
  console.log(`[snapshot] no usable cache — pulling a fresh snapshot this run`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(pathQ) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathQ}`, { headers: H, signal: AbortSignal.timeout(20000) });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) return rows;
      } else {
        console.warn(`[snapshot] ${pathQ.split("?")[0]} → HTTP ${res.status} (attempt ${attempt})`);
      }
    } catch (e) {
      console.warn(`[snapshot] ${pathQ.split("?")[0]} → ${e instanceof Error ? e.message.slice(0, 60) : "error"} (attempt ${attempt})`);
    }
    if (attempt < 3) await sleep(attempt * 2000);
  }
  return null;
}

async function headCount(view, filter) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${view}?select=*${filter ? `&${filter}` : ""}&limit=1`, {
      method: "HEAD",
      headers: { ...H, Prefer: "count=exact" },
      signal: AbortSignal.timeout(20000),
    });
    const range = res.headers.get("content-range"); // e.g. "0-0/97"
    const total = range?.split("/")[1];
    return total && total !== "*" ? Number(total) : null;
  } catch {
    return null;
  }
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// ── egress instrumentation: byte size per view + a per-build total, so the
//    deploy log shows exactly where the read egress goes (base64 media in
//    project_extended_details / project_configurations is the suspect) ──
const MB = (n) => (n / 1048576).toFixed(1);
// For a heavy view, attribute its bytes to columns — a base64 media column
// (hero/brochure/etc. stored inline) shows up here as the dominant field, which
// is the actionable signal: migrate that column to a Storage URL and the pull
// collapses to a cacheable link.
function columnBytes(view, rows) {
  const cols = {};
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    for (const k of Object.keys(r)) {
      const v = r[k];
      if (v == null) continue;
      cols[k] = (cols[k] || 0) + Buffer.byteLength(typeof v === "string" ? v : JSON.stringify(v));
    }
  }
  const top = Object.entries(cols).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (top.length) console.log(`[snapshot]   ${view} heaviest columns → ${top.map(([k, b]) => `${k} ${MB(b)}MB`).join(" · ")}`);
}
let totalBytes = 0, wrote = 0;
async function snap(view, q, rows) {
  if (rows === undefined) rows = await getJson(`${view}?${q}`);
  if (!rows) { console.warn(`[snapshot] ${view} FAILED — build will treat it as unavailable`); return null; }
  const bytes = Buffer.byteLength(JSON.stringify(rows));
  totalBytes += bytes;
  await writeFile(`${OUT}/${view}.json`, JSON.stringify(rows));
  console.log(`[snapshot] ${view} → ${rows.length} rows · ${MB(bytes)} MB`);
  if (bytes > 1048576) columnBytes(view, rows); // heavy view → show where the bytes live
  wrote++;
  return rows;
}

/* v3 is required — resample until its size is stable (the pipeline rewrites
   tables in place, so a mid-write sample must not be trusted). */
let v3Rows = await getJson(`${REQUIRED}?${V3_Q}`);
if (v3Rows) {
  for (let cycle = 0; cycle < 3; cycle++) {
    await sleep(4000);
    const probe = await getJson(`${REQUIRED}?select=id&limit=500`);
    if (!probe || probe.length === v3Rows.length) break;
    console.warn(`[snapshot] ${REQUIRED} UNSTABLE (${v3Rows.length} → ${probe.length} rows) — pipeline writing, resampling`);
    v3Rows = (await getJson(`${REQUIRED}?${V3_Q}`)) ?? v3Rows;
  }
  await snap(REQUIRED, V3_Q, v3Rows);
}
// v2/base fallbacks: only when v3 is unusable — the build never reads them otherwise
if (!v3Rows || v3Rows.length === 0) {
  console.warn("[snapshot] v3 empty — pulling v2/base fallbacks");
  for (const [v, q] of FALLBACKS) await snap(v, q);
} else {
  console.log("[snapshot] v3 ok — skipped v2/base fallbacks (~2×4.5 MB not pulled)");
}
// supporting + media-heavy views
for (const [v, q] of OTHERS) await snap(v, q);

console.log(`[snapshot] ⇢ DB read egress this build ≈ ${MB(totalBytes)} MB across ${wrote} view(s)`);

// tracked stats read counts over projects_basic_public (HEAD + content-range)
const tracked = await headCount("projects_basic_public", "");
if (tracked != null) await writeFile(`${OUT}/projects_basic_public.count.json`, JSON.stringify([{ count: tracked }]));
const delayed = await headCount("projects_basic_public", "computed_is_delay=is.true");
if (delayed != null) await writeFile(`${OUT}/projects_basic_public.count.filtered.json`, JSON.stringify([{ count: delayed }]));
console.log(`[snapshot] counts → tracked:${tracked ?? "–"} delayed:${delayed ?? "–"}`);

if (!v3Rows || v3Rows.length === 0) {
  const msg = `[snapshot] ${REQUIRED} missing/empty — the site would build with zero project pages`;
  if (process.env.REQUIRE_SNAPSHOT === "1") {
    console.error(`${msg} — FAILING the build (previous deploy stays live)`);
    // leave no half-snapshot behind: the next attempt starts clean
    await rm(OUT, { recursive: true, force: true });
    process.exit(1);
  }
  console.warn(`${msg} — removing snapshot; the build falls back to direct fetches`);
  await rm(OUT, { recursive: true, force: true });
  process.exit(0);
}
console.log(`[snapshot] ${wrote} view(s) + counts → ${OUT}`);
