/* Intake proof — run: node db3d/intake/test-intake.mjs
   Drives the Step-1 fetch/validate/brief against the on-disk fixtures,
   and proves a missing Tier-1 field is caught (the whole point of the
   gate: no generation on an incomplete brief). */
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadIntake, validate, resolveSite, brief, SITE_DEFAULTS } from "./intake.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS = readdirSync(path.join(HERE, "projects"))
  .filter((d) => existsSync(path.join(HERE, "projects", d, "intake.json")));

let pass = 0, fail = 0;
const ok = (name, cond, got) => { (cond ? pass++ : fail++); console.log(`${cond ? "✓" : "✗ FAIL"}  ${name}${cond ? "" : "  → got " + JSON.stringify(got)}`); };

ok("at least one intake fixture on disk", PROJECTS.length > 0, PROJECTS);

// 1. every fixture present validates READY (a complete brief) + round-trips
for (const slug of PROJECTS) {
  const intake = loadIntake(slug);
  const v = validate(intake);
  ok(`${slug}: Tier-1 complete → ready`, v.ready, v.missing);
  ok(`${slug}: brief renders + names the project`, brief(intake).includes(intake.name));
}

// 2. Emperor specifics — the backfill carries the real known facts
const emp = loadIntake("elan-the-emperor");
const site = resolveSite(emp);
ok("emperor: latitude 28.501491", site.latitudeDeg === 28.501491, site.latitudeDeg);
ok("emperor: G+38", site.floors === 38, site.floors);
ok("emperor: scale 0.45 m/px", site.scaleMPerPx === 0.45, site.scaleMPerPx);
ok("emperor: 2 configs (4 & 5 BHK)", emp.configs.length === 2 && emp.configs.every((c) => /BHK/.test(c.config)));
ok("emperor: Tier-2 defaults applied (floor 3.6 m)", site.floor_height_m === SITE_DEFAULTS.floor_height_m, site.floor_height_m);
ok("emperor: every config has a floor-plan image", emp.configs.every((c) => emp.floorplan_urls.some((f) => f.config === c.config)));

// 3. the gate has teeth — drop a Tier-1 field and a per-config plan, expect BLOCKED
const broken = structuredClone(emp);
delete broken.north_offset_deg;                 // [⚠] sun/vastu-critical
broken.floorplan_urls = broken.floorplan_urls.filter((f) => f.config !== "5 BHK"); // 5 BHK loses its plans
const bv = validate(broken);
ok("missing north_offset → BLOCKED", !bv.ready);
ok("missing north_offset flagged", bv.missing.some((m) => m.startsWith("north_offset_deg")), bv.missing);
ok("5 BHK w/o floor plan flagged", bv.missing.some((m) => m.includes('config "5 BHK"')), bv.missing);
ok("brief marks BLOCKED", /BLOCKED/.test(brief(broken)));

// 4. empty intake → many gaps, never ready
const ev = validate({ slug: "x", name: "" });
ok("empty intake → not ready, multiple gaps", !ev.ready && ev.missing.length >= 6, ev.missing.length);

console.log(`\n${fail ? "✗" : "✓"} ${pass}/${pass + fail} intake checks passed`);
process.exit(fail ? 1 : 0);
