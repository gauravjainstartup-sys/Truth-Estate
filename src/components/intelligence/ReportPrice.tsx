"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { priceJourney, roiModel, fmtPsf, lastUpdatedOn, type ProjectIntel } from "@/lib/projects";
import { hasReadAccess, packageById } from "@/lib/journey";
import { openUnitIntel } from "./TowerIntel";
import { useReportStatic } from "./reportStatic";
import { computeRoi, optimalExit, DEFAULT_ROI_PARAMS, type RoiResult } from "@/lib/analytics/roiEngine";
import { configPriceCr, type BhkBucket } from "@/lib/matchEngine";

/* Chapter III — "Will it make money?" (founder-approved redesign, mock v2)
   a · The price, since launch — the record: three stats + past→projection
   b · If you enter today — the answer FIRST: the in→out sentence, the XIRR
       hero, and the controls (hold + unit) that rewrite it live
   c · Where the money moves — the CLP as a cashflow timeline + dated ledger
   d · Exit year by year — the XIRR curve + table; every year is a hold
   e · The price-growth engine — waterfall + the anchor scale
   f · The assumptions — every lever on the table
   Content and engine identical to the pre-redesign chapter; only the
   communication changed. Powered by src/lib/analytics/roiEngine. */

/** Build the roiEngine inputs from a project. CAGRs are price-independent; the
 *  ticket only shapes the XIRR cash-flow, so a missing budget is harmless. */
function roiInputFor(p: ProjectIntel, holdYears: number, asOf: Date | undefined, entryCrOverride?: number) {
  const con = p.ops?.construction;
  return {
    /* the chosen config's filed price when the reader picked one; the blended
       ticket otherwise — the ₹ outputs scale with it, the rates do not */
    entryPriceCr: entryCrOverride ?? Math.max(0.5, (p.budget[0] + p.budget[1]) / 2),
    truthScore: p.truthScore > 0 ? p.truthScore : DEFAULT_ROI_PARAMS.scoreNeutral,
    possessionDate: con?.predictedDateFull ?? con?.predictedDate ?? null,
    reraDate: con?.reraDateFull ?? con?.reraDate ?? null,
    holdYears,
    asOf,
    corridor: p.market ?? null,
    /* filed progress drives the CLP entry catch-up — a 20%-built project
       takes 20% at entry, and the balance tranches ride the current pace */
    constructionPct: con?.actualPct ?? null,
  };
}

const crStr = (v: number) => `₹${v.toFixed(2)} Cr`;
/* Small sums (a tranche on a compact ticket, the first month's rent) read
   better in lakhs than as ₹0.09 Cr. */
const inr = (cr: number) => (cr >= 0.995 ? crStr(cr) : `₹${(cr * 100).toFixed(1)} L`);
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

/* The charts draw to their container's REAL width (mobile-first, not a
   desktop drawing scaled down) — the observer feeds it back, rounded so
   sub-pixel resize noise never re-renders. */
function useBoxWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((es) => {
      const nw = Math.round(es[0].contentRect.width);
      setW((prev) => (Math.abs(prev - nw) > 8 ? nw : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

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
  // Resolved in an effect, not a useState initializer: the initializer read
  // localStorage during hydration, so a reader whose entitlement was already
  // on the device hydrated "unlocked" against server HTML rendered "locked" —
  // a React #418 text mismatch on every entitled load. One extra locked frame
  // is invisible; the hydration is now byte-identical.
  const [selfUnlocked, setSelfUnlocked] = useState(sample);
  useEffect(() => {
    if (!sample) setSelfUnlocked(hasReadAccess(p.slug));
  }, [sample, p.slug]);
  const unlocked = unlockedProp ?? selfUnlocked;

  const [holdYears, setHoldYears] = useState(8);
  // `today` starts undefined so SSR and the first client render agree; the
  // effect fills it in after mount. Only asOf-DEPENDENT outputs (XIRR, rent,
  // years-to-possession) are gated on it — the CAGRs don't move with the date,
  // so they render immediately and identically on server + client.
  const [today, setToday] = useState<Date | undefined>(undefined);
  useEffect(() => setToday(new Date()), []);

  /* The configurations a reader can price the projection against — each
     bucket the project files with a computable ticket (filed ₹/sqft × that
     config's super area, the same arithmetic the match engine prices with).
     The rates (CAGR/XIRR) are price-scale-invariant; picking a config changes
     the ABSOLUTE rupees — exit value, capital gain, rent — which is the point. */
  const cfgOptions = useMemo(() => {
    const mi = p.matchInput;
    if (!mi) return [] as { bucket: BhkBucket; label: string; priceCr: number }[];
    const seen = new Map<BhkBucket, number>();
    for (const c of mi.configs) {
      if (!seen.has(c.bucket)) {
        const pr = configPriceCr(mi, c.bucket);
        if (pr != null && pr > 0) seen.set(c.bucket, pr);
      }
    }
    return [...seen.entries()]
      .sort((a, b) => (a[0] === "PH" ? 99 : +a[0]) - (b[0] === "PH" ? 99 : +b[0]))
      .map(([bucket, priceCr]) => ({ bucket, label: bucket === "PH" ? "Penthouse" : `${bucket} BHK`, priceCr }));
  }, [p]);
  /* No blended "Typical" ticket any more (founder call: confusing) — the
     panel opens on a REAL unit: the 3 BHK when the project files one, else
     the middle of its priced configs. A project with no priced configs keeps
     the blended midpoint internally; the pills simply don't render. */
  const [cfgSel, setCfgSel] = useState<BhkBucket | null>(null);
  const cfgBucket: BhkBucket | null =
    cfgSel ?? (cfgOptions.some((c) => c.bucket === "3") ? "3" : cfgOptions[Math.floor((cfgOptions.length - 1) / 2)]?.bucket ?? null);
  const cfgEntryCr = cfgBucket != null ? cfgOptions.find((c) => c.bucket === cfgBucket)?.priceCr : undefined;

  const r: RoiResult = useMemo(() => computeRoi(roiInputFor(p, holdYears, today, cfgEntryCr)), [p, holdYears, today, cfgEntryCr]);
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

  /* The ledger the XIRR is actually computed on — every debit (entry +
     construction tranches) and credit (rent, then the sale), dated from
     today on the CHOSEN hold and ticket. Derived from the same RoiResult
     the headline uses, so the calendar can never disagree with the number. */
  const ledger = useMemo(() => {
    if (!today) return null;
    const mLabel = (m: number) =>
      new Date(today.getFullYear(), today.getMonth() + m, today.getDate()).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    const M = Math.max(1, Math.round(holdYears * 12));
    const Mp = Math.min(M, Math.round(r.yearsToPossession * 12));
    type Row = { when: string; stage: string; debit?: number; credit?: number; paidPct?: number };
    const rows: Row[] = [{ when: "Today", stage: `Entry — ${r.entryPct}% of the ticket at BBA`, debit: (r.entryPriceCr * r.entryPct) / 100, paidPct: r.entryPct }];
    let paid = r.entryPct;
    for (const t of r.tranches) {
      paid += t.pct;
      rows.push({ when: mLabel(Math.min(t.month, M)), stage: `Construction tranche · ${t.pct}%`, debit: (r.entryPriceCr * t.pct) / 100, paidPct: paid });
    }
    if (r.rentCollectedCr > 0.005) {
      const startRent = (r.rentalYieldPct / 100 / 12) * r.entryPriceCr * Math.pow(1 + r.riskAdjustedCagr / 100, Mp / 12);
      rows.push({
        when: Mp === 0 ? "Today" : mLabel(Mp),
        stage: `${Mp === 0 ? "Ready — rent from day one" : "Possession — rent starts"} (~${inr(startRent)}/mo, grows with price) · collected to exit`,
        credit: r.rentCollectedCr,
      });
    }
    rows.push({ when: mLabel(M), stage: Mp >= M && r.yearsToPossession > 0 ? "Sale at the projected price — resale by transfer, before possession" : "Sale at the projected price", credit: r.exitValueCr });
    return rows;
  }, [today, holdYears, r]);

  /* Exit year by year — the SAME engine re-run for every hold, so the reader
     sees where the XIRR peaks (the flip) and what each extra year buys in
     absolute rupees. Rates are ticket-invariant; the money follows the pick. */
  const sweep = useMemo(() => {
    if (!today) return [];
    return Array.from({ length: 10 }, (_, i) => i + 1).map((y) => ({ y, s: computeRoi(roiInputFor(p, y, today, cfgEntryCr)) }));
  }, [p, today, cfgEntryCr]);
  /* The ⚑ peak considers possession-onward exits only, the same domain
     optimalExit sweeps: under the flat price path a pre-possession flip can
     post the biggest XIRR on paper, and crowning it would push readers at
     exactly the exit the callout above warns leans entirely on a re-rating. */
  const held = sweep.filter((x) => x.s.rentableYears >= 0.05);
  const peakPool = held.length ? held : sweep;
  const peakY = peakPool.length ? peakPool.reduce((b, x) => ((x.s.riskAdjustedXirr ?? -99) > (b.s.riskAdjustedXirr ?? -99) ? x : b), peakPool[0]).y : null;

  const exitNote =
    holdYears <= 5
      ? "A medium hold — a few years of rent start to matter while the capital gain compounds."
      : holdYears >= 10
        ? "The rental-compounding hold — the most total rupees and the steadiest ride; IRR dips a touch."
        : "The balanced default — capital growth plus several years of rent once the flat is ready.";

  const holdIdx = [5, 8, 10].indexOf(holdYears);
  const cfgLabel = cfgBucket != null ? (cfgOptions.find((c) => c.bucket === cfgBucket)?.label ?? "chosen") : null;
  const holdSeg = <Seg options={["5 yr", "8 yr", "10 yr"]} active={holdIdx} onPick={(i) => setHoldYears([5, 8, 10][i])} />;

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

          <div className={unlocked ? "mt-4" : "mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]"}>
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

            {/* ── the outlook teaser — locked readers only; the paid answer
                   lives in section b once unlocked ── */}
            {!unlocked && (
              <div className="flex flex-col justify-center gap-3 rounded-2xl border border-[#1e6b45]/25 bg-[#FBF8F2] p-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-[1.3rem]" aria-hidden>🔒</span>
                  <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">10-year growth outlook</p>
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
              </div>
            )}
          </div>
        </>
      )}

      {/* ── the paid, interactive model (dropped in the frozen sample) ── */}
      {unlocked && !isStatic && (
        <>
          {/* ── b · the answer first ── */}
          <div className="mt-10 flex items-center gap-3">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">If you enter today — the answer</span>
            <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>
          <p className="mt-2 max-w-[44rem] text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/60">
            Two engines, not one: the price rising, and rent once it&apos;s ready. Pick a hold and a unit — the return, the money and the split all move with it.
          </p>
          <div className="mt-4 rounded-2xl border border-[#1a1a1a]/10 bg-[#FBF8F2] p-6">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
              <div>
                {today && (
                  <p className="font-serif text-[1.3rem] font-medium leading-[1.35] tracking-[-0.005em] tabular-nums md:text-[1.6rem]" style={{ textWrap: "balance" }}>
                    You put in <span className="border-b-[3px] border-[#1a1a1a]/25">{crStr(r.entryPriceCr)}</span>, staged with the build.<br />
                    You take out <span className="border-b-[3px] border-[#1e6b45]/35 text-[#1e6b45]">{crStr(r.exitValueCr + r.rentCollectedCr)}</span> — <span className="text-[#1e6b45]">{crStr(totalProfit)} profit</span>.
                  </p>
                )}
                <div className="mt-5">
                  <p className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[#1e6b45]">Return on your cash flow{showingXirr ? " · XIRR" : ""}</p>
                  <p className="mt-1 font-serif text-[3.3rem] font-medium leading-[.95] tracking-[-0.02em] tabular-nums text-[#1e6b45] md:text-[4.2rem]">
                    {cashReturn.toFixed(1)}<span className="text-[1rem] font-normal text-[#1a1a1a]/40"> % / yr</span>
                  </p>
                </div>
                <p className="mt-3 max-w-[26rem] text-[0.78rem] font-light leading-[1.5] text-[#1a1a1a]/55">
                  {showingXirr
                    ? <>The number to trust — modeled, not a promise. Higher than the {r.riskAdjustedCagr.toFixed(1)}% price growth: you pay in stages and it earns rent.</>
                    : <>The realistic annual return, after the delay — modeled, not a promise.</>}
                </p>
                <div className="mt-4 grid max-w-[22rem] grid-cols-2 gap-2">
                  <MiniStat k="Price growth" v={`${r.riskAdjustedCagr.toFixed(1)}%`} />
                  <MiniStat k="Rental yield" v={`${r.rentalYieldPct}%`} gold />
                </div>
              </div>

              {/* the controls that rewrite the sentence */}
              <div className="self-start rounded-2xl border border-[#1a1a1a]/8 bg-white/70 p-5">
                <p className="mb-2 font-mono text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/45">Hold</p>
                {holdSeg}
                {cfgOptions.length > 0 && (
                  <>
                    <p className="mb-2 mt-4 font-mono text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/45">Unit — the rates hold, the rupees re-base</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cfgOptions.map((c) => (
                        <button
                          key={c.bucket}
                          onClick={() => setCfgSel(c.bucket)}
                          aria-pressed={cfgBucket === c.bucket}
                          className={`rounded-full border px-3 py-1.5 text-[0.72rem] tabular-nums transition-colors ${cfgBucket === c.bucket ? "border-[#1e6b45]/40 bg-[#1e6b45]/[0.07] font-medium text-[#1e6b45]" : "border-[#1a1a1a]/12 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/30"}`}
                        >
                          {c.label} · ₹{c.priceCr.toFixed(1)} Cr
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {/* the CLP shape the XIRR is computed on — the money leaves in
                    builder tranches, not one cheque, and the entry catch-up is
                    the project's own filed progress */}
                {today && (
                  <p className="mt-4 font-mono text-[0.6rem] uppercase leading-[1.7] tracking-[0.08em] text-[#1a1a1a]/45">
                    Construction-linked plan · {r.entryPct}% of the ticket at entry
                    {r.tranches.length > 0 && <> · balance {r.tranches.length} × 10% with the build (~{r.tranches[r.tranches.length - 1].month} mo to possession)</>}
                  </p>
                )}
              </div>
            </div>

            {today && (
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <BoxStat k="Exit value" v={crStr(r.exitValueCr)} />
                <BoxStat k="Capital gain" v={crStr(r.capitalGainCr)} tone="green" />
                <BoxStat k="Rent collected" v={r.rentCollectedCr > 0.005 ? crStr(r.rentCollectedCr) : "—"} tone="gold" />
                <BoxStat k="Total profit" v={crStr(totalProfit)} />
              </div>
            )}

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

          {/* ── c · where the money moves — timeline + dated ledger ── */}
          {today && ledger && (
            <>
              <div className="mt-10 flex items-center gap-3">
                <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">Where the money moves — your payment calendar</span>
                <span className="h-px flex-1 bg-[#1a1a1a]/10" />
              </div>
              <p className="mt-2 max-w-[44rem] text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/60">
                Every debit and credit behind the {holdYears}-yr number — the construction-linked outflows on {cfgLabel ? `the ${cfgLabel} ticket` : "the project ticket"}, then the rent and the sale coming back.
              </p>
              <div className="mt-4 rounded-2xl border border-[#1a1a1a]/10 bg-white/70 p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/45">The calendar follows your hold</p>
                  <div className="w-[190px]">{holdSeg}</div>
                </div>
                <CashflowChart r={r} holdYears={holdYears} today={today} />
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.72rem] font-light text-[#1a1a1a]/50">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#1a1a1a]" />Money out — entry &amp; construction tranches</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#9a7a2e]" />Rent in — from possession, grows with price</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#1e6b45]" />Sale at exit</span>
                </div>
                <details className="group mt-4 border-t border-[#1a1a1a]/8 pt-3.5">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-[0.78rem] font-medium text-[#1a1a1a]/60 transition-colors hover:text-[#1a1a1a]/85 [&::-webkit-details-marker]:hidden">
                    <span className="inline-block transition-transform group-open:rotate-90">▸</span> The ledger, dated — every row
                  </summary>
                  <div className="-mx-2 mt-3 overflow-x-auto px-2">
                    <table className="w-full min-w-[36rem] text-left">
                      <thead>
                        <tr className="border-b border-[#1a1a1a]/12">
                          <th className="py-2 pr-3 font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">When</th>
                          <th className="py-2 pr-3 font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">Stage</th>
                          <th className="py-2 pr-3 text-right font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">Debit</th>
                          <th className="py-2 pr-3 text-right font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">Credit</th>
                          <th className="py-2 text-right font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map((row, i) => (
                          <tr key={i} className="border-b border-[#1a1a1a]/6">
                            <td className="whitespace-nowrap py-2 pr-3 text-[0.72rem] font-medium tabular-nums text-[#1a1a1a]/70">{row.when}</td>
                            <td className="py-2 pr-3 text-[0.74rem] font-light leading-snug text-[#1a1a1a]/70">{row.stage}</td>
                            <td className="whitespace-nowrap py-2 pr-3 text-right text-[0.76rem] font-medium tabular-nums text-[#1a1a1a]">{row.debit != null ? `− ${inr(row.debit)}` : ""}</td>
                            <td className="whitespace-nowrap py-2 pr-3 text-right text-[0.76rem] font-semibold tabular-nums text-[#1e6b45]">{row.credit != null ? `+ ${inr(row.credit)}` : ""}</td>
                            <td className="py-2 text-right font-mono text-[0.66rem] tabular-nums text-[#1a1a1a]/45">{row.paidPct != null ? `${row.paidPct}%` : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-[#1a1a1a]/15">
                          <td colSpan={2} className="py-2.5 pr-3 text-[0.74rem] font-semibold text-[#1a1a1a]/80">Net of everything · <span className="text-[#1e6b45]">+{crStr(totalProfit)} profit</span></td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-right text-[0.76rem] font-semibold tabular-nums text-[#1a1a1a]">− {crStr(r.entryPriceCr)}</td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-right text-[0.76rem] font-semibold tabular-nums text-[#1e6b45]">+ {crStr(r.exitValueCr + r.rentCollectedCr)}</td>
                          <td className="py-2.5 text-right font-mono text-[0.66rem] tabular-nums text-[#1a1a1a]/45">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </details>
              </div>
            </>
          )}

          {/* ── d · exit year by year — the same engine re-run for every hold ── */}
          {today && sweep.length > 0 && (
            <>
              <div className="mt-10 flex items-center gap-3">
                <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">Exit year by year — where the return peaks</span>
                <span className="h-px flex-1 bg-[#1a1a1a]/10" />
              </div>
              <p className="mt-2 max-w-[44rem] text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/60">
                The same engine, re-run for an exit in each of the next ten years — the rate each year earns and the rupees it puts in hand. ⚑ marks the peak-XIRR exit; the tinted row is your hold. <b className="font-medium text-[#1a1a1a]">Tap a year to make it your hold.</b>
              </p>
              <div className="mt-4 rounded-2xl border border-[#1a1a1a]/10 bg-white/70 p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/45">Your hold — or tap any year</p>
                  <div className="w-[190px]">{holdSeg}</div>
                </div>
                <ExitCurve sweep={sweep} holdYears={holdYears} peakY={peakY} today={today} onPick={setHoldYears} />
                <div className="-mx-2 mt-4 overflow-x-auto px-2">
                  <table className="w-full min-w-[42rem] text-left">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]/12">
                        <th className="py-2 pr-3 font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">Exit</th>
                        <th className="py-2 pr-3 text-right font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">Exit value</th>
                        <th className="py-2 pr-3 text-right font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">Capital gain</th>
                        <th className="py-2 pr-3 text-right font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">Rent</th>
                        <th className="py-2 pr-3 text-right font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">Total profit</th>
                        <th className="py-2 pr-3 text-right font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">Price CAGR</th>
                        <th className="py-2 text-right font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/45">XIRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sweep.map(({ y, s }) => {
                        const profit = Math.max(0, s.capitalGainCr + s.rentCollectedCr);
                        const sel = y === holdYears;
                        const peak = y === peakY;
                        const pre = s.rentableYears < 0.05;
                        return (
                          <tr
                            key={y}
                            onClick={() => setHoldYears(y)}
                            className={`cursor-pointer border-b border-[#1a1a1a]/6 transition-colors last:border-0 ${sel ? "bg-[#1e6b45]/[0.05]" : "hover:bg-[#1a1a1a]/[0.03]"}`}
                          >
                            <td className="whitespace-nowrap py-2 pr-3 text-[0.72rem] font-medium tabular-nums text-[#1a1a1a]/75">
                              Year {y} · {today.getFullYear() + y}
                              {sel && <span className="ml-1.5 rounded-full bg-[#1e6b45]/10 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-[#1e6b45]">hold</span>}
                              {pre && <span className="ml-1.5 font-mono text-[0.56rem] uppercase tracking-[0.08em] text-[#1a1a1a]/40">pre-possession</span>}
                            </td>
                            <td className="whitespace-nowrap py-2 pr-3 text-right text-[0.74rem] font-light tabular-nums text-[#1a1a1a]/80">{crStr(s.exitValueCr)}</td>
                            <td className="whitespace-nowrap py-2 pr-3 text-right text-[0.74rem] font-light tabular-nums text-[#1a1a1a]/80">{crStr(s.capitalGainCr)}</td>
                            <td className="whitespace-nowrap py-2 pr-3 text-right text-[0.74rem] font-light tabular-nums text-[#1a1a1a]/80">{s.rentCollectedCr > 0.005 ? crStr(s.rentCollectedCr) : "—"}</td>
                            <td className="whitespace-nowrap py-2 pr-3 text-right text-[0.74rem] font-medium tabular-nums text-[#1a1a1a]">{crStr(profit)}</td>
                            <td className="whitespace-nowrap py-2 pr-3 text-right text-[0.74rem] font-light tabular-nums text-[#1a1a1a]/80">{s.riskAdjustedCagr.toFixed(1)}%</td>
                            <td className={`whitespace-nowrap py-2 text-right text-[0.76rem] tabular-nums ${peak ? "font-semibold text-[#8a6a1e]" : pre ? "font-medium text-[#1a1a1a]/60" : "font-medium text-[#1e6b45]"}`}>
                              {s.riskAdjustedXirr != null ? `${s.riskAdjustedXirr.toFixed(1)}%` : "—"}{peak ? " ⚑" : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 border-t border-[#1a1a1a]/8 pt-3 font-mono text-[0.6rem] uppercase tracking-[0.09em] text-[#1a1a1a]/45">
                  XIRR = cash-on-cash on the staged CLP outflows, rent and the sale · Price CAGR = pure price growth after the delay drag · rupee columns follow the ticket picked above · pre-possession exits are resales by transfer, so the ⚑ considers possession-onward years only
                </p>
              </div>
            </>
          )}

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
              <FallRow label={<><b className="font-semibold text-[#1a1a1a]">{p.marketShort || "Gurgaon"} corridor baseline</b> — the market rate where it stands</>} value={`${r.base.toFixed(1)}%`} lo={0} hi={r.base} tone="base" r={r} />
              <FallRow label={<><b className="font-semibold text-[#1a1a1a]">+ This project&apos;s quality</b> — Truth Score {p.truthScore}/100</>} value={`${r.qualityKicker >= 0 ? "+" : ""}${r.qualityKicker.toFixed(1)}%`} lo={Math.min(r.base, r.base + r.qualityKicker)} hi={Math.max(r.base, r.base + r.qualityKicker)} tone={r.qualityKicker >= 0 ? "up" : "down"} r={r} />
              {r.delayCost > 0.04 && (
                <FallRow label={<><b className="font-semibold text-[#1a1a1a]">− Predicted delay</b> — ~{r.delayMonths} months late to possession</>} value={`−${r.delayCost.toFixed(1)}%`} lo={r.riskAdjustedCagr} hi={r.expectedCagr} tone="down" r={r} />
              )}
              <div className="mt-1 border-t border-dashed border-[#1a1a1a]/15 pt-3">
                <FallRow label={<b className="font-semibold text-[#1a1a1a]">= Risk-adjusted price CAGR</b>} value={`${r.riskAdjustedCagr.toFixed(1)}%`} lo={0} hi={Math.max(0, r.riskAdjustedCagr)} tone="fin" r={r} />
              </div>
            </div>

            {/* the anchors, on one scale — FD, the city average, this project,
                and the cold→hot band. Same four facts the old list carried. */}
            <ScaleStrip r={r} />
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
            <Asm name="Corridor baseline CAGR" sub={`${p.marketShort || "Gurugram"} 5-yr price growth, conservatively underwritten`} val={`${r.base.toFixed(1)}% / yr`} />
            <Asm name="Quality kicker" sub={`From Truth Score ${p.truthScore} (${DEFAULT_ROI_PARAMS.scoreSlope} pt per point vs the ${DEFAULT_ROI_PARAMS.scoreNeutral} portfolio median, ±${DEFAULT_ROI_PARAMS.scoreCap} cap)`} val={`${r.qualityKicker >= 0 ? "+" : ""}${r.qualityKicker.toFixed(1)}%`} />
            {r.delayCost > 0.04 && <Asm name="Predicted-delay drag" sub={`~${r.delayMonths}-month slip vs RERA date, as opportunity cost`} val={`−${r.delayCost.toFixed(1)}%`} warn />}
            <Asm name="Rental yield" sub="GROSS annual, on the then-value, post-possession only" val={`${r.rentalYieldPct}% / yr`} />
            <Asm name="Payment plan" sub={`Construction-linked: ${r.entryPct}% at entry (the built share), 10% per further block to possession`} val="CLP" />
            <Asm name="Holding horizon" sub="Adjustable — see &quot;when to exit&quot; above" val={`${holdYears} yr`} />
            <Asm name="Entry basis" sub={cfgLabel ? `${cfgLabel} at the filed rate` : "Project ticket midpoint"} val={crStr(r.entryPriceCr)} />
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

/* ── c · the CLP as a picture: outflows down with the build, rent and the
   sale up — direction is the encoding, so the story reads at a glance.
   Drawn to the container's real width; native <title> tooltips per mark. ── */
function CashflowChart({ r, holdYears, today }: { r: RoiResult; holdYears: number; today: Date }) {
  const [ref, w] = useBoxWidth();
  const W = Math.max(330, Math.min(920, w || 920));
  const mob = W < 560;
  const H = mob ? 252 : 300;
  const M = Math.max(1, Math.round(holdYears * 12));
  const L = mob ? 6 : 46, R = mob ? 6 : 18, base = mob ? 152 : 176;
  const x = (m: number) => L + 8 + ((W - L - R - 26) * m) / M;
  const Mp = Math.min(M, Math.round(r.yearsToPossession * 12));
  const mLab = (m: number) =>
    new Date(today.getFullYear(), today.getMonth() + m, today.getDate()).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  const entryAmt = (r.entryPriceCr * r.entryPct) / 100;
  const trAmt = r.entryPriceCr * 0.1;
  const up = (v: number) => Math.max(6, (v / Math.max(0.01, r.exitValueCr)) * (mob ? 92 : 118));
  const dn = (v: number) => Math.max(6, (v / Math.max(0.01, entryAmt, trAmt)) * (mob ? 54 : 72));
  const bw = mob ? 7 : 10, bws = mob ? 13 : 16;
  const yStep = (mob && holdYears > 6) || holdYears > 8 ? 2 : 1;
  const yr = today.getFullYear();
  const flows = [
    { m: 0, v: entryAmt, tt: `Today · Entry ${r.entryPct}% · −${inr(entryAmt)}` },
    ...r.tranches.map((t) => ({ m: Math.min(t.month, M), v: (r.entryPriceCr * t.pct) / 100, tt: `${mLab(Math.min(t.month, M))} · Construction tranche ${t.pct}% · −${inr((r.entryPriceCr * t.pct) / 100)}` })),
  ];
  const fs = mob ? 10.5 : 10;
  const possFlip = x(Mp) > W - (mob ? 120 : 210);
  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Cash flow timeline: staged outflows with the build, then rent and the sale coming back">
        <g fontFamily="var(--font-geist-mono),monospace" fontSize={fs}>
          <line x1={L} y1={base} x2={W - R} y2={base} stroke="rgba(26,26,26,.35)" strokeWidth="1.5" />
          {Array.from({ length: holdYears }, (_, i) => i + 1).map((y) => (
            <g key={y}>
              <line x1={x(y * 12)} y1={base - 6} x2={x(y * 12)} y2={base + 6} stroke="rgba(26,26,26,.2)" />
              {y % yStep === 0 && (
                <text x={x(y * 12)} y={base + (mob ? 32 : 40)} textAnchor="middle" fill="rgba(26,26,26,.42)">
                  {mob ? `'${String(yr + y).slice(2)}` : yr + y}
                </text>
              )}
            </g>
          ))}
          {Mp < M && (
            <>
              <line x1={x(Mp)} y1={mob ? 26 : 30} x2={x(Mp)} y2={base} stroke="rgba(138,106,30,.45)" strokeDasharray="3 4" />
              <text x={x(Mp) + (possFlip ? -5 : 5)} y={mob ? 36 : 40} textAnchor={possFlip ? "end" : "start"} fill="#8a6a1e">
                {mob ? "possession" : Mp === 0 ? "ready — rent from day one" : "possession · rent starts"}
              </text>
              {r.rentCollectedCr > 0.005 && (
                <>
                  <path d={`M${x(Mp)},${base - 3} L${x(M) - 14},${base - 9}`} stroke="rgba(154,122,46,.55)" strokeWidth="5" strokeLinecap="round" fill="none" />
                  <text x={(x(Mp) + x(M)) / 2} y={base - 16} textAnchor="middle" fill="#8a6a1e">rent +{inr(r.rentCollectedCr)}</text>
                </>
              )}
            </>
          )}
          {flows.map((f, i) => (
            <rect key={i} x={x(f.m) - bw / 2} y={base} width={bw} height={dn(f.v)} rx="3" fill="#1a1a1a">
              <title>{f.tt}</title>
            </rect>
          ))}
          <rect x={x(M) - bws / 2} y={base - up(r.exitValueCr)} width={bws} height={up(r.exitValueCr)} rx="4" fill="#1e6b45">
            <title>{`${mLab(M)} · Sale at the projected price · +${crStr(r.exitValueCr)}`}</title>
          </rect>
          <text x={x(M) - 12} y={base - up(r.exitValueCr) - 8} textAnchor="end" fontWeight="500" fill="#1e6b45">sale +{crStr(r.exitValueCr)}</text>
          <text x={Math.max(2, x(0) - 6)} y={base + dn(entryAmt) + 15} fill="rgba(26,26,26,.6)">entry −{inr(entryAmt)}</text>
          <text x={L + 2} y={16} fill="rgba(26,26,26,.42)">money in ↑ · money out ↓</text>
          <text x={W - R} y={base + (mob ? 54 : 64)} textAnchor="end" fill="rgba(26,26,26,.55)">
            net +{crStr(r.exitValueCr + r.rentCollectedCr - r.entryPriceCr)}{mob ? "" : ` profit over ${holdYears} yrs`}
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ── d · XIRR by exit year — the flip made visible. Pre-possession years are
   dotted (paper flips by transfer); the ⚑ peak is gold; every dot sets the
   hold. One axis, %. ── */
function ExitCurve({ sweep, holdYears, peakY, today, onPick }: {
  sweep: { y: number; s: RoiResult }[]; holdYears: number; peakY: number | null; today: Date; onPick: (y: number) => void;
}) {
  const [ref, w] = useBoxWidth();
  const W = Math.max(330, Math.min(920, w || 920));
  const mob = W < 560;
  const H = mob ? 170 : 190;
  const L = mob ? 34 : 46, R = mob ? 10 : 18, T = 26, B = 32;
  const vals = sweep.map((x) => x.s.riskAdjustedXirr).filter((v): v is number => v != null);
  if (!vals.length) return null;
  const lo = Math.min(...vals) - 0.4, hi = Math.max(...vals) + 0.5;
  const x = (i: number) => L + ((W - L - R) * i) / (sweep.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / Math.max(0.1, hi - lo));
  const preLast = sweep.filter((r) => r.s.rentableYears < 0.05).length - 1;
  const grid: number[] = [];
  for (let g = Math.ceil(lo); g <= Math.floor(hi); g++) grid.push(g);
  let solid = "", dot = "";
  sweep.forEach(({ s }, i) => {
    if (s.riskAdjustedXirr == null) return;
    const pt = `${x(i)},${y(s.riskAdjustedXirr)}`;
    if (i <= preLast) dot += (dot ? " L" : "M") + pt;
    if (i >= Math.max(0, preLast)) solid += (solid ? " L" : "M") + pt;
  });
  const fs = mob ? 10.5 : 10;
  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="XIRR by exit year; the peak is flagged, tap a dot to set the hold">
        <g fontFamily="var(--font-geist-mono),monospace" fontSize={fs}>
          {grid.map((g) => (
            <g key={g}>
              <line x1={L} y1={y(g)} x2={W - R} y2={y(g)} stroke="rgba(26,26,26,.07)" />
              <text x={L - 6} y={y(g) + 3} textAnchor="end" fill="rgba(26,26,26,.42)">{g}%</text>
            </g>
          ))}
          {preLast >= 0 && <path d={dot} fill="none" stroke="rgba(26,26,26,.35)" strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" />}
          <path d={solid} fill="none" stroke="#1e6b45" strokeWidth="2.5" strokeLinecap="round" />
          {sweep.map(({ y: yy, s }, i) => {
            if (s.riskAdjustedXirr == null) return null;
            const pre = s.rentableYears < 0.05, peak = yy === peakY, sel = yy === holdYears;
            return (
              <g key={yy}>
                <circle
                  cx={x(i)} cy={y(s.riskAdjustedXirr)}
                  r={sel ? (mob ? 9 : 8) : mob ? 6.5 : 5.5}
                  fill={pre ? "#F5F0E8" : peak ? "#8a6a1e" : "#1e6b45"}
                  stroke={sel ? "#1a1a1a" : pre ? "rgba(26,26,26,.4)" : "#F5F0E8"}
                  strokeWidth={sel ? 2.5 : 2}
                  style={{ cursor: "pointer" }}
                  onClick={() => onPick(yy)}
                >
                  <title>{`Year ${yy} · ${today.getFullYear() + yy} · XIRR ${s.riskAdjustedXirr.toFixed(1)}%${pre ? " · pre-possession" : ""}${peak ? " · peak ⚑" : ""}`}</title>
                </circle>
                {peak && <text x={x(i)} y={y(s.riskAdjustedXirr) - 14} textAnchor="middle" fontWeight="500" fill="#8a6a1e">⚑ peak {s.riskAdjustedXirr.toFixed(1)}%</text>}
                <text x={x(i)} y={H - 6} textAnchor="middle" fill="rgba(26,26,26,.42)">{yy}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/* ── e · the anchors on one scale — the same four facts the old row list
   carried (FD, the city average, this project, the cold→hot band), placed
   where they actually sit relative to each other. ── */
function ScaleStrip({ r }: { r: RoiResult }) {
  const lo = Math.min(7, r.bands.bear) - 0.8;
  const hi = Math.max(r.bands.bull, r.base, r.riskAdjustedCagr) + 0.8;
  const pct = (v: number) => `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))}%`;
  return (
    <div className="mt-6">
      <p className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/45">Where that sits — cold → hot range shaded</p>
      <div className="relative mt-7 h-[74px]" aria-label={`A fixed deposit roughly 7.0%, Gurgaon's overall average ${r.base.toFixed(1)}%, this project realistically ${r.riskAdjustedCagr.toFixed(1)}%, range if the market runs cold to hot ${r.bands.bear.toFixed(1)}% to ${r.bands.bull.toFixed(1)}%`}>
        <div className="absolute left-0 right-0 top-[36px] h-[2px] rounded bg-[#1a1a1a]/15" />
        <div className="absolute top-[32px] h-[10px] rounded-[5px] bg-[#1e6b45]/15" style={{ left: pct(r.bands.bear), width: `calc(${pct(r.bands.bull)} - ${pct(r.bands.bear)})` }} />
        <div className="absolute top-[28px] h-[18px] w-[2px] rounded bg-[#1a1a1a]/45" style={{ left: pct(7) }} />
        <div className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[0.66rem] text-[#1a1a1a]/60" style={{ left: pct(7) }}>
          <span className="font-serif font-medium tabular-nums text-[#1a1a1a]">7.0%</span> · a fixed deposit, roughly
        </div>
        <div className="absolute top-[24px] h-[26px] w-[3px] rounded bg-[#8a6a1e]" style={{ left: pct(r.riskAdjustedCagr) }} />
        <div className="absolute top-[52px] -translate-x-1/2 whitespace-nowrap text-[0.66rem] text-[#1a1a1a]/60" style={{ left: pct(r.riskAdjustedCagr) }}>
          <span className="font-serif font-medium tabular-nums text-[#8a6a1e]">{r.riskAdjustedCagr.toFixed(1)}%</span> · this project — realistically
        </div>
        <div className="absolute top-[28px] h-[18px] w-[2px] rounded bg-[#1a1a1a]/45" style={{ left: pct(r.base) }} />
        <div className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[0.66rem] text-[#1a1a1a]/60" style={{ left: pct(r.base) }}>
          <span className="font-serif font-medium tabular-nums text-[#1a1a1a]">{r.base.toFixed(1)}%</span> · Gurgaon&apos;s overall average
        </div>
        <div className="absolute top-[52px] whitespace-nowrap text-[0.62rem] text-[#1a1a1a]/45" style={{ left: pct(r.bands.bear) }}>
          <span className="font-serif tabular-nums text-[#1a1a1a]/60">{r.bands.bear.toFixed(1)}%</span> cold
        </div>
        <div className="absolute top-[52px] -translate-x-full whitespace-nowrap text-[0.62rem] text-[#1a1a1a]/45" style={{ left: pct(r.bands.bull) }}>
          <span className="font-serif tabular-nums text-[#1a1a1a]/60">{r.bands.bull.toFixed(1)}%</span> hot
        </div>
      </div>
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
