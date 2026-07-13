/* ════════════════════════════════════════════════════════════════
   DECOMPOSE — pull every project-specific PIECE out of the current
   monolithic SPR advisor HTML into DB-shaped JSON.

   The engine (sun/vastu maths, renderer, panels) is UNIVERSAL and
   stays in code. Only these data pieces are project IP and move to
   the DB, each served later by its own access-gated API:

     site         estate shell: lat, floors, scale, north, lake, boundary
     towers       the massing (7 slabs)
     configs      per-BHK areas/labels
     plates       per-config vastu room offsets (the scored layout)
     floorplans   FLATW — traced interior walls per unit
     vastu_rules  universal shastra tables (shared, NOT project IP)

   We read the actual JS literals and eval them in a Math-only sandbox
   so the extraction is faithful to the source, not a re-typing.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const SRC = "public/tower-intel/signature-global-titanium-spr.html";
const SLUG = "signature-global-titanium-spr";
const NAME = "Signature Global Titanium SPR"; // must match the DB project_name
const src = readFileSync(SRC, "utf8");

/* ── balanced-literal extractor ──
   grab `const <id> = <literal>` where <literal> is an array/object/expr,
   matching brackets so nested commas don't fool us. */
function grab(id, open) {
  // match `const X =`, a comma-continued `, X =`, or a bare `X =` (first occurrence = the definition)
  const re = new RegExp(`(?:(?:const|let|var)\\s+)?\\b${id}\\s*=\\s*`);
  const m = re.exec(src);
  if (!m) throw new Error(`not found: ${id}`);
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
  // scalar expression up to the first top-level ; or newline-with-comment
  let out = "";
  for (; i < src.length; i++) { const ch = src[i]; if (ch === ";" || ch === "\n") break; out += ch; }
  return out.trim();
}

const sandbox = { Math };
vm.createContext(sandbox);
const evalLit = (code) => vm.runInContext(`(${code})`, sandbox, { timeout: 1000 });

// ── site scalars & shell ──
const LAT = evalLit(grab("LAT"));            // radians
const FH = evalLit(grab("FH"));
const LOBBY = evalLit(grab("LOBBY"));
const FLOORS = evalLit(grab("FLOORS"));
const BENCH = evalLit(grab("BENCH"));
const WEST_W = evalLit(grab("WEST_W"));
const LAKE = evalLit(grab("LAKE", "{"));
const NORTH_CAL = evalLit(grab("NORTH_CAL"));
const SUN_R = evalLit(grab("SUN_R"));
const phase1px = evalLit(grab("phase1px", "["));

// ── the pieces ──
const towers = evalLit(grab("towers", "["));
const CONFIGS = evalLit(grab("CONFIGS", "{"));
const FLATW = evalLit(grab("FLATW", "{"));
const PLATE = evalLit(grab("PLATE", "{"));        // per-config vastu offsets
const GEN = evalLit(grab("GEN", "{"));            // generic fallback offsets
const overall = evalLit(grab("overall", "{"));    // vastu: per-direction
const rooms = evalLit(grab("rooms", "{"));        // vastu: per-room ideal/good/ok/bad

// scale: PX(px,py) => [(px-1180)*0.55,(py-690)*0.55]
const scaleMPerPx = 0.55, pxOriginX = 1180, pxOriginY = 690;

const pieces = {
  site: {
    slug: SLUG, name: NAME,
    latitudeRad: LAT, latitudeDeg: +(LAT * 180 / Math.PI).toFixed(4),
    floors: FLOORS, floorHeightM: FH, lobbyHeightM: LOBBY,
    northCalRad: NORTH_CAL, northCalDeg: +(NORTH_CAL * 180 / Math.PI).toFixed(2),
    sunBenchmarkHours: BENCH, westWeight: WEST_W, sunRayLenM: SUN_R,
    lake: LAKE, scaleMPerPx, pxOriginX, pxOriginY,
    boundaryPx: phase1px,
  },
  towers: towers.map((t) => ({ slug: SLUG, ...t })),
  configs: Object.entries(CONFIGS).map(([k, v]) => ({ slug: SLUG, config: k, ...v })),
  plates: Object.entries(PLATE).map(([k, v]) => ({ slug: SLUG, config: k, offsets: v })),
  floorplans: Object.entries(FLATW).map(([k, v]) => {
    const [config, unit] = k.split("|");
    return { slug: SLUG, config, unit, key: k, ...v };
  }),
  vastu_rules: { generic_offsets: GEN, direction: overall, room: rooms }, // shared/universal
};

for (const [name, val] of Object.entries(pieces)) {
  writeFileSync(`db3d/pieces/${name}.json`, JSON.stringify(val, null, 2));
}

// ── faithfulness report ──
const B = (o) => Buffer.byteLength(JSON.stringify(o));
console.log("── decomposition (SPR) ──");
console.log(`site        1 shell · lat ${pieces.site.latitudeDeg}° · G+${FLOORS} · north ${pieces.site.northCalDeg}° · boundary ${phase1px.length}pts · ${B(pieces.site)}B`);
console.log(`towers      ${towers.length} slabs → ${towers.map((t) => t.id).join(",")} · ${B(pieces.towers)}B`);
console.log(`configs     ${pieces.configs.length} → ${pieces.configs.map((c) => c.config).join(", ")} · ${B(pieces.configs)}B`);
console.log(`plates      ${pieces.plates.length} → ${pieces.plates.map((p) => p.config).join(", ")} · ${B(pieces.plates)}B`);
console.log(`floorplans  ${pieces.floorplans.length} → ${pieces.floorplans.map((f) => `${f.key}(${f.walls.length}w)`).join(", ")} · ${B(pieces.floorplans)}B`);
console.log(`vastu_rules ${Object.keys(rooms).length} rooms · ${Object.keys(overall).length} directions · ${B(pieces.vastu_rules)}B  (universal, not project IP)`);
console.log(`\ntotal pieces payload ≈ ${(Object.values(pieces).reduce((s, p) => s + B(p), 0) / 1024).toFixed(1)} KB (what a gated client would fetch, minus pre-computed intelligence)`);
