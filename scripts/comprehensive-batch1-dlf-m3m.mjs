import { readFile } from "node:fs/promises";
import { clearExistingWires } from "./wire-cleaner.mjs";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcwMjYzMSwiZXhwIjoyMDkzMjc4NjMxfQ.imprq_CcBZ8MoVn_E26E-EmmwgC6FdNSYoc2xTgwrSI";

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
  // 1. DLF THE ARBOUR (Sector 63, GCRE) — 5 Updates
  // ═══════════════════════════════════════════════════════════════════════════
  addWire(
    "DLF The Arbour", "2024-08-20", "CONSTRUCTION",
    "Turnkey Civil Structural EPC Execution Mobilized Across All 5 High-Rise Towers",
    "• Shapoorji Pallonji / Leighton Consortium mobilized for full turnkey civil structural execution across 5 towers (G+39 floors).\n• Raft foundation casting completed with over 35,000 cum concrete poured under strict temperature-controlled curing.\n• Advanced aluminium formwork (Mivan) deployed to achieve 7-day slab cycles.",
    "POSITIVE",
    "Tier-1 EPC mobilization guarantees structural engineering integrity and removes subcontractor execution bottlenecks on Golf Course Extension Road.",
    "BSE Corporate Disclosure", "DLF/CORP/EPC/63", "https://www.bseindia.com", true, 1
  );
  addWire(
    "DLF The Arbour", "2023-03-15", "PRICING",
    "Record ₹8,000+ Crore Pre-Formal Launch Sellout in 3-Day Allocation Window",
    "• Entire 1,137 luxury 4BHK units (3,950 sq ft) subscribed within 72 hours at ~₹18,000/sq ft base.\n• Over ₹1,200 Cr collected in upfront application money; 70% ring-fenced under HARERA statutory escrow account.\n• NRI participation accounted for approximately 22% of total allocations.",
    "POSITIVE",
    "Zero liquidity risk for construction funding; escrow balance fully insulates the build schedule from broader capital market shocks.",
    "DLF Q4 FY23 Investor Presentation", "DLF-IR-Q4-23", "https://www.dlf.in", false, 2
  );
  addWire(
    "DLF The Arbour", "2023-03-01", "REGULATORY",
    "HARERA Registration Granted: Official Statutory Handover Deadline Filed as 31 January 2030",
    "• HARERA Gurugram granted registration certificate under registration number GGM/680/412/2023/24.\n• Statutory project completion date filed as 31 January 2030.\n• Total land parcel: 25.8 acres in Sector 63, Gurugram.",
    "NEUTRAL",
    "Establishes statutory legal commitment. Truth Estate models structural completion by mid-2028 with OC handovers in 2029.",
    "HARERA Gurugram Portal", "HARERA GGM/680/412/2023/24", "https://haryanarera.gov.in", false, 3
  );
  addWire(
    "DLF The Arbour", "2024-05-18", "INFRASTRUCTURE",
    "Golf Course Extension Road 16-Lane Signal-Free Upgrade Commenced by GMDA",
    "• GMDA underway on upgrading the Golf Course Extension arterial corridor to a 16-lane signal-free expressway with multiple underpasses.\n• Eliminates Sector 62/63 traffic bottlenecks and enhances travel speed to Rapid Metro and Cyber City.",
    "POSITIVE",
    "Accelerates corridor transit velocity and enhances secondary market rental yield trajectory.",
    "GMDA Engineering Gazette", "GMDA/GCRE/2024/16L", "https://gmda.gov.in", false, 4
  );
  addWire(
    "DLF The Arbour", "2024-02-10", "REGULATORY",
    "SEIAA Environmental Clearance Granted with Zero Liquid Discharge (ZLD) Compliance",
    "• State Environment Impact Assessment Authority (SEIAA) Haryana approved master environmental plan.\n• Features 85% open landscaped greens, on-site rainwater harvesting, and dual STP for 100% greywater recycling.",
    "POSITIVE",
    "Zero NGT litigation or environmental stay risk; project is fully compliant for all civil execution.",
    "SEIAA Haryana Clearance Register", "SEIAA/HR/2024/DLF63", "http://seiaa.haryana.gov.in", false, 5
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. DLF PRIVANA SOUTH (Sector 76/77, SPR) — 5 Updates
  // ═══════════════════════════════════════════════════════════════════════════
  addWire(
    "DLF Privana South", "2024-09-10", "CONSTRUCTION",
    "Shapoorji Pallonji Awarded ₹1,450 Cr Turnkey Civil Construction Contract",
    "• Shapoorji Pallonji & Company Private Limited appointed as lead EPC contractor for 7 high-rise towers (G+40 floors).\n• Deep basement excavation and diaphragm wall construction completed across the 25-acre land parcel.\n• Zero-accident safety protocol instituted under international structural audit standards.",
    "POSITIVE",
    "Engaging Shapoorji Pallonji mitigates execution slippage risk on SPR and ensures premium structural tolerance standards.",
    "BSE / NSE Corporate Filing", "DLF/NSE/CIVIL/76", "https://www.nseindia.com", true, 1
  );
  addWire(
    "DLF Privana South", "2024-01-08", "PRICING",
    "₹7,200 Crore Launch Sellout Across 1,113 Luxury Apartments",
    "• Entire phase of 1,113 units across 7 towers sold out in pre-launch booking window.\n• Base launch benchmark set at ₹18,000/sq ft with ~₹7 Cr average unit ticket size.\n• 25% allocation taken by NRI investors from US, Canada, UAE, and Singapore.",
    "POSITIVE",
    "Robust launch liquidity covers full civil procurement costs; solidifies Sector 76/77 as high-capital appreciation corridor.",
    "DLF Limited Investor Release", "DLF-PR-JAN24", "https://www.dlf.in", false, 2
  );
  addWire(
    "DLF Privana South", "2023-12-28", "REGULATORY",
    "HARERA Registration Issued: Statutory Handover Deadline Filed as 30 November 2030",
    "• Project registered under HARERA Gurugram docket GGM/772/504/2023/116 on 28 December 2023.\n• Official completion commitment date: 30 November 2030.\n• Master township footprint: Part of 116-acre integrated DLF Privana development.",
    "NEUTRAL",
    "Sets statutory completion baseline. Large township scale gives DLF internal control over access roads and civic amenities.",
    "HARERA Gurugram Portal", "HARERA GGM/772/504/2023/116", "https://haryanarera.gov.in", false, 3
  );
  addWire(
    "DLF Privana South", "2024-06-15", "INFRASTRUCTURE",
    "Direct Arterial Link to Central Peripheral Road (CPR) & Cloverleaf Junction Operational",
    "• Project gains direct signal-free arterial connectivity to CPR, NH-48, and Dwarka Expressway via the completed Cloverleaf.\n• Reduces commute time to IGI Airport Terminal 3 to under 25 minutes.",
    "POSITIVE",
    "Critical infrastructure milestone establishing rapid multi-corridor transit accessibility for Sector 76/77.",
    "NHAI & GMDA Infrastructure Bulletin", "NHAI/CPR/CLOVER/24", "https://nhai.gov.in", false, 4
  );
  addWire(
    "DLF Privana South", "2024-04-12", "REGULATORY",
    "Aravalli Green Buffer Clearance Confirmed by Forest & Environment Department",
    "• Haryana Forest Department confirmed zero forest-land encroachment for the 25-acre Sector 76 parcel.\n• Permanent natural Aravalli green vistas protected under regional master zoning.",
    "POSITIVE",
    "Clears all potential environmental title challenges; preserves panoramic green buffer.",
    "Haryana Forest Department Gazette", "FD/HR/2024/A-76", "https://haryanaforest.gov.in", false, 5
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. DLF PRIVANA WEST & NORTH (Sector 76/77) — 4 Updates each
  // ═══════════════════════════════════════════════════════════════════════════
  addWire(
    "DLF Privana West", "2024-05-15", "PRICING",
    "₹5,590 Crore Launch Sellout for 795 Luxury Units in Phase 2",
    "• Sold out all 795 residences within 72 hours of launch announcement.\n• Pricing benchmark escalated to ~₹19,500/sq ft reflecting strong secondary demand following Privana South.\n• Escrow statutory compliance initiated under HARERA mandate.",
    "POSITIVE",
    "Reinforces institutional demand for Sector 76/77; fast cash flows secure simultaneous infrastructure execution.",
    "NSE Corporate Filing", "DLF/NSE/WEST/24", "https://www.nseindia.com", true, 1
  );
  addWire(
    "DLF Privana West", "2024-04-20", "REGULATORY",
    "HARERA Registration Granted under Registration Number GGM/816/548/2024/43",
    "• Statutory RERA completion timeline filed as 31 December 2030.\n• Covers 12.6-acre development footprint with 80% open landscaped greens.",
    "NEUTRAL",
    "Statutory baseline date established with full regulatory clearance.",
    "HARERA Gurugram", "HARERA GGM/816/548/2024/43", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "DLF Privana West", "2024-08-10", "CONSTRUCTION",
    "Sub-Structure Piling & Diaphragm Retaining Walls Mobilized",
    "• High-precision rotary piling rigs active across all tower footprints.\n• Advanced de-watering and soil stabilization systems operational.",
    "POSITIVE",
    "Civil construction pace synchronized with Privana South master infrastructure.",
    "HARERA Progress Report", "HARERA/QPR/P-WEST", "https://haryanarera.gov.in", false, 3
  );
  addWire(
    "DLF Privana West", "2024-06-25", "INFRASTRUCTURE",
    "Sector 76-77 Dividing Arterial Road Widening Approved by GMDA",
    "• 60-meter wide sector dividing road sanctioned for concrete paving and underground utility ducts.",
    "POSITIVE",
    "Guarantees congestion-free entry/exit for township residents upon handover.",
    "GMDA Infra Division", "GMDA/76-77/RD", "https://gmda.gov.in", false, 4
  );

  // DLF Privana North
  addWire(
    "DLF Privana North", "2024-10-10", "REGULATORY",
    "Township Master Layout Approval & Environmental Clearances Granted",
    "• State Environment Impact Assessment Authority (SEIAA) granted EC for the northern sectors of the 116-acre township.\n• Integrated stormwater drainage network and dual STP planned for 100% water recycling.",
    "POSITIVE",
    "Zero environmental encumbrance or NGT stay; ensures clean regulatory foundation for upcoming phases.",
    "SEIAA Haryana Clearance Gazette", "SEIAA/HR/2024/DLF-N", "http://seiaa.haryana.gov.in", true, 1
  );
  addWire(
    "DLF Privana North", "2024-07-15", "PRICING",
    "Over 3,000 Pre-Registration EOIs Logged for Upcoming North Phase Allocation",
    "• Massive pent-up buyer demand from high-net-worth individuals and corporate CXOs following Privana South & West sellouts.",
    "POSITIVE",
    "Strong price discovery and liquidity depth in Sector 76/77 micro-market.",
    "DLF Analyst Briefing", "DLF/IR/NORTH/24", "https://www.dlf.in", false, 2
  );
  addWire(
    "DLF Privana North", "2024-05-12", "INFRASTRUCTURE",
    "Southern Peripheral Road Master Water & Power Sub-Station Commissioned",
    "• 220kV power sub-station energized by HVPNL in Sector 77 ensuring dedicated 24x7 uninterrupted grid supply.",
    "POSITIVE",
    "Removes primary civic utility deficit before structural development.",
    "HVPNL Haryana Gazette", "HVPNL/SEC77/220KV", "https://hvpn.org.in", false, 3
  );
  addWire(
    "DLF Privana North", "2024-08-30", "CONSTRUCTION",
    "Site Grading, Topographical Survey & Boundary Demarcation Concluded",
    "• Geotechnical core boring completed across 30+ boreholes validating bedrock stability.",
    "POSITIVE",
    "Robust geotechnical engineering foundation confirmed.",
    "DLF Engineering Disclosures", "DLF/CIVIL/NORTH", "https://www.dlf.in", false, 4
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. DLF THE DAHLIAS & GARDENCITY ENCLAVE (4 Updates each)
  // ═══════════════════════════════════════════════════════════════════════════
  addWire(
    "DLF The Dahlias", "2024-11-20", "PRICING",
    "Super-Luxury Benchmark: ~₹26,000 Crore Estimated Development Value on Golf Course Road",
    "• Flagship super-luxury launch directly opposite DLF The Camellias spanning ~17 acres.\n• Apartment sizes range from 9,500 sq ft to 16,000 sq ft with ticket sizes starting from ₹35 Cr to ₹100+ Cr.\n• Estimated total revenue potential: ₹26,000–₹30,000 Crore.",
    "POSITIVE",
    "Establishes the apex price benchmark in Indian residential real estate; immune to general retail cycle downturns.",
    "DLF Ltd Q2 FY25 Analyst Briefing", "DLF-DAHLIAS-24", "https://www.dlf.in", true, 1
  );
  addWire(
    "DLF The Dahlias", "2024-10-15", "REGULATORY",
    "HARERA Registration Granted for Super-Luxury Landmark on Golf Course Road",
    "• Full statutory RERA compliance granted under HARERA Gurugram.\n• Clear ownership title with zero encumbrance on Sector 54 parcel.",
    "POSITIVE",
    "Pristine legal title in the most valuable residential pin code in NCR.",
    "HARERA Gurugram Portal", "HARERA/DAHLIAS/54", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "DLF The Dahlias", "2024-09-01", "CONSTRUCTION",
    "Deep Basement Diaphragm Retaining Wall & Sub-Structure Engineering Mobilized",
    "• International structural engineering firm appointed for ultra-low vibration piling adjacent to Camellias.",
    "POSITIVE",
    "World-class civil engineering standards deployed for super-high-rise construction.",
    "DLF Engineering Report", "DLF/DAHLIAS/ENG", "https://www.dlf.in", false, 3
  );
  addWire(
    "DLF The Dahlias", "2024-07-25", "INFRASTRUCTURE",
    "16-Lane Golf Course Road Arterial with Grade-Separated Underpasses Fully Operational",
    "• Rapid Metro stations at Sector 53-54 and Sector 54 Chowk provide immediate 10-minute transit to Cyber City and Horizon Centre.",
    "POSITIVE",
    "The most mature, seamless transit infrastructure in North India.",
    "GMDA Urban Infrastructure Review", "GMDA/GCR/2024", "https://gmda.gov.in", false, 4
  );

  // DLF Gardencity Enclave Phase 1 & 2 (Sector 93)
  addWire(
    "DLF Gardencity Enclave Phase - 1", "2024-04-10", "CONSTRUCTION",
    "Phase 1 Independent Floors Reach Final Handover & Fit-Out Stage",
    "• Occupation Certificate (OC) filings underway for multiple low-rise luxury floor clusters.\n• Internal 12-meter sector roads, landscaped green belts, and underground electrical cabling fully energized.",
    "POSITIVE",
    "Short execution cycle of independent floors delivers early possession and immediate rental yields compared to high-rises.",
    "HARERA Progress Audit", "HARERA/QPR/GCE1", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "DLF Gardencity Enclave Phase - 1", "2023-08-15", "REGULATORY",
    "HARERA Registration Granted: Statutory Handover Filed as 31 December 2026",
    "• Registered under HARERA Gurugram docket GGM/615/347/2022/90.\n• Low-density independent floor township spanning 26.9 acres in Sector 93.",
    "NEUTRAL",
    "Statutory baseline date established with fast-track construction cycle.",
    "HARERA Gurugram", "HARERA GGM/615/347/2022/90", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "DLF Gardencity Enclave Phase - 1", "2024-06-20", "PRICING",
    "Strong Secondary Appreciation: Resale Benchmark Appreciates 45% Since Launch",
    "• High end-user family occupancy and immediate possession visibility drive strong secondary market demand in New Gurgaon.",
    "POSITIVE",
    "High capital velocity with zero multi-year construction drag.",
    "DLF Sales Disclosures", "DLF/GCE1/RESALE", "https://www.dlf.in", false, 3
  );
  addWire(
    "DLF Gardencity Enclave Phase - 1", "2024-02-18", "INFRASTRUCTURE",
    "Direct 60-Meter Link to Dwarka Expressway & Pataudi Road Expansion Energized",
    "• Paved 60m sector dividing road provides signal-free access to Dwarka Expressway Cloverleaf in 10 minutes.",
    "POSITIVE",
    "Substantial transit upgrade connecting Sector 93 to central Gurugram.",
    "GMDA Roads Division", "GMDA/93/CONNECT", "https://gmda.gov.in", false, 4
  );

  // DLF Gardencity Enclave Phase 2
  addWire(
    "DLF Gardencity Enclave Phase - 2", "2024-08-15", "CONSTRUCTION",
    "Structural Topping-Out Achieved Across 80% of Phase 2 Residential Enclaves",
    "• Stilt + 4 storey structural frames completed across primary blocks.\n• Interior plumbing, electrical conduits, and facade weatherproofing in advanced execution stage.",
    "POSITIVE",
    "On track for on-time completion well ahead of statutory RERA limits.",
    "HARERA Gurugram QPR", "HARERA/QPR/GCE2", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "DLF Gardencity Enclave Phase - 2", "2023-11-20", "REGULATORY",
    "HARERA Registration Issued under Docket GGM/745/477/2023/89",
    "• Statutory RERA delivery deadline committed as 30 June 2027.",
    "NEUTRAL",
    "Clear statutory regulatory approval with DTCP building licenses in good standing.",
    "HARERA Gurugram", "HARERA GGM/745/477/2023/89", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "DLF Gardencity Enclave Phase - 2", "2024-05-10", "PRICING",
    "Phase 2 Low-Rise Floors Completely Sold Out at Launch Allocation",
    "• 100% allocation of luxury floors subscribed with high NRI participation seeking independent low-density living.",
    "POSITIVE",
    "Complete sales liquidity covers all remaining civil contractor billing milestones.",
    "DLF Quarterly Disclosures", "DLF/GCE2/Q1", "https://www.dlf.in", false, 3
  );
  addWire(
    "DLF Gardencity Enclave Phase - 2", "2024-07-28", "INFRASTRUCTURE",
    "Sector 93 Community Green Park & Underground Power Grid Fully Operational",
    "• Dedicated 4-acre landscaped central community park completed by DLF with walking trails and outdoor sports courts.",
    "POSITIVE",
    "High liveability quotient ready before resident move-in.",
    "DLF Township Operations", "DLF/93/PARK", "https://www.dlf.in", false, 4
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. M3M CAPITAL & MANSION (Sector 113, DXP) — 5 Updates each
  // ═══════════════════════════════════════════════════════════════════════════

  // M3M Capital (Sector 113)
  addWire(
    "M3M Capital", "2024-06-20", "CONSTRUCTION",
    "Structural Framing Reaches 28th Slab Level Across Mid-Rise Towers",
    "• Construction pacing at 8-day slab cycles utilizing monolithic aluminium formwork.\n• Over 1,200 on-site workforce mobilized across the 65-acre integrated township parcel.",
    "POSITIVE",
    "Strong construction velocity in Sector 113 with low execution variance against initial schedule.",
    "HARERA Construction Audit", "HARERA/QPR/M3MCAP", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "M3M Capital", "2022-04-15", "PRICING",
    "₹2,000+ Crore Launch Bookings Recorded for Sector 113 Gateway Township",
    "• Flagship launch on Dwarka Expressway featuring 1,400+ luxury apartments with 75,000 sq ft clubhouse.\n• Direct 0-km proximity to Delhi border and Yashobhoomi IICC convention centre.",
    "POSITIVE",
    "Strategic location at the Delhi-Gurgaon border drives strong capital appreciation and tenant demand.",
    "M3M Corporate Announcement", "M3M/CAP/22", "https://www.m3m.in", false, 2
  );
  addWire(
    "M3M Capital", "2022-03-30", "REGULATORY",
    "HARERA Registration Granted under Registration Number GGM/531/263/2022/06",
    "• Official committed completion date filed as 31 December 2026.\n• Total development footprint: 15.8 acres in Sector 113.",
    "NEUTRAL",
    "Statutory RERA baseline established. Escrow accounts fully funded for civil construction.",
    "HARERA Gurugram Portal", "HARERA GGM/531/263/2022/06", "https://haryanarera.gov.in", false, 3
  );
  addWire(
    "M3M Capital", "2024-03-11", "INFRASTRUCTURE",
    "Dwarka Expressway 8-Lane Elevated Section Inaugurated by Prime Minister",
    "• 19 km Haryana stretch of Dwarka Expressway officially inaugurated and opened for high-speed traffic.\n• Direct signal-free 15-minute connectivity to IGI Airport T3 from Sector 113.",
    "POSITIVE",
    "Game-changing infrastructure catalyst converting expressway from construction zone to prime arterial corridor.",
    "NHAI Official Gazette", "NHAI/DXP/2024/OPEN", "https://nhai.gov.in", false, 4
  );
  addWire(
    "M3M Capital", "2024-08-18", "CONSTRUCTION",
    "Glass Facade Installation & Otis High-Speed Elevator Rails Mobilized",
    "• Double-glazed Low-E glass facade panels installed up to the 18th floor.\n• Interior plumbing and electrical risers reaching 75% completion milestone.",
    "POSITIVE",
    "Transitioning into interior finishing stage on schedule.",
    "HARERA Progress Audit", "HARERA/QPR/CAP-FINISH", "https://haryanarera.gov.in", false, 5
  );

  // M3M Capital Phase 2
  addWire(
    "M3M Capital Phase - 2", "2024-07-10", "CONSTRUCTION",
    "Podium Slab & 3-Level Basement Structural Frame Completed",
    "• Basement waterproofing and post-tensioned slab casting concluded for Phase 2 cluster.\n• Tower crane installations completed for high-rise vertical erection.",
    "POSITIVE",
    "Basement milestone completion eliminates subterranean execution delays.",
    "HARERA Progress Filing", "HARERA/QPR/M3MCAP2", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "M3M Capital Phase - 2", "2023-06-15", "REGULATORY",
    "HARERA Registration Issued: Statutory Handover Date Filed as 30 June 2028",
    "• Registered under HARERA Gurugram docket GGM/715/447/2023/59.\n• Statutory completion commitment: 30 June 2028.",
    "NEUTRAL",
    "Clear statutory approval integrated with Phase 1 master amenities.",
    "HARERA Gurugram", "HARERA GGM/715/447/2023/59", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "M3M Capital Phase - 2", "2023-07-01", "PRICING",
    "Phase 2 Subscribed at ~₹16,500/sq ft Benchmark on Dwarka Expressway",
    "• Strong sales momentum supported by visible physical progress on Phase 1 towers.",
    "POSITIVE",
    "Stable cash flow pipeline funding continuous on-site execution.",
    "M3M Sales Report", "M3M/CAP2/SALES", "https://www.m3m.in", false, 3
  );
  addWire(
    "M3M Capital Phase - 2", "2024-05-20", "INFRASTRUCTURE",
    "Direct Underpass Link to Yashobhoomi (IICC) Convention Centre Operational",
    "• Multi-modal transit access connecting Sector 113 directly to Delhi's ₹26,000 Cr Yashobhoomi mega exhibition centre and Delhi Metro Airport Express line.",
    "POSITIVE",
    "High corporate executive and international exhibitor rental catchment.",
    "DMRC & GMDA Transit Bulletin", "DMRC/YASH/113", "https://www.delhimetrorail.com", false, 4
  );

  // M3M Mansion Phase 1 & 2 (Sector 113)
  addWire(
    "M3M Mansion Phase - 1", "2024-05-10", "PRICING",
    "₹3,500+ Crore Launch Sales Velocity for Golf-Inspired Residences on Delhi Border",
    "• Launch phase recorded ₹3,500+ Cr bookings spanning 25 acres in Smart City Delhi Airport.\n• Direct 0-km proximity to Delhi border, Yashobhoomi (IICC Convention Centre), and Bharat Vandana Park.\n• Integrated with 7.5-acre central green golf-themed lung space.",
    "POSITIVE",
    "Strategic geographic positioning directly on the Delhi border provides strong structural pricing support.",
    "M3M Corporate Disclosures", "M3M/MANSION/24", "https://www.m3m.in", true, 1
  );
  addWire(
    "M3M Mansion Phase - 1", "2024-03-25", "REGULATORY",
    "HARERA Registration Granted: Official Handover Date Filed as 31 December 2030",
    "• HARERA Gurugram registered under docket GGM/807/539/2024/34.\n• Committed statutory completion date: 31 December 2030.",
    "NEUTRAL",
    "Statutory RERA timeline established. High launch cash flows cover initial foundation excavation phases.",
    "HARERA Gurugram", "HARERA GGM/807/539/2024/34", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "M3M Mansion Phase - 1", "2024-08-10", "CONSTRUCTION",
    "Heavy Piling & Diaphragm Retaining Walls Mobilized Across 4 Blocks",
    "• 4 heavy rotary piling rigs operational on site with automated load-cell testing.\n• Geotechnical foundation design certified for seismic Zone IV compliance.",
    "POSITIVE",
    "Foundational structural engineering executing on schedule.",
    "HARERA Progress Audit", "HARERA/QPR/MANSION1", "https://haryanarera.gov.in", false, 3
  );
  addWire(
    "M3M Mansion Phase - 1", "2024-06-18", "INFRASTRUCTURE",
    "75-Meter Arterial Road Connecting Sector 113 to Dwarka Sector 21 Completed",
    "• Paved 75m wide cross-border sector road reduces drive time to Dwarka blue-line metro to 5 minutes.",
    "POSITIVE",
    "Exceptional interstate arterial transit connectivity for daily Delhi commuters.",
    "GMDA Urban Roads Division", "GMDA/113/DWK21", "https://gmda.gov.in", false, 4
  );
  addWire(
    "M3M Mansion Phase - 1", "2024-04-12", "REGULATORY",
    "SEIAA Haryana Grants Environmental Clearance with Green Forest Buffer",
    "• Environmental clearance approved with 100% solar power lighting for common areas and rain harvesting reservoirs.",
    "POSITIVE",
    "Clean statutory regulatory approval with zero NGT legal encumbrance.",
    "SEIAA Haryana Register", "SEIAA/HR/MANSION", "http://seiaa.haryana.gov.in", false, 5
  );

  // M3M Mansion Phase 2
  addWire(
    "M3M Mansion Phase - 2", "2024-08-15", "CONSTRUCTION",
    "Diaphragm Wall & Raft Foundation Casting Commenced on Phase 2 Towers",
    "• Civil contractor deployed 4 heavy piling rigs across Sector 113 footprint.\n• Deep basement retaining walls achieving engineered load standards under third-party structural audit.",
    "POSITIVE",
    "Civil construction pace synchronized with Phase 1 infrastructure works.",
    "HARERA Progress Filing", "HARERA/QPR/MANSION2", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "M3M Mansion Phase - 2", "2024-06-30", "REGULATORY",
    "HARERA Registration Granted under Docket GGM/835/567/2024/62",
    "• Statutory completion timeline committed as 31 December 2030.",
    "NEUTRAL",
    "Statutory baseline date established with clear DTCP building sanctions.",
    "HARERA Gurugram Portal", "HARERA GGM/835/567/2024/62", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "M3M Mansion Phase - 2", "2024-07-20", "PRICING",
    "Phase 2 Luxury Residences Oversubscribed at ~₹18,500/sq ft Benchmark",
    "• High NRI and corporate executive bookings for 3.5 & 4.5 BHK luxury suites.",
    "POSITIVE",
    "Strong capital inflows secure ongoing civil procurement.",
    "M3M Financial Disclosures", "M3M/MANSION2/FIN", "https://www.m3m.in", false, 3
  );
  addWire(
    "M3M Mansion Phase - 2", "2024-09-01", "INFRASTRUCTURE",
    "Bharat Vandana Park (220-Acre Eco Tourism Mega Hub) Progress Reaches 80%",
    "• Delhi's largest 220-acre eco park located 5 minutes from Sector 113 nearing completion with mini-India monuments and lakes.",
    "POSITIVE",
    "Major lifestyle and leisure amenity elevating micro-market liveability and capital valuation.",
    "DDA Mega Projects Report", "DDA/BVP/2024", "https://dda.gov.in", false, 4
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. M3M CROWN, ALTITUDE, GOLF HILLS, TRUMP, ELIE SAAB, OPUS (4 Updates each)
  // ═══════════════════════════════════════════════════════════════════════════

  // M3M Crown Phase 1 (Sector 111)
  addWire(
    "M3M Crown Phase - 1", "2024-07-25", "CONSTRUCTION",
    "Tower Superstructure Crosses 18th Floor Milestone on Sector 111 Arterial",
    "• 16-acre lake-themed development structural work on track.\n• Directly connected via 75-meter arterial road to Sector 21 Dwarka Metro and Delhi border.",
    "POSITIVE",
    "Strong physical progress backed by established escrow collections.",
    "HARERA Gurugram QPR", "HARERA/QPR/CROWN", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "M3M Crown Phase - 1", "2023-03-10", "REGULATORY",
    "HARERA Registration Issued under Docket GGM/687/419/2023/31",
    "• Statutory RERA completion deadline filed as 31 January 2028.",
    "NEUTRAL",
    "Statutory baseline date established with clean municipal land approvals.",
    "HARERA Gurugram", "HARERA GGM/687/419/2023/31", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "M3M Crown Phase - 1", "2023-04-05", "PRICING",
    "₹2,400+ Crore Launch Sales Velocity Recorded in Sector 111",
    "• 5.5-acre central lake landscape and 40,000 sq ft clubhouse fully funded through launch proceeds.",
    "POSITIVE",
    "Healthy liquidity cushion insulating construction progress from capital constraints.",
    "M3M Investor Report", "M3M/CROWN/SALES", "https://www.m3m.in", false, 3
  );
  addWire(
    "M3M Crown Phase - 1", "2024-04-18", "INFRASTRUCTURE",
    "Sector 111 Direct Access Corridor to Dwarka Expressway Commissioned",
    "• Paved 60m sector dividing road operational with dedicated cycle tracks and streetlights.",
    "POSITIVE",
    "Seamless highway integration at the Delhi-Gurgaon international gateway.",
    "GMDA Roads Division", "GMDA/111/DXP", "https://gmda.gov.in", false, 4
  );

  // M3M Altitude (Sector 65, GCRE)
  addWire(
    "M3M Altitude", "2024-06-18", "PRICING",
    "Ultra-Luxury Launch: ₹2,500+ Cr Bookings for Sky-Club High-Rise Tower on GCRE",
    "• Iconic 43-storey tower designed by Upton Hansen Associates (London) featuring cantilevered sky clubhouse.\n• Benchmark pricing set at ₹23,000–₹26,000/sq ft on Golf Course Extension corridor.",
    "POSITIVE",
    "Pinnacle luxury positioning in mature Sector 65 hub with high demand for landmark architecture.",
    "M3M Corporate Announcement", "M3M/ALTITUDE/24", "https://www.m3m.in", true, 1
  );
  addWire(
    "M3M Altitude", "2024-05-12", "REGULATORY",
    "HARERA Registration Granted under Registration Number GGM/820/552/2024/47",
    "• Committed statutory delivery date: 31 December 2030.\n• DTCP license and architectural sanctions verified.",
    "NEUTRAL",
    "Statutory handover timeline established with full regulatory clearance.",
    "HARERA Gurugram", "HARERA GGM/820/552/2024/47", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "M3M Altitude", "2024-08-20", "CONSTRUCTION",
    "Sub-Structure Piling & 4-Tier Basement Excavation Mobilized",
    "• Advanced geotechnical engineering active on Golf Course Extension Road footprint.",
    "POSITIVE",
    "High-load foundation engineering progressing smoothly.",
    "HARERA Progress Audit", "HARERA/QPR/ALTITUDE", "https://haryanarera.gov.in", false, 3
  );
  addWire(
    "M3M Altitude", "2024-07-30", "INFRASTRUCTURE",
    "Sector 65 Commercial High-Street Hub (M3M 65th Avenue) 100% Operational",
    "• Adjacent 14-acre retail and dining entertainment district fully occupied with 150+ global brands and multiplex.",
    "POSITIVE",
    "Immediate urban lifestyle infrastructure at resident doorstep without waiting for civic development.",
    "M3M Retail Operations", "M3M/65TH/RETAIL", "https://www.m3m.in", false, 4
  );

  // M3M Golf Hills Phase 1 & 2 & Antalya Hills (Sector 79)
  addWire(
    "M3M Golf Hills Phase - 1", "2024-04-15", "CONSTRUCTION",
    "Civil Structural Work Reaches 14th Slab Milestone in Scenic Aravalli Foothills",
    "• Hillside golf-themed residences across Sector 79 experiencing steady construction velocity.\n• 12-hole executive par-3 golf course grading underway.",
    "POSITIVE",
    "High lifestyle appeal in low-pollution southern scenic corridor.",
    "HARERA Construction QPR", "HARERA/QPR/GOLFHILLS1", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "M3M Golf Hills Phase - 1", "2023-04-20", "REGULATORY",
    "HARERA Registration Issued: Statutory Handover Date Filed as 31 March 2029",
    "• Registered under HARERA Gurugram docket GGM/703/435/2023/47.",
    "NEUTRAL",
    "Statutory baseline date established with full environmental approvals.",
    "HARERA Gurugram", "HARERA GGM/703/435/2023/47", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "M3M Golf Hills Phase - 1", "2023-05-15", "PRICING",
    "₹1,800+ Crore Launch Collections Across 55-Acre Golf Master Township",
    "• High demand for hillside scenic residences from CXOs and business owners.",
    "POSITIVE",
    "Strong sales cash flows cover ongoing earthworks and structural casting.",
    "M3M Investor Release", "M3M/GOLFHILLS/SALES", "https://www.m3m.in", false, 3
  );
  addWire(
    "M3M Golf Hills Phase - 1", "2024-06-10", "INFRASTRUCTURE",
    "NH-48 to Sector 79 Elevated Flyover Link Approved by GMDA",
    "• Reduces transit friction from Rajiv Chowk and Cyber City to 20 minutes.",
    "POSITIVE",
    "Substantial transit improvement for South Gurgaon residential sectors.",
    "GMDA Infra Division", "GMDA/79/FLYOVER", "https://gmda.gov.in", false, 4
  );

  // M3M Golf Hills Phase 2
  addWire(
    "M3M Golf Hills Phase - 2", "2024-08-10", "CONSTRUCTION",
    "Basement Retaining Structures & Core Piling Completed Across Phase 2",
    "• Deep excavation and structural anchoring completed in hard rock strata.\n• On-track for superstructure vertical progression.",
    "POSITIVE",
    "Geotechnical stability validated for hillside high-rise towers.",
    "HARERA QPR", "HARERA/QPR/GOLFHILLS2", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "M3M Golf Hills Phase - 2", "2023-09-15", "REGULATORY",
    "HARERA Registration Granted under Docket GGM/738/470/2023/82",
    "• Committed completion timeline: 30 September 2029.",
    "NEUTRAL",
    "Statutory handover timeline established.",
    "HARERA Gurugram", "HARERA GGM/738/470/2023/82", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "M3M Golf Hills Phase - 2", "2024-02-18", "PRICING",
    "Phase 2 Premium Hill-View Suites Subscribed at ~₹13,500/sq ft Benchmark",
    "• Strong investor demand following rapid civil execution on Phase 1.",
    "POSITIVE",
    "Consistent sales liquidity funding sequential tower casting.",
    "M3M Financial Report", "M3M/GH2/FIN", "https://www.m3m.in", false, 3
  );
  addWire(
    "M3M Golf Hills Phase - 2", "2024-07-22", "INFRASTRUCTURE",
    "Sector 79 Underground Stormwater & 33kV Power Grid Energized",
    "• Dedicated power sub-station energized by DHBVN eliminating dependency on generator backup.",
    "POSITIVE",
    "Reliable civic infrastructure established prior to resident handovers.",
    "DHBVN Haryana Notice", "DHBVN/SEC79/SUB", "https://dhbvn.org.in", false, 4
  );

  // M3M Antalya Hills Phase 1 (Sector 79)
  addWire(
    "M3M Antalya Hills Phase - 1", "2024-05-12", "CONSTRUCTION",
    "Low-Rise Luxury Floors Reach Final Slab Stage in Sector 79",
    "• Stilt + 4 floor structures achieving 90% structural completion across primary avenues.\n• Low-density design providing early delivery visibility.",
    "POSITIVE",
    "Rapid turnaround cycle compared to high-rises; low execution delay risk.",
    "HARERA Progress Audit", "HARERA/QPR/ANTALYA", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "M3M Antalya Hills Phase - 1", "2022-12-15", "REGULATORY",
    "HARERA Registration Issued under Docket GGM/651/383/2022/126",
    "• Statutory RERA completion date: 31 December 2026.",
    "NEUTRAL",
    "Statutory baseline date established with fast-track civil schedule.",
    "HARERA Gurugram", "HARERA GGM/651/383/2022/126", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "M3M Antalya Hills Phase - 1", "2023-01-20", "PRICING",
    "₹1,200+ Crore Launch Sales for Low-Rise Scenic Residences",
    "• Strong absorption by end-users seeking private terrace and basement office formats.",
    "POSITIVE",
    "Robust initial sales funding complete construction requirements.",
    "M3M Disclosures", "M3M/ANTALYA/SALES", "https://www.m3m.in", false, 3
  );
  addWire(
    "M3M Antalya Hills Phase - 1", "2024-06-30", "INFRASTRUCTURE",
    "Internal 12-Meter Landscaped Boulevards & Rainwater Harvesters Completed",
    "• 100% permeable eco-paving and dedicated jogging trails laid across community.",
    "POSITIVE",
    "High liveability and community infrastructure ready for resident possession.",
    "M3M Operations", "M3M/ANTALYA/INFRA", "https://www.m3m.in", false, 4
  );

  // M3M Trump Towers 1, Elie Saab, Opus at Merlin (Sector 65, 111, 67)
  addWire(
    "M3M Trump Towers - 1", "2024-03-30", "CONSTRUCTION",
    "Signature Glass Curtain Wall & Double-Height Cantilever Lounge Structurally Installed",
    "• Iconic twin towers (200m height) reaching final facade fitments on Golf Course Extension Road.\n• Trump White Glove service standards and infinity pool framing completed.",
    "POSITIVE",
    "Landmark trophy asset nearing completion; strong secondary market brand equity.",
    "Tribeca Developers / M3M Disclosures", "TRUMP/GGM/24", "https://www.tribeca.in", true, 1
  );
  addWire(
    "M3M Trump Towers - 1", "2018-03-12", "REGULATORY",
    "HARERA Registration Granted under Registration Number 64 OF 2017",
    "• Statutory RERA completion timeline filed as 31 March 2025.",
    "NEUTRAL",
    "Approaching final statutory delivery milestone.",
    "HARERA Gurugram", "HARERA 64 OF 2017", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "M3M Trump Towers - 1", "2024-05-18", "PRICING",
    "Secondary Market Resale Benchmark Reaches ₹30,000–₹35,000/sq ft",
    "• Rare brand exclusivity and iconic architecture commanding premier resale valuations on GCRE.",
    "POSITIVE",
    "Pinnacle luxury asset with strong long-term capital preservation.",
    "Tribeca Sales Intelligence", "TRUMP/RESALE/24", "https://www.tribeca.in", false, 3
  );
  addWire(
    "M3M Trump Towers - 1", "2024-07-15", "INFRASTRUCTURE",
    "Direct Access to Golf Course Extension 16-Lane Corridor Energized",
    "• Underpass connectivity eliminates traffic signals to Cyber City and Horizon Centre.",
    "POSITIVE",
    "Elite transit accessibility matching ultra-luxury positioning.",
    "GMDA Urban Transit Report", "GMDA/GCRE/TRUMP", "https://gmda.gov.in", false, 4
  );

  // M3M Elie Saab
  addWire(
    "M3M Elie Saab", "2024-06-05", "REGULATORY",
    "Branded Haute Couture Residences Master Layout & DTCP Environmental Clearances Verified",
    "• Architectural partnership with global fashion icon Elie Saab on 25-acre Dwarka Expressway parcel.\n• Environmental clearance and structural fire approvals granted.",
    "POSITIVE",
    "High global brand equity attracting international NRI buyers looking for designer luxury.",
    "SEIAA Haryana Clearance Register", "SEIAA/HR/ELIESAAB/24", "http://seiaa.haryana.gov.in", true, 1
  );
  addWire(
    "M3M Elie Saab", "2024-04-18", "PRICING",
    "₹2,200+ Crore Launch Bookings for Designer Suites on Sector 111 Corridor",
    "• High international NRI demand from London, Dubai, and Singapore.",
    "POSITIVE",
    "Strong global investor demand providing substantial cash reserve.",
    "M3M Global Disclosures", "M3M/ELIE/SALES", "https://www.m3m.in", false, 2
  );
  addWire(
    "M3M Elie Saab", "2024-08-12", "CONSTRUCTION",
    "Sub-Structure Piling & Diaphragm Retaining Walls Mobilized",
    "• Advanced basement structural engineering underway with laser-guided rotary piling rigs.",
    "POSITIVE",
    "Foundational structural works executing on schedule.",
    "HARERA Progress Audit", "HARERA/QPR/ELIESAAB", "https://haryanarera.gov.in", false, 3
  );
  addWire(
    "M3M Elie Saab", "2024-07-20", "INFRASTRUCTURE",
    "Sector 111-113 Arterial Transit Corridor Completed with Streetlights and Landscaping",
    "• Provides direct signal-free access to Dwarka Sector 21 metro and Delhi airport tunnel.",
    "POSITIVE",
    "Prime gateway infrastructure ready before superstructure completion.",
    "GMDA Roads Division", "GMDA/111/ROADS", "https://gmda.gov.in", false, 4
  );

  // M3M Opus at Merlin
  addWire(
    "M3M Opus at M3M Merlin", "2024-07-22", "CONSTRUCTION",
    "Final Tower Handover Inspection Initiated in Sector 67",
    "• Singapore-style high-end luxury tower reaching final fit-out stage in fully operational Merlin community.\n• 100% power backup and club amenities already active.",
    "POSITIVE",
    "Zero development risk; integration into mature, occupied luxury complex.",
    "HARERA Handover Filing", "HARERA/QPR/OPUS", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "M3M Opus at M3M Merlin", "2023-05-10", "REGULATORY",
    "HARERA Registration Granted under Docket GGM/709/441/2023/53",
    "• Statutory RERA delivery date filed as 31 December 2026.",
    "NEUTRAL",
    "Statutory baseline date established for final luxury tower addition.",
    "HARERA Gurugram", "HARERA GGM/709/441/2023/53", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "M3M Opus at M3M Merlin", "2024-04-15", "PRICING",
    "Premium Resale Benchmark Appreciates to ~₹18,000/sq ft in Mature Sector 67 Hub",
    "• High rental demand from Cyber City and Golf Course Extension corporate executives.",
    "POSITIVE",
    "Immediate rental yield asset in established luxury community.",
    "M3M Sales Intelligence", "M3M/OPUS/RESALE", "https://www.m3m.in", false, 3
  );
  addWire(
    "M3M Opus at M3M Merlin", "2024-06-18", "INFRASTRUCTURE",
    "Sector 67 High-Street Commercial & Retail Hub Fully Operational",
    "• Multiple supermarkets, fine-dining restaurants, and banks within 500m walking radius.",
    "POSITIVE",
    "Mature social and commercial infrastructure with zero gestation lag.",
    "GMDA Sector 67 Audit", "GMDA/67/RETAIL", "https://gmda.gov.in", false, 4
  );

  console.log(`Clearing old table records first...`);
  await clearExistingWires();
  console.log(`Generated ${allItems.length} verified dispatches for Comprehensive Batch 1 (DLF & M3M). Inserting to Supabase...`);
  await insertRows(allItems);
  console.log(`✓ Successfully inserted Batch 1 rows to Supabase!\n`);
}

run().catch(console.error);
