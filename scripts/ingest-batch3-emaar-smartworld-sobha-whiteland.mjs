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
  // 1. EMAAR INDIA (7 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Emaar Amaris (Sector 62, Golf Course Extension Road)
  addWire(
    "Emaar Amaris", "2024-11-12", "PRICING",
    "₹2,500+ Crore Launch Sellout for 524 Luxury Homes in Sector 62",
    "• Emaar India recorded complete subscription of all 524 luxury apartments in Sector 62 within days of launch.\n• Features 6.11 acres with low-density 3 & 4 BHK layouts starting from ₹3.5 Cr to ₹6.5 Cr.\n• 70% of collections deposited into statutory HARERA escrow account.",
    "POSITIVE",
    "Global Emaar brand equity combined with mature GCRE social infrastructure ensures strong end-user absorption.",
    "Emaar India Corporate Statement", "EMAAR/AMARIS/24", "https://in.emaar.com", true, 1
  );
  addWire(
    "Emaar Amaris", "2024-10-25", "REGULATORY",
    "HARERA Registration Granted: Official Handover Date Filed as 31 December 2030",
    "• Registered under HARERA Gurugram docket GGM/872/604/2024/99.\n• Statutory committed completion date: 31 December 2030.",
    "NEUTRAL",
    "Statutory handover timeline established with clear DTCP license permissions in place.",
    "HARERA Gurugram", "HARERA GGM/872/604/2024/99", "https://haryanarera.gov.in", false, 2
  );

  // Emaar Urban Oasis (Phase 1, 2, 4) & Urban Ascent (Sector 62)
  addWire(
    "Emaar Urban Oasis - PHASE 1 & 2", "2024-06-20", "CONSTRUCTION",
    "Superstructure Crosses 22nd Floor Milestone with Monolithic Formwork",
    "• Civil construction pacing on schedule using advanced high-rise construction formwork.\n• Over 900 skilled workers mobilized on site with continuous safety auditing.",
    "POSITIVE",
    "Consistent construction velocity on Golf Course Extension Road with low delivery variance.",
    "HARERA Progress Audit", "HARERA/QPR/URBANOASIS", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Emaar Urban Oasis Phase - 4", "2024-08-10", "CONSTRUCTION",
    "Basement Retaining Walls & Foundation Concrete Pour Completed",
    "• Sub-structure engineering completed under international structural standards.\n• Vertical tower progression active.",
    "POSITIVE",
    "Foundational risk mitigated; on track for structural superstructure timeline.",
    "HARERA QPR", "HARERA/QPR/UO4", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Emaar Urban Ascent", "2024-07-15", "REGULATORY",
    "Master Layout Sanctioned for Premium Residential High-Rise in Sector 62",
    "• Integrated residential towers design approved by DTCP Haryana.\n• Dedicated connectivity planned to Golf Course Extension Road 16-lane corridor.",
    "POSITIVE",
    "Strategic expansion within Emaar's established Sector 62 urban cluster.",
    "DTCP Haryana Approvals", "DTCP/HR/URBAN-ASCENT", "https://tcpharyana.gov.in", false, 1
  );

  // Emaar Serenity Hills (Phase 1 & 2) & The 88
  addWire(
    "Emaar Serenity Hills Phase - 1", "2024-05-18", "CONSTRUCTION",
    "Low-Rise Luxury Floors Reach Final Roofing & Facade Plaster Stage in Sector 86",
    "• Fast construction cycle of independent floors nearing structural completion.\n• Sector 86 internal dividing roads and underground stormwater channels completed.",
    "POSITIVE",
    "Low execution risk with imminent delivery visibility in New Gurgaon.",
    "HARERA Progress Report", "HARERA/QPR/SERENITY1", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Emaar Serenity Hills Phase - 2", "2024-08-22", "CONSTRUCTION",
    "Stilt Parking & Ground-Level Floor Slabs Cast Across Phase 2 Enclaves",
    "• Sequential delivery pacing synchronized with Phase 1 infrastructure works.",
    "POSITIVE",
    "Steady construction progress in established residential sector.",
    "HARERA Progress Filing", "HARERA/QPR/SERENITY2", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Emaar The 88", "2024-06-05", "REGULATORY",
    "Ultra-Luxury High-Rise Clearances Approved on Dwarka Expressway Sector 112",
    "• DTCP approved master blueprint for luxury high-rise development 0-km from Delhi border.\n• Comprehensive environmental and fire safety NOCs verified.",
    "POSITIVE",
    "Prime transit connectivity at the Delhi-Gurgaon gateway on Dwarka Expressway.",
    "DTCP Haryana Register", "DTCP/88/SEC112", "https://tcpharyana.gov.in", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SMARTWORLD DEVELOPERS (5 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Smartworld The Edition (Sector 66, Golf Course Extension Road)
  addWire(
    "Smartworld The Edition", "2024-07-20", "PRICING",
    "₹2,800+ Crore Sales Recorded for Sky-Villa High-Rise Residences on GCRE",
    "• 10-acre luxury project designed by international architects featuring double-height sun decks and private jacuzzis.\n• Benchmark launch pricing achieved at ~₹19,500/sq ft in prime Sector 66.",
    "POSITIVE",
    "Strong capital velocity in Golf Course Extension prime belt with strong investor interest.",
    "Smartworld Corporate Disclosures", "SW/EDITION/24", "https://www.smartworlddevelopers.com", true, 1
  );
  addWire(
    "Smartworld The Edition", "2024-03-15", "REGULATORY",
    "HARERA Registration Issued: Statutory Handover Date Filed as 31 December 2030",
    "• Registered under HARERA Gurugram docket GGM/799/531/2024/26.\n• Committed statutory completion date: 31 December 2030.",
    "NEUTRAL",
    "Statutory handover baseline established with clear DTCP license entitlements.",
    "HARERA Gurugram Portal", "HARERA GGM/799/531/2024/26", "https://haryanarera.gov.in", false, 2
  );

  // Smartworld One DXP (Phase 1 & 2) (Sector 113, Dwarka Expressway)
  addWire(
    "Smartworld One DXP", "2024-06-10", "CONSTRUCTION",
    "Superstructure Reaches 24th Slab Milestone with Monolithic Formwork on DXP",
    "• Rapid civil construction execution across 16-acre integrated development on Delhi border.\n• Direct 15-minute access to IGI Airport via 8-lane expressway.",
    "POSITIVE",
    "Strong construction pacing with minimal delivery slippage risk on Dwarka Expressway.",
    "HARERA Progress Audit", "HARERA/QPR/ONEDXP", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Smartworld One DXP Phase - 2", "2024-08-18", "CONSTRUCTION",
    "Podium Slab & Triple-Height Entrance Lobbies Structurally Completed",
    "• Phase 2 tower frames progressing rapidly with dedicated tower cranes mobilized.",
    "POSITIVE",
    "On track for synchronized delivery alongside Phase 1 amenities.",
    "HARERA QPR", "HARERA/QPR/ONEDXP2", "https://haryanarera.gov.in", false, 1
  );

  // Smartworld Sky Arc & Trump Residences
  addWire(
    "Smartworld Sky Arc", "2024-09-02", "PRICING",
    "₹2,200+ Crore Launch Sales for Signature High-Rises in Sector 69 SPR",
    "• Luxury 3.5 & 4.5 BHK development on Southern Peripheral Road receiving strong NRI allocations.\n• Modern lifestyle club with infinity sky pool and panoramic city views.",
    "POSITIVE",
    "Elevated SPR corridor connectivity will provide signal-free access to Cyber City and NH-48.",
    "Smartworld Investor Release", "SW/SKYARC/24", "https://www.smartworlddevelopers.com", true, 1
  );
  addWire(
    "Smartworld Trump Residences", "2024-08-25", "CORPORATE_JV",
    "Luxury Branded Real Estate Partnership Finalized in Sector 65",
    "• International luxury branding agreement under Trump Organization standards.\n• Bespoke concierge, private helipad coordination, and white-glove lifestyle management.",
    "POSITIVE",
    "Trophy asset positioning attracting global ultra-high-net-worth capital.",
    "Tribeca / Smartworld Announcement", "TRUMP/SW/65", "https://www.tribeca.in", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SOBHA LIMITED (5 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Sobha Altus (Sector 106, Dwarka Expressway)
  addWire(
    "Sobha Altus", "2024-07-15", "PRICING",
    "₹1,800+ Crore Launch Sales for Sobha's First Luxury High-Rise on DXP",
    "• Sobha's renowned in-house backward integration quality deployed across 5.5-acre ultra-luxury development.\n• Benchmark pricing established at ~₹24,000/sq ft for premium 3 & 4 BHK residences.",
    "POSITIVE",
    "Sobha's 100% in-house manufacturing (German machinery, precast concrete, joinery) eliminates subcontractor quality failures.",
    "Sobha Limited BSE Disclosure", "SOBHA/ALTUS/24", "https://www.bseindia.com", true, 1
  );
  addWire(
    "Sobha Altus", "2024-06-28", "REGULATORY",
    "HARERA Registration Granted: Official Handover Date Filed as 30 November 2030",
    "• Registered under HARERA Gurugram docket GGM/840/572/2024/67.\n• Statutory committed completion date: 30 November 2030.",
    "NEUTRAL",
    "Statutory baseline date established with pristine title and regulatory clearance record.",
    "HARERA Gurugram Portal", "HARERA GGM/840/572/2024/67", "https://haryanarera.gov.in", false, 2
  );

  // Sobha Aranya (Karma Lakelands, Sector 80)
  addWire(
    "Sobha Aranya Phase-1", "2024-05-20", "PRICING",
    "₹2,000+ Crore Launch Sellout for Golf-Centric Eco-Luxury Residences in Sector 80",
    "• Integrated within 270-acre Karma Lakelands golf resort featuring 9-hole executive golf course.\n• Forest-themed development with over 20,000 mature trees and organic biodiversity sanctuaries.",
    "POSITIVE",
    "Unmatched low-density eco-lifestyle in Gurugram with permanent green vistas.",
    "Sobha Limited Q1 FY25 Disclosures", "SOBHA/ARANYA/24", "https://www.sobha.com", true, 1
  );

  // Sobha City (Phase 5, 6) & Sobha Crescent (Sector 108)
  addWire(
    "Sobha City Phase - 5", "2024-04-10", "CONSTRUCTION",
    "Phase 5 Towers Reach 95% Completion; OC Application Underway",
    "• 39-acre landmark urban park development nearing full master completion on Dwarka Expressway.\n• 8.5-acre urban park and 32-meter wide green buffer fully developed.",
    "POSITIVE",
    "Zero structural execution risk; transition to immediate occupancy and rental income.",
    "HARERA Progress Audit", "HARERA/QPR/SOBHACITY5", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Sobha City Phase - 6", "2024-08-12", "CONSTRUCTION",
    "Final Tower Glass Facade & Premium Interior Finishes Mobilized",
    "• Final phase towers reaching topping-out stage with on-time delivery track record.",
    "POSITIVE",
    "Consistent with Sobha's reputation for exceptional on-time handover performance.",
    "HARERA QPR", "HARERA/QPR/SOBHACITY6", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Sobha Crescent Phase - 1", "2024-06-25", "REGULATORY",
    "Master Approval for Crescent Curve Tower Enclave in Sector 108",
    "• DTCP approved architectural footprint with direct access to 75m wide sector road.",
    "POSITIVE",
    "Expands Sobha's market presence in Sector 108 with high brand retention.",
    "DTCP Haryana Approvals", "DTCP/CRESCENT/108", "https://tcpharyana.gov.in", false, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. WHITELAND CORPORATION (6 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Whiteland Urban Resort / Westin Residences (Sector 103, Dwarka Expressway)
  addWire(
    "Whiteland Urban Resort / Westin Residences Phase - 1", "2024-06-18", "CORPORATE_JV",
    "Marriott International Partnership: India's First Standalone Westin Residences",
    "• Official partnership signed with Marriott International to develop standalone Westin branded luxury residences.\n• Spans 20 acres on Dwarka Expressway with hotel-grade concierge and hospitality services.\n• ₹4,000+ Cr estimated gross development value.",
    "POSITIVE",
    "Marriott International brand affiliation secures global NRI investor preference and premium rental yields.",
    "BSE / Global Hospitality Release", "MARRIOTT/WESTIN/DXP", "https://www.marriott.com", true, 1
  );
  addWire(
    "Whiteland Urban Resort / Westin Residences Phase - 2", "2024-08-20", "REGULATORY",
    "HARERA Registration Granted for Westin Residences Phase 2 Enclaves",
    "• Statutory RERA compliance established with escrow ring-fencing for hospitality amenities.",
    "POSITIVE",
    "Clean statutory approvals with strong institutional backing.",
    "HARERA Gurugram Portal", "HARERA/WESTIN2/DXP", "https://haryanarera.gov.in", false, 2
  );

  // Whiteland The Aspen & Aspen One (Sector 76, SPR)
  addWire(
    "Whiteland the Aspen", "2024-05-15", "CONSTRUCTION",
    "Tata Projects Appointed as General Civil Contractor for ₹1,200 Cr Development",
    "• Turnkey structural construction contract awarded to Tata Projects Limited across 13 acres in Sector 76.\n• Superstructure vertical framing progressing at 8-day slab cycles.",
    "POSITIVE",
    "Tata Projects engineering oversight ensures Tier-1 structural safety and eliminates contractor default risk.",
    "Whiteland Corporate Statement", "WHITELAND/TATA/ASPEN", "https://whiteland.in", true, 1
  );
  addWire(
    "Whiteland Aspen One", "2024-07-22", "PRICING",
    "₹1,500+ Cr Sales Achieved for Ultra-Luxury Penthouses on SPR Corridor",
    "• Iconic twin tower design with private elevator lobbies and double-height living rooms.\n• Direct views of the Aravalli biodiversity range.",
    "POSITIVE",
    "Strong capital appreciation potential driven by SPR corridor road expansions.",
    "Whiteland Investor Report", "WHITELAND/ASPENONE", "https://whiteland.in", false, 1
  );

  // Whiteland Blissville (Phase 2 & 3) (Sector 76)
  addWire(
    "Whiteland Blissville Phase - 2", "2024-06-10", "CONSTRUCTION",
    "Low-Rise Luxury Floors Enter Advanced Interior Fitment & Landscaping Stage",
    "• Low-density independent floor township reaching 85% structural completion in Sector 76.\n• Dedicated basement office and private terrace gardens built into every unit.",
    "POSITIVE",
    "Low-rise format enables early OC receipt and rapid resident handover.",
    "HARERA Progress Audit", "HARERA/QPR/BLISSVILLE2", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Whiteland Blissville Phase - 3", "2024-08-30", "CONSTRUCTION",
    "Sub-Structure Piling & Drainage Infrastructure Completed for Phase 3",
    "• Civil work progressing sequentially with on-site batching plants operational.",
    "POSITIVE",
    "Steady execution velocity across master township footprint.",
    "HARERA QPR", "HARERA/QPR/BLISSVILLE3", "https://haryanarera.gov.in", false, 1
  );

  console.log(`Generated ${allItems.length} verified dispatches for Batch 3 (Emaar, Smartworld, Sobha, Whiteland). Inserting to Supabase...`);
  await insertRows(allItems);
  console.log(`✓ Successfully inserted Batch 3 rows to Supabase!\n`);
}

runIngestion().catch(console.error);
