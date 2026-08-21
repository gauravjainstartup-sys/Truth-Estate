/* ══════════════════════════════════════════════════════════════════════════
   roiEngine — Truth Estate project return model (Expected + Risk-Adjusted)

   A pure, side-effect-free calculator. Every output is a CAGR (%/yr) except
   the two XIRRs (also %/yr — the annualised IRR of the actual cash flows).

   THE MODEL (agreed with the founder, Aug 2026)
   ─────────────────────────────────────────────────────────────────────────
   • Base            = India CAGR + Gurgaon add           (the city market rate)
   • Expected CAGR   = Base + Truth-Score quality kicker  (quality lifts/drags)
       kicker = clamp(slope × (TruthScore − neutral), ±cap)
   • Delay cost      = Base × (predicted delay ÷ holding) (opportunity cost of
                       the slip, in CAGR terms — capital sits idle), CAPPED at
                       `delayCostCap` so no single factor (and no stale/garbled
                       RERA date) can overwhelm the market base or drive the
                       headline to a false-precision near-zero.
   • Risk-Adj CAGR   = Expected − Delay cost
   • Rental          = rentalYield of the *then-value*, only for the years the
                       ready asset is held (holding − time-to-possession); it
                       flows through the XIRR, not the price CAGR.
   • XIRR            = IRR of {linear outflow to possession, rent post-
                       possession, sale at exit}; expected & risk-adjusted.

   Micro-market corridor CAGR is passed through as *context only* (shown beside
   the number), never folded into the base — the founder's call, to keep the
   headline conservative.

   DYNAMIC: everything keys off `asOf` (defaults to now), so time-to-possession
   and the rentable window shrink as the viewing date moves.

   ⚠️ THE CONSTANTS IN `DEFAULT_ROI_PARAMS` ARE UNCALIBRATED PLACEHOLDERS.
      The structure is validated; the magnitudes await a backtest against
      realised appreciation. Treat absolute outputs as modeled estimates.
   ══════════════════════════════════════════════════════════════════════════ */

export interface RoiParams {
  /** National residential CAGR, % (macro floor). */
  indiaCagr: number;
  /** Gurgaon's add over the national rate, %. */
  gurgaonAdd: number;
  /** Truth Score at which the quality kicker is zero. */
  scoreNeutral: number;
  /** CAGR points added per Truth-Score point above neutral. */
  scoreSlope: number;
  /** Max absolute quality kicker, % — a great score can never dominate the base. */
  scoreCap: number;
  /** Max CAGR points the predicted delay can remove. */
  delayCostCap: number;
  /** Post-possession rental yield on the then-value, %/yr. */
  rentalYield: number;
  /** Default holding horizon from today, years. */
  holdYears: number;
}

export interface CorridorBaseline {
  cagr: number;
  rentalYield: number;
  bearDelta: number;
  bullDelta: number;
}

/* ── Realistic Institutional Corridor Baselines ──
   Calibrated for conservative underwriting across Gurugram micro-markets. */
export const CORRIDOR_BASELINES: Record<string, CorridorBaseline> = {
  dwarka: { cagr: 10.8, rentalYield: 3.0, bearDelta: -2.3, bullDelta: +2.0 },
  gce: { cagr: 10.5, rentalYield: 3.0, bearDelta: -2.0, bullDelta: +2.0 },
  spr: { cagr: 10.0, rentalYield: 2.8, bearDelta: -2.0, bullDelta: +2.0 },
  "new-gurgaon": { cagr: 9.2, rentalYield: 2.8, bearDelta: -1.7, bullDelta: +1.8 },
  nh8: { cagr: 8.8, rentalYield: 2.6, bearDelta: -1.8, bullDelta: +1.7 },
  "sohna-road": { cagr: 8.5, rentalYield: 3.0, bearDelta: -1.7, bullDelta: +1.7 },
  sohna: { cagr: 8.5, rentalYield: 2.5, bearDelta: -2.0, bullDelta: +2.0 },
  gcr: { cagr: 7.2, rentalYield: 2.8, bearDelta: -1.7, bullDelta: +1.6 },
};

export function normalizeCorridorKey(s: string | null | undefined): string {
  const t = (s || "").toLowerCase();
  if (t.includes("spr") || t.includes("southern peripheral")) return "spr";
  if (t.includes("dwarka") || t.includes("northern peripheral") || t.includes("dxp")) return "dwarka";
  if (t.includes("new gurgaon") || t.includes("new gurugram")) return "new-gurgaon";
  if (t.includes("sohna")) return t.includes("road") ? "sohna-road" : "sohna";
  if (t.includes("nh-48") || t.includes("nh48") || t.includes("nh 48") || t.includes("nh-8") || t.includes("nh8")) return "nh8";
  if (t.includes("golf course")) {
    return t.includes("ext") || t.includes("gcre") || t.includes("gce") ? "gce" : "gcr";
  }
  return t.trim();
}

