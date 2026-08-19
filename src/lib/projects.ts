/* ════════════════════════════════════════════════════════════════
   PROJECT INTELLIGENCE — one honest dossier per project.
   Built on the journey dataset, enriched with cross-links to the
   developer and market dossiers, and a Truth Score "anatomy": the
   score broken into six independently-assessed inputs, each shown as
   a signal (strong / moderate / strained) — the black box, opened.
   ════════════════════════════════════════════════════════════════ */

import { PROJECTS, type Project } from "./journey";
import { BAND_RANK, DEVELOPERS, FIN_METRICS, type FinBand, type FinRating, type DeveloperIntel } from "./developers";
import { MARKETS, fmtPsf, type MarketIntel } from "./markets";

export { fmtPsf };

/* ── Slugs & cross-links ───────────────────────────────────────── */
export const projectSlug = (name: string) =>
  name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const DEV_SLUG: Record<string, string> = {
  DLF: "dlf", Godrej: "godrej", M3M: "m3m", "Birla Estates": "birla", Smartworld: "smartworld", Emaar: "emaar",
};
export const developerSlugOf = (name: string): string | undefined => DEV_SLUG[name];
export const marketSlugOf = (name: string): string | undefined => MARKETS.find((m) => m.name === name)?.slug;

/* ── Truth Score anatomy — the six audited inputs ──────────────── */
export const SCORE_INPUTS = [
  { key: "delivery",     label: "Delivery certainty",   meaning: "The developer's on-time handover record" },
  { key: "legal",        label: "Legal & title",        meaning: "RERA, approvals and litigation signals" },
  { key: "financials",   label: "Developer strength",   meaning: "Balance-sheet health behind the build" },
  { key: "liquidity",    label: "Resale liquidity",     meaning: "How readily you can exit at a fair price" },
  { key: "pricing",      label: "Pricing & value",      meaning: "Entry price against the corridor benchmark" },
  { key: "construction", label: "Construction progress", meaning: "Build stage versus the committed schedule" },
] as const;

export type ScoreInputKey = (typeof SCORE_INPUTS)[number]["key"];

const LEGAL_BY_DEV: Record<string, FinRating> = {
  DLF: "strong", Godrej: "strong", "Birla Estates": "strong", Emaar: "strong", Smartworld: "strong", M3M: "moderate",
};

const rate = (r: FinRating) => (r === "strong" ? 3 : r === "moderate" ? 2 : 1);

function deliveryRating(p: Project): FinRating {
  const d = DEVELOPERS.find((x) => x.name === p.developer);
  if (d) return d.performance.onTimePct >= 88 ? "strong" : d.performance.onTimePct >= 78 ? "moderate" : "weak";
  return p.confidence === "High" ? "strong" : "moderate";
}

function financialsRating(p: Project): FinRating {
  const d = DEVELOPERS.find((x) => x.name === p.developer);
  if (!d) return "moderate";
  const vals = Object.values(d.financials).map(rate);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return avg >= 2.6 ? "strong" : avg >= 1.9 ? "moderate" : "weak";
}

function liquidityRating(p: Project): FinRating {
  if (p.tags.includes("Liquidity")) return "strong";
  const tier = MARKETS.find((m) => m.name === p.market)?.tier;
  return tier === "Established" ? "strong" : tier === "Growth" ? "moderate" : "weak";
}

function pricingRating(p: Project): FinRating {
  if (p.tags.includes("Value Buying")) return "strong";
  const txt = (p.reason + " " + p.strengths.join(" ")).toLowerCase();
  if (/below|value|entry/.test(txt)) return "strong";
  return "moderate";
}

function constructionRating(p: Project): FinRating {
  let base: FinRating = p.confidence === "High" ? "strong" : "moderate";
  if (p.tags.includes("Construction Progress")) base = "strong";
  if (base === "strong" && p.watchouts.some((w) => /timeline|possession|maturing/i.test(w))) base = "moderate";
  return base;
}

export function scoreAnatomy(p: Project): Record<ScoreInputKey, FinRating> {
  return {
    delivery: deliveryRating(p),
    legal: legalRating(p),
    financials: financialsRating(p),
    liquidity: liquidityRating(p),
    pricing: pricingRating(p),
    construction: constructionRating(p),
  };
}
function legalRating(p: Project): FinRating {
  return LEGAL_BY_DEV[p.developer] ?? "moderate";
}

/* ── Enriched project ──────────────────────────────────────────── */
export type ProjectIntel = Project & {
  slug: string;
  /* The public address, when this came from the live pipeline. Optional
     because the mock fallback set has none — projectHref() then serves the
     old address, which still resolves as a redirect stub. */
  seoSlug?: string | null;
  /* Pure inputs for the match engine (scoreMatch). Present on live-pipeline
     projects (built in liveProjectIntel); absent on the mock fallback set. */
  matchInput?: import("./matchEngine").MatchInput;
  devSlug?: string;
  marketSlug?: string;
  marketShort: string;
  /* THE CORRIDOR's rate, not this project's. It is built from
     avg_cost_sqft, which the pipeline stamps identically on every project
     in a micro-market — eight distinct values across ninety-seven
     projects. Fine for "how does this corridor price"; wrong for "what
     does this flat cost", which is what psfOwn is for. */
  psf: { low: number; avg: number; high: number } | null;
  /* THIS project's own filed rate per sq ft, from the developer's
     price_range_sqft. Present on 96 of 97. */
  psfOwn?: { low: number; high: number } | null;
  sizeBand: string | null; // indicative sq ft from ticket ÷ corridor psf
  anatomy: Record<ScoreInputKey, FinRating>;
  ops?: ProjectOps; // operational specifics for the projects we track most closely
  /* Live-pipeline data seams — a developer dossier / ROI model computed from
     the scored view rather than the hand-curated registries. When present,
     developerOf()/roiModel() serve these, so the SAME report components light
     up for pipeline projects without any UI change. */
  liveDeveloper?: DeveloperIntel;
  liveRoi?: RoiModel;
  /* The Truth Score's own breakdown — the scores AND weights it is
     actually built from, grouped into the five a buyer weighs. See
     fetchProjectPillars. When present these are used verbatim and the
     chart composes to the headline natively, because upstream computed
     the headline from exactly these numbers. */
  livePillars?: import("./supabase").LivePillarSet;
  /* The pipeline's legal read for the Legal Audit section: the analyst
     headline + key flags + as-of date, and the per-category risk breakdown
     (title_disputes → "Title disputes" · Critical/High/Medium/Low). */
  liveLegal?: LiveLegalRead;
  /* Where this score ranks inside the live tracked set — computed once per
     build (trackedRankOf) and consumed by rankContext. rank 0 = unscored,
     the hero context line stays hidden. */
  trackedRank?: { rank: number; total: number; topPct: number };
  /* Chronological Project Intelligence Wire dispatches */
  wireItems?: import("./supabase").ProjectWireItem[];
};

export type LegalRiskLevel = "Critical" | "High" | "Medium" | "Moderate" | "Low";
export type LiveLegalRead = {
  headline?: string;
  keyFlags: string[];
  lastUpdated?: string;
  risks: { label: string; level: LegalRiskLevel }[];
  /* The public records behind the legal read — legal_sources_summary, each a
     {source_type, link}. Section-level (the pool the analyst used), not mapped
     claim-by-claim; litigation cases carry their own per-case source_url. */
  sources?: { label: string; url: string }[];
};

function sizeBand(p: Project, avgPsf: number | undefined): string | null {
  if (!avgPsf) return null;
  const lo = Math.round((p.budget[0] * 1e7) / avgPsf / 50) * 50;
  const hi = Math.round((p.budget[1] * 1e7) / avgPsf / 50) * 50;
  return `${lo.toLocaleString("en-IN")}–${hi.toLocaleString("en-IN")} sq ft`;
}

/* ── Rich geo intelligence ─────────────────────────────────────────
   Project + POI coordinates drive a coordinate-accurate interactive map;
   distances are computed by haversine so pins and labels never disagree.
   Categories map to the BE `nearby_infra` groups and connectivity JSON. */
