/* ════════════════════════════════════════════════════════════════
   RESHAPE INTELLIGENCE — map the headless extractor's rich per-flat
   output into project_3d_intelligence row shape (the pre-computed
   piece). The scoring engine stays server-side; only these results
   ship to the client.

   Pipeline:
     1) node .claude/skills/extract-intelligence/extract.mjs \
          public/tower-intel/<slug>.html  db3d/pieces/intelligence.raw.json
     2) node db3d/reshape-intelligence.mjs         (this file)

   Tower ranking + weights are intentionally NOT stored: ranking is a
   trivial client-side sort of the per-flat scores, and weights only
   fed the sub-scores, which are already computed. Nothing project-IP
   is left to derive.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, rmSync } from "node:fs";

const SLUG = process.argv[2];
if (!SLUG) { console.error("usage: reshape-intelligence.mjs <slug>"); process.exit(1); }
const RAW = `db3d/projects/${SLUG}/pieces/intelligence.raw.json`;
const OUT = `db3d/projects/${SLUG}/pieces/intelligence.json`;

const doc = JSON.parse(readFileSync(RAW, "utf8"));
if (doc.source && !doc.source.includes(SLUG)) throw new Error(`raw is for ${doc.source}, not ${SLUG}`);

const rows = doc.flats.map((f) => ({
  slug: SLUG,
  tower_id: f.tower,
  unit: f.unit,
  composite: f.score,
  grade: f.grade,
  facing: f.facing,
  sub_scores: { morning: f.morning, cool: f.cool, vastu: f.vastu, view: f.view, airflow: f.airflow, floor: f.floor_score },
  reasons: { overall: f.vastu_overall, rooms: f.vastu_rooms },
  flags: { lake: !!f.is_lake, corner: !!f.is_corner },
  metrics: { sun_winter_h: f.sun_winter_h, sun_am_h: f.sun_am_h, sun_pm_h: f.sun_pm_h, rank: f.rank, weakest_dim: f.weakest_dim },
}));

writeFileSync(OUT, JSON.stringify(rows, null, 2));
rmSync(RAW, { force: true }); // pieces/ holds only final DB pieces

// ── verification ──
const B = (o) => Buffer.byteLength(JSON.stringify(o));
const byGrade = rows.reduce((m, r) => ((m[r.grade] = (m[r.grade] || 0) + 1), m), {});
const ranked = [...rows].sort((a, b) => b.composite - a.composite);
console.log(`intelligence  ${rows.length} flats · ${B(rows)}B (pre-computed — scoring engine never ships)`);
console.log(`  grades: ${Object.entries(byGrade).map(([g, n]) => `${g}:${n}`).join(" ")}`);
console.log(`  top 3:  ${ranked.slice(0, 3).map((r) => `${r.tower_id}/${r.unit} ${r.grade}(${r.composite})`).join(" · ")}`);
console.log(`  each row: composite, grade, facing, 6 sub-scores, ${Object.keys(rows[0].reasons.rooms).length} vastu rooms, flags, metrics`);
