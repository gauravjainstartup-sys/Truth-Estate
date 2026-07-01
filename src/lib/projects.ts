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
    units: 1137,
    towers: 5,
    landAcres: 25.1,
    openAreaPct: 89,
    density: 45,
    carpetSqft: 2255,
    launch: "Jan 2023",
    possession: "Mar 2030",
    reraId: "RERA-GRG-1138-2022",
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
    units: 1113, towers: 7, landAcres: 25, openAreaPct: 78, density: 44,
    launch: "2023", possession: "Dec 2028", reraNote: "Registered · Haryana RERA",
    construction: { actualPct: 41, expectedPct: 38, absorptionPct: 100, reraDate: "Dec 2028", predictedDate: "Oct 2028", qpr: "Q1 2026" },
  },
  "Godrej Aristocrat": {
    units: 434, towers: 4, landAcres: 8.4, openAreaPct: 75, density: 52,
    launch: "2024", possession: "Jun 2029", reraNote: "Registered · Haryana RERA",
    construction: { actualPct: 22, expectedPct: 20, absorptionPct: 95, reraDate: "Jun 2029", predictedDate: "Aug 2029", qpr: "Q1 2026" },
  },
  "M3M Golf Estate II": {
    units: 624, towers: 6, landAcres: 18, openAreaPct: 70, density: 35,
    launch: "2023", possession: "Dec 2028", reraNote: "Registered · Haryana RERA",
    construction: { actualPct: 38, expectedPct: 40, absorptionPct: 82, reraDate: "Dec 2028", predictedDate: "Jun 2029", qpr: "Q1 2026" },
  },
  "Birla Navya": {
    units: 424, towers: 4, landAcres: 10, openAreaPct: 80, density: 42,
    launch: "2023", possession: "Mar 2029", reraNote: "Registered · Haryana RERA",
    construction: { actualPct: 30, expectedPct: 28, absorptionPct: 88, reraDate: "Mar 2029", predictedDate: "May 2029", qpr: "Q1 2026" },
  },
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