export type GeoCat = "schools" | "offices" | "hospitals" | "retail" | "projects";
export type GeoPoi = {
  cat: GeoCat;
  name: string;
  sub: string; // sub-category / one-line descriptor
  lat: number;
  lng: number;
  rating?: number; // Google rating
  importance?: "High" | "Medium" | "Low";
};
export type LocationGeo = {
  center: { lat: number; lng: number };
  provenance?: string; // coordinate trust: verified | consistent | approximate (suspect never builds geo)
  radiusKm?: number; // map extent, default 2
  nearby: GeoPoi[];
  connectivity: {
    metro?: { name: string; line: string; km: number; min: number };
    roads: { name: string; km: number; type: "Direct" | "Indirect" }[];
    airport?: { name: string; km: number; min: number };
    business: { name: string; km: number; min: number }[];
    lastMile?: {
      roadWidth?: string; surface?: string; autoCab?: string;
      bus?: string; walkability?: string; traffic?: string; bottlenecks?: string;
    };
  };
  scores?: {
    connectivity?: number; // /10
    lastMile?: number; // /10
    overall?: number; // /100
    byCat?: Partial<Record<"schools" | "offices" | "hospitals" | "retail" | "realEstate", number>>;
  };
  insights?: { verdict?: string; marketStage?: string; strengths?: string[]; gaps?: string[] };
};

/* ── Operational specifics ─────────────────────────────────────────
   Ground-truth vitals for the projects we track most closely. Figures
   come from RERA filings, quarterly progress reports (QPRs) and our own
   site tracking; where we don't actively track a data point we leave it
   out rather than estimate it. */
export type ProjectOps = {
  address?: string; // street-level address for the hero + map
  reviewed?: string; // when we last re-checked this project's data ("3 Jul 2026")
  lastUpdated?: string; // DB-driven latest refresh across dimensions ("30 Jun 2026")
  /* Hero status tag. "delivered" once construction is filed at 100% (OC/CC
     territory); "new-launch" while the RERA registration is within 3 months
     of today. Both override the build-percentage / handover labels. */
  lifecycle?: "delivered" | "new-launch";
  ocDate?: string; // Occupancy/Completion Certificate date, day-precision ("9 Jun 2026")
  ocCertificateUrl?: string; // link to the signed OC/CC document, opened in a new tab
  deliveredAheadMonths?: number; // for a delivered project: months the OC beat the RERA promise (+ = early, − = late)
  units?: number;
  towers?: number;
  floors?: string; // indicative floor count, may be a range ("34–38")
  landAcres?: number;
  openAreaPct?: number;
  density?: number; // units / acre
  carpetSqft?: number;
  launch?: string;
  possession?: string; // RERA-committed handover
  reraId?: string;
  reraUrl?: string; // project-specific RERA filing link (else the registry home)
  reraNote?: string;
  /* Price history — the PSF journey since launch (Chapter III). currentLow/High
     bound today's tracked range; premium & CAGR are derived, not stored. */
  price?: { launchPsf: number; launchDate: string; currentLow: number; currentHigh: number };
  /* Per-configuration homes — carpet/super/balcony areas and the indicative
     ticket band. Efficiency & loading are derived, never stored. `plan` is an
     optional licensed 2D floor-plan image (relative to /public); when absent
     we render an indicative schematic. */
  homes?: { config: string; variant?: string; carpetSqft: number | null; superSqft: number; balconySqft?: number; priceCr: number; plan?: string; plans?: { src: string; label: string }[]; beds?: number }[];
  /* Imagery (relative to /public). `render` is the developer's marketing
     render; `sitePhotos` are our dated field-visit photographs. Absent →
     brand-safe schematic stand-ins render in their place. */
  media?: {
    render?: string;
    heroImage?: string;
    /* Chapter I parts II/IV/V — images for now; PDFs/data later. */
    masterplan?: { src: string; read: string };
    brochure?: string[]; // page images, cover first
    brochurePdf?: string; // PDF fallback (URL or data: URI) — opens as a link when no page images exist
    brochureThumb?: string; // build-rendered page-1 cover — shown so the PDF itself never loads pre-click
    paymentPlan?: { src: string; read: string };
    paymentPlanPdf?: string; // PDF fallback — opens as a link when the plan isn't an image
    paymentPlanThumb?: string; // build-rendered page-1 cover
    costSheet?: string;
    sitePhotos?: { src: string; asOf: string; note?: string }[];
  };
  /* Structured location intelligence (Chapter II · Location). */
  location?: {
    pois?: { name: string; sub: string; rating?: number; dist: string; key?: boolean }[];
    connectivity?: { icon: string; name: string; sub: string; dist: string; tag: string; direct?: boolean }[];
    infra?: { cat: string; status: string; title: string; body: string; impact: "High" | "Medium"; eta: string; source?: { name: string; url?: string; date?: string } }[];
    /* Rich geo intel — drives the interactive map + connectivity readout.
       When present, the Location pillar renders the map-led layout. */
    geo?: LocationGeo;
  };
  construction?: {
    actualPct: number; // built vs plan, latest QPR
    expectedPct: number; // % RERA required by the quarter-end (filed value)
    absorptionPct: number; // units sold / launched
    reraDate: string; // committed possession (month-year)
    predictedDate: string; // our execution-adjusted estimate (month-year)
    reraDateFull?: string; // committed possession, day-precision where filed
    predictedDateFull?: string; // predicted delivery, day-precision where derived
    aheadMonths?: number; // forecast lead over the RERA promise, months (1 dp, + ahead)
    qpr: string; // QPR the read is drawn from
    lastUpdated?: string; // day-precision date of the QPR this read is drawn from ("30 Jun 2026")
    delayChancePct?: number; // pipeline-scored delay probability (live rows)
    paceMonths?: number; // build pace vs schedule, months (+ ahead / − behind)
    constructionProofPdf?: string; // R2 link — the RERA QPR document
    salesProofPdf?: string; // R2 link — the sales-velocity proof (MIS / RERA)
  };
  usps?: { title: string; body: string }[];
};

