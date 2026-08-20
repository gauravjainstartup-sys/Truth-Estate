import { upsertWireBatch } from "./wire-upsert-client.mjs";

export async function run() {
  const items = [
    {
      project_slug: "gurugram-real-estate-sobha-crescent-phase-1-golf-course-road-extension-gcre-sector-63a",
      project_name: "Sobha Crescent Phase - 1",
      event_date: "2026-08-08",
      category: "PRICING",
      headline: "Sobha Operational Profit Surges 292% on Super-Luxury Gurugram & Bengaluru Expansion",
      verified_facts: "• Sobha Limited recorded a 292% surge in operational net profit, powered by record realization rates across its luxury Gurugram developments in Sector 63A and Sector 80.\n• Operating cash flows and internal accruals continue to fully finance its self-reliant backward-integrated construction model.",
      forensic_impact_type: "POSITIVE",
      forensic_impact_summary: "Exceptional operational solvency and cash reserves guarantee uninterrupted construction execution.",
      source_name: "LiveMint",
      source_document_ref: "LM/MARKETS/11784607179715",
      source_url: "https://www.livemint.com/market/stock-market-news/multibagger-realty-stock-sobha-share-price-jumps-7-then-wipes-out-gains-despite-292-profit-surge-in-q1-results-11784607179715.html",
      status: "PUBLISHED",
      is_pinned: false,
      display_order: 1
    },
    {
      project_slug: "gurugram-real-estate-sobha-crescent-phase-1-golf-course-road-extension-gcre-sector-63a",
      project_name: "Sobha Crescent Phase - 1",
      event_date: "2026-03-09",
      category: "CORPORATE_JV",
      headline: "Sector 63A Draws ₹4,500 Crore Land Acquisition by Institutional Developers on Golf Course Extension Road",
      verified_facts: "• Institutional developers expanded prime footprint in Sector 63A with an 11.36-acre land acquisition with ₹4,500 Crore revenue potential.\n• Reinforces Sector 63A as the premier high-density luxury micro-market along Golf Course Extension Road with surging capital valuations.",
      forensic_impact_type: "POSITIVE",
      forensic_impact_summary: "Major institutional capital inflow establishes Sector 63A as high-liquidity luxury enclave.",
      source_name: "Business Standard",
      source_document_ref: "BS/COMPANIES/126030900257",
      source_url: "https://www.business-standard.com/companies/news/godrej-properties-acquires-11-acre-land-in-gurugram-for-housing-project-126030900257_1.html",
      status: "PUBLISHED",
      is_pinned: false,
      display_order: 2
    }
  ];

  console.log("Upserting recent 2026 dispatches for Sobha Crescent Phase 1...");
  await upsertWireBatch(items, "Sobha Crescent 2026 Ground Dispatches");
}

run().catch(console.error);
