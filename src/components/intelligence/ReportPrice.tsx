"use client";

import { useEffect, useMemo, useState } from "react";
import { priceJourney, roiModel, fmtPsf, lastUpdatedOn, type ProjectIntel } from "@/lib/projects";
import { hasReadAccess, packageById } from "@/lib/journey";
import { openUnitIntel } from "./TowerIntel";
import { useReportStatic } from "./reportStatic";
import { computeRoi, DEFAULT_ROI_PARAMS, type RoiResult } from "@/lib/analytics/roiEngine";

/* Chapter III — "Will it make money?"
   a · The price since launch (PSF journey + what moved it)
   b · Expected vs Risk-Adjusted return — the two numbers, gated to the paid read
   c · The waterfall — how the number is built (market → quality → delay), plus
       the return on your cash (XIRR) and the plain-language rationale.
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

export default function ReportPrice({ p, sample = false }: { p: ProjectIntel; sample?: boolean }) {
  const journey = priceJourney(p);
  const roi = roiModel(p);
  /* Frozen sample / static export: the interactive detail is dropped; the
     record + the two headline numbers read fine static. */
  const isStatic = useReportStatic();
  // The projection is part of the paid read — any read entitlement unlocks it.
  const [unlocked] = useState(() => sample || (typeof window !== "undefined" ? hasReadAccess(p.slug) : false));

  const [holdYears, setHoldYears] = useState(8);
  // `today` starts undefined so SSR and the first client render agree; the
  // effect fills it in after mount. Only asOf-DEPENDENT outputs (XIRR, years to
  // possession) are gated on it — the CAGRs don't move with the date, so they
  // render immediately and identically on server + client (no hydration drift).
  const [today, setToday] = useState<Date | undefined>(undefined);
  useEffect(() => setToday(new Date()), []);

  const r: RoiResult = useMemo(() => computeRoi(roiInputFor(p, holdYears, today)), [p, holdYears, today]);
  const outlook: "Low" | "Medium" | "High" = r.expectedCagr >= 11 ? "High" : r.expectedCagr >= 9 ? "Medium" : "Low";
  // "Perfect time to exit": under a construction-linked buy the annualised
  // return (XIRR) is sharpest around possession — you stop paying in and realise
  // the appreciation, and post-possession rent (2.5%) trails the price CAGR, so a
  // longer hold trades XIRR for absolute gain + yield. We surface the possession
  // window as that inflection, not a spurious single "optimal year".
  const exitLabel = p.ops?.construction?.predictedDate ?? (today ? `~${r.yearsToPossession.toFixed(1)} yrs out` : "at possession");

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
            <PStat v={`${fmtPsf(journey.currentLow)}–${(journey.currentHigh / 1000).toFixed(1)}k`} k="Current range · today" />
            <PStat v={`+${journey.premiumPct}%`} k="Premium to date" accent className="col-span-2 lg:col-span-1" />
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
                  Today {fmtPsf(journey.currentLow)}–{(journey.currentHigh / 1000).toFixed(1)}k
                </span>
              </div>
              <div className="relative mt-2 h-4 font-mono text-[0.62rem] tracking-[0.04em] text-[#1a1a1a]/45">
                <span className="absolute left-[4%]">{journey.launchDate.split(" ")[1]}</span>
                <span className="absolute left-[42%] -translate-x-1/2">now</span>
                <span className="absolute right-[4%]">+5 yrs</span>
              </div>
            </div>

            {/* ── b · the two numbers (paid) / the outlook teaser (free) ── */}
            <div className="flex flex-col justify-center gap-3 rounded-2xl border border-[#9a7a2e]/25 bg-[#FBF8F2] p-6">
              {unlocked ? (
                <>
                  <div>
                    <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/45">If it all goes to plan</p>
                    <p className="mt-1 text-[2rem] font-normal leading-none tracking-[-0.02em] tabular-nums text-[#1a1a1a]">{r.expectedCagr.toFixed(1)}<span className="text-[0.85rem] text-[#1a1a1a]/40">% / yr</span></p>
                  </div>
                  <div className="rounded-xl border border-[#9a7a2e]/35 bg-white/70 p-4">
                    <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[#9a7a2e]">Realistically — after its delay</p>
                    <p className="mt-1 text-[2.3rem] font-normal leading-none tracking-[-0.02em] tabular-nums text-[#9a7a2e]">{r.riskAdjustedCagr.toFixed(1)}<span className="text-[0.85rem] text-[#1a1a1a]/40">% / yr</span></p>
                    <p className="mt-1.5 text-[0.68rem] font-light text-[#1a1a1a]/50">The number to trust — modeled, not a promise.</p>
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
                  <p className="text-[0.68rem] font-light leading-[1.5] text-[#1a1a1a]/45">The exact expected &amp; risk-adjusted CAGR, the delay it costs you, and the return on your cash are inside.</p>
                  <button onClick={openUnitIntel} className="mt-1 rounded-lg bg-[#1e6b45] px-4 py-2 text-[0.74rem] font-semibold text-white transition-colors hover:bg-[#238c55]">Unlock the projection →</button>
                  <p className="text-[0.56rem] text-[#1a1a1a]/35">Free with membership · or ₹{packageById("read").inr.toLocaleString("en-IN")} this project</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── c · the waterfall + the cash return (paid; dropped in the frozen sample) ── */}
      {unlocked && !isStatic && (
        <>
          <div className="mt-10 flex items-center gap-3">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">Model your money — how we get to {r.riskAdjustedCagr.toFixed(1)}%</span>
            <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>

          <div className="mt-4 rounded-2xl border border-[#1a1a1a]/10 bg-white/70 p-6">
            {/* holding period */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#1a1a1a]/45">Holding period</span>
              <div className="w-[220px]"><Seg options={["5 yr", "8 yr", "10 yr"]} active={[5, 8, 10].indexOf(holdYears)} onPick={(i) => setHoldYears([5, 8, 10][i])} /></div>
            </div>

            {/* the waterfall */}
            <div className="mt-6 flex flex-col gap-3">
              <FallRow label={<><b className="font-semibold text-[#1a1a1a]">Gurgaon market</b> — India {DEFAULT_ROI_PARAMS.indiaCagr}% + Gurgaon {DEFAULT_ROI_PARAMS.gurgaonAdd}%</>} value={`${r.base.toFixed(1)}%`} lo={0} hi={r.base} tone="base" r={r} />
              <FallRow label={<><b className="font-semibold text-[#1a1a1a]">+ This project&apos;s quality</b> — Truth Score {p.truthScore}/100</>} value={`${r.qualityKicker >= 0 ? "+" : ""}${r.qualityKicker.toFixed(1)}%`} lo={Math.min(r.base, r.base + r.qualityKicker)} hi={Math.max(r.base, r.base + r.qualityKicker)} tone={r.qualityKicker >= 0 ? "up" : "down"} r={r} />
              {r.delayCost > 0.04 && (
                <FallRow label={<><b className="font-semibold text-[#1a1a1a]">− Predicted delay</b> — ~{r.delayMonths} months late to possession</>} value={`−${r.delayCost.toFixed(1)}%`} lo={r.riskAdjustedCagr} hi={r.expectedCagr} tone="down" r={r} />
              )}
              <div className="mt-1 border-t border-dashed border-[#1a1a1a]/15 pt-3">
                <FallRow label={<b className="font-semibold text-[#1a1a1a]">= Your realistic return</b>} value={`${r.riskAdjustedCagr.toFixed(1)}%`} lo={0} hi={Math.max(0, r.riskAdjustedCagr)} tone="fin" r={r} />
              </div>
            </div>

            {/* plain-language callouts */}
            <div className="mt-6 flex flex-col gap-3">
              {today && r.delayMonths > 0 && (
                <p className="rounded-r-lg border-l-2 border-[#a8452f] bg-[#a8452f]/[0.06] px-4 py-3 text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/70">
                  <b className="font-semibold text-[#1a1a1a]">Possession {p.ops?.construction?.predictedDate ? `expected ${p.ops.construction.predictedDate}` : `~${r.yearsToPossession.toFixed(1)} yrs out`}</b>, and our model predicts it running ~{r.delayMonths} months late. Every idle month is a month your capital isn&apos;t working — that&apos;s the {r.delayCost.toFixed(1)}% we take off.
                </p>
              )}
              {today && r.riskAdjustedXirr != null && (
                <p className="rounded-r-lg border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.06] px-4 py-3 text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/70">
                  <b className="font-semibold text-[#1a1a1a]">Your cash works harder than the price grows.</b> You pay in instalments as it&apos;s built and earn ~{DEFAULT_ROI_PARAMS.rentalYield}% rent once it&apos;s ready, so your real return on the money you deploy (XIRR) is about <b className="font-semibold text-[#1e6b45]">{r.riskAdjustedXirr.toFixed(1)}% / yr</b>.
                </p>
              )}
            </div>

            {/* rental yield + when-to-exit — the two things buyers ask after the headline */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#1a1a1a]/10 bg-[#FBF8F2] p-4">
                <p className="text-[0.56rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/45">Rental yield · once ready</p>
                <p className="mt-1 font-serif text-[1.7rem] leading-none tabular-nums text-[#1a1a1a]">~{DEFAULT_ROI_PARAMS.rentalYield}<span className="text-[0.8rem] text-[#1a1a1a]/40">% / yr</span></p>
                <p className="mt-1.5 text-[0.72rem] font-light leading-[1.5] text-[#1a1a1a]/55">On the finished flat&apos;s value{today && r.rentableYears > 0.4 ? ` — about ${r.rentableYears.toFixed(0)} rentable ${r.rentableYears < 1.5 ? "year" : "years"} in this ${holdYears}-yr hold` : ", once it's handed over"}. Already folded into the XIRR above.</p>
              </div>
              <div className="rounded-xl border border-[#1a1a1a]/10 bg-[#FBF8F2] p-4">
                <p className="text-[0.56rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/45">Sharpest exit · peak XIRR</p>
                <p className="mt-1 font-serif text-[1.7rem] leading-none text-[#1a1a1a]">{exitLabel}</p>
                <p className="mt-1.5 text-[0.72rem] font-light leading-[1.5] text-[#1a1a1a]/55">Your annualised return peaks around possession. Hold beyond it to keep compounding and earn rent — more total gain, a little less per year.</p>
              </div>
            </div>

            {/* anchors */}
            <div className="mt-5 overflow-hidden rounded-xl border border-[#1a1a1a]/10">
              <Anchor k="A fixed deposit, roughly" v="7.0%" />
              <Anchor k="Gurgaon's overall average" v={`${r.base.toFixed(1)}%`} />
              <Anchor k="This project — realistically" v={`${r.riskAdjustedCagr.toFixed(1)}%`} you />
              <Anchor k="Range if the market runs cold → hot" v={`${r.bands.bear.toFixed(1)}% – ${r.bands.bull.toFixed(1)}%`} faint />
            </div>

            <p className="mt-4 text-[0.62rem] font-light italic text-[#1a1a1a]/35">A modeled estimate, not a promise{today ? `, recalculated for ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""} — the delay and rentable window shift as the date moves. It models the property&apos;s price return only: registration &amp; stamp duty (~6–7%), interiors &amp; furnishing, and ongoing maintenance &amp; property tax are not included.</p>
          </div>
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
