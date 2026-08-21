/* ════════════════════════════════════════════════════════════════
   MATCH ENGINE — persona-weighted, factor-graded project fit.

   One engine for BOTH the report's "YOUR FIT" and the shortlist rank,
   replacing the old 4-factor `matchScoreFor` and coarse 6-axis `rankCore`.
   Every factor is a continuous 0..1 fit × a persona weight. Weights are
   renormalized over the factors that ACTUALLY apply to this buyer (skipped
   inputs drop out), so the score is an honest absolute 0..100 and sharpens
   as the buyer says more. Missing PROJECT data → neutral 0.5, never a
   penalty. Curves calibrated on the live corpus (scratchpad/calibrate.mjs).

   Two personas (End-user / Investor). MATCH_WEIGHTS is the whole tuning
   surface. Factor data comes from backlog_listing_public_v3, except the
   config-specific price, which needs Current ₹/sqft (project_extended_details
   .price_range_sqft lower bound) × the config's super area
   (project_configurations), and location distance, which needs project
   lat/long (v3, seed-authoritative) vs the target corridor centroid / POI.
   ════════════════════════════════════════════════════════════════ */

export type Persona = "end-user" | "investor";

export type MatchFactor =
  | "budget" | "config" | "location" | "timeline"
  | "delivery" | "legal" | "developer"        // end-user quality
  | "roi" | "entry" | "liquidity" | "finance"; // investor quality

/* ── Configurable persona weights (each column sums to 100 as authored;
   the engine renormalizes over whatever factors apply per buyer) ── */
export const MATCH_WEIGHTS: Record<Persona, Partial<Record<MatchFactor, number>>> = {
  "end-user": { budget: 24, config: 22, location: 20, timeline: 10, delivery: 8, legal: 8, developer: 8 },
  investor:   { budget: 20, config: 6, location: 14, timeline: 8, delivery: 8, roi: 22, entry: 12, liquidity: 10 },
};

/* Factors that need a buyer input — dropped (and their weight renormalized
   away) when the buyer hasn't given that input. Everything else is always on. */
const CONDITIONAL: MatchFactor[] = ["config", "location", "timeline"];

export const personaOf = (purchaseType: string | null | undefined): Persona =>
  purchaseType === "Investment" ? "investor" : "end-user";

/* ── BHK buckets: Studio/1/1.5→"1"; 2/2.5→"2"; …; 5/5.5→"5"; any Penthouse
   (incl. Duplex Penthouse) → "PH" (its own category). ── */
export type BhkBucket = "1" | "2" | "3" | "4" | "5" | "PH";
export function bhkBucket(bhkType: string | null | undefined): BhkBucket | null {
  if (!bhkType) return null;
  if (/penthouse/i.test(bhkType)) return "PH";
  const m = String(bhkType).match(/(\d+(?:\.\d)?)/);
  if (!m) return /studio/i.test(bhkType) ? "1" : /duplex/i.test(bhkType) ? "PH" : null;
  const n = Math.floor(parseFloat(m[1]));
  return (n <= 1 ? "1" : n >= 5 ? "5" : String(n)) as BhkBucket;
}
export const bucketOfChip = (chip: string): BhkBucket | null => (/penthouse/i.test(chip) ? "PH" : bhkBucket(chip));

export type UnitConfig = { bucket: BhkBucket; superArea: number };
export type GeoPoint = { lat: number; lng: number };

/* Sanity floor on super area per bucket, so a mislabeled/typo row (a ~750 sqft
   "4 BHK") can't masquerade as the entry unit. ~350 sqft/BHK. */
const MIN_AREA: Record<BhkBucket, number> = { "1": 300, "2": 650, "3": 1000, "4": 1400, "5": 1750, PH: 1400 };

export type MatchInput = {
  name: string;
  corridor: string;
  lat: number | null;
  lng: number | null;
  budgetLoCr: number | null;     // min_price_cr fallback
  configs: UnitConfig[];         // bucketed project_configurations
  psfLow: number | null;         // price_range_sqft lower bound
  deliveryYear: number | null;
  delayChancePct: number | null;
  paceMonths: number | null;
  progressPct: number | null;
  legalScore: number | null;
  redFlags: number | null;
  devDelayedPct: number | null;
  devDelivered: number | null;
  devAvgDelayMonths: number | null;
  roiActualCagr: number | null;
  roiCityCagr: number | null;
  salesVelocityPct: number | null;
  demandScore: number | null;
  soldUnits: number | null;
  totalUnits: number | null;
  devFinancialScore: number | null;
  ebitdaMargin: number | null;
  netDebtToEquity: number | null;
};

