/* Intake proof — run: node db3d/intake/test-intake.mjs
   Drives the Step-1 fetch/validate/brief against the on-disk fixtures,
   and proves a missing Tier-1 field is caught (the whole point of the
   gate: no generation on an incomplete brief). */
import { readdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadIntake, validate, resolveSite, brief, SITE_DEFAULTS } from "./intake.mjs";
import { mapFeedRow, loadFeed, NORTH_DEFAULT_DEG, SCALE_DEFAULT_M_PER_PX } from "./feed.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS = readdirSync(path.join(HERE, "projects"))
  .filter((d) => existsSync(path.join(HERE, "projects", d, "intake.json")));
const loadFeedRaw = (slug = "elan-the-emperor") => JSON.parse(readFileSync(path.join(HERE, "feed", `${slug}.feed.json`), "utf8"));

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

// 5. FEED path — the project_input_feed view → contract, with the two defaults
const feedC = loadFeed("elan-the-emperor");
const fv = validate(feedC);
ok("feed: elan-the-emperor maps → ready", fv.ready, fv.missing);
ok("feed: slug derived from project_name", feedC.slug === "elan-the-emperor", feedC.slug);
ok("feed: latitude carried", feedC.latitude_deg === 28.501491, feedC.latitude_deg);
ok("feed: floors from no_of_floors (G+38)", feedC.floors === 38, feedC.floors);
ok("feed: true-north DEFAULTED to 0 (view null)", feedC.north_offset_deg === NORTH_DEFAULT_DEG && feedC.__provenance.northDefaulted, feedC.north_offset_deg);
ok("feed: scale DEFAULTED to 0.45 (view null)", feedC.scale_m_per_px === SCALE_DEFAULT_M_PER_PX && feedC.__provenance.scaleDefaulted, feedC.scale_m_per_px);
ok("feed: configs deduped by bhk_type (4 & 5 BHK)", feedC.configs.length === 2 && feedC.configs.map((c) => c.config).sort().join(",") === "4 BHK,5 BHK", feedC.configs.map((c) => c.config));
ok("feed: beds parsed from bhk_type", feedC.configs.find((c) => c.config === "4 BHK").beds === 4 && feedC.configs.find((c) => c.config === "5 BHK").beds === 5);
ok("feed: carpet/super areas carried", feedC.configs.find((c) => c.config === "5 BHK").carpetSqft === 3056 && feedC.configs.find((c) => c.config === "5 BHK").superSqft === 5891);
ok("feed: 5 floor-plan urls (one per tower/config row)", feedC.floorplan_urls.length === 5, feedC.floorplan_urls.length);
ok("feed: siteplan from uploaded_assets", /site-map/.test(feedC.siteplan_url || ""), feedC.siteplan_url);
ok("feed: configByTower has all 5 towers", Object.keys(feedC.tower_hints.configByTower).length === 5, feedC.tower_hints.configByTower);
ok("feed: brief flags source + defaults", /project_input_feed/.test(brief(feedC)) && /default/.test(brief(feedC)));

// 6. FEED overrides — an explicit north/scale beats both the view and the default
const ovr = mapFeedRow(JSON.parse(JSON.stringify(loadFeedRaw())), { north_offset_deg: 25, scale_m_per_px: 0.55 });
ok("feed override: north 25 wins over default", ovr.north_offset_deg === 25 && !ovr.__provenance.northDefaulted, ovr.north_offset_deg);
ok("feed override: scale 0.55 wins over default", ovr.scale_m_per_px === 0.55 && !ovr.__provenance.scaleDefaulted, ovr.scale_m_per_px);

// 7. FEED with a value present in the view → used, not defaulted
const withNorth = mapFeedRow({ ...loadFeedRaw(), true_north_offset_deg: 12 });
ok("feed: view-provided north used (not defaulted)", withNorth.north_offset_deg === 12 && !withNorth.__provenance.northDefaulted, withNorth.north_offset_deg);

console.log(`\n${fail ? "✗" : "✓"} ${pass}/${pass + fail} intake checks passed`);
process.exit(fail ? 1 : 0);
