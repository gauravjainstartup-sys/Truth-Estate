/* ════════════════════════════════════════════════════════════════
   MATCH ENGINE — persona-weighted, factor-graded project fit.

   One engine for BOTH the report's "YOUR FIT" and the shortlist rank,
   replacing the old 4-factor `matchScoreFor` (report) and the coarse
   6-axis `rankCore` (shortlist). Every factor is a continuous 0..1 fit ×
   a persona weight; weights per persona sum to 100, so the score is an
   honest absolute 0..100 (no relative clamp). Missing data → neutral 0.5,
   never a penalty — an uncovered project ranks on the factors it has.

   Two personas (End-user / Investor), derived from purchase intent. The
   weight tables ARE the product decision and are meant to be tuned — edit
   MATCH_WEIGHTS, nothing else. Curves calibrated against the live corpus
   (docs: scratchpad/calibrate.mjs).

   Factor data all comes from backlog_listing_public_v3, except the
   config-specific entry price, which needs the project's Current ₹/sqft
   (project_extended_details.price_range_sqft, lower bound) × the chosen
   config's super area (project_configurations) — see MarketContext.
   ════════════════════════════════════════════════════════════════ */

export type Persona = "end-user" | "investor";

/* ── Configurable persona weights (each column sums to 100) ──
   This is the tuning surface. Nothing else here needs editing to reweight
   what a persona cares about. */
export type MatchFactor =
  | "budget" | "config" | "location" | "timeline"
  | "delivery" | "legal" | "developer"      // end-user quality
  | "roi" | "entry" | "liquidity" | "finance"; // investor quality

export const MATCH_WEIGHTS: Record<Persona, Partial<Record<MatchFactor, number>>> = {
  "end-user": { budget: 16, config: 14, location: 12, timeline: 8, delivery: 16, legal: 16, developer: 12, entry: 6 },
  investor:   { budget: 14, config: 2, location: 6, timeline: 6, delivery: 10, roi: 24, entry: 14, liquidity: 14, finance: 10 },
};

export const personaOf = (purchaseType: string | null | undefined): Persona =>
  purchaseType === "Investment" ? "investor" : "end-user";

/* ── BHK buckets (founder's scheme) ──
   Studio/1/1.5 → "1"; 2/2.5 → "2"; 3/3.5 → "3"; 4/4.5 → "4"; 5/5.5 → "5";
   any Penthouse incl. Duplex Penthouse → "PH" (its own category, so a
   "4 BHK Penthouse" is PH, not 4). */
export type BhkBucket = "1" | "2" | "3" | "4" | "5" | "PH";
export function bhkBucket(bhkType: string | null | undefined): BhkBucket | null {
  if (!bhkType) return null;
  if (/penthouse/i.test(bhkType)) return "PH";
  const m = String(bhkType).match(/(\d+(?:\.\d)?)/);
  if (!m) return /studio/i.test(bhkType) ? "1" : null;
  const n = Math.floor(parseFloat(m[1]));
  return (n <= 1 ? "1" : n >= 5 ? "5" : String(n)) as BhkBucket;
}
export function bucketOfChip(chip: string): BhkBucket | null {
  return /penthouse/i.test(chip) ? "PH" : bhkBucket(chip);
}

/* A config the pipeline knows for a project: its bucket + super area (sqft). */
export type UnitConfig = { bucket: BhkBucket; superArea: number };

/* Sanity floor on super area per bucket, so a mislabeled/typo row (e.g. a
   ~750 sqft "4 BHK") can't masquerade as the entry unit. ~350 sqft/BHK. */
const MIN_AREA: Record<BhkBucket, number> = { "1": 300, "2": 650, "3": 1000, "4": 1400, "5": 1750, PH: 1400 };

/* ── The per-project factor inputs (all from v3 unless noted) ── */
export type MatchInput = {
  name: string;
  corridor: string;              // microMarket key (corridor scope for entry price)
  budgetLoCr: number | null;     // min_price_cr — project entry price
  configs: UnitConfig[];         // project_configurations, bucketed
  psfLow: number | null;         // project_extended_details.price_range_sqft lower bound
  deliveryYear: number | null;   // predicted_delivery_date
  // delivery certainty
  delayChancePct: number | null; // chances_of_delay_pct
  paceMonths: number | null;     // pace_vs_schedule_months (+ ahead)
  progressPct: number | null;    // construction_progress_pct
  // legal
  legalScore: number | null;     // 0..100
  redFlags: number | null;       // listing_red_flags
  // developer
  devDelayedPct: number | null;  // developer_delayed_pct
  devDelivered: number | null;   // developer_delivered_projects
  devAvgDelayMonths: number | null;
  // investor quality
  roiActualCagr: number | null;
  roiCityCagr: number | null;
  salesVelocityPct: number | null;
  demandScore: number | null;    // demand_sales_score
  soldUnits: number | null;
  totalUnits: number | null;
  devFinancialScore: number | null;
  ebitdaMargin: number | null;
  netDebtToEquity: number | null;
};