export const OPS: Record<string, ProjectOps> = {
  "DLF Arbour": {
    address: "Sector 63, Golf Course Extension Road, Gurugram",
    reviewed: "3 Jul 2026",
    media: {
      heroImage: "images/aerial-dlf-arbour.webp",
      masterplan: { src: "images/demo/masterplan.webp", read: "Five towers hold the parcel's northern edge, freeing the south for the central green and the club — the low-density promise is visible in the plan itself." },
      brochure: ["images/demo/brochure-1.webp", "images/demo/brochure-2.webp", "images/demo/brochure-3.webp"],
      paymentPlan: { src: "images/demo/payment-plan.webp", read: "Construction-linked: ~35% in year one, the balance tracking slabs to possession." },
    },
    units: 1137,
    towers: 5,
    floors: "34–38",
    landAcres: 25.1,
    openAreaPct: 89,
    density: 45,
    carpetSqft: 2255,
    launch: "Jan 2023",
    possession: "Mar 2030",
    reraId: "RERA-GRG-1138-2022",
    price: { launchPsf: 12500, launchDate: "Jan 2023", currentLow: 17000, currentHigh: 19500 },
    homes: [
      { config: "3 BHK", variant: "Type A", carpetSqft: 1855, superSqft: 2650, balconySqft: 320, priceCr: 5.2 },
      { config: "3 BHK", variant: "Type B", carpetSqft: 1990, superSqft: 2840, balconySqft: 360, priceCr: 5.6 },
      { config: "4 BHK", variant: "Type A", carpetSqft: 2255, superSqft: 3225, balconySqft: 410, priceCr: 6.1 },
      { config: "4 BHK", variant: "Type B", carpetSqft: 2480, superSqft: 3540, balconySqft: 460, priceCr: 6.6 },
    ],
    location: {
      pois: [
        { name: "St. Xavier's High School", sub: "Premium co-ed K-12 · CBSE", rating: 4.4, dist: "0.4 km", key: true },
        { name: "The Heritage Xperiential", sub: "Tier-1 K-12 · IB / CBSE", rating: 4.6, dist: "0.88 km", key: true },
        { name: "DPS International", sub: "K-12 · CIE International", rating: 4.5, dist: "1.42 km", key: true },
      ],
      connectivity: [
        { icon: "◇", name: "Sector 55–56 Metro", sub: "Rapid Metro line", dist: "3.8 km", tag: "8 min" },
        { icon: "▤", name: "Golf Course Ext. Road", sub: "arterial frontage", dist: "0.3 km", tag: "Direct", direct: true },
        { icon: "✈", name: "IGI Airport · T3", sub: "via NH-48", dist: "23 km", tag: "30 min" },
        { icon: "▦", name: "DLF Cyber City", sub: "business district", dist: "12.5 km", tag: "22 min" },
      ],
      infra: [
        { cat: "Roads", status: "Approved", title: "14 km Elevated Corridor", body: "₹2,900 cr eight-lane, Ghata → NH-48; Phase 1 covers the Extension Road stretch.", impact: "High", eta: "2029" },
        { cat: "Metro", status: "Approved", title: "Sector 56 → Manesar Metro", body: "36 km double-decker line along GCER; links to RRTS + Manesar hub.", impact: "High", eta: "2030" },
        { cat: "Roads", status: "Approved", title: "Badshahpur Drain Road", body: "₹370 cr storm-drain concretisation with a load-bearing road on top.", impact: "Medium", eta: "2027" },
        { cat: "Roads", status: "Under constr.", title: "GMDA Sector 66 Revamp", body: "Service roads, cycle tracks & utility ducts near M3M IFC.", impact: "Medium", eta: "2026 Q4" },
      ],
      geo: {
        center: { lat: 28.4112, lng: 77.0905 },
        radiusKm: 2,
        nearby: [
          { cat: "schools", name: "The Heritage Xperiential", sub: "Tier-1 K-12 · IB / CBSE", lat: 28.4148, lng: 77.0985, rating: 4.6, importance: "High" },
          { cat: "schools", name: "St. Xavier's High School", sub: "Co-ed K-12 · CBSE", lat: 28.4105, lng: 77.0855, rating: 4.4, importance: "High" },
          { cat: "schools", name: "DPS International", sub: "K-12 · CIE International", lat: 28.4180, lng: 77.0882, rating: 4.5, importance: "Medium" },
          { cat: "offices", name: "AIPL Business Club", sub: "Grade-A IGBC-Gold IT park", lat: 28.4128, lng: 77.0948, rating: 4.4, importance: "High" },
          { cat: "offices", name: "M3M IFC", sub: "Grade-A financial centre", lat: 28.4035, lng: 77.0965, rating: 4.5, importance: "High" },
          { cat: "offices", name: "Capital Cyberscape", sub: "Grade-A office complex", lat: 28.4060, lng: 77.1020, rating: 4.3, importance: "Medium" },
          { cat: "hospitals", name: "W Pratiksha Hospital", sub: "Multi-specialty · trauma", lat: 28.4205, lng: 77.1005, rating: 4.3, importance: "High" },
          { cat: "hospitals", name: "Paras Health", sub: "Multi-specialty", lat: 28.4162, lng: 77.0838, rating: 4.2, importance: "Medium" },
          { cat: "retail", name: "Grand Hyatt Galleria", sub: "Luxury dining & boutiques", lat: 28.4122, lng: 77.0912, rating: 4.6, importance: "High" },
          { cat: "retail", name: "M3M 65th Avenue", sub: "High-street mall · PVR", lat: 28.4035, lng: 77.0965, rating: 4.4, importance: "High" },
          { cat: "retail", name: "AIPL Joy Street", sub: "High-street retail", lat: 28.4145, lng: 77.0958, rating: 4.3, importance: "Medium" },
          { cat: "projects", name: "Emaar Amaris", sub: "Ultra-luxury high-rise · UC", lat: 28.4135, lng: 77.0995, rating: 4.6, importance: "High" },
          { cat: "projects", name: "M3M Golf Estate", sub: "Luxury low-density · delivered", lat: 28.4090, lng: 77.0980, rating: 4.5, importance: "Medium" },
          { cat: "projects", name: "Oberoi 360 North", sub: "Ultra-luxury · UC", lat: 28.4062, lng: 77.0992, rating: 4.7, importance: "High" },
        ],
        connectivity: {
          metro: { name: "Sector 55–56 Metro", line: "Rapid Metro line", km: 3.5, min: 8 },
          roads: [
            { name: "Golf Course Extension Rd", km: 0.2, type: "Direct" },
            { name: "Golf Course Road", km: 1.5, type: "Direct" },
            { name: "NH-48", km: 8.5, type: "Indirect" },
          ],
          airport: { name: "IGI Airport · T3", km: 24, min: 30 },
          business: [
            { name: "One Horizon Centre", km: 4.5, min: 10 },
            { name: "Sohna Road corridor", km: 10, min: 15 },
            { name: "DLF Cyber City", km: 14, min: 22 },
          ],
          lastMile: {
            roadWidth: "Wide", surface: "Good", autoCab: "High", bus: "Limited",
            walkability: "Average", traffic: "Medium",
            bottlenecks: "Peak-hour build-ups at the Golf Course Extension Road service junctions and entry/exit merges during rush hour.",
          },
        },
        scores: {
          connectivity: 8.7, lastMile: 8.1, overall: 92,
          byCat: { schools: 18, offices: 19, hospitals: 13, retail: 15, realEstate: 27 },
        },
        insights: {
          marketStage: "Premium corridor · high-growth",
          verdict: "Sector 63 sits at the join where Golf Course Road's mature luxury strip meets the Extension corridor — sub-kilometre to Grade-A offices and high-street retail, with elite schools inside a 1 km loop. The one gap is rapid rail: the nearest metro is an 8-minute drive, not a walk.",
          strengths: [
            "Direct 0.2 km frontage onto Golf Course Extension Road, the corridor's spine.",
            "Grade-A workspaces (AIPL Business Club, M3M IFC) inside a 1 km radius.",
            "Tier-1 international schools — Heritage, St. Xavier's — within a 1 km loop.",
            "Walkable luxury retail & dining at the Grand Hyatt precinct next door.",
          ],
          gaps: [
            "No rapid-metro station within walking range — an 8-minute drive to Sector 55–56.",
            "Peak-hour congestion at the Extension Road service junctions.",
          ],
        },
      },
    },
    reraNote: "Registered · Haryana RERA · active, no project-level complaints on record",
    construction: { actualPct: 57, expectedPct: 47, absorptionPct: 100, reraDate: "Mar 2030", predictedDate: "Nov 2029", qpr: "Q1 2026", paceMonths: 9 },
    usps: [
      { title: "A 1.5 elevator-per-apartment core ratio — rare in NCR", body: "Three high-speed (3.5 m/s) elevators serving just two apartments per core — a near-zero-wait standard borrowed from ultra-prime Manhattan and Hong Kong towers." },
      { title: "WATG-shaped landscape, ~89% open", body: "Grounds by WATG — among the world's top hospitality architects — with low-density green cover across 25 acres." },
      { title: "Embedded senior-living + healthcare enclave", body: "A purpose-built senior-living sub-project with a planned Medanta medical tie-up inside the same campus boundary — institutional-grade care on site." },
      { title: "Marque structural engineering", body: "Structural design by Thornton Tomasetti, whose résumé includes the Petronas Towers and the Kingdom Tower — pedigree well above segment norm." },
    ],
  },
  "DLF Privana South": {
    address: "Sector 77, Southern Peripheral Road, Gurugram",
    reviewed: "1 Jul 2026",
    media: {
      heroImage: "images/aerial-dlf-privana-south.webp",
      masterplan: { src: "images/demo/masterplan.webp", read: "Seven towers ring a single central green with the lake at its heart — most homes look inward at the landscape, not outward at the road." },
      brochure: ["images/demo/brochure-1.webp", "images/demo/brochure-2.webp", "images/demo/brochure-3.webp"],
      paymentPlan: { src: "images/demo/payment-plan.webp", read: "Construction-linked: ~35% in year one, the balance tracking slabs to possession." },
    },
    homes: [
      { config: "3 BHK", variant: "Type A", carpetSqft: 1755, superSqft: 2500, balconySqft: 300, priceCr: 5.2 },
      { config: "3 BHK", variant: "Type B", carpetSqft: 1880, superSqft: 2680, balconySqft: 340, priceCr: 5.6 },
      { config: "4 BHK", variant: "Type A", carpetSqft: 2150, superSqft: 3080, balconySqft: 390, priceCr: 6.6 },
      { config: "4 BHK", variant: "Type B", carpetSqft: 2380, superSqft: 3400, balconySqft: 440, priceCr: 7.4 },
    ],
    units: 1113, towers: 7, floors: "36–40", landAcres: 25, openAreaPct: 78, density: 44,
    price: { launchPsf: 14500, launchDate: "Jul 2023", currentLow: 18500, currentHigh: 21000 },
    launch: "2023", possession: "Dec 2028", reraId: "RERA-GRG-905-2023", reraNote: "Registered · Haryana RERA",
    construction: { actualPct: 41, expectedPct: 38, absorptionPct: 100, reraDate: "Dec 2028", predictedDate: "Oct 2028", qpr: "Q1 2026" },
  },
  "Godrej Aristocrat": {
    address: "Sector 49, Golf Course Extension Road, Gurugram",
    units: 434, towers: 4, landAcres: 8.4, openAreaPct: 75, density: 52,
    launch: "2024", possession: "Jun 2029", reraNote: "Registered · Haryana RERA",
    construction: { actualPct: 22, expectedPct: 20, absorptionPct: 95, reraDate: "Jun 2029", predictedDate: "Aug 2029", qpr: "Q1 2026" },
  },
  "M3M Golf Estate II": {
    address: "Sector 65, Golf Course Extension Road, Gurugram",
    units: 624, towers: 6, landAcres: 18, openAreaPct: 70, density: 35,
    launch: "2023", possession: "Dec 2028", reraNote: "Registered · Haryana RERA",
    construction: { actualPct: 38, expectedPct: 40, absorptionPct: 82, reraDate: "Dec 2028", predictedDate: "Jun 2029", qpr: "Q1 2026" },
  },
  "Birla Navya": {
    address: "Sector 63A, Golf Course Extension Road, Gurugram",
    units: 424, towers: 4, landAcres: 10, openAreaPct: 80, density: 42,
    launch: "2023", possession: "Mar 2029", reraNote: "Registered · Haryana RERA",
    construction: { actualPct: 30, expectedPct: 28, absorptionPct: 88, reraDate: "Mar 2029", predictedDate: "May 2029", qpr: "Q1 2026" },
  },
  /* Address-only entries — projects we track at corridor depth; deeper ops
     (QPR, units, price history) land as our coverage expands. */
  "Smartworld One DXP": { address: "Sector 113, Dwarka Expressway, Gurugram" },
  "Signature Global Titanium SPR": { address: "Sector 71, Southern Peripheral Road, Gurugram" },
  "Puri Aravallis": { address: "Sector 61, Golf Course Extension Road, Gurugram" },
  "Conscient Parq": { address: "Sector 80, NH-48, New Gurugram" },
  "Emaar Urban Ascent": { address: "Sector 112, Dwarka Expressway, Gurugram" },
};

