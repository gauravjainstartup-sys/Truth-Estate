import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { PROJECT_INTEL } from "@/lib/projects";
import { DEVELOPERS } from "@/lib/developers";
import { MARKETS } from "@/lib/markets";
import { COMPARE_PAIRS } from "@/lib/compare";

export const dynamic = "force-static";

type Freq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export default function sitemap(): MetadataRoute.Sitemap {
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

  // Dynamic intelligence detail pages
  PROJECT_INTEL.forEach((p) => add(`/intelligence/projects/${p.slug}`, 0.8, "weekly"));
  DEVELOPERS.forEach((d) => add(`/intelligence/developers/${d.slug}`, 0.6, "monthly"));
  MARKETS.forEach((m) => add(`/intelligence/markets/${m.slug}`, 0.6, "monthly"));
  COMPARE_PAIRS.forEach((pair) => add(`/intelligence/compare/${pair}`, 0.4, "monthly"));

  return entries;
}
