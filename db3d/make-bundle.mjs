/* ════════════════════════════════════════════════════════════════
   MAKE BUNDLE — consolidate the extracted pieces into the two
   deliverable files:

     db3d/<slug>.model.json   the whole model as ONE reviewable file —
                              exactly the shape the gated `model` API
                              returns (and a drop-in API fixture)
     db3d/seed-<slug>.sql     idempotent INSERT … ON CONFLICT upserts
                              matching schema.sql — run AFTER schema.sql
                              to load the model into Supabase

   Pipeline (all repeatable):
     1. node db3d/extract-spr.mjs                     geometry pieces
     2. node .claude/skills/extract-intelligence/extract.mjs \
          public/tower-intel/<slug>.html db3d/pieces/intelligence.raw.json
     3. node db3d/reshape-intelligence.mjs            intelligence piece
     4. node db3d/make-bundle.mjs                     ← this file
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from "node:fs";

const SLUG = "signature-global-titanium-spr";
const P = (n) => JSON.parse(readFileSync(`db3d/pieces/${n}.json`, "utf8"));
const site = P("site"), towers = P("towers"), configs = P("configs"), plates = P("plates"),
  floorplans = P("floorplans"), intelligence = P("intelligence"), vastu = P("vastu_rules");

/* ── 1. the single-file model bundle (the gated API's response shape) ── */
const bundle = { generated_at: new Date().toISOString(), slug: SLUG, site, towers, configs, plates, floorplans, intelligence, vastu };
const bundlePath = `db3d/${SLUG}.model.json`;
writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));

/* ── 2. seed.sql — column names match schema.sql exactly ── */
const S = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const N = (v) => (v == null ? "null" : String(v));
const J = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;

const lines = [];
lines.push(`-- ════════════════════════════════════════════════════════════════`);
lines.push(`--  SEED — ${SLUG} 3D model pieces`);
lines.push(`--  Generated ${new Date().toISOString()} by db3d/make-bundle.mjs`);
lines.push(`--  Run AFTER db3d/schema.sql. Idempotent (upserts) — safe to re-run.`);
lines.push(`--  Rows: site 1 · towers ${towers.length} · configs ${configs.length} · plates ${plates.length}`);
lines.push(`--        floorplans ${floorplans.length} · intelligence ${intelligence.length} · vastu_rules 1`);
lines.push(`-- ════════════════════════════════════════════════════════════════`);
lines.push(`begin;`);

// site (camelCase piece → snake_case columns)
lines.push(`\ninsert into project_3d_site (slug,name,latitude_rad,floors,floor_height_m,lobby_height_m,north_cal_rad,sun_benchmark_h,west_weight,sun_ray_len_m,lake,scale_m_per_px,px_origin_x,px_origin_y,boundary_px,amenities) values`);
lines.push(`(${S(site.slug)},${S(site.name)},${N(site.latitudeRad)},${N(site.floors)},${N(site.floorHeightM)},${N(site.lobbyHeightM)},${N(site.northCalRad)},${N(site.sunBenchmarkHours)},${N(site.westWeight)},${N(site.sunRayLenM)},${J(site.lake)},${N(site.scaleMPerPx)},${N(site.pxOriginX)},${N(site.pxOriginY)},${J(site.boundaryPx)},'[]'::jsonb)`);
lines.push(`on conflict (slug) do update set name=excluded.name,latitude_rad=excluded.latitude_rad,floors=excluded.floors,floor_height_m=excluded.floor_height_m,lobby_height_m=excluded.lobby_height_m,north_cal_rad=excluded.north_cal_rad,sun_benchmark_h=excluded.sun_benchmark_h,west_weight=excluded.west_weight,sun_ray_len_m=excluded.sun_ray_len_m,lake=excluded.lake,scale_m_per_px=excluded.scale_m_per_px,px_origin_x=excluded.px_origin_x,px_origin_y=excluded.px_origin_y,boundary_px=excluded.boundary_px,updated_at=now();`);