export type Buyer = {
  persona: Persona;
  budgetCr: number;
  bucket: BhkBucket | null;       // chosen config (null = flexible → factor drops)
  corridors: string[] | null;     // chosen corridors (null/empty = any → factor drops)
  poi: GeoPoint | null;           // a geocoded landmark, alternative to corridors
  byYear: number | null;          // desired possession year (null = flexible → factor drops)
  exitYears?: number | null;      // investor exit horizon
  priorities?: string[];          // "what matters most" chips → boost the named factors
};

/* "What matters most" chip → the factor it amplifies. A chosen priority raises
   that factor's weight before renormalization, so the buyer's stated priorities
   pull the score. Chips with no single factor (e.g. Luxury Lifestyle) are inert. */
export const PRIORITY_FACTOR: Record<string, MatchFactor> = {
  "Legal Safety": "legal",
  "On-Time Delivery": "delivery",
  "Layouts": "config",
  "Location": "location",
  "Capital Appreciation": "roi",
  "Value Buying": "entry",
  "Rental Yield": "liquidity",
  "Liquidity": "liquidity",
  "Developer Reputation": "developer",
  "Construction Quality": "delivery",
  "Early-Entry Pricing": "entry",
  "Flexible Payment Plan": "finance",
};
const PRIORITY_BOOST = 1.6;

const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const r2 = (x: number) => Math.round(x * 100) / 100;
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/* ── Corridor Adjacency Matrix ──
   Physical arterial connections (Vatika Chowk underpass, CPR Cloverleaf, etc.)
   giving high affinity to neighboring high-growth corridors. EXPORTED as the
   single source — journey.ts's rankCore reads this same matrix, so the two
   rankers can never disagree about which corridors touch. */
export const CORRIDOR_ADJACENCY: Record<string, string[]> = {
  gce: ["spr", "gcr"],
  spr: ["gce", "sohna-road"],
  gcr: ["gce"],
  dwarka: ["nh48"],
  "new-gurgaon": ["nh48", "spr"],
  "sohna-road": ["spr", "sohna"],
  sohna: ["sohna-road"],
  nh48: ["dwarka", "new-gurgaon", "spr"],
};

function normalizeCorridorKey(s: string): string {
  const t = (s || "").toLowerCase();
  if (t.includes("spr") || t.includes("southern peripheral")) return "spr";
  if (t.includes("dwarka") || t.includes("northern peripheral") || t.includes("dxp")) return "dwarka";
  if (t.includes("new gurgaon") || t.includes("new gurugram")) return "new-gurgaon";
  if (t.includes("sohna-road") || t.includes("sohna road")) return "sohna-road";
  if (t.includes("sohna")) return "sohna";
  if (t.includes("nh-48") || t.includes("nh48") || t.includes("nh 48") || t.includes("nh-8") || t.includes("nh8")) return "nh48";
  if (t.includes("golf course")) {
    return t.includes("ext") || t.includes("gcre") || t.includes("gce") ? "gce" : "gcr";
  }
  return t.trim();
}

/* ── Config pricing (₹Cr) = Current ₹/sqft (lower) × super area, sanity-floored. ── */
export function configPriceCr(p: MatchInput, bucket: BhkBucket): number | null {
  if (p.psfLow == null) return null;
  const areas = p.configs.filter((c) => c.bucket === bucket && c.superArea >= MIN_AREA[bucket]).map((c) => c.superArea);
  return areas.length ? (p.psfLow * Math.min(...areas)) / 1e7 : null;
}
export function allConfigPricesCr(p: MatchInput): number[] {
  if (p.psfLow == null) return [];
  return p.configs.filter((c) => c.superArea >= MIN_AREA[c.bucket]).map((c) => (p.psfLow! * c.superArea) / 1e7);
}

/* ── MarketContext: corridor×bucket price medians + corridor centroids, built
   once over the corpus so each project scores against its peers/geography. ── */
