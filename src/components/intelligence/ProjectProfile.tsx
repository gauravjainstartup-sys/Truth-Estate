"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { useConsultation } from "../consultation/ConsultationProvider";
import { loadBuyData, hasPreferences, deriveDNA } from "@/lib/journey";
import type { ConsultProfileChip } from "@/lib/consultation";
import {
  fmtPsf,
  developerOf,
  marketOf,
  roiModel,
  investorFit,
  projectFaqs,
  towerIntelMeta,
  rankContext,
  reviewedOn,
  type ProjectIntel,
} from "@/lib/projects";
import MatchScore from "./MatchScore";
import TowerIntel, { openUnitIntel } from "./TowerIntel";
import ReportAnatomy from "./ReportAnatomy";
import ReportDeveloper from "./ReportDeveloper";
import ReportConstruction from "./ReportConstruction";
import ReportLegal from "./ReportLegal";
import ReportLocation from "./ReportLocation";
import ReportUSPs from "./ReportUSPs";
import ReportPrice from "./ReportPrice";
import ReportVerdict from "./ReportVerdict";
import ReportExplore from "./ReportExplore";
import ReportFeedback from "./ReportFeedback";
import ReportHomes from "./ReportHomes";

const basePath = "/Truth-Estate";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">{children}</p>;
}

const recoTone = (r: string) =>
  r.includes("Strong") ? "border-[#1e6b45]/30 text-[#1e6b45] bg-[#1e6b45]/8"
  : r === "Buy" ? "border-[#3e8e62]/30 text-[#3e8e62] bg-[#3e8e62]/8"
  : "border-[#9a7a2e]/30 text-[#9a7a2e] bg-[#c9a96e]/10";

