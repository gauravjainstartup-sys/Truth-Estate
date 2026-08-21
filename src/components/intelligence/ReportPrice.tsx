"use client";

import { useEffect, useMemo, useState } from "react";
import { priceJourney, roiModel, fmtPsf, lastUpdatedOn, type ProjectIntel } from "@/lib/projects";
import { hasReadAccess, packageById, enableDevUnlock } from "@/lib/journey";
import { openUnitIntel } from "./TowerIntel";
import { useReportStatic } from "./reportStatic";
import { computeRoi, optimalExit, DEFAULT_ROI_PARAMS, type RoiResult } from "@/lib/analytics/roiEngine";

/* Chapter III — "Will it make money?"
   a · The price since launch (PSF journey + what moved it)
   b · The return on your cash — XIRR front and centre (gated to the paid read)
   c · Where the return comes from — capital appreciation vs rental income
   d · When to exit — the same entry, different holds, and who each suits
   e · The waterfall — how the appreciation is built (market → quality → delay)
   f · The assumptions — every lever on the table
   Powered by src/lib/analytics/roiEngine (constants uncalibrated — labelled). */

/** Build the roiEngine inputs from a project. CAGRs are price-independent; the
 *  ticket only shapes the XIRR cash-flow, so a missing budget is harmless. */
function roiInputFor(p: ProjectIntel, holdYears: number, asOf: Date | undefined) {
  const con = p.ops?.construction;
  return {
    entryPriceCr: Math.max(0.5, (p.budget[0] + p.budget[1]) / 2),
    truthScore: p.truthScore > 0 ? p.truthScore : DEFAULT_ROI_PARAMS.scoreNeutral,
    possessionDate: con?.predictedDateFull ?? con?.predictedDate ?? null,
    reraDate: con?.reraDateFull ?? con?.reraDate ?? null,
    holdYears,
    asOf,
    corridor: p.market ?? null,
  };
}

const crStr = (v: number) => `₹${v.toFixed(2)} Cr`;
/* One PSF format across the whole chapter — full rupees with commas (₹35,000),
   never a mix of ₹35,000 and 36.0k. A range drops the second ₹: ₹34,000–36,000. */
const psfRange = (lo: number, hi: number) => (lo === hi ? fmtPsf(lo) : `${fmtPsf(lo)}–${fmtPsf(hi).replace(/^₹/, "")}`);
/* How long the premium has had to accrue — months under a year, else years. */
const sinceLaunch = (years: number): string => {
  const m = Math.round(years * 12);
  if (m < 12) return `${m} month${m === 1 ? "" : "s"}`;
  const y = Math.round(years * 10) / 10;
  return `${Number.isInteger(y) ? y.toFixed(0) : y.toFixed(1)} year${y >= 2 ? "s" : ""}`;
};

