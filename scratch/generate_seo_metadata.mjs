import fs from "fs";
import { fetchBacklogFull } from "../src/lib/supabase.ts";

async function main() {
  const rows = (await fetchBacklogFull()) ?? [];
  console.log(`Loaded ${rows.length} projects from database.`);

  const sample = rows.slice(0, 5).map((r) => ({
    name: r.canonicalName,
    developer: r.developerName,
    market: r.microMarket,
    sector: r.sector,
    score: r.truthScore,
    minPrice: r.minPriceCr,
    maxPrice: r.maxPriceCr,
    typologies: r.typologies,
    oldTitle: `${r.canonicalName} — Project Intelligence | Truth Estate`,
    oldDesc: `Independent read on ${r.canonicalName} by ${r.developerName} — Truth Score ${r.truthScore ?? "N/A"}/100: delivery risk, construction pace, legal and financial signals from RERA filings and public records.`,
  }));

  console.log("Sample rows:", JSON.stringify(sample, null, 2));
}

main().catch(console.error);
