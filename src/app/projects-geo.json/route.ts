/* Build-emitted geo layer for the street map: every live project that has
   coordinates (from the pipeline or the build-time geocode enrichment).
   The report's OSM map fetches this once to plot "other live projects"
   around the subject property. */
import { fetchBacklogFull } from "@/lib/supabase";
import { TOWER_INTEL, tiSlug } from "@/lib/projects";

export const dynamic = "force-static";

/* `q` is the SEO slug — the report's public address.
   Without it the map's popup had only the internal slug, so projectHref()
   took its legacy fallback and both CTAs pointed at /intelligence/projects/
   <slug>: a noindex redirect stub, one extra hop, and no link equity. The
   feed is the only thing the map has, so the address has to travel in it. */
type G = { n: string; s: string; q?: string; lat: number; lng: number; ts?: number; m?: string; pv?: string; d3?: number };

export async function GET() {
  // 3D-enabled = has a Sun & Vastu advisor in the registry; drives the gold
  // sun pins (conversion tier) on the report street maps
  const d3Slugs = new Set(Object.keys(TOWER_INTEL).map(tiSlug));
  const out: G[] = [];
  for (const r of (await fetchBacklogFull()) ?? []) {
    if (r.latitude == null || r.longitude == null) continue;
    if (Math.abs(r.latitude) > 90 || Math.abs(r.longitude) > 180 || (r.latitude === 0 && r.longitude === 0)) continue;
    if (r.geoProvenance === "suspect") continue; // audit gate: never plot a centre that contradicts its own POI distances
    if (out.some((e) => e.s === r.slug)) continue;
    out.push({
      n: r.name,
      s: r.slug,
      ...(r.seoSlug ? { q: r.seoSlug } : {}),
      lat: r.latitude,
      lng: r.longitude,
      ...(r.truthScore != null ? { ts: r.truthScore } : {}),
      ...(r.microMarket ? { m: r.microMarket } : {}),
      ...(r.geoProvenance ? { pv: r.geoProvenance } : {}),
      ...(d3Slugs.has(r.slug) || d3Slugs.has(tiSlug(r.name)) ? { d3: 1 } : {}),
    });
  }
  return Response.json({ projects: out });
}
