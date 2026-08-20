/* ════════════════════════════════════════════════════════════════
   APARTMENT CLUSTERS — Programmatic SEO & GEO Landing Pages

   High-intent query clusters for luxury & premium buyers in Gurugram:
   - Typologies: 3 BHK, 4 BHK, 5 BHK, Penthouses, Duplex, Luxury
   - Typology + Budget: e.g. 4 BHK under 5 Cr, 3 BHK under 3 Cr
   - Typology + Corridor: e.g. 4 BHK on Golf Course Ext, Penthouses on Golf Course Rd
   - Combinations: e.g. 4 BHK on Dwarka Expressway under 5 Cr
   ════════════════════════════════════════════════════════════════ */

import type { ProjectIntel } from "./projects";

export type ApartmentFaq = {
  q: string;
  a: string;
};

export type ApartmentClusterMeta = {
  slug: string;
  h1: string;
  badge: string;
  title: string;
  description: string;
  intro: string;
  metaSummary: string;
  faqs: ApartmentFaq[];
  pricePage?: boolean;
};

export type ApartmentCluster = ApartmentClusterMeta & {
  match: (p: ProjectIntel) => boolean;
};

/* Helper predicates operating on ProjectIntel (with full filed unit configs) */
const hasConfig = (needle: string) => (p: ProjectIntel) => {
  const n = needle.toLowerCase();
  const cfgs = (p.configs ?? []).map((c) => c.toLowerCase());
  const homes = (p.ops?.homes ?? []).map((h) => h.config.toLowerCase());
  const all = [...cfgs, ...homes, p.name.toLowerCase()].join(" ");
  if (n === "penthouse") return all.includes("penthouse");
  if (n === "duplex") return all.includes("duplex");
  if (n === "4 bhk") return all.includes("4 bhk") || all.includes("4bhk") || all.includes("4.5");
  if (n === "3 bhk") return all.includes("3 bhk") || all.includes("3bhk") || all.includes("3.5");
  if (n === "5 bhk") return all.includes("5 bhk") || all.includes("5bhk") || all.includes("5.5");
  if (n === "luxury") return (p.truthScore ?? 0) >= 70 || (p.budget?.[0] ?? 0) >= 4;
  return all.includes(n);
};

const hasCorridor = (needle: string) => (p: ProjectIntel) => {
  const m = (p.market || "").toLowerCase();
  const ms = (p.marketShort || "").toLowerCase();
  const n = needle.toLowerCase();
  return m.includes(n) || ms.includes(n);
};

const underCr = (cap: number) => (p: ProjectIntel) => {
  const low = p.budget?.[0] ?? (p.ops?.price?.currentLow ? (p.ops.price.currentLow * 2000) / 1e7 : 0);
  return low > 0 && low <= cap;
};

const aboveCr = (floor: number) => (p: ProjectIntel) => {
  const low = p.budget?.[0] ?? (p.ops?.price?.currentLow ? (p.ops.price.currentLow * 2000) / 1e7 : 0);
  return low >= floor;
};

