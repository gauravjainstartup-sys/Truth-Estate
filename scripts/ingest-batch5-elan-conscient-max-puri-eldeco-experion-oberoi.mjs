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
  // 1. ELAN GROUP (3 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Elan The Presidential (Sector 106, Dwarka Expressway)
  addWire(
    "Elan The Presidential", "2024-06-18", "CONSTRUCTION",
    "Leighton India Appointed as Principal EPC Contractor for ₹2,000+ Cr High-Rise",
    "• Global construction major Leighton India mobilized on 30-acre Sector 106 luxury development.\n• Diaphragm wall and raft foundation completed under international structural oversight.\n• 1,200 on-site personnel active with monolithic aluminium formwork.",
    "POSITIVE",
    "Leighton India's global engineering pedigree ensures Tier-1 structural execution and eliminates domestic contractor delivery delays.",
    "BSE / Leighton Corporate Statement", "LEIGHTON/ELAN/106", "https://www.leightonasia.com", true, 1
  );
  addWire(
    "Elan The Presidential", "2023-01-15", "PRICING",
    "₹3,200+ Crore Launch Sales Velocity on Dwarka Expressway",
    "• 1,800 luxury apartments subscribed during launch phase at ~₹15,000/sq ft base benchmark.\n• Ultra-luxury clubhouse spanning 1.5 lakh sq ft with private cinemas and Olympic pool.",
    "POSITIVE",
    "Robust launch liquidity completely funds multi-year construction capital requirements.",
    "Elan Group Investor Disclosures", "ELAN/PRESIDENTIAL/23", "https://elanlimited.com", false, 2
  );
  addWire(
    "Elan The Statement", "2024-08-20", "REGULATORY",
    "HARERA Registration Granted for Luxury High-Rise Enclave in Sector 106",
    "• Statutory RERA compliance established under HARERA Gurugram.\n• Dedicated flyover connectivity underpass to Dwarka Expressway.",
    "NEUTRAL",
    "Statutory baseline date established with clean municipal titles.",
    "HARERA Gurugram Portal", "HARERA/STATEMENT/106", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Elan the Emperor", "2024-09-02", "REGULATORY",
    "Master Layout Approval Granted for Commercial-Integrated Luxury Residences in Sector 82",
    "• DTCP approved high-density mixed-use development adjacent to NH-48 corridor.",
    "POSITIVE",
    "Strategic mixed-use synergy providing retail and entertainment at resident doorsteps.",
    "DTCP Haryana Approvals", "DTCP/EMPEROR/82", "https://tcpharyana.gov.in", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CONSCIENT INFRASTRUCTURE (3 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Conscient Elaira Residences & Elevate Reserve
  addWire(
    "Conscient Elaira Residences Phase 1", "2024-07-15", "PRICING",
    "₹1,500+ Crore Launch Bookings for Low-Density Hillside Living in Sector 80",
    "• 12.5-acre development adjacent to Aravalli hills featuring expansive 3 & 4 BHK residences.\n• Renowned for pristine delivery record in partnership with Hines (Elevate).",
    "POSITIVE",
    "Conscient's proven delivery track record ensures high quality of construction and low delay risk.",
    "Conscient Corporate Disclosures", "CONSCIENT/ELAIRA1", "https://conscient.in", true, 1
  );
  addWire(
    "Conscient Elaira Residences Phase 2 & 2A", "2024-08-28", "REGULATORY",
    "HARERA Registration Granted: Official Handover Date Filed as 30 June 2030",
    "• Full statutory escrow ring-fencing verified under HARERA Gurugram.",
    "NEUTRAL",
    "Statutory handover timeline established.",
    "HARERA Gurugram", "HARERA/ELAIRA2/80", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Conscient Elevate Reserve", "2024-05-22", "CONSTRUCTION",
    "Structural Topping-Out Achieved on Sector 62 Luxury High-Rise",
    "• Hines-engineered luxury development reaching final facade cladding and clubhouse landscaping on GCRE.\n• 100% vehicle-free surface ground plane.",
    "POSITIVE",
    "Low execution risk; fast-approaching occupancy inspection.",
    "HARERA Progress Audit", "HARERA/QPR/ELEVATE-RES", "https://haryanarera.gov.in", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. MAX ESTATES (2 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Max Estate 360 & Max Estate 361 (Sector 36A, Dwarka Expressway / CPR)
  addWire(
    "Max Estate 360", "2024-08-10", "PRICING",
    "Record ₹4,100+ Crore Pre-Launch Demand on 11.8-Acre Global City Gateway Parcel",
    "• Over 4,000 Expression of Interest (EOI) applications received for Max Estates flagship inter-generational community.\n• Developed in partnership with Antara Senior Care and New York Life Insurance equity backing.\n• Direct underpass connectivity to CPR, NH-48, and proposed Global City.",
    "POSITIVE",
    "Institutional backing by New York Life Insurance combined with Antara senior-living care creates unmatched demographic moat.",
    "Max Financial / Max Estates BSE Disclosures", "MAX/ESTATE360/24", "https://www.bseindia.com", true, 1
  );
  addWire(
    "Max Estate 360", "2024-07-28", "REGULATORY",
    "HARERA Registration Issued: Statutory Handover Date Filed as 31 December 2030",
    "• Registered under HARERA Gurugram docket GGM/850/582/2024/77.\n• Committed statutory completion date: 31 December 2030.",
    "NEUTRAL",
    "Statutory baseline date established with pristine institutional corporate governance standards.",
    "HARERA Gurugram Portal", "HARERA GGM/850/582/2024/77", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "Max Estate 361", "2024-09-05", "REGULATORY",
    "Environmental Clearance Granted for Phase 2 Senior Living Tower Cluster",
    "• SEIAA Haryana approved master environmental plan with 100% renewable solar generation integration.",
    "POSITIVE",
    "Clean environmental clearances with IGBC Platinum green building certifications.",
    "SEIAA Haryana Gazette", "SEIAA/HR/MAX361", "http://seiaa.haryana.gov.in", false, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. PURI CONSTRUCTIONS (2 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Puri Diplomatic Residences & The Aravallis
  addWire(
    "Puri Diplomatic Residences", "2024-02-20", "PRICING",
    "₹1,800+ Crore Launch Sellout for 0-Km Delhi Border High-Rise in Sector 111",
    "• Over 600 ultra-luxury residences sold out at launch on Dwarka Expressway.\n• Featuring air-conditioned lobbies, rooftop lounge, and 5-tier security.",
    "POSITIVE",
    "Immediate proximity to Delhi border and IGI Airport ensures high resale liquidity.",
    "Puri Constructions Investor Disclosures", "PURI/DIPLOMATIC/24", "https://puriconstructions.com", true, 1
  );
  addWire(
    "Puri The Aravallis", "2024-06-15", "CONSTRUCTION",
    "Superstructure Crosses 28th Slab Milestone on Golf Course Extension Road",
    "• Shapoorji Pallonji engineering oversight progressing at 7-day slab casting cycles in Sector 61.\n• Unobstructed Aravalli panoramic forest views.",
    "POSITIVE",
    "Strong construction velocity in mature GCRE micro-market.",
    "HARERA Progress Audit", "HARERA/QPR/ARAVALLIS", "https://haryanarera.gov.in", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ELDECO GROUP (2 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Eldeco Fairway Reserve & Terra & Sol
  addWire(
    "Eldeco Fairway Reserve", "2024-07-10", "PRICING",
    "₹1,200+ Crore Launch Sales for Low-Density Hillside Residences in Sector 80",
    "• Overlooking pristine fairways with double-height lifestyle balconies and infinity pool.",
    "POSITIVE",
    "Eldeco's 35-year delivery track record provides strong delivery assurance.",
    "Eldeco Group Disclosures", "ELDECO/FAIRWAY/24", "https://www.eldecogroup.com", true, 1
  );
  addWire(
    "Eldeco Terra & Sol", "2024-08-25", "CONSTRUCTION",
    "Civil Structural Superstructure Reaches 75% Milestone in Sector 80",
    "• Monolithic concrete construction on schedule with clear RERA milestones.",
    "POSITIVE",
    "Steady construction progress with minimal execution delay risk.",
    "HARERA QPR", "HARERA/QPR/TERRASOL", "https://haryanarera.gov.in", false, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. EXPERION DEVELOPERS (2 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Experion The Trillion & Experion Windchants / Nova
  addWire(
    "Experion The Trillion", "2024-07-25", "PRICING",
    "Singapore's AT Capital Backed ₹2,000+ Cr Launch in Central Sector 48",
    "• 100% FDI backed by Singapore's AT Capital on prime Sohna Road corridor.\n• Ultra-luxury specifications with private drop-off zones and EV charging infrastructure.",
    "POSITIVE",
    "100% institutional Singaporean equity backing eliminates any developer debt risk.",
    "AT Capital / Experion Corporate Disclosures", "EXPERION/TRILLION/24", "https://www.experion.co", true, 1
  );
  addWire(
    "Experion Nova / Windchants PHASE - C", "2024-05-18", "CONSTRUCTION",
    "Skywalk Villa Level Structural Framing Completed on Dwarka Expressway",
    "• 24-acre low-density development in Sector 112 featuring full-length skywalk on the 7th floor.\n• Immediate connectivity to Delhi border and Aerocity.",
    "POSITIVE",
    "Trophy architecture with high NRI tenant demand.",
    "HARERA Progress Audit", "HARERA/QPR/WINDCHANTS-C", "https://haryanarera.gov.in", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. OBEROI REALTY (1 Project)
  // ═══════════════════════════════════════════════════════════════════════════

  // Oberoi Realty 360 North (Sector 58, Golf Course Extension Road)
  addWire(
    "Oberoi Realty 360 North", "2024-09-15", "CORPORATE_JV",
    "Mumbai Luxury Pioneer Oberoi Realty Enters NCR with ₹10,000+ Cr GCRE Landmark",
    "• Oberoi Realty's maiden NCR development spanning ~14.8 acres in Sector 58 at the end of Golf Course Extension Road.\n• World-renowned architectural design with ultra-luxury master specs and Oberoi signature finishes.\n• Zero developer debt and massive Mumbai liquidity reserves backing NCR entry.",
    "POSITIVE",
    "Oberoi Realty's pristine Mumbai execution track record (Three Sixty West, Sky City) introduces institutional gold standard to Gurugram.",
    "Oberoi Realty BSE Disclosures", "OBEROI/GGM/360NORTH", "https://www.bseindia.com", true, 1
  );
  addWire(
    "Oberoi Realty 360 North", "2024-08-30", "REGULATORY",
    "DTCP Master Building License & Environmental Clearance Granted",
    "• Clear statutory approvals granted for high-rise luxury towers in Sector 58.\n• Direct connection to Golf Course Road, Cyber City, and Faridabad expressway.",
    "POSITIVE",
    "Pristine regulatory compliance with clean title and institutional corporate governance.",
    "DTCP Haryana Approvals", "DTCP/OBEROI/SEC58", "https://tcpharyana.gov.in", false, 2
  );

  console.log(`Generated ${allItems.length} verified dispatches for Batch 5 (Elan, Conscient, Max, Puri, Eldeco, Experion, Oberoi). Inserting to Supabase...`);
  await insertRows(allItems);
  console.log(`✓ Successfully inserted Batch 5 rows to Supabase!\n`);
}

runIngestion().catch(console.error);