export function enrich(p: Project): ProjectIntel {
  const market = MARKETS.find((m) => m.name === p.market);
  return {
    ...p,
    slug: projectSlug(p.name),
    devSlug: developerSlugOf(p.developer),
    marketSlug: market?.slug,
    marketShort: market?.short ?? p.market,
    psf: market?.psf ?? null,
    sizeBand: sizeBand(p, market?.psf.avg),
    anatomy: scoreAnatomy(p),
    ops: OPS[p.name],
  };
}

export const PROJECT_INTEL: ProjectIntel[] = PROJECTS.map(enrich).sort((a, b) => b.truthScore - a.truthScore);

export function projectBySlug(slug: string): ProjectIntel | undefined {
  return PROJECT_INTEL.find((p) => p.slug === slug);
}

export function projectByName(name: string): ProjectIntel | undefined {
  return PROJECT_INTEL.find((p) => p.name === name);
}

export function alternativesIn(market: string, excludeName: string): ProjectIntel[] {
  return PROJECT_INTEL.filter((p) => p.market === market && p.name !== excludeName);
}

/* ── Derived intelligence ──────────────────────────────────────────
   Everything below is composed from data we already hold — the project,
   its developer dossier and its market dossier — so every report reads
   rich without us inventing precision we can't stand behind. */

export const developerOf = (p: ProjectIntel): DeveloperIntel | undefined =>
  p.liveDeveloper ?? DEVELOPERS.find((d) => d.name === p.developer);
export const marketOf = (p: ProjectIntel): MarketIntel | undefined =>
  MARKETS.find((m) => m.name === p.market);

/* Deep tower & unit intelligence artifacts — the gated Tier-2 layer (3D site
   model, sun-path, per-unit scoring). Only the projects our engineers have
   modelled have one today; the rest show the "in production" hook. `file` is
   relative to /public (the component prefixes basePath). `sample` is one real
   unit shown free — the teaser that sells the subscribe. */
export type TowerIntelMeta = {
  file: string;
  preview: string; // static hero image of the live 3D advisor
  towers: number;
  unitTypes: number; // total layouts; we reveal one, lock the rest
  totalUnits: string; // headline count across all floors
  sample: {
    ref: string;
    type: string;
    sun: string; // direct-sun hours/day (the tool's headline metric)
    sunPct: number; // 0–100, for the teaser bar
    ventilation: string;
    vastu: string;
    idealFor: string;
  };
};