/* Buyer brief (a subset of BuyData, engine-agnostic). */
export type Buyer = {
  persona: Persona;
  budgetCr: number;
  bucket: BhkBucket | null;      // chosen config bucket (null = flexible)
  corridors: string[] | null;    // preferred corridors (null = any)
  byYear: number | null;         // desired possession year
  exitYears?: number | null;     // investor exit horizon (feeds timeline)
};

const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };

/* ── MarketContext: corridor × bucket price benchmarks for "entry vs market".
   Built once over the whole corpus so each project scores against its peers. */
export type MarketContext = { medianByCorridorBucket: Map<string, number>; medianByBucket: Map<BhkBucket, number> };

/** The entry unit's price for a bucket, ₹Cr = psfLow × smallest sane super area. */
export function configPriceCr(p: MatchInput, bucket: BhkBucket): number | null {
  if (p.psfLow == null) return null;
  const areas = p.configs.filter((c) => c.bucket === bucket && c.superArea >= MIN_AREA[bucket]).map((c) => c.superArea);
  if (!areas.length) return null;
  return (p.psfLow * Math.min(...areas)) / 1e7;
}

export function buildMarket(all: MatchInput[]): MarketContext {
  const buckets: BhkBucket[] = ["1", "2", "3", "4", "5", "PH"];
  const byCB = new Map<string, number>(), byB = new Map<BhkBucket, number>();
  for (const b of buckets) {
    const all_ = [];
    const byCorr: Record<string, number[]> = {};
    for (const p of all) { const price = configPriceCr(p, b); if (price == null) continue; all_.push(price); (byCorr[p.corridor] ??= []).push(price); }
    const mAll = median(all_); if (mAll != null) byB.set(b, mAll);
    for (const [corr, arr] of Object.entries(byCorr)) { const m = median(arr); if (m != null) byCB.set(`${corr}|${b}`, m); }
  }
  return { medianByCorridorBucket: byCB, medianByBucket: byB };
}

/* ── Factor fit curves (0..1). Each returns 0.5 when its inputs are absent. ── */
const F: Record<MatchFactor, (p: MatchInput, d: Buyer, mkt: MarketContext) => number> = {
  budget: (p, d) => {
    // price of the chosen config if known, else the project entry price
    const price = (d.bucket && configPriceCr(p, d.bucket)) || p.budgetLoCr;
    if (price == null) return 0.5;
    return price <= d.budgetCr ? 1 : clamp(1 - (price - d.budgetCr) / 2.5);
  },
  config: (p, d) => {
    if (!d.bucket) return 1;
    const have = new Set(p.configs.map((c) => c.bucket));
    if (!have.size) return 0.5;
    if (have.has(d.bucket)) return 1;
    const n = Number(d.bucket); if (Number.isFinite(n) && (have.has(String(n - 1) as BhkBucket) || have.has(String(n + 1) as BhkBucket))) return 0.45;
    return 0.25;
  },
  location: (p, d) => (!d.corridors || !d.corridors.length ? 1 : d.corridors.includes(p.corridor) ? 1 : 0.25),
  timeline: (p, d) => { const by = d.byYear; if (p.deliveryYear == null || by == null) return 0.7; return p.deliveryYear <= by ? 1 : clamp(1 - (p.deliveryYear - by) * 0.3); },
  delivery: (p) => {
    if (p.delayChancePct == null && p.paceMonths == null) return 0.5;
    const base = p.delayChancePct != null ? 1 - p.delayChancePct / 100 : 0.5;
    const pace = p.paceMonths != null ? clamp(0.5 + p.paceMonths / 24) : 0.5;
    const prog = p.progressPct != null ? p.progressPct / 100 : 0.5;
    return clamp(0.55 * base + 0.25 * pace + 0.2 * prog);
  },
  legal: (p) => (p.legalScore == null ? 0.5 : clamp(p.legalScore / 100 - 0.08 * Math.min(3, p.redFlags || 0))),
  developer: (p) => {
    if (p.devDelayedPct == null && p.devDelivered == null) return 0.5;
    const rel = p.devDelayedPct != null ? 1 - p.devDelayedPct / 100 : 0.5;
    const depth = p.devDelivered != null ? clamp(p.devDelivered / 12) : 0.5;
    const delay = p.devAvgDelayMonths != null ? clamp(1 - Math.max(0, p.devAvgDelayMonths) / 24) : 0.5;
    return clamp(0.5 * rel + 0.2 * depth + 0.3 * delay);
  },
  roi: (p) => { const a = p.roiActualCagr; if (a == null) return 0.5; const abs = clamp(a / 15); const beat = p.roiCityCagr ? clamp(0.5 + (a - p.roiCityCagr) / 16) : 0.5; return clamp(0.55 * abs + 0.45 * beat); },
  entry: (p, d, mkt) => {
    const bucket = d.bucket ?? entryBucket(p);
    if (!bucket) return 0.5;
    const price = configPriceCr(p, bucket);
    const med = mkt.medianByCorridorBucket.get(`${p.corridor}|${bucket}`) ?? mkt.medianByBucket.get(bucket);
    if (price == null || med == null || med <= 0) return 0.5;
    return clamp(0.5 + (med - price) / med);
  },
  liquidity: (p) => {
    const sv = p.salesVelocityPct != null ? clamp(p.salesVelocityPct / 40) : 0.5;
    const dm = p.demandScore != null ? clamp(p.demandScore / 100) : 0.5;
    const abs = p.soldUnits != null && p.totalUnits ? clamp(p.soldUnits / p.totalUnits) : 0.5;
    return clamp(0.4 * sv + 0.4 * dm + 0.2 * abs);
  },
  finance: (p) => {
    const fs = p.devFinancialScore != null ? clamp(p.devFinancialScore / 100) : 0.5;
    const eb = p.ebitdaMargin != null ? clamp(p.ebitdaMargin / 0.3) : 0.5;
    const nd = p.netDebtToEquity != null ? clamp(1 - p.netDebtToEquity / 2) : 0.5;
    return clamp(0.5 * fs + 0.25 * eb + 0.25 * nd);
  },
};

