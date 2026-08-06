import { fetchBacklogFull } from "../src/lib/supabase.ts";

async function main() {
  const rows = (await fetchBacklogFull()) ?? [];
  console.log("Total rows:", rows.length);
  const sample = rows.slice(0, 5).map((r) => ({
    seoSlug: r.seoSlug,
    projectName: r.projectName ?? r.name ?? r.title ?? r.project_name,
    developerName: r.developerName ?? r.developer_name ?? r.developer,
    truthScore: r.truthScore ?? r.score,
    microMarket: r.microMarket ?? r.market,
    sector: r.sector,
    minPriceCr: r.minPriceCr ?? r.roiCostCr,
    maxPriceCr: r.maxPriceCr,
  }));
  console.log("Sample extracted fields:", sample);
}

main().catch(console.error);
