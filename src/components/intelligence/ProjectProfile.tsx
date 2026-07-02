"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { useConsultation } from "../consultation/ConsultationProvider";
import { loadBuyData, hasPreferences, deriveDNA } from "@/lib/journey";
import type { ConsultProfileChip } from "@/lib/consultation";
import { FIN_METRICS } from "@/lib/developers";
import RatingMeter from "./RatingMeter";
import {
  SCORE_INPUTS,
  alternativesIn,
  fmtPsf,
  developerOf,
  marketOf,
  roiModel,
  riskMatrix,
  investorFit,
  projectFaqs,
  towerIntelMeta,
  type ProjectIntel,
  type RiskLevel,
} from "@/lib/projects";
import MatchScore from "./MatchScore";
import TowerIntel, { openUnitIntel } from "./TowerIntel";

const basePath = "/Truth-Estate";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monIdx = (s: string) => {
  const [m, y] = s.split(" ");
  return parseInt(y, 10) * 12 + Math.max(0, MONTHS.indexOf(m));
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">{children}</p>;
}

const recoTone = (r: string) =>
  r.includes("Strong") ? "border-[#1e6b45]/30 text-[#1e6b45] bg-[#1e6b45]/8"
  : r === "Buy" ? "border-[#3e8e62]/30 text-[#3e8e62] bg-[#3e8e62]/8"
  : "border-[#9a7a2e]/30 text-[#9a7a2e] bg-[#c9a96e]/10";

const riskTone: Record<RiskLevel, string> = {
  Low: "text-[#1e6b45] border-[#1e6b45]/25 bg-[#1e6b45]/[0.05]",
  Moderate: "text-[#9a7a2e] border-[#9a7a2e]/25 bg-[#c9a96e]/[0.08]",
  Elevated: "text-[#b0503e] border-[#b0503e]/25 bg-[#b0503e]/[0.05]",
};

/* The strained→strong rating meter now lives in ./RatingMeter, shared with
   the developer dossier so the whole product speaks one visual language. */

function Num({ v, k, accent }: { v: string; k: string; accent?: boolean }) {
  return (
    <div>
      <p className={`font-mono text-[1.5rem] font-light leading-none md:text-[1.7rem] ${accent ? "text-[#3e8e62]" : "text-[#1a1a1a]"}`}>{v}</p>
      <p className="mt-2.5 text-[0.66rem] font-light uppercase tracking-[0.12em] text-[#1a1a1a]/40">{k}</p>
    </div>
  );
}

/* A labelled key/value cell for the vitals grid. */
function KV({ k, v, tag }: { k: string; v: string; tag?: string }) {
  return (
    <div className="border-l-2 border-[#1a1a1a]/8 pl-4">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/35">{k}</p>
      <p className="mt-1.5 font-mono text-[0.88rem] font-medium leading-snug text-[#1a1a1a]/85 md:text-[0.95rem]">
        {v}
        {tag && <span className="ml-2 rounded bg-[#1e6b45]/8 px-1.5 py-0.5 align-middle font-sans text-[0.58rem] font-medium uppercase tracking-[0.08em] text-[#1e6b45]">{tag}</span>}
      </p>
    </div>
  );
}

