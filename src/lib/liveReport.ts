/* ════════════════════════════════════════════════════════════════
   LIVE → REPORT ADAPTER — maps a scored pipeline row onto the
   existing ProjectIntel shape so live projects render through the
   ORIGINAL Project Report UI, untouched. Fields the pipeline hasn't
   extracted yet become "NA" (or stay absent so the report's own
   hide-when-missing behaviour applies). Pure data — no UI here.

   Working agreement: during DB integration we never add or restyle
   UI components; the data adapts to the UI, not the other way round.
   ════════════════════════════════════════════════════════════════ */

import type { LiveBacklogFull } from "./supabase";
import { MARKETS } from "./markets";
import type { FinRating } from "./developers";
import { developerSlugOf, type ProjectIntel, type ProjectOps, type ScoreInputKey } from "./projects";

/* tiny defensive readers over the pipeline-owned JSON payloads */
const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
function pick(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const key of path.split(".")) {
    const o = obj(cur);
    if (!o || !(key in o)) return undefined;
    cur = o[key];
  }
  return cur;
}
const textAt = (root: unknown, path: string): string | null => {
  const v = pick(root, path);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const numAt = (root: unknown, path: string): number | null => {
  const v = pick(root, path);
  return typeof v === "number" && Number.isFinite(v) ? v : null;
};
const listAt = (root: unknown, path: string): string[] => {
  const v = pick(root, path);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : [];
};

/* pipeline bands (strong / good / moderate / weak) → the report's
   three-level rating vocabulary. "good" maps to the conservative
   middle — we'd rather under-claim than over-promise. */
function bandRating(b: string | null): FinRating | null {
  if (!b) return null;
  if (/strong|exceptional|excellent/i.test(b)) return "strong";
  if (/weak|watch|poor/i.test(b)) return "weak";
  return "moderate";
}
const riskRating = (r: string | null): FinRating | null =>
  !r ? null : /low/i.test(r) ? "strong" : /high/i.test(r) ? "weak" : "moderate";

const dedupe = (xs: string[]): string[] => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];

