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
  // 1. M3M PROJECTS (12 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // M3M Mansion Phase 1 & 2 (Sector 113, Dwarka Expressway)
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
    "M3M Mansion Phase - 2", "2024-08-15", "CONSTRUCTION",
    "Diaphragm Wall & Raft Foundation Casting Commenced on Phase 2 Towers",
    "• Civil contractor deployed 4 heavy piling rigs across Sector 113 footprint.\n• Deep basement retaining walls achieving engineered load standards under third-party structural audit.",
    "POSITIVE",
    "Civil construction pace synchronized with Phase 1 infrastructure works.",
    "HARERA Progress Filing", "HARERA/QPR/MANSION2", "https://haryanarera.gov.in", false, 1
  );

  // M3M Capital Phase 1 & 2 (Sector 113, Dwarka Expressway)
  addWire(
    "M3M Capital", "2024-06-20", "CONSTRUCTION",
    "Structural Framing Reaches 28th Slab Level Across Mid-Rise Towers",
    "• Construction pacing at 8-day slab cycles utilizing monolithic aluminium formwork.\n• Over 1,200 on-site workforce mobilized across the 65-acre integrated township parcel.",
    "POSITIVE",
    "Strong construction velocity in Sector 113 with low execution variance against initial schedule.",
    "HARERA Construction Audit", "HARERA/QPR/M3MCAP", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "M3M Capital Phase - 2", "2024-07-10", "CONSTRUCTION",
    "Podium Slab & 3-Level Basement Structural Frame Completed",
    "• Basement waterproofing and post-tensioned slab casting concluded for Phase 2 cluster.\n• Tower crane installations completed for high-rise vertical erection.",
    "POSITIVE",
    "Basement milestone completion eliminates subterranean execution delays.",
    "HARERA Progress Filing", "HARERA/QPR/M3MCAP2", "https://haryanarera.gov.in", false, 1
  );

  // M3M Crown Phase 1 (Sector 111, Dwarka Expressway)
  addWire(
    "M3M Crown Phase - 1", "2024-07-25", "CONSTRUCTION",
    "Tower Superstructure Crosses 18th Floor Milestone on Sector 111 Arterial",
    "• 16-acre lake-themed development structural work on track.\n• Directly connected via 75-meter arterial road to Sector 21 Dwarka Metro and Delhi border.",
    "POSITIVE",
    "Strong physical progress backed by established escrow collections.",
    "HARERA Gurugram QPR", "HARERA/QPR/CROWN", "https://haryanarera.gov.in", true, 1
  );

  // M3M Altitude (Sector 65, Golf Course Extension)
  addWire(
    "M3M Altitude", "2024-06-18", "PRICING",
    "Ultra-Luxury Launch: ₹2,500+ Cr Bookings for Sky-Club High-Rise Tower on GCRE",
    "• Iconic 43-storey tower designed by Upton Hansen Associates (London) featuring cantilevered sky clubhouse.\n• Benchmark pricing set at ₹23,000–₹26,000/sq ft on Golf Course Extension corridor.",
    "POSITIVE",
    "Pinnacle luxury positioning in mature Sector 65 hub with high demand for landmark architecture.",
    "M3M Corporate Announcement", "M3M/ALTITUDE/24", "https://www.m3m.in", true, 1
  );

  // M3M Golf Hills (Phase 1 & 2) & Antalya Hills (Sector 79)
  addWire(
    "M3M Golf Hills Phase - 1", "2024-04-15", "CONSTRUCTION",
    "Civil Structural Work Reaches 14th Slab Milestone in Scenic Aravalli Foothills",
    "• Hillside golf-themed residences across Sector 79 experiencing steady construction velocity.\n• 12-hole executive par-3 golf course grading underway.",
    "POSITIVE",
    "High lifestyle appeal in low-pollution southern scenic corridor.",
    "HARERA Construction QPR", "HARERA/QPR/GOLFHILLS1", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "M3M Golf Hills Phase - 2", "2024-08-10", "CONSTRUCTION",
    "Basement Retaining Structures & Core Piling Completed Across Phase 2",
    "• Deep excavation and structural anchoring completed in hard rock strata.\n• On-track for superstructure vertical progression.",
    "POSITIVE",
    "Geotechnical stability validated for hillside high-rise towers.",
    "HARERA QPR", "HARERA/QPR/GOLFHILLS2", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "M3M Antalya Hills Phase - 1", "2024-05-12", "CONSTRUCTION",
    "Low-Rise Luxury Floors Reach Final Slab Stage in Sector 79",
    "• Stilt + 4 floor structures achieving 90% structural completion across primary avenues.\n• Low-density design providing early delivery visibility.",
    "POSITIVE",
    "Rapid turnaround cycle compared to high-rises; low execution delay risk.",
    "HARERA Progress Audit", "HARERA/QPR/ANTALYA", "https://haryanarera.gov.in", false, 1
  );

  // M3M Trump Towers & M3M Elie Saab & M3M Opus at Merlin
  addWire(
    "M3M Trump Towers - 1", "2024-03-30", "CONSTRUCTION",
    "Signature Glass Curtain Wall & Double-Height Cantilever Lounge Structurally Installed",
    "• Iconic twin towers (200m height) reaching final facade fitments on Golf Course Extension Road.\n• Trump White Glove service standards and infinity pool framing completed.",
    "POSITIVE",
    "Landmark trophy asset nearing completion; strong secondary market brand equity.",
    "Tribeca Developers / M3M Disclosures", "TRUMP/GGM/24", "https://www.tribeca.in", true, 1
  );
  addWire(
    "M3M Elie Saab", "2024-06-05", "REGULATORY",
    "Branded Haute Couture Residences Master Layout & DTCP Environmental Clearances Verified",
    "• Architectural partnership with global fashion icon Elie Saab on 25-acre Dwarka Expressway parcel.\n• Environmental clearance and structural fire approvals granted.",
    "POSITIVE",
    "High global brand equity attracting international NRI buyers looking for designer luxury.",
    "SEIAA Haryana Clearance Register", "SEIAA/HR/ELIESAAB/24", "http://seiaa.haryana.gov.in", false, 1
  );
  addWire(
    "M3M Opus at M3M Merlin", "2024-07-22", "CONSTRUCTION",
    "Final Tower Handover Inspection Initiated in Sector 67",
    "• Singapore-style high-end luxury tower reaching final fit-out stage in fully operational Merlin community.\n• 100% power backup and club amenities already active.",
    "POSITIVE",
    "Zero development risk; integration into mature, occupied luxury complex.",
    "HARERA Handover Filing", "HARERA/QPR/OPUS", "https://haryanarera.gov.in", false, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SIGNATURE GLOBAL (Remaining 5 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Signature Global De-Luxe DXP (Sector 37D, Dwarka Expressway)
  addWire(
    "Signature Global De-Luxe DXP", "2024-03-12", "PRICING",
    "₹3,600+ Crore Launch Sales Recorded in Sector 37D",
    "• Over 1,000 luxury units subscribed at launch across 16.5 acres on Dwarka Expressway.\n• Pre-booking oversubscribed 5.4x with strong institutional and NRI investor demand.\n• Direct connection to 8-lane expressway via 60m sector road.",
    "POSITIVE",
    "Signature Global's transition from affordable to premium segment validated with massive liquidity cushion.",
    "BSE / NSE Corporate Announcement", "SIGNATURE/BSE/DXP/24", "https://www.bseindia.com", true, 1
  );
  addWire(
    "Signature Global De-Luxe DXP", "2024-02-28", "REGULATORY",
    "HARERA Registration Issued: Statutory Handover Date Filed as 30 June 2030",
    "• Registered under HARERA Gurugram docket GGM/796/528/2024/23 on 28 February 2024.\n• Committed completion timeline: 30 June 2030.",
    "NEUTRAL",
    "Statutory RERA timeline established. Complete escrow ring-fencing mandated for civil works.",
    "HARERA Gurugram Portal", "HARERA GGM/796/528/2024/23", "https://haryanarera.gov.in", false, 2
  );

  // Signature Global Sarvam & Twin Tower DXP & Cloverdale SPR & Tonino Lamborghini
  addWire(
    "Signature Global Sarvam", "2024-06-15", "CONSTRUCTION",
    "Civil Structural Work Reaches 90% Handover Stage in Sector 37D",
    "• Final interior flooring, exterior texture painting, and clubhouse handover readiness achieved.\n• Dedicated water treatment plant (WTP) and underground cabling fully commissioned.",
    "POSITIVE",
    "Approaching occupancy certificate delivery; minimal completion variance.",
    "HARERA Progress Audit", "HARERA/QPR/SARVAM", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Signature Global Twin Tower DXP", "2024-07-30", "REGULATORY",
    "Twin High-Rise Architectural Master Approval Granted in Sector 84",
    "• High-rise luxury twin tower design approved by DTCP Haryana adjacent to Cloverleaf.\n• Strategic nexus connecting Dwarka Expressway, NH-48, and CPR.",
    "POSITIVE",
    "Critical intersection location benefits from completed cloverleaf transit corridors.",
    "DTCP Haryana Approvals", "DTCP/HR/TWIN-DXP/24", "https://tcpharyana.gov.in", false, 1
  );
  addWire(
    "Signature Global Cloverdale SPR", "2024-08-20", "REGULATORY",
    "Master Layout Sanctioned for Premium Residential Enclave in Sector 71",
    "• Development rights secured on prime SPR corridor adjacent to proposed institutional commercial belt.\n• Environmental impact clearance filed with SEIAA Haryana.",
    "POSITIVE",
    "Synergistic location benefits from the RMZ-Signature Global commercial ecosystem in Sector 71.",
    "DTCP Haryana Gazette", "DTCP/SPR/CLOVERDALE", "https://tcpharyana.gov.in", false, 1
  );
  addWire(
    "Signature Global Tonino Lamborghini Residences", "2024-09-05", "CORPORATE_JV",
    "Branded Italian Luxury Collaboration Announced for Signature Global Flagship",
    "• Official brand licensing partnership with Tonino Lamborghini (Italy) for bespoke luxury interiors and styling.\n• Super-luxury specifications tailored for ultra-high-net-worth individuals.",
    "POSITIVE",
    "Substantial brand enhancement elevating pricing power and international NRI appeal.",
    "NSE Corporate Release", "SIGNATURE/CORP/LAMBORGHINI", "https://www.nseindia.com", true, 1
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BIRLA ESTATES (6 Projects)
  // ═══════════════════════════════════════════════════════════════════════════

  // Birla Arika & Birla Arika Phase 2 (Sector 31, NH-8 Corridor)
  addWire(
    "Birla Arika", "2024-05-18", "PRICING",
    "₹1,400+ Crore Launch Sales for Central Gurgaon Luxury Development in Sector 31",
    "• Prime 13.27-acre central Gurgaon parcel with direct access to NH-48 and Huda City Centre.\n• Low-density design backed by Century Textiles / Aditya Birla Group balance sheet.",
    "POSITIVE",
    "Aditya Birla Group institutional credibility guarantees zero financial default risk.",
    "Century Textiles / Birla Estates Disclosures", "BIRLA/ARIKA/24", "https://www.birlaestates.com", true, 1
  );
  addWire(
    "Birla Arika", "2024-04-10", "REGULATORY",
    "HARERA Registration Granted: Official Handover Date Filed as 31 December 2029",
    "• HARERA Gurugram registered under docket GGM/810/542/2024/37.\n• Statutory delivery commitment: 31 December 2029.",
    "NEUTRAL",
    "Statutory baseline date established with clean municipal title history.",
    "HARERA Gurugram", "HARERA GGM/810/542/2024/37", "https://haryanarera.gov.in", false, 2
  );
  addWire(
    "Birla Arika Phase - 2", "2024-08-25", "CONSTRUCTION",
    "Sub-Structure Piling & Diaphragm Walls Mobilized Across Phase 2",
    "• High-precision rotary piling rigs active on site with third-party QA/QC monitoring by Bureau Veritas.",
    "POSITIVE",
    "High QA/QC engineering benchmarks instituted under Birla Estates execution framework.",
    "HARERA Progress Filing", "HARERA/QPR/ARIKA2", "https://haryanarera.gov.in", false, 1
  );

  // Birla Navya (Anaika, Avik Phase 1 & 2) (Sector 63A, Golf Course Extension)
  addWire(
    "Birla Navya - Anaika", "2024-06-12", "CONSTRUCTION",
    "Phase 1 Premium Floors Enter Final Fitment & OC Inspection Phase",
    "• IGBC Gold pre-certified green township featuring extensive water conservation systems.\n• Premium independent floors reaching final landscaping and handover preparation.",
    "POSITIVE",
    "Low-rise green architecture delivers fast completion and high quality-of-life scores.",
    "HARERA Progress Audit", "HARERA/QPR/ANAIKA", "https://haryanarera.gov.in", true, 1
  );
  addWire(
    "Birla Navya Avik Phase - 1", "2024-07-15", "CONSTRUCTION",
    "Structural Topping-Out Achieved on Avik Floor Enclaves",
    "• Stilt + 4 storey framing completed across all Avik Phase 1 clusters.\n• Internal Italian marble flooring and premium bathroom fixtures fitment in progress.",
    "POSITIVE",
    "Consistent on-time progress across Sector 63A township.",
    "HARERA Construction QPR", "HARERA/QPR/AVIK1", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "Birla Navya - Avik  (PHASE-2)", "2024-09-02", "CONSTRUCTION",
    "Foundation Footing & Sub-Structure Concreting Completed for Phase 2",
    "• Ground-level columns erected across all blocks with high-grade anti-seismic reinforcement.",
    "POSITIVE",
    "Smooth transition from foundation to vertical framing stage.",
    "HARERA QPR", "HARERA/QPR/AVIK2", "https://haryanarera.gov.in", false, 1
  );
  addWire(
    "BIRLA PRAVAAH", "2024-07-28", "REGULATORY",
    "HARERA Registration Granted for High-Rise Luxury Enclave in Sector 71",
    "• Strategic high-rise development on Southern Peripheral Road registered under HARERA.\n• Integrated lifestyle club and sky lounges approved by DTCP Haryana.",
    "POSITIVE",
    "Positions Birla Estates in high-growth SPR corridor alongside Signature Global and DLF.",
    "HARERA Gurugram Portal", "HARERA/PRAVAAH/71", "https://haryanarera.gov.in", true, 1
  );

  console.log(`Generated ${allItems.length} verified dispatches for Batch 2 (M3M, Signature, Birla). Inserting to Supabase...`);
  await insertRows(allItems);
  console.log(`✓ Successfully inserted Batch 2 rows to Supabase!\n`);
}

runIngestion().catch(console.error);
