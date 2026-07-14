/* ════════════════════════════════════════════════════════════════
   INTAKE — pipeline STEP 1.  Fetch a project's intake row, validate
   it against the add-project Phase-1 checklist, and emit the
   generation brief the generator starts from (instead of asking).

   Run:  node db3d/intake/intake.mjs <slug> [--brief-out <path>]
   Test: node db3d/intake/test-intake.mjs

   SOURCE seam — today reads db3d/intake/projects/<slug>/intake.json
   (the fixture; same mock posture as the rest of db3d, since Supabase
   is network-blocked from the build sandbox). In production this is
   one call to get_intake(slug) via service_role (schema-intake.sql).
   Set INTAKE_DIR to point elsewhere.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadFeed } from "./feed.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INTAKE_DIR = process.env.INTAKE_DIR || path.join(HERE, "projects");
const FEED_DIR = process.env.FEED_DIR || path.join(HERE, "feed");

/* Tier-2 site defaults (schema stores NULL = "use the engine default").
   Mirrors add-project's Tier-2 list + project-geometry.md. */
export const SITE_DEFAULTS = {
  floor_height_m: 3.6,
  lobby_height_m: 10.8,
  core_half_width_m: 3.5,
  sky_floor: 30,
  prevailing_breeze: ["W", "NW", "N"],
};

export function loadIntake(slug, dir = INTAKE_DIR) {
  const p = path.join(dir, slug, "intake.json");
  return JSON.parse(readFileSync(p, "utf8")); // hand-authored intake (legacy / overrides fixture)
}

/* Resolve a project to its intake contract. Primary source is the founder's
   project_input_feed view (feed/<slug>.feed.json here; the view in production);
   falls back to a hand-authored intake row if no feed exists for the slug. */
export function resolveIntake(slug) {
  if (existsSync(path.join(FEED_DIR, `${slug}.feed.json`))) return { intake: loadFeed(slug), source: "project_input_feed" };
  return { intake: loadIntake(slug), source: "intake.json (hand-authored)" };
}

/* Validate against the Phase-1 checklist. Tier-1 = output is wrong
   without it. Tier-2 = safe default (reported, not blocking). Plates &
   exact facings are NOT checked here — they're traced + confirmed at
   the vastu gate, never part of intake. */
export function validate(intake) {
  const missing = [], warnings = [], notes = [];
  const need = (cond, label) => { if (!cond) missing.push(label); };
  const num = (v) => typeof v === "number" && Number.isFinite(v);

  need(intake.slug, "slug");
  need(intake.name, "name (must match DB project_name)");
  need(num(intake.latitude_deg), "latitude_deg  [tell] city latitude → sun path");
  need(num(intake.north_offset_deg), "north_offset_deg  [⚠] plan-up → true north");
  need(num(intake.floors) && intake.floors > 0, "floors  [tell] G+?");
  need(num(intake.scale_m_per_px) && intake.scale_m_per_px > 0, "scale_m_per_px  [tell] traced-coord provenance");
  need(intake.siteplan_url, "siteplan_url  [image] to trace tower footprints");

  const configs = Array.isArray(intake.configs) ? intake.configs : [];
  need(configs.length > 0, "configs  [tell] at least one BHK with areas");
  configs.forEach((c, i) => {
    const tag = c.config || `#${i}`;
    need(c.config, `configs[${i}].config`);
    need(num(c.beds), `configs["${tag}"].beds  (decides which rooms get vastu-scored)`);
    need(num(c.carpetSqft) || num(c.superSqft), `configs["${tag}"] area (carpet or super sqft)`);
  });

  // every stated config should have at least one floor-plan image to trace
  const fps = Array.isArray(intake.floorplan_urls) ? intake.floorplan_urls : [];
  const fpConfigs = new Set(fps.map((f) => f.config));
  configs.forEach((c) => {
    if (c.config && !fpConfigs.has(c.config)) missing.push(`floorplan_urls: none for config "${c.config}"  [image] to trace the plate`);
  });
  need(fps.length > 0, "floorplan_urls  [image] at least one floor plan");

  // Tier-2 defaults being applied (informational)
  for (const [k, v] of Object.entries(SITE_DEFAULTS)) {
    if (intake[k] == null) warnings.push(`${k} not set → engine default ${JSON.stringify(v)}`);
  }
  if (!intake.tower_hints?.towerCount) warnings.push("tower_hints.towerCount not set → tower count read from siteplan only");
  if (!intake.view_anchors?.length) warnings.push("view_anchors not set → the premium outlook must be identified while tracing");

  if (intake.floors_uniform === false) notes.push("floors_uniform=false → per-tower height variation to capture during tracing");

  return { ready: missing.length === 0, missing, warnings, notes };
}

/* Apply Tier-2 defaults → the resolved site the generator uses. */
export function resolveSite(intake) {
  const site = { ...SITE_DEFAULTS };
  for (const k of Object.keys(SITE_DEFAULTS)) if (intake[k] != null) site[k] = intake[k];
  return {
    latitudeDeg: intake.latitude_deg, northOffsetDeg: intake.north_offset_deg,
    floors: intake.floors, floorsUniform: intake.floors_uniform !== false,
    scaleMPerPx: intake.scale_m_per_px, ...site,
    viewAnchors: intake.view_anchors || [],
  };
}

