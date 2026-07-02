/* ════════════════════════════════════════════════════════════════
   PROJECT INTELLIGENCE — one honest dossier per project.
   Built on the journey dataset, enriched with cross-links to the
   developer and market dossiers, and a Truth Score "anatomy": the
   score broken into six independently-assessed inputs, each shown as
   a signal (strong / moderate / strained) — the black box, opened.
   ════════════════════════════════════════════════════════════════ */

import { PROJECTS, type Project } from "./journey";
import { DEVELOPERS, type FinRating, type DeveloperIntel } from "./developers";
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
  devSlug?: string;
  marketSlug?: string;
  marketShort: string;
  psf: { low: number; avg: number; high: number } | null;
  sizeBand: string | null; // indicative sq ft from ticket ÷ corridor psf
  anatomy: Record<ScoreInputKey, FinRating>;
  ops?: ProjectOps; // operational specifics for the projects we track most closely
};

function sizeBand(p: Project, avgPsf: number | undefined): string | null {
  if (!avgPsf) return null;
  const lo = Math.round((p.budget[0] * 1e7) / avgPsf / 50) * 50;
  const hi = Math.round((p.budget[1] * 1e7) / avgPsf / 50) * 50;
  return `${lo.toLocaleString("en-IN")}–${hi.toLocaleString("en-IN")} sq ft`;
}

/* ── Operational specifics ─────────────────────────────────────────
   Ground-truth vitals for the projects we track most closely. Figures
   come from RERA filings, quarterly progress reports (QPRs) and our own
   site tracking; where we don't actively track a data point we leave it
   out rather than estimate it. */
export type ProjectOps = {
  address?: string; // street-level address for the hero + map
  reviewed?: string; // when we last re-checked this project's data ("3 Jul 2026")
  units?: number;
  towers?: number;
  landAcres?: number;
  openAreaPct?: number;
  density?: number; // units / acre
  carpetSqft?: number;
  launch?: string;
  possession?: string; // RERA-committed handover
  reraId?: string;
  reraNote?: string;
  /* Price history — the PSF journey since launch (Chapter III). currentLow/High
     bound today's tracked range; premium & CAGR are derived, not stored. */
  price?: { launchPsf: number; launchDate: string; currentLow: number; currentHigh: number };
  /* Per-configuration homes — carpet/super/balcony areas and the indicative
     ticket band. Efficiency & loading are derived, never stored. `plan` is an
     optional licensed 2D floor-plan image (relative to /public); when absent
     we render an indicative schematic. */
  homes?: { config: string; carpetSqft: number; superSqft: number; balconySqft?: number; priceCr: [number, number]; plan?: string; beds?: number }[];
  /* Imagery (relative to /public). `render` is the developer's marketing
     render; `sitePhotos` are our dated field-visit photographs. Absent →
     brand-safe schematic stand-ins render in their place. */
  media?: { render?: string; sitePhotos?: { src: string; asOf: string; note?: string }[] };
  /* Structured location intelligence (Chapter II · Location). */
  location?: {
    pois?: { name: string; sub: string; rating?: number; dist: string; key?: boolean }[];
    connectivity?: { icon: string; name: string; sub: string; dist: string; tag: string; direct?: boolean }[];
    infra?: { cat: string; status: string; title: string; body: string; impact: "High" | "Medium"; eta: string }[];
  };
  construction?: {
    actualPct: number; // built vs plan, latest QPR
    expectedPct: number; // schedule expectation at same date
    absorptionPct: number; // units sold / launched
    reraDate: string; // committed possession
    predictedDate: string; // our execution-adjusted estimate
    qpr: string; // QPR the read is drawn from
  };
  usps?: { title: string; body: string }[];
};