export function liveProjectIntel(row: LiveBacklogFull): ProjectIntel {
  const ruleV = row.modRuleVerdict;
  const riskI = row.modRiskIntel;
  const fin = row.modFinancial;

  /* the pipeline packs signal into its caption strings — parse, don't drop */
  const um = row.insight?.match(/(\d+)\s*\/\s*(\d+)\s*units sold/i) ?? null;
  const totalUnits = um ? Number(um[2]) : null;
  const absorptionPct = um && Number(um[2]) > 0 ? Math.round((Number(um[1]) / Number(um[2])) * 100) : null;

  const recoMatch = row.insight?.match(/^\s*([A-Za-z][A-Za-z ]{2,22}?)\s+project\b/i);
  const recommendation = recoMatch ? recoMatch[1].trim() : "Under Review";

  const confidence =
    row.delayChancePct != null
      ? row.delayChancePct <= 25 ? "High" : row.delayChancePct <= 50 ? "Medium" : "Low"
      : row.delayRisk
        ? /low/i.test(row.delayRisk) ? "High" : /high/i.test(row.delayRisk) ? "Low" : "Medium"
        : "Provisional";

  /* six audited inputs, derived from real pipeline signals only;
     no signal → the neutral middle (the honest NA of a 3-level scale) */
  const bands = {
    legal: textAt(ruleV, "pillar_bands.legal"),
    developer: textAt(ruleV, "pillar_bands.developer"),
    location: textAt(ruleV, "pillar_bands.location"),
    roi: textAt(ruleV, "pillar_bands.roi"),
    fundamentals: textAt(ruleV, "pillar_bands.fundamentals"),
  };
  const subs = ["ebitda_margin", "ocf_to_ebitda", "net_debt_to_equity", "interest_coverage_ratio", "inventory_to_sales_years"]
    .map((k) => numAt(fin, k))
    .filter((v): v is number => v != null);
  const subsAvg = subs.length ? subs.reduce((a, b) => a + b, 0) / subs.length : null;
  const pace = row.constructionPaceNum;
  const anatomy: Record<ScoreInputKey, FinRating> = {
    delivery: bandRating(bands.developer) ?? riskRating(row.delayRisk) ?? "moderate",
    legal: bandRating(bands.legal) ?? "moderate",
    financials: subsAvg != null ? (subsAvg >= 75 ? "strong" : subsAvg >= 45 ? "moderate" : "weak") : bandRating(bands.fundamentals) ?? "moderate",
    liquidity: absorptionPct != null ? (absorptionPct >= 85 ? "strong" : absorptionPct >= 45 ? "moderate" : "weak") : "moderate",
    pricing: bandRating(bands.roi) ?? "moderate",
    construction: pace != null ? (pace >= -1 ? "strong" : pace >= -8 ? "moderate" : "weak") : "moderate",
  };

  /* strengths / watch-outs from the rules engine's own words */
  const primaryRisk = textAt(ruleV, "one_liner_inputs.risk");
  const strengths = dedupe([
    textAt(ruleV, "one_liner_inputs.strength_1") ?? "",
    textAt(ruleV, "one_liner_inputs.strength_2") ?? "",
    ...listAt(ruleV, "key_signals"),
  ]).filter((s) => s !== primaryRisk).slice(0, 5);
  const watchouts = dedupe([
    primaryRisk ?? "",
    ...listAt(riskI, "legal.triggered"),
    ...listAt(riskI, "financials.triggered"),
    ...(pick(riskI, "track_record.delay_triggered") === true ? ["Developer delay rule triggered by the risk engine"] : []),
    ...(pick(riskI, "track_record.lapsed_triggered") === true ? ["Developer lapse rule triggered by the risk engine"] : []),
  ]).slice(0, 5);

  /* priorities served — claimed only where the signal is clearly strong */
  const tags: string[] = [];
  if (row.delayRisk && /low/i.test(row.delayRisk)) tags.push("On-Time Delivery");
  if (absorptionPct != null && absorptionPct >= 90) tags.push("Liquidity");
  if (bandRating(bands.legal) === "strong") tags.push("Legal Safety");
  if ((row.expectedCagrNum ?? 0) >= 12) tags.push("Capital Appreciation");
  if (bandRating(bands.developer) === "strong") tags.push("Developer Reputation");
  if (bandRating(bands.location) === "strong") tags.push("Location");

  const configs = row.config
    ? row.config.split(/[,·/]+/).map((s) => s.trim()).filter(Boolean).map((c) => c.replace(/(\d(?:\.\d)?)\s*BHK/i, "$1 BHK"))
    : ["NA"];

  const priceLo = row.minPriceCr ?? (row.budget ? parseFloat(row.budget.replace(/[^\d.]/g, "")) : NaN);
  const lo = Number.isFinite(priceLo) ? priceLo : 0;

  const marketName = row.microMarket ?? row.location ?? "Gurugram";
  const market = MARKETS.find((m) => m.name === marketName);

  const ops: ProjectOps = {
    ...(row.location ? { address: row.location } : {}),
    ...(totalUnits != null ? { units: totalUnits } : {}),
    ...(row.promised ? { possession: row.promised } : {}),
  };

  return {
    name: row.name,
    developer: row.developer ?? "",
    market: marketName,
    configs: configs.length ? configs : ["NA"],
    budget: [lo, lo],
    truthScore: Math.round(row.truthScore ?? 0),
    recommendation,
    confidence,
    tags,
    reason:
      row.insight ??
      textAt(ruleV, "verdict") ??
      `Independently scored ${Math.round(row.truthScore ?? 0)}/100 by our pipeline from RERA filings and public records.`,
    strengths,
    watchouts,
    slug: row.slug,
    devSlug: row.developer ? developerSlugOf(row.developer) : undefined,
    marketSlug: market?.slug,
    marketShort: market?.short ?? marketName,
    psf: market?.psf ?? null,
    sizeBand: null,
    anatomy,
    ops,
  };
}