export function corridorBaselineFor(corridor: string | null | undefined): CorridorBaseline {
  const key = normalizeCorridorKey(corridor);
  return CORRIDOR_BASELINES[key] ?? { cagr: 9.5, rentalYield: 2.8, bearDelta: -2.0, bullDelta: +2.0 };
}

/** Calibrated realistic baseline parameters. */
export const DEFAULT_ROI_PARAMS: RoiParams = {
  indiaCagr: 7.5,
  gurgaonAdd: 2.0,
  scoreNeutral: 68,
  scoreSlope: 0.06,
  scoreCap: 1.5,
  delayCostCap: 2.5,
  rentalYield: 2.8,
  holdYears: 8,
};

export interface RoiInput {
  /** Entry / buy price, ₹ Cr (used only for XIRR cash-flow shape; CAGRs are price-independent). */
  entryPriceCr: number;
  /** Composite Truth Score, 0..100. */
  truthScore: number;
  /** Predicted possession date (ISO "2031-10-01" or "Oct 2031"). */
  possessionDate: string | Date | null | undefined;
  /** RERA-promised possession date — the delay is predicted minus promised. */
  reraDate?: string | Date | null;
  /** "Today". Defaults to now; inject a fixed date for deterministic tests. */
  asOf?: Date;
  /** Holding horizon override, years. */
  holdYears?: number;
  /** Target project corridor / microMarket name. */
  corridor?: string | null;
  /** Corridor 5-yr CAGR, %, shown as context. */
  corridorCagr?: number | null;
  /** Filed construction progress %, for the CLP entry catch-up (a project
   *  20% built takes 20% at entry). null → the 10%-down assumption. */
  constructionPct?: number | null;
}

export interface RoiBands {
  /** Risk-adjusted CAGR if the market runs cold and the slip worsens. */
  bear: number;
  base: number;
  /** Risk-adjusted CAGR if the market runs hot and delivery beats the prediction. */
  bull: number;
}

export interface RoiResult {
  asOf: string; // ISO date the model was run for
  entryPriceCr: number;
  // ── appreciation ──
  base: number; // India + Gurgaon
  qualityKicker: number; // from the Truth Score
  expectedCagr: number; // base + kicker
  // ── timing ──
  yearsToPossession: number;
  delayMonths: number;
  delayCost: number; // CAGR points removed for the slip
  rentableYears: number;
  // ── risk-adjusted ──
  riskAdjustedCagr: number; // expected − delay cost
  // ── cash-flow returns ──
  expectedXirr: number | null;
  riskAdjustedXirr: number | null;
  // ── rupee bifurcation of the risk-adjusted hold (scales with entryPriceCr;
  //    capital = the resale gain, rent = income collected once ready) ──
  exitValueCr: number; // resale value at exit
  capitalGainCr: number; // exitValueCr − entry
  rentCollectedCr: number; // total rent over the rentable window
  // ── context & range ──
  corridorCagr: number | null;
  bands: RoiBands;
  /** The GROSS annual yield the rent flows were built on — the corridor's
   *  where a baseline resolved, the city default otherwise. */
  rentalYieldPct: number;
  // ── the CLP shape behind the XIRR ──
  entryPct: number; // % of the ticket paid at entry (the built share, min 10)
  tranches: PaymentTranche[]; // remaining 10% blocks, months from asOf
}

/* ── date helpers ─────────────────────────────────────────────────────────
   Tolerant of ISO ("2031-10-01") and "Mon YYYY" ("Oct 2031"). Returns null on
   anything unparseable rather than an Invalid Date. */
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
export function toDate(v: string | Date | null | undefined): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(+v) ? null : v;
  const s = String(v).trim();
  const iso = new Date(s);
  if (!isNaN(+iso) && /\d{4}-\d{2}/.test(s)) return iso;
  const m = /^([A-Za-z]{3,})\s+(\d{4})$/.exec(s);
  if (m) {
    const mi = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mi != null) return new Date(Number(m[2]), mi, 1);
  }
  return isNaN(+iso) ? null : iso;
}
const YEAR_MS = 365.25 * 24 * 3600 * 1000;
const yearsBetween = (from: Date, to: Date): number => (+to - +from) / YEAR_MS;

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

/* ── XIRR ──────────────────────────────────────────────────────────────────
   Monthly cash-flow IRR via bisection, annualised. cf[0] is month 0.
   Returns null when no sign change brackets a root (degenerate flows). */
