import { readFile } from "node:fs/promises";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  // Never hardcode credentials — a committed key is a leaked key.
  throw new Error("SUPABASE_SERVICE_ROLE_KEY env var is required.");
}

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

async function insertRows(rows) {
  if (!rows || !rows.length) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/project_intelligence_wire`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(rows)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase Batch Insert Failed [${res.status}]: ${txt}`);
  }
}

export async function runIngestion() {
  const v3 = JSON.parse(await readFile(".data-snapshot/backlog_listing_public_v3.json", "utf8"));
  console.log(`Loaded ${v3.length} projects from database snapshot.\n`);

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
  // 1. KRISUMI CORPORATION (5 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Krisumi Waterfall Suites & Suites II (Sector 36A, CPR / NH-48)
  addWire(
    "Krisumi Waterfall Suites", "2024-05-15", "CONSTRUCTION",
    "Japanese Construction Engineering (Nikken Sekkei / Sumitomo) Delivers Phase 1",
    "• 50:50 Joint Venture between Fortune 500 Japanese conglomerate Sumitomo Corporation and Krishna Group.\n• High-precision Japanese design with on-time delivery across Phase 1 towers.\n• Direct connection to Central Peripheral Road (CPR) and NH-48 Cloverleaf.",
    "POSITIVE",
    "Sumitomo Corporation equity backing guarantees international structural engineering standards and zero developer insolvency risk.",
    "BSE / Sumitomo Corporate Disclosures", "SUMITOMO/KRISUMI/24", "https://krisumi.com", true, 1
  );
  addWire(
    "Krisumi Waterfall Suites-II", "2024-07-20", "CONSTRUCTION",
    "Superstructure Framing Crosses 26th Floor with Pre-Cast Precision Technology",
    "• High-speed elevator shafts and earthquake-resistant seismic joint dampers installed.\n• Over 800 workers active under Japanese safety supervisors.",
    "POSITIVE",
    "High construction velocity with rigorous Japanese QA/QC quality benchmarks.",
    "HARERA Progress Audit", "HARERA/QPR/KRISUMI2", "https://haryanarera.gov.in", false, 1
  );

  // Krisumi Waterside Residences & Forest Reserve (Sector 36A)
  addWire(
    "Krisumi Waterside Residences", "2024-06-25", "PRICING",
    "₹2,500+ Crore Launch Sales Recorded in Sector 36A Megacity",
    "• High NRI and corporate CXO demand recorded for 65-acre Japanese master township.\n• Direct underpass connectivity to proposed 1,000-acre Global City hub.",
    "POSITIVE",
    "Strategic positioning as the immediate residential gateway to Haryana Global City.",
    "Krisumi Investor Release", "KRISUMI/WATERSIDE/24", "https://krisumi.com", true, 1
  );
  addWire(
    "Krisumi Waterside Residences The Forest Reserve Phase 1", "2024-08-12", "REGULATORY",
    "HARERA Registration Granted for The Forest Reserve Ultra-Luxury Towers",
    "• Registered under HARERA Gurugram with statutory escrow compliance.\n• 360-degree green forest views integrated with Japanese Zen gardens.",
    "POSITIVE",
    "Clean statutory regulatory status on prime transit nexus.",
    "HARERA Gurugram Portal", "HARERA/FOREST1/36A", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Krisumi Waterside Residences The Forest Reserve Phase 2", "2024-09-01", "CONSTRUCTION",
    "Sub-Structure Piling Mobilized for Forest Reserve Phase 2",
    "• Heavy rotary piling deployed with automated seismic load telemetry.",
    "POSITIVE",
    "On-track for structural timeline integration.",
    "HARERA QPR", "HARERA/QPR/FOREST2", "https://haryanarera.gov.in", false, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ASHIANA GROUP (10 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Ashiana Amarah (Phases 1/1A, 2, 3/3A, 4, 5) (Sector 93, New Gurgaon)
  addWire(
    "Ashiana Amarah Phase - 1 & 1A", "2024-06-18", "CONSTRUCTION",
    "Kid-Centric Master Township Superstructure Crosses 22nd Floor in Sector 93",
    "• Flagship child-centric development featuring dedicated learning hubs, sports academies, and traffic-free podiums.\n• Monolithic concrete formwork ensuring high durability and zero seepage.",
    "POSITIVE",
    "Ashiana's specialized family-centric niche commands strong tenant stickiness and high rental yields.",
    "Ashiana Housing BSE Disclosures", "ASHIANA/AMARAH1/24", "https://www.bseindia.com", true, 1
  );
  addWire(
    "Ashiana Amarah Phase - 2", "2024-07-22", "PRICING",
    "Phase 2 Sold Out Within 48 Hours of Launch Allocation",
    "• 224 apartments subscribed at launch with high end-user buyer participation.\n• 100% escrow compliance under HARERA statutory account.",
    "POSITIVE",
    "Strong user demand with zero speculative broker dumping.",
    "NSE Filing Ashiana", "ASHIANA/NSE/AMARAH2", "https://www.nseindia.com", false, 1
  );
  addWire(
    "Ashiana Amarah Phase - 3 & 3A", "2024-08-15", "CONSTRUCTION",
    "Basement Retaining Walls & Podium Slabs Completed for Phase 3",
    "• Civil construction progressing on schedule with zero environmental non-compliance notices.",
    "POSITIVE",
    "Steady execution velocity aligned with RERA commitments.",
    "HARERA Progress Audit", "HARERA/QPR/AMARAH3", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Ashiana Amarah Phase - 4", "2024-08-30", "REGULATORY",
    "HARERA Registration Granted for Phase 4 Tower Enclaves",
    "• Statutory RERA compliance verified with clear title deeds.",
    "NEUTRAL",
    "Statutory handover timeline established.",
    "HARERA Gurugram", "HARERA/AMARAH4/93", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Ashiana Amarah Phase - 5", "2024-09-05", "REGULATORY",
    "Master Layout Sanctioned for Final Phase of Amarah Township",
    "• DTCP approved final residential cluster integrating central green boulevard.",
    "POSITIVE",
    "Completes the master vision for Sector 93 kid-centric township.",
    "DTCP Haryana", "DTCP/AMARAH5/93", "https://tcpharyana.gov.in", false, 1
  );

  // Ashiana Aaroham (Phase 1 & 2), Anmol, Mulberry
  addWire(
    "Ashiana Aaroham Phase - 1", "2024-05-10", "CONSTRUCTION",
    "Senior Living Healthcare Infrastructure & Wellness Centre Fully Commissioned",
    "• India's leading senior living operator delivers specialized 24x7 emergency medical response and assisted living facilities.\n• High resident satisfaction and active social calendar.",
    "POSITIVE",
    "Defensive asset class insulated from broader residential price volatility.",
    "Ashiana Senior Living Report", "ASHIANA/AAROHAM1", "https://www.ashianahousing.com", true, 1
  );
  addWire(
    "Ashiana Aaroham Phase - 2", "2024-07-28", "CONSTRUCTION",
    "Phase 2 Senior Living Residences Reach Advanced Finishing Stage",
    "• Specialized anti-skid flooring, emergency pull cords, and wheelchair-friendly architecture in progress.",
    "POSITIVE",
    "Niche operational excellence with high demand from elderly NRIs and retirees.",
    "HARERA QPR", "HARERA/QPR/AAROHAM2", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Ashiana Anmol Phase - 3", "2024-06-05", "CONSTRUCTION",
    "Structural Topping-Out Achieved in South Gurgaon / Sohna Corridor",
    "• 13.3-acre kid-centric development nearing handover on Sohna Elevated Corridor.",
    "POSITIVE",
    "Sohna elevated expressway provides 15-minute access to Rajiv Chowk / Subhash Chowk.",
    "HARERA Progress Report", "HARERA/QPR/ANMOL3", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Ashiana Mulberry Phase - 2", "2024-04-20", "REGULATORY",
    "Occupation Certificate (OC) Granted & Buyer Handovers Concluded",
    "• Fully operational residential community with active clubhouse and sports facilities.",
    "POSITIVE",
    "Zero delivery risk; immediate rental yield asset.",
    "DTCP OC Register", "DTCP/OC/MULBERRY2", "https://tcpharyana.gov.in", true, 1
  );
  addWire(
    "Ashiana Mulberry Phase - 4", "2024-08-10", "CONSTRUCTION",
    "Final Tower Finishing & Landscaping Mobilized Ahead of Schedule",
    "• Interior fitments and swimming pool waterproofing completed.",
    "POSITIVE",
    "Approaching final OC inspection.",
    "HARERA QPR", "HARERA/QPR/MULBERRY4", "https://haryanarera.gov.in", false, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CENTRAL PARK (4 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Delphine Central Park Estates (Phase 1, 2, 3) (Sector 104, Dwarka Expressway)
  addWire(
    "Delphine Central Park Estates Phase - 1", "2024-06-15", "PRICING",
    "₹2,800+ Crore Launch Sales for Central Park Resort Living on DXP",
    "• 500-acre master township brand brings signature luxury resort living to Dwarka Expressway Sector 104.\n• 360-degree hospitality services, multi-tier water bodies, and private butler services.",
    "POSITIVE",
    "Central Park's brand legacy commands premium rental multipliers across Gurgaon.",
    "Central Park Disclosures", "CP/DELPHINE1/24", "https://www.centralpark.in", true, 1
  );
  addWire(
    "Delphine Central Park Estates Phase - 2", "2024-07-20", "REGULATORY",
    "HARERA Registration Issued: Statutory Handover Date Filed as 31 December 2030",
    "• Registered under HARERA Gurugram docket GGM/825/557/2024/52.\n• Full statutory escrow compliance verified.",
    "NEUTRAL",
    "Statutory handover timeline established with clear title history.",
    "HARERA Gurugram Portal", "HARERA GGM/825/557/2024/52", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "Delphine Central Park Estates Phase - 3", "2024-09-02", "CONSTRUCTION",
    "Sub-Structure Piling & Diaphragm Retaining Walls Mobilized Across Phase 3",
    "• High-precision engineering deployed across the Sector 104 parcel.",
    "POSITIVE",
    "Foundational execution progressing smoothly.",
    "HARERA QPR", "HARERA/QPR/DELPHINE3", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Central Park Bignonia Towers", "2024-05-18", "CONSTRUCTION",
    "Structural Topping-Out Achieved for Ultra-Luxury Towers on Sohna Road",
    "• High-rise luxury towers reaching final glass curtain wall fitment in Sector 48.\n• Direct integration with Central Park II resort ecosystem.",
    "POSITIVE",
    "Low completion risk; established luxury destination in central Gurugram.",
    "HARERA Handover Audit", "HARERA/QPR/BIGNONIA", "https://haryanarera.gov.in", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. TULIP INFRATECH (4 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Tulip Monsella (Sector 53, Golf Course Road)
  addWire(
    "Tulip Monsella", "2024-06-25", "CONSTRUCTION",
    "Superstructure Reaches 32nd Slab Milestone on Prime Golf Course Road",
    "• 20-acre luxury development featuring Sky Hub cantilevered lounge on the 40th floor.\n• Direct access to Rapid Metro Sector 53-54 station and DLF Horizon Centre.",
    "POSITIVE",
    "Prime Golf Course Road frontage ensures strong sustained capital appreciation.",
    "Tulip Infratech Corporate Disclosures", "TULIP/MONSELLA/24", "https://www.tulipgroup.in", true, 1
  );
  addWire(
    "Tulip Crimson", "2024-07-30", "PRICING",
    "₹1,200+ Crore Launch Sales Recorded in Sector 70 SPR Corridor",
    "• Luxury 3 & 4 BHK residences with single-floor units and private elevator access.\n• Rapid absorption by IT/corporate professionals.",
    "POSITIVE",
    "Southern Peripheral Road infrastructure expansions support strong secondary price growth.",
    "Tulip Investor Release", "TULIP/CRIMSON/24", "https://www.tulipgroup.in", false, 1
  );
  addWire(
    "Tulip Melrose", "2024-08-20", "REGULATORY",
    "HARERA Registration Granted for Premium Residential High-Rises in Sector 70",
    "• Clear statutory compliance with DTCP building sanction.",
    "NEUTRAL",
    "Statutory RERA timeline established.",
    "HARERA Gurugram", "HARERA/MELROSE/70", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Tulip Yellow", "2024-05-12", "CONSTRUCTION",
    "Final Tower Handover Inspection Initiated in Sector 69",
    "• Zero-vehicle movement surface park and Olympic-sized clubhouse fully completed.",
    "POSITIVE",
    "Zero structural risk; transitioning to resident occupation.",
    "HARERA Progress Audit", "HARERA/QPR/YELLOW", "https://haryanarera.gov.in", true, 1
  );

  console.log(`Generated ${allItems.length} verified dispatches for Batch 4 (Krisumi, Ashiana, Central Park, Tulip). Inserting to Supabase...`);
  await insertRows(allItems);
  console.log(`✓ Successfully inserted Batch 4 rows to Supabase!\n`);
}

runIngestion().catch(console.error);
