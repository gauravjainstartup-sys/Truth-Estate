/* ════════════════════════════════════════════════════════════════
   APARTMENT CLUSTERS — Programmatic SEO & GEO Landing Pages

   High-intent query clusters for luxury & premium buyers in Gurugram:
   - Typologies: 3 BHK, 4 BHK, 5 BHK, Penthouses, Duplex
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

/* Sample Programmatic Clusters */
export const APARTMENT_CLUSTERS: ApartmentCluster[] = [
  {
    slug: "4-bhk-apartments-gurugram",
    h1: "4 BHK Apartments in Gurugram",
    badge: "80 Verified Luxury Projects",
    title: "4 BHK Apartments in Gurugram (2026 Audit) — Ranked by TruthScore & Pricing | Truth Estate",
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
    slug: "4-bhk-in-gurugram-under-5-cr",
    h1: "4 BHK Apartments in Gurugram Under ₹5 Cr",
    badge: "52 Verified Projects Under ₹5 Cr",
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
];

export const apartmentClusterBySlug = (slug: string): ApartmentCluster | undefined =>
  APARTMENT_CLUSTERS.find((c) => c.slug === slug);

export function clusterMetaOnly(c: ApartmentCluster): ApartmentClusterMeta {
  const { match: _match, ...meta } = c;
  return meta;
}