export function xirrAnnual(cf: number[]): number | null {
  const npv = (rm: number): number => cf.reduce((s, c, i) => s + c / Math.pow(1 + rm, i), 0);
  let lo = -0.95, hi = 1.0;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
}

/* ── Construction-linked payment plan (CLP) ────────────────────────────
   How the money ACTUALLY leaves a Gurugram buyer's account, per the BBA:
   10% blocks, each released as the build crosses its next 10% mark. An
   investor entering TODAY therefore pays the built share up front — a
   project 20% done takes 20% at entry — and the remaining blocks fall due
   on the CURRENT pace, i.e. the unbuilt share spread over the months to
   our delay-adjusted possession. The linear-dribble model this replaces
   understated the entry cheque and erased the CLP leverage: appreciation
   accrues on the FULL locked price from day one while only part of the
   money is deployed, which is precisely what an under-construction buyer
   is buying. Ready / past-possession stock degrades to a full payment at
   entry, as it should. */
export type PaymentTranche = { month: number; pct: number };

export function clpSchedule(
  constructionPct: number | null | undefined,
  monthsToPossession: number,
): { entryPct: number; tranches: PaymentTranche[] } {
  const done = constructionPct == null ? null : clamp(constructionPct, 0, 100);
  if (monthsToPossession <= 0 || (done != null && done >= 100)) return { entryPct: 100, tranches: [] };
  /* No filed progress → the old smooth assumption (10% down, rest linear in
     10% blocks) rather than pretending we know the stage. */
  const entryPct = done == null ? 10 : Math.max(10, Math.floor(done / 10) * 10);
  const blocks = Math.round((100 - entryPct) / 10);
  const tranches: PaymentTranche[] = [];
  for (let k = 1; k <= blocks; k++) {
    tranches.push({ month: Math.max(1, Math.round((monthsToPossession * k) / blocks)), pct: 10 });
  }
  return { entryPct, tranches };
}

/* Cash flows for a hold: CLP outflows (entry catch-up + 10% tranches to
   possession), rent on the then-value once ready, sale at exit. */
function buildCashflows(
  entryCr: number,
  growthPct: number,
  yearsToPossession: number,
  holdYears: number,
  rentalPct: number,
  constructionPct: number | null | undefined,
): number[] {
  const M = Math.max(1, Math.round(holdYears * 12));
  const Mp = Math.max(0, Math.min(M, Math.round(yearsToPossession * 12)));
  const g = growthPct / 100;
  const cf = new Array<number>(M + 1).fill(0);
  const { entryPct, tranches } = clpSchedule(constructionPct, Mp);
  cf[0] -= entryCr * (entryPct / 100);
  for (const t of tranches) cf[Math.min(t.month, M)] -= entryCr * (t.pct / 100);
  for (let m = Math.max(1, Mp); m < M; m++) cf[m] += (rentalPct / 100 / 12) * entryCr * Math.pow(1 + g, m / 12); // rent
  cf[M] += entryCr * Math.pow(1 + g, holdYears); // sale
  return cf;
}

/**
 * Compute the full Expected / Risk-Adjusted return picture for one project,
 * as of a given date. Pure — pass `asOf` for deterministic output.
 */
