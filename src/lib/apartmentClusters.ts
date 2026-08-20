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
  title: string;
  description: string;
  intro: string;
  faqs: ApartmentFaq[];
  pricePage?: boolean;
  /* The unit configuration this page is ABOUT ("4 bhk", "penthouse"…).
     Set on every typology cluster so downstream pricing — the meta
     line, the price-bucket chips — can quote THAT unit rather than the
     project's cheapest config, which on a 4 BHK page is usually a
     smaller flat's price wearing the wrong label. */
  config?: string;
};

export type ApartmentCluster = ApartmentClusterMeta & {
  match: (p: ProjectIntel) => boolean;
};

/* Helper predicates operating on ProjectIntel (with full filed unit configs) */
/* One matching rule for a config STRING, shared by the page filter and
   the unit pricer so they can never disagree about what counts as a
   "4 BHK". */
export function configMatches(text: string, needle: string): boolean {
  const t = text.toLowerCase();
  const n = needle.toLowerCase();
  if (n === "4 bhk") return t.includes("4 bhk") || t.includes("4bhk") || t.includes("4.5");
  if (n === "3 bhk") return t.includes("3 bhk") || t.includes("3bhk") || t.includes("3.5");
  if (n === "5 bhk") return t.includes("5 bhk") || t.includes("5bhk") || t.includes("5.5");
  return t.includes(n);
}

const hasConfig = (needle: string) => (p: ProjectIntel) => {
  const n = needle.toLowerCase();
  const cfgs = (p.configs ?? []).map((c) => c.toLowerCase());
  const homes = (p.ops?.homes ?? []).map((h) => h.config.toLowerCase());
  const all = [...cfgs, ...homes, p.name.toLowerCase()].join(" ");
  if (n === "luxury") return (p.truthScore ?? 0) >= 70 || (p.budget?.[0] ?? 0) >= 4;
  return configMatches(all, n);
};

/* ── What does THIS page's unit cost in THIS project? ────────────────
   Filed layout(s) matching the page's config, smallest first, priced at
   the project's own filed rate — superSqft × psfOwn.low (corridor psf
   as fallback), the exact arithmetic the Deal Room quotes. Falls back
   to the project's entry budget ONLY when the project has no other
   configs (then the entry price IS this unit's price). Returns null
   rather than guessing: a project without a filed layout for this
   config simply doesn't claim a unit price. */
export function unitEntryPriceCr(p: ProjectIntel, config?: string): number | null {
  if (!config) return (p.budget?.[0] ?? 0) > 0 ? p.budget![0] : null;
  const homes = (p.ops?.homes ?? []).filter(
    (h) => (h.superSqft ?? 0) > 0 && configMatches(h.config ?? "", config),
  );
  const psf = (p.psfOwn?.low ?? 0) > 0 ? p.psfOwn!.low : (p.psf?.low ?? 0) > 0 ? p.psf!.low : 0;
  if (homes.length && psf > 0) {
    const sqft = Math.min(...homes.map((h) => h.superSqft!));
    return (sqft * psf) / 1e7;
  }
  const cfgs = p.configs ?? [];
  if (cfgs.length > 0 && cfgs.every((c) => configMatches(c, config)) && (p.budget?.[0] ?? 0) > 0) {
    return p.budget![0];
  }
  return null;
}

/* Corridor needles resolve through aliases because the data's names
   and the search phrases differ in word order: the corridor everyone
   calls "Golf Course Extension" is filed here as "Golf Course Road
   Extension (GCRE)" / short "GCE" — a bare substring test never
   matched it, which shipped three EMPTY cluster pages and (because the
   Golf Course Road page excludes by the same test) let every GCRE
   project pollute the GCR page's ultra-luxury framing. */
const CORRIDOR_ALIASES: Record<string, string[]> = {
  "golf course extension": ["golf course road extension", "golf course extension", "gcre", "gce"],
};
const hasCorridor = (needle: string) => (p: ProjectIntel) => {
  const m = (p.market || "").toLowerCase();
  const ms = (p.marketShort || "").toLowerCase();
  const wanted = CORRIDOR_ALIASES[needle.toLowerCase()] ?? [needle.toLowerCase()];
  return wanted.some((n) => m.includes(n) || ms.includes(n));
};

