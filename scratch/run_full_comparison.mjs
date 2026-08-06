import fs from "fs";
import { fetchBacklogFull } from "../src/lib/supabase.ts";
import { DEVELOPERS } from "../src/lib/developers.ts";
import { MARKETS } from "../src/lib/markets.ts";
import { DEV_PAIRS, MARKET_PAIRS, scoredProjectOptions, projectComparePairs } from "../src/lib/compare.ts";
import { BEST_PROJECTS } from "../src/lib/bestProjects.ts";

async function compare() {
  const livePaths = JSON.parse(
    fs.readFileSync(
      "/Users/gj/.gemini/antigravity/brain/33182201-aa57-47d1-b541-827b0c56d34b/scratch/live_sitemap_paths.json",
      "utf-8"
    )
  );

  const liveSet = new Set(livePaths);

  // Build new codebase URLs
  const newPaths = [];
  const add = (p) => newPaths.push(p);

  // Core
  add("/");
  add("/nri");
  add("/the-record");
  add("/intelligence");
  add("/pricing");
  add("/methodology");
  add("/about");
  add("/vision");
  add("/data-sources");
  add("/privacy");
  add("/terms");
  add("/disclaimer");

  // Hubs
  add("/intelligence/projects");
  add("/intelligence/developers");
  add("/intelligence/markets");
  add("/intelligence/compare");

  // best-projects
  BEST_PROJECTS.forEach((p) => add(`/best-projects/${p.slug}`));

  // Dynamic projects
  const rows = (await fetchBacklogFull()) ?? [];
  rows.forEach((r) => add(`/projects/${r.seoSlug}`));

  // Developers & Markets
  DEVELOPERS.forEach((d) => add(`/intelligence/developers/${d.slug}`));
  MARKETS.forEach((m) => add(`/intelligence/markets/${m.slug}`));

  // Compare pairs
  const projectPairs = projectComparePairs(scoredProjectOptions(rows));
  [...projectPairs, ...DEV_PAIRS, ...MARKET_PAIRS].forEach((pair) =>
    add(`/intelligence/compare/${pair}`)
  );

  const newSet = new Set(newPaths);

  console.log(`Live Sitemap URLs: ${livePaths.length}`);
  console.log(`New Codebase URLs: ${newPaths.length}`);

  // Find exact matches
  const exactMatches = livePaths.filter((p) => newSet.has(p));
  console.log(`\nExact Path Matches: ${exactMatches.length}`);

  // Find live URLs missing or modified in new codebase
  const missingFromNew = livePaths.filter((p) => !newSet.has(p));
  console.log(`Live URLs not directly matching new paths: ${missingFromNew.length}`);

  // Categorize missing URLs
  const missingDevs = missingFromNew.filter((p) => p.startsWith("/developers/"));
  const missingProjects = missingFromNew.filter((p) => p.startsWith("/projects/"));
  const missingCompare = missingFromNew.filter((p) => p.startsWith("/compare/"));
  const missingCore = missingFromNew.filter(
    (p) => !p.startsWith("/developers/") && !p.startsWith("/projects/") && !p.startsWith("/compare/")
  );

  console.log(`\nMissing / Changed breakdown:`);
  console.log(`- Core/Other: ${missingCore.length} (${missingCore.join(", ")})`);
  console.log(`- Developer Reviews: ${missingDevs.length}`);
  console.log(`- Projects: ${missingProjects.length}`);
  console.log(`- Compare Pairs: ${missingCompare.length}`);

  // Find new URLs not in live sitemap
  const newNotInLive = newPaths.filter((p) => !liveSet.has(p));
  console.log(`\nNew URLs introduced in new codebase: ${newNotInLive.length}`);

  // Write detailed audit JSONs
  fs.writeFileSync(
    "/Users/gj/.gemini/antigravity/brain/33182201-aa57-47d1-b541-827b0c56d34b/scratch/seo_audit_missing.json",
    JSON.stringify(
      {
        missingCore,
        missingDevs,
        missingProjects,
        sampleCompareMissing: missingCompare.slice(0, 20),
        sampleNewPaths: newNotInLive.slice(0, 20),
      },
      null,
      2
    )
  );
}

compare().catch(console.error);
