import fs from "fs";
import { fetchBacklogFull } from "../src/lib/supabase.ts";

async function main() {
  const rows = (await fetchBacklogFull()) ?? [];
  console.log(`Processing ${rows.length} projects...`);

  const results = rows.map((r, i) => {
    const proj = r.projectName || "Project";
    const dev = r.developerName || "Developer";
    const score = r.truthScore;
    const market = r.microMarket || "";
    const minPrice = r.minPriceCr;
    const priceStr = minPrice ? `₹${minPrice} Cr+` : "";
    const scoreStr = score ? `Truth Score ${score}` : "";

    const oldTitle = `${proj} — Project Intelligence | Truth Estate`;
    const oldDesc = `Independent read on ${proj} by ${dev} — Truth Score ${score ?? "N/A"}/100: delivery risk, construction pace, legal and financial signals from RERA filings and public records.`;

    return {
      index: i + 1,
      seoSlug: r.seoSlug,
      projectName: proj,
      developerName: dev,
      truthScore: score,
      microMarket: market,
      minPriceCr: minPrice,
      oldTitle,
      oldDesc,
    };
  });

  fs.writeFileSync(
    "/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/projects_raw_for_seo.json",
    JSON.stringify(results, null, 2)
  );
  console.log("Raw project metadata dumped for SEO generation.");
}

main().catch(console.error);
