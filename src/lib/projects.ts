/* ════════════════════════════════════════════════════════════════
   PROJECT INTELLIGENCE — one honest dossier per project.
   Built on the journey dataset, enriched with cross-links to the
   developer and market dossiers, and a Truth Score "anatomy": the
   score broken into six independently-assessed inputs, each shown as
   a signal (strong / moderate / strained) — the black box, opened.
   ════════════════════════════════════════════════════════════════ */

import { PROJECTS, type Project } from "./journey";
import { DEVELOPERS, type FinRating } from "./developers";
import { MARKETS, fmtPsf } from "./markets";

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
};

function sizeBand(p: Project, avgPsf: number | undefined): string | null {
  if (!avgPsf) return null;
  const lo = Math.round((p.budget[0] * 1e7) / avgPsf / 50) * 50;
  const hi = Math.round((p.budget[1] * 1e7) / avgPsf / 50) * 50;
  return `${lo.toLocaleString("en-IN")}–${hi.toLocaleString("en-IN")} sq ft`;
}

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
  };
}

export const PROJECT_INTEL: ProjectIntel[] = PROJECTS.map(enrich).sort((a, b) => b.truthScore - a.truthScore);

export function projectBySlug(slug: string): ProjectIntel | undefined {
  return PROJECT_INTEL.find((p) => p.slug === slug);
}

export function alternativesIn(market: string, excludeName: string): ProjectIntel[] {
  return PROJECT_INTEL.filter((p) => p.market === market && p.name !== excludeName);
}