/* A labelled key/value cell for the vitals grid. */
function KV({ k, v, tag }: { k: string; v: string; tag?: string }) {
  return (
    <div className="border-l-2 border-[#1a1a1a]/8 pl-4">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/35">{k}</p>
      <p className="mt-1.5 font-mono text-[0.88rem] font-medium leading-snug text-[#1a1a1a]/85 md:text-[0.95rem]">{v}</p>
      {tag && <span className="mt-1.5 inline-block whitespace-nowrap rounded bg-[#1e6b45]/8 px-1.5 py-0.5 font-sans text-[0.58rem] font-medium uppercase tracking-[0.08em] text-[#1e6b45]">{tag}</span>}
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
  const devHref = p.devSlug ? `${basePath}/intelligence/developers/${p.devSlug}` : undefined;
  const marketHref = p.marketSlug ? `${basePath}/intelligence/markets/${p.marketSlug}` : undefined;

  const dev = developerOf(p);
  const market = marketOf(p);
  const roi = roiModel(p);
  const faqs = projectFaqs(p);
  const ops = p.ops;
  const usps = ops?.usps ?? [];
  const ctx = rankContext(p);
  const reviewed = reviewedOn(p);
  const mapHref = ops?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${ops.address}`)}` : undefined;
  const buildStatus = ops?.construction
    ? `Mid-construction · ${ops.construction.actualPct}% built`
    : ops?.possession
    ? `Under construction · handover ${ops.possession}`
    : undefined;

  const con = ops?.construction;

  const toc = [
    { id: "match", label: "Match score", show: true },
    { id: "tower-intel", label: "Tower & unit intel", show: true },
    { id: "vitals", label: "Vitals", show: true },
    { id: "homes", label: "Homes & floor plans", show: (ops?.homes?.length ?? 0) > 0 },
    { id: "anatomy", label: "Truth Score anatomy", show: true },
    { id: "developer", label: "Developer DNA", show: !!dev },
    { id: "construction", label: "Construction & sales", show: !!con },
    { id: "legal", label: "Legal & compliance", show: true },
    { id: "location", label: "Location intelligence", show: !!market },
    { id: "usps", label: "Project USPs", show: usps.length > 0 },
    { id: "roi", label: "Price & returns", show: !!roi },
    { id: "verdict", label: "The verdict", show: true },
    { id: "strengths", label: "Strengths & watch-outs", show: true },
    { id: "faqs", label: "Straight answers", show: faqs.length > 0 },
  ].filter((t) => t.show);

  /* Sequential section numbers — only counts sections that actually render,
     so hidden modules never leave a gap in the sequence. */
  let _n = 0;
  const num = () => String(++_n).padStart(2, "0");

  /* Horizontal, swipeable section index with scroll-spy. Appears only once
     the reader scrolls past the hero (Apple local-nav pattern) — an overlay,
     so showing/hiding never shifts the page. */
  const tocKey = toc.map((t) => t.id).join(",");
  const [active, setActive] = useState<string>("");
  const [showStrip, setShowStrip] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (embedded) return;
    const firstId = tocKey.split(",")[0];
    let raf = 0;
    const check = () => {
      raf = 0;
      const el = document.getElementById(firstId);
      setShowStrip(el ? el.getBoundingClientRect().top <= 140 : window.scrollY > 480);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [embedded, tocKey]);
  const jumpTo = (id: string) => {
    setActive(id);
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 132, behavior: "smooth" });
  };
  useEffect(() => {
    if (embedded) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive((vis[0].target as HTMLElement).id);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    tocKey.split(",").forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [embedded, tocKey]);
  useEffect(() => {
    const strip = stripRef.current;
    if (!active || !strip) return;
    const chip = strip.querySelector(`[data-chip="${active}"]`) as HTMLElement | null;
    if (chip) strip.scrollTo({ left: chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  return (
    <div className={`${embedded ? "h-full overflow-y-auto" : "min-h-svh"} bg-[#F5F0E8] text-[#1a1a1a]`}>
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className={`mx-auto flex ${embedded ? "max-w-6xl" : "max-w-7xl"} items-center gap-4 px-6 py-4 md:px-10`}>
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
        {!embedded && (
          <nav aria-label="Report sections" aria-hidden={!showStrip}
            className={`absolute inset-x-0 top-full border-b border-[#1a1a1a]/8 bg-[#F5F0E8]/95 shadow-[0_8px_24px_-18px_rgba(26,26,26,0.35)] backdrop-blur-sm transition-all duration-300 ease-out ${showStrip ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"}`}>
            <div className="relative mx-auto max-w-7xl px-6 md:px-10">
              <div ref={stripRef} className="flex gap-1 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {toc.map((t) => (
                  <a key={t.id} href={`#${t.id}`} data-chip={t.id} onClick={(e) => { e.preventDefault(); jumpTo(t.id); }}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.75rem] transition-colors ${active === t.id ? "bg-[#1a1a1a] font-medium text-white" : "text-[#1a1a1a]/50 hover:bg-[#1a1a1a]/[0.06] hover:text-[#1a1a1a]"}`}>
                    {t.label}
                  </a>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#F5F0E8] to-transparent md:right-10" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#F5F0E8] to-transparent md:left-10" />
            </div>
          </nav>
        )}
      </header>

      <div className={`mx-auto ${embedded ? "max-w-6xl" : "max-w-7xl"} px-6 pb-[12vh] pt-[6vh] md:px-10`}>
        <div className={embedded ? "" : "xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-14"}>
          {/* Sticky conversion rail — the report stays left; this rail works the lead */}
          {!embedded && (
            // sticks below header + section strip (~118px of chrome)
            <aside className="hidden self-start xl:col-start-2 xl:row-start-1 xl:sticky xl:top-[132px] xl:block">
              <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0">
                    <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#1e6b45 0 ${Math.round((p.truthScore / 100) * 360)}deg, rgba(26,26,26,0.08) ${Math.round((p.truthScore / 100) * 360)}deg 360deg)` }} />
                    <div className="absolute inset-[3px] rounded-full bg-white" />
                    <span className="absolute inset-0 flex items-center justify-center font-serif text-[1.05rem] leading-none text-[#1e6b45]">{p.truthScore}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.56rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Truth Score</p>
                    <p className="text-[0.82rem] font-semibold text-[#1a1a1a]">{p.recommendation}<span className="font-light text-[#1a1a1a]/45"> · Top {ctx.topPct}%</span></p>
                  </div>
                </div>
                <button onClick={consult} className="mt-4 w-full rounded-lg bg-[#1e6b45] px-4 py-3 text-[0.8rem] font-semibold text-white transition-colors hover:bg-[#238c55]">Get Independent Advice</button>
                <p className="mt-2 text-center text-[0.62rem] font-light text-[#1a1a1a]/45">Independent — we don&apos;t sell inventory</p>
              </div>

              <a href="#tower-intel" className="mt-3 block rounded-2xl border border-[#9a7a2e]/25 bg-gradient-to-br from-[#9a7a2e]/[0.07] to-transparent p-5 transition-colors hover:border-[#9a7a2e]/45">
                <p className="flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#9a7a2e]"><IconBuilding className="text-[#9a7a2e]" /> Unlock the deep layer</p>
                <p className="mt-2 text-[0.83rem] font-medium leading-[1.5] text-[#1a1a1a]/85">Walk the live 3D, every unit&apos;s sun &amp; Vastu read, and the full 5-year price projection.</p>
                <p className="mt-2.5 text-[0.72rem] font-semibold text-[#9a7a2e]">From ₹1,499 · free with membership →</p>
              </a>

            </aside>
          )}

          <div className="min-w-0 xl:col-start-1 xl:row-start-1">
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
            <div className="mt-9 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Eyebrow>Project Intelligence</Eyebrow>
                {/* adaptive display type: long names step down a size and wrap balanced */}
                <h1 className={`mt-5 text-balance font-serif font-medium leading-[1.04] tracking-[-0.02em] ${p.name.length > 24 ? "text-[2.15rem] md:text-[3.1rem]" : "text-[2.7rem] md:text-[4rem]"}`}>{p.name}</h1>
                {ops?.address && (
                  <p className="mt-5 text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">
                    <IconPin className="mr-2 text-[#9a7a2e]" />
                    {mapHref ? (
                      <a href={mapHref} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#1a1a1a]/85">
                        {ops.address}<IconArrowUpRight className="ml-1 text-[#9a7a2e]" />
                      </a>
                    ) : ops.address}
                  </p>
                )}
                <p className="mt-2.5 text-[0.86rem] font-light text-[#1a1a1a]/45">
                  by {devHref ? <a href={devHref} className="font-medium text-[#1a1a1a]/65 transition-colors hover:text-[#1a1a1a]">{p.developer}</a> : <span className="font-medium text-[#1a1a1a]/65">{p.developer}</span>}
                  <span className="mx-2 text-[#1a1a1a]/20">·</span>{p.configs.join(" & ")}
                  <span className="mx-2 text-[#1a1a1a]/20">·</span>₹{p.budget[0]}–{p.budget[1]} Cr
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9a7a2e]/25 bg-white/60 px-3.5 py-1.5 text-[0.7rem] font-medium text-[#7a5f1e]">
                    <IconAward className="text-[#9a7a2e]" /> #{ctx.corridorRank} of {ctx.corridorCount} in {p.marketShort}
                  </span>
                  {buildStatus && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1a1a1a]/8 bg-white/60 px-3.5 py-1.5 text-[0.7rem] font-light text-[#1a1a1a]/55">
                      <IconBuilding className="text-[#c9a96e]" />{buildStatus}
                    </span>
                  )}
                </div>
              </div>
              {/* Truth Score seal + context */}
              <div className="flex shrink-0 items-center gap-6">
                <div className="relative h-[118px] w-[118px] md:h-[136px] md:w-[136px]">
                  <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#1e6b45 0 ${Math.round((p.truthScore / 100) * 360)}deg, rgba(26,26,26,0.08) ${Math.round((p.truthScore / 100) * 360)}deg 360deg)` }} />
                  <div className="absolute inset-[7px] rounded-full bg-[#F5F0E8]" />
                  {/* numeral optically centred; /100 + caption sit just beneath */}
                  <div className="absolute inset-0 flex translate-y-[6px] flex-col items-center justify-center" data-seal-group>
                    <span className="font-serif text-[3rem] font-normal leading-none text-[#1e6b45]">{p.truthScore}</span>
                    <span className="mt-1 font-mono text-[0.62rem] text-[#1a1a1a]/30">/ 100</span>
                    <span className="mt-1 text-[0.48rem] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/40">Truth Score</span>
                  </div>
                </div>
                <div>
                  <span className={`inline-block rounded-full border px-3.5 py-1 text-[0.72rem] font-semibold ${recoTone(p.recommendation)}`}>{p.recommendation}</span>
                  {ctx.delta > 0 && (
                    <p className="mt-2.5 flex items-center gap-2.5 text-[0.8rem] text-[#1a1a1a]/60"><span className="flex w-4 shrink-0 justify-center text-[#9a7a2e]"><IconTrendUp /></span><span><b className="font-semibold text-[#1a1a1a]">+{ctx.delta}</b> vs {p.marketShort} average</span></p>
                  )}
                  <p className="mt-1.5 flex items-center gap-2.5 text-[0.8rem] text-[#1a1a1a]/60"><span className="flex w-4 shrink-0 justify-center text-[#9a7a2e]"><IconTiers /></span><span><b className="font-semibold text-[#1a1a1a]">Top {ctx.topPct}%</b> of tracked projects</span></p>
                  <p className="mt-1.5 flex items-center gap-2.5 text-[0.8rem] text-[#1a1a1a]/60"><span className="flex w-4 shrink-0 justify-center text-[#9a7a2e]"><IconShieldCheck /></span><span><b className="font-semibold text-[#1a1a1a]">{p.confidence}</b> confidence · re-scored quarterly</span></p>
                  <p className="mt-2.5 flex items-center gap-2.5 text-[0.66rem] font-light tracking-[0.02em] text-[#1a1a1a]/40"><span className="flex w-4 shrink-0 justify-center text-[#1a1a1a]/40"><IconClock /></span>Data last reviewed {reviewed}</p>
                </div>
              </div>
            </div>

            {/* The short answer — the 10-second executive read. The word
               "verdict" belongs to exactly one thing: the profile-tailored
               call at the end of the report. */}
            <div className="mt-11 rounded-2xl border border-[#c9a96e]/30 bg-white/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-10">
              <Eyebrow>The short answer</Eyebrow>
              <p className="mt-5 font-serif text-[1.4rem] font-normal leading-[1.5] md:text-[1.7rem]">{p.reason}</p>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-t border-[#1a1a1a]/8 pt-5">
                <p className="max-w-xl text-[0.86rem] font-light leading-[1.7] text-[#1a1a1a]/55">
                  <span className="font-medium text-[#1a1a1a]/70">Best suited for:</span> {investorFit(p).replace(/^Best suited for\s+/i, "")}
                </p>
                <a href="#verdict" className="shrink-0 text-[0.78rem] font-semibold text-[#9a7a2e] transition-colors hover:text-[#7a5f1e]">
                  Your personalised verdict ↓
                </a>
              </div>
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

            {(ops?.homes?.length ?? 0) > 0 && (
              <Section id="homes" n={num()} title="The homes">
                <ReportHomes p={p} />
              </Section>
            )}

            <Chapter n="I" title="Can we trust it?" framing="Five forces decide whether a project keeps its promise — the developer, the build, the location, the paperwork, and what sets it apart. Here's how it scores on each, and exactly what moves the number." />

            {/* Truth Score anatomy — the composition spine */}
            <div id="anatomy" className="scroll-mt-24">
              <ReportAnatomy p={p} />
            </div>

            {/* Pillar I · Developer DNA — track record + financial audit */}
            {dev && (
              <div id="developer" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
                <ReportDeveloper p={p} />
              </div>
            )}

            {/* Pillar II · Construction & Sales */}
            {con && (
              <div id="construction" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
                <ReportConstruction p={p} />
              </div>
            )}

            {/* Pillar IV · Legal & Compliance */}
            <div id="legal" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
              <ReportLegal p={p} />
            </div>

            {/* Pillar III · Location Intelligence */}
            {market && (
              <div id="location" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
                <ReportLocation p={p} />
              </div>
            )}

            {/* Pillar V · Project USPs */}
            {usps.length > 0 && (
              <div id="usps" className="mt-16 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
                <ReportUSPs p={p} />
              </div>
            )}

            <Chapter n="II" title="Will it make money?" framing="Where this project's price has actually been, why it moved, and where our model says it's headed — then a calculator to plan your own money, cash flow and all." />

            {/* Price dynamics + projection + ROI calculator */}
            {roi && (
              <div id="roi" className="scroll-mt-24">
                <ReportPrice p={p} />
              </div>
            )}

            <Chapter n="III" title="Decision time." framing="One project, four different calls — the same evidence lands differently depending on what this purchase has to do for you." />

            {/* The verdict — profile-tailored */}
            <div id="verdict" className="scroll-mt-24">
              <ReportVerdict p={p} onConsult={consult} />
            </div>

            {/* Strengths & watch-outs */}
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

            {/* Straight answers */}
            {faqs.length > 0 && (
              <Section id="faqs" n={num()} title="Straight answers">
                <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
                  The questions that actually decide the purchase — answered from registry data, live construction and micro-market dynamics.
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

            {/* Keep exploring — nearby · same developer · similar budget */}
            <section className="mt-16 border-t border-[#1a1a1a]/8 pt-12">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[0.8rem] text-[#c9a96e]">→</span>
                <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] md:text-[2.1rem]">Keep exploring</h2>
              </div>
              <ReportExplore p={p} embedded={embedded} onSelect={onSelectAlternative} />
            </section>

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

            {/* Rate · report an error · share */}
            <ReportFeedback slug={p.slug} name={p.name} />

            <p className="mt-8 text-[0.72rem] font-light leading-[1.7] text-[#1a1a1a]/35">
              Independent assessment by Truth Estate. No developer can pay for a higher Truth Score or to appear here. The Truth Score, Match Score and any recommendation are our own evidence-based <span className="italic">opinions</span> as of {reviewed} — not a guarantee of performance, safety, appreciation or returns, and not investment, legal or financial advice. Ticket and price bands, ROI projections and delivery estimates are tracked or modelled figures that vary by tower, floor and stack. The decision, and its risks, are yours; we are not liable for the performance of any project. Verify specifics independently and see our{" "}
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

/* ── one consistent line-icon set for the hero (replaces ad-hoc unicode glyphs) ── */
const ICN = "inline-block h-[1.05em] w-[1.05em] shrink-0 align-[-0.15em]";
function IconPin({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M12 21c4.4-4 7-7.1 7-11a7 7 0 1 0-14 0c0 3.9 2.6 7 7 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>);
}
function IconArrowUpRight({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`inline-block h-[0.82em] w-[0.82em] shrink-0 align-[-0.02em] ${className}`} aria-hidden><path d="M8 16 16 8M9.5 8H16v6.5" /></svg>);
}
function IconAward({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><circle cx="12" cy="9" r="5" /><path d="M9.2 13.2 8 21l4-2.2L16 21l-1.2-7.8" /></svg>);
}
function IconBuilding({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h6A1.5 1.5 0 0 1 13 5.5V21" /><path d="M13 10h5.5A1.5 1.5 0 0 1 20 11.5V21" /><path d="M3 21h18M7 8h2M7 12h2M7 16h2M16 14h1M16 17.5h1" /></svg>);
}
function IconTrendUp({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M3 16.5 9 10.5l3.5 3.5L21 5.5" /><path d="M15 5.5h6v6" /></svg>);
}
function IconTiers({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M4 20h16" /><path d="M7 20v-3.5M12 20v-7M17 20v-10.5" /></svg>);
}
function IconShieldCheck({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><path d="M12 3 5 5.8v5.5c0 4 3 6.9 7 8.2 4-1.3 7-4.2 7-8.2V5.8L12 3Z" /><path d="M9 11.6 11 13.6 15 9.4" /></svg>);
}
function IconClock({ className = "" }: { className?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`${ICN} ${className}`} aria-hidden><circle cx="12" cy="12" r="8.2" /><path d="M12 7.6V12l3 1.8" /></svg>);
}
