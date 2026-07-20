/* Build-emitted match catalog: the full live tracked universe adapted onto
   ProjectIntel, so the client-side shortlist can rank the REAL projects
   (backlog_listing_public) instead of the hand-curated mock set. Baked at
   build time and fetched once by the shortlist — same static, zero-egress
   pattern as projects-geo.json. If the backend is unreachable at build the
   array is empty and the client falls back to the mock catalog. */
import { fetchBacklogFull, fetchCorridorPsf } from "@/lib/supabase";
import { liveProjectIntel } from "@/lib/liveReport";
import type { ProjectIntel } from "@/lib/projects";

export const dynamic = "force-static";

export async function GET() {
  const [rows, corridorPsf] = await Promise.all([fetchBacklogFull(), fetchCorridorPsf()]);
  const seen = new Set<string>();
  const projects: ProjectIntel[] = [];
  for (const r of rows ?? []) {
    const intel = liveProjectIntel(r, null, null, corridorPsf);
    if (!intel.slug || seen.has(intel.slug)) continue; // de-dupe on slug
    seen.add(intel.slug);
    projects.push(intel);
  }
  return Response.json({ projects });
}