/* Budget pages cap the PAGE'S UNIT, not the project's cheapest config —
   "4 BHK under ₹5 Cr" must mean the 4 BHK costs under ₹5 Cr. A project
   whose unit price cannot be computed is EXCLUDED from budget pages:
   we cannot verify the promise, so we do not make it (the page's own
   FAQ says exactly this). */
const underUnitCr = (config: string, cap: number) => (p: ProjectIntel) => {
  const v = unitEntryPriceCr(p, config);
  return v != null && v > 0 && v <= cap;
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
    config: "4 bhk",
    h1: "4 BHK Apartments in Gurugram",
    title: "4 BHK Apartments in Gurugram (2026 Audit) — Ranked by TruthScore & ₹/sq ft | Truth Estate",
    description: "Compare verified 4 BHK luxury apartments in Gurugram. Independently audited for RERA risk, real filed ₹/sq ft rates, daylight layout analysis, and developer track record. Zero broker spam.",
    intro: "Every tracked 4 BHK residential project in Gurugram — independently scored on delivery track record, legal filings, developer financial health, liquidity, and fair-price bands. No developer pays to rank.",
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
        a: "Every project is scored on six audited inputs — delivery pace against RERA milestones, legal encumbrances, developer financial strength, secondary-market liquidity, pricing credibility, and construction progress. No developer pays to rank, and none can move a score.",
      },
    ],
    match: hasConfig("4 bhk"),
  },
  {
    slug: "3-bhk-apartments-gurugram",
    config: "3 bhk",
    h1: "3 BHK Apartments in Gurugram",
    title: "3 BHK Apartments in Gurugram (2026 Verified Rates) — Scored & Ranked | Truth Estate",
    description: "Explore 3 BHK luxury & premium apartments across Gurugram. Audited on construction velocity, RERA filings, carpet area efficiency, and price credibility. 100% neutral.",
    intro: "All tracked 3 BHK residential projects across Gurugram. Filtered by verified builder rates, construction milestones, and layout efficiency. Unbiased intelligence with zero sales bias.",
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
    config: "5 bhk",
    h1: "5 BHK Luxury Apartments in Gurugram",
    title: "5 BHK Apartments in Gurugram (2026 Audit) — Sky Mansions & Luxury Suites | Truth Estate",
    description: "Discover verified 5 BHK ultra-luxury sky mansions in Gurugram — filed rates, developer track record, delivery risk and fair-price bands on every report.",
    intro: "Gurugram's largest high-rise residential formats. Scored on master planning, clubhouse exclusivity, green area ratios, and secondary market liquidity.",
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
    config: "penthouse",
    h1: "Luxury Penthouses in Gurugram",
    title: "Penthouses in Gurugram (2026 Audit) — Rooftop Comps & Vastu Intelligence | Truth Estate",
    description: "Explore verified luxury high-rise penthouses in Gurugram — filed rates, developer track record, delivery risk and fair-price bands on every report.",
    intro: "The top-tier penthouses and sky-mansions across Gurugram's most prestigious high-rises, each scored on the same six audited inputs as every tracked project.",
    faqs: [
      {
        q: "What is the starting price for a luxury penthouse in Gurugram?",
        a: "Verified luxury penthouses in Gurugram start around ₹7.5 Cr to ₹10 Cr on Dwarka Expressway and SPR, rising to ₹18 Cr to ₹45+ Cr on Golf Course Road and Golf Course Extension.",
      },
      {
        q: "Are rooftop terraces in Gurugram penthouses sanctioned by RERA?",
        a: "That is the critical check before paying a terrace premium: a private deck must be sanctioned in the filed drawings, not a demised common area. Every penthouse report flags what the filings actually grant.",
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
    config: "duplex",
    h1: "Duplex Apartments in Gurugram",
    title: "Duplex Apartments in Gurugram (2026) — Multi-Level Luxury Living | Truth Estate",
    description: "Discover verified multi-level duplex apartments in Gurugram — filed layouts, developer track record and fair-price bands on every report.",
    intro: "Two-level sky homes offering villa-like privacy within high-rise gated communities, scored on the same audited inputs as every tracked project.",
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
    title: "Luxury Apartments in Gurugram (2026 Audit) — Ranked by Forensic Intelligence | Truth Estate",
    description: "Curated portfolio of Gurugram's highest-scoring luxury residential developments. Audited for balance-sheet solvency, delivery certainty, and genuine capital preservation.",
    intro: "The definitive benchmark for luxury residential real estate in Gurugram. Scored objectively on six audited inputs with zero developer sponsorship.",
    faqs: [
      {
        q: "What qualifies an apartment as 'luxury' on Truth Estate?",
        a: "Projects qualify on audited evidence, not marketing: a composite Truth Score of 70 or above, or a verified entry price in the premium band — with the full six-input audit open on every report, so you can see exactly why a project ranks.",
      },
    ],
    match: hasConfig("luxury"),
  },

  /* ─────────────────────────────────────────────────────────────
     2. TYPOLOGY + BUDGET CLUSTERS
     ───────────────────────────────────────────────────────────── */
  {
    slug: "4-bhk-in-gurugram-under-5-cr",
    config: "4 bhk",
    h1: "4 BHK Apartments in Gurugram Under ₹5 Cr",
    title: "4 BHK Apartments in Gurugram Under ₹5 Cr (2026 Verified Rates) | Truth Estate",
    description: "Find verified 4 BHK apartments in Gurugram with entry prices under ₹5 Crore. Filtered against live filed RERA rates to eliminate fake broker entry prices. Zero spam.",
    intro: "Every tracked Gurugram project offering a 4 BHK layout with entry pricing under ₹5 Cr. Screened against filed builder rates to guarantee genuine pricing without hidden broker inflation.",
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
    match: (p) => hasConfig("4 bhk")(p) && underUnitCr("4 bhk", 5)(p),
    pricePage: true,
  },
  {
    slug: "4-bhk-in-gurugram-under-6-cr",
    config: "4 bhk",
    h1: "4 BHK Apartments in Gurugram Under ₹6 Cr",
    title: "4 BHK Apartments in Gurugram Under ₹6 Cr (2026 Audit) | Truth Estate",
    description: "Explore 4 BHK residences in Gurugram under ₹6 Crore. Verified against RERA cost sheets and actual carpet area allocations.",
    intro: "Curated 4 BHK apartments priced between ₹4 Cr and ₹6 Cr across SPR, Dwarka Expressway, and Golf Course Extension.",
    faqs: [
      {
        q: "Which sectors have the best 4 BHK apartments under ₹6 Cr?",
        a: "Sectors 76, 79, 102, 106, and 113 offer top-ranked developments by DLF, Puri, and M3M in this budget tier.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && underUnitCr("4 bhk", 6)(p),
    pricePage: true,
  },
  {
    slug: "4-bhk-in-gurugram-under-8-cr",
    config: "4 bhk",
    h1: "4 BHK Apartments in Gurugram Under ₹8 Cr",
    title: "4 BHK Apartments in Gurugram Under ₹8 Cr (2026 Comps) | Truth Estate",
    description: "Compare verified premium 4 BHK luxury residences in Gurugram under ₹8 Crore. Audited for developer credibility and delivery timelines.",
    intro: "Top-tier 4 BHK residences across Gurugram under ₹8 Cr. Features large format layouts (3,200 to 4,500 sq ft) in prime high-rise communities.",
    faqs: [
      {
        q: "What features are standard in 4 BHK homes under ₹8 Cr?",
        a: "Private elevator access, 11-foot ceiling clearances, VRV air conditioning, and integrated Italian modular kitchens are standard.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && underUnitCr("4 bhk", 8)(p),
    pricePage: true,
  },
  {
    slug: "3-bhk-in-gurugram-under-2-cr",
    config: "3 bhk",
    h1: "3 BHK Apartments in Gurugram Under ₹2 Cr",
    title: "3 BHK Apartments in Gurugram Under ₹2 Cr (2026 Audit) | Truth Estate",
    description: "Verified 3 BHK apartments in Gurugram under ₹2 Crore. Filtered for genuine RERA pricing and reliable construction progress.",
    intro: "Tracked 3 BHK developments in Gurugram with entry pricing under ₹2 Cr. Ideal for first-time luxury upgraders seeking strong value.",
    faqs: [
      {
        q: "Is it possible to buy a 3 BHK in Gurugram under ₹2 Cr?",
        a: "Yes, prominent developers like Ashiana, Signature Global, and Ganga Realty offer verified 3 BHK homes under ₹2 Cr in emerging growth corridors.",
      },
    ],
    match: (p) => hasConfig("3 bhk")(p) && underUnitCr("3 bhk", 2)(p),
    pricePage: true,
  },
  {
    slug: "3-bhk-in-gurugram-under-3-cr",
    config: "3 bhk",
    h1: "3 BHK Apartments in Gurugram Under ₹3 Cr",
    title: "3 BHK Apartments in Gurugram Under ₹3 Cr (2026 Grounded Comps) | Truth Estate",
    description: "Compare verified 3 BHK luxury homes in Gurugram under ₹3 Crore. Ranked by TruthScore, RERA completion velocity, and fair market price. Zero broker calls.",
    intro: "All tracked 3 BHK apartments in Gurugram with an entry ticket under ₹3 Cr. Independently scored on construction timelines, title safety, and living density.",
    faqs: [
      {
        q: "Where can I find the best 3 BHK apartments in Gurugram under ₹3 Cr?",
        a: "New Gurgaon (Sectors 89–95) and Dwarka Expressway (Sectors 102–108) offer the highest concentration of high-quality 3 BHK projects under ₹3 Cr from reputed developers.",
      },
    ],
    match: (p) => hasConfig("3 bhk")(p) && underUnitCr("3 bhk", 3)(p),
    pricePage: true,
  },
  {
    slug: "penthouses-in-gurugram-under-10-cr",
    config: "penthouse",
    h1: "Penthouses in Gurugram Under ₹10 Cr",
    title: "Penthouses in Gurugram Under ₹10 Cr (2026 Audit) | Truth Estate",
    description: "Explore verified high-rise penthouses in Gurugram under ₹10 Crore — filed rates, sanctioned-layout flags and developer delivery records on every report.",
    intro: "Verified penthouse sky homes in Gurugram with entry prices under ₹10 Cr, benchmarked against filed base rates.",
    faqs: [
      {
        q: "Which developers offer penthouses under ₹10 Cr?",
        a: "Krisumi, Signature Global, Eldeco, and Smartworld provide sanctioned duplex and triplex penthouses under ₹10 Cr.",
      },
    ],
    match: (p) => hasConfig("penthouse")(p) && underUnitCr("penthouse", 10)(p),
    pricePage: true,
  },
  {
    slug: "luxury-apartments-in-gurugram-above-10-cr",
    h1: "Ultra-Luxury Apartments in Gurugram Above ₹10 Cr",
    title: "Ultra-Luxury Apartments in Gurugram Above ₹10 Cr (2026 Audit) | Truth Estate",
    description: "The ultra-luxury trophy residences of Gurugram. Audited for pedigree, balance-sheet safety, high liquidity, and bespoke architecture.",
    intro: "The pinnacle of Gurugram high-rise luxury. Scored on developer balance sheets, master layout density, and secondary market capital preservation.",
    faqs: [
      {
        q: "What defines an ultra-luxury residence above ₹10 Cr?",
        a: "Expansive floorplates (5,000+ sq ft), private plunge pools, world-class clubhouses (1,00,000+ sq ft), and concierge management.",
      },
    ],
    match: (p) => aboveCr(10)(p),
    pricePage: true,
  },

  /* ─────────────────────────────────────────────────────────────
     3. TYPOLOGY + CORRIDOR CLUSTERS
     ───────────────────────────────────────────────────────────── */
  {
    slug: "4-bhk-golf-course-extension",
    config: "4 bhk",
    h1: "4 BHK Apartments on Golf Course Extension Road",
    title: "4 BHK on Golf Course Extension Road Gurugram (2026 Audit) | Truth Estate",
    description: "Explore 4 BHK luxury residences on Golf Course Extension Road. Audited for developer financial strength, construction velocity, and fair resale comps.",
    intro: "Golf Course Extension Road represents Gurugram's premier luxury residential spine. Every 4 BHK development here is audited for construction milestones, low density, and high capital liquidity.",
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
    config: "4 bhk",
    h1: "4 BHK Apartments on Dwarka Expressway",
    title: "4 BHK on Dwarka Expressway Gurugram (2026 Grounded Audit) | Truth Estate",
    description: "Compare verified 4 BHK apartments on Dwarka Expressway. Audited for arterial connectivity, flyover access, developer financial health, and RERA timelines.",
    intro: "Dwarka Expressway offers Gurugram's fastest-appreciating luxury corridor with seamless IGI Airport connectivity. Every 4 BHK is screened against filed rates.",
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
    config: "4 bhk",
    h1: "4 BHK Apartments on SPR (Southern Peripheral Road)",
    title: "4 BHK on Southern Peripheral Road SPR Gurugram (2026 Audit) | Truth Estate",
    description: "Find verified 4 BHK apartments on Southern Peripheral Road (SPR). Audited for Cloverleaf connectivity, builder balance sheets, and RERA delivery dates.",
    intro: "SPR connects Golf Course Ext Road, NH-8, and Sohna Road into a cohesive luxury hub. Every 4 BHK project is ranked by TruthScore and price integrity.",
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
    config: "4 bhk",
    h1: "4 BHK Apartments on Golf Course Road",
    title: "4 BHK on Golf Course Road Gurugram (2026 Audit) — Super Luxury | Truth Estate",
    description: "The gold standard of Gurugram luxury real estate. Audited 4 BHK residences on Golf Course Road with verified resale comps and title checks.",
    intro: "Gurugram's most prestigious pin code. Home to corporate headquarters, luxury malls, and top-tier residential condominiums.",
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
    config: "4 bhk",
    h1: "4 BHK Apartments in New Gurgaon",
    title: "4 BHK in New Gurgaon (2026 Verified Rates) | Truth Estate",
    description: "Explore verified 4 BHK homes in New Gurgaon (Sectors 81–95). Audited for master infrastructure, highway access, and developer solvency.",
    intro: "New Gurgaon offers modern planned sectors with wide roads, green belts, and excellent connectivity to NH-8, CPR, and Dwarka Expressway.",
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
    config: "3 bhk",
    h1: "3 BHK Apartments on Dwarka Expressway",
    title: "3 BHK on Dwarka Expressway Gurugram (2026 Grounded Comps) | Truth Estate",
    description: "Compare verified 3 BHK residences along Dwarka Expressway. Audited for construction milestones, RERA delivery dates, and fair price bands.",
    intro: "Dwarka Expressway offers modern 3 BHK family configurations with clubhouse amenities and rapid access to Delhi and Cyber City.",
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
    config: "3 bhk",
    h1: "3 BHK Apartments on Golf Course Extension Road",
    title: "3 BHK on Golf Course Extension Road Gurugram (2026 Audit) | Truth Estate",
    description: "Discover verified 3 BHK luxury residences on Golf Course Extension Road. Audited for living density, RERA timelines, and price credibility.",
    intro: "Gurugram's top luxury family address. Features world-class schools, hospitals, and direct access to Cyber Hub and Golf Course Road.",
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
    config: "penthouse",
    h1: "Penthouses on Golf Course Extension Road",
    title: "Penthouses on Golf Course Extension Road Gurugram (2026 Audit) | Truth Estate",
    description: "Exclusive rooftop penthouses on Golf Course Extension Road. Audited for private pool clearances, multi-level layouts, and panoramic views.",
    intro: "Top-floor sky residences along Golf Course Extension Road. Audited for sanctioned terrace areas, private elevator access, and architectural integrity.",
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
    config: "penthouse",
    h1: "Penthouses on Dwarka Expressway",
    title: "Penthouses on Dwarka Expressway Gurugram (2026 Audit) | Truth Estate",
    description: "Verified sky mansions and duplex penthouses along Dwarka Expressway. Audited for RERA sanctioned terraces, high ceilings, and panoramic city views.",
    intro: "Luxury top-floor sky homes on Dwarka Expressway. Screened for genuine builder pricing, elevator speeds, and terrace approvals.",
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
    config: "4 bhk",
    h1: "4 BHK Apartments on Dwarka Expressway Under ₹5 Cr",
    title: "4 BHK on Dwarka Expressway Under ₹5 Cr (2026 Grounded Comps) | Truth Estate",
    description: "Verified 4 BHK apartments on Dwarka Expressway under ₹5 Crore. Filtered against developer filed rates to eliminate false listings.",
    intro: "Every tracked 4 BHK project on Dwarka Expressway with entry pricing under ₹5 Cr. Audited for highway accessibility, sector infrastructure, and RERA delivery dates.",
    faqs: [
      {
        q: "Can I get a 4 BHK on Dwarka Expressway under ₹5 Cr in 2026?",
        a: "Yes, prominent projects by Puri, Smartworld, Whiteland, and Godrej offer entry 4 BHK configurations under ₹5 Cr.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && hasCorridor("dwarka expressway")(p) && underUnitCr("4 bhk", 5)(p),
    pricePage: true,
  },
  {
    slug: "4-bhk-spr-under-5-cr",
    config: "4 bhk",
    h1: "4 BHK Apartments on SPR Under ₹5 Cr",
    title: "4 BHK on Southern Peripheral Road SPR Under ₹5 Cr (2026 Audit) | Truth Estate",
    description: "Compare verified 4 BHK residences on SPR under ₹5 Crore. Audited for builder financial stability, RERA timelines, and fair rate benchmarks.",
    intro: "Southern Peripheral Road 4 BHK developments offering entry pricing under ₹5 Cr. Ranked by TruthScore and construction milestones.",
    faqs: [
      {
        q: "What are the best 4 BHK options on SPR under ₹5 Cr?",
        a: "Signature Global Titanium, Tulip Monsella, and Whiteland provide high-ranked options in this category.",
      },
    ],
    match: (p) => hasConfig("4 bhk")(p) && (hasCorridor("spr")(p) || hasCorridor("southern peripheral")(p)) && underUnitCr("4 bhk", 5)(p),
    pricePage: true,
  },
  {
    slug: "3-bhk-dwarka-expressway-under-2-5-cr",
    config: "3 bhk",
    h1: "3 BHK Apartments on Dwarka Expressway Under ₹2.5 Cr",
    title: "3 BHK on Dwarka Expressway Under ₹2.5 Cr (2026 Verified Comps) | Truth Estate",
    description: "Verified 3 BHK apartments along Dwarka Expressway under ₹2.5 Crore. Ranked by construction pace, legal safety, and real usable carpet area.",
    intro: "Top-value 3 BHK residences on Dwarka Expressway under ₹2.5 Cr. Screened against filed builder rates for genuine pricing.",
    faqs: [
      {
        q: "Where can I find 3 BHK homes under ₹2.5 Cr on Dwarka Expressway?",
        a: "Sectors 102, 103, 104, and 108 have the highest concentration of high-scoring 3 BHK units under ₹2.5 Cr.",
      },
    ],
    match: (p) => hasConfig("3 bhk")(p) && hasCorridor("dwarka expressway")(p) && underUnitCr("3 bhk", 2.5)(p),
    pricePage: true,
  },
];

/* A cluster page earns its place by having something to list. Below
   this, a page is the thin/doorway pattern search engines punish and a
   dead end for a reader — it stays out of the build and the sitemap
   until the data fills in, and returns automatically when it does. */
export const MIN_CLUSTER_PROJECTS = 3;

export function activeApartmentClusters(projects: ProjectIntel[]): ApartmentCluster[] {
  return APARTMENT_CLUSTERS.filter((c) => projects.filter(c.match).length >= MIN_CLUSTER_PROJECTS);
}

export const apartmentClusterBySlug = (slug: string): ApartmentCluster | undefined =>
  APARTMENT_CLUSTERS.find((c) => c.slug === slug);