// Plain records (not Maps) so the context serializes cleanly as a baked JSON
// route and as a client-component prop.
export type MarketContext = {
  medianByCorridorBucket: Record<string, number>;
  medianByBucket: Record<string, number>;
  corridorCentroid: Record<string, GeoPoint>;
};
export function buildMarket(all: MatchInput[]): MarketContext {
  const buckets: BhkBucket[] = ["1", "2", "3", "4", "5", "PH"];
  const byCB: Record<string, number> = {}, byB: Record<string, number> = {}, cen: Record<string, GeoPoint> = {};
  for (const b of buckets) {
    const flat: number[] = [], byCorr: Record<string, number[]> = {};
    for (const p of all) { const price = configPriceCr(p, b); if (price == null) continue; flat.push(price); (byCorr[p.corridor] ??= []).push(price); }
    const m = median(flat); if (m != null) byB[b] = m;
    for (const [c, arr] of Object.entries(byCorr)) { const mm = median(arr); if (mm != null) byCB[`${c}|${b}`] = mm; }
  }
  const geoByCorr: Record<string, GeoPoint[]> = {};
  for (const p of all) if (p.lat != null && p.lng != null) (geoByCorr[p.corridor] ??= []).push({ lat: p.lat, lng: p.lng });
  for (const [c, pts] of Object.entries(geoByCorr)) { const la = median(pts.map((q) => q.lat)), lo = median(pts.map((q) => q.lng)); if (la != null && lo != null) cen[c] = { lat: la, lng: lo }; }
  return { medianByCorridorBucket: byCB, medianByBucket: byB, corridorCentroid: cen };
}
export const emptyMarket = (): MarketContext => ({ medianByCorridorBucket: {}, medianByBucket: {}, corridorCentroid: {} });

const entryBucket = (p: MatchInput): BhkBucket | null => (["1", "2", "3", "4", "5", "PH"] as BhkBucket[]).find((b) => p.configs.some((c) => c.bucket === b)) ?? null;

