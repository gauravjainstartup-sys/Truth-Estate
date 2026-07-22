// Map the Supabase database over the REST API, read-only.
// Runs in any session where the Supabase host is allow-listed (env network
// policy) and these env vars are set:
//   SUPABASE_URL, SUPABASE_KEY (anon/public), SUPABASE_RO_TOKEN (or SUPABASE_SERVICE_KEY)
// Usage:  node scripts/db-explore.mjs
// Uses curl (honors the session's HTTPS proxy + CA bundle automatically), so no
// Node proxy flags are needed. Read-only: only SELECT/HEAD requests are issued.
//
// Enumeration has two paths:
//   1. The PostgREST OpenAPI root (/rest/v1/) lists every relation — but that
//      endpoint is service_role-only. Used when SUPABASE_SERVICE_KEY is set.
//   2. With a limited role (e.g. a claude_ro SELECT-only token) the root 401s
//      with UNAUTHORIZED_INVALID_API_KEY_TYPE. We then discover relations from a
//      seed list + PostgREST's "Perhaps you meant 'public.X'" fuzzy hint, and
//      confirm each with a real count request. Nothing is reported that the DB
//      did not confirm.
// db-map.json holds 2 sample rows per table (may include PII); scratchpad/ is
// gitignored, so the map stays local.
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
  // curl over an HTTPS proxy prepends a "HTTP/1.1 200 Connection Established"
  // header block. Consume every leading HTTP header block so `head` is the REAL
  // response's headers (content-range, status, sb-error-code) and `body` is the
  // payload alone — otherwise the real headers leak into the body.
  let rest = out, head = "";
  while (/^HTTP\//.test(rest)) {
    let i = rest.indexOf("\r\n\r\n"), sep = 4;
    if (i < 0) { i = rest.indexOf("\n\n"); sep = 2; }
    if (i < 0) break;
    head = rest.slice(0, i);
    rest = rest.slice(i + sep);
  }
  return { head, body: rest.trim() };
}
// Last HTTP status in the header block (skips the proxy's "200 Connection Established").
const statusOf = (head) => { const m = [...head.matchAll(/HTTP\/[\d.]+\s+(\d{3})/g)]; return m.length ? Number(m[m.length - 1][1]) : 0; };

// ── Path 1: OpenAPI root (service_role only) ───────────────────────────────
const root = get("/rest/v1/");
let tables = null;
const propsByTable = {};
try {
  const spec = JSON.parse(root.body);
  if (spec.definitions) {
    tables = Object.keys(spec.definitions).sort();
    for (const t of tables) propsByTable[t] = spec.definitions[t]?.properties || {};
    console.log(`\n=== ${tables.length} relations via OpenAPI root (service_role) ===`);
  }
} catch { /* not JSON → limited role, fall through to discovery */ }

// ── Path 2: fuzzy-hint discovery (limited role) ────────────────────────────
function hintTable(missing) {
  try {
    const r = get(`/rest/v1/${missing}?select=x&limit=1`);
    if (statusOf(r.head) !== 404) return null;
    const m = (JSON.parse(r.body)?.hint || "").match(/public\.([a-z0-9_]+)/i);
    return m ? m[1] : null;
  } catch { return null; }
}
function discover() {
  // Seed: relations known from the app + prior discoveries. Discovery augments
  // this so the map stays correct as the schema changes.
  const seed = [
    "projects", "projects_basic_public", "project_configurations", "project_configurations_bak",
    "project_extended_details", "project_documents", "project_plan_scores",
    "project_3d_configs", "project_3d_towers", "project_3d_site", "project_3d_intake",
    "project_3d_intelligence", "tower_intelligence_scores", "site_plan_extractions",
    "site_plan_objects", "vastu_rules", "backlog_projects", "backlog_listing_public",
    "backlog_listing_public_v3", "micro_market_data", "developers", "developer_health",
    "cagr_defaults", "contact_leads", "contact_messages", "user_profiles", "audit_requests",
    "chat_sessions", "agents", "agent_runs", "request_logs", "deploy_throttle",
  ];
  const found = new Set(seed);
  const dict = ["a","e","i","o","u","project","backlog","market","unit","flat","tower","floor",
    "vastu","user","log","media","geo","doc","config","detail","case","rule","score","rank","chat",
    "lead","agent","audit","developer","builder","location","city","area","litigation","session",
    "profile","intake","intelligence","health","document","extraction","object","message","request",
    "booking","payment","price","review","event","queue","cache","default"];
  for (const w of dict) { const t = hintTable(`zzq_${w}_zzq`); if (t) found.add(t); }
  const prefixes = new Set();
  for (const t of found) { const p = t.split("_").slice(0, -1).join("_"); if (p) prefixes.add(p); }
  for (const p of prefixes) { const t = hintTable(`${p}_zzq9`); if (t) found.add(t); }
  return [...found].sort();
}
if (!tables) {
  console.error(`REST root not readable with this key (${(root.head.match(/sb-error-code:\s*(\S+)/i) || [])[1] || "needs service_role"}) — discovering relations via seed + fuzzy hint.`);
  tables = discover();
  console.log(`\n=== discovering: ${tables.length} candidate relations to confirm ===`);
}

const inferType = (v) => v === null ? "null" : Array.isArray(v) ? "array"
  : typeof v === "string" ? (/^\d{4}-\d{2}-\d{2}[T ]/.test(v) ? "timestamp" : /^\d{4}-\d{2}-\d{2}$/.test(v) ? "date" : "text")
  : typeof v === "number" ? (Number.isInteger(v) ? "int" : "numeric") : typeof v === "object" ? "json" : typeof v;

const report = {};
for (const t of tables) {
  let count = null, sample = [];
  try {
    const c = get(`/rest/v1/${encodeURIComponent(t)}?select=*`, ["Prefer: count=exact", "Range: 0-0"]);
    if (statusOf(c.head) === 404) continue; // discovery false-positive → not a real relation
    const m = c.head.match(/content-range:\s*[^/]*\/(\d+|\*)/i);
    count = m ? m[1] : null;
  } catch { continue; }
  try { sample = JSON.parse(get(`/rest/v1/${encodeURIComponent(t)}?select=*&limit=2`).body); } catch {}
  // Columns: OpenAPI properties when available, else inferred from a sample row.
  const props = propsByTable[t];
  const cols = props && Object.keys(props).length
    ? Object.entries(props).map(([k, v]) => `${k}:${v.format || v.type || "?"}`)
    : Array.isArray(sample) && sample[0]
      ? Object.entries(sample[0]).map(([k, v]) => `${k}:${inferType(v)}`)
      : [];
  report[t] = { count, columns: cols, sample };
  console.log(`\n• ${t}  (${count ?? "?"} rows)\n    ${cols.join(", ") || "(empty — columns not sampled)"}`);
}
const outFile = existsSync("scratchpad") ? "scratchpad/db-map.json" : "db-map.json";
writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`\n${Object.keys(report).length} relations confirmed · full schema + samples → ${outFile}`);
