/* Build-emitted geo layer for the street map: every live project that has
   coordinates (from the pipeline or the build-time geocode enrichment).
   The report's OSM map fetches this once to plot "other live projects"
   around the subject property. */
import { fetchBacklogFull } from "@/lib/supabase";

export const dynamic = "force-static";

type G = { n: string; s: string; lat: number; lng: number; ts?: number; m?: string };

export async function GET() {
  const out: G[] = [];
  for (const r of (await fetchBacklogFull()) ?? []) {
    if (r.latitude == null || r.longitude == null) continue;
    if (Math.abs(r.latitude) > 90 || Math.abs(r.longitude) > 180 || (r.latitude === 0 && r.longitude === 0)) continue;
    if (out.some((e) => e.s === r.slug)) continue;
    out.push({
      n: r.name,
      s: r.slug,
      lat: r.latitude,
      lng: r.longitude,
      ...(r.truthScore != null ? { ts: r.truthScore } : {}),
      ...(r.microMarket ? { m: r.microMarket } : {}),
    });
  }
  return Response.json({ projects: out });
}