/* ── Factor fit curves (0..1). Return 0.5 when their inputs are absent. ── */
const F: Record<MatchFactor, (p: MatchInput, d: Buyer, mkt: MarketContext) => number> = {
  // Budget: projects fitting within or slightly below target budget receive full marks.
  // Never penalize value buying. Decay only kicks in on affordability stretch or severe segment mismatch.
  budget: (p, d) => {
    const lo = d.budgetCr * 0.75, hi = d.budgetCr * 1.20;
    const prices = d.bucket ? (configPriceCr(p, d.bucket) != null ? [configPriceCr(p, d.bucket)!] : []) : allConfigPricesCr(p);
    const pool = prices.length ? prices : p.budgetLoCr != null ? [p.budgetLoCr] : [];
    if (!pool.length) return 0.5;
    
    if (pool.some((pr) => pr <= hi && pr >= lo)) return 1.0;
    let best = 0;
    for (const pr of pool) {
      if (pr > hi) {
        best = Math.max(best, clamp(1.0 - (pr - hi) / (d.budgetCr * 0.40)));
      } else if (pr < lo) {
        const ratio = pr / lo;
        best = Math.max(best, clamp(Math.pow(ratio, 2.5)));
      } else {
        best = Math.max(best, 1.0);
      }
    }
    return best;
  },
  // BHK: exact bucket → 1; project offers only a BIGGER bucket → −0.4 per step;
  // only smaller (or wrong category) → 0. Penthouse matches penthouse only.
  config: (p, d) => {
    if (!d.bucket) return 1;
    const offered = new Set(p.configs.map((c) => c.bucket));
    if (!offered.size) return 0.5;
    if (offered.has(d.bucket)) return 1.0;
    
    if (d.bucket === "PH") {
      if (offered.has("5")) return 0.60;
      if (offered.has("4")) return 0.40;
      return 0.05;
    }
    
    const want = Number(d.bucket);
    const upSteps = [...offered].filter((b) => b !== "PH" && Number(b) > want).map((b) => Number(b) - want);
    const downSteps = [...offered].filter((b) => b !== "PH" && Number(b) < want).map((b) => want - Number(b));
    
    if (upSteps.length) return clamp(1.0 - 0.25 * Math.min(...upSteps));
    if (downSteps.length) return clamp(1.0 - 0.50 * Math.min(...downSteps));
    return 0.1;
  },
  // Location: same corridor → 1; adjacent corridor → 0.82; or within 3 km of target → 1; then −0.15/km.
  location: (p, d, mkt) => {
    const projectCorr = normalizeCorridorKey(p.corridor);
    const targetCorrs = (d.corridors ?? []).map(normalizeCorridorKey);

    if (targetCorrs.length > 0) {
      if (targetCorrs.includes(projectCorr)) return 1.0;
      const isAdjacent = targetCorrs.some((tc) => CORRIDOR_ADJACENCY[tc]?.includes(projectCorr));
      if (isAdjacent) return 0.65;
      return 0.10;
    }

    const targets: GeoPoint[] = [];
    if (d.poi) targets.push(d.poi);
    for (const c of d.corridors ?? []) { const g = mkt.corridorCentroid[c]; if (g) targets.push(g); }
    if (!targets.length || p.lat == null || p.lng == null) return targetCorrs.length > 0 ? 0.20 : 0.5;
    const dkm = Math.min(...targets.map((t) => haversineKm({ lat: p.lat!, lng: p.lng! }, t)));
    return dkm <= 3 ? 1 : clamp(1 - 0.15 * (dkm - 3));
  },
  timeline: (p, d) => {
    if (p.deliveryYear == null || d.byYear == null) return 0.7;
    if (p.deliveryYear <= d.byYear) return 1.0;
    return clamp(1.0 - (p.deliveryYear - d.byYear) * 0.18);
  },
  delivery: (p) => {
    if (p.delayChancePct == null && p.paceMonths == null) return 0.5;
    const base = p.delayChancePct != null ? 1 - p.delayChancePct / 100 : 0.5;
    const pace = p.paceMonths != null ? clamp(0.5 + p.paceMonths / 24) : 0.5;
    const prog = p.progressPct != null ? p.progressPct / 100 : 0.5;
    return clamp(0.50 * base + 0.30 * pace + 0.20 * prog);
  },
  legal: (p) => {
    if (p.legalScore == null) return 0.5;
    const base = p.legalScore / 100;
    /* AG's 0.22×/flag was calibrated against the STORED red-flag column.
       redFlags is now the bake-time audit (redFlags.ts), whose counts run
       higher — 79 of 107 projects carry ≥2 flags, and at 0.22× the factor
       zeroed for 56 of them: a 3-flag and a 9-flag project both read 0 and
       the ranker lost the gradient exactly where it matters. Same intent,
       recalibrated: legacy slope for the first two flags, steeper beyond,
       capped so the factor orders the risky half instead of flooring it.
       Measured on the live 107: median 0.48 (legacy) → 0.32; zeroed 5 → 18
       (AG as-authored: median 0.00, zeroed 56). */
    const f = p.redFlags || 0;
    const flagPenalty = Math.min(0.55, 0.08 * Math.min(f, 2) + 0.16 * Math.max(0, f - 2));
    return clamp(base - flagPenalty);
  },
  developer: (p) => {
    if (p.devDelayedPct == null && p.devDelivered == null) return 0.5;
    const rel = p.devDelayedPct != null ? 1 - p.devDelayedPct / 100 : 0.5;
    const depth = p.devDelivered != null ? clamp(p.devDelivered / 12) : 0.5;
    const delay = p.devAvgDelayMonths != null ? clamp(1 - Math.max(0, p.devAvgDelayMonths) / 24) : 0.5;
    return clamp(0.5 * rel + 0.2 * depth + 0.3 * delay);
  },
  roi: (p) => {
    const a = p.roiActualCagr;
    if (a == null) return 0.5;
    const abs = clamp(a / 16);
    const beat = p.roiCityCagr ? clamp(0.5 + (a - p.roiCityCagr) / 14) : 0.5;
    return clamp(0.55 * abs + 0.45 * beat);
  },
  entry: (p, d, mkt) => {
    const bucket = d.bucket ?? entryBucket(p);
    if (!bucket) return 0.5;
    const price = configPriceCr(p, bucket);
    const med = mkt.medianByCorridorBucket[`${p.corridor}|${bucket}`] ?? mkt.medianByBucket[bucket];
    return price == null || med == null || med <= 0 ? 0.5 : clamp(0.5 + (med - price) / med);
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

export function matchLabel(pct: number): { label: string; tone: "good" | "fair" | "low" } {
  if (pct >= 82) return { label: "Ideal fit", tone: "good" };
  if (pct >= 68) return { label: "Strong fit", tone: "good" };
  if (pct >= 52) return { label: "Fair fit", tone: "fair" };
  return { label: "Limited fit", tone: "low" };
}

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
  active: MatchFactor[];
  breakdown: { factor: MatchFactor; weight: number; fit: number; contribution: number }[];
};

/** Is a factor active for this buyer? Conditional fit-factors drop when unspecified. */
function isActive(factor: MatchFactor, d: Buyer): boolean {
  if (factor === "config") return d.bucket != null;
  if (factor === "location") return (!!d.corridors && d.corridors.length > 0) || d.poi != null;
  if (factor === "timeline") return d.byYear != null;
  return true;
}

/** Score one project for one buyer against the corpus market context. */
export function scoreMatch(p: MatchInput, d: Buyer, mkt: MarketContext): MatchResult {
  const W = MATCH_WEIGHTS[d.persona];
  const boosted = new Set((d.priorities ?? []).map((pr) => PRIORITY_FACTOR[pr]).filter(Boolean) as MatchFactor[]);
  const baseW = (f: MatchFactor) => (W[f] || 0) * (boosted.has(f) ? PRIORITY_BOOST : 1);
  const active = (Object.keys(W) as MatchFactor[]).filter((f) => isActive(f, d));
  const totalW = active.reduce((s, f) => s + baseW(f), 0) || 1;
  const breakdown: MatchResult["breakdown"] = [];
  let s = 0;
  for (const factor of active) {
    const weight = (baseW(factor) / totalW) * 100; // priority-boosted, renormalized to sum 100 over active factors
    const fit = F[factor](p, d, mkt);
    const contribution = weight * fit;
    s += contribution;
    breakdown.push({ factor, weight: Math.round(weight), fit: r2(fit), contribution });
  }
  const pct = Math.min(99, Math.round(s));
  return { pct, persona: d.persona, ...matchLabel(pct), subline: sublineFor(breakdown), active, breakdown };
}

/* Persona-aware gap subline: the best-fitting weighty factor + the biggest gap.
   "Delivery and legal check out; budget's a stretch." */
function sublineFor(bd: MatchResult["breakdown"]): string {
  const real = bd.filter((b) => b.weight >= 8);
  const fits = real.filter((b) => b.fit >= 0.75).sort((a, b) => b.weight * b.fit - a.weight * a.fit).map((b) => FACTOR_LABEL[b.factor]);
  const gaps = real.filter((b) => b.fit <= 0.5).sort((a, b) => b.weight * (1 - b.fit) - a.weight * (1 - a.fit)).map((b) => FACTOR_LABEL[b.factor]);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (fits.length && !gaps.length) return `${cap(fits.slice(0, 2).join(" & "))} all check out.`;
  if (!fits.length && gaps.length) return `Worth a closer look on ${gaps.slice(0, 2).join(" & ")}.`;
  if (fits.length && gaps.length) return `${cap(fits.slice(0, 2).join(" & "))} fit; ${gaps.slice(0, 2).join(" & ")} to weigh.`;
  return "A balanced fit against your brief.";
}

/* ── Recommendation Stratification Helper ──
   Stratifies a ranked list of projects into 3 advisory tiers:
   1. Bullseye: High-match dead-center picks within budget and target corridor
   2. Value Arbitrage: Quality picks offering attractive entry value or adjacent sector growth
   3. Trophy Upgrade: Institutional landmark picks at a slight budget stretch */
export type StratifiedRecommendation<T> = {
  bullseye: T[];
  valueArbitrage: T[];
  trophyUpgrade: T[];
  allRanked: T[];
};

export function stratifyRecommendations<T extends { truthScore: number; budget: [number, number]; market: string; matchPct?: number }>(
  items: T[],
  buyer: Buyer
): StratifiedRecommendation<T> {
  const allRanked = [...items].sort((a, b) => (b.matchPct ?? 0) - (a.matchPct ?? 0) || b.truthScore - a.truthScore);
  
  const targetCorrs = (buyer.corridors ?? []).map(normalizeCorridorKey);
  const bullseye: T[] = [];
  const valueArbitrage: T[] = [];
  const trophyUpgrade: T[] = [];

  for (const item of allRanked) {
    const [lo, hi] = item.budget;
    const itemCorr = normalizeCorridorKey(item.market);
    const isTargetBudget = lo <= buyer.budgetCr * 1.15;
    const isTargetCorridor = targetCorrs.length === 0 || targetCorrs.includes(itemCorr);

    if ((item.matchPct ?? 0) >= 80 && isTargetBudget && isTargetCorridor && bullseye.length < 3) {
      bullseye.push(item);
    } else if (
      item.truthScore >= 68 &&
      lo < buyer.budgetCr * 0.85 &&
      (item.matchPct ?? 0) >= 70 &&
      valueArbitrage.length < 2
    ) {
      valueArbitrage.push(item);
    } else if (
      item.truthScore >= 75 &&
      hi >= buyer.budgetCr * 1.10 &&
      lo <= buyer.budgetCr * 1.35 &&
      trophyUpgrade.length < 2
    ) {
      trophyUpgrade.push(item);
    }
  }

  return {
    bullseye: bullseye.length ? bullseye : allRanked.slice(0, 3),
    valueArbitrage: valueArbitrage.length ? valueArbitrage : allRanked.slice(3, 5),
    trophyUpgrade: trophyUpgrade.length ? trophyUpgrade : allRanked.slice(5, 7),
    allRanked,
  };
}