/** The project's own entry bucket (smallest bucket it offers) — used when the buyer is Flexible. */
function entryBucket(p: MatchInput): BhkBucket | null {
  const order: BhkBucket[] = ["1", "2", "3", "4", "5", "PH"];
  for (const b of order) if (p.configs.some((c) => c.bucket === b)) return b;
  return null;
}

/* ── Labels (unchanged thresholds) ── */
export function matchLabel(pct: number): { label: string; tone: "good" | "fair" | "low" } {
  if (pct >= 82) return { label: "Ideal fit", tone: "good" };
  if (pct >= 68) return { label: "Strong fit", tone: "good" };
  if (pct >= 52) return { label: "Fair fit", tone: "fair" };
  return { label: "Limited fit", tone: "low" };
}

/* Human labels for the gap subline. */
const FACTOR_LABEL: Record<MatchFactor, string> = {
  budget: "budget", config: "configuration", location: "location", timeline: "timeline",
  delivery: "delivery certainty", legal: "legal", developer: "developer track record",
  roi: "ROI", entry: "entry price", liquidity: "liquidity", finance: "developer financials",
};

export type MatchResult = {
  pct: number;
  persona: Persona;
  label: string;
  tone: "good" | "fair" | "low";
  subline: string;
  breakdown: { factor: MatchFactor; weight: number; fit: number; contribution: number }[];
};

/** Score one project for one buyer against the corpus market context. */
export function scoreMatch(p: MatchInput, d: Buyer, mkt: MarketContext): MatchResult {
  const W = MATCH_WEIGHTS[d.persona];
  const breakdown: MatchResult["breakdown"] = [];
  let s = 0;
  for (const factor of Object.keys(W) as MatchFactor[]) {
    const weight = W[factor]!;
    const fit = F[factor](p, d, mkt);
    const contribution = weight * fit;
    s += contribution;
    breakdown.push({ factor, weight, fit: Math.round(fit * 100) / 100, contribution });
  }
  const pct = Math.min(99, Math.round(s));
  const meta = matchLabel(pct);
  return { pct, persona: d.persona, ...meta, subline: sublineFor(breakdown), breakdown };
}

/* ── Persona-aware gap subline: the single best-fitting factor that carries
   real weight, and the biggest weighted gap. "Delivery and legal check out;
   budget's a stretch." Skips fit==neutral factors so we don't praise unknowns. */
function sublineFor(bd: MatchResult["breakdown"]): string {
  const real = bd.filter((b) => b.weight >= 6);
  const fits = real.filter((b) => b.fit >= 0.75).sort((a, b) => b.weight * b.fit - a.weight * a.fit).map((b) => FACTOR_LABEL[b.factor]);
  const gaps = real.filter((b) => b.fit <= 0.5).sort((a, b) => b.weight * (1 - b.fit) - a.weight * (1 - a.fit)).map((b) => FACTOR_LABEL[b.factor]);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (fits.length && !gaps.length) return `${cap(fits.slice(0, 2).join(" & "))} all check out.`;
  if (!fits.length && gaps.length) return `Worth a closer look on ${gaps.slice(0, 2).join(" & ")}.`;
  if (fits.length && gaps.length) return `${cap(fits.slice(0, 2).join(" & "))} fit; ${gaps.slice(0, 2).join(" & ")} to weigh.`;
  return "A balanced fit against your brief.";
}
