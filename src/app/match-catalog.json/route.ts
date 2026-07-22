/* Build-emitted match catalog: the full live tracked universe as ProjectIntel
   (each carrying its matchInput), so the client-side shortlist can rank the
   REAL projects with the persona match engine. Baked at build, fetched once —
   same static, zero-egress pattern as projects-geo.json. Empty array on an
   unreachable backend → the client falls back to the mock catalog. */
import { buildLiveCatalog } from "@/lib/liveReport";

export const dynamic = "force-static";

export async function GET() {
  const projects = await buildLiveCatalog();
  return Response.json({ projects });
}