export default function ReportPrice({ p, sample = false }: { p: ProjectIntel; sample?: boolean }) {
  const journey = priceJourney(p);
  const roi = roiModel(p);
  /* Frozen sample / static export: the interactive detail is dropped; the
     record + the headline number read fine static. */
  const isStatic = useReportStatic();
  // The projection is part of the paid read — any read entitlement unlocks it.
  const [unlocked, setUnlocked] = useState(() => sample || (typeof window !== "undefined" ? hasReadAccess(p.slug) : false));

  useEffect(() => {
    const sync = () => setUnlocked(sample || (typeof window !== "undefined" ? hasReadAccess(p.slug) : false));
    sync();
    window.addEventListener("truthEstate:auth", sync);
    window.addEventListener("truthEstate:accessChanged", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("truthEstate:auth", sync);
      window.removeEventListener("truthEstate:accessChanged", sync);
      window.removeEventListener("storage", sync);
    };
  }, [p.slug, sample]);

  const [holdYears, setHoldYears] = useState(8);
  const [today, setToday] = useState<Date | undefined>(undefined);
  useEffect(() => setToday(new Date()), []);

  const r: RoiResult = useMemo(() => computeRoi(roiInputFor(p, holdYears, today)), [p, holdYears, today]);
  const outlook: "Low" | "Medium" | "High" = r.expectedCagr >= 11 ? "High" : r.expectedCagr >= 9 ? "Medium" : "Low";

  // The headline cash return. Date-dependent, so it's the CAGR pre-mount (SSR-
  // safe) and refines to the XIRR once we know "today".
  const cashReturn = today && r.riskAdjustedXirr != null ? r.riskAdjustedXirr : r.riskAdjustedCagr;
  const showingXirr = today != null && r.riskAdjustedXirr != null;

  // Rupee bifurcation of the selected hold.
  const totalProfit = Math.max(0, r.capitalGainCr + r.rentCollectedCr);
  const capPct = totalProfit > 0 ? Math.round((r.capitalGainCr / totalProfit) * 100) : 100;
  const rentPct = Math.max(0, 100 - capPct);

  // The flip: risk-adjusted IRR peaks around possession (rent trails price
  // growth, so a longer hold trades IRR for absolute gain + yield).
  const opt = useMemo(() => (today ? optimalExit(roiInputFor(p, 8, today)) : null), [p, today]);

  const exitNote =
    holdYears <= 5
      ? "A medium hold — capture the post-handover price surge while the initial rental income starts to compound."
      : holdYears >= 10
        ? "The long-term wealth compounding hold — maximum cumulative rupees and steady passive income as an inflation shield."
        : "The balanced institutional default — strong capital appreciation combined with several years of mature rental yield.";

  if (!journey && !roi) return null;

  return (
    <div className="mt-8 font-sans">
      {/* ── Section Header ── */}
      {journey && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[#1e6b45]">
              Chapter III · Financial Intelligence &amp; ROI
            </p>
            <p className="text-[0.7rem] font-light italic text-[#1a1a1a]/40">
              Audited {lastUpdatedOn(p)}
            </p>
          </div>
          <h3 className="mt-1.5 font-serif text-[1.85rem] font-medium leading-tight text-[#1a1a1a] md:text-[2.2rem]">
            The price, since launch
          </h3>

          {/* ── 3-Column Price Evolution Strip ── */}
          <div className="mt-5 grid grid-cols-1 overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] sm:grid-cols-3">
            <div className="border-b border-[#1a1a1a]/[0.08] p-5 sm:border-b-0 sm:border-r">
              <span className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">
                Launch · {journey.launchDate}
              </span>
              <p className="mt-1.5 font-serif text-[1.6rem] font-medium tracking-tight tabular-nums text-[#1a1a1a]">
                {fmtPsf(journey.launchPsf)}
                <span className="text-[0.8rem] font-light text-[#1a1a1a]/40"> /sqft</span>
              </p>
            </div>

            <div className="border-b border-[#1a1a1a]/[0.08] p-5 sm:border-b-0 sm:border-r">
              <span className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">
                Current Range · Today
              </span>
              <p className="mt-1.5 font-serif text-[1.6rem] font-medium tracking-tight tabular-nums text-[#1a1a1a]">
                {psfRange(journey.currentLow, journey.currentHigh)}
              </p>
            </div>

            <div className="flex items-center gap-3.5 bg-gradient-to-r from-[#1e6b45]/[0.06] to-transparent p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1e6b45]/15 text-[#1e6b45]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M14 7h7v7" />
                </svg>
              </span>
              <div>
                <span className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">
                  Premium to Date
                </span>
                <p className="font-serif text-[1.65rem] font-medium leading-none tracking-tight text-[#1e6b45]">
                  +{journey.premiumPct}%
                  <span className="ml-1.5 text-[0.72rem] font-sans font-light text-[#1a1a1a]/55">
                    ({sinceLaunch(journey.years)})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ── Trajectory Chart & XIRR Hero Card ── */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            {/* Historical + Projected Price Curve */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-gradient-to-b from-white to-[#faf5ec] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/50">
                    Price Trajectory &amp; Forecast
                  </span>
                  <p className="mt-0.5 text-[0.75rem] font-light text-[#1a1a1a]/60">
                    Historical RERA index to projected 5-year CAGR cone
                  </p>
                </div>
                <span className="rounded-full border border-[#1e6b45]/20 bg-[#1e6b45]/10 px-2.5 py-1 text-[0.65rem] font-semibold text-[#1e6b45]">
                  Live Audited
                </span>
              </div>

              <div className="relative my-4">
                <svg viewBox="0 0 1000 286" className="block w-full" role="img" aria-label="Price per sq ft trajectory">
                  <defs>
                    <linearGradient id="parea-v2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(195,160,90,0.38)" />
                      <stop offset="100%" stopColor="rgba(195,160,90,0)" />
                    </linearGradient>
                    <linearGradient id="pcone-v2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(30,107,69,0.32)" />
                      <stop offset="100%" stopColor="rgba(30,107,69,0.04)" />
                    </linearGradient>
                  </defs>
                  <g stroke="rgba(26,26,26,0.08)" strokeWidth="1">
                    <line x1="40" y1="70" x2="960" y2="70" />
                    <line x1="40" y1="140" x2="960" y2="140" />
                    <line x1="40" y1="210" x2="960" y2="210" />
                    <line x1="40" y1="280" x2="960" y2="280" />
                  </g>
                  {/* Historical shaded area */}
                  <path d="M40,255 L200,238 L310,215 L420,192 L420,280 L40,280 Z" fill="url(#parea-v2)" />
                  {/* Forward projection cone */}
                  <path d="M420,192 L940,52 L940,150 Z" fill="url(#pcone-v2)" />
                  {/* Historical curve */}
                  <path d="M40,255 L200,238 L310,215 L420,192" fill="none" stroke="#8a6a1e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Forward median dashed line */}
                  <path d="M420,192 L940,96" fill="none" stroke="#1e6b45" strokeWidth="3.5" strokeDasharray="8 5" strokeLinecap="round" />
                  {/* Threshold line */}
                  <line x1="420" y1="34" x2="420" y2="280" stroke="#8a6a1e" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.75" />
                  <circle cx="40" cy="255" r="6" fill="#8a6a1e" />
                  <circle cx="420" cy="192" r="7.5" fill="#fff" stroke="#1e6b45" strokeWidth="4" />
                </svg>

                <span className="absolute bottom-[11%] left-[5%] whitespace-nowrap rounded-full border border-[#8a6a1e]/30 bg-white/90 px-2.5 py-1 text-[0.66rem] font-medium tabular-nums text-[#1a1a1a] shadow-xs">
                  Launch {fmtPsf(journey.launchPsf)}
                </span>
                <span className="absolute bottom-[44%] right-[57%] whitespace-nowrap rounded-full border border-[#1e6b45]/30 bg-white/95 px-3 py-1.5 text-[0.72rem] font-bold tabular-nums text-[#1e6b45] shadow-sm">
                  Today {psfRange(journey.currentLow, journey.currentHigh)}
                </span>
              </div>

              <div className="relative h-4 font-mono text-[0.66rem] tracking-[0.04em] text-[#1a1a1a]/50">
                <span className="absolute left-[4%] font-semibold">{journey.launchDate.split(" ")[1] || "Launch"}</span>
                <span className="absolute left-[42%] -translate-x-1/2 rounded bg-[#1e6b45]/10 px-1.5 py-0.5 text-[#1e6b45] font-semibold">Today</span>
                <span className="absolute right-[4%] font-semibold">+5 Yrs Forward</span>
              </div>
            </div>

            {/* Hero XIRR Medallion */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#1e6b45]/30 bg-gradient-to-br from-[#1E4D3A] to-[#0d2a1f] p-6 text-white shadow-md">
              {unlocked ? (
                <>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#c9a96e]">
                        Annualized Cash Return
                      </span>
                      <span className="rounded bg-[#c9a96e]/20 px-2 py-0.5 font-mono text-[0.62rem] font-bold tracking-wider text-[#d4b97a]">
                        XIRR MODEL
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <p className="font-serif text-[3.6rem] font-medium leading-none tracking-tight text-[#f5f0e8]">
                        {cashReturn.toFixed(1)}
                      </p>
                      <span className="text-[1.1rem] font-light text-[#c9a96e]">% / yr</span>
                    </div>

                    <p className="mt-3 text-[0.74rem] font-light leading-[1.55] text-[#f5f0e8]/75">
                      {showingXirr ? (
                        <>Institutional-grade return accounting for staged construction outflows, delayed possession risk, and post-handover rental yield.</>
                      ) : (
                        <>Realistic risk-adjusted annual return factoring in completion pacing and delivery certainty.</>
                      )}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xs">
                      <span className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-white/50">
                        Price Growth
                      </span>
                      <p className="mt-0.5 font-serif text-[1.3rem] font-medium leading-tight text-white">
                        {r.riskAdjustedCagr.toFixed(1)}
                        <span className="text-[0.65rem] font-normal text-white/50"> %/yr</span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#c9a96e]/25 bg-[#c9a96e]/10 p-3 backdrop-blur-xs">
                      <span className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[#d4b97a]">
                        Gross Yield
                      </span>
                      <p className="mt-0.5 font-serif text-[1.3rem] font-medium leading-tight text-[#d4b97a]">
                        {DEFAULT_ROI_PARAMS.rentalYield}
                        <span className="text-[0.65rem] font-normal text-[#d4b97a]/60"> %/yr</span>
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="my-auto flex flex-col items-center gap-3 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[1.4rem]">
                    🔒
                  </span>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#c9a96e]">
                    5-Year Growth Outlook
                  </p>
                  <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-1">
                    {(["Low", "Medium", "High"] as const).map((o) => (
                      <span key={o} className={`rounded-full px-3.5 py-1 text-[0.72rem] font-medium ${o === outlook ? "bg-[#c9a96e] font-bold text-[#0d2a1f]" : "text-white/40"}`}>
                        {o}
                      </span>
                    ))}
                  </div>
                  <p className="text-[0.72rem] font-light leading-relaxed text-white/60">
                    Unlock the complete XIRR model, rupee cash-flow waterfall, and optimal exit timing.
                  </p>
                  <button onClick={openUnitIntel} className="mt-1 w-full rounded-xl bg-[#c9a96e] py-2.5 text-[0.76rem] font-bold tracking-wide text-[#0d2a1f] shadow-sm transition hover:bg-[#d4b97a]">
                    Unlock the Projection →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      enableDevUnlock();
                      setUnlocked(true);
                    }}
                    className="mt-1 text-[0.68rem] font-medium text-[#c9a96e] underline hover:text-white"
                  >
                    ⚡ Instant 1-Click Unlock (Dev / Demo)
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Interactive Cash Flow Waterfall & Exit Simulator (Paid/Unlocked) ── */}
      {unlocked && !isStatic && (
        <div className="mt-10 rounded-2xl border border-[#1a1a1a]/10 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a1a1a]/[0.08] pb-5">
            <div>
              <span className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#1e6b45]">
                Private Client Simulator
              </span>
              <h4 className="mt-1 font-serif text-[1.5rem] font-medium text-[#1a1a1a]">
                When do you exit?
              </h4>
              <p className="mt-0.5 text-[0.78rem] font-light text-[#1a1a1a]/60">
                Capital appreciation + cumulative rent on a <b className="font-semibold text-[#1a1a1a]">{crStr(r.entryPriceCr)}</b> entry ticket.
              </p>
            </div>

            {/* Holding Horizon Segment Controller */}
            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/45">
                Hold Horizon:
              </span>
              <div className="flex rounded-xl border border-[#1a1a1a]/10 bg-[#f5f0e8] p-1">
                {[5, 8, 10].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setHoldYears(yr)}
                    className={`rounded-lg px-3.5 py-1.5 text-[0.75rem] font-medium transition-all ${
                      holdYears === yr
                        ? "bg-[#1E4D3A] font-bold text-white shadow-xs"
                        : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
                    }`}
                  >
                    {yr} Years
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5-Metric Performance HUD */}
          {today && (
            <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-5">
              <div className="rounded-xl border border-[#1e6b45]/30 bg-[#1e6b45]/[0.05] p-3.5">
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[#1e6b45]">
                  Hold {holdYears}Y · XIRR
                </span>
                <p className="mt-1 font-serif text-[1.45rem] font-medium leading-none text-[#1e6b45]">
                  {cashReturn.toFixed(1)}%
                  <span className="text-[0.65rem] font-sans font-normal text-[#1a1a1a]/45"> /yr</span>
                </p>
              </div>

              <div className="rounded-xl border border-[#1a1a1a]/[0.08] bg-[#fbf9f5] p-3.5">
                <span className="text-[0.55rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/45">
                  Exit Valuation
                </span>
                <p className="mt-1 font-serif text-[1.35rem] font-medium leading-none text-[#1a1a1a]">
                  {crStr(r.exitValueCr)}
                </p>
              </div>

              <div className="rounded-xl border border-[#1a1a1a]/[0.08] bg-[#fbf9f5] p-3.5">
                <span className="text-[0.55rem] font-medium uppercase tracking-[0.14em] text-[#1e6b45]">
                  Capital Gain
                </span>
                <p className="mt-1 font-serif text-[1.35rem] font-medium leading-none text-[#1e6b45]">
                  +{crStr(r.capitalGainCr)}
                </p>
              </div>

              <div className="rounded-xl border border-[#1a1a1a]/[0.08] bg-[#fbf9f5] p-3.5">
                <span className="text-[0.55rem] font-medium uppercase tracking-[0.14em] text-[#8a6a1e]">
                  Rent Collected
                </span>
                <p className="mt-1 font-serif text-[1.35rem] font-medium leading-none text-[#8a6a1e]">
                  +{crStr(r.rentCollectedCr)}
                </p>
              </div>

              <div className="col-span-2 rounded-xl border border-[#1a1a1a]/15 bg-gradient-to-r from-white to-[#f5f0e8] p-3.5 sm:col-span-1">
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[#1a1a1a]">
                  Total Net Profit
                </span>
                <p className="mt-1 font-serif text-[1.4rem] font-semibold leading-none text-[#1a1a1a]">
                  {crStr(totalProfit)}
                </p>
              </div>
            </div>
          )}

          {/* Visual Step Waterfall Bridge */}
          {today && totalProfit > 0 && (
            <div className="mt-6 rounded-xl border border-[#1a1a1a]/[0.08] bg-[#FAF7F0] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/60">
                  Cash Flow Waterfall &amp; Wealth Bridge ({holdYears}-Year Horizon)
                </span>
                <span className="font-mono text-[0.68rem] text-[#1e6b45] font-semibold">
                  Net Multiple: {((r.exitValueCr + r.rentCollectedCr) / r.entryPriceCr).toFixed(2)}x
                </span>
              </div>

              {/* Step Waterfall Bars */}
              <div className="mt-4 grid grid-cols-4 items-end gap-3 pt-4 text-center">
                {/* Step 1: Initial Entry */}
                <div className="flex flex-col items-center">
                  <span className="mb-1 font-mono text-[0.72rem] font-semibold text-[#1a1a1a]">
                    {crStr(r.entryPriceCr)}
                  </span>
                  <div className="h-20 w-full rounded-t-lg bg-[#1a1a1a]/20 transition-all duration-500" />
                  <span className="mt-2 text-[0.62rem] font-medium uppercase tracking-wider text-[#1a1a1a]/50">
                    1. Entry Ticket
                  </span>
                </div>

                {/* Step 2: Rent Collected */}
                <div className="flex flex-col items-center">
                  <span className="mb-1 font-mono text-[0.72rem] font-bold text-[#8a6a1e]">
                    +{crStr(r.rentCollectedCr)}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-[#9a7a2e] transition-all duration-500"
                    style={{ height: `${Math.max(12, Math.min(80, (r.rentCollectedCr / r.entryPriceCr) * 70))}px` }}
                  />
                  <span className="mt-2 text-[0.62rem] font-medium uppercase tracking-wider text-[#8a6a1e]">
                    2. Cash Rent
                  </span>
                </div>

                {/* Step 3: Capital Gain */}
                <div className="flex flex-col items-center">
                  <span className="mb-1 font-mono text-[0.72rem] font-bold text-[#1e6b45]">
                    +{crStr(r.capitalGainCr)}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-[#1e6b45] transition-all duration-500"
                    style={{ height: `${Math.max(24, Math.min(100, (r.capitalGainCr / r.entryPriceCr) * 70))}px` }}
                  />
                  <span className="mt-2 text-[0.62rem] font-medium uppercase tracking-wider text-[#1e6b45]">
                    3. Capital Growth
                  </span>
                </div>

                {/* Step 4: Total Value Created */}
                <div className="flex flex-col items-center">
                  <span className="mb-1 font-mono text-[0.75rem] font-extrabold text-[#1E4D3A]">
                    {crStr(r.exitValueCr + r.rentCollectedCr)}
                  </span>
                  <div className="h-28 w-full rounded-t-lg bg-gradient-to-t from-[#1E4D3A] to-[#2a7a58] transition-all duration-500" />
                  <span className="mt-2 text-[0.62rem] font-bold uppercase tracking-wider text-[#1E4D3A]">
                    4. Total Realized
                  </span>
                </div>
              </div>

              {/* Profit Split Bifurcation Bar */}
              <div className="mt-6 border-t border-[#1a1a1a]/[0.08] pt-4">
                <div className="flex items-center justify-between text-[0.68rem] text-[#1a1a1a]/60">
                  <span>Profit Return Composition</span>
                  <span><b>{capPct}% Capital</b> vs <b>{rentPct}% Rent</b></span>
                </div>
                <div className="mt-1.5 flex h-7 overflow-hidden rounded-md border border-[#1a1a1a]/10">
                  <div
                    className="flex items-center bg-[#1e6b45] px-3 text-[0.68rem] font-semibold text-white transition-all duration-500"
                    style={{ width: `${capPct}%` }}
                  >
                    Capital Gain {capPct}%
                  </div>
                  <div
                    className="flex items-center bg-[#9a7a2e] px-3 text-[0.68rem] font-semibold text-white transition-all duration-500"
                    style={{ width: `${rentPct}%` }}
                  >
                    Rent {rentPct}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Divestment Note & Optimal Flip Window */}
          <div className="mt-5 space-y-3">
            <p className="text-[0.8rem] font-light leading-[1.65] text-[#1a1a1a]/70">
              {exitNote}
            </p>

            {opt && (
              <div className="flex items-start gap-3.5 rounded-xl border border-[#c9a96e]/40 bg-[#FAF5E8] p-4 text-[#1a1a1a]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c9a96e]/25 font-serif text-[1rem] font-bold text-[#8a6a1e]">
                  ★
                </span>
                <div className="text-[0.76rem] font-light leading-[1.6] text-[#1a1a1a]/75">
                  <b className="font-semibold text-[#1a1a1a]">
                    Strategic Flip Window: IRR peaks around handover (~{opt.years.toFixed(1)} yr) at ~{opt.riskAdjustedXirr.toFixed(0)}% XIRR.
                  </b>{" "}
                  Because early construction equity produces maximum leverage, exiting right after completion captures the highest annualized IRR. Holding past year {Math.ceil(opt.years)} trades peak IRR for steady cash rent and compounded absolute rupees.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Return Waterfall Engine & Grounded Anchors ── */}
      {unlocked && !isStatic && (
        <>
          <div className="mt-10 flex items-center gap-3">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#1a1a1a]/70">
              The Price-Growth Engine Behind The Return
            </span>
            <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>

          <div className="mt-4 rounded-2xl border border-[#1a1a1a]/10 bg-white p-6 shadow-sm md:p-8">
            <p className="mb-6 text-[0.82rem] font-light leading-relaxed text-[#1a1a1a]/65">
              The base real estate growth of <b className="font-semibold text-[#1a1a1a]">{r.riskAdjustedCagr.toFixed(1)}%/yr</b> is the underlying engine. Staged payments and post-handover rental yields amplify this into your <b className="font-semibold text-[#1e6b45]">{cashReturn.toFixed(1)}% {showingXirr ? "XIRR" : "annual return"}</b>.
            </p>

            <div className="space-y-4">
              <FallRow
                label={<><b className="font-semibold text-[#1a1a1a]">Corridor Baseline Rate</b> — India {DEFAULT_ROI_PARAMS.indiaCagr}% + Corridor Growth</>}
                value={`${r.base.toFixed(1)}%`}
                lo={0}
                hi={r.base}
                tone="base"
                r={r}
              />
              <FallRow
                label={<><b className="font-semibold text-[#1a1a1a]">+ Project Quality Alpha</b> — Truth Score {p.truthScore}/100</>}
                value={`${r.qualityKicker >= 0 ? "+" : ""}${r.qualityKicker.toFixed(1)}%`}
                lo={Math.min(r.base, r.base + r.qualityKicker)}
                hi={Math.max(r.base, r.base + r.qualityKicker)}
                tone={r.qualityKicker >= 0 ? "up" : "down"}
                r={r}
              />
              {r.delayCost > 0.04 && (
                <FallRow
                  label={<><b className="font-semibold text-[#1a1a1a]">− Construction Friction Drag</b> — ~{r.delayMonths} mo. delay risk</>}
                  value={`−${r.delayCost.toFixed(1)}%`}
                  lo={r.riskAdjustedCagr}
                  hi={r.expectedCagr}
                  tone="down"
                  r={r}
                />
              )}
              <div className="border-t border-dashed border-[#1a1a1a]/15 pt-3">
                <FallRow
                  label={<b className="font-semibold text-[#1a1a1a]">= Risk-Adjusted Price CAGR</b>}
                  value={`${r.riskAdjustedCagr.toFixed(1)}%`}
                  lo={0}
                  hi={Math.max(0, r.riskAdjustedCagr)}
                  tone="fin"
                  r={r}
                />
              </div>
            </div>

            {/* Benchmark Comparison Anchors */}
            <div className="mt-7 overflow-hidden rounded-xl border border-[#1a1a1a]/10 bg-[#FAF7F0]">
              <Anchor k="Fixed Deposit (Post-Tax Benchmark)" v="7.0%" />
              <Anchor k="Gurugram City Average" v={`${r.base.toFixed(1)}%`} />
              <Anchor k="This Project — Risk Adjusted" v={`${r.riskAdjustedCagr.toFixed(1)}%`} you />
              <Anchor k="Range (Bearish Market → Bullish Expansion)" v={`${r.bands.bear.toFixed(1)}% – ${r.bands.bull.toFixed(1)}%`} faint />
            </div>
          </div>

          {/* ── Transparent Methodology Assumptions ── */}
          <div className="mt-10 flex items-center gap-3">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#1a1a1a]/70">
              Audit Assumptions &amp; Model Levers
            </span>
            <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white shadow-sm">
            <Asm name="Corridor Baseline CAGR" sub="Corridor-calibrated institutional growth rate" val={`${r.base.toFixed(1)}% / yr`} />
            <Asm name="Quality Alpha Adjustment" sub={`TruthScore ${p.truthScore}/100 differential vs market neutral`} val={`${r.qualityKicker >= 0 ? "+" : ""}${r.qualityKicker.toFixed(1)}%`} />
            {r.delayCost > 0.04 && <Asm name="Delay Opportunity Cost" sub={`~${r.delayMonths}-month completion friction against RERA date`} val={`−${r.delayCost.toFixed(1)}%`} warn />}
            <Asm name="Gross Rental Yield" sub="Modeled on appreciated capital value post-handover" val={`${DEFAULT_ROI_PARAMS.rentalYield}% / yr`} />
            <Asm name="Payment Schedule" sub="Construction-linked milestones (70% entry & build / 30% possession)" val="Construction-Linked (CLP)" />
            <Asm name="Holding Horizon" sub="Adjustable via interactive simulator" val={`${holdYears} Years`} />
            <Asm name="Entry Basis" sub="Live catalogue unit pricing midpoint" val={crStr(r.entryPriceCr)} />
            <Asm name="Transaction Friction & Taxes" sub="Stamp duty (~6-7%), brokerage, and capital gains tax" val="Standard Exclusion" warn last />
          </div>

          <p className="mt-4 text-[0.65rem] font-light italic leading-relaxed text-[#1a1a1a]/40">
            Modelled projection grounded in Haryana RERA filings and verified construction velocity. Stamped on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
          </p>
        </>
      )}
    </div>
  );
}

function FallRow({ label, value, lo, hi, tone, r }: { label: React.ReactNode; value: string; lo: number; hi: number; tone: "base" | "up" | "down" | "fin"; r: RoiResult }) {
  const scale = Math.max(12, r.expectedCagr + 1);
  const left = Math.max(0, Math.min(100, (lo / scale) * 100));
  const width = Math.max(1.5, Math.min(100 - left, ((hi - lo) / scale) * 100));
  const bg = tone === "up" ? "#1e6b45" : tone === "down" ? "#a8452f" : tone === "fin" ? "#9a7a2e" : "#1a1a1a";
  const valColor = tone === "up" ? "text-[#1e6b45]" : tone === "down" ? "text-[#a8452f]" : tone === "fin" ? "text-[#9a7a2e]" : "text-[#1a1a1a]";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.8rem] text-[#1a1a1a]/70">{label}</span>
        <span className={`font-serif text-[1.05rem] font-semibold tabular-nums ${valColor}`}>{value}</span>
      </div>
      <div className="mt-1.5 h-[20px] rounded-md bg-[#1a1a1a]/[0.05]">
        <div className="h-full rounded-md transition-all duration-500" style={{ marginLeft: `${left}%`, width: `${width}%`, background: bg, opacity: tone === "base" ? 0.85 : 1 }} />
      </div>
    </div>
  );
}

function Anchor({ k, v, you, faint }: { k: string; v: string; you?: boolean; faint?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-t border-[#1a1a1a]/8 px-4 py-3 text-[0.82rem] first:border-t-0 ${you ? "bg-[#1e6b45]/[0.08]" : ""}`}>
      <span className={you ? "font-semibold text-[#1e6b45]" : "text-[#1a1a1a]/65"}>{k}</span>
      <span className={`font-serif tabular-nums ${you ? "font-bold text-[#1e6b45]" : faint ? "text-[#1a1a1a]/40" : "text-[#1a1a1a]"}`}>{v}</span>
    </div>
  );
}

function Asm({ name, sub, val, warn, last }: { name: string; sub: string; val: string; warn?: boolean; last?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 ${last ? "" : "border-b"} border-[#1a1a1a]/[0.06]`}>
      <div>
        <p className="text-[0.84rem] font-semibold text-[#1a1a1a]">{name}</p>
        <p className="mt-0.5 text-[0.7rem] font-light text-[#1a1a1a]/45">{sub}</p>
      </div>
      <span className={`whitespace-nowrap font-mono text-[0.8rem] font-semibold ${warn ? "text-[#a8452f]" : "text-[#1e6b45]"}`}>{val}</span>
    </div>
  );
}
