/* ════════════════════════════════════════════════════════════════
   OMNI INDEX BUILDER — server-side, build-time only.

   One builder, two consumers: the /intelligence page (renders the
   workspace from it) and the /omni-index.json route (publishes it as
   a static file so the omni-router Edge Function reasons over the
   EXACT index the page renders — no second source of truth).

   Sources, in order: live backlog view → curated desk fallback; the
   modelled TOWER_INTEL projects are guaranteed present either way.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fetchBacklogFull } from "@/lib/supabase";
import { PROJECTS } from "@/lib/journey";
import { projectSlug, TOWER_INTEL } from "@/lib/projects";
import type { OmniIndex, OmniProject, OmniUnit } from "@/lib/omni";

/* founder-confirmed site coordinates of the modelled projects (same set as
   the projects map — no guessed pins) */
const COORDS: Record<string, { lat: number; lng: number }> = {
  "m3m-residences-by-elie-saab": { lat: 28.523491, lng: 77.030529 },
  "elan-the-presidential": { lat: 28.502307, lng: 77.001726 },
  "elan-the-emperor": { lat: 28.501491, lng: 77.001726 },
  "birla-arika": { lat: 28.450497, lng: 77.046439 },
  "puri-the-aravallis": { lat: 28.4125, lng: 77.0835 },
};

const tiSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const ADVISORS: Record<string, string> = Object.fromEntries(
  Object.entries(TOWER_INTEL).map(([name, meta]) => [tiSlug(name), meta.file]),
);

/* per-line intelligence extracted by the tower-intel pipeline — committed
   under db3d/projects/<slug>/pieces; read once at build time, top lines only */
function loadUnits(): Record<string, OmniUnit[]> {
  const root = path.join(process.cwd(), "db3d", "projects");
  const out: Record<string, OmniUnit[]> = {};
  if (!existsSync(root)) return out;
  for (const dir of readdirSync(root)) {
    const f = path.join(root, dir, "pieces", "intelligence.json");
    if (!existsSync(f)) continue;
    try {
      const rows = JSON.parse(readFileSync(f, "utf8")) as {
        tower_id: string; unit: string; composite: number; grade: string; facing: string;
        sub_scores?: { vastu?: number; view?: number };
        metrics?: { sun_winter_h?: number };
      }[];
      out[dir] = [...rows]
        .sort((a, b) => b.composite - a.composite)
        .slice(0, 4)
        .map((r) => ({
          tower: r.tower_id,
          unit: r.unit,
          config: "",
          score: r.composite,
          grade: r.grade,
          facing: r.facing,
          sunWinterH: r.metrics?.sun_winter_h != null ? +r.metrics.sun_winter_h.toFixed(1) : null,
          vastu: r.sub_scores?.vastu ?? null,
          view: r.sub_scores?.view ?? null,
        }));
    } catch {
      /* a malformed pieces file never blanks the page */
    }
  }
  return out;
}

const yearOf = (s: string | null | undefined): number | null => {
  const m = /20\d\d/.exec(s ?? "");
  return m ? parseInt(m[0], 10) : null;
};

/* the modelled projects must exist in the index whatever the data source —
   unit-level asks ("which flat in …") resolve against them */
function ensureModelled(projects: OmniProject[]): OmniProject[] {
  const have = new Set(projects.map((p) => p.slug));
  for (const [name, meta] of Object.entries(TOWER_INTEL)) {
    const slug = tiSlug(name);
    if (have.has(slug)) continue;
    projects.push({
      slug, name,
      developer: null, location: null, score: null, minPriceCr: null, minBhk: null,
      config: null, deliveryYear: null, redFlags: null, delayRisk: null,
      has3D: true, advisorFile: meta.file,
      lat: COORDS[slug]?.lat ?? null, lng: COORDS[slug]?.lng ?? null,
    });
  }
  return projects;
}

export async function buildIndex(): Promise<OmniIndex> {
  const units = loadUnits();
  const rows = await fetchBacklogFull();
  if (rows && rows.length) {
    const projects: OmniProject[] = rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      developer: r.developer,
      location: [r.location, r.microMarket].filter(Boolean).join(" · ") || null,
      score: r.truthScore,
      minPriceCr: r.minPriceCr,
      minBhk: r.minBhk,
      config: r.config,
      deliveryYear: yearOf(r.deliveryYear) ?? yearOf(r.predicted),
      redFlags: r.redFlags,
      delayRisk: r.delayRisk,
      has3D: !!ADVISORS[r.slug],
      advisorFile: ADVISORS[r.slug] ?? null,
      lat: COORDS[r.slug]?.lat ?? null,
      lng: COORDS[r.slug]?.lng ?? null,
    }));
    return { projects: ensureModelled(projects), units, live: true };
  }
  // fail-soft: the curated desk set keeps the omnibox working without the view
  const projects: OmniProject[] = PROJECTS.map((p) => {
    const slug = projectSlug(p.name);
    return {
      slug,
      name: p.name,
      developer: p.developer ?? null,
      location: p.market ?? null,
      score: p.truthScore ?? null,
      minPriceCr: p.budget?.[0] ?? null,
      minBhk: null,
      config: p.configs?.join(" | ") ?? null,
      deliveryYear: null,
      redFlags: null,
      delayRisk: null,
      has3D: !!ADVISORS[slug],
      advisorFile: ADVISORS[slug] ?? null,
      lat: COORDS[slug]?.lat ?? null,
      lng: COORDS[slug]?.lng ?? null,
    };
  });
  return { projects: ensureModelled(projects), units, live: false };
}
