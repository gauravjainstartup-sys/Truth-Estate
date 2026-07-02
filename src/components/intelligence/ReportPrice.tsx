"use client";

import { useMemo, useState } from "react";
import { priceJourney, roiModel, fmtPsf, type ProjectIntel } from "@/lib/projects";
import { hasFullAccess } from "@/lib/journey";
import { openUnitIntel } from "./TowerIntel";

/* Chapter III — "Will it make money?"
   a · The price since launch (PSF journey + what moved it)
   b · The 5-year projection — qualitative outlook free, exact CAGR gated
   c · The ROI calculator — CAGR vs XIRR with the cash flow read from the
       project's payment plan; primary vs resale shows it cuts both ways.
   All figures are modelled and labelled as such. */

const CR = 1e7;
const fmtCr = (v: number) => `₹${(v / CR).toFixed(2)} Cr`;

/* Monthly-cashflow IRR via bisection, annualised. cf[0] is month 0. */
function xirrAnnual(cf: number[]): number {
  const npv = (rm: number) => cf.reduce((s, c, i) => s + c / Math.pow(1 + rm, i), 0);
  let lo = -0.5, hi = 0.5;
  if (npv(lo) * npv(hi) > 0) return 0;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid;
  }
  const rm = (lo + hi) / 2;
  return (Math.pow(1 + rm, 12) - 1) * 100;
}