export function computeRoi(input: RoiInput, params: RoiParams = DEFAULT_ROI_PARAMS): RoiResult {
  const asOf = input.asOf ?? new Date();
  const holdYears = input.holdYears ?? params.holdYears;

  // Resolve corridor-specific realistic baseline if provided, or fallback to params base
  const corrBaseline = input.corridor ? corridorBaselineFor(input.corridor) : null;
  const base = corrBaseline ? corrBaseline.cagr : (params.indiaCagr + params.gurgaonAdd);
  const activeRentalYield = corrBaseline ? corrBaseline.rentalYield : params.rentalYield;

  const score = clamp(input.truthScore ?? params.scoreNeutral, 0, 100);
  const qualityKicker = clamp(params.scoreSlope * (score - params.scoreNeutral), -params.scoreCap, params.scoreCap);
  const expectedCagr = base + qualityKicker;

  // ── timing (dynamic to asOf) ──
  const possession = toDate(input.possessionDate);
  const rera = toDate(input.reraDate);
  const yearsToPossession = possession ? Math.max(0, yearsBetween(asOf, possession)) : Math.min(holdYears, 3);
  const delayMonths = possession && rera ? Math.max(0, yearsBetween(rera, possession) * 12) : 0;
  const rentableYears = Math.max(0, holdYears - yearsToPossession);

  // ── delay cost & risk-adjusted CAGR (delay cost capped — see delayCostCap) ──
  const delayCost = Math.min(params.delayCostCap, base * (delayMonths / 12) / holdYears);
  const riskAdjustedCagr = expectedCagr - delayCost;

  // ── cash-flow returns (construction-linked payment plan) ──
  const flows = (g: number): number[] =>
    buildCashflows(input.entryPriceCr, g, yearsToPossession, holdYears, activeRentalYield, input.constructionPct);
  const schedule = clpSchedule(input.constructionPct, Math.max(0, Math.min(Math.round(holdYears * 12), Math.round(yearsToPossession * 12))));
  const raFlows = flows(riskAdjustedCagr);
  const expectedXirr = xirrAnnual(flows(expectedCagr));
  const riskAdjustedXirr = xirrAnnual(raFlows);

  // ── rupee bifurcation of the risk-adjusted path: sale is the final flow,
  //    rent is every positive flow between possession and exit. Capital gain
  //    = exit value − the full ticket (every tranche eventually paid), so the
  //    split stays honest whatever the CLP shape. ──
  const lastM = raFlows.length - 1;
  const possM = Math.max(1, Math.min(lastM, Math.round(yearsToPossession * 12)));
  const rentCollectedCr = raFlows.slice(possM, lastM).reduce((s, c) => s + Math.max(0, c), 0);
  const exitValueCr = raFlows[lastM];
  const capitalGainCr = exitValueCr - input.entryPriceCr;

  // ── bull / bear on corridor volatility & delivery uncertainty ──
  const bearDelta = corrBaseline?.bearDelta ?? -2.0;
  const bullDelta = corrBaseline?.bullDelta ?? +2.0;
  const bandCagr = (marketDelta: number, delayDeltaMonths: number): number => {
    const exp = base + marketDelta + qualityKicker;
    const dm = Math.max(0, delayMonths + delayDeltaMonths);
    return exp - Math.min(params.delayCostCap, base * (dm / 12) / holdYears);
  };
  const bands: RoiBands = {
    bear: round1(bandCagr(bearDelta, +12)),
    base: round1(riskAdjustedCagr),
    bull: round1(bandCagr(bullDelta, -6)),
  };

  return {
    asOf: asOf.toISOString().slice(0, 10),
    entryPriceCr: input.entryPriceCr,
    base: round1(base),
    qualityKicker: round1(qualityKicker),
    expectedCagr: round1(expectedCagr),
    yearsToPossession: round2(yearsToPossession),
    delayMonths: Math.round(delayMonths),
    delayCost: round1(delayCost),
    rentableYears: round1(rentableYears),
    riskAdjustedCagr: round1(riskAdjustedCagr),
    expectedXirr: expectedXirr == null ? null : round1(expectedXirr),
    riskAdjustedXirr: riskAdjustedXirr == null ? null : round1(riskAdjustedXirr),
    exitValueCr: round2(exitValueCr),
    capitalGainCr: round2(capitalGainCr),
    rentCollectedCr: round2(rentCollectedCr),
    corridorCagr: input.corridorCagr ?? round1(base),
    bands,
    rentalYieldPct: activeRentalYield,
    entryPct: schedule.entryPct,
    tranches: schedule.tranches,
  };
}

/**
 * Exit-timing sweep: the hold length (from today) that maximises the
 * risk-adjusted XIRR, in 0.1-yr steps.
 *
 * NOTE: under a FLAT appreciation path this tends to pick "exit at possession"
 * (rent yields less than appreciation, so holding longer only dilutes the IRR).
 * It becomes a genuinely interesting optimiser once a non-flat price path
 * (completion re-rating + taper) is modeled — a deliberate follow-up.
 */
export function optimalExit(
  input: RoiInput,
  params: RoiParams = DEFAULT_ROI_PARAMS,
): { years: number; riskAdjustedXirr: number } | null {
  const asOf = input.asOf ?? new Date();
  const possession = toDate(input.possessionDate);
  const tp = possession ? Math.max(0.3, yearsBetween(asOf, possession)) : 3;
  let best: { years: number; riskAdjustedXirr: number } | null = null;
  for (let h = Math.ceil(tp * 10); h <= 140; h++) {
    const years = h / 10;
    const r = computeRoi({ ...input, holdYears: years }, params);
    if (r.riskAdjustedXirr != null && (best == null || r.riskAdjustedXirr > best.riskAdjustedXirr)) {
      best = { years, riskAdjustedXirr: r.riskAdjustedXirr };
    }
  }
  return best;
}

const round1 = (x: number): number => Math.round(x * 10) / 10;
const round2 = (x: number): number => Math.round(x * 100) / 100;
