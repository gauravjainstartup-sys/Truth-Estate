/* ════════════════════════════════════════════════════════════════
   BUILD APPLY-ALL — assemble one paste-and-go SQL file that saves the
   whole gated-3D dataset on Supabase, in dependency order:

     1. schema.sql                 tables · RLS · get_model_bundle
     2. intake/schema-intake.sql   project_3d_intake (overrides+status)
     3. per-project seed SQL        the model pieces (all projects)
     4. apply-grants.sql           demo grants + pipeline status

   Output: db3d/apply-all.sql (idempotent; re-run safe). Regenerate
   after adding a project:  node db3d/build-apply-all.mjs

   NOTE: the project_input_feed VIEW is a prerequisite you already
   created; it reads your backlog_* tables and is NOT emitted here.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const rel = (p) => path.relative(HERE, p);
const seeds = readdirSync(path.join(HERE, "projects"))
  .filter((d) => existsSync(path.join(HERE, "projects", d, `seed-${d}.sql`)))
  .sort()
  .map((d) => path.join(HERE, "projects", d, `seed-${d}.sql`));

const parts = [
  { title: "1 · SCHEMA — piece tables · RLS · gated read fn", file: path.join(HERE, "schema.sql") },
  { title: "2 · INTAKE — overrides + status companion table", file: path.join(HERE, "intake", "schema-intake.sql") },
  ...seeds.map((f, i) => ({ title: `3.${i + 1} · SEED — ${path.basename(f)}`, file: f })),
  { title: "4 · GRANTS + STATUS", file: path.join(HERE, "apply-grants.sql") },
];

const banner = (t) =>
  `\n-- ╔══════════════════════════════════════════════════════════════╗\n` +
  `-- ║  ${t.padEnd(60)}║\n` +
  `-- ╚══════════════════════════════════════════════════════════════╝\n`;

let out =
  `-- ════════════════════════════════════════════════════════════════\n` +
  `--  APPLY-ALL — gated 3D dataset for Supabase (GENERATED; do not edit)\n` +
  `--  Regenerate: node db3d/build-apply-all.mjs\n` +
  `--  Paste into the SQL editor, or:  psql "$DB_URL" -f db3d/apply-all.sql\n` +
  `--  Idempotent (create-if-not-exists + upserts) — safe to re-run.\n` +
  `--  Prerequisite you already created: the project_input_feed VIEW.\n` +
  `-- ════════════════════════════════════════════════════════════════\n`;

for (const p of parts) out += banner(p.title) + `-- source: ${rel(p.file)}\n` + readFileSync(p.file, "utf8").replace(/\s*$/, "") + "\n";

const OUT = path.join(HERE, "apply-all.sql");
writeFileSync(OUT, out);
const kb = (Buffer.byteLength(out) / 1024).toFixed(1);
console.log(`[apply-all] ${rel(OUT)} · ${kb} KB · ${parts.length} sections (${seeds.length} seeds)`);
console.log(`[apply-all] order: schema → intake → ${seeds.map((s) => path.basename(path.dirname(s))).join(" → ")} → grants+status`);
