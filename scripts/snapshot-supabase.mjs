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

import { mkdir, rm, writeFile } from "node:fs/promises";

const SUPABASE_URL = process.env.SNAPSHOT_SUPABASE_URL || "https://lyetvabfgaidvqrbmaoy.supabase.co";
const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";
const OUT = process.env.SNAPSHOT_DIR || ".data-snapshot";
const REQUIRED = "backlog_listing_public_v3";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// selects are supersets of every caller's query — the fixture reader
// replays the file for whatever narrower query a caller makes
const VIEWS = [
  ["backlog_listing_public", "select=*&limit=500"],
  ["backlog_listing_public_v2", "select=*&limit=500"],
  ["backlog_listing_public_v3", "select=*&limit=500"],
  ["backlog_projects", "select=*&limit=2000"],
  ["micro_market_data", "select=*&limit=200"],
  ["project_configurations", "select=*&limit=2000"],
  ["project_extended_details", "select=*&limit=300"],
];

const fixtures = process.env.SUPABASE_FIXTURES;
if (fixtures && fixtures !== OUT) {
  console.log(`[snapshot] SUPABASE_FIXTURES preset (${fixtures}) — snapshot skipped`);
  process.exit(0);
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

let wrote = 0;
let v3Rows = null;
for (const [view, q] of VIEWS) {
  let rows = await getJson(`${view}?${q}`);
  /* the pipeline rewrites tables in place — make sure the sample is stable
     before trusting it: refetch the required view until two consecutive
     samples agree on size (up to 3 cycles) */
  if (rows && view === REQUIRED) {
    for (let cycle = 0; cycle < 3; cycle++) {
      await sleep(4000);
      const probe = await getJson(`${view}?select=id&limit=500`);
      if (!probe || probe.length === rows.length) break;
      console.warn(`[snapshot] ${view} UNSTABLE (${rows.length} → ${probe.length} rows) — pipeline writing, resampling`);
      rows = (await getJson(`${view}?${q}`)) ?? rows;
    }
    v3Rows = rows;
  }
  if (!rows) {
    console.warn(`[snapshot] ${view} FAILED — build will treat it as unavailable`);
    continue;
  }
  await writeFile(`${OUT}/${view}.json`, JSON.stringify(rows));
  console.log(`[snapshot] ${view} → ${rows.length} rows`);
  wrote++;
}

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
console.log(`[snapshot] ${wrote}/${VIEWS.length} views + counts → ${OUT}`);
