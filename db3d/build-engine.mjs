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

const SRC = process.argv[2] || "public/tower-intel/signature-global-titanium-spr.html";
const SLUG = SRC.split("/").pop().replace(/\.html$/, "");
const OUT = process.argv[3] || `db3d/engine/engine-${SLUG}.html`;
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
    // skip comments — a stray ' or ] inside a data-block note (e.g.
    // "/* …Presidential's T-14… */") must not desync the scan and swallow
    // the next literal. Only outside strings.
    if (ch === "/" && code[i + 1] === "*") { const e = code.indexOf("*/", i + 2); i = e < 0 ? code.length : e + 1; continue; }
    if (ch === "/" && code[i + 1] === "/") { const e = code.indexOf("\n", i + 2); i = e < 0 ? code.length : e - 1; continue; }
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

/* ── increment 2: strip the vastu scoring (the shipping IP) ──
   The v2 layer (subScores/WEIGHTS/composite, line ~1790) stays: morning/cool/
   view/vent/floor are public astronomy+geometry and the priorities sliders
   need the six dims to recombine live. Only the VASTU derivation is secret —
   the PLATE room offsets, the room-importance weights, and the room scoring.
   Those go; the stored per-flat results (MODEL.intelligence) replace them. */
function replaceFn(code, name, replacement) {
  const re = new RegExp(`function\\s+${name}\\s*\\(`);
  const m = re.exec(code);
  if (!m) throw new Error(`function not found: ${name}`);
  let i = code.indexOf("{", m.index), depth = 0, inStr = null;
  for (; i < code.length; i++) {
    const ch = code[i];
    if (inStr) { if (ch === inStr && code[i - 1] !== "\\") inStr = null; continue; }
    // skip comments — an unpaired apostrophe in a data-block note (e.g. "the
    // line's deck facade") must not desync the scan; same guard as swapBalanced.
    if (ch === "/" && code[i + 1] === "*") { const e = code.indexOf("*/", i + 2); i = e < 0 ? code.length : e + 1; continue; }
    if (ch === "/" && code[i + 1] === "/") { const e = code.indexOf("\n", i + 2); i = e < 0 ? code.length : e - 1; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) break; }
  }
  return code.slice(0, m.index) + replacement + code.slice(i + 1);
}
function mustSwap(code, re, rep, label) {
  if (!re.test(code)) throw new Error(`pattern not found: ${label}`);
  return code.replace(re, rep);
}

// v1 flatScore (dead after the v2 reassignment, but its formula still ships) → stub
engine = replaceFn(engine, "flatScore", "let flatScore; /* v1 removed — v2 below reads pre-computed intelligence */");
// v1 computeScores2 (dead after v2 reassignment) → stub
engine = replaceFn(engine, "computeScores2", "let computeScores2; /* v1 removed — v2 below */");
// vastuRoomScore carried the PLATE offsets (project IP) → per-flat stored lookup
engine = replaceFn(engine, "vastuRoomScore",
  `function vastuRoomScore(roomKey,t,u){const r=INTEL.get(t.id+'|'+u.id);const rr=r&&r.reasons&&r.reasons.rooms&&r.reasons.rooms[roomKey];
  if(rr)return{dir:rr.dir,score:rr.score,reason:rr.reason,ideal:rr.ideal};
  return{dir:'\\u2014',score:3,reason:'',ideal:'NE'};}`);
// plateCfg pointed rooms at plates — plates live server-side now
engine = replaceFn(engine, "plateCfg", "/* plateCfg removed — plates never ship */");
// vastuFor's universal shastra tables → served by the gated API (MODEL.vastu)
engine = replaceFn(engine, "vastuFor",
  `function vastuFor(c){const d=(MODEL.vastu&&MODEL.vastu.direction&&MODEL.vastu.direction[c])||{s:3,n:'Workable with a considered internal layout.'};
  return{s:d.s,n:d.n,rooms:(MODEL.vastu&&MODEL.vastu.room)||{}};}`);
