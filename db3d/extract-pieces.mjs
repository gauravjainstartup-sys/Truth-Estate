/* ════════════════════════════════════════════════════════════════
   EXTRACT PIECES — decompose ANY current-engine advisor HTML into
   DB-shaped pieces under db3d/projects/<slug>/pieces/.

   Generalized from the SPR extractor: slug from the filename, name
   from <title> (or --name), plan scale/origin parsed from the PX()
   definition. Reads the actual JS literals and evals them in a
   Math-only sandbox — faithful to the source, never re-typed.

   Works on the CURRENT engine anatomy (FLATW + PLATE + subScores v2 —
   e.g. titanium-spr, elan-the-presidential). Pre-v2 files (dlf-arbour)
   must be regenerated via the add-project skill first; every grab
   throws loudly if its pattern is missing, so a wrong-vintage file
   fails fast instead of shipping half a model.

   usage: node db3d/extract-pieces.mjs <advisor.html> [--name "Exact DB Name"]
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const SRC = process.argv[2];
if (!SRC) { console.error("usage: extract-pieces.mjs <advisor.html> [--name \"…\"]"); process.exit(1); }
const SLUG = path.basename(SRC).replace(/\.html$/, "");
const nameIx = process.argv.indexOf("--name");
const src = readFileSync(SRC, "utf8");
const OUTDIR = `db3d/projects/${SLUG}/pieces`;

// name: --name wins; else the <title> up to its first "·" separator
const titleRaw = /<title>([^<]+)<\/title>/.exec(src)?.[1] ?? SLUG;
const NAME = nameIx > 0 ? process.argv[nameIx + 1] : titleRaw.split("·")[0].replace(/&amp;/g, "&").trim();

/* ── balanced-literal extractor (first occurrence = the definition) ── */
function grab(id, open) {
  const re = new RegExp(`(?:(?:const|let|var)\\s+)?\\b${id}\\s*=\\s*`);
  const m = re.exec(src);
  if (!m) throw new Error(`not found in ${SLUG}: ${id} — is this a current-engine advisor?`);
  let i = m.index + m[0].length;
  if (open) {
    const close = open === "{" ? "}" : "]";
    let depth = 0, out = "", inStr = null;
    for (; i < src.length; i++) {
      const ch = src[i]; out += ch;
      if (inStr) { if (ch === inStr && src[i - 1] !== "\\") inStr = null; continue; }
      if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
      if (ch === open) depth++;
      else if (ch === close) { depth--; if (depth === 0) break; }
    }
    return out;
  }
  // scalar RHS: stop at ; , or newline (comma matters: `const FH=3.6, LOBBY=10.8;`)
  let out = "";
  for (; i < src.length; i++) { const ch = src[i]; if (ch === ";" || ch === "\n" || ch === ",") break; out += ch; }
  return out.trim();
}

const sandbox = { Math };
vm.createContext(sandbox);
const evalLit = (code) => vm.runInContext(`(${code})`, sandbox, { timeout: 1000 });

// site scalars & shell
const LAT = evalLit(grab("LAT"));
const FH = evalLit(grab("FH"));
const LOBBY = evalLit(grab("LOBBY"));
const FLOORS = evalLit(grab("FLOORS"));
const BENCH = evalLit(grab("BENCH"));
const WEST_W = evalLit(grab("WEST_W"));
const LAKE = evalLit(grab("LAKE", "{"));
const NORTH_CAL = evalLit(grab("NORTH_CAL"));
const SUN_R = evalLit(grab("SUN_R"));
const phase1px = evalLit(grab("phase1px", "["));

// plan scale/origin from the PX() definition, e.g. (px-1180)*0.55,(py-690)*0.55
const px = /const PX=\(px,py\)=>\[\(px-([\d.]+)\)\*([\d.]+),\(py-([\d.]+)\)\*([\d.]+)\]/.exec(src);
if (!px) throw new Error(`PX() definition not found in ${SLUG}`);
const [, ox, sx, oy, sy] = px;
if (sx !== sy) console.warn(`[extract] ${SLUG}: anisotropic plan scale (${sx} vs ${sy}) — storing x-scale`);

// the pieces
const towers = evalLit(grab("towers", "["));
const CONFIGS = evalLit(grab("CONFIGS", "{"));
const FLATW = evalLit(grab("FLATW", "{"));
const PLATE = evalLit(grab("PLATE", "{"));
const GEN = evalLit(grab("GEN", "{"));
const overall = evalLit(grab("overall", "{"));
const rooms = evalLit(grab("rooms", "{"));

const pieces = {
  site: {
    slug: SLUG, name: NAME,
    latitudeRad: LAT, latitudeDeg: +(LAT * 180 / Math.PI).toFixed(4),
    floors: FLOORS, floorHeightM: FH, lobbyHeightM: LOBBY,
    northCalRad: NORTH_CAL, northCalDeg: +(NORTH_CAL * 180 / Math.PI).toFixed(2),
    sunBenchmarkHours: BENCH, westWeight: WEST_W, sunRayLenM: SUN_R,
    lake: LAKE, scaleMPerPx: +sx, pxOriginX: +ox, pxOriginY: +oy,
    boundaryPx: phase1px,
  },
  towers: towers.map((t) => ({ slug: SLUG, ...t })),
  configs: Object.entries(CONFIGS).map(([k, v]) => ({ slug: SLUG, config: k, ...v })),
  plates: Object.entries(PLATE).map(([k, v]) => ({ slug: SLUG, config: k, offsets: v })),
  floorplans: Object.entries(FLATW).map(([k, v]) => {
    const [config, unit] = k.split("|");
    return { slug: SLUG, config, unit, key: k, ...v };
  }),
  vastu_rules: { generic_offsets: GEN, direction: overall, room: rooms },
};

mkdirSync(OUTDIR, { recursive: true });
for (const [n, val] of Object.entries(pieces)) {
  writeFileSync(`${OUTDIR}/${n}.json`, JSON.stringify(val, null, 2));
}

const B = (o) => Buffer.byteLength(JSON.stringify(o));
console.log(`── decomposition (${SLUG} — "${NAME}") ──`);
console.log(`site        lat ${pieces.site.latitudeDeg}° · G+${FLOORS} · north ${pieces.site.northCalDeg}° · scale ${sx} m/px @ (${ox},${oy}) · boundary ${phase1px.length}pts`);
console.log(`towers      ${towers.length} → ${towers.map((t) => t.id).join(",")}`);
console.log(`configs     ${pieces.configs.length} → ${pieces.configs.map((c) => c.config).join(", ")}`);
console.log(`plates      ${pieces.plates.length} → ${pieces.plates.map((p) => p.config).join(", ")}`);
console.log(`floorplans  ${pieces.floorplans.length} → ${pieces.floorplans.map((f) => `${f.key}(${f.walls.length}w)`).join(", ")}`);
console.log(`vastu_rules ${Object.keys(rooms).length} rooms · ${Object.keys(overall).length} directions (universal)`);
console.log(`total geometry payload ≈ ${(Object.values(pieces).reduce((s, p) => s + B(p), 0) / 1024).toFixed(1)} KB → ${OUTDIR}`);
