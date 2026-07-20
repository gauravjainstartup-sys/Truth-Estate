/* Build-emitted match catalog: the full live tracked universe adapted onto
   ProjectIntel, so the client-side shortlist can rank the REAL projects
   (backlog_listing_public) instead of the hand-curated mock set. Baked at
   build time and fetched once by the shortlist — same static, zero-egress
   pattern as projects-geo.json. If the backend is unreachable at build the
   array is empty and the client falls back to the mock catalog. */
import { fetchBacklogFull, fetchConfigurations, fetchBacklogNameIds, fetchCorridorPsf } from "@/lib/supabase";
import type { LiveConfiguration } from "@/lib/supabase";
import { liveProjectIntel } from "@/lib/liveReport";
import type { ProjectIntel } from "@/lib/projects";

export const dynamic = "force-static";

/* Resolve a row to its per-BHK configurations, tolerating the pipeline's id
   drift (a collapsed duplicate's data may sit under a sibling id, or only be
   findable by name). Mirrors the project detail page's join so the shortlist's
   `configs` carry the SAME real unit types (3 BHK, 4 BHK, penthouse …) the
   report shows — otherwise the catalog only knows the `config` summary string,
   and the configuration must-have in rankCore has nothing to bite on. */
function cfgKey(
  rowId: string,
  name: string,
  table: Record<string, LiveConfiguration[]> | null,
  nameIds: Record<string, string> | null,
  altIds: string[] = [],
): string | null {
  if (!table) return null;
  if (table[rowId] !== undefined) return rowId;
  for (const a of altIds) if (table[a] !== undefined) return a;
  const alt = nameIds?.[name];
  return alt && table[alt] !== undefined ? alt : null;
}

export async function GET() {
  const [rows, cfg, nameIds, corridorPsf] = await Promise.all([
    fetchBacklogFull(),
    fetchConfigurations(),
    fetchBacklogNameIds(),
    fetchCorridorPsf(),
  ]);
  const seen = new Set<string>();
  const projects: ProjectIntel[] = [];
  for (const r of rows ?? []) {
    const key = cfgKey(r.id, r.name, cfg, nameIds, r.altIds);
    const intel = liveProjectIntel(r, null, key ? cfg![key] : null, corridorPsf);
    if (!intel.slug || seen.has(intel.slug)) continue; // de-dupe on slug
    seen.add(intel.slug);
    projects.push(intel);
  }
  return Response.json({ projects });
}
