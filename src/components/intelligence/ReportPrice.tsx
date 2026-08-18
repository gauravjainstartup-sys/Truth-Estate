"use client";

import { useEffect, useMemo, useState } from "react";
import { priceJourney, roiModel, fmtPsf, lastUpdatedOn, type ProjectIntel } from "@/lib/projects";
import { hasReadAccess, packageById } from "@/lib/journey";
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

export default function ReportPrice({ p, sample = false, unlocked: unlockedProp, onUnlock }: { p: ProjectIntel; sample?: boolean; unlocked?: boolean; onUnlock?: () => void }) {
  const journey = priceJourney(p);
  const roi = roiModel(p);
  /* Frozen sample / static export: the interactive detail is dropped; the
     record + the headline number read fine static. */
  const isStatic = useReportStatic();
  // The projection is part of the paid read — any read entitlement unlocks it.
  // When the parent report already knows the reader is unlocked — a real read
  // entitlement OR the staging demo-unlock — it passes `unlocked` and we defer
  // to it, so the ROI is never shown locked INSIDE an otherwise-unlocked report
  // (the report body only renders when unlocked in the first place). Falls back
  // to the direct entitlement check for any caller that doesn't pass it.
  const [selfUnlocked] = useState(() => sample || (typeof window !== "undefined" ? hasReadAccess(p.slug) : false));
  const unlocked = unlockedProp ?? selfUnlocked;

  const [holdYears, setHoldYears] = useState(8);
  // `today` starts undefined so SSR and the first client render agree; the
  // effect fills it in after mount. Only asOf-DEPENDENT outputs (XIRR, rent,
  // years-to-possession) are gated on it — the CAGRs don't move with the date,
  // so they render immediately and identically on server + client.
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
      ? "A medium hold — a few years of rent start to matter while the capital gain compounds."
      : holdYears >= 10
        ? "The rental-compounding hold — the most total rupees and the steadiest ride; IRR dips a touch."
        : "The balanced default — capital growth plus several years of rent once the flat is ready.";

  if (!journey && !roi) return null;

  return (
    <div className="mt-8">
      {/* ── a · the record ── */}
      {journey && (
        <>
          <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Price Dynamics · a — the record</p>
          <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">The price, since launch</h3>
          <p className="mt-2 text-[0.72rem] font-light italic text-[#1a1a1a]/40">Updated {lastUpdatedOn(p)}</p>

          <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/60 lg:grid-cols-3">
            <PStat v={fmtPsf(journey.launchPsf)} sub="/sqft" k={`Launch · ${journey.launchDate}`} />
            <PStat v={psfRange(journey.currentLow, journey.currentHigh)} k="Current range · today" />
            <PStat v={`+${journey.premiumPct}%`} k={`Premium to date · over ${sinceLaunch(journey.years)}`} accent className="col-span-2 lg:col-span-1" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-gradient-to-b from-white to-[#faf4ea] p-5">
              <div className="relative">
                <svg viewBox="0 0 1000 286" className="block w-full" role="img" aria-label="Price per sq ft since launch, with the projected range ahead">
                  <defs>
                    <linearGradient id="parea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(138,106,30,.34)" /><stop offset="1" stopColor="rgba(138,106,30,0)" /></linearGradient>
                    <linearGradient id="pcone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(30,107,69,.28)" /><stop offset="1" stopColor="rgba(30,107,69,.05)" /></linearGradient>
                  </defs>
                  <g stroke="rgba(26,26,26,.12)" strokeWidth="1"><line x1="40" y1="70" x2="960" y2="70" /><line x1="40" y1="140" x2="960" y2="140" /><line x1="40" y1="210" x2="960" y2="210" /><line x1="40" y1="280" x2="960" y2="280" /></g>
                  <path d="M40,255 L200,238 L310,215 L420,192 L420,280 L40,280 Z" fill="url(#parea)" />
                  <path d="M420,192 L940,52 L940,150 Z" fill="url(#pcone)" />
                  <path d="M40,255 L200,238 L310,215 L420,192" fill="none" stroke="#8a6a1e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M420,192 L940,96" fill="none" stroke="#1e6b45" strokeWidth="3" strokeDasharray="8 5" strokeLinecap="round" />
                  <line x1="420" y1="34" x2="420" y2="280" stroke="#8a6a1e" strokeWidth="1.4" strokeDasharray="3 4" opacity=".8" />
                  <circle cx="40" cy="255" r="5.5" fill="#8a6a1e" /><circle cx="420" cy="192" r="7" fill="#fff" stroke="#8a6a1e" strokeWidth="3.5" />
                </svg>
                <span className="absolute bottom-[13%] left-[6.5%] whitespace-nowrap rounded-full border border-[#8a6a1e]/25 bg-white/85 px-2 py-0.5 text-[0.64rem] font-medium tabular-nums text-[#1a1a1a]/75 backdrop-blur-[2px]">
                  Launch {fmtPsf(journey.launchPsf)}
                </span>
                <span className="absolute bottom-[48%] right-[58.8%] whitespace-nowrap rounded-full border border-[#1a1a1a]/10 bg-white/95 px-2.5 py-1 text-[0.68rem] font-semibold tabular-nums text-[#1a1a1a] shadow-sm backdrop-blur-[2px] sm:bottom-[38%]">
                  Today {psfRange(journey.currentLow, journey.currentHigh)}
                </span>
              </div>
              <div className="relative mt-2 h-4 font-mono text-[0.62rem] tracking-[0.04em] text-[#1a1a1a]/45">
                <span className="absolute left-[4%]">{journey.launchDate.split(" ")[1]}</span>
                <span className="absolute left-[42%] -translate-x-1/2">now</span>
                <span className="absolute right-[4%]">+5 yrs</span>
              </div>
            </div>

            {/* ── b · the return on your cash — XIRR (paid) / outlook teaser (free) ── */}
            <div className="flex flex-col justify-center gap-3 rounded-2xl border border-[#1e6b45]/25 bg-[#FBF8F2] p-6">
              {unlocked ? (
                <>
                  <div>
                    <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[#1e6b45]">
                      Return on your cash flow{showingXirr ? " · XIRR" : ""}
                    </p>
                    <p className="mt-1 font-serif text-[3rem] font-medium leading-none tracking-[-0.02em] tabular-nums text-[#1e6b45]">
                      {cashReturn.toFixed(1)}<span className="text-[0.9rem] font-normal text-[#1a1a1a]/40"> % / yr</span>
                    </p>
                    <p className="mt-2 text-[0.68rem] font-light leading-[1.5] text-[#1a1a1a]/55">
                      {showingXirr
                        ? <>The number to trust — modeled, not a promise. Higher than the {r.riskAdjustedCagr.toFixed(1)}% price growth: you pay in stages and it earns rent.</>
                        : <>The realistic annual return, after the delay — modeled, not a promise.</>}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <MiniStat k="Price growth" v={`${r.riskAdjustedCagr.toFixed(1)}%`} />
                    <MiniStat k="Rental yield" v={`${DEFAULT_ROI_PARAMS.rentalYield}%`} gold />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-[1.3rem]" aria-hidden>🔒</span>
                  <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">5-year growth outlook</p>
                  <span className="inline-flex overflow-hidden rounded-full border border-[#1a1a1a]/10 bg-white">
                    {(["Low", "Medium", "High"] as const).map((o) => (
                      <span key={o} className={`px-3.5 py-1.5 text-[0.72rem] ${o === outlook ? "bg-[#1e6b45] font-bold text-white" : "text-[#1a1a1a]/35"}`}>{o}</span>
                    ))}
                  </span>
                  <p className="text-[0.68rem] font-light leading-[1.5] text-[#1a1a1a]/45">The return on your cash flow (XIRR), the capital-vs-rent split, and when to exit are all inside.</p>
                  {/* "Unlock the projection" opens the READ unlock (the paywall,
                      or the staging demo-unlock) — NOT the 3D advisor, which is
                      what the old openUnitIntel handler did. */}
                  <button onClick={onUnlock ?? openUnitIntel} className="mt-1 rounded-lg bg-[#1e6b45] px-4 py-2 text-[0.74rem] font-semibold text-white transition-colors hover:bg-[#238c55]">Unlock the projection →</button>
                  <p className="text-[0.56rem] text-[#1a1a1a]/35">Free with membership · or ₹{packageById("read").inr.toLocaleString("en-IN")} this project</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── the paid, interactive model (dropped in the frozen sample) ── */}
      {unlocked && !isStatic && (
        <>
          {/* ── the return, and when to take it — bifurcation + exit, clubbed ── */}
          <div className="mt-10 flex items-center gap-3">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">If you enter today, when do you exit?</span>
            <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>
          <div className="mt-4 rounded-2xl border border-[#1a1a1a]/10 bg-white/70 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="max-w-[34rem] text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/60">
                Two engines, not one: the price rising, and rent once it&apos;s ready. Pick a hold — the return, the money and the split all move with it{today ? ` — on a ${crStr(r.entryPriceCr)} entry` : ""}.
              </p>
              <div className="w-[220px] shrink-0"><Seg options={["5 yr", "8 yr", "10 yr"]} active={[5, 8, 10].indexOf(holdYears) < 0 ? 1 : [5, 8, 10].indexOf(holdYears)} onPick={(i) => setHoldYears([5, 8, 10][i])} /></div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <div>
                <p className="text-[0.56rem] font-medium uppercase tracking-[0.14em] text-[#1e6b45]">Hold {holdYears} yr · {showingXirr ? "XIRR" : "return"}</p>
                <p className="mt-1 font-serif text-[3.2rem] font-medium leading-none tracking-[-0.02em] tabular-nums text-[#1e6b45]">{cashReturn.toFixed(1)}<span className="text-[0.85rem] font-normal text-[#1a1a1a]/40"> % / yr</span></p>
              </div>
              {today && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <BoxStat k="Exit value" v={crStr(r.exitValueCr)} />
                  <BoxStat k="Capital gain" v={crStr(r.capitalGainCr)} tone="green" />
                  <BoxStat k="Rent collected" v={crStr(r.rentCollectedCr)} tone="gold" />
                  <BoxStat k="Total profit" v={crStr(totalProfit)} />
                </div>
              )}
            </div>

            {today && totalProfit > 0 && (
              <>
                <div className="mt-4 flex h-9 overflow-hidden rounded-md border border-[#1a1a1a]/8">
                  <div className="flex items-center bg-[#1e6b45] px-2.5 text-[0.68rem] font-semibold text-white transition-[width] duration-500" style={{ width: `${capPct}%` }}>Capital {capPct}%</div>
                  <div className="flex items-center bg-[#9a7a2e] px-2.5 text-[0.68rem] font-semibold text-white transition-[width] duration-500" style={{ width: `${rentPct}%` }}>Rent {rentPct}%</div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[0.72rem] font-light text-[#1a1a1a]/50">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#1e6b45]" />Capital appreciation — the resale gain</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#9a7a2e]" />Rental income — collected while held</span>
                </div>
              </>
            )}

            <p className="mt-4 border-t border-[#1a1a1a]/8 pt-4 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/65">{exitNote}</p>

            {opt && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#9a7a2e]/22 bg-[#9a7a2e]/[0.08] px-4 py-3.5">
                <span className="shrink-0 font-serif text-[1.35rem] font-semibold leading-none text-[#8a6a1e]">~{opt.riskAdjustedXirr.toFixed(0)}%</span>
                <span className="text-[0.76rem] font-light leading-[1.55] text-[#1a1a1a]/70">
                  <b className="font-semibold text-[#1a1a1a]">IRR actually peaks around possession (~{opt.years.toFixed(1)} yr) — the flip.</b> Rent trails price growth, so holding longer trades peak IRR for more total rupees and a steadier ride. Flipping is the highest-IRR play, and the highest-risk — it leans entirely on the completion re-rating.
                </span>
              </div>
            )}
          </div>

          {/* ── e · the price-growth engine that feeds the XIRR ── */}
          <div className="mt-10 flex items-center gap-3">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">The price-growth engine behind that return</span>
            <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>
          <div className="mt-4 rounded-2xl border border-[#1a1a1a]/10 bg-white/70 p-6">
            <p className="mb-5 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/60">
              Your return starts with how fast the price itself grows. That price CAGR — <b className="font-semibold text-[#1a1a1a]">{r.riskAdjustedCagr.toFixed(1)}%/yr</b>, the market rate lifted for quality and docked for the delay — is only half the story; staged payments and rent lift it to the <b className="font-semibold text-[#1e6b45]">{cashReturn.toFixed(1)}% {showingXirr ? "XIRR" : "return"}</b> above.
            </p>
            <div className="flex flex-col gap-3">
              <FallRow label={<><b className="font-semibold text-[#1a1a1a]">Gurgaon market</b> — India {DEFAULT_ROI_PARAMS.indiaCagr}% + Gurgaon {DEFAULT_ROI_PARAMS.gurgaonAdd}%</>} value={`${r.base.toFixed(1)}%`} lo={0} hi={r.base} tone="base" r={r} />
              <FallRow label={<><b className="font-semibold text-[#1a1a1a]">+ This project&apos;s quality</b> — Truth Score {p.truthScore}/100</>} value={`${r.qualityKicker >= 0 ? "+" : ""}${r.qualityKicker.toFixed(1)}%`} lo={Math.min(r.base, r.base + r.qualityKicker)} hi={Math.max(r.base, r.base + r.qualityKicker)} tone={r.qualityKicker >= 0 ? "up" : "down"} r={r} />
              {r.delayCost > 0.04 && (
                <FallRow label={<><b className="font-semibold text-[#1a1a1a]">− Predicted delay</b> — ~{r.delayMonths} months late to possession</>} value={`−${r.delayCost.toFixed(1)}%`} lo={r.riskAdjustedCagr} hi={r.expectedCagr} tone="down" r={r} />
              )}
              <div className="mt-1 border-t border-dashed border-[#1a1a1a]/15 pt-3">
                <FallRow label={<b className="font-semibold text-[#1a1a1a]">= Risk-adjusted price CAGR</b>} value={`${r.riskAdjustedCagr.toFixed(1)}%`} lo={0} hi={Math.max(0, r.riskAdjustedCagr)} tone="fin" r={r} />
              </div>
            </div>

            {/* anchors */}
            <div className="mt-6 overflow-hidden rounded-xl border border-[#1a1a1a]/10">
              <Anchor k="A fixed deposit, roughly" v="7.0%" />
              <Anchor k="Gurgaon's overall average" v={`${r.base.toFixed(1)}%`} />
              <Anchor k="This project — realistically" v={`${r.riskAdjustedCagr.toFixed(1)}%`} you />
              <Anchor k="Range if the market runs cold → hot" v={`${r.bands.bear.toFixed(1)}% – ${r.bands.bull.toFixed(1)}%`} faint />
            </div>
            {r.corridorCagr != null && (
              <p className="mt-3 text-[0.66rem] font-light italic text-[#1a1a1a]/40">Corridor context: this micro-market has run ~{r.corridorCagr.toFixed(0)}%/yr — shown beside the number, deliberately not folded into the base to keep the headline conservative.</p>
            )}
          </div>

          {/* ── f · the assumptions — every lever on the table ── */}
          <div className="mt-10 flex items-center gap-3">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">What we assumed to get here</span>
            <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/70">
            <Asm name="India base CAGR" sub="National residential — the macro floor" val={`${DEFAULT_ROI_PARAMS.indiaCagr.toFixed(1)}% / yr`} />
            <Asm name="Gurgaon premium" sub="City's add over the national rate" val={`+${DEFAULT_ROI_PARAMS.gurgaonAdd}%`} />
            <Asm name="Quality kicker" sub={`From Truth Score ${p.truthScore} (0.1 pt per point above ${DEFAULT_ROI_PARAMS.scoreNeutral}, ±${DEFAULT_ROI_PARAMS.scoreCap} cap)`} val={`${r.qualityKicker >= 0 ? "+" : ""}${r.qualityKicker.toFixed(1)}%`} />
            {r.delayCost > 0.04 && <Asm name="Predicted-delay drag" sub={`~${r.delayMonths}-month slip vs RERA date, as opportunity cost`} val={`−${r.delayCost.toFixed(1)}%`} warn />}
            <Asm name="Rental yield" sub="On the then-value, post-possession only" val={`${DEFAULT_ROI_PARAMS.rentalYield}% / yr`} />
            <Asm name="Payment plan" sub="Capital paid in stages to possession, not upfront" val="Construction-linked" />
            <Asm name="Holding horizon" sub="Adjustable — see &quot;when to exit&quot; above" val={`${holdYears} yr`} />
            <Asm name="Entry basis" sub="Project ticket midpoint" val={crStr(r.entryPriceCr)} />
            <Asm name="Exit costs & taxes" sub="Stamp duty, brokerage, LTCG" val="Not yet modeled" warn last />
          </div>

          <p className="mt-4 text-[0.62rem] font-light italic text-[#1a1a1a]/35">
            Modeled, not a promise{today ? `, recalculated for ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}. The model&apos;s structure is agreed; the magnitudes are uncalibrated placeholders pending a backtest against realised appreciation. It models the property&apos;s price return and rent only — registration &amp; stamp duty (~6–7%), interiors, and ongoing maintenance &amp; property tax are not yet included. XIRR is the annualised return on the actual cash flows: staged construction outflow, rent once ready, sale at exit.
          </p>
        </>
      )}
    </div>
  );
}

/* one row of the return waterfall — a labelled floating bar on a 0..scale track */
function FallRow({ label, value, lo, hi, tone, r }: { label: React.ReactNode; value: string; lo: number; hi: number; tone: "base" | "up" | "down" | "fin"; r: RoiResult }) {
  const scale = Math.max(12, r.expectedCagr + 1);
  const left = Math.max(0, Math.min(100, (lo / scale) * 100));
  const width = Math.max(1.5, Math.min(100 - left, ((hi - lo) / scale) * 100));
  const bg = tone === "up" ? "#1e6b45" : tone === "down" ? "#a8452f" : tone === "fin" ? "#9a7a2e" : "#1a1a1a";
  const valColor = tone === "up" ? "text-[#1e6b45]" : tone === "down" ? "text-[#a8452f]" : tone === "fin" ? "text-[#9a7a2e]" : "text-[#1a1a1a]";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.8rem] text-[#1a1a1a]/60">{label}</span>
        <span className={`font-serif text-[1rem] tabular-nums ${valColor}`}>{value}</span>
      </div>
      <div className="mt-1.5 h-[22px] rounded-md" style={{ background: "rgba(26,26,26,.05)" }}>
        <div className="h-full rounded-md" style={{ marginLeft: `${left}%`, width: `${width}%`, background: bg, opacity: tone === "base" ? 0.82 : 1 }} />
      </div>
    </div>
  );
}

function Anchor({ k, v, you, faint }: { k: string; v: string; you?: boolean; faint?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-t border-[#1a1a1a]/8 px-4 py-3 text-[0.85rem] first:border-t-0 ${you ? "bg-[#9a7a2e]/[0.08]" : ""}`}>
      <span className={you ? "font-semibold text-[#1a1a1a]" : "text-[#1a1a1a]/60"}>{k}</span>
      <span className={`font-serif tabular-nums ${you ? "font-semibold text-[#9a7a2e]" : faint ? "text-[#1a1a1a]/40" : "text-[#1a1a1a]"}`}>{v}</span>
    </div>
  );
}

/* a boxed stat beside the exit XIRR */
function BoxStat({ k, v, tone }: { k: string; v: string; tone?: "green" | "gold" }) {
  const c = tone === "green" ? "text-[#1e6b45]" : tone === "gold" ? "text-[#8a6a1e]" : "text-[#1a1a1a]";
  return (
    <div className="rounded-xl border border-[#1a1a1a]/10 bg-[#FBF8F2] p-3">
      <p className="text-[0.52rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">{k}</p>
      <p className={`mt-1 font-serif text-[1.15rem] font-medium tabular-nums ${c}`}>{v}</p>
    </div>
  );
}

/* small paired stat in the XIRR hero panel */
function MiniStat({ k, v, gold }: { k: string; v: string; gold?: boolean }) {
  return (
    <div className="rounded-xl border border-[#1a1a1a]/8 bg-white/70 p-3">
      <p className="text-[0.5rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">{k}</p>
      <p className={`mt-0.5 font-serif text-[1.3rem] font-medium leading-none tabular-nums ${gold ? "text-[#8a6a1e]" : "text-[#1a1a1a]"}`}>{v}<span className="text-[0.6rem] font-normal text-[#1a1a1a]/35"> / yr</span></p>
    </div>
  );
}

/* one assumption row */
function Asm({ name, sub, val, warn, last }: { name: string; sub: string; val: string; warn?: boolean; last?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] items-start gap-3 px-5 py-3.5 ${last ? "" : "border-b"} border-[#1a1a1a]/[0.06]`}>
      <div>
        <p className="text-[0.86rem] font-semibold text-[#1a1a1a]">{name}</p>
        <p className="mt-0.5 text-[0.72rem] font-light text-[#1a1a1a]/40">{sub}</p>
      </div>
      <span className={`whitespace-nowrap font-mono text-[0.8rem] font-semibold ${warn ? "text-[#a8452f]" : "text-[#1e6b45]"}`}>{val}</span>
    </div>
  );
}

function PStat({ v, sub, k, accent, className = "" }: { v: string; sub?: string; k: string; accent?: boolean; className?: string }) {
  if (accent) {
    return (
      <div className={`flex items-center gap-4 border-b border-r border-[#1a1a1a]/[0.06] bg-gradient-to-r from-[#1e6b45]/[0.07] to-transparent p-5 ${className}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e6b45]/10 text-[#1e6b45]" aria-hidden>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>
        </span>
        <div>
          <p className="text-[1.6rem] font-normal leading-[1.18] tracking-[-0.02em] tabular-nums text-[#1e6b45] md:text-[1.8rem]">{v}</p>
          <p className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">{k}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`border-b border-r border-[#1a1a1a]/[0.06] p-5 ${className}`}>
      <p className="text-[1.45rem] font-normal leading-[1.18] tracking-[-0.02em] tabular-nums text-[#1a1a1a] md:text-[1.6rem]">{v}{sub && <span className="text-[0.8rem] font-light text-[#1a1a1a]/35">{sub}</span>}</p>
      <p className="mt-2 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">{k}</p>
    </div>
  );
}

function Seg({ options, active, onPick }: { options: readonly string[]; active: number; onPick: (i: number) => void }) {
  return (
    <div className="flex rounded-lg bg-[#efeae0] p-[3px]">
      {options.map((o, i) => (
        <button key={o} onClick={() => onPick(i)}
          className={`flex-1 whitespace-nowrap rounded-md px-2 py-2 text-[0.74rem] transition-colors ${i === active ? "bg-white font-semibold text-[#1a1a1a] shadow-sm" : "text-[#8b8378]"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
