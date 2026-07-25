import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { DEVELOPERS } from "@/lib/developers";
import { MARKETS } from "@/lib/markets";
import { DEV_PAIRS, MARKET_PAIRS, scoredProjectOptions, projectComparePairs } from "@/lib/compare";
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
  // compare pages: live project pairs (scored set) + curated developer/market pairs
  const projectPairs = projectComparePairs(scoredProjectOptions(rows));
  [...projectPairs, ...DEV_PAIRS, ...MARKET_PAIRS].forEach((pair) => add(`/intelligence/compare/${pair}`, 0.4, "monthly"));

  return entries;
}