/* Programmatic Clusters */
export const APARTMENT_CLUSTERS: ApartmentCluster[] = [
  /* ─────────────────────────────────────────────────────────────
     1. TYPOLOGY CLUSTERS (GURUGRAM WIDE)
     ───────────────────────────────────────────────────────────── */
  {
    slug: "4-bhk-apartments-gurugram",
    h1: "4 BHK Apartments in Gurugram",
    badge: "80+ Tracked Luxury Projects",
    title: "4 BHK Apartments in Gurugram (2026 Audit) — Ranked by TruthScore & ₹/sq ft | Truth Estate",
    description: "Compare verified 4 BHK luxury apartments in Gurugram. Independently audited for RERA risk, real filed ₹/sq ft rates, daylight layout analysis, and developer track record. Zero broker spam.",
    intro: "Every tracked 4 BHK residential project in Gurugram — independently scored on delivery track record, legal filings, developer financial health, liquidity, and fair-price bands. No developer pays to rank.",
    metaSummary: "4 BHK luxury configurations in Gurugram range from 2,600 to 4,200 sq ft, with average trading rates spanning ₹18,000 to ₹38,000/sq ft across major luxury corridors.",
    faqs: [
      {
        q: "What is the typical super area for a 4 BHK apartment in Gurugram?",
        a: "In Gurugram's luxury segment (Dwarka Expressway, Golf Course Ext Road, SPR), 4 BHK units typically span between 2,800 sq ft and 4,200 sq ft super built-up area, providing 1,800 to 2,700 sq ft carpet area.",
      },
      {
        q: "Which corridors offer the best 4 BHK apartments in Gurugram?",
        a: "Golf Course Extension Road and Golf Course Road lead the ultra-luxury 4 BHK segment (DLF, Smartworld, M3M), while Dwarka Expressway and SPR offer strong high-appreciation options under ₹5–6 Cr.",
      },
      {
        q: "How does Truth Estate audit 4 BHK projects?",
        a: "Every project undergoes 150+ forensic checks across 6 pillars: Delivery Pace against RERA, Legal Encumbrances, Developer Financial Health, Secondary Market Liquidity, Pricing Credibility, and Layout/Facing Orientation.",
      },
    ],
    match: hasConfig("4 bhk"),
  },
  {
    slug: "3-bhk-apartments-gurugram",
    h1: "3 BHK Apartments in Gurugram",
    badge: "83+ Verified Projects",
    title: "3 BHK Apartments in Gurugram (2026 Verified Rates) — Scored & Ranked | Truth Estate",
    description: "Explore 3 BHK luxury & premium apartments across Gurugram. Audited on construction velocity, RERA filings, carpet area efficiency, and price credibility. 100% neutral.",
    intro: "All tracked 3 BHK residential projects across Gurugram. Filtered by verified builder rates, construction milestones, and layout efficiency. Unbiased intelligence with zero sales bias.",
    metaSummary: "3 BHK homes in Gurugram span 1,600 to 2,500 sq ft super area, offering entry price points from ₹1.8 Cr to ₹4.5 Cr across high-growth and established corridors.",
    faqs: [
      {
        q: "What is the average price of a 3 BHK apartment in Gurugram in 2026?",
        a: "A quality 3 BHK in Gurugram generally costs between ₹1.8 Cr and ₹3.2 Cr on Dwarka Expressway & New Gurgaon, and ₹3.5 Cr to ₹5.5 Cr on Golf Course Extension Road.",
      },
      {
        q: "What carpet area should I expect in a 3 BHK?",
        a: "Typical 3 BHK units deliver between 1,100 and 1,650 sq ft of usable carpet area, depending on the developer's loading percentage.",
      },
    ],
    match: hasConfig("3 bhk"),
  },
  {
    slug: "5-bhk-apartments-gurugram",
    h1: "5 BHK Luxury Apartments in Gurugram",
    badge: "Ultra-Luxury Flagship Residences",
    title: "5 BHK Apartments in Gurugram (2026 Audit) — Sky Mansions & Luxury Suites | Truth Estate",
    description: "Discover verified 5 BHK ultra-luxury sky mansions in Gurugram. Audited for private elevator access, low floor-to-unit density, structural compliance, and developer delivery records.",
    intro: "Gurugram's largest high-rise residential formats. Scored on master planning, clubhouse exclusivity, green area ratios, and secondary market liquidity.",
    metaSummary: "5 BHK residences span 4,000 to 7,500+ sq ft with dedicated staff suites, private lift lobbies, and starting ticket sizes above ₹7 Cr.",
    faqs: [
      {
        q: "Which developers build 5 BHK apartments in Gurugram?",
        a: "DLF, M3M, Elan, Smartworld, and Central Park offer premier 5 BHK residences across Golf Course Road, SPR, and Dwarka Expressway.",
      },
    ],
    match: hasConfig("5 bhk"),
  },
  {
    slug: "penthouses-in-gurugram",
    h1: "Luxury Penthouses in Gurugram",
    badge: "13 Verified High-Rise Penthouses",
    title: "Penthouses in Gurugram (2026 Audit) — Rooftop Comps & Vastu Intelligence | Truth Estate",
    description: "Explore verified luxury high-rise penthouses in Gurugram. Audited for private terrace approvals, panoramic daylight orientation, structural integrity, and fair price bands.",
    intro: "The top-tier penthouses and sky-mansions across Gurugram's most prestigious high-rises. Audited for RERA sanctioned floor plans, double-height ceiling clearances, and unobstructed daylight.",
    metaSummary: "Penthouses in Gurugram span 4,500 to 12,000+ sq ft with dedicated private decks, high-speed elevators, and starting ticket sizes from ₹8 Cr to ₹40+ Cr.",
    faqs: [
      {
        q: "What is the starting price for a luxury penthouse in Gurugram?",
        a: "Verified luxury penthouses in Gurugram start around ₹7.5 Cr to ₹10 Cr on Dwarka Expressway and SPR, rising to ₹18 Cr to ₹45+ Cr on Golf Course Road and Golf Course Extension.",
      },
      {
        q: "Are rooftop terraces in Gurugram penthouses sanctioned by RERA?",
        a: "Truth Estate audits the filed architectural drawings with RERA to confirm whether private rooftop decks and splash pools are officially sanctioned or demised common areas.",
      },
      {
        q: "How can I negotiate the best price for a penthouse in Gurugram?",
        a: "You can enter the Deal Room on Truth Estate to name your target price. Verified penthouses are benchmarked against filed base rates to drive seller competition without broker markups.",
      },
    ],
    match: hasConfig("penthouse"),
  },
  {
    slug: "duplex-apartments-gurugram",
    h1: "Duplex Apartments in Gurugram",
    badge: "Multi-Level Architectural Audits",
    title: "Duplex Apartments in Gurugram (2026) — Multi-Level Luxury Living | Truth Estate",
    description: "Discover verified multi-level duplex apartments in Gurugram. Audited for internal stairwell usability, vertical daylight penetration, and structural RERA clearances.",
    intro: "Two-level sky homes offering villa-like privacy within high-rise gated communities. Every duplex layout is checked for structural stair approvals, ceiling heights, and double-height living areas.",
    metaSummary: "Duplex apartments in Gurugram combine the spatial luxury of an independent villa with the security, amenities, and concierge services of a premium gated condominium.",
    faqs: [
      {
        q: "Why choose a duplex apartment over a penthouse in Gurugram?",
        a: "Duplex apartments provide distinct vertical zoning (living & entertaining on the lower level, private bedrooms above) at a more accessible ticket size than top-floor penthouses.",
      },
      {
        q: "What are the common layout considerations for a duplex in Gurugram?",
        a: "Key checks include the footprint of the internal staircase (which can consume 120–180 sq ft per floor) and cross-ventilation across both levels.",
      },
    ],
    match: hasConfig("duplex"),
  },
  {
    slug: "luxury-apartments-gurugram",
    h1: "Luxury Apartments in Gurugram",
    badge: "Top TruthScore Residences",
    title: "Luxury Apartments in Gurugram (2026 Audit) — Ranked by Forensic Intelligence | Truth Estate",
    description: "Curated portfolio of Gurugram's highest-scoring luxury residential developments. Audited for balance-sheet solvency, delivery certainty, and genuine capital preservation.",
    intro: "The definitive benchmark for luxury residential real estate in Gurugram. Scored objectively across 150+ forensic audit checkpoints with zero developer sponsorship.",
    metaSummary: "Gurugram luxury apartments feature world-class amenities, expansive clubhouses, VRV air conditioning, and low-density site master planning.",
    faqs: [
      {
        q: "What qualifies an apartment as 'luxury' on Truth Estate?",
        a: "Projects must meet strict minimum specifications: composite TruthScore of 70+, low-density tower planning (<4 units per core), reputable delivery records, and verified RERA compliance.",
      },
    ],
    match: hasConfig("luxury"),
  },

  /* ─────────────────────────────────────────────────────────────
     2. TYPOLOGY + BUDGET CLUSTERS
     ───────────────────────────────────────────────────────────── */
  {
    slug: "4-bhk-in-gurugram-under-5-cr",
    h1: "4 BHK Apartments in Gurugram Under ₹5 Cr",
    badge: "55 Verified Projects Under ₹5 Cr",
    title: "4 BHK Apartments in Gurugram Under ₹5 Cr (2026 Verified Rates) | Truth Estate",
    description: "Find verified 4 BHK apartments in Gurugram with entry prices under ₹5 Crore. Filtered against live filed RERA rates to eliminate fake broker entry prices. Zero spam.",
    intro: "Every tracked Gurugram project offering a 4 BHK layout with entry pricing under ₹5 Cr. Screened against filed builder rates to guarantee genuine pricing without hidden broker inflation.",
    metaSummary: "Top 4 BHK options under ₹5 Cr are concentrated along Dwarka Expressway (Sector 102–113), SPR (Sector 70–76), and New Gurgaon, offering 2,600–3,400 sq ft layouts.",
    faqs: [
      {
        q: "Can I get a spacious 4 BHK in Gurugram under ₹5 Crore in 2026?",
        a: "Yes. Premium corridors like Dwarka Expressway (Sectors 102, 106, 111, 113) and SPR (Sectors 70A, 76) feature 4 BHK units from leading developers like Smartworld, Whiteland, and Godrej under ₹5 Cr.",
      },
      {
        q: "How does Truth Estate prevent fake 'under 5 Cr' listings?",
        a: "We test the advertised price against the developer's filed ₹/sq ft rate multiplied by the minimum 4 BHK super area. If the math doesn't check out, the project is excluded.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && underCr(5.5)(p),
    pricePage: true,
  },
  {
    slug: "4-bhk-in-gurugram-under-6-cr",
    h1: "4 BHK Apartments in Gurugram Under ₹6 Cr",
    badge: "65+ Verified Projects",
    title: "4 BHK Apartments in Gurugram Under ₹6 Cr (2026 Audit) | Truth Estate",
    description: "Explore 4 BHK residences in Gurugram under ₹6 Crore. Verified against RERA cost sheets and actual carpet area allocations.",
    intro: "Curated 4 BHK apartments priced between ₹4 Cr and ₹6 Cr across SPR, Dwarka Expressway, and Golf Course Extension.",
    metaSummary: "At the ₹5–6 Cr price band, buyers access premium gated communities with expansive deck balconies and smart home automation.",
    faqs: [
      {
        q: "Which sectors have the best 4 BHK apartments under ₹6 Cr?",
        a: "Sectors 76, 79, 102, 106, and 113 offer top-ranked developments by DLF, Puri, and M3M in this budget tier.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && underCr(6.5)(p),
    pricePage: true,
  },
  {
    slug: "4-bhk-in-gurugram-under-8-cr",
    h1: "4 BHK Apartments in Gurugram Under ₹8 Cr",
    badge: "Premium & Ultra-Luxury Tier",
    title: "4 BHK Apartments in Gurugram Under ₹8 Cr (2026 Comps) | Truth Estate",
    description: "Compare verified premium 4 BHK luxury residences in Gurugram under ₹8 Crore. Audited for developer credibility and delivery timelines.",
    intro: "Top-tier 4 BHK residences across Gurugram under ₹8 Cr. Features large format layouts (3,200 to 4,500 sq ft) in prime high-rise communities.",
    metaSummary: "This budget encompasses prime Golf Course Extension Road and premium Dwarka Expressway high-rises with international landscape design.",
    faqs: [
      {
        q: "What features are standard in 4 BHK homes under ₹8 Cr?",
        a: "Private elevator access, 11-foot ceiling clearances, VRV air conditioning, and integrated Italian modular kitchens are standard.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && underCr(8.5)(p),
    pricePage: true,
  },
  {
    slug: "3-bhk-in-gurugram-under-2-cr",
    h1: "3 BHK Apartments in Gurugram Under ₹2 Cr",
    badge: "High-Value Entry Residences",
    title: "3 BHK Apartments in Gurugram Under ₹2 Cr (2026 Audit) | Truth Estate",
    description: "Verified 3 BHK apartments in Gurugram under ₹2 Crore. Filtered for genuine RERA pricing and reliable construction progress.",
    intro: "Tracked 3 BHK developments in Gurugram with entry pricing under ₹2 Cr. Ideal for first-time luxury upgraders seeking strong value.",
    metaSummary: "Concentrated in New Gurgaon (Sectors 89–95) and Sohna Road, offering 1,400 to 1,800 sq ft configurations with gated community amenities.",
    faqs: [
      {
        q: "Is it possible to buy a 3 BHK in Gurugram under ₹2 Cr?",
        a: "Yes, prominent developers like Ashiana, Signature Global, and Ganga Realty offer verified 3 BHK homes under ₹2 Cr in emerging growth corridors.",
      },
    ],
    match: (p) => hasConfig("3 bhk")(p) && underCr(2.2)(p),
    pricePage: true,
  },
  {
    slug: "3-bhk-in-gurugram-under-3-cr",
    h1: "3 BHK Apartments in Gurugram Under ₹3 Cr",
    badge: "45 Verified Projects Under ₹3 Cr",
    title: "3 BHK Apartments in Gurugram Under ₹3 Cr (2026 Grounded Comps) | Truth Estate",
    description: "Compare verified 3 BHK luxury homes in Gurugram under ₹3 Crore. Ranked by TruthScore, RERA completion velocity, and fair market price. Zero broker calls.",
    intro: "All tracked 3 BHK apartments in Gurugram with an entry ticket under ₹3 Cr. Independently scored on construction timelines, title safety, and living density.",
    metaSummary: "3 BHK homes under ₹3 Cr in Gurugram offer 1,600 to 2,250 sq ft super area in high-growth corridors like Dwarka Expressway, New Gurgaon, and Sohna Road.",
    faqs: [
      {
        q: "Where can I find the best 3 BHK apartments in Gurugram under ₹3 Cr?",
        a: "New Gurgaon (Sectors 89–95) and Dwarka Expressway (Sectors 102–108) offer the highest concentration of high-quality 3 BHK projects under ₹3 Cr from reputed developers.",
      },
    ],
    match: (p) => hasConfig("3 bhk")(p) && underCr(3.2)(p),
    pricePage: true,
  },
  {
    slug: "penthouses-in-gurugram-under-10-cr",
    h1: "Penthouses in Gurugram Under ₹10 Cr",
    badge: "Accessible Sky-Luxury",
    title: "Penthouses in Gurugram Under ₹10 Cr (2026 Audit) | Truth Estate",
    description: "Explore verified high-rise penthouses in Gurugram under ₹10 Crore. Audited for private terrace titles, ceiling heights, and RERA approvals.",
    intro: "Verified penthouse sky homes in Gurugram with entry prices under ₹10 Cr. Audited for sanctioned architectural drawings and panoramic views.",
    metaSummary: "Penthouses under ₹10 Cr offer 3,500 to 5,500 sq ft multi-level or top-floor layouts on Dwarka Expressway, SPR, and New Gurgaon.",
    faqs: [
      {
        q: "Which developers offer penthouses under ₹10 Cr?",
        a: "Krisumi, Signature Global, Eldeco, and Smartworld provide sanctioned duplex and triplex penthouses under ₹10 Cr.",
      },
    ],
    match: (p) => hasConfig("penthouse")(p) && underCr(10.5)(p),
    pricePage: true,
  },
  {
    slug: "luxury-apartments-in-gurugram-above-10-cr",
    h1: "Ultra-Luxury Apartments in Gurugram Above ₹10 Cr",
    badge: "Trophy Asset Segment",
    title: "Ultra-Luxury Apartments in Gurugram Above ₹10 Cr (2026 Audit) | Truth Estate",
    description: "The ultra-luxury trophy residences of Gurugram. Audited for pedigree, balance-sheet safety, high liquidity, and bespoke architecture.",
    intro: "The pinnacle of Gurugram high-rise luxury. Scored on developer balance sheets, master layout density, and secondary market capital preservation.",
    metaSummary: "Residences in this segment command ₹30,000 to ₹1,00,000+/sq ft across Golf Course Road and Golf Course Extension Road.",
    faqs: [
      {
        q: "What defines an ultra-luxury residence above ₹10 Cr?",
        a: "Expansive floorplates (5,000+ sq ft), private plunge pools, world-class clubhouses (1,00,000+ sq ft), and concierge management.",
      },
    ],
    match: (p) => aboveCr(9.5)(p),
    pricePage: true,
  },

  /* ─────────────────────────────────────────────────────────────
     3. TYPOLOGY + CORRIDOR CLUSTERS
     ───────────────────────────────────────────────────────────── */
  {
    slug: "4-bhk-golf-course-extension",
    h1: "4 BHK Apartments on Golf Course Extension Road",
    badge: "Prime Luxury Corridor",
    title: "4 BHK on Golf Course Extension Road Gurugram (2026 Audit) | Truth Estate",
    description: "Explore 4 BHK luxury residences on Golf Course Extension Road. Audited for developer financial strength, construction velocity, and fair resale comps.",
    intro: "Golf Course Extension Road represents Gurugram's premier luxury residential spine. Every 4 BHK development here is audited for construction milestones, low density, and high capital liquidity.",
    metaSummary: "Golf Course Extension Road 4 BHK homes feature grand deck layouts (3,000–4,200 sq ft) with average capital values between ₹22,000 and ₹34,000/sq ft.",
    faqs: [
      {
        q: "What makes Golf Course Extension Road ideal for 4 BHK buyers?",
        a: "Direct connectivity to Golf Course Road, Cyber City, and Rapid Metro, combined with luxury high-rises by DLF, Smartworld, M3M, and Birla make it Gurugram's top luxury family corridor.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && hasCorridor("golf course extension")(p),
  },
  {
    slug: "4-bhk-dwarka-expressway",
    h1: "4 BHK Apartments on Dwarka Expressway",
    badge: "High-Growth Prime Corridor",
    title: "4 BHK on Dwarka Expressway Gurugram (2026 Grounded Audit) | Truth Estate",
    description: "Compare verified 4 BHK apartments on Dwarka Expressway. Audited for arterial connectivity, flyover access, developer financial health, and RERA timelines.",
    intro: "Dwarka Expressway offers Gurugram's fastest-appreciating luxury corridor with seamless IGI Airport connectivity. Every 4 BHK is screened against filed rates.",
    metaSummary: "Dwarka Expressway 4 BHK apartments span 2,600 to 3,800 sq ft with capital values averaging ₹16,000 to ₹24,000/sq ft.",
    faqs: [
      {
        q: "Why invest in a 4 BHK on Dwarka Expressway?",
        a: "The operational 8-lane expressway provides 15-minute access to IGI Airport and Yashobhoomi (IICC), driving strong rental yields and capital growth.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && hasCorridor("dwarka expressway")(p),
  },
  {
    slug: "4-bhk-southern-peripheral-road-spr",
    h1: "4 BHK Apartments on SPR (Southern Peripheral Road)",
    badge: "Emerging Luxury Hub",
    title: "4 BHK on Southern Peripheral Road SPR Gurugram (2026 Audit) | Truth Estate",
    description: "Find verified 4 BHK apartments on Southern Peripheral Road (SPR). Audited for Cloverleaf connectivity, builder balance sheets, and RERA delivery dates.",
    intro: "SPR connects Golf Course Ext Road, NH-8, and Sohna Road into a cohesive luxury hub. Every 4 BHK project is ranked by TruthScore and price integrity.",
    metaSummary: "SPR 4 BHK developments feature modern high-rise architecture with units from 2,800 to 3,600 sq ft at ₹17,000 to ₹26,000/sq ft.",
    faqs: [
      {
        q: "What makes SPR attractive for 4 BHK homebuyers?",
        a: "Direct connectivity via the Vatika Chowk underpass and NH-8 Cloverleaf, plus flagship launches by DLF (Privana) and Signature Global (Titanium).",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && (hasCorridor("spr")(p) || hasCorridor("southern peripheral")(p)),
  },
  {
    slug: "4-bhk-golf-course-road",
    h1: "4 BHK Apartments on Golf Course Road",
    badge: "Ultra-Luxury Flagship Spine",
    title: "4 BHK on Golf Course Road Gurugram (2026 Audit) — Super Luxury | Truth Estate",
    description: "The gold standard of Gurugram luxury real estate. Audited 4 BHK residences on Golf Course Road with verified resale comps and title checks.",
    intro: "Gurugram's most prestigious pin code. Home to corporate headquarters, luxury malls, and top-tier residential condominiums.",
    metaSummary: "Golf Course Road commands ₹45,000 to ₹1,00,000+/sq ft with unmatched social infrastructure and metro connectivity.",
    faqs: [
      {
        q: "What is the entry price for a 4 BHK on Golf Course Road?",
        a: "Resale and new developments on Golf Course Road start around ₹12 Cr to ₹25+ Cr.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && hasCorridor("golf course road")(p) && !hasCorridor("golf course extension")(p),
  },
  {
    slug: "4-bhk-new-gurgaon",
    h1: "4 BHK Apartments in New Gurgaon",
    badge: "High-Appreciation Green Suburb",
    title: "4 BHK in New Gurgaon (2026 Verified Rates) | Truth Estate",
    description: "Explore verified 4 BHK homes in New Gurgaon (Sectors 81–95). Audited for master infrastructure, highway access, and developer solvency.",
    intro: "New Gurgaon offers modern planned sectors with wide roads, green belts, and excellent connectivity to NH-8, CPR, and Dwarka Expressway.",
    metaSummary: "4 BHK apartments in New Gurgaon provide large spaces (2,400–3,200 sq ft) at accessible ticket sizes of ₹2.8 Cr to ₹4.5 Cr.",
    faqs: [
      {
        q: "Which developers are active in New Gurgaon?",
        a: "DLF (Gardencity), Ashiana, Godrej, and Bestech have developed major residential communities across Sectors 81 to 93.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && hasCorridor("new gurgaon")(p),
  },
  {
    slug: "3-bhk-dwarka-expressway",
    h1: "3 BHK Apartments on Dwarka Expressway",
    badge: "High-Demand Family Homes",
    title: "3 BHK on Dwarka Expressway Gurugram (2026 Grounded Comps) | Truth Estate",
    description: "Compare verified 3 BHK residences along Dwarka Expressway. Audited for construction milestones, RERA delivery dates, and fair price bands.",
    intro: "Dwarka Expressway offers modern 3 BHK family configurations with clubhouse amenities and rapid access to Delhi and Cyber City.",
    metaSummary: "3 BHK units on Dwarka Expressway span 1,500 to 2,200 sq ft with prices from ₹1.8 Cr to ₹3.2 Cr.",
    faqs: [
      {
        q: "What are the top 3 BHK projects on Dwarka Expressway?",
        a: "M3M Mansion, Puri Diplomatic Residences, Sobha City, and Krisumi Waterside Residences represent the highest-scoring options.",
      },
    ],
    match: (p) => hasConfig("3 bhk")(p) && hasCorridor("dwarka expressway")(p),
  },
  {
    slug: "3-bhk-golf-course-extension",
    h1: "3 BHK Apartments on Golf Course Extension Road",
    badge: "Established Luxury Family Spine",
    title: "3 BHK on Golf Course Extension Road Gurugram (2026 Audit) | Truth Estate",
    description: "Discover verified 3 BHK luxury residences on Golf Course Extension Road. Audited for living density, RERA timelines, and price credibility.",
    intro: "Gurugram's top luxury family address. Features world-class schools, hospitals, and direct access to Cyber Hub and Golf Course Road.",
    metaSummary: "3 BHK homes on Golf Course Ext Road span 1,800 to 2,500 sq ft with capital values between ₹20,000 and ₹30,000/sq ft.",
    faqs: [
      {
        q: "What is the price of a 3 BHK on Golf Course Extension Road?",
        a: "Priced typically between ₹3.5 Cr and ₹5.2 Cr depending on the developer, tower specifications, and floor level.",
      },
    ],
    match: (p) => hasConfig("3 bhk")(p) && hasCorridor("golf course extension")(p),
  },
  {
    slug: "penthouses-golf-course-extension",
    h1: "Penthouses on Golf Course Extension Road",
    badge: "Corridor Sky-Mansions",
    title: "Penthouses on Golf Course Extension Road Gurugram (2026 Audit) | Truth Estate",
    description: "Exclusive rooftop penthouses on Golf Course Extension Road. Audited for private pool clearances, multi-level layouts, and panoramic views.",
    intro: "Top-floor sky residences along Golf Course Extension Road. Audited for sanctioned terrace areas, private elevator access, and architectural integrity.",
    metaSummary: "Penthouses on Golf Course Ext Road span 5,000 to 10,000+ sq ft with pricing starting from ₹14 Cr to ₹35+ Cr.",
    faqs: [
      {
        q: "Which projects have penthouses on Golf Course Extension Road?",
        a: "Smartworld The Edition, M3M Altitude, and DLF The Arbour feature premier sky-villas in this corridor.",
      },
    ],
    match: (p) => hasConfig("penthouse")(p) && hasCorridor("golf course extension")(p),
  },
  {
    slug: "penthouses-dwarka-expressway",
    h1: "Penthouses on Dwarka Expressway",
    badge: "Expressway Sky-Mansions",
    title: "Penthouses on Dwarka Expressway Gurugram (2026 Audit) | Truth Estate",
    description: "Verified sky mansions and duplex penthouses along Dwarka Expressway. Audited for RERA sanctioned terraces, high ceilings, and panoramic city views.",
    intro: "Luxury top-floor sky homes on Dwarka Expressway. Screened for genuine builder pricing, elevator speeds, and terrace approvals.",
    metaSummary: "Dwarka Expressway penthouses offer 4,000 to 8,000 sq ft of space with pricing ranging from ₹7.5 Cr to ₹18 Cr.",
    faqs: [
      {
        q: "What is the advantage of a penthouse on Dwarka Expressway?",
        a: "Expansive green views towards the Delhi ridge and diplomatic enclave, coupled with large terrace footprints at higher value per square foot.",
      },
    ],
    match: (p) => hasConfig("penthouse")(p) && hasCorridor("dwarka expressway")(p),
  },

  /* ─────────────────────────────────────────────────────────────
     4. TYPOLOGY + CORRIDOR + BUDGET COMBOS (LASER CONVERSION)
     ───────────────────────────────────────────────────────────── */
  {
    slug: "4-bhk-dwarka-expressway-under-5-cr",
    h1: "4 BHK Apartments on Dwarka Expressway Under ₹5 Cr",
    badge: "High-Converting Segment",
    title: "4 BHK on Dwarka Expressway Under ₹5 Cr (2026 Grounded Comps) | Truth Estate",
    description: "Verified 4 BHK apartments on Dwarka Expressway under ₹5 Crore. Filtered against developer filed rates to eliminate false listings.",
    intro: "Every tracked 4 BHK project on Dwarka Expressway with entry pricing under ₹5 Cr. Audited for highway accessibility, sector infrastructure, and RERA delivery dates.",
    metaSummary: "Offers 2,600 to 3,200 sq ft 4 BHK configurations in prime sectors (Sectors 102, 106, 111, 113) under ₹5 Cr.",
    faqs: [
      {
        q: "Can I get a 4 BHK on Dwarka Expressway under ₹5 Cr in 2026?",
        a: "Yes, prominent projects by Puri, Smartworld, Whiteland, and Godrej offer entry 4 BHK configurations under ₹5 Cr.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && hasCorridor("dwarka expressway")(p) && underCr(5.5)(p),
    pricePage: true,
  },
  {
    slug: "4-bhk-spr-under-5-cr",
    h1: "4 BHK Apartments on SPR Under ₹5 Cr",
    badge: "Fastest-Growing Luxury Spine",
    title: "4 BHK on Southern Peripheral Road SPR Under ₹5 Cr (2026 Audit) | Truth Estate",
    description: "Compare verified 4 BHK residences on SPR under ₹5 Crore. Audited for builder financial stability, RERA timelines, and fair rate benchmarks.",
    intro: "Southern Peripheral Road 4 BHK developments offering entry pricing under ₹5 Cr. Ranked by TruthScore and construction milestones.",
    metaSummary: "SPR 4 BHK units under ₹5 Cr span 2,600 to 3,100 sq ft across Sectors 70, 71, 76, and 79.",
    faqs: [
      {
        q: "What are the best 4 BHK options on SPR under ₹5 Cr?",
        a: "Signature Global Titanium, Tulip Monsella, and Whiteland provide high-ranked options in this category.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && (hasCorridor("spr")(p) || hasCorridor("southern peripheral")(p)) && underCr(5.5)(p),
    pricePage: true,
  },
  {
    slug: "3-bhk-dwarka-expressway-under-2-5-cr",
    h1: "3 BHK Apartments on Dwarka Expressway Under ₹2.5 Cr",
    badge: "High-Demand Value Homes",
    title: "3 BHK on Dwarka Expressway Under ₹2.5 Cr (2026 Verified Comps) | Truth Estate",
    description: "Verified 3 BHK apartments along Dwarka Expressway under ₹2.5 Crore. Ranked by construction pace, legal safety, and real usable carpet area.",
    intro: "Top-value 3 BHK residences on Dwarka Expressway under ₹2.5 Cr. Screened against filed builder rates for genuine pricing.",
    metaSummary: "Offers 1,500 to 1,950 sq ft 3 BHK homes in Sectors 102 to 109 with quick access to the Delhi border.",
    faqs: [
      {
        q: "Where can I find 3 BHK homes under ₹2.5 Cr on Dwarka Expressway?",
        a: "Sectors 102, 103, 104, and 108 have the highest concentration of high-scoring 3 BHK units under ₹2.5 Cr.",
      },
    ],
    match: (p) => hasConfig("3 bhk")(p) && hasCorridor("dwarka expressway")(p) && underCr(2.6)(p),
    pricePage: true,
  },
];

export const apartmentClusterBySlug = (slug: string): ApartmentCluster | undefined =>
  APARTMENT_CLUSTERS.find((c) => c.slug === slug);
