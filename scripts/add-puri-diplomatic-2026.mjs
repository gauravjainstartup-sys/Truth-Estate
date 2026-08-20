import { upsertWireBatch } from "./wire-upsert-client.mjs";

export async function run() {
  const item = [{
    project_slug: "gurugram-real-estate-puri-diplomatic-residences-dwarka-expressway-sector-111",
    project_name: "Puri Diplomatic Residences",
    event_date: "2026-01-15",
    category: "CORPORATE_JV",
    headline: "Sector 111 Emerges as Luxury Aerocity Gateway with ₹3,500 Crore Branded Developments",
    verified_facts: "• Sector 111 on the Dwarka Expressway established as the premier 'Smart City Delhi Airport' corridor, attracting ₹3,500 Crore in international luxury investments.\n• Direct signal-free 10-minute transit to IGI Airport Terminal 3 and Yashobhoomi Convention Center powers high capital appreciation for Sector 111 high-rises.",
    forensic_impact_type: "POSITIVE",
    forensic_impact_summary: "High-density institutional capital inflow cements Sector 111 as pinnacle airport luxury corridor.",
    source_name: "The Economic Times (ET Realty)",
    source_document_ref: "ET/REALTY/126536979",
    source_url: "https://realty.economictimes.indiatimes.com/news/industry/m3m-india-smartworld-developers-tie-up-with-elie-saab-for-3500-crore-housing-projects-in-ncr/126536979",
    status: "PUBLISHED",
    is_pinned: false,
    display_order: 1
  }];

  console.log("Upserting fresh 2026 update for Puri Diplomatic Residences...");
  await upsertWireBatch(item, "Puri Diplomatic Residences 2026 Update");
}

run().catch(console.error);
