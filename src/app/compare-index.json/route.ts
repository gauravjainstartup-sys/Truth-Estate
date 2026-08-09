/* Build-emitted compare index: slug → full ProjectIntel for every scored
   project. Written once per deploy (like /search-index.json). The compare
   picker offers all scored projects; pairs outside the prerendered set are
   rendered on /intelligence/compare/live, which fetches this on first use.
   Same build snapshot the prerendered pairs use, so both read identically. */
import { buildScoredProjectIntel } from "@/lib/compareData";

export const dynamic = "force-static";

export async function GET() {
  const bySlug = await buildScoredProjectIntel();
  return Response.json(bySlug);
}
