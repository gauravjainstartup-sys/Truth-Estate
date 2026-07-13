/* ════════════════════════════════════════════════════════════════
   BUILD ENGINE — turn the monolithic advisor HTML into the generic,
   DB-driven, IP-free engine.

   Mechanical surgery on the reference file (repeatable, not hand-edits):
     1. keep the whole UI shell + the render/panel/astronomy engine as-is
     2. swap the inline DATA literals (LAT, FLOORS, towers, CONFIGS,
        FLATW, …) for reads off a fetched MODEL object
     3. wrap the engine in an async IIFE that first fetches the model
        through the gated API (mint-token → model), so nothing runs
        until the pieces arrive
     4. prepend the bootstrap that does that fetch

   The output file contains NO project data — only universal code. The
   value arrives at runtime, gated. (Increment 1: geometry is DB-driven
   and must render identically to the current file; the vastu scoring is
   still inline here and gets replaced by pre-computed intelligence in
   the next increment.)
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SRC = "public/tower-intel/signature-global-titanium-spr.html";
const OUT = "db3d/engine/tower-engine.html";
const src = readFileSync(SRC, "utf8");

// ── split at the engine <script> (the one right after three.min.js) ──
const threeTag = '<script src="three.min.js"></script>';
const afterThree = src.indexOf(threeTag) + threeTag.length;
const engOpen = src.indexOf("<script>", afterThree);
const engInnerStart = engOpen + "<script>".length;
const engClose = src.indexOf("</script>", engInnerStart);
if (engOpen < 0 || engClose < 0) throw new Error("could not locate the engine <script>");

const head = src.slice(0, engOpen);                    // …up to the engine <script>
let engine = src.slice(engInnerStart, engClose);       // the engine JS
const tail = src.slice(engClose + "</script>".length); // after the engine </script>

// ── swap scalar data literals (RHS up to the first ';') ──
const scalar = [
  [/const LAT=[^;]+;/, "const LAT=MODEL.LAT;"],
  [/const FH=[^;]+;/, "const FH=MODEL.FH, LOBBY=MODEL.LOBBY;"], // source line: const FH=3.6, LOBBY=10.8;
  [/const FLOORS=[^;]+;/, "const FLOORS=MODEL.FLOORS;"],
  [/const BENCH=[^;]+;/, "const BENCH=MODEL.BENCH;"],
  [/let\s+WEST_W=[^;]+;/, "let WEST_W=MODEL.WEST_W;"],
  [/const NORTH_CAL=[^;]+;/, "const NORTH_CAL=MODEL.NORTH_CAL;"],
];
for (const [re, rep] of scalar) {
  if (!re.test(engine)) throw new Error(`literal not found: ${re}`);
  engine = engine.replace(re, rep);
}

// ── swap bracket literals (LAKE/towers/CONFIGS/FLATW) via balanced match ──
function swapBalanced(code, name, open) {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*\\${open}`);
  const m = re.exec(code);
  if (!m) throw new Error(`balanced literal not found: ${name}`);
  const close = open === "{" ? "}" : "]";
  let i = m.index + m[0].length - 1, depth = 0, inStr = null;
  for (; i < code.length; i++) {
    const ch = code[i];
    if (inStr) { if (ch === inStr && code[i - 1] !== "\\") inStr = null; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) break; }
  }
  let j = i + 1; while (j < code.length && code[j] !== ";") j++; // include trailing ;
  return code.slice(0, m.index) + `const ${name}=MODEL.${name};` + code.slice(j + 1);
}
engine = swapBalanced(engine, "LAKE", "{");
engine = swapBalanced(engine, "towers", "[");
engine = swapBalanced(engine, "CONFIGS", "{");
engine = swapBalanced(engine, "FLATW", "{");

// ── bootstrap: fetch the gated model, adapt pieces → engine shapes ──
const BOOT = `
window.__loadModel = async function () {
  const q = new URLSearchParams(location.search);
  const API = q.get('api') || location.origin;                 // Edge Function base
  const SLUG = q.get('slug') || 'signature-global-titanium-spr';
  const SUBJECT = q.get('sub') || '';                          // production: from the gated session
  const mint = await fetch(API + '/mint-token', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ slug: SLUG, subject: SUBJECT }) });
  if (!mint.ok) throw new Error('mint-token ' + mint.status);
  const { token } = await mint.json();
  const res = await fetch(API + '/model?slug=' + encodeURIComponent(SLUG), { headers: { authorization: 'Bearer ' + token } });
  if (!res.ok) throw new Error('model ' + res.status);
  const b = await res.json();
  const CONFIGS = Object.fromEntries(b.configs.map(c => [c.config, c]));
  const FLATW = Object.fromEntries(b.floorplans.map(f => [f.key, f]));
  return {
    LAT: b.site.latitude_rad ?? b.site.latitudeRad, FH: b.site.floor_height_m ?? b.site.floorHeightM,
    LOBBY: b.site.lobby_height_m ?? b.site.lobbyHeightM, FLOORS: b.site.floors,
    BENCH: b.site.sun_benchmark_h ?? b.site.sunBenchmarkHours, WEST_W: b.site.west_weight ?? b.site.westWeight,
    LAKE: b.site.lake, NORTH_CAL: b.site.north_cal_rad ?? b.site.northCalRad,
    towers: b.towers, CONFIGS, FLATW,
    intelligence: b.intelligence, plates: b.plates, vastu: b.vastu, site: b.site,
  };
};`;

const html =
  head +
  `<script>${BOOT}</script>\n` +
  `<script>\n(async function () {\nconst MODEL = await window.__loadModel();\n` +
  engine +
  `\n})().catch(function (e) { console.error('[engine] boot failed', e); var a = document.getElementById('app'); if (a) a.innerHTML = '<p style=\"padding:24px;font:500 14px system-ui;color:#64707d\">Unable to load the model.</p>'; });\n</script>` +
  tail;

mkdirSync("db3d/engine", { recursive: true });
writeFileSync(OUT, html);
console.log(`[build-engine] wrote ${OUT} · ${(html.length / 1024).toFixed(0)} KB`);
console.log(`[build-engine] data literals swapped → MODEL.*  ·  engine deferred until gated fetch resolves`);
console.log(`[build-engine] contains project data? ${/const towers=\[\{id:/.test(html) ? "YES (BUG)" : "no — IP-free shell"}`);
