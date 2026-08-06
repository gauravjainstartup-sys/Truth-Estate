import fs from "fs";
import path from "path";

// Read live production sitemap content
const liveContent = fs.readFileSync(
  "/Users/gj/.gemini/antigravity/brain/33182201-aa57-47d1-b541-827b0c56d34b/.system_generated/steps/833/content.md",
  "utf-8"
);

// Extract all <loc> URLs from live sitemap XML
const locMatches = [...liveContent.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)];
const liveUrls = locMatches.map((m) => m[1].trim());

console.log(`Extracted ${liveUrls.length} live URLs from production sitemap.xml`);

// Normalize URLs to relative paths (e.g. /projects/...)
const livePaths = liveUrls.map((u) => {
  const urlObj = new URL(u);
  return urlObj.pathname;
});

// Group live paths by route category
const liveCategories = {
  core: [],
  bestProjects: [],
  developers: [],
  projects: [],
  compare: [],
  other: [],
};

for (const p of livePaths) {
  if (p === "/" || p === "/about" || p === "/methodology" || p === "/contact" || p === "/privacy" || p === "/terms" || p === "/disclaimer") {
    liveCategories.core.push(p);
  } else if (p.startsWith("/best-projects/")) {
    liveCategories.bestProjects.push(p);
  } else if (p.startsWith("/developers/")) {
    liveCategories.developers.push(p);
  } else if (p.startsWith("/projects/")) {
    liveCategories.projects.push(p);
  } else if (p.startsWith("/compare/")) {
    liveCategories.compare.push(p);
  } else {
    liveCategories.other.push(p);
  }
}

console.log("\nLive Production Sitemap Categories Breakdown:");
for (const [k, v] of Object.entries(liveCategories)) {
  console.log(`- ${k}: ${v.length} URLs`);
}

// Write the parsed live paths to scratch/live_sitemap_paths.json
fs.writeFileSync(
  "/Users/gj/.gemini/antigravity/brain/33182201-aa57-47d1-b541-827b0c56d34b/scratch/live_sitemap_paths.json",
  JSON.stringify(livePaths, null, 2)
);
