import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { resolveDevelopers } from "@/lib/developersLive";
import { MARKETS } from "@/lib/markets";
import { BEST_PROJECTS } from "@/lib/bestProjects";
import { INDEXABLE_COMPARE_PAIRS } from "@/lib/indexableCompares";
import { resolvableProjectPairs } from "@/lib/compare";
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
  add("/sun-vastu", 0.7, "monthly");
  add("/deal-room", 0.8, "weekly");
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
  /* EVERY developer we render a page for — curated dossiers AND the
     filings-computed profiles (Signature Global, Sobha, Eldeco, …). This used
     to list only the curated registry, so 12 of 19 live developer pages were
     built and indexable but never submitted to Google. resolveDevelopers() is
     the same source generateStaticParams uses, so the sitemap can't drift from
     the pages again. */
  (await resolveDevelopers()).forEach((d) => add(`/intelligence/developers/${d.slug}`, 0.6, "monthly"));
  MARKETS.forEach((m) => add(`/intelligence/markets/${m.slug}`, 0.6, "monthly"));
  /* Compare pairs: only the demand-proven allowlist is listed. The full
     combinatorial /intelligence/compare/<pair> set stays noindex + out of the
     sitemap (near-duplicates Google collapses — see the pair route); but the
     pairs that already earned search impressions (INDEXABLE_COMPARE_PAIRS) are
     index:true, so they belong here. Sitemapping only the indexable ones avoids
     the "submitted URL marked noindex" contradiction. The compare HUB
     (/intelligence/compare, added above) is indexable and remains. */
  /* Only the demand pairs that resolve to two real projects in THIS build —
     the same predicate the compare route prerenders with — so the sitemap can
     never list a pair that wasn't built (the deploy regenerates redirects.conf
     from the sitemap and rejects a 301 whose target 404s). */
  resolvableProjectPairs(INDEXABLE_COMPARE_PAIRS, rows.map((r) => r.slug))
    .forEach((pair) => add(`/intelligence/compare/${pair}`, 0.5, "monthly"));

  return entries;
}
