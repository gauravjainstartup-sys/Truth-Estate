import { upsertWireBatch } from "./wire-upsert-client.mjs";

export async function run() {
  const item = [{
    project_slug: "gurugram-real-estate-sobha-crescent-phase-1-golf-course-road-extension-gcre-sector-63a",
    project_name: "Sobha Crescent Phase - 1",
    event_date: "2023-10-15",
    category: "REGULATORY",
    headline: "HARERA Registration Granted under Docket RC/REP/HARERA/GGM/762/494/2023/106",
    verified_facts: "• Official project registration certificate RC/REP/HARERA/GGM/762/494/2023/106 granted by HARERA Gurugram across Sector 63A.\n• Committed statutory completion timeline filed as 31 December 2029 with mandatory 70% escrow governance.",
    forensic_impact_type: "POSITIVE",
    forensic_impact_summary: "Statutory delivery timeline registered under Haryana RERA governance.",
    source_name: "HARERA Gurugram Official Registry",
    source_document_ref: "RC/REP/HARERA/GGM/762/494/2023/106",
    source_url: "https://haryanarera.gov.in",
    status: "PUBLISHED",
    is_pinned: false,
    display_order: 1
  }];

  await upsertWireBatch(item, "Sobha Crescent HARERA Docket");
}

run().catch(console.error);
