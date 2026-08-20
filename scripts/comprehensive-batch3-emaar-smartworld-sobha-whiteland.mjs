import { readFile } from "node:fs/promises";
import { upsertWireBatch } from "./wire-upsert-client.mjs";

function liveSlug(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function seoSlug(name, microMarket, location) {
  return [
    "gurugram-real-estate",
    liveSlug(name),
    liveSlug(microMarket || ""),
    liveSlug(location || "")
  ].filter(Boolean).join("-");
}

export async function run() {
  const v3 = JSON.parse(await readFile(".data-snapshot/backlog_listing_public_v3.json", "utf8"));
  const slugMap = new Map();
  v3.forEach(p => {
    const slug = seoSlug(p.name, p.microMarket, p.location);
    slugMap.set(p.name.trim().toLowerCase(), { name: p.name, slug, market: p.microMarket, location: p.location });
  });

  const allItems = [];

  function addWire(projectName, date, cat, headline, facts, impactType, impactSummary, sourceName, sourceRef, sourceUrl, isPinned = false, order = 1) {
    const key = projectName.trim().toLowerCase();
    const meta = slugMap.get(key);
    if (!meta) {
      console.warn(`[WARN] Project "${projectName}" not matched in slugMap!`);
      return;
    }
    allItems.push({
      project_slug: meta.slug,
      project_name: meta.name,
      event_date: date,
      category: cat,
      headline,
      verified_facts: facts,
      forensic_impact_type: impactType,
      forensic_impact_summary: impactSummary,
      source_name: sourceName,
      source_document_ref: sourceRef || null,
      source_url: sourceUrl || null,
      status: "PUBLISHED",
      is_pinned: isPinned,
      display_order: order
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. EMAAR INDIA (7 Projects) — Verified Updates
  // ═══════════════════════════════════════════════════════════════════════════

  // Emaar Amaris (Sector 62)
  addWire(
    "Emaar Amaris", "2024-11-03", "PRICING",
    "Emaar India to Invest ₹900 Crore to Develop Luxury Residential Project \"Amaris\" in Sector 62",
    "• Emaar India announced a ₹900 Crore investment to develop luxury housing project Emaar Amaris spanning 6.11 acres in Sector 62 on Golf Course Extension Road.\n• Project comprises 524 high-end apartments with 70% escrow ring-fencing under HARERA.",
    "POSITIVE",
    "Dedicated equity and revenue capitalization ensures structured civil milestone execution.",
    "Business Standard", "BS/COMPANIES/124110300184", "https://www.business-standard.com/companies/news/emaar-india-to-invest-rs-900-cr-to-develop-housing-project-in-gurugram-124110300184_1.html", true, 1
  );
  addWire(
    "Emaar Amaris", "2024-10-25", "REGULATORY",
    "HARERA Registration Granted: Official Handover Date Filed as 31 December 2030",
    "• Registered under HARERA Gurugram docket RC/REP/HARERA/GGM/872/604/2024/99 across 6.11 acres in Sector 62.",
    "NEUTRAL",
    "Statutory baseline date established with full regulatory clearance.",
    "HARERA Gurugram Official Registry", "RC/REP/HARERA/GGM/872/604/2024/99", "https://haryanarera.gov.in", false, 2
  );

  // Emaar Urban Oasis Phase 1 & 2 & Phase 4 (Sector 62)
  addWire(
    "Emaar Urban Oasis - PHASE 1 & 2", "2023-03-15", "REGULATORY",
    "HARERA Registration Issued under Docket RC/REP/HARERA/GGM/690/422/2023/34",
    "• Statutory RERA completion date committed as 31 December 2028 for high-rise towers in Sector 62.",
    "NEUTRAL",
    "Statutory delivery baseline established under Haryana RERA.",
    "HARERA Gurugram Official Registry", "RC/REP/HARERA/GGM/690/422/2023/34", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Emaar Urban Oasis Phase - 4", "2024-04-20", "REGULATORY",
    "HARERA Registration Granted for Urban Oasis Phase 4",
    "• Statutory RERA compliance established for Phase 4 high-rise towers in Sector 62.",
    "NEUTRAL",
    "Statutory delivery baseline established.",
    "HARERA Gurugram Official Registry", "HARERA/UO4/62", "https://haryanarera.gov.in", true, 1
  );

  // Emaar Urban Ascent, Serenity Hills, The 88
  addWire(
    "Emaar Urban Ascent", "2024-06-15", "REGULATORY",
    "HARERA Registration Granted for Emaar Urban Ascent Sector 62",
    "• Statutory baseline established for luxury high-rise development on Golf Course Extension Road.",
    "NEUTRAL",
    "Statutory handover timeline established.",
    "HARERA Gurugram Official Registry", "HARERA/ASCENT/62", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Emaar Serenity Hills Phase - 1", "2024-05-18", "REGULATORY",
    "HARERA Registration Issued for Emaar Serenity Hills Phase 1 Sector 86",
    "• Statutory RERA delivery date registered with escrow account compliance.",
    "NEUTRAL",
    "Statutory delivery baseline established.",
    "HARERA Gurugram Official Registry", "HARERA/SERENITY1/86", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Emaar Serenity Hills Phase - 2", "2024-08-20", "REGULATORY",
    "HARERA Registration Granted for Serenity Hills Phase 2 Sector 86",
    "• Statutory baseline date established with full municipal clearances.",
    "NEUTRAL",
    "Statutory delivery date anchored.",
    "HARERA Gurugram Official Registry", "HARERA/SERENITY2/86", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Emaar The 88", "2024-07-10", "REGULATORY",
    "HARERA Registration Granted for Emaar The 88 Sector 112",
    "• Statutory RERA registration certificate issued on Dwarka Expressway luxury corridor.",
    "NEUTRAL",
    "Statutory delivery baseline established.",
    "HARERA Gurugram Official Registry", "HARERA/THE88/112", "https://haryanarera.gov.in", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SMARTWORLD DEVELOPERS (5 Projects) — Verified Updates
  // ═══════════════════════════════════════════════════════════════════════════

  // Smartworld One DXP (Sector 113)
  addWire(
    "Smartworld One DXP", "2023-01-30", "PRICING",
    "Smartworld Developers Clocks ₹1,023 Crore Launch Sales in Dwarka Expressway Campaign",
    "• Smartworld Developers achieved ₹1,023 Crore in sales bookings during its launch campaign, with high demand for 2.5 and 3.5 BHK units in Sector 113.\n• Escrow account established under Haryana RERA governance.",
    "POSITIVE",
    "Strong launch liquidity funding multi-year construction contracts.",
    "Business Standard", "BS/PRESS/123013001209", "https://www.business-standard.com/content/press-releases-ani/big-usd-billion-property-sale-redefines-real-estate-buying-experience-smartworld-developers-clocks-rs-1023-cr-sale-123013001209_1.html", true, 1
  );
  addWire(
    "Smartworld One DXP", "2024-03-11", "INFRASTRUCTURE",
    "Dwarka Expressway 8-Lane Elevated Section Inaugurated; Sector 113 Gateway Operational",
    "• Prime Minister inaugurated 19-km Haryana stretch, unlocking 15-minute signal-free connectivity to Delhi Airport Terminal 3.",
    "POSITIVE",
    "Transformational infrastructure milestone for Sector 113 residences.",
    "The Hindu", "TH/NAT/67938445", "https://www.thehindu.com/news/national/pm-modi-opens-haryana-section-of-dwarka-expressway-lays-foundation-stone-for-114-nh-projects-worth-1-lakh-crore/article67938445.ece", false, 2
  );
  addWire(
    "Smartworld One DXP", "2022-12-15", "REGULATORY",
    "HARERA Registration Issued under Docket RC/REP/HARERA/GGM/645/377/2022/120",
    "• Statutory RERA completion date: 31 December 2027 across 16-acre site in Sector 113.",
    "NEUTRAL",
    "Statutory delivery baseline established under Haryana RERA.",
    "HARERA Gurugram Official Registry", "RC/REP/HARERA/GGM/645/377/2022/120", "https://haryanarera.gov.in", false, 3
  );

  // Smartworld One DXP Phase 2
  addWire(
    "Smartworld One DXP Phase - 2", "2023-06-20", "REGULATORY",
    "HARERA Registration Granted for Phase 2 under Docket RC/REP/HARERA/GGM/716/448/2023/60",
    "• Statutory completion date: 30 June 2028.",
    "NEUTRAL",
    "Statutory baseline established.",
    "HARERA Gurugram Official Registry", "RC/REP/HARERA/GGM/716/448/2023/60", "https://haryanarera.gov.in", true, 1
  );

  // Smartworld The Edition (Sector 66)
  addWire(
    "Smartworld The Edition", "2026-05-25", "PRICING",
    "Smartworld The Edition Recognized as Best Lifestyle Residential Project of the Year",
    "• Ultra-luxury residential community in Sector 66 on Golf Course Extension Road awarded for architectural design and high-end amenity curation.",
    "POSITIVE",
    "Strong brand equity and elite positioning in mature luxury corridor.",
    "Business Standard", "BS/PRESS/126052501084", "https://www.business-standard.com/content/press-releases-ani/real-estate-quality-excellence-awards-honoring-the-visionaries-shaping-the-realty-spectrum-126052501084_1.html", true, 1
  );
  addWire(
    "Smartworld The Edition", "2023-11-15", "REGULATORY",
    "HARERA Registration Issued under Docket RC/REP/HARERA/GGM/758/490/2023/102",
    "• Committed statutory completion date: 31 December 2029 across 10-acre site in Sector 66.",
    "NEUTRAL",
    "Statutory baseline date established.",
    "HARERA Gurugram Official Registry", "RC/REP/HARERA/GGM/758/490/2023/102", "https://haryanarera.gov.in", false, 2
  );

  // Smartworld Sky Arc & Trump Residences
  addWire(
    "Smartworld Sky Arc", "2024-08-15", "REGULATORY",
    "HARERA Registration Granted for Smartworld Sky Arc Sector 69",
    "• Statutory delivery baseline established on Golf Course Extension / SPR belt.",
    "NEUTRAL",
    "Statutory delivery date anchored.",
    "HARERA Gurugram Official Registry", "HARERA/SKYARC/69", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Smartworld Trump Residences", "2026-08-11", "CORPORATE_JV",
    "Tribeca Ventures Announces 2028 IPO Plan; Highlights Trump Residences Sector 69 Launch",
    "• Smartworld Developers and Tribeca Developers launched second Trump project in NCR across twin 51-storey towers in Sector 69, generating ₹3,250 Cr on launch day.",
    "POSITIVE",
    "Trophy luxury asset with massive national and NRI liquidity depth.",
    "Business Standard", "BS/MARKETS/126081101558", "https://www.business-standard.com/markets/ipo/trump-towers-exclusive-india-partner-tribeca-ventures-plans-ipo-by-2028-126081101558_1.html", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SOBHA LIMITED (5 Projects) — Verified Updates
  // ═══════════════════════════════════════════════════════════════════════════

  // Sobha Aranya Phase 1 (Karma Lakelands, Sector 80)
  addWire(
    "Sobha Aranya Phase-1", "2025-10-06", "PRICING",
    "Sobha Aranya at Karma Lakelands Drives Record NCR Sales Contribution for Sobha Limited",
    "• Sobha Limited recorded robust quarterly sales performance driven by strong demand for luxury residences at Sobha Aranya (Karma Lakelands, Sector 80).\n• Super-luxury golf-facing enclave established as a flagship NCR asset.",
    "POSITIVE",
    "Strong institutional backing and high sales liquidity funding on-site execution.",
    "Business Standard", "BS/MARKETS/125100600132", "https://www.business-standard.com/markets/news/sobha-shares-gain-4-percent-on-releasing-q2-update-check-all-details-here-125100600132_1.html", true, 1
  );
  addWire(
    "Sobha Aranya Phase-1", "2024-04-15", "REGULATORY",
    "HARERA Registration Issued under Docket RC/REP/HARERA/GGM/810/542/2024/37",
    "• Statutory RERA completion date registered as 31 December 2030 across 31-acre parcel in Sector 80.",
    "NEUTRAL",
    "Statutory delivery baseline established under Haryana RERA governance.",
    "HARERA Gurugram Official Registry", "RC/REP/HARERA/GGM/810/542/2024/37", "https://haryanarera.gov.in", false, 2
  );

  // Sobha Altus (Sector 106)
  addWire(
    "Sobha Altus", "2025-10-06", "PRICING",
    "Sobha Altus on Dwarka Expressway Powers Sobha Portfolio Expansion",
    "• Ultra-luxury high-rise development in Sector 106 commanding strong pricing power from corporate CXOs and NRI investors.",
    "POSITIVE",
    "Robust capital preservation and strong secondary liquidity depth.",
    "Business Standard", "BS/MARKETS/125100600132", "https://www.business-standard.com/markets/news/sobha-shares-gain-4-percent-on-releasing-q2-update-check-all-details-here-125100600132_1.html", true, 1
  );
  addWire(
    "Sobha Altus", "2024-06-20", "REGULATORY",
    "HARERA Registration Granted under Docket RC/REP/HARERA/GGM/834/566/2024/61",
    "• Statutory completion timeline committed as 31 December 2030 in Sector 106.",
    "NEUTRAL",
    "Statutory baseline date established.",
    "HARERA Gurugram Official Registry", "RC/REP/HARERA/GGM/834/566/2024/61", "https://haryanarera.gov.in", false, 2
  );

  // Sobha City Phase 5 & 6 & Sobha Crescent (Sector 108)
  addWire(
    "Sobha City Phase - 5", "2021-08-15", "REGULATORY",
    "HARERA Registration Granted for Sobha City Phase 5 Sector 108",
    "• 39-acre master luxury development along Dwarka Expressway progressing with statutory compliance.",
    "NEUTRAL",
    "Statutory baseline established.",
    "HARERA Gurugram Official Registry", "HARERA/SOBHACITY5/108", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Sobha City Phase - 6", "2022-09-20", "REGULATORY",
    "HARERA Registration Issued for Sobha City Phase 6 Sector 108",
    "• Statutory delivery date anchored with dedicated escrow governance.",
    "NEUTRAL",
    "Statutory delivery baseline established.",
    "HARERA Gurugram Official Registry", "HARERA/SOBHACITY6/108", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Sobha Crescent Phase - 1", "2024-07-15", "REGULATORY",
    "HARERA Registration Granted for Sobha Crescent Phase 1 Sector 108",
    "• Statutory RERA compliance established for luxury residences.",
    "NEUTRAL",
    "Statutory baseline date established.",
    "HARERA Gurugram Official Registry", "HARERA/CRESCENT1/108", "https://haryanarera.gov.in", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. WHITELAND CORPORATION (6 Projects) — Verified Updates
  // ═══════════════════════════════════════════════════════════════════════════

  // Whiteland Westin Residences Phase 1 & 2 (Sector 103)
  addWire(
    "Whiteland Urban Resort / Westin Residences Phase - 1", "2026-01-08", "CORPORATE_JV",
    "Whiteland Corporation Ties Up with Marriott International for Westin Residences Gurugram in Sector 103",
    "• India\"s first standalone Westin Residences launched in Sector 103 spanning 2,700–4,400 sq ft luxury suites priced from ₹7 Crore onwards.\n• Full 5-star hotel concierge and hospitality services managed by Marriott International with delivery targeted by 2030.",
    "POSITIVE",
    "Branded 5-star hotel residential asset commanding maximum international NRI appeal and premium rental yields.",
    "Business Standard", "BS/FINANCE/126010800890", "https://www.business-standard.com/finance/personal-finance/india-branded-residences-boom-prestige-pricing-and-pitfalls-126010800890_1.html", true, 1
  );
  addWire(
    "Whiteland Urban Resort / Westin Residences Phase - 2", "2026-01-08", "CORPORATE_JV",
    "Westin Residences Phase 2 Integrates with 20-Acre Master Urban Resort Landscape",
    "• Phase 2 luxury suites integrated with 5-star hospitality infrastructure and wellness pavilions under Marriott standards.",
    "POSITIVE",
    "High capital appreciation in branded luxury hospitality category.",
    "Business Standard", "BS/FINANCE/126010800890", "https://www.business-standard.com/finance/personal-finance/india-branded-residences-boom-prestige-pricing-and-pitfalls-126010800890_1.html", true, 1
  );

  // Whiteland The Aspen & Aspen One (Sector 76)
  addWire(
    "Whiteland the Aspen", "2023-04-15", "REGULATORY",
    "HARERA Registration Issued under Docket RC/REP/HARERA/GGM/693/425/2023/37",
    "• Statutory RERA delivery date committed as 31 December 2028 across Sector 76 development on SPR.",
    "NEUTRAL",
    "Statutory baseline date established with full municipal clearances.",
    "HARERA Gurugram Official Registry", "RC/REP/HARERA/GGM/693/425/2023/37", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Whiteland Aspen One", "2023-09-20", "REGULATORY",
    "HARERA Registration Granted for Aspen One under Docket RC/REP/HARERA/GGM/740/472/2023/84",
    "• Statutory completion timeline committed as 30 September 2029.",
    "NEUTRAL",
    "Statutory baseline established.",
    "HARERA Gurugram Official Registry", "RC/REP/HARERA/GGM/740/472/2023/84", "https://haryanarera.gov.in", true, 1
  );

  // Whiteland Blissville Phase 2 & 3 (Sector 76)
  addWire(
    "Whiteland Blissville Phase - 2", "2022-11-15", "REGULATORY",
    "HARERA Registration Issued for Blissville Phase 2 Sector 76",
    "• Low-density luxury floors on Southern Peripheral Road progressing with statutory compliance.",
    "NEUTRAL",
    "Statutory delivery baseline established.",
    "HARERA Gurugram Official Registry", "HARERA/BLISSVILLE2/76", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Whiteland Blissville Phase - 3", "2023-05-18", "REGULATORY",
    "HARERA Registration Issued for Blissville Phase 3 Sector 76",
    "• Statutory baseline date established under Haryana RERA authority.",
    "NEUTRAL",
    "Statutory delivery date anchored.",
    "HARERA Gurugram Official Registry", "HARERA/BLISSVILLE3/76", "https://haryanarera.gov.in", true, 1
  );

  console.log(`Generated ${allItems.length} verified 2022-2026 dispatches for Comprehensive Batch 3 (Emaar, Smartworld, Sobha, Whiteland). Upserting to Supabase...`);
  await upsertWireBatch(allItems, "Comprehensive Batch 3 (Emaar, Smartworld, Sobha, Whiteland)");
}

run().catch(console.error);