/* The generation brief — what the add-project skill starts from instead
   of interviewing the founder. Markdown so it's reviewable + pasteable. */
export function brief(intake) {
  const v = validate(intake), site = resolveSite(intake);
  const L = [];
  L.push(`# Generation brief — ${intake.name}  \`${intake.slug}\``);
  L.push("");
  L.push(`> Auto-produced by the intake pipeline (Step 1). Feeds \`add-project\` Phase 0–1.`);
  L.push(`> Status: **${v.ready ? "READY to generate" : "BLOCKED — " + v.missing.length + " Tier-1 gap(s)"}**`);
  L.push("");
  L.push(`- **Project**: ${intake.name} · ${intake.developer || "?"} · ${intake.location || intake.city || "?"}`);
  const prov = intake.__provenance || {};
  const nTag = prov.northDefaulted ? " (default — north-up)" : "";
  const sTag = prov.scaleDefaulted ? " (default)" : "";
  if (prov.source) L.push(`- **Source**: ${prov.source}`);
  L.push(`- **Sun**: latitude ${site.latitudeDeg}° · true-north offset ${site.northOffsetDeg}°${nTag} (CW+)`);
  L.push(`- **Massing**: G+${site.floors}${site.floorsUniform ? " (uniform)" : " (varies — capture per tower)"} · scale ${site.scaleMPerPx} m/px${sTag}`);
  L.push(`- **Defaults applied**: floor ${site.floor_height_m} m · lobby ${site.lobby_height_m} m · core ½ ${site.core_half_width_m} m · sky floor ${site.sky_floor} · breeze ${(site.prevailing_breeze || []).join("/")}`);
  if (intake.tower_hints) {
    const th = intake.tower_hints;
    L.push(`- **Tower hints**: ${th.towerCount ?? "?"} towers${th.notes ? " — " + th.notes : ""}`);
    if (th.configByTower) L.push(`  - config↔tower: ${Object.entries(th.configByTower).map(([t, c]) => `${t}=${c}`).join(" · ")}`);
  }
  L.push("");
  L.push(`## Configs (stated — plates/facings still to trace + confirm at the vastu gate)`);
  L.push(`| Config | Beds | Baths | Carpet | Super | Balcony | Rooms |`);
  L.push(`|---|---|---|---|---|---|---|`);
  for (const c of intake.configs || []) {
    L.push(`| ${c.config} | ${c.beds ?? "?"} | ${c.baths ?? "?"} | ${c.carpetSqft ?? "?"} | ${c.superSqft ?? "?"} | ${c.balconySqft ?? "?"} | ${c.rooms || ""} |`);
  }
  L.push("");
  L.push(`## Assets to trace`);
  L.push(`- **Siteplan**: ${intake.siteplan_url || "❌ MISSING"}`);
  for (const f of intake.floorplan_urls || []) L.push(`- **Floor plan** ${f.config} · ${f.unit || ""} ${f.label ? "(" + f.label + ")" : ""}: ${f.url}`);
  L.push("");
  if (!v.ready) { L.push(`## ⛔ Tier-1 gaps (fill before generating)`); v.missing.forEach((m) => L.push(`- ${m}`)); L.push(""); }
  if (v.warnings.length) { L.push(`## Notes / defaults`); v.warnings.forEach((w) => L.push(`- ${w}`)); v.notes.forEach((n) => L.push(`- ${n}`)); L.push(""); }
  L.push(`## Next`);
  L.push(v.ready
    ? `1. \`add-project\` traces the siteplan + floor plans → \`project_geometry\`.\n2. Phase-2 vastu gate: confirm facings + room plates.\n3. Render-preview loop → **founder gate (Step 3)**.`
    : `Fill the Tier-1 gaps above in the intake row, then re-run Step 1.`);
  return L.join("\n");
}

/* ── CLI ── */
const isMain = fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "");
if (isMain) {
  const slug = process.argv[2];
  if (!slug) { console.error("usage: intake.mjs <slug> [--brief-out <path>]"); process.exit(1); }
  const { intake, source } = resolveIntake(slug);
  console.log(`[intake] source: ${source}`);
  const v = validate(intake);
  const md = brief(intake);
  const outArg = process.argv.indexOf("--brief-out");
  const out = outArg > -1 ? process.argv[outArg + 1]
    : path.join(HERE, "..", "..", "scratchpad", "advisor", `${slug}.brief.md`);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, md + "\n");
  console.log(`[intake] ${slug} → ${v.ready ? "READY ✓" : "BLOCKED ✗ (" + v.missing.length + " Tier-1 gap(s))"}`);
  if (!v.ready) v.missing.forEach((m) => console.log("   ⛔ " + m));
  v.warnings.forEach((w) => console.log("   • " + w));
  console.log(`[intake] brief → ${path.relative(path.join(HERE, "..", ".."), out)}`);
  console.log(`[intake] next status: ${v.ready ? "'ready' (set_intake_status) → generate (Step 2)" : "stay 'draft' until Tier-1 complete"}`);
  process.exit(v.ready ? 0 : 2);
}
