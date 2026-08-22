#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   RLS GUARD — the anon-key leak check, run continuously in CI.

   The whole account model reads Postgres straight from the browser with
   the PUBLIC anon key (it ships in the JS bundle), so Row-Level Security
   is the only wall. That wall has been breached once already: migration
   0001_rls_lockdown.sql records four bad policies that let anyone holding
   the anon key read 43 customer emails and read+rewrite 2,107 chats.

   This script is the non-regressable guard. It is the BLACK-BOX complement
   to supabase/audits/account_rls_pentest.sql (which proves isolation from
   INSIDE the database by impersonating a user): here we stand exactly where
   an attacker stands — the public REST endpoint, holding only the public
   anon key — and assert three things, mirroring the verification block at
   the bottom of migration 0001:

     1. SENSITIVE READS return nothing. user_profiles.email/phone,
        chat_sessions.content, payments, events, owned_properties,
        contact_leads must all come back empty (RLS filtered) or denied.
     2. PUBLIC BUILD TABLES stay readable. The static build reads these with
        the same anon key at build time; if a lockdown over-reaches and
        breaks them, every deploy silently ships an empty catalogue.
     3. CLIENT WRITES to money/identity tables are refused. Only payments
        and user_profiles are probed — chat_sessions and contact_leads
        accept anon inserts BY DESIGN (chat logging / lead capture), so
        writing to them is not a vulnerability and is not tested.

   Reads are side-effect-free. The two write probes send a minimal body and
   expect a 401/403 BEFORE any row is created; on the (failing) chance a row
   IS created, a best-effort delete follows and the check still fails loud.

   Fails CLOSED: a network error is a FAIL, never a silent pass — a guard
   that can't see is not a guard. Exit non-zero on any FAIL.

   Config is zero-touch: the public values below are the defaults, override
   with SUPABASE_URL / SUPABASE_ANON_KEY (repo variables) if they ever move.
   ════════════════════════════════════════════════════════════════ */

const SUPABASE_URL = (
  process.env.SUPABASE_URL || process.env.SNAPSHOT_SUPABASE_URL || "https://lyetvabfgaidvqrbmaoy.supabase.co"
).replace(/\/$/, "");
const ANON =
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_bLpHCRL6Xa0viqYeEuM3NA_U5VvNWwq";

/* Treat WARNs (renamed table, ambiguous status) as failures too. Off by
   default so a renamed table doesn't block every PR; flip on for a strict
   scheduled run. */
const STRICT = process.env.RLS_GUARD_STRICT === "1";

const H = { apikey: ANON, Authorization: `Bearer ${ANON}` };

async function call(method, path, body) {
  const opts = { method, headers: { ...H }, signal: AbortSignal.timeout(15000) };
  if (body !== undefined) {
    opts.headers["content-type"] = "application/json";
    opts.headers["Prefer"] = "return=representation";
    opts.body = JSON.stringify(body);
  }
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* non-JSON error body */ }
      return { status: res.status, json, text };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return { status: 0, json: null, text: String(lastErr && lastErr.message ? lastErr.message : lastErr) };
}

const results = [];
const add = (name, verdict, detail) => results.push({ name, verdict, detail });

/* ── 1 · sensitive reads must be empty or denied ─────────────────── */
const SENSITIVE = [
  ["user_profiles", "email"],
  ["user_profiles", "phone"],
  ["chat_sessions", "content"],
  ["payments", "amount"],
  ["events", "*"],
  ["report_stakes", "*"],
  ["owned_properties", "*"],
  ["contact_leads", "*"],
];
for (const [table, col] of SENSITIVE) {
  const { status, json } = await call("GET", `${table}?select=${col}&limit=1`);
  const name = `read  ${table}.${col}`;
  if (status === 401 || status === 403) add(name, "PASS", `denied (${status})`);
  else if (status === 200 && Array.isArray(json) && json.length === 0) add(name, "PASS", "empty []");
  else if (status === 200 && Array.isArray(json)) add(name, "FAIL", `LEAK — returned ${json.length} row(s) to the anon key`);
  else if (status === 404 || status === 400) add(name, "WARN", `not found / bad column (${status}) — table renamed?`);
  else if (status === 0) add(name, "FAIL", "network error — cannot verify (fail closed)");
  else add(name, "WARN", `unexpected status ${status}`);
}

/* ── 2 · public build tables must stay readable ──────────────────── */
const PUBLIC = [
  ["backlog_listing_public_v3", "name"],
  ["project_configurations", "*"],
  ["project_extended_details", "*"],
  ["developers", "*"],
  ["pricing", "*"],
];
for (const [table, col] of PUBLIC) {
  const { status, json } = await call("GET", `${table}?select=${col}&limit=1`);
  const name = `pub   ${table}`;
  if (status === 200 && Array.isArray(json) && json.length >= 1) add(name, "PASS", "readable");
  else if (status === 200 && Array.isArray(json)) add(name, "FAIL", "empty — anon lost read access; the static build would ship no data");
  else if (status === 0) add(name, "FAIL", "network error (fail closed)");
  else add(name, "FAIL", `not readable (status ${status}) — over-lockdown broke a build table`);
}

/* ── 3 · client writes to money/identity tables must be refused ──── */
const WRITE = [
  ["payments", { amount: 1 }],
  ["user_profiles", { name: "rls-guard-probe" }],
];
for (const [table, body] of WRITE) {
  const { status, json } = await call("POST", table, body);
  const name = `write ${table}`;
  if (status === 401 || status === 403) add(name, "PASS", `refused (${status})`);
  else if (status >= 200 && status < 300) {
    add(name, "FAIL", `FORGE — anon INSERT accepted (${status}); a client can write ${table}`);
    // best-effort cleanup so a broken policy doesn't leave probe rows behind
    if (Array.isArray(json)) for (const row of json) if (row && row.id != null) await call("DELETE", `${table}?id=eq.${encodeURIComponent(row.id)}`);
  } else if (status === 0) add(name, "FAIL", "network error (fail closed)");
  else add(name, "WARN", `insert not cleanly refused (status ${status}) — an anon insert path may exist; investigate`);
}

/* ── report ──────────────────────────────────────────────────────── */
const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
const icon = { PASS: "✅", FAIL: "❌", WARN: "⚠️ " };
console.log(`\nRLS GUARD · ${SUPABASE_URL}\n${"─".repeat(72)}`);
for (const r of results) console.log(`${icon[r.verdict]} ${pad(r.name, 32)} ${r.detail}`);
console.log("─".repeat(72));

const failed = results.filter((r) => r.verdict === "FAIL");
const warned = results.filter((r) => r.verdict === "WARN");
const fatal = STRICT ? failed.length + warned.length : failed.length;

if (fatal) {
  console.error(`\n❌ RLS GUARD FAILED — ${failed.length} failure(s)${warned.length ? `, ${warned.length} warning(s)` : ""}.`);
  console.error(`   The public anon key can reach data it must not. See supabase/migrations/0001_rls_lockdown.sql.`);
  process.exit(1);
}
console.log(`\n✅ RLS guard passed — ${results.length - warned.length} checks clean${warned.length ? `, ${warned.length} warning(s) to review` : ""}.`);
