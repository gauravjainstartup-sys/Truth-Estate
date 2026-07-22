/* Build-emitted market context for the match engine: corridor×BHK price
   medians (for the entry-price factor) and corridor centroids (for the
   location-distance factor), computed once over the live corpus. Small +
   static; fetched by the report's MatchScore and the shortlist so both score
   against the same benchmarks. Zero-egress pattern (projects-geo.json). */
import { buildLiveMarket } from "@/lib/liveReport";

export const dynamic = "force-static";

export async function GET() {
  const market = await buildLiveMarket();
  return Response.json(market);
}