/* A progress track with a plan marker — actual vs expected. */
function ProgressBar({ label, value, hint, accent = "#1e6b45" }: { label: string; value: number; hint?: string; accent?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[0.72rem] font-light uppercase tracking-[0.1em] text-[#1a1a1a]/45">{label}</span>
        <span className="font-mono text-[0.9rem] text-[#1a1a1a]/80">{value}%{hint && <span className="ml-2 text-[0.68rem] font-light text-[#1a1a1a]/35">{hint}</span>}</span>
      </div>
      <div className="mt-2 h-[7px] w-full overflow-hidden rounded-full bg-[#1a1a1a]/8">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, value)}%`, backgroundColor: accent }} />
      </div>
    </div>
  );
}

function Source({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">{children}</p>;
}

export default function ProjectProfile({
  p,
  embedded = false,
  onClose,
  onBack,
  onConsult,
  onChallenge,
  onSelectAlternative,
}: {
  p: ProjectIntel;
  /* When rendered inside the journey modal: drop the page chrome, keep the
     reader in the flow, and route actions back to the journey. */
  embedded?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onConsult?: () => void;
  onChallenge?: () => void;
  onSelectAlternative?: (name: string) => void;
}) {
  const { open } = useJourney();
  const { openConsult } = useConsultation();
  // "Get Independent Advice" from a report is about THIS project — open the
  // consultation with the project as its source (the advisor preps for it),
  // and if the visitor already shared a brief (Match Score / Buyer Office),
  // pass it as a warm profile so we never re-ask what we know.
  const consult = onConsult ?? (() => {
    const saved = loadBuyData();
    let profile: ConsultProfileChip[] | undefined;
    if (saved && hasPreferences(saved)) {
      const dna = deriveDNA(saved);
      profile = [
        { label: "Budget", value: dna.budgetRange },
        { label: "Markets", value: dna.markets.slice(0, 3).join(", ") },
        { label: "Timeline", value: dna.timeline },
        ...(saved.priorities.length ? [{ label: "Priorities", value: saved.priorities.join(", ") }] : []),
      ];
    }
    openConsult({ source: p.name, sourceKind: "project", ...(profile ? { intent: "buy" as const, profile } : {}) });
  });
  const challenge = onChallenge ?? (() => open("research"));
  const alts = alternativesIn(p.market, p.name);
  const devHref = p.devSlug ? `${basePath}/intelligence/developers/${p.devSlug}` : undefined;
  const marketHref = p.marketSlug ? `${basePath}/intelligence/markets/${p.marketSlug}` : undefined;

  const dev = developerOf(p);
  const market = marketOf(p);
  const roi = roiModel(p);
  const risks = riskMatrix(p);
  const faqs = projectFaqs(p);
  const ops = p.ops;
  const usps = ops?.usps ?? [];
  const topInMarket = alts.every((a) => a.truthScore <= p.truthScore);

  const con = ops?.construction;
  const aheadMonths = con ? monIdx(con.reraDate) - monIdx(con.predictedDate) : 0;

  const toc = [
    { id: "match", label: "Match score", show: true },
    { id: "tower-intel", label: "Tower & unit intel", show: true },
    { id: "vitals", label: "Vitals", show: true },
    { id: "anatomy", label: "Truth Score anatomy", show: true },
    { id: "developer", label: "Developer analysis", show: !!dev },
    { id: "construction", label: "Construction & velocity", show: !!con },
    { id: "legal", label: "Legal & compliance", show: true },
    { id: "location", label: "Location intelligence", show: !!market },
    { id: "roi", label: "Projected ROI", show: !!roi },
    { id: "usps", label: "Project USPs", show: usps.length > 0 },
    { id: "strengths", label: "Strengths & watch-outs", show: true },
    { id: "serves", label: "What this serves", show: p.tags.length > 0 },
    { id: "faqs", label: "Forensic FAQs", show: faqs.length > 0 },
  ].filter((t) => t.show);

  /* Sequential section numbers — only counts sections that actually render,
     so hidden modules never leave a gap in the sequence. */
  let _n = 0;
  const num = () => String(++_n).padStart(2, "0");

  return (
    <div className={`${embedded ? "h-full overflow-y-auto" : "min-h-svh"} bg-[#F5F0E8] text-[#1a1a1a]`}>
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4 md:px-10">
          {embedded ? (
            <>
              <Logo color="#1a1a1a" className="h-7 w-auto opacity-80" />
              <div className="ml-auto flex items-center gap-5 md:gap-6">
                <button onClick={consult} className="hidden rounded-sm bg-[#1e6b45] px-4 py-2 text-[0.72rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:inline-block">
                  Get Independent Advice
                </button>
                <button onClick={onClose} aria-label="Close" className="text-[11px] font-light tracking-[0.18em] text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]">
                  CLOSE
                </button>
              </div>
            </>
          ) : (
            <>
              <a href={basePath} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
              <button onClick={consult} className="ml-auto hidden rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.74rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:inline-block md:px-5">
                Get Independent Advice
              </button>
            </>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pb-[12vh] pt-[6vh] md:px-10">
        <div className={embedded ? "" : "xl:grid xl:grid-cols-[180px_minmax(0,1fr)] xl:gap-12"}>
          {/* Sticky report index — desktop, standalone page only */}
          {!embedded && (
            <nav className="hidden self-start xl:sticky xl:top-24 xl:block">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/35">Report index</p>
              <ul className="mt-4 space-y-2.5 border-l border-[#1a1a1a]/10">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="-ml-px block border-l border-transparent pl-4 text-[0.78rem] font-light text-[#1a1a1a]/50 transition-colors hover:border-[#c9a96e] hover:text-[#1a1a1a]">
                      {t.label}
                    </a>
                  </li>
                ))}
              </ul>
              <button onClick={consult} className="mt-7 w-full rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.72rem] font-medium tracking-[0.03em] text-white transition-colors hover:bg-[#238c55]">
                Get Independent Advice
              </button>
            </nav>
          )}

          <div className="min-w-0">
            {/* Breadcrumb / back to shortlist */}
            {embedded ? (
              <button onClick={onBack} className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/80">
                <span aria-hidden>&larr;</span> Back to shortlist
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/35">
                <a href={`${basePath}/intelligence/projects`} className="transition-colors hover:text-[#1a1a1a]/70">Projects</a>
                <span className="text-[#1a1a1a]/20">/</span>
                <span className="text-[#1a1a1a]/55">{p.name}</span>
              </div>
            )}

            {/* Hero */}
            <div className="mt-9 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <Eyebrow>Project Intelligence</Eyebrow>
                <h1 className="mt-5 font-serif text-[2.7rem] font-medium leading-[1.02] tracking-[-0.02em] md:text-[4rem]">{p.name}</h1>
                <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.92rem] font-light text-[#1a1a1a]/55">
                  {devHref ? <a href={devHref} className="underline decoration-[#c9a96e]/40 underline-offset-2 hover:text-[#1a1a1a]/80">{p.developer}</a> : <span>{p.developer}</span>}
                  <span className="text-[#1a1a1a]/25">·</span>
                  {marketHref ? <a href={marketHref} className="underline decoration-[#c9a96e]/40 underline-offset-2 hover:text-[#1a1a1a]/80">{p.market}</a> : <span>{p.market}</span>}
                  <span className="text-[#1a1a1a]/25">·</span>
                  <span>{p.configs.join(" · ")}</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topInMarket && <Chip>Top-scored in {p.marketShort}</Chip>}
                  {market && <Chip>{market.tier} corridor</Chip>}
                  {ops?.reraNote && <Chip>RERA registered</Chip>}
                </div>
                <button type="button" onClick={openUnitIntel} className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#1a1a1a]/15 bg-[#0a0f17] px-4 py-2 text-[0.78rem] font-medium text-white transition-colors hover:border-[#46c2ff]">
                  <span className="text-[#e0b667]">▦</span> See Unit Intelligence <span aria-hidden className="text-[#46c2ff]">→</span>
                </button>
              </div>
              {/* Truth Score */}
              <div className="flex shrink-0 items-end gap-5">
                <div className="text-right">
                  <p className="font-mono text-[3.4rem] font-light leading-none text-[#1e6b45] md:text-[4rem]">{p.truthScore}</p>
                  <p className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/40">Truth Score</p>
                </div>
                <div className="mb-2 flex flex-col items-start gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[0.66rem] font-medium ${recoTone(p.recommendation)}`}>{p.recommendation}</span>
                  <span className="text-[0.66rem] font-light text-[#1a1a1a]/40">{p.confidence} confidence</span>
                </div>
              </div>
            </div>

            {/* Truth Verdict */}
            <div className="mt-11 rounded-2xl border border-[#c9a96e]/30 bg-white/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-10">
              <Eyebrow>Truth Verdict</Eyebrow>
              <p className="mt-5 font-serif text-[1.4rem] font-normal leading-[1.5] md:text-[1.7rem]">{p.reason}</p>
              <p className="mt-6 border-t border-[#1a1a1a]/8 pt-5 text-[0.86rem] font-light leading-[1.7] text-[#1a1a1a]/55">
                <span className="font-medium text-[#1a1a1a]/70">Investor fit:</span> {investorFit(p)}
              </p>
            </div>

            {/* Match Score — personalisation hook (onboards cold visitors) */}
            <MatchScore project={p} />

            {/* Tower & Unit Intelligence — the gated deep-intel tier, surfaced high */}
            <TowerIntel project={p} meta={towerIntelMeta(p)} />

            {/* 01 · Vitals — one uniform grid, one type language */}
            <Section id="vitals" n={num()} title="Vitals">
              <div className="grid grid-cols-2 gap-x-6 gap-y-7 rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-8 md:grid-cols-4 md:p-10">
                <KV k="Ticket size" v={`₹${p.budget[0]}–${p.budget[1]} Cr`} />
                <KV k="Configurations" v={p.configs.join(" · ")} />
                <KV k="Corridor avg / sq ft" v={p.psf ? fmtPsf(p.psf.avg) : "—"} />
                <KV k="Indicative size" v={p.sizeBand ?? "—"} />
                {ops?.units != null && <KV k="Total units" v={`${ops.units.toLocaleString("en-IN")}`} />}
                {ops?.towers != null && <KV k="Towers / land" v={`${ops.towers}${ops.landAcres ? ` · ${ops.landAcres} acre` : ""}`} />}
                {ops?.density != null && <KV k="Density" v={`${ops.density} / acre`} tag={ops.density <= 50 ? "Low-density" : undefined} />}
                {ops?.openAreaPct != null && <KV k="Open area" v={`${ops.openAreaPct}%`} tag={ops.openAreaPct >= 80 ? "Green" : undefined} />}
                {ops?.carpetSqft != null && <KV k="Carpet (indicative)" v={`${ops.carpetSqft.toLocaleString("en-IN")} sq ft`} />}
                {ops?.launch && <KV k="Launched" v={ops.launch} />}
                {ops?.possession && <KV k="RERA possession" v={ops.possession} />}
                {ops?.reraId && <KV k="RERA ID" v={ops.reraId} />}
              </div>
              {ops?.reraNote && <Source>{ops.reraNote}. Sources: Haryana RERA registry & project filings.</Source>}
            </Section>

            <Chapter n="I" title="Can you trust it?" framing="The score, the builder, the build and the paperwork — each pressure-tested independently, never taken from the developer." />

            {/* 02 · Truth Score anatomy */}
            <Section id="anatomy" n={num()} title="Truth Score anatomy" flush>
              <p className="-mt-2 mb-7 max-w-2xl text-[0.95rem] font-light leading-[1.8] text-[#1a1a1a]/55">
                No black box. The score is built from six inputs, each assessed independently — never supplied by the developer. Here is where this project sits on every one.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {SCORE_INPUTS.map((s) => (
                  <RatingMeter key={s.key} rating={p.anatomy[s.key]} label={s.label} meaning={s.meaning} />
                ))}
              </div>
            </Section>

            {/* 03 · Developer analysis */}
            {dev && (
              <Section id="developer" n={num()} title="Developer analysis">
                <div className="rounded-2xl border-l-2 border-[#1e6b45]/40 bg-white/50 p-7 md:p-8">
                  <Eyebrow>Analyst assessment</Eyebrow>
                  <p className="mt-3 font-serif text-[1.25rem] leading-[1.4] md:text-[1.4rem]">{dev.verdict}</p>
                </div>

                {/* Execution track record */}
                <p className="mt-10 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/40">Execution track record</p>
                <div className="mt-4 rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-8">
                  <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
                    <Num v={`${dev.performance.launched}`} k="Projects launched" />
                    <Num v={`${dev.performance.delivered}`} k="Delivered" />
                    <Num v={`${dev.performance.ongoing}`} k="Ongoing" />
                    <Num v={`${dev.performance.onTimePct}%`} k="On-time record" accent />
                    <Num v={`${dev.performance.avgDelayMonths} mo`} k="Avg slippage" />
                  </div>
                  <div className="mt-7 flex h-[8px] overflow-hidden rounded-full bg-[#1a1a1a]/8">
                    <div className="h-full bg-[#1e6b45]" style={{ width: `${(dev.performance.delivered / dev.performance.launched) * 100}%` }} />
                    <div className="h-full bg-[#c9a96e]" style={{ width: `${(dev.performance.ongoing / dev.performance.launched) * 100}%` }} />
                  </div>
                  <div className="mt-3 flex gap-5 text-[0.66rem] font-light text-[#1a1a1a]/45">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#1e6b45]" /> Delivered</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#c9a96e]" /> Ongoing</span>
                  </div>
                </div>

                {/* Financial audit */}
                <p className="mt-10 flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/40">
                  Financial audit
                  <span className="rounded border border-[#1a1a1a]/12 px-1.5 py-0.5 text-[0.56rem] tracking-[0.08em] text-[#1a1a1a]/45">{dev.listed ? "Listed company" : "Privately held"}</span>
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {FIN_METRICS.map((f) => (
                    <RatingMeter key={f.key} rating={dev.financials[f.key]} label={f.full} meaning={f.meaning} />
                  ))}
                </div>
                <p className="mt-5 text-[0.86rem] font-light leading-[1.7] text-[#1a1a1a]/55">{dev.finNote}</p>
                <Source>Sources: Haryana RERA track record · latest annual &amp; financial filings / MCA statements. Independent read — not supplied by the developer.</Source>
              </Section>
            )}

            {/* 04 · Construction & sales velocity */}
            {con && (
              <Section id="construction" n={num()} title="Construction & sales velocity">
                <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
                  Live tracking of build progress and demand absorption against the promised RERA timeline.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-7">
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Build progress vs plan</p>
                    <div className="mt-5 space-y-4">
                      <ProgressBar label="Actual" value={con.actualPct} hint="latest QPR" />
                      <ProgressBar label="Expected" value={con.expectedPct} accent="#9a7a2e" />
                    </div>
                    <p className="mt-5 text-[0.8rem] font-light text-[#1a1a1a]/55">
                      {con.actualPct >= con.expectedPct
                        ? `Tracking ${con.actualPct - con.expectedPct} points ahead of schedule.`
                        : `Tracking ${con.expectedPct - con.actualPct} points behind schedule.`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-7">
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Sales momentum</p>
                    <div className="mt-5">
                      <ProgressBar label="Units absorbed" value={con.absorptionPct} accent="#1e6b45" />
                    </div>
                    <p className="mt-5 text-[0.8rem] font-light text-[#1a1a1a]/55">
                      {con.absorptionPct >= 90 ? "High demand — near or fully sold at current velocity." : "Steady absorption at current velocity."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-[#0d1a12] p-7 text-white sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.18em] text-white/45">Execution-adjusted delivery</p>
                    <p className="mt-2 font-mono text-[1.6rem] font-light">{con.predictedDate}</p>
                    <p className="mt-1 text-[0.74rem] font-light text-white/45">RERA-committed: {con.reraDate}</p>
                  </div>
                  <span className={`inline-flex w-fit items-center rounded-full border px-3.5 py-1.5 text-[0.74rem] font-medium ${aheadMonths >= 0 ? "border-[#3e8e62]/40 bg-[#1e6b45]/20 text-[#7fd6a4]" : "border-[#c9a96e]/40 bg-[#c9a96e]/15 text-[#e3c58a]"}`}>
                    {aheadMonths >= 0 ? `~${aheadMonths} months ahead of RERA` : `~${Math.abs(aheadMonths)} months behind RERA`}
                  </span>
                </div>
                <Source>Source: latest Quarterly Progress Report ({con.qpr}). Predicted date is our execution-adjusted model, not a developer commitment.</Source>
              </Section>
            )}

            {/* 05 · Legal & compliance */}
            <Section id="legal" n={num()} title="Legal & compliance">
              <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
                A forensic read of title, registration and developer litigation signals — and what each means for you as the buyer.
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {risks.map((r) => (
                  <div key={r.label} className={`rounded-xl border p-4 ${riskTone[r.level]}`}>
                    <p className="text-[0.6rem] font-medium uppercase tracking-[0.12em] opacity-70">{r.label}</p>
                    <p className="mt-2 text-[1.05rem] font-semibold uppercase tracking-[0.02em]">{r.level}</p>
                    <p className="mt-2 text-[0.66rem] font-light leading-[1.4] text-[#1a1a1a]/45">{r.note}</p>
                  </div>
                ))}
              </div>
              {dev && (
                <div className="mt-5 rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-7">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Developer legal signal</p>
                  <p className="mt-3 text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/70">{dev.legal}</p>
                </div>
              )}
              <div className="mt-4 rounded-2xl bg-[#1a1a1a] p-7 text-white md:p-8">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[#c9a96e]">Buyer due-diligence plan</p>
                <ol className="mt-4 space-y-3">
                  {[
                    `Verify the latest HRERA registration status and quarterly progress report for ${p.name} directly on haryanarera.gov.in.`,
                    "Have an independent lawyer review the Agreement to Sell clause-by-clause — penalty terms, force-majeure definitions and delay-compensation.",
                    "Confirm the title chain and that the land is free of encumbrance before any payment milestone.",
                    "Match your payment schedule to our execution-adjusted delivery estimate, not the marketing timeline.",
                  ].map((s, i) => (
                    <li key={i} className="flex gap-3 text-[0.88rem] font-light leading-[1.6] text-white/70">
                      <span className="mt-0.5 font-mono text-[0.72rem] text-[#c9a96e]">{i + 1}</span>{s}
                    </li>
                  ))}
                </ol>
              </div>
              <Source>Sources: E-Courts &amp; RERA litigation repositories. Signals are our independent read — verify project specifics before you sign.</Source>
            </Section>

            {market && <Chapter n="II" title="The investment case" framing="Where it sits in the corridor, and what the evidence says it could return — modelled, never promised." />}

            {/* 06 · Location intelligence */}
            {market && (
              <Section id="location" n={num()} title="Location intelligence" flush>
                <div className="rounded-2xl border-l-2 border-[#1e6b45]/40 bg-white/50 p-7 md:p-8">
                  <Eyebrow>Corridor verdict</Eyebrow>
                  <p className="mt-3 font-serif text-[1.25rem] leading-[1.4] md:text-[1.4rem]">{market.verdict}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-8 rounded-2xl border border-[#1a1a1a]/8 bg-white/40 p-8 md:grid-cols-4">
                  <Num v={fmtPsf(market.psf.low) + "–" + market.psf.high.toLocaleString("en-IN")} k="Price band / sq ft" />
                  <Num v={market.unitBand} k="Typical ticket" />
                  <Num v={market.appreciation3Y} k="3-yr appreciation" accent />
                  <Num v={`${market.projectCount}`} k="Projects tracked" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <InfoCard title="Where it stands" body={market.currentTrend} />
                  <InfoCard title="Where it's headed" body={market.futureTrend} />
                  <InfoCard title="Infrastructure" body={market.infra} />
                  <InfoCard title="Demand" body={market.demand} />
                </div>
                <Source>Sources: tracked corridor transactions, GMDA / HSVP infrastructure plans &amp; developer filings.</Source>
              </Section>
            )}

            {/* 07 · Projected ROI */}
            {roi && (
              <Section id="roi" n={num()} title="Projected ROI">
                <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
                  A {roi.horizonYears}-year outlook on a ₹{roi.ticketCr} Cr entry — anchored to the corridor&apos;s tracked appreciation, then adjusted for this developer&apos;s delivery record. Modelled, not guaranteed.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#1a1a1a]/10 bg-white/50 p-8">
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Corridor benchmark</p>
                    <p className="mt-4 font-mono text-[2.4rem] font-light leading-none">{roi.benchCagr}%<span className="ml-1.5 text-[0.9rem] text-[#1a1a1a]/40">CAGR</span></p>
                    <p className="mt-5 text-[0.82rem] font-light text-[#1a1a1a]/55">Projected value in {roi.horizonYears} yrs</p>
                    <p className="font-mono text-[1.2rem] text-[#1a1a1a]/80">₹{roi.benchValueCr} Cr</p>
                  </div>
                  <div className="rounded-2xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.04] p-8">
                    <p className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#1e6b45]">Execution-adjusted</p>
                    <p className="mt-4 font-mono text-[2.4rem] font-light leading-none text-[#1e6b45]">{roi.adjCagr}%<span className="ml-1.5 text-[0.9rem] text-[#1e6b45]/50">CAGR</span></p>
                    <p className="mt-5 text-[0.82rem] font-light text-[#1a1a1a]/55">Projected value in {roi.horizonYears} yrs</p>
                    <p className="font-mono text-[1.2rem] text-[#1a1a1a]/80">₹{roi.adjValueCr} Cr {roi.deltaCr !== 0 && <span className={`ml-1.5 text-[0.8rem] ${roi.deltaCr > 0 ? "text-[#1e6b45]" : "text-[#b0503e]"}`}>{roi.deltaCr > 0 ? "+" : ""}₹{roi.deltaCr} Cr</span>}</p>
                  </div>
                </div>
                <Source>Anchored to tracked 3-yr corridor appreciation of {roi.corridor3Y}, annualised and adjusted by the developer&apos;s on-time record. A model, not investment advice.</Source>
              </Section>
            )}

            <Chapter n="III" title="The honest read" framing="What genuinely stands out, what to watch, and the buyer this home is really for." />

            {/* 08 · Project USPs */}
            {usps.length > 0 && (
              <Section id="usps" n={num()} title="Project USPs" flush>
                <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
                  Non-obvious advantages that materially affect livability, safety and long-term value.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {usps.map((u) => (
                    <div key={u.title} className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-7">
                      <p className="font-serif text-[1.15rem] leading-[1.35]">{u.title}</p>
                      <p className="mt-3 text-[0.88rem] font-light leading-[1.7] text-[#1a1a1a]/60">{u.body}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* 09 · Strengths & watch-outs */}
            <Section id="strengths" n={num()} title="Strengths & watch-outs">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="rounded-2xl border border-[#1e6b45]/15 bg-[#1e6b45]/[0.04] p-7">
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#1e6b45]">What works</p>
                  <ul className="mt-4 space-y-3">
                    {p.strengths.map((s) => (
                      <li key={s} className="flex gap-3 text-[0.95rem] font-light leading-[1.6] text-[#1a1a1a]/70"><span className="mt-0.5 text-[#1e6b45]">+</span>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-[#9a7a2e]/20 bg-[#c9a96e]/[0.06] p-7">
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#9a7a2e]">What to watch</p>
                  <ul className="mt-4 space-y-3">
                    {p.watchouts.map((w) => (
                      <li key={w} className="flex gap-3 text-[0.95rem] font-light leading-[1.6] text-[#1a1a1a]/70"><span className="mt-0.5 text-[#9a7a2e]">!</span>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            {/* 10 · What this serves */}
            <Section id="serves" n={num()} title="What this serves">
              <p className="-mt-2 mb-5 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/50">The buyer priorities this project genuinely answers — on the evidence, not the brochure.</p>
              <div className="flex flex-wrap gap-2.5">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full border border-[#1a1a1a]/12 px-4 py-2 text-[0.82rem] font-light text-[#1a1a1a]/65">{t}</span>
                ))}
              </div>
            </Section>

            {faqs.length > 0 && <Chapter n="IV" title="Your decision" framing="The questions that actually decide it — and the cleanest ways to act on this read." />}

            {/* Forensic FAQs */}
            {faqs.length > 0 && (
              <Section id="faqs" n={num()} title="Forensic FAQs" flush>
                <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
                  Straight answers to the questions that decide the purchase — marrying registry data, live construction and micro-market dynamics.
                </p>
                <div className="divide-y divide-[#1a1a1a]/8 overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/50">
                  {faqs.map((f) => (
                    <details key={f.q} className="group px-6 py-5 md:px-7">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.98rem] font-medium text-[#1a1a1a]/85">
                        {f.q}
                        <span className="shrink-0 font-mono text-[1.1rem] text-[#c9a96e] transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-3 text-[0.9rem] font-light leading-[1.75] text-[#1a1a1a]/60">{f.a}</p>
                    </details>
                  ))}
                </div>
              </Section>
            )}

            {/* Context — developer + market (standalone page only) */}
            {!embedded && (
              <Section n={num()} title="Context">
                <div className="grid gap-5 md:grid-cols-2">
                  <ContextCard kicker="Developer" title={p.developer} href={devHref} cta="Open developer dossier" />
                  <ContextCard kicker="Location" title={p.market} href={marketHref} cta={`Open ${p.marketShort} intelligence`} />
                </div>
              </Section>
            )}

            {/* Alternatives */}
            {alts.length > 0 && (
              <section className="mt-16 border-t border-[#1a1a1a]/8 pt-12">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[0.8rem] text-[#c9a96e]">→</span>
                  <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] md:text-[2.1rem]">Also in {p.marketShort}</h2>
                </div>
                <div className="mt-8 divide-y divide-[#1a1a1a]/8 overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/50">
                  {alts.map((a) => {
                    const cls = "flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-white/70 md:p-6";
                    const inner = (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-[1.15rem] text-[#1a1a1a]">{a.name}</p>
                          <p className="mt-1 font-mono text-[0.68rem] tracking-[0.04em] text-[#1a1a1a]/40">{a.developer.toUpperCase()} · ₹{a.budget[0]}–{a.budget[1]} CR</p>
                        </div>
                        <span className={`hidden rounded-full border px-3 py-1 text-[0.64rem] font-medium sm:inline-block ${recoTone(a.recommendation)}`}>{a.recommendation}</span>
                        <span className="w-10 text-right font-mono text-[1.3rem] font-light text-[#1e6b45]">{a.truthScore}</span>
                      </>
                    );
                    return embedded ? (
                      <button key={a.slug} onClick={() => onSelectAlternative?.(a.name)} className={cls}>{inner}</button>
                    ) : (
                      <a key={a.slug} href={`${basePath}/intelligence/projects/${a.slug}`} className={cls}>{inner}</a>
                    );
                  })}
                </div>
              </section>
            )}

            {/* CTA — three actions, weighted */}
            <div className="relative mt-14 overflow-hidden rounded-2xl bg-[#111112] p-8 text-white md:p-10">
              <div className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(30,107,69,0.35), transparent 70%)", filter: "blur(28px)" }} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.6), transparent)" }} />
              <div className="relative">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-xl">
                    <h2 className="font-serif text-[1.7rem] font-medium leading-[1.15] md:text-[2rem]">Considering {p.name}?</h2>
                    <p className="mt-2 text-[0.88rem] font-light text-white/55">Get an independent read — the right price, the right stack, the honest risks — before you commit.</p>
                  </div>
                  <p className="shrink-0 text-[0.72rem] font-light leading-[1.5] text-white/40 md:text-right">We represent only you —<br className="hidden md:block" /> never the developer.</p>
                </div>
                <div className="mt-7 grid gap-3 md:grid-cols-3">
                  <ActionCell tone="primary" icon="●" title="Get Independent Advice" desc="45-min advisor call · fee refundable" onClick={consult} />
                  <ActionCell tone="secondary" icon="▦" title="See Unit Intelligence" desc="3D sun & unit model — free to explore" onClick={openUnitIntel} />
                  <ActionCell tone="ghost" icon="◆" title="Challenge TruthGuide" desc="Ask our AI anything about this project" onClick={challenge} />
                </div>
              </div>
            </div>

            <p className="mt-8 text-[0.72rem] font-light leading-[1.7] text-[#1a1a1a]/35">
              Independent assessment by Truth Estate. No developer can pay for a higher Truth Score or to appear here. The Truth Score, Match Score and any recommendation are our own evidence-based <span className="italic">opinions</span> as of the date shown — not a guarantee of performance, safety, appreciation or returns, and not investment, legal or financial advice. Ticket and price bands, ROI projections and delivery estimates are tracked or modelled figures that vary by tower, floor and stack. The decision, and its risks, are yours; we are not liable for the performance of any project. Verify specifics independently and see our{" "}
              <a href={`${basePath}/disclaimer`} className="underline decoration-[#1a1a1a]/20 underline-offset-2 transition-colors hover:text-[#1a1a1a]/60">full disclaimer</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: a single, clean primary CTA. The secondary "See Unit
          Intelligence" already appears on first scroll in the hero. */}
      <div className="sticky bottom-0 z-40 border-t border-[#1a1a1a]/10 bg-[#F5F0E8]/95 px-6 py-3 backdrop-blur md:hidden">
        <button onClick={consult} className="w-full rounded-sm bg-[#1e6b45] px-5 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
          Get Independent Advice
        </button>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[#1a1a1a]/12 bg-white/50 px-3 py-1 text-[0.66rem] font-medium tracking-[0.02em] text-[#1a1a1a]/55">{children}</span>;
}

function ActionCell({ tone, icon, title, desc, onClick }: { tone: "primary" | "secondary" | "ghost"; icon: string; title: string; desc: string; onClick: () => void }) {
  const box =
    tone === "primary" ? "bg-[#1e6b45] hover:bg-[#238c55]"
    : tone === "secondary" ? "border border-white/15 bg-white/[0.03] hover:border-[#46c2ff]/60"
    : "border border-white/10 bg-white/[0.01] hover:border-white/25";
  const iconColor = tone === "primary" ? "text-white/85" : tone === "secondary" ? "text-[#46c2ff]" : "text-[#c9a96e]";
  const titleColor = tone === "primary" ? "text-white" : "text-white/90";
  const descColor = tone === "primary" ? "text-white/70" : "text-white/45";
  return (
    <button onClick={onClick} className={`group flex flex-col gap-2 rounded-xl p-5 text-left transition-all duration-200 ${box}`}>
      <span className="flex items-center gap-2.5">
        <span className={`text-[0.9rem] ${iconColor}`} aria-hidden>{icon}</span>
        <span className={`text-[0.92rem] font-medium ${titleColor}`}>{title}</span>
        <span className={`ml-auto opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 ${titleColor}`} aria-hidden>→</span>
      </span>
      <span className={`text-[0.74rem] font-light leading-[1.4] ${descColor}`}>{desc}</span>
    </button>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-6">
      <p className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#c9a96e]">{title}</p>
      <p className="mt-2.5 text-[0.88rem] font-light leading-[1.7] text-[#1a1a1a]/65">{body}</p>
    </div>
  );
}

function Section({ id, n, title, children, flush }: { id?: string; n: string; title: string; children: React.ReactNode; flush?: boolean }) {
  return (
    <section id={id} className={`scroll-mt-24 ${flush ? "mt-9" : "mt-16 border-t border-[#1a1a1a]/8 pt-12 md:mt-20"}`}>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[0.8rem] text-[#c9a96e]">{n}</span>
        <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] text-[#1a1a1a] md:text-[2.1rem]">{title}</h2>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/* A narrative divider — chapters the report into a story instead of a stack
   of data dumps. The section that follows renders flush (no extra rule). */
function Chapter({ n, title, framing }: { n: string; title: string; framing: string }) {
  return (
    <div className="mt-20 border-t border-[#1a1a1a]/10 pt-11 md:mt-28">
      <span className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.26em] text-[#c9a96e]">Chapter {n}</span>
      <h2 className="mt-3.5 max-w-2xl font-serif text-[2.1rem] font-medium leading-[1.04] tracking-[-0.015em] md:text-[2.9rem]">{title}</h2>
      <p className="mt-3 max-w-xl text-[0.95rem] font-light leading-[1.7] text-[#1a1a1a]/50">{framing}</p>
    </div>
  );
}

function ContextCard({ kicker, title, href, cta }: { kicker: string; title: string; href?: string; cta: string }) {
  const body = (
    <>
      <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#c9a96e]">{kicker}</p>
      <p className="mt-3 font-serif text-[1.6rem] font-medium text-[#1a1a1a]">{title}</p>
      {href && <p className="mt-4 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#1e6b45]">{cta} <span aria-hidden>→</span></p>}
    </>
  );
  return href ? (
    <a href={href} className="group rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-7 transition-all duration-300 hover:border-[#c9a96e]/40 hover:bg-white/80">{body}</a>
  ) : (
    <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-7">{body}</div>
  );
}
