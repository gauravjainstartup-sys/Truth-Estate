// Map the Supabase database over the REST API, read-only.
// Runs in any session where the Supabase host is allow-listed (env network
// policy) and these env vars are set:
//   SUPABASE_URL, SUPABASE_KEY (anon/public), SUPABASE_RO_TOKEN (or SUPABASE_SERVICE_KEY)
// Usage:  node scripts/db-explore.mjs
// Uses curl (honors the session's HTTPS proxy + CA bundle automatically), so no
// Node proxy flags are needed. Read-only: only SELECT/HEAD requests are issued.
import { execFileSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "";
const BEARER = process.env.SUPABASE_RO_TOKEN || process.env.SUPABASE_SERVICE_KEY || ANON;
const APIKEY = ANON || process.env.SUPABASE_SERVICE_KEY || BEARER;
if (!URL || !BEARER) { console.error("Missing env: need SUPABASE_URL and SUPABASE_KEY (anon) + SUPABASE_RO_TOKEN (or SUPABASE_SERVICE_KEY)."); process.exit(1); }
const base = URL.replace(/\/$/, "");
const CA = "/root/.ccr/ca-bundle.crt";
const caArgs = existsSync(CA) ? ["--cacert", CA] : [];

function get(path, extra = []) {
  const args = ["-s", "--max-time", "45", ...caArgs, "-D", "-",
    "-H", `apikey: ${APIKEY}`, "-H", `Authorization: Bearer ${BEARER}`,
    ...extra.flatMap((h) => ["-H", h]), `${base}${path}`];
  const out = execFileSync("curl", args, { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  const i = out.indexOf("\r\n\r\n") >= 0 ? out.indexOf("\r\n\r\n") : out.indexOf("\n\n");
  return { head: i >= 0 ? out.slice(0, i) : "", body: (i >= 0 ? out.slice(i) : out).trim() };
}

const root = get("/rest/v1/");
let spec;
try { spec = JSON.parse(root.body); }
catch { console.error("REST root did not return JSON — auth or network issue.\nHeaders:\n" + root.head.slice(0, 600) + "\nBody:\n" + root.body.slice(0, 600)); process.exit(2); }

const defs = spec.definitions || {};
const tables = Object.keys(defs).sort();
console.log(`\n=== ${tables.length} tables/views readable via REST ===`);
const report = {};
for (const t of tables) {
  const props = defs[t]?.properties || {};
  const cols = Object.entries(props).map(([k, v]) => `${k}:${v.format || v.type || "?"}`);
  let count = null, sample = [];
  try {
    const c = get(`/rest/v1/${encodeURIComponent(t)}?select=*`, ["Prefer: count=exact", "Range: 0-0"]);
    const m = c.head.match(/content-range:\s*[^/]*\/(\d+|\*)/i);
    count = m ? m[1] : null;
  } catch {}
  try { sample = JSON.parse(get(`/rest/v1/${encodeURIComponent(t)}?select=*&limit=2`).body); } catch {}
  report[t] = { count, columns: cols, sample };
  console.log(`\n• ${t}  (${count ?? "?"} rows)\n    ${cols.join(", ")}`);
}
const outFile = existsSync("scratchpad") ? "scratchpad/db-map.json" : "db-map.json";
writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`\nFull schema + samples → ${outFile}`);