// towers (piece key `id` → column tower_id)
lines.push(`\ninsert into project_3d_towers (slug,tower_id,x,z,rot,hw,hd,core,cfg) values`);
lines.push(towers.map((t) => `(${S(t.slug)},${S(t.id)},${N(t.x)},${N(t.z)},${N(t.rot)},${N(t.hw)},${N(t.hd)},${N(t.core)},${S(t.cfg)})`).join(",\n"));
lines.push(`on conflict (slug,tower_id) do update set x=excluded.x,z=excluded.z,rot=excluded.rot,hw=excluded.hw,hd=excluded.hd,core=excluded.core,cfg=excluded.cfg;`);

// configs
lines.push(`\ninsert into project_3d_configs (slug,config,beds,baths,saleable,carpet_sqft,balcony_sqft,deck,rooms,extra,col) values`);
lines.push(configs.map((c) => `(${S(c.slug)},${S(c.config)},${N(c.beds)},${N(c.baths)},${N(c.saleable)},${N(c.carpetSqft)},${N(c.balconySqft)},${S(c.deck)},${S(c.rooms)},${S(c.extra)},${S(c.col)})`).join(",\n"));
lines.push(`on conflict (slug,config) do update set beds=excluded.beds,baths=excluded.baths,saleable=excluded.saleable,carpet_sqft=excluded.carpet_sqft,balcony_sqft=excluded.balcony_sqft,deck=excluded.deck,rooms=excluded.rooms,extra=excluded.extra,col=excluded.col;`);

// plates
lines.push(`\ninsert into project_3d_plates (slug,config,offsets) values`);
lines.push(plates.map((p) => `(${S(p.slug)},${S(p.config)},${J(p.offsets)})`).join(",\n"));
lines.push(`on conflict (slug,config) do update set offsets=excluded.offsets;`);

// floorplans (leftover keys beyond the known ones → extra jsonb)
lines.push(`\ninsert into project_3d_floorplans (slug,config,unit,key,iw,ih,walls,extra) values`);
lines.push(floorplans.map((f) => {
  const { slug, config, unit, key, iw, ih, walls, ...rest } = f;
  return `(${S(slug)},${S(config)},${S(unit)},${S(key)},${N(iw)},${N(ih)},${J(walls)},${J(rest)})`;
}).join(",\n"));
lines.push(`on conflict (slug,key) do update set config=excluded.config,unit=excluded.unit,iw=excluded.iw,ih=excluded.ih,walls=excluded.walls,extra=excluded.extra;`);

// intelligence
lines.push(`\ninsert into project_3d_intelligence (slug,tower_id,unit,composite,grade,facing,sub_scores,reasons,flags,metrics) values`);
lines.push(intelligence.map((r) =>
  `(${S(r.slug)},${S(r.tower_id)},${S(r.unit)},${N(r.composite)},${S(r.grade)},${S(r.facing)},${J(r.sub_scores)},${J(r.reasons)},${J(r.flags)},${J(r.metrics)})`,
).join(",\n"));
lines.push(`on conflict (slug,tower_id,unit) do update set composite=excluded.composite,grade=excluded.grade,facing=excluded.facing,sub_scores=excluded.sub_scores,reasons=excluded.reasons,flags=excluded.flags,metrics=excluded.metrics,computed_at=now();`);

// vastu rules (universal singleton)
lines.push(`\ninsert into vastu_rules (id,generic_offsets,direction,room) values`);
lines.push(`(1,${J(vastu.generic_offsets)},${J(vastu.direction)},${J(vastu.room)})`);
lines.push(`on conflict (id) do update set generic_offsets=excluded.generic_offsets,direction=excluded.direction,room=excluded.room,updated_at=now();`);

lines.push(`\ncommit;`);
const seedPath = `db3d/seed-${SLUG}.sql`;
writeFileSync(seedPath, lines.join("\n") + "\n");

const kb = (p) => (readFileSync(p).length / 1024).toFixed(1) + " KB";
console.log(`[make-bundle] ${bundlePath} · ${kb(bundlePath)} — the gated API's full response, one reviewable file`);
console.log(`[make-bundle] ${seedPath} · ${kb(seedPath)} — run after schema.sql; idempotent upserts`);
console.log(`[make-bundle] rows → site 1 · towers ${towers.length} · configs ${configs.length} · plates ${plates.length} · floorplans ${floorplans.length} · intelligence ${intelligence.length} · vastu 1`);