// flat-sheet call site: new signature (roomKey, t, u)
engine = mustSwap(engine,
  /rkeys\.map\(k=>vastuRoomScore\(k,compass,plateCfg\(t,u\),u\.mir\)\)/,
  "rkeys.map(k=>vastuRoomScore(k,t,u))", "flat-sheet vastuRoomScore call");
// subScores' vastu dimension: room list + WV weights + aggregation (IP) → stored value.
// CONFIGS[t.cfg] on single-config towers (titanium/presidential); CONFIGS[u.cfg||t.cfg]
// on quad-core towers where each corner carries its own config (M3M/Puri) — accept both.
engine = mustSwap(engine,
  /const rk=\(CONFIGS\[(?:u\.cfg\|\|)?t\.cfg\]\.beds===4\)[\s\S]*?classical Shastra\s*\n/,
  "const vastu=((INTEL.get(t.id+'|'+u.id)||{}).sub_scores||{}).vastu??60;   // pre-computed server-side — the scoring recipe never ships\n",
  "subScores vastu block");

// ── bootstrap: fetch the gated model, adapt pieces → engine shapes ──
const BOOT = `
window.__loadModel = async function () {
  const q = new URLSearchParams(location.search);
  const API = q.get('api') || location.origin;                 // Edge Function base
  const SLUG = q.get('slug') || '__PROJECT_SLUG__';
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

const BOOT_FILLED = BOOT.replace("__PROJECT_SLUG__", SLUG);
const html =
  head +
  `<script>${BOOT_FILLED}</script>\n` +
  `<script>\n(async function () {\nconst MODEL = await window.__loadModel();\n` +
  `const INTEL = new Map((MODEL.intelligence || []).map(function (r) { return [r.tower_id + '|' + r.unit, r]; }));\n` +
  engine +
  `\n;try{if(!scores)computeScores2();window.__PARITY={topH:topH(),FLOORS:FLOORS,FH:FH,LOBBY:LOBBY,LAT:+LAT.toFixed(6),towers:towers.length,configs:Object.keys(CONFIGS).length,` +
  `flats:scores.flatMap(function(sc){return sc.us.map(function(o){return{t:sc.t.id,u:o.u.id,s:o.fs.s,g:o.fs.grade};});}).sort(function(a,b){return a.t.localeCompare(b.t)||a.u.localeCompare(b.u);})};}catch(_){}` +
  `\n})().catch(function (e) { console.error('[engine] boot failed', e); var a = document.getElementById('app'); if (a) a.innerHTML = '<p style=\"padding:24px;font:500 14px system-ui;color:#64707d\">Unable to load the model.</p>'; });\n</script>` +
  tail;

// ── IP-leak assertions: the build FAILS if any secret still ships ──
const LEAKS = [
  [/const towers=\[\{id:/, "tower geometry literal"],
  [/\biw:\d/, "FLATW floor-plan trace"],
  [/PLATE\s*=\s*\{/, "vastu PLATE offsets"],
  [/living:0,masterBed:\d/, "vastu plate row"],
  [/WV=\{entrance:3/, "room-importance weights"],
  [/0\.35\*sunPts/, "v1 composite formula"],
  [/kitchen:\{ideal:'SE'/, "shastra room tables (should come via API)"],
];
const leaked = LEAKS.filter(([re]) => re.test(html));
if (leaked.length) throw new Error("IP LEAK in built shell: " + leaked.map(([, n]) => n).join(", "));

mkdirSync("db3d/engine", { recursive: true });
writeFileSync(OUT, html);
console.log(`[build-engine] ${SLUG} → ${OUT} · ${(html.length / 1024).toFixed(0)} KB`);
console.log(`[build-engine] data literals swapped → MODEL.*  ·  vastu scoring → pre-computed INTEL lookups`);
console.log(`[build-engine] IP-leak scan: ${LEAKS.length} signatures checked — none present`);