export const TOWER_INTEL: Record<string, TowerIntelMeta> = {
  // keyed by the DB project_name (source of truth) so the advisor attaches
  // to the live page; the sample dossier carries the same name
  /* DLF The Arbour — 3D advisor withheld from the live site (founder's call).
     Kept here so re-enabling is just un-commenting this block. While hidden,
     the project page shows the "request the 3D" flow and Arbour is dropped from
     the Sun & Vastu showcase, the map sun-pins and the chatbot's unit data.
  "DLF The Arbour": {
    file: "tower-intel/dlf-arbour.html",
    preview: "tower-intel/preview.jpg",
    towers: 5,
    unitTypes: 20,
    totalUnits: "800+",
    // Mirrors the advisor's own #1-for-winter-sun pick, so the teaser stays
    // honest against what a buyer sees once unlocked.
    sample: {
      ref: "Tower A-1 · Unit U1",
      type: "4 BHK · south-east corner",
      sun: "10.0 h/day",
      sunPct: 83,
      ventilation: "Dual-aspect corner · cross-ventilates",
      vastu: "South-east · fire corner (kitchen zone)",
      idealFor: "Large & joint families (4–6)",
    },
  },
  */
  "Signature Global Titanium SPR": {
    file: "tower-intel/signature-global-titanium-spr.html",
    preview: "tower-intel/signature-global-titanium-spr-preview.jpg",
    towers: 7,
    unitTypes: 2, // 4.5 BHK (2-to-core) & 3.5 BHK (3-to-core)
    totalUnits: "640+",
    // Mirrors the advisor's own #1-for-winter-sun pick, so the teaser stays
    // honest against what a buyer sees once the model opens.
    sample: {
      ref: "Tower T-6 · Flat 101",
      type: "4.5 BHK · east-facing living · lagoon view",
      sun: "4.6 h/day",
      sunPct: 79,
      ventilation: "2-to-core plate · dual-aspect corner",
      vastu: "East-facing living · morning light",
      idealFor: "Large families (4.5 BHK)",
    },
  },
  "Elan The Presidential": {
    file: "tower-intel/elan-the-presidential.html",
    preview: "tower-intel/elan-the-presidential-preview.jpg",
    towers: 8, // the config-detailed towers modelled today (T-1…T-6, T-14/T-15)
    unitTypes: 6, // 3/4/5 BHK, each a head + mirror-wing plate
    totalUnits: "760+",
    // Mirrors the advisor's own top pick (strongest winter sun), so the teaser
    // stays honest against what a buyer sees once the model opens.
    sample: {
      ref: "Tower T-6 · Line 103",
      type: "4 BHK · lagoon-facing head",
      sun: "8.5 h/day",
      sunPct: 82,
      ventilation: "Head unit · nose to the lagoon · light on 3 sides",
      vastu: "South lagoon deck · North (Kuber) entrance",
      idealFor: "Large families (4 BHK)",
    },
  },
  "Elan The Emperor": {
    file: "tower-intel/elan-the-emperor.html",
    preview: "tower-intel/elan-the-emperor-preview.jpg",
    towers: 5, // T-10/11/12 (4 BHK) + T-16/17 (5 BHK)
    unitTypes: 6, // 4 & 5 BHK, each a head + two mirror wings
    totalUnits: "670+",
    // Mirrors the advisor's own #1 pick (top composite), so the teaser stays
    // honest against what a buyer sees once the model opens.
    sample: {
      ref: "Tower T-12 · Line 102",
      type: "4 BHK · NE-facing corner",
      sun: "4.6 h/day (upper floors)",
      sunPct: 80,
      ventilation: "Corner line · dual-aspect cross-flow",
      vastu: "NE sunrise living · North (Kuber) entrance",
      idealFor: "Large families (4 BHK)",
    },
  },
  "Puri The Aravallis": {
    file: "tower-intel/puri-the-aravallis.html",
    preview: "tower-intel/puri-the-aravallis-preview.jpg",
    towers: 2, // Tower A & Tower B, G+42, quad-core
    unitTypes: 2, // 3 BHK 2250 (north) & 4 BHK 2750 (south)
    totalUnits: "330+", // 2 towers × 42 floors × 4 corners
    // Mirrors the advisor's own #1 pick (top composite), so the teaser stays
    // honest against what a buyer sees once the model opens.
    sample: {
      ref: "Tower B · Line 103",
      type: "4 BHK · south-facing corner",
      sun: "10.0 h/day",
      sunPct: 85,
      ventilation: "Corner unit · dual-aspect cross-flow",
      vastu: "South amenity deck · North entry (from core)",
      idealFor: "Large families (4 BHK)",
    },
  },
  "Birla Arika": {
    file: "tower-intel/birla-arika.html",
    preview: "tower-intel/birla-arika-preview.jpg",
    towers: 4, // T1/T2/T3 (4 BHK 4300) + T7 (4 BHK 4900), G+40; T4–T6 next phase
    unitTypes: 6, // six sanctioned TYPE plates — each line has its own layout
    totalUnits: "320+", // 3 towers × 40 floors × 2 lines + T7 × 41 × 2
    // Mirrors the advisor's own #1 pick (top composite), so the teaser stays
    // honest against what a buyer sees once the model opens.
    sample: {
      ref: "Tower T2 · Line 01",
      type: "4 BHK 4300 (Type 1) · south-facing",
      sun: "6.7 h/day (winter)",
      sunPct: 84,
      ventilation: "Corner line · light on 3 sides",
      vastu: "South master deck · East living & entry",
      idealFor: "Large families (4 BHK)",
    },
  },
  "Ashiana Amarah Phase - 1 & 1A": {
    file: "tower-intel/ashiana-amarah-phase-1.html",
    preview: "tower-intel/ashiana-amarah-phase-1-preview.jpg",
    towers: 4, // T1/T3 Lavender (3 BHK 1000) · T2 Tulip+ (3 BHK 1205) · T4 Iris+ (4 BHK 1408), Stilt+14
    unitTypes: 3, // three sanctioned plans — Lavender / Tulip+ / Iris+
    totalUnits: "110+", // 4 towers × 14 floors × 2 lines
    // Mirrors the advisor's own #1 pick (top composite): T1 is the only
    // south-facing tower, so it leads the phase on winter sun.
    sample: {
      ref: "Tower T1 · Line 01",
      type: "Lavender · 3 BHK 1000 · south-facing",
      sun: "6.7 h/day (winter · best in phase)",
      sunPct: 84,
      ventilation: "End line · cross-light on 3 sides",
      vastu: "South sun-deck · keep the NE open",
      idealFor: "Sun-first & nuclear families (3 BHK)",
    },
  },
  "Ashiana Amarah Phase - 2": {
    file: "tower-intel/ashiana-amarah-phase-2.html",
    preview: "tower-intel/ashiana-amarah-phase-2-preview.jpg",
    towers: 4, // T5 & T7 Lavender (3 BHK 1000), T6 & T8 Tulip+ (3 BHK 1205), Stilt+14
    unitTypes: 2, // Lavender / Tulip+
    totalUnits: "110+", // 4 towers × 14 floors × 2 lines
    sample: {
      ref: "Tower T5 · Line 01",
      type: "Lavender · 3 BHK 1000 · east-facing",
      sun: "4.1 h/day (winter · all morning)",
      sunPct: 68,
      ventilation: "End line · cross-light on 3 sides",
      vastu: "East sunrise deck · morning light",
      idealFor: "Sun-first & nuclear families (3 BHK)",
    },
  },
  "Ashiana Amarah Phase - 3 & 3A": {
    file: "tower-intel/ashiana-amarah-phase-3.html",
    preview: "tower-intel/ashiana-amarah-phase-3-preview.jpg",
    towers: 4, // T9 & T10 Tulip+ (3 BHK+3T 1205), T11 & T12 Lavender (3 BHK+2T 1000), Stilt+14
    unitTypes: 2, // Tulip+ / Lavender
    totalUnits: "110+", // 4 towers × 14 floors × 2 lines
    sample: {
      ref: "Tower T9 · Line 02",
      type: "Tulip+ · 3 BHK 1205 · south-west corner",
      sun: "6.9 h/day (winter)",
      sunPct: 87,
      ventilation: "Corner line · light on 3 sides",
      vastu: "South-west deck · steady afternoon light",
      idealFor: "Nuclear families (3 BHK)",
    },
  },
  "Ashiana Amarah Phase - 4": {
    file: "tower-intel/ashiana-amarah-phase-4.html",
    preview: "tower-intel/ashiana-amarah-phase-4-preview.jpg",
    towers: 5, // T13/T15/T16 Tulip+ (3 BHK 1205), T14 & T17 Lavender (3 BHK 1000), Stilt+14
    unitTypes: 2, // Tulip+ / Lavender
    totalUnits: "140+", // 5 towers × 14 floors × 2 lines
    sample: {
      ref: "Tower T17 · Line 01",
      type: "Lavender · 3 BHK 1000 · south-west facing",
      sun: "6.9 h/day (winter)",
      sunPct: 86,
      ventilation: "End line · cross-light on 3 sides",
      vastu: "South-west park deck",
      idealFor: "Sun-first families (3 BHK)",
    },
  },
  "Ashiana Amarah Phase - 5": {
    file: "tower-intel/ashiana-amarah-phase-5.html",
    preview: "tower-intel/ashiana-amarah-phase-5-preview.jpg",
    towers: 4, // T18 Iris+ (4 BHK 1444), T19 & T21 Lavender (3 BHK 1000), T20 Tulip+ (3 BHK 1205), G+14
    unitTypes: 3, // Iris+ / Lavender / Tulip+
    totalUnits: "110+", // 4 towers × 14 floors × 2 lines
    sample: {
      ref: "Tower T19 · Line 01",
      type: "Lavender · 3 BHK 1000 · south-facing",
      sun: "6.4 h/day (winter · best in phase)",
      sunPct: 90,
      ventilation: "End line · cross-light on 3 sides",
      vastu: "South sun-deck · keep the NE open",
      idealFor: "Sun-first & nuclear families (3 BHK)",
    },
  },
  // DB project_name is "M3M Elie Saab" (page slug m3m-elie-saab); the db3d
  // pipeline dir keeps the longer marketing slug m3m-residences-by-elie-saab.
  "M3M Elie Saab": {
    file: "tower-intel/m3m-residences-by-elie-saab.html",
    preview: "tower-intel/m3m-residences-by-elie-saab-preview.jpg",
    towers: 3, // ES-1/ES-2/ES-3, G+40, quad-core plates
    unitTypes: 3, // three sanctioned 4 BHK plans — 4205 / 4520 / 4655 sq ft
    totalUnits: "480+", // 3 towers × 40 floors × 4 lines
    // Mirrors the advisor's own #1 pick (top composite), so the teaser stays
    // honest against what a buyer sees once the model opens.
    sample: {
      ref: "Tower ES-2 · Line 103",
      type: "4 BHK 4655 · east-facing",
      sun: "4.1 h/day (winter · all morning)",
      sunPct: 78,
      ventilation: "Quad-core plate · top-3 airflow in the project",
      vastu: "East sunrise energy · living & dining light",
      idealFor: "Large families (4 BHK)",
    },
  },
  // DB project_name "DLF Privana North" (page slug dlf-privana-north). Six G+50
  // quad-core point towers (56×34 m), single 4 BHK + servant plate; blue-glass
  // massing with curved wrap-around deck balconies (per the sanctioned plans).
  // Tower positions are the founder's exact per-tower lat/long (converted to the
  // model's metric frame); the ground is the real parcel polygon traced from the
  // official siteplan and georeferenced to those coords. Interior 3D + 2D floor-
  // plan layer is built from the sanctioned 4 BHK + SR plan (traced walls +
  // textures). Each tower's rotation is measured from the siteplan footprint
  // (min-area-rect detection); units face E/NE/NW/SE/SW/W around the arc, and the
  // SE-facing lines catch all-day winter sun (~8 h, grade A). Advisor leads with 3D + sun sim.
  "DLF Privana North": {
    file: "tower-intel/dlf-privana-north.html",
    preview: "tower-intel/dlf-privana-north-preview.jpg",
    towers: 6, // A–F, G+50, quad-core point towers (4 units/floor around a central core)
    unitTypes: 4, // one 4 BHK + servant plate, 4 lines per floor (each a different orientation)
    totalUnits: "1,200+", // 6 towers × 50 floors × 4 lines
    // Mirrors the advisor's own #1 composite pick, so the teaser stays honest.
    sample: {
      ref: "Tower B · Line 03",
      type: "4 BHK + servant · south-east facing",
      sun: "8.2 h/day (winter)",
      sunPct: 92,
      ventilation: "Quad-core point tower · 2-side airflow",
      vastu: "SE living & deck · all-day winter sun",
      idealFor: "Sun-first buyers & large families (4 BHK)",
    },
  },
};
// Exact DB-name match first (Arbour/Titanium), then a slug fallback so the
// advisor attaches to the live page regardless of the DB name's exact casing.
// Exported so the projects-geo layer can flag 3D-enabled projects from the
// same registry — sun pins on the maps light up automatically as advisors ship.
export const tiSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const towerIntelMeta = (p: ProjectIntel): TowerIntelMeta | undefined =>
  TOWER_INTEL[p.name] ?? Object.entries(TOWER_INTEL).find(([k]) => tiSlug(k) === p.slug)?.[1];

