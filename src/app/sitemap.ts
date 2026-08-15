import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { DEVELOPERS } from "@/lib/developers";
import { MARKETS } from "@/lib/markets";
import { BEST_PROJECTS } from "@/lib/bestProjects";
import { fetchBacklogFull, fetchExtendedDetails, type LiveBacklogFull } from "@/lib/supabase";
import { INDEXABLE_COMPARE_PAIRS } from "@/app/intelligence/compare/[pair]/page";

export const dynamic = "force-static";

type Freq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

function projectDate(r: LiveBacklogFull, extMap?: Record<string, any> | null): Date {
  const dates: number[] = [];
  if (r.lastQprDate) { const t = new Date(r.lastQprDate).getTime(); if (!isNaN(t)) dates.push(t); }
  if (r.legalLastUpdated) { const t = new Date(r.legalLastUpdated).getTime(); if (!isNaN(t)) dates.push(t); }
  if (r.locationLastUpdated) { const t = new Date(r.locationLastUpdated).getTime(); if (!isNaN(t)) dates.push(t); }
  const extHero = extMap?.[r.id]?.heroDate;
  if (extHero) { const t = new Date(extHero).getTime(); if (!isNaN(t)) dates.push(t); }
  if (dates.length > 0) return new Date(Math.max(...dates));
  return new Date("2026-08-14T00:00:00.000Z");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, priority: number, changeFrequency: Freq = "monthly", lastMod: Date = now) =>
    entries.push({ url: `${SITE_URL}${path}`, lastModified: lastMod, changeFrequency, priority });

  // Core pages
  add("/", 1.0, "weekly");
  add("/nri", 0.9, "monthly");
  add("/the-record", 0.8, "monthly");
  add("/intelligence", 0.9, "weekly");
  add("/premiumbuyeroffice", 0.8, "monthly");
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
  const [rows, ext] = await Promise.all([fetchBacklogFull(), fetchExtendedDetails()]);
  const rowList = rows ?? [];
  rowList.forEach((r) => {
    if (r.seoSlug) {
      add(`/projects/${r.seoSlug}`, 0.8, "weekly", projectDate(r, ext));
    }
  });

  DEVELOPERS.forEach((d) => add(`/intelligence/developers/${d.slug}`, 0.6, "monthly"));
  MARKETS.forEach((m) => add(`/intelligence/markets/${m.slug}`, 0.6, "monthly"));

  // Compare pages: ONLY demand-proven indexable pairs
  INDEXABLE_COMPARE_PAIRS.forEach((pair) => add(`/intelligence/compare/${pair}`, 0.5, "monthly"));

  return entries;
}