export default function ReportPrice({ p }: { p: ProjectIntel }) {
  const journey = priceJourney(p);
  const roi = roiModel(p);
  const [unlocked] = useState(() => (typeof window !== "undefined" ? hasFullAccess(p.slug) : false));

  /* ── calculator state ── */
  const psfMid = journey ? journey.mid : p.psf?.avg ?? 18000;
  const psfLo = Math.round((psfMid * 0.85) / 250) * 250;
  const psfHi = Math.round((psfMid * 1.3) / 250) * 250;
  /* Configurations — prefer the real homes (label + super area); else derive
     an indicative area by spreading the ticket band across p.configs. Scales
     to any number of layouts. */
  const homeList = useMemo(() => {
    const homes = p.ops?.homes;
    if (homes?.length) return homes.map((h) => ({ label: h.config, sqft: h.superSqft }));
    const loSq = (p.budget[0] * CR) / psfMid, hiSq = (p.budget[1] * CR) / psfMid;
    return p.configs.map((label, i) => {
      const t = p.configs.length <= 1 ? 0.5 : i / (p.configs.length - 1);
      return { label, sqft: Math.round((loSq + (hiSq - loSq) * t) / 25) * 25 };
    });
  }, [p.ops?.homes, p.configs, p.budget, psfMid]);

  const [cfgIdx, setCfgIdx] = useState(() => Math.min(1, homeList.length - 1));
  const [psf, setPsf] = useState(Math.round(psfMid / 250) * 250);
  const [years, setYears] = useState(5);
  const [mode, setMode] = useState<"primary" | "resale">("primary");
  const [plan, setPlan] = useState<"clp" | "down">("clp");
  const cfg = homeList[Math.min(cfgIdx, homeList.length - 1)];
  const sqft = cfg?.sqft ?? 0;

  const projCagr = roi?.adjCagr ?? 8;
  const outlook: "Low" | "Medium" | "High" = projCagr >= 8.5 ? "High" : projCagr >= 6 ? "Medium" : "Low";

  const calc = useMemo(() => {
    const ticket = psf * sqft;
    const months = years * 12;
    const exit = ticket * Math.pow(1 + projCagr / 100, years);
    const con = p.ops?.construction;
    /* months until construction completes (predicted) — CLP payments stop there */
    const conMonths = Math.min(months, Math.max(6, con ? 40 : 18));
    const cf = new Array<number>(months + 1).fill(0);
    let drawn = 0; // share of the ticket already paid to the builder at deal day
    if (mode === "resale") {
      /* Resale of an under-construction unit: you buy out the existing buyer's
         paid-up portion now, then continue the remaining construction-linked
         instalments to the builder. The cash flow doesn't vanish — it front-loads. */
      drawn = con ? Math.min(0.9, Math.max(0.2, con.actualPct / 100)) : 0.5;
      const remMon = Math.min(Math.max(1, months - 1), Math.max(3, Math.round((1 - drawn) * 30)));
      cf[0] -= ticket * drawn; // pay the seller for what's already been paid in (at today's value)
      const per = (ticket * (1 - drawn)) / remMon;
      for (let m = 1; m <= remMon; m++) cf[m] -= per; // remaining builder instalments
    } else if (plan === "down") {
      cf[0] -= ticket * 0.95;
      cf[conMonths] -= ticket * 0.05;
    } else {
      cf[0] -= ticket * 0.1; // booking
      const perMonth = (ticket * 0.75) / (conMonths - 1);
      for (let m = 1; m < conMonths; m++) cf[m] -= perMonth;
      cf[conMonths] -= ticket * 0.15; // possession + registry tranche
    }
    cf[months] += exit;
    const premium = exit - ticket;
    return {
      ticket, exit, premium, drawn,
      totalRoi: (premium / ticket) * 100,
      simpleAnnual: (premium / ticket / years) * 100,
      xirr: xirrAnnual(cf),
      cf, conMonths,
    };
  }, [psf, sqft, years, mode, plan, projCagr, p.ops?.construction]);

  /* condensed outflow bars for the mini cash-flow chart */
  const bars = useMemo(() => {
    const src = calc.cf.slice(0, -1);
    const n = 9;
    const chunk = Math.max(1, Math.ceil(src.length / n));
    const out: number[] = [];
    for (let i = 0; i < src.length; i += chunk) out.push(-src.slice(i, i + chunk).reduce((a, b) => a + b, 0));
    const max = Math.max(...out, 1);
    return out.map((v) => v / max);
  }, [calc.cf]);

  if (!journey && !roi) return null;

  return (
    <div className="mt-8">
      {/* ── a · the record ── */}
      {journey && (
        <>
          <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Price Dynamics · a — the record</p>
          <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">The price, since launch</h3>

          <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/60 lg:grid-cols-4">
            <PStat v={fmtPsf(journey.launchPsf)} sub="/sqft" k={`Launch · ${journey.launchDate}`} />
            <PStat v={`${fmtPsf(journey.currentLow)}–${(journey.currentHigh / 1000).toFixed(1)}k`} k="Current range · today" />
            <PStat v={`+${journey.premiumPct}%`} k="Premium to date" accent />
            <PStat v={`~${journey.cagr}%`} k={`CAGR · ${journey.years} yrs`} accent />
          </div>

          {/* the record + the projection — stacks on mobile, side-by-side on desktop */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-gradient-to-b from-white/80 to-[#fcfaf5] p-5">
              <svg viewBox="0 0 1000 300" className="block w-full" role="img" aria-label="Price per sq ft since launch, with the projected range ahead">
                <defs>
                  <linearGradient id="parea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(154,122,46,.22)" /><stop offset="1" stopColor="rgba(154,122,46,0)" /></linearGradient>
                  <linearGradient id="pcone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(30,107,69,.18)" /><stop offset="1" stopColor="rgba(30,107,69,.04)" /></linearGradient>
                </defs>
                <g stroke="rgba(26,26,26,.08)" strokeWidth="1"><line x1="40" y1="70" x2="960" y2="70" /><line x1="40" y1="140" x2="960" y2="140" /><line x1="40" y1="210" x2="960" y2="210" /><line x1="40" y1="280" x2="960" y2="280" /></g>
                <path d="M40,255 L200,238 L310,215 L420,192 L420,280 L40,280 Z" fill="url(#parea)" />
                <path d="M40,255 L200,238 L310,215 L420,192" fill="none" stroke="#9a7a2e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M420,192 L940,52 L940,150 Z" fill="url(#pcone)" />
                <path d="M420,192 L940,96" fill="none" stroke="#1e6b45" strokeWidth="2" strokeDasharray="6 5" />
                <line x1="420" y1="36" x2="420" y2="280" stroke="#9a7a2e" strokeWidth="1" strokeDasharray="3 4" opacity=".6" />
                <circle cx="40" cy="255" r="4.5" fill="#9a7a2e" /><circle cx="420" cy="192" r="6" fill="#fff" stroke="#9a7a2e" strokeWidth="3" />
                <g fontSize="13" fill="#6b6459" fontFamily="ui-sans-serif">
                  <text x="44" y="274">Launch {fmtPsf(journey.launchPsf)}</text>
                  <text x="412" y="180" textAnchor="end" fontWeight="600" fill="#1a1a1a">Today {fmtPsf(journey.currentLow)}–{(journey.currentHigh / 1000).toFixed(1)}k</text>
                </g>
                <g fontSize="12" fill="#a49a8c" fontFamily="ui-monospace,monospace">
                  <text x="40" y="296">{journey.launchDate.split(" ")[1]}</text><text x="410" y="296">now</text><text x="905" y="296">+5 yrs</text>
                </g>
              </svg>
            </div>
            {/* projection — qualitative outlook free, exact CAGR gated */}
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#9a7a2e]/25 bg-[#FBF8F2] p-6 text-center">
              {unlocked && roi ? (
                <>
                  <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">5-year projection · unlocked</p>
                  <p className="font-mono text-[2.3rem] font-medium leading-none text-[#1e6b45]">{roi.adjCagr}%<span className="text-[0.85rem] text-[#1a1a1a]/40"> CAGR</span></p>
                  <p className="text-[0.72rem] font-light leading-[1.5] text-[#1a1a1a]/50">execution-adjusted base case · corridor benchmark {roi.benchCagr}% · min. 5-yr hold</p>
                </>
              ) : (
                <>
                  <span className="text-[1.3rem]" aria-hidden>🔒</span>
                  <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">5-year growth outlook</p>
                  <span className="inline-flex overflow-hidden rounded-full border border-[#1a1a1a]/10 bg-white">
                    {(["Low", "Medium", "High"] as const).map((o) => (
                      <span key={o} className={`px-3.5 py-1.5 text-[0.72rem] ${o === outlook ? "bg-[#1e6b45] font-bold text-white" : "text-[#1a1a1a]/35"}`}>{o}</span>
                    ))}
                  </span>
                  <p className="text-[0.68rem] font-light leading-[1.5] text-[#1a1a1a]/45">The exact projected CAGR, bull / base / bear scenarios and the ideal exit window are inside.</p>
                  <button onClick={openUnitIntel} className="mt-1 rounded-lg bg-[#1e6b45] px-4 py-2 text-[0.74rem] font-semibold text-white transition-colors hover:bg-[#238c55]">Unlock the 5-year projection →</button>
                  <p className="text-[0.56rem] text-[#1a1a1a]/35">Free with membership · or ₹1,499 this project</p>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── c · the calculator ── */}
      <div className="mt-10 flex items-center gap-3"><span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">Model your money — cash flow and all</span><span className="h-px flex-1 bg-[#1a1a1a]/10" /></div>

      <div className="mt-4 grid overflow-hidden rounded-2xl border border-[#1a1a1a]/10 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* inputs */}
        <div className="border-b border-[#1a1a1a]/10 bg-[#FBF8F2] p-6 lg:border-b-0 lg:border-r">
          <Input label="Configuration" value={`${cfg?.label ?? "—"} · ~${sqft.toLocaleString("en-IN")} sq ft`}>
            <div className="flex flex-wrap gap-2">
              {homeList.map((h, i) => (
                <button key={h.label} onClick={() => setCfgIdx(i)}
                  className={`rounded-full border px-3.5 py-2 text-[0.74rem] font-medium transition-colors ${i === cfgIdx ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#1a1a1a]/12 bg-white text-[#8b8378] hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"}`}>
                  {h.label}
                </button>
              ))}
            </div>
          </Input>
          <Input label="Buy price" value={`${fmtPsf(psf)}/sqft`}>
            <Seg options={["Primary", "Resale"]} active={mode === "primary" ? 0 : 1} onPick={(i) => setMode(i === 0 ? "primary" : "resale")} />
            <input type="range" min={psfLo} max={psfHi} step={250} value={psf} onChange={(e) => setPsf(Number(e.target.value))}
              className="mt-3 w-full accent-[#9a7a2e]" aria-label="Buy price per sq ft" />
            <div className="flex justify-between text-[0.62rem] text-[#1a1a1a]/40"><span>{fmtPsf(psfLo)}</span><span>{fmtPsf(psfHi)}</span></div>
          </Input>
          <Input label="Holding period" value={`${years} years`}>
            <Seg options={["3 yr", "5 yr", "7 yr", "10 yr"]} active={[3, 5, 7, 10].indexOf(years)} onPick={(i) => setYears([3, 5, 7, 10][i])} />
            <p className="mt-2 text-[0.66rem] font-light leading-[1.5] text-[#1a1a1a]/45">Our projection assumes a minimum 5-year hold.</p>
          </Input>
          {mode === "primary" && (
            <Input label="Payment plan" value={plan === "clp" ? "Construction-linked" : "Down-payment"}>
              <Seg options={["Down-payment", "Construction-linked"]} active={plan === "down" ? 0 : 1} onPick={(i) => setPlan(i === 0 ? "down" : "clp")} />
              <p className="mt-2 text-[0.66rem] font-light leading-[1.5] text-[#1a1a1a]/45"><b className="font-medium text-[#1a1a1a]/70">When your cash actually leaves your pocket</b> is what separates CAGR from your real return.</p>
            </Input>
          )}
        </div>

        {/* outputs */}
        <div className="bg-white/70 p-6">
          <div className="grid overflow-hidden rounded-xl border border-[#1a1a1a]/10 sm:grid-cols-2">
            <div className="p-5">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">Price CAGR</p>
              <p className="mt-2 font-mono text-[2.2rem] font-medium leading-none">{projCagr.toFixed(1)}<span className="text-[0.9rem] text-[#1a1a1a]/35">%</span></p>
              <p className="mt-2 text-[0.66rem] font-light leading-[1.4] text-[#1a1a1a]/45">what the asset appreciates, if you paid 100% on day one</p>
            </div>
            <div className="border-t border-[#1a1a1a]/10 bg-gradient-to-br from-[#1e6b45]/[0.08] to-transparent p-5 sm:border-l sm:border-t-0">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">◆ Your XIRR</p>
              <p className="mt-2 font-mono text-[2.2rem] font-medium leading-none text-[#1e6b45]">{calc.xirr.toFixed(1)}<span className="text-[0.9rem] text-[#1a1a1a]/35">%</span></p>
              <p className="mt-2 text-[0.66rem] font-light leading-[1.4] text-[#1a1a1a]/45">your real, cash-flow-adjusted return on this {mode === "resale" ? "resale deal" : plan === "clp" ? "construction-linked plan" : "down-payment plan"}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <OStat k="Buying cost" v={fmtCr(calc.ticket)} />
            <OStat k="Est. premium" v={`+${fmtCr(calc.premium)}`} green />
            <OStat k="Total ROI" v={`${calc.totalRoi.toFixed(1)}%`} />
            <OStat k="Simple annual" v={`${calc.simpleAnnual.toFixed(1)}%`} />
          </div>

          {/* cash-flow strip */}
          <p className="mt-4 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">
            Your cash flow — {mode === "resale" ? <><b className="text-[#9a7a2e]">seller&apos;s paid-up portion now</b>, the rest to the builder as it tops out</> : plan === "clp" ? <b className="text-[#9a7a2e]">read from this project&apos;s payment plan</b> : "front-loaded down-payment"}
          </p>
          <div className="mt-2 flex h-16 items-end gap-1.5">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-sm bg-[#9a7a2e]" style={{ height: `${Math.max(6, h * 78)}%`, opacity: h > 0.01 ? 1 : 0.15 }} />
            ))}
            <div className="ml-2 flex w-8 flex-col items-center">
              <span className="mb-0.5 font-mono text-[0.5rem] text-[#1e6b45]">sale</span>
              <div className="w-full rounded-sm bg-[#238c55]" style={{ height: "78%" }} />
            </div>
          </div>
          <div className="mt-1 flex justify-between font-mono text-[0.56rem] text-[#1a1a1a]/35"><span>today</span><span>+{years} yrs</span></div>

          <div className="mt-4 rounded-r-lg border-l-2 border-[#9a7a2e] bg-[#9a7a2e]/[0.06] px-4 py-3 text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/70">
            {mode === "resale" ? (
              <><b className="font-semibold text-[#1a1a1a]">A resale still has a cash flow.</b> You buy out the seller&apos;s paid-up portion (~{Math.round(calc.drawn * 100)}% of the ticket) up front, then carry the remaining builder instalments to possession — more front-loaded than a fresh construction-linked plan, so your XIRR ({calc.xirr.toFixed(1)}%) lands between it and a full down-payment. <b className="font-semibold text-[#1a1a1a]">Switch to Primary · construction-linked</b> to see the other side.</>
            ) : plan === "clp" ? (
              <><b className="font-semibold text-[#1a1a1a]">Why XIRR beats CAGR here:</b> you only pay part of {fmtCr(calc.ticket)} up front — the rest goes out over the build, so your money works harder and your real return ({calc.xirr.toFixed(1)}%) sits above the price CAGR ({projCagr.toFixed(1)}%). <b className="font-semibold text-[#1a1a1a]">It cuts both ways</b> — switch to Resale and watch it shift.</>
            ) : (
              <><b className="font-semibold text-[#1a1a1a]">Front-loaded cash pulls XIRR back toward CAGR</b> ({calc.xirr.toFixed(1)}% vs {projCagr.toFixed(1)}%) — add stamp duty and it can dip below. Same asset, same exit; the payment structure decides your real return. Switch to a construction-linked primary to see the other side.</>
            )}
          </div>
          <p className="mt-3 text-[0.62rem] font-light italic text-[#1a1a1a]/35">Modelled on the corridor-anchored, execution-adjusted CAGR of {projCagr.toFixed(1)}% — an estimate, not a promise. Taxes, stamp duty &amp; charges excluded.</p>
        </div>
      </div>
    </div>
  );
}

function PStat({ v, sub, k, accent }: { v: string; sub?: string; k: string; accent?: boolean }) {
  return (
    <div className="border-b border-r border-[#1a1a1a]/[0.06] p-5">
      <p className={`font-mono text-[1.5rem] font-medium leading-none ${accent ? "text-[#1e6b45]" : "text-[#1a1a1a]"}`}>{v}{sub && <span className="text-[0.75rem] text-[#1a1a1a]/35">{sub}</span>}</p>
      <p className="mt-2 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">{k}</p>
    </div>
  );
}

function Input({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#1a1a1a]/45">{label}</span>
        <span className="text-right text-[0.86rem] font-semibold">{value}</span>
      </div>
      <div className="mt-2.5">{children}</div>
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

function OStat({ k, v, green }: { k: string; v: string; green?: boolean }) {
  return (
    <div className="rounded-lg border border-[#1a1a1a]/8 bg-[#FBF8F2] px-3.5 py-3">
      <p className="text-[0.56rem] font-medium uppercase tracking-[0.08em] text-[#1a1a1a]/40">{k}</p>
      <p className={`mt-1 font-mono text-[1.05rem] font-semibold ${green ? "text-[#1e6b45]" : "text-[#1a1a1a]"}`}>{v}</p>
    </div>
  );
}