/* Parse an appreciation band like "+18–25%" → its midpoint (%) */
export function bandMid(s: string): number {
  const nums = s.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/* Delay-adjusted ROI — corridor benchmark vs execution-adjusted.
   Anchored to the corridor's tracked 3-yr appreciation, annualised, then
   nudged by the developer's on-time record. Modelled, clearly labelled. */
export type RoiModel = {
  horizonYears: number;
  corridor3Y: string;
  benchCagr: number;
  adjCagr: number;
  /* The ₹-value projections need an entry price; a handful of live rows carry a
     CAGR but no ticket (no filed price yet), so these are null there — the CAGR
     still stands (it is price-independent). Consumers must guard on null. */
  ticketCr: number | null;
  benchValueCr: number | null;
  adjValueCr: number | null;
  deltaCr: number | null;
};

export function roiModel(p: ProjectIntel): RoiModel | null {
  if (p.liveRoi) return p.liveRoi; // pipeline-computed model for live projects
  const market = marketOf(p);
  if (!market) return null;
  const horizonYears = 5;
  const total3Y = bandMid(market.appreciation3Y);
  const benchCagr = Math.round((Math.pow(1 + total3Y / 100, 1 / 3) - 1) * 1000) / 10;
  const onTime = developerOf(p)?.performance.onTimePct ?? 80;
  const adjCagr = Math.round((benchCagr + (onTime - 85) / 10) * 10) / 10;
  const ticketCr = (p.budget[0] + p.budget[1]) / 2;
  const grow = (r: number) => Math.round(ticketCr * Math.pow(1 + r / 100, horizonYears) * 100) / 100;
  const benchValueCr = grow(benchCagr);
  const adjValueCr = grow(adjCagr);
  return {
    horizonYears,
    corridor3Y: market.appreciation3Y,
    benchCagr,
    adjCagr,
    ticketCr: Math.round(ticketCr * 10) / 10,
    benchValueCr,
    adjValueCr,
    deltaCr: Math.round((adjValueCr - benchValueCr) * 100) / 100,
  };
}

/* Risk matrix — read straight off the audited Truth Score inputs. */
export type RiskLevel = "Low" | "Moderate" | "Elevated";
const riskFrom = (r: FinRating): RiskLevel => (r === "strong" ? "Low" : r === "moderate" ? "Moderate" : "Elevated");
export function riskMatrix(p: ProjectIntel): { label: string; level: RiskLevel; note: string }[] {
  const a = p.anatomy;
  return [
    { label: "Title & RERA", level: riskFrom(a.legal), note: "Registration, approvals & land-title signals" },
    { label: "Developer", level: riskFrom(a.financials), note: "Balance-sheet strength behind the build" },
    { label: "Delivery", level: riskFrom(a.delivery), note: "Record of on-time handover" },
    { label: "Construction", level: riskFrom(a.construction), note: "Build progress vs the committed plan" },
  ];
}

/* Who the project genuinely serves — the investor-fit line. */
export function investorFit(p: ProjectIntel): string {
  const market = marketOf(p);
  const priorities = p.tags.slice(0, 3).join(", ").toLowerCase();
  const audience = p.tags.includes("Value Buying") || p.tags.includes("Early-Entry Pricing")
    ? "value-seeking investors and first-time buyers"
    : p.tags.includes("Luxury Lifestyle")
    ? "lifestyle-led end-users and upgraders"
    : "safety-focused end-users and long-term investors";
  return `Best suited for ${audience}${priorities ? ` who prioritise ${priorities}` : ""}${market ? ` — ${market.bestFor.toLowerCase()}` : ""}.`;
}

/* One honest sentence about a developer's balance sheet, from the same
   five metrics the audit cards show. Prose already written by the pipeline
   wins — a bare grade word ("concerning") does not, because that is what
   produced the duplicate this replaces. */
const FIN_ORDER: FinBand[] = ["strained", "watch", "moderate", "strong", "exceptional"];
function financialAnswer(p: ProjectIntel, dev: DeveloperIntel): string {
  const bands = FIN_METRICS.map((f) => dev.finBand?.[f.key]
    ?? (dev.financials[f.key] === "strong" ? "strong" : dev.financials[f.key] === "moderate" ? "moderate" : "watch"));
  const avg = bands.reduce((a, b) => a + BAND_RANK[b], 0) / bands.length;
  const overall = avg >= 4.3 ? "exceptional" : avg >= 3.5 ? "strong" : avg >= 2.6 ? "adequate" : avg >= 1.8 ? "one to watch" : "under real strain";
  const strong = bands.filter((b) => b === "strong" || b === "exceptional").length;
  const strained = bands.filter((b) => b === "strained").length;
  const worst = FIN_METRICS[bands.indexOf(FIN_ORDER.find((b) => bands.includes(b))!)];

  const note = (dev.finNote ?? "").trim();
  const usable = note.split(/\s+/).length > 3 && !/scoring pipeline|financial band from filings/i.test(note);

  /* `label`, not `full`: `full` is the ratio's name — "OCF / EBITDA" —
     which reads as a typo mid-sentence. The label is what it measures. */
  return `On our five-line read of ${p.developer}'s audited annual statements — leverage, interest cover, cash conversion, operating margin and inventory cover — the balance sheet is ${overall}. ${strong} of ${bands.length} ${strong === 1 ? "line scores" : "lines score"} strong or better${
    strained > 0 ? `, and ${strained} ${strained === 1 ? "is" : "are"} already strained` : ""
  }${worst && (strained > 0 || strong < bands.length) ? `; the weakest is ${worst.label.toLowerCase()}` : ""}.${usable ? ` ${note}` : ""}`;
}

/* Forensic FAQ — composed from the data; also emitted as FAQPage schema. */
export function projectFaqs(p: ProjectIntel): { q: string; a: string }[] {
  const dev = developerOf(p);
  const market = marketOf(p);
  const roi = roiModel(p);
  const faqs: { q: string; a: string }[] = [];

  if (dev) {
    const risk = p.anatomy.delivery === "strong" ? "low" : p.anatomy.delivery === "moderate" ? "moderate" : "elevated";
    faqs.push({
      q: `Is ${p.name} likely to be delivered on time?`,
      a: `${p.developer} has delivered ${dev.performance.delivered} of ${dev.performance.launched} launched projects with a ${dev.performance.onTimePct}% on-time record and roughly ${dev.performance.avgDelayMonths} months' average slippage. ${
        p.ops?.construction
          ? `The latest quarterly progress report puts construction at ${p.ops.construction.actualPct}% against an expected ${p.ops.construction.expectedPct}% — our execution-adjusted estimate is ${p.ops.construction.predictedDate} versus the RERA-committed ${p.ops.construction.reraDate}.`
          : `On our read the delivery risk is ${risk}.`
      }`,
    });
    /* This was `${dev.finNote} ${dev.verdict}`, and on every live developer
       BOTH of those fall back to the same one-word pipeline field. The
       answer on the page read, in full, "concerning concerning". Composed
       from the five-line audit instead — the same bands the Developer DNA
       cards are drawn from, so the FAQ and the section agree. */
    faqs.push({ q: `Is ${p.developer} financially sound?`, a: financialAnswer(p, dev) });
  }

  // Enrich with live Project Intelligence Wire facts (Contractor, Pacing & Statutory RERA)
  if (p.wireItems && p.wireItems.length > 0) {
    const constItem = p.wireItems.find((w) => w.category === "CONSTRUCTION") || p.wireItems[0];
    if (constItem) {
      const cleanFacts = (constItem.verifiedFacts || "").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
      faqs.push({
        q: `What is the latest 2026 construction update and contractor for ${p.name}?`,
        a: `${constItem.headline}. ${cleanFacts} Verified under ${constItem.sourceName}${constItem.sourceDocumentRef ? ` (${constItem.sourceDocumentRef})` : ""}.`,
      });
    }
    const regItem = p.wireItems.find((w) => w.category === "REGULATORY");
    if (regItem) {
      const cleanFacts = (regItem.verifiedFacts || "").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
      faqs.push({
        q: `What is the official HARERA registration and completion timeline for ${p.name}?`,
        a: `${regItem.headline}. ${cleanFacts} Official statutory filing source: ${regItem.sourceName}${regItem.sourceDocumentRef ? ` (${regItem.sourceDocumentRef})` : ""}.`,
      });
    }
  }

  if (market) {
    faqs.push({
      q: `What is the investment outlook for ${p.market}?`,
      a: `${market.verdict} Tracked 3-year appreciation is ${market.appreciation3Y}. ${market.futureTrend}`,
    });
  }
  if (roi) {
    faqs.push({
      q: `What return could ${p.name} realistically deliver?`,
      a: `Built up from the Gurgaon market rate — India 9% + Gurgaon 0.5% — and adjusted for ${p.name}'s Truth Score, our ${roi.horizonYears}-year model projects about ${roi.benchCagr}% a year if it delivers on our forecast, and ~${roi.adjCagr}% once the cost of its predicted delay is priced in. A modelled estimate — not a guarantee.`,
    });
  }
  faqs.push({
    q: `Is ${p.name} fairly priced?`,
    a: `${p.reason} The tracked ${p.marketShort} corridor trades at ${
      p.psf ? (p.psf.low === p.psf.high ? `≈${fmtPsf(p.psf.avg)} / sq ft` : `${fmtPsf(p.psf.low)}–${fmtPsf(p.psf.high)} / sq ft`) : "a range we track"
    }, and we assess this project's pricing & value as ${p.anatomy.pricing === "strong" ? "attractive" : "fair"} for the address.`,
  });
  return faqs;
}

/* ── Truth Score anatomy → five weighted pillars ────────────────────
   The six audited inputs, recomposed into the five pillars a buyer
   actually weighs — each with a graded band, an illustrative /10, a
   one-line "why" and its weight in the composite. Scores derive from the
   same ratings that build the Truth Score; the weights are fixed. */
export type PillarBand = "exceptional" | "strong" | "moderate" | "watch";
export type Pillar = {
  key: string; label: string; anchor: string;
  band: PillarBand; score: number; weight: number;
  /* The finding — the numbers this pillar actually turned up. PAID. */
  why: string;
  /* What the pillar examines, in one line. Shown in its place to a guest.
     The score and the band still show, so the curiosity gap stays open
     ("why only 5.2?") — what closes is handing over the answer. Reading
     "2 RERA projects, 0 delivered, 50% on-time" for free tells someone
     everything they came for, and nothing is left to buy. */
  about: string;
};

const PILLAR_ABOUT: Record<string, string> = {
  developer: "Their delivery record, balance sheet and litigation history.",
  construction: "Build stage against the RERA schedule, and how fast it is selling.",
  location: "The corridor, the connectivity, and what will actually move this price.",
  legal: "Title, RERA registration, approvals and the developer's legal signal.",
  usps: "Which of the claims hold real value, and which are brochure gloss.",
};

const MONTHS3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthIndex(s?: string): number {
  if (!s) return 0;
  const parts = s.trim().split(/\s+/);
  const y = parseInt(parts[parts.length - 1], 10);
  const m = Math.max(0, MONTHS3.indexOf(parts[0]));
  return (isNaN(y) ? 0 : y) * 12 + m;
}
const NOW_MONTH = monthIndex("Jul 2026"); // static-export "today"

const bandFromScore = (s: number): PillarBand => (s >= 9 ? "exceptional" : s >= 7.5 ? "strong" : s >= 6 ? "moderate" : "watch");
const round1 = (n: number) => Math.round(n * 10) / 10;
const ratingBase = (r: FinRating) => (r === "strong" ? 8.3 : r === "moderate" ? 6.8 : 5.0);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export const PILLAR_WEIGHTS = { developer: 0.25, construction: 0.22, location: 0.26, legal: 0.15, usps: 0.12 } as const;

/* ── Making the decomposition actually decompose ──────────────────────
   The anatomy is headed "What the 86 is made of" and draws each pillar's
   bar at its weight. It was not a decomposition of anything: the pillar
   scores were built independently and the weighted mean missed the Truth
   Score on 89 of 97 reports, by a median of 8.4 points and as much as
   15.5. A section whose entire job is to show how a number is composed
   has to compose it.

   The fix is a single shift applied to every pillar, not a rescale: with
   the weights summing to 1, adding δ to each score moves the weighted mean
   by exactly δ, so one subtraction lands it on the Truth Score while every
   gap between pillars survives untouched. Rescaling would have squashed
   those gaps toward each other and quietly flattened the thing a reader
   is looking at the chart to see.

   A floor stops a shift from printing a negative score. Anything held at
   the floor is frozen and its shortfall is redistributed across the
   pillars still free to move, which keeps the arithmetic exact rather
   than nearly right — the whole point of the exercise.

   Note which way the floor errs. It can only ever raise a score, so the
   harshest thing this report says about a developer is never harsher than
   the model produced. It bites on 8 of 485 pillar cells, all of them
   projects whose pipeline financial or legal score is genuinely near the
   bottom — Birla Estates scores 6/100 on financials with its own band
   reading "concerning", and the old lookup table was quietly rendering
   that as 6.8/10. Surfacing it is the point; overstating it would not
   be. */
const PILLAR_FLOOR = 1;
const PILLAR_CEIL = 10;

function composeToScore(raw: number[], weights: number[], target: number): number[] {
  const out = [...raw];
  const frozen = new Array(raw.length).fill(false);
  for (let pass = 0; pass < 6; pass++) {
    let freeW = 0, fixed = 0;
    out.forEach((v, i) => (frozen[i] ? (fixed += v * weights[i]) : (freeW += weights[i])));
    if (freeW <= 0) break;
    const delta = (target - fixed - out.reduce((t, v, i) => t + (frozen[i] ? 0 : v * weights[i]), 0)) / freeW;
    if (Math.abs(delta) < 1e-9) break;
    let clamped = false;
    out.forEach((v, i) => {
      if (frozen[i]) return;
      const next = v + delta;
      if (next < PILLAR_FLOOR) { out[i] = PILLAR_FLOOR; frozen[i] = true; clamped = true; }
      else if (next > PILLAR_CEIL) { out[i] = PILLAR_CEIL; frozen[i] = true; clamped = true; }
      else out[i] = next;
    });
    if (!clamped) break;
  }
  return out;
}

export function pillars(p: ProjectIntel): Pillar[] {
  const dev = developerOf(p);
  const market = marketOf(p);
  const con = p.ops?.construction;
  const a = p.anatomy;
  const lift = (p.truthScore - 86) / 22; // small per-project nudge

  const devLift = dev ? (dev.performance.onTimePct >= 90 ? 0.7 : dev.performance.onTimePct >= 82 ? 0.25 : -0.3) : 0;
  const devScore = round1(clamp((ratingBase(a.delivery) + ratingBase(a.financials)) / 2 + devLift + lift, 4, 9.5));
  /* "0 lapsed" was written as a literal — printed as fact on every report
     while developer_lapsed_projects sat in the same row saying otherwise
     for 39 of the 97, six of them with 24 lapsed registrations. A forensic
     audit stating a number it did not check is worse than one that omits
     it, so the count is now read, and dropped from the sentence entirely
     when the pipeline has not published one. */
  const lapsed = dev?.performance.lapsed;
  const devWhy = dev
    ? `${dev.performance.launched} RERA projects, ${dev.performance.delivered} delivered${
        lapsed != null ? `, ${lapsed} lapsed` : ""
      } · ${dev.performance.onTimePct}% on-time.`
    : "Regional developer — limited public track record.";

  const ahead = con ? monthIndex(con.reraDate) - monthIndex(con.predictedDate) : 0;
  const conScore = con
    ? round1(clamp(ratingBase(a.construction) + (con.actualPct - con.expectedPct) / 12 + (con.absorptionPct >= 95 ? 0.4 : 0) + lift, 4, 9.4))
    : round1(clamp(ratingBase(a.construction) + lift, 4, 9));
  /* A delivered project's construction line reports the OC, not a build-vs-due
     percentage that no longer means anything — narrative only; the score and
     band come from the pipeline unchanged. */
  const delivered = p.ops?.lifecycle === "delivered";
  const conWhy = con
    ? delivered
      ? `Delivered — OC ${p.ops?.ocDate ?? "on record"} · ${con.absorptionPct}% sold.`
      : `${con.actualPct}% built vs ${con.expectedPct}% due${ahead > 0 ? ` · ~${ahead} mo ahead of RERA` : ""} · ${con.absorptionPct}% sold.`
    : "Construction tracking not yet published for this project.";

  const locScore = round1(clamp((ratingBase(a.liquidity) + ratingBase(a.pricing)) / 2 + (market?.tier === "Established" ? 0.6 : market?.tier === "Growth" ? 0.3 : 0) + lift, 4, 9.5));
  const locWhy = market
    ? `${p.marketShort} corridor · ${market.appreciation3Y} tracked 3-yr · ${p.psf ? fmtPsf(p.psf.avg) + "/sqft avg" : "tracked pricing"}.`
    : "Corridor intelligence in production.";

  const legScore = round1(clamp(ratingBase(a.legal) + lift, 4, 9.3));
  const legWhy = `Project ${p.ops?.reraId ? "RERA-registered & clean" : "registration tracked"} · developer legal signal: ${a.legal}.`;

  const uspCount = p.ops?.usps?.length ?? 0;
  const uspScore = round1(clamp(7.2 + Math.min(2, uspCount * 0.5) + lift, 5.5, 9.2));
  const uspWhy = uspCount ? p.ops!.usps![0].title : "Standard segment specification.";

  /* ── Where the numbers come from ──
     With the pipeline's own breakdown present, all five scores AND all
     five weights are read straight from it and nothing is adjusted: the
     Truth Score upstream is the weighted mean of exactly these, so the
     chart composes to the headline by construction rather than by
     correction. The shift below is only for the curated set and the
     sample, which have no pipeline row and so no breakdown to read. */
  const lp = p.livePillars;
  const weights = lp
    ? [lp.developer.weight, lp.construction.weight, lp.location.weight, lp.legal.weight, lp.usps.weight]
    : [PILLAR_WEIGHTS.developer, PILLAR_WEIGHTS.construction, PILLAR_WEIGHTS.location, PILLAR_WEIGHTS.legal, PILLAR_WEIGHTS.usps];
  const wTotal = weights.reduce((t, w) => t + w, 0) || 1;
  const wFrac = weights.map((w) => w / wTotal);

  const [d1, c1, l1, g1, u1] = lp
    ? [lp.developer.score / 10, lp.construction.score / 10, lp.location.score / 10, lp.legal.score / 10, lp.usps.score / 10].map(round1)
    : composeToScore([devScore, conScore, locScore, legScore, uspScore], wFrac, p.truthScore / 10).map(round1);
  const [wDev, wCon, wLoc, wLeg, wUsp] = wFrac;

  return [
    { key: "developer", label: "Developer DNA", anchor: "developer", band: bandFromScore(d1), score: d1, weight: wDev, why: devWhy, about: PILLAR_ABOUT.developer },
    { key: "construction", label: "Construction & Sales", anchor: "construction", band: bandFromScore(c1), score: c1, weight: wCon, why: conWhy, about: PILLAR_ABOUT.construction },
    { key: "location", label: "Location Intelligence", anchor: "location", band: bandFromScore(l1), score: l1, weight: wLoc, why: locWhy, about: PILLAR_ABOUT.location },
    { key: "legal", label: "Legal & Compliance", anchor: "legal", band: bandFromScore(g1), score: g1, weight: wLeg, why: legWhy, about: PILLAR_ABOUT.legal },
    { key: "usps", label: "Project USPs", anchor: "usps", band: bandFromScore(u1), score: u1, weight: wUsp, why: uspWhy, about: PILLAR_ABOUT.usps },
  ];
}

/* Build-time: rank a score inside the live tracked set (every scored v3 row).
   rank 0 = unscored project → the context line stays hidden. The result rides
   on ProjectIntel.trackedRank so the client components never need the set. */
export function trackedRankOf(
  score: number | null | undefined,
  liveScores: number[],
): { rank: number; total: number; topPct: number } | undefined {
  const total = liveScores.length;
  if (!total) return undefined; // no live set this build → rankContext falls back
  if (!score || score <= 0) return { rank: 0, total, topPct: 0 };
  const rank = liveScores.filter((s) => s > score).length + 1;
  return { rank, total, topPct: Math.max(1, Math.round((rank / total) * 100)) };
}

/* Where the Truth Score sits vs the tracked set + its corridor —
   the "TripAdvisor context" for the hero seal. */
export function rankContext(p: ProjectIntel) {
  const all = PROJECT_INTEL; // sorted desc by truthScore
  const member = all.findIndex((x) => x.slug === p.slug);
  /* Percentile basis is the LIVE tracked set (trackedRank, computed at build
     from every scored pipeline row) — never the handful of curated dossiers,
     whose 80+ scores made any pipeline page read "Top 100%". The curated-set
     math survives only as a fallback for builds with no live data at all. */
  const tr = p.trackedRank;
  const rank = tr ? tr.rank : member >= 0 ? member + 1 : all.filter((x) => x.truthScore > p.truthScore).length + 1;
  const total = tr ? tr.total : member >= 0 ? all.length : all.length + 1;
  const topPct = tr ? tr.topPct : Math.max(1, Math.round((rank / total) * 100));
  const corridor = all.filter((x) => x.market === p.market);
  const corridorRank = corridor.findIndex((x) => x.slug === p.slug) + 1;
  const corridorAvg = corridor.length ? Math.round(corridor.reduce((s, x) => s + x.truthScore, 0) / corridor.length) : p.truthScore;
  /* bottom-half projects switch to plain rank — "Top 76%" is honest math that
     reads like a typo */
  return { rank, total, corridorRank, corridorCount: corridor.length, corridorAvg, delta: p.truthScore - corridorAvg, topPct, bottomHalf: topPct > 50 };
}

/* Delivery outlook — reads the QPR construction data into an "ahead/behind"
   position, a delay probability and a confidence label (Chapter II · Construction). */
export function deliveryOutlook(p: ProjectIntel) {
  const con = p.ops?.construction;
  if (!con) return null;
  const ahead = monthIndex(con.reraDate) - monthIndex(con.predictedDate);
  const aheadOfPlan = con.actualPct - con.expectedPct;
  // live rows carry the pipeline's own scored probability; the heuristic only covers curated rows
  const delayChance = con.delayChancePct ?? Math.round(clamp(26 - ahead * 3 + Math.max(0, -aheadOfPlan) * 2, 10, 60));
  const confidence = delayChance <= 20 ? "High confidence" : delayChance <= 35 ? "Moderate confidence" : "Lower confidence";
  return { ...con, ahead, aheadOfPlan, delayChance, confidence };
}

/* Project-level legal posture — clean / watch / flagged. Driven by the legal
   quality signal, not whether a RERA id happens to be on file: a strong-legal
   developer reads clean, a moderate one warrants a closer look, weak leads with
   alarm. Governs whether the Legal section reassures or cautions. */
export function legalStatus(p: ProjectIntel): "clean" | "watch" | "flagged" {
  const a = p.anatomy.legal;
  if (a === "weak") return "flagged";
  if (a === "moderate") return "watch";
  return "clean";
}

/* When this report's data was last re-checked. Per-project where we track it,
   else the corridor data vintage. Surfaced in the hero + disclaimer. */
export const DATA_AS_OF = "Jul 2026";
/* The date the hero shows as "last updated". It must be the LATEST change to
   any section, so the DB-driven max across dimensions (which already folds in
   the hero-review date) wins first; the bare hand-set review date is only a
   fallback for curated rows that have no computed max; the static constant is
   the last resort. Ordering matters: a project whose legal read was refreshed
   after its hero image was set must show the legal date, not the older one. */
export const reviewedOn = (p: ProjectIntel): string => p.ops?.lastUpdated ?? p.ops?.reviewed ?? DATA_AS_OF;
/* The date a pillar shows. Callers pass the pillar's own dimension date first
   (legal read, construction QPR); this resolves the shared fallback chain when
   that dimension has none. */
export const lastUpdatedOn = (p: ProjectIntel, dimensionDate?: string | null): string =>
  dimensionDate ?? p.ops?.lastUpdated ?? p.ops?.reviewed ?? DATA_AS_OF;

/* Price-history read for the PSF journey (Chapter III). */
export function priceJourney(p: ProjectIntel) {
  const pr = p.ops?.price;
  if (!pr) return null;
  const mid = (pr.currentLow + pr.currentHigh) / 2;
  const years = Math.max(0.5, (NOW_MONTH - monthIndex(pr.launchDate)) / 12);
  return {
    ...pr, mid,
    premiumPct: Math.round(((mid - pr.launchPsf) / pr.launchPsf) * 100),
    cagr: round1((Math.pow(mid / pr.launchPsf, 1 / years) - 1) * 100),
    years: Math.round(years * 10) / 10,
  };
}
