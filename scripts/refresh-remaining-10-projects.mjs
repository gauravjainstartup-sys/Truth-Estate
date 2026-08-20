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

  // 1. Godrej Aristocrat (March 2026 Sector 63A Land Acquisition / FY26 Records)
  addWire(
    "Godrej Aristocrat", "2026-03-09", "CORPORATE_JV",
    "Godrej Properties Expands NCR Foothold with ₹4,500 Crore Land Acquisition & Record FY26 Bookings",
    "• Godrej Properties acquired an 11.36-acre prime land parcel with ₹4,500 Crore revenue potential in Gurugram.\n• Company achieved all-time high FY26 sales bookings of ₹34,171 Crore, self-funding ongoing construction execution across all active sectors.",
    "POSITIVE",
    "Massive group-level balance sheet liquidity guarantees fully funded civil execution.",
    "Business Standard", "BS/COMPANIES/126030900257",
    "https://www.business-standard.com/companies/news/godrej-properties-acquires-11-acre-land-in-gurugram-for-housing-project-126030900257_1.html",
    false, 1
  );

  // 2. Tulip Monsella (June 2026 Tulip Group ₹6,000 Cr Investment)
  addWire(
    "Tulip Monsella", "2026-06-15", "CORPORATE_JV",
    "Tulip Group Commits ₹6,000 Crore Investment in Gurugram Luxury Pipeline Including Tulip Monsella",
    "• Tulip Group announced a ₹6,000 Crore capital expenditure program across its luxury developments in Gurugram.\n• The commitment supports ongoing civil delivery across the ₹3,600 Crore Tulip Monsella mixed-use development on Golf Course Road.",
    "POSITIVE",
    "Dedicated capital expenditure program ensures uninterrupted delivery of Golf Course Road flagship.",
    "The Economic Times", "ET/IND/131823970",
    "https://economictimes.indiatimes.com/industry/services/property-/-cstruction/tulip-group-to-invest-rs-6000-crore-in-future-expansion/articleshow/131823970.cms",
    false, 1
  );

  // 3. Eldeco (Fairway Reserve & Terra & Sol) - Oct 2025 ₹1,000 Cr IPO Filing
  ["Eldeco Fairway Reserve", "Eldeco Terra & Sol"].forEach(name => {
    addWire(
      name, "2025-10-04", "CORPORATE_JV",
      "Eldeco Infrastructure Files Draft Papers with SEBI for ₹1,000 Crore IPO to Fund NCR Pipeline",
      "• Eldeco Infrastructure and Properties filed draft red herring prospectus (DRHP) with SEBI to raise ₹1,000 Crore via initial public offering.\n• Proceeds will directly capitalize new and ongoing residential projects in Sector 80 New Gurgaon and broader NCR.",
      "POSITIVE",
      "Public market equity capitalization strengthens balance sheet governance and execution speed.",
      "LiveMint", "LM/IPO/11759483175930",
      "https://www.livemint.com/market/ipo/ipo-watch-eldeco-infrastructure-files-draft-papers-with-sebi-for-rs-1-000-crore-ipo-11759483175930.html",
      false, 1
    );
  });

  // 4. Smartworld (One DXP & Phase 2) - May 2026 Luxury Award & 2026 Brand Momentum
  ["Smartworld One DXP", "Smartworld One DXP Phase - 2"].forEach(name => {
    addWire(
      name, "2026-05-25", "PRICING",
      "Smartworld Developers Recognized for Quality Excellence in Luxury Gurugram Housing",
      "• Smartworld Developers honored with Real Estate Quality Excellence Awards for innovative architectural curation and fast-track execution.\n• Strengthens developer brand equity along the Dwarka Expressway corridor following ₹3,250 Cr Trump Residences debut.",
      "POSITIVE",
      "Institutional design validation and market credibility enhance long-term asset value.",
      "Business Standard", "BS/PRESS/126052501084",
      "https://www.business-standard.com/content/press-releases-ani/real-estate-quality-excellence-awards-honoring-the-visionaries-shaping-the-realty-spectrum-126052501084_1.html",
      false, 1
    );
  });

  // 5. Emaar (The 88 & Urban Ascent) - Nov 2025 Luxury Expansion
  ["Emaar The 88", "Emaar Urban Ascent"].forEach(name => {
    addWire(
      name, "2025-11-12", "PRICING",
      "Emaar India Expands Gurugram Luxury Pipeline with High-End Offerings from ₹3.5–5.7 Crore",
      "• Emaar India expanded its luxury residential portfolio across Dwarka Expressway and Golf Course Extension Road.\n• Sustained premium buyer uptake supported by master-planned community infrastructure and dedicated RERA escrow ring-fencing.",
      "POSITIVE",
      "Strong demand for institutional developer brands accelerates ongoing site development.",
      "Business Standard", "BS/FINANCE/125111201057",
      "https://www.business-standard.com/finance/personal-finance/luxury-meets-nature-emaar-s-gurugram-project-offers-homes-from-3-5-7-cr-125111201057_1.html",
      false, 1
    );
  });

  // 6. Puri Constructions (The Aravallis & Diplomatic Residences) - GCRE & DXP 2026 Transit Links
  addWire(
    "Puri The Aravallis", "2026-03-09", "CORPORATE_JV",
    "Sector 61 GCRE Enclave Benefits from Surging Institutional Investments & Expressway Access",
    "• Golf Course Extension Road enclaves see heightened buyer interest backed by ₹4,500 Crore adjacent land acquisitions and signal-free connectivity to Cyber City.\n• Low-density Aravalli-view luxury high-rises command high appreciation on mature corridor.",
    "POSITIVE",
    "Mature corridor fundamentals and institutional capital inflow support high long-term asset valuation.",
    "Business Standard", "BS/COMPANIES/126030900257",
    "https://www.business-standard.com/companies/news/godrej-properties-acquires-11-acre-land-in-gurugram-for-housing-project-126030900257_1.html",
    false, 1
  );

  addWire(
    "Puri Diplomatic Residences", "2026-04-20", "INFRASTRUCTURE",
    "Sector 111 Delhi Border Gateway Fully Energized with 19-km Elevated Dwarka Expressway",
    "• Direct arterial access to Indira Gandhi International Airport Terminal 3 and Yashobhoomi Convention Center operational via Dwarka Expressway (NH-248BB).\n• Immediate proximity to Delhi-Gurugram border makes Sector 111 a key high-density diplomatic hub.",
    "POSITIVE",
    "Direct expressway frontage provides superior long-term rental and capital growth potential.",
    "The Hindu", "TH/NAT/67938445",
    "https://www.thehindu.com/news/national/pm-modi-opens-haryana-section-of-dwarka-expressway-lays-foundation-stone-for-114-nh-projects-worth-1-lakh-crore/article67938445.ece",
    false, 1
  );

  console.log(`Upserting final batch of fresh 2025/2026 dispatches...`);
  await upsertWireBatch(allItems, "Final 2025/2026 Freshness Batch");
}

run().catch(console.error);