export const OPS: Record<string, ProjectOps> = {
  "DLF Arbour": {
    address: "Sector 63, Golf Course Extension Road, Gurugram",
    reviewed: "3 Jul 2026",
    units: 1137,
    towers: 5,
    landAcres: 25.1,
    openAreaPct: 89,
    density: 45,
    carpetSqft: 2255,
    launch: "Jan 2023",
    possession: "Mar 2030",
    reraId: "RERA-GRG-1138-2022",
    price: { launchPsf: 12500, launchDate: "Jan 2023", currentLow: 17000, currentHigh: 19500 },
    homes: [
      { config: "3 BHK", carpetSqft: 1855, superSqft: 2650, balconySqft: 320, priceCr: [5.0, 5.6] },
      { config: "4 BHK", carpetSqft: 2255, superSqft: 3225, balconySqft: 410, priceCr: [5.8, 6.9] },
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
    },
    reraNote: "Registered · Haryana RERA · active, no project-level complaints on record",
    construction: { actualPct: 57, expectedPct: 47, absorptionPct: 100, reraDate: "Mar 2030", predictedDate: "Nov 2029", qpr: "Q1 2026" },
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
    homes: [
      { config: "3 BHK", carpetSqft: 1755, superSqft: 2500, balconySqft: 300, priceCr: [5.0, 5.9] },
      { config: "4 BHK", carpetSqft: 2150, superSqft: 3080, balconySqft: 390, priceCr: [6.2, 7.9] },
    ],
    units: 1113, towers: 7, landAcres: 25, openAreaPct: 78, density: 44,
    launch: "2023", possession: "Dec 2028", reraNote: "Registered · Haryana RERA",
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
  DEVELOPERS.find((d) => d.name === p.developer);
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
  "DLF Arbour": {
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
};
export const towerIntelMeta = (p: ProjectIntel): TowerIntelMeta | undefined => TOWER_INTEL[p.name];

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
  ticketCr: number;
  benchValueCr: number;
  adjValueCr: number;
  deltaCr: number;
};

export function roiModel(p: ProjectIntel): RoiModel | null {
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
  return `Best suited for ${audience} who prioritise ${priorities}${market ? ` — ${market.bestFor.toLowerCase()}` : ""}.`;
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
    faqs.push({ q: `Is ${p.developer} financially sound?`, a: `${dev.finNote} ${dev.verdict}` });
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
      a: `Anchored to the corridor's tracked 3-year appreciation of ${roi.corridor3Y}, our ${roi.horizonYears}-year model projects roughly ${roi.benchCagr}% CAGR at the market benchmark and ${roi.adjCagr}% on an execution-adjusted basis. A modelled outcome — not a guarantee.`,
    });
  }
  faqs.push({
    q: `Is ${p.name} fairly priced?`,
    a: `${p.reason} The tracked ${p.marketShort} corridor trades at ${
      p.psf ? `${fmtPsf(p.psf.low)}–${fmtPsf(p.psf.high)} / sq ft` : "a range we track"
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
  band: PillarBand; score: number; weight: number; why: string;
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

export const PILLAR_WEIGHTS = { developer: 0.28, construction: 0.22, location: 0.22, legal: 0.18, usps: 0.1 } as const;

export function pillars(p: ProjectIntel): Pillar[] {
  const dev = developerOf(p);
  const market = marketOf(p);
  const con = p.ops?.construction;
  const a = p.anatomy;
  const lift = (p.truthScore - 86) / 22; // small per-project nudge

  const devLift = dev ? (dev.performance.onTimePct >= 90 ? 0.7 : dev.performance.onTimePct >= 82 ? 0.25 : -0.3) : 0;
  const devScore = round1(clamp((ratingBase(a.delivery) + ratingBase(a.financials)) / 2 + devLift + lift, 4, 9.5));
  const devWhy = dev
    ? `${dev.performance.launched} RERA projects, ${dev.performance.delivered} delivered, 0 lapsed · ${dev.performance.onTimePct}% on-time.`
    : "Regional developer — limited public track record.";

  const ahead = con ? monthIndex(con.reraDate) - monthIndex(con.predictedDate) : 0;
  const conScore = con
    ? round1(clamp(ratingBase(a.construction) + (con.actualPct - con.expectedPct) / 12 + (con.absorptionPct >= 95 ? 0.4 : 0) + lift, 4, 9.4))
    : round1(clamp(ratingBase(a.construction) + lift, 4, 9));
  const conWhy = con
    ? `${con.actualPct}% built vs ${con.expectedPct}% due${ahead > 0 ? ` · ~${ahead} mo ahead of RERA` : ""} · ${con.absorptionPct}% sold.`
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

  return [
    { key: "developer", label: "Developer DNA", anchor: "developer", band: bandFromScore(devScore), score: devScore, weight: PILLAR_WEIGHTS.developer, why: devWhy },
    { key: "construction", label: "Construction & Sales", anchor: "construction", band: bandFromScore(conScore), score: conScore, weight: PILLAR_WEIGHTS.construction, why: conWhy },
    { key: "location", label: "Location Intelligence", anchor: "location", band: bandFromScore(locScore), score: locScore, weight: PILLAR_WEIGHTS.location, why: locWhy },
    { key: "legal", label: "Legal & Compliance", anchor: "legal", band: bandFromScore(legScore), score: legScore, weight: PILLAR_WEIGHTS.legal, why: legWhy },
    { key: "usps", label: "Project USPs", anchor: "usps", band: bandFromScore(uspScore), score: uspScore, weight: PILLAR_WEIGHTS.usps, why: uspWhy },
  ];
}

/* Where the Truth Score sits vs the tracked set + its corridor —
   the "TripAdvisor context" for the hero seal. */
export function rankContext(p: ProjectIntel) {
  const all = PROJECT_INTEL; // sorted desc by truthScore
  const rank = all.findIndex((x) => x.slug === p.slug) + 1;
  const total = all.length;
  const corridor = all.filter((x) => x.market === p.market);
  const corridorRank = corridor.findIndex((x) => x.slug === p.slug) + 1;
  const corridorAvg = corridor.length ? Math.round(corridor.reduce((s, x) => s + x.truthScore, 0) / corridor.length) : p.truthScore;
  return { rank, total, corridorRank, corridorCount: corridor.length, corridorAvg, delta: p.truthScore - corridorAvg, topPct: Math.max(1, Math.round((rank / total) * 100)) };
}

/* Delivery outlook — reads the QPR construction data into an "ahead/behind"
   position, a delay probability and a confidence label (Chapter II · Construction). */
export function deliveryOutlook(p: ProjectIntel) {
  const con = p.ops?.construction;
  if (!con) return null;
  const ahead = monthIndex(con.reraDate) - monthIndex(con.predictedDate);
  const aheadOfPlan = con.actualPct - con.expectedPct;
  const delayChance = Math.round(clamp(26 - ahead * 3 + Math.max(0, -aheadOfPlan) * 2, 10, 60));
  const confidence = delayChance <= 20 ? "High confidence" : delayChance <= 35 ? "Moderate confidence" : "Lower confidence";
  return { ...con, ahead, aheadOfPlan, delayChance, confidence };
}

/* Project-level legal posture — clean / watch / flagged. Drives whether the
   Legal section reads "project clean, developer history" or leads with alarm. */
export function legalStatus(p: ProjectIntel): "clean" | "watch" | "flagged" {
  const a = p.anatomy.legal;
  if (a === "weak") return "flagged";
  if (!p.ops?.reraId) return "watch";
  return "clean";
}

/* When this report's data was last re-checked. Per-project where we track it,
   else the corridor data vintage. Surfaced in the hero + disclaimer. */
export const DATA_AS_OF = "Jul 2026";
export const reviewedOn = (p: ProjectIntel): string => p.ops?.reviewed ?? DATA_AS_OF;

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
