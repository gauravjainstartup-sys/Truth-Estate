#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   LEAD-INTENT PARITY GUARD — the silent-lead-drop check, run in CI.

   Every lead the site captures is POSTed to the `capture-lead` edge
   function, which REJECTS any intent not on its allow-list
   (supabase/functions/capture-lead/core.ts → INTENTS). The browser
   fires that POST and ignores the response — lead capture must never
   surface an error to a visitor — so a rejected lead vanishes with NO
   row in contact_leads and NO trace to the user: a SILENT leak. That is
   exactly how phone-only leads were lost until migration 0019, and how
   any new surface can lose leads again — give the client an `intent` the
   server doesn't allow-list, and every submission from it drops in
   silence.

   The client's authoritative set of intents is the string-literal union
   on `Lead.intent` (src/lib/journey.ts). TypeScript forces every
   saveLead()/postLead() call site to use one of those literals, so the
   union IS the complete set of intents the client can ever send. This
   guard asserts that set is a SUBSET of the server allow-list:

     • a client intent MISSING from the allow-list → FAIL (silent leak).
     • an allow-list intent NO client sends        → WARN (dead entry /
       drift); FAIL only under LEAD_PARITY_STRICT=1.

   Fails CLOSED: if either list can't be parsed (renamed or reshaped),
   that is a FAIL, never a silent pass — a guard that can't see is not a
   guard. Exit non-zero on any FAIL.
   ════════════════════════════════════════════════════════════════ */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLIENT_FILE = "src/lib/journey.ts";
const SERVER_FILE = "supabase/functions/capture-lead/core.ts";
const STRICT = process.env.LEAD_PARITY_STRICT === "1";

const parseErrors = [];
const fail = (msg) => parseErrors.push(msg);

function read(rel) {
  try {
    return readFileSync(join(ROOT, rel), "utf8");
  } catch (e) {
    fail(`cannot read ${rel}: ${e.message}`);
    return "";
  }
}

/* Strip line comments so a `// …"quoted"…` note can never be mistaken for
   an intent, then pull every '…' / "…" string literal from a fragment. */
const literals = (fragment) =>
  [...fragment.replace(/\/\/[^\n]*/g, "").matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);

/* ── CLIENT · the union on `Lead.intent` ─────────────────────────── */
const clientSrc = read(CLIENT_FILE);
let clientIntents = [];
const leadType = clientSrc.match(/export type Lead\s*=\s*\{/);
if (!clientSrc) {
  /* read() already recorded the failure */
} else if (!leadType) {
  fail(`${CLIENT_FILE}: could not find \`export type Lead = {\` — was it renamed?`);
} else {
  // From `intent:` inside the Lead type, require a union of string literals
  // ending in `;`. If someone widens it to `string`, this won't match and we
  // fail closed rather than wave through an unconstrained intent.
  const union = clientSrc
    .slice(leadType.index)
    .match(/\bintent\??\s*:\s*("[^"]+"(?:\s*\|\s*"[^"]+")*)\s*;/);
  if (!union) {
    fail(`${CLIENT_FILE}: \`Lead.intent\` is not a string-literal union — parse the shape or narrow it back.`);
  } else {
    clientIntents = literals(union[1]);
    if (clientIntents.length === 0) fail(`${CLIENT_FILE}: parsed zero client intents.`);
  }
}

/* ── SERVER · the `INTENTS` allow-list array ─────────────────────── */
const serverSrc = read(SERVER_FILE);
let serverIntents = [];
if (serverSrc) {
  const arr = serverSrc.match(/export const INTENTS\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!arr) {
    fail(`${SERVER_FILE}: could not find \`export const INTENTS = [ … ] as const\` — was it renamed or reshaped?`);
  } else {
    serverIntents = literals(arr[1]);
    if (serverIntents.length === 0) fail(`${SERVER_FILE}: parsed zero allow-listed intents.`);
  }
}

/* ── fail closed if either side couldn't be read ─────────────────── */
if (parseErrors.length) {
  console.error(`\n❌ LEAD-INTENT PARITY — could not verify (failing closed):`);
  for (const p of parseErrors) console.error(`   • ${p}`);
  process.exit(1);
}

/* ── compare ─────────────────────────────────────────────────────── */
const serverSet = new Set(serverIntents);
const clientSet = new Set(clientIntents);
const leaks = clientIntents.filter((i) => !serverSet.has(i)); // client sends, server rejects → SILENT LEAK
const unused = serverIntents.filter((i) => !clientSet.has(i)); // allow-listed, no client sends → drift

/* ── report ──────────────────────────────────────────────────────── */
console.log(`\nLEAD-INTENT PARITY`);
console.log("─".repeat(72));
console.log(`client  Lead.intent  (${CLIENT_FILE})`);
console.log(`server  INTENTS      (${SERVER_FILE})`);
console.log("─".repeat(72));
for (const i of clientIntents) {
  const ok = serverSet.has(i);
  console.log(
    `${ok ? "✅" : "❌"} ${i}${ok ? "" : "   ← not allow-listed: capture-lead SILENTLY rejects every lead from this surface"}`,
  );
}
for (const i of unused) console.log(`⚠️  ${i}   ← allow-listed but no client surface sends it (drift?)`);
console.log("─".repeat(72));

const strictFail = STRICT && unused.length;
if (leaks.length || strictFail) {
  if (leaks.length) {
    console.error(`\n❌ LEAD-INTENT PARITY FAILED — ${leaks.length} client intent(s) the server would drop silently:`);
    console.error(`   ${leaks.join(", ")}`);
    console.error(`   Fix: add them to INTENTS in ${SERVER_FILE} AND redeploy the capture-lead edge function`);
    console.error(`   (it deploys separately from the web app — shipping the client alone leaks the leads).`);
  }
  if (strictFail) console.error(`\n❌ STRICT: ${unused.length} allow-list entr${unused.length === 1 ? "y has" : "ies have"} no client sender.`);
  process.exit(1);
}
console.log(
  `\n✅ Lead-intent parity holds — all ${clientIntents.length} client intents are accepted by capture-lead` +
    (unused.length ? `, ${unused.length} unused allow-list entr${unused.length === 1 ? "y" : "ies"} to review.` : "."),
);
