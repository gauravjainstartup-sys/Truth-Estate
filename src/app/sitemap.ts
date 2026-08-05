import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { DEVELOPERS } from "@/lib/developers";
import { MARKETS } from "@/lib/markets";
import { BEST_PROJECTS } from "@/lib/bestProjects";
import { fetchBacklogFull } from "@/lib/supabase";

export const dynamic = "force-static";

type Freq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, priority: number, changeFrequency: Freq = "monthly") =>
    entries.push({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });

  // Core pages
  add("/", 1.0, "weekly");
  add("/nri", 0.9, "monthly");
  add("/the-record", 0.8, "monthly");
  add("/intelligence", 0.9, "weekly");
  add("/pricing", 0.7, "monthly");
  add("/methodology", 0.7, "monthly");
  add("/about", 0.6, "monthly");
  add("/vision", 0.6, "monthly");
  add("/data-sources", 0.5, "monthly");

  // Intelligence hubs
  add("/intelligence/projects", 0.8, "weekly");
  add("/intelligence/developers", 0.7, "weekly");
  add("/intelligence/markets", 0.7, "weekly");
  add("/intelligence/compare", 0.6, "monthly");

  /* The /best-projects/ landing pages. They carry the old site's rankings
     for the queries buyers actually type, so they belong in the sitemap
     at a priority above the hubs they filter — a page answering "under ₹3
     Cr" is a more useful entry point than the catalogue it draws from. */
  BEST_PROJECTS.forEach((p) => add(`/best-projects/${p.slug}`, 0.7, "weekly"));

  // Legal
  add("/privacy", 0.2, "yearly");
  add("/terms", 0.2, "yearly");
  add("/disclaimer", 0.2, "yearly");

  // Dynamic intelligence detail pages. Project pages ARE the tracked
  // pipeline (one URL per v3 row, DB name as source of truth); legacy
  // live-* stubs and the sample dossier stay out of the sitemap.
  const rows = (await fetchBacklogFull()) ?? [];
  /* The PUBLIC address, not the internal id — this file is what Google
     reads, so a mismatch here is the whole migration wasted. */
  rows.forEach((r) => add(`/projects/${r.seoSlug}`, 0.8, "weekly"));
  DEVELOPERS.forEach((d) => add(`/intelligence/developers/${d.slug}`, 0.6, "monthly"));
  MARKETS.forEach((m) => add(`/intelligence/markets/${m.slug}`, 0.6, "monthly"));
  /* Individual /intelligence/compare/<pair> pages are deliberately NOT listed:
     they carry `robots: noindex` (combinatorial near-duplicates — see the pair
     route). Sitemapping a noindexed URL is a contradictory signal Google flags
     as "Submitted URL marked noindex", so they stay out. The compare HUB
     (/intelligence/compare, added above) is indexable and remains. */

  return entries;
}
