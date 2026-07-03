"use client";

/* ════════════════════════════════════════════════════════════════
   THE DECISION DESK — an institutional investment memo for a project.
   Six screens, opinion-first: Overview → Why We Think This →
   Evidence → Personal Match → Alternatives → Recommendation.
   Left sticky nav, right context-aware TruthGuide, mobile bottom bar.
   The benchmark is a board memo, not a property portal.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";
import { useConsultation } from "../consultation/ConsultationProvider";
import { PROJECTS, MARKET_PROFILES } from "@/lib/journey";
import {
  buildProjectMemo,
  buildAlternatives,
  matchBrief,
  loadBriefs,
  saveBriefs,
  BRIEF_BUDGETS,
  BRIEF_TEMPLATES,
  type Brief,
  type BriefStore,
  type Confidence,
  type Verdict,
} from "@/lib/intelligence";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "why", label: "Why We Think This" },
  { id: "evidence", label: "Evidence" },
  { id: "match", label: "Personal Match" },
  { id: "alternatives", label: "Alternatives" },
  { id: "recommendation", label: "Recommendation" },
] as const;

type Props = {
  name: string;
  scrollRoot: React.RefObject<HTMLElement | null>;
  goProjects: () => void;
  goProject: (name: string) => void;
  goDeveloper: (name: string) => void;
  goLocation: (name: string) => void;
  doSearch: (q: string) => void;
};

export default function ProjectDecisionSystem({
  name,
  scrollRoot,
  goProjects,
  goProject,
  goDeveloper,
  goLocation,
  doSearch,
}: Props) {
  const p = useMemo(() => PROJECTS.find((x) => x.name === name), [name]);
  const memo = useMemo(() => (p ? buildProjectMemo(p) : null), [p]);
  const alternatives = useMemo(() => (p ? buildAlternatives(p) : []), [p]);

  const { openConsult } = useConsultation();
  const consult = () => openConsult({ source: name, sourceKind: "project", intent: "buy" });

  /* ── Brief / personalisation state ── */
  const [store, setStore] = useState<BriefStore>({ briefs: [], activeId: null });
  // Read saved briefs on mount only. We intentionally start empty so the first
  // client render matches the static server render, then hydrate from storage.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setStore(loadBriefs()), []);
  const activeBrief = store.briefs.find((b) => b.id === store.activeId) ?? null;
  const persist = (next: BriefStore) => {
    setStore(next);
    saveBriefs(next);
  };
  const addBrief = (brief: Brief) =>
    persist({ briefs: [...store.briefs.filter((b) => b.label !== brief.label), brief], activeId: brief.id });
  const setActiveBrief = (id: string) => persist({ ...store, activeId: id });

  const match = useMemo(() => (p && activeBrief ? matchBrief(p, activeBrief) : null), [p, activeBrief]);

  /* ── Scroll-spy against the workspace scroll container ── */
  const [active, setActive] = useState<string>("overview");
  useEffect(() => {
    const root = scrollRoot?.current ?? null;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { root, rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [scrollRoot, name]);

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (!p || !memo) {
    return <div className="p-12 text-center font-serif text-[#1a1a1a]/40">Project not found.</div>;
  }

  const topAlt = alternatives[0]?.name ?? "an alternative";

  return (
    <div className="relative">
      <div className="mx-auto grid max-w-[1340px] grid-cols-1 gap-0 px-5 md:px-8 lg:grid-cols-[176px_minmax(0,1fr)_300px] lg:gap-8 lg:px-10">
        {/* ───────────── LEFT STICKY NAV ───────────── */}
        <nav className="hidden lg:block">
          <div className="sticky top-8 py-12">
            <button
              onClick={goProjects}
              className="mb-8 flex items-center gap-1.5 text-[0.72rem] font-light text-[#1a1a1a]/35 transition-colors hover:text-[#1a1a1a]/70"
            >
              <span>←</span> Projects
            </button>
            <ul className="flex flex-col gap-1">
              {SECTIONS.map((s, i) => {
                const on = active === s.id;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => jump(s.id)}
                      className={`group flex w-full items-center gap-3 border-l-2 py-2 pl-3 text-left text-[0.78rem] font-light leading-tight transition-all duration-300 ${
                        on
                          ? "border-[#c9a96e] text-[#1a1a1a]"
                          : "border-[#1a1a1a]/8 text-[#1a1a1a]/35 hover:border-[#1a1a1a]/20 hover:text-[#1a1a1a]/65"
                      }`}
                    >
                      <span className={`text-[0.62rem] tabular-nums ${on ? "text-[#c9a96e]" : "text-[#1a1a1a]/25"}`}>
                        0{i + 1}
                      </span>
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* ───────────── CENTER — THE MEMO ───────────── */}
        <article className="min-w-0 pb-32 lg:pb-24">
          {/* Mobile breadcrumb */}
          <button
            onClick={goProjects}
            className="flex items-center gap-1.5 pt-8 text-[0.72rem] font-light text-[#1a1a1a]/35 lg:hidden"
          >
            <span>←</span> Projects
          </button>

          {/* ═══════ SCREEN 1 — THE DECISION DESK ═══════ */}
          <section id="overview" className="scroll-mt-6 pt-10 md:pt-16">
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#c9a96e]">Project Memo</p>
            <h1 className="mt-3 font-serif text-[2.2rem] font-medium leading-[1.08] text-[#1a1a1a] md:text-[3.1rem]">
              {p.name}
            </h1>

            {/* Meta row */}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-[#1a1a1a]/8 py-4">
              {[
                { l: "Developer", v: p.developer, on: () => goDeveloper(p.developer) },
                { l: "Micro-Market", v: p.market, on: () => goLocation(p.market) },
                { l: "Possession", v: memo.possession },
                { l: "RERA", v: memo.rera },
                { l: "Last Reviewed", v: memo.lastReviewed },
                { l: "Next Review", v: memo.nextReview },
              ].map((m) => (
                <div key={m.l}>
                  <p className="text-[8.5px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/30">{m.l}</p>
                  {m.on ? (
                    <button onClick={m.on} className="font-serif text-[0.92rem] font-medium text-[#1a1a1a] hover:text-[#1e6b45]">
                      {m.v}
                    </button>
                  ) : (
                    <p className="font-serif text-[0.92rem] font-medium text-[#1a1a1a]">{m.v}</p>
                  )}
                </div>
              ))}
            </div>

            {/* The score */}
            <div className="mt-12 flex flex-col items-center text-center">
              <span className="font-serif text-[4.6rem] font-medium leading-none text-[#1e6b45] md:text-[6rem]">
                {p.truthScore}
              </span>
              <span className="mt-2 text-[10px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/40">
                Truth Score &middot; out of 100
              </span>
              <div className="mt-5">
                <VerdictBadge verdict={memo.recommendation.verdict} />
              </div>
              <p className="mx-auto mt-5 max-w-[440px] text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/55">
                {memo.assessment}
              </p>
            </div>

            {/* Personalisation block */}
            <div className="mt-12">
              {activeBrief && match ? (
                <CompactMatch
                  briefs={store.briefs}
                  activeId={store.activeId}
                  onSelect={setActiveBrief}
                  pct={match.pct}
                  onJump={() => jump("match")}
                />
              ) : (
                <FindMyMatch defaultMarket={p.market} onCreate={addBrief} variant="compact" />
              )}
            </div>

            {/* Executive summary */}
            <div className="mt-12 border-t border-[#1a1a1a]/8 pt-10">
              <p className="mb-4 text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/30">Executive Summary</p>
              <p className="font-serif text-[1.18rem] font-light leading-[1.75] text-[#1a1a1a]/80 md:text-[1.42rem] md:leading-[1.7]">
                {memo.executiveSummary}
              </p>
            </div>

            {/* CTAs */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={consult}
                className="rounded-sm bg-[#1e6b45] px-8 py-3.5 text-[12px] font-medium tracking-[0.06em] text-white shadow-lg shadow-black/10 transition-all hover:bg-[#238c55]"
              >
                Request Independent Advice
              </button>
              <button
                onClick={() => doSearch(`Challenge the case — should I really buy ${p.name}?`)}
                className="rounded-sm border border-[#1a1a1a]/15 px-8 py-3.5 text-[12px] font-light tracking-[0.05em] text-[#1a1a1a]/65 transition-all hover:border-[#1a1a1a]/30"
              >
                Challenge TruthGuide
              </button>
            </div>
          </section>

          {/* ═══════ SCREEN 2 — WHY WE THINK THIS ═══════ */}
          <section id="why" className="scroll-mt-6 border-t border-[#1a1a1a]/8 pt-14 md:pt-20">
            <ScreenHeading n="02" kicker="The Reasoning" title="Why we think this." />
            <p className="mt-4 max-w-[560px] text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/50">
              Six independent reads on the project. Each is an opinion first — the evidence follows below.
            </p>
            <div className="mt-9 grid gap-px overflow-hidden rounded-xl border border-[#1a1a1a]/8 bg-[#1a1a1a]/[0.06] sm:grid-cols-2">
              {memo.insights.map((ins) => (
                <div key={ins.topic} className="flex flex-col gap-3 bg-white p-6 md:p-7">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#c9a96e]">{ins.topic}</p>
                    <ConfidencePill level={ins.confidence} />
                  </div>
                  <p className="font-serif text-[1.08rem] font-medium leading-snug text-[#1a1a1a]">{ins.finding}</p>
                  <p className="text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/50">{ins.whyItMatters}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════ SCREEN 3 — THE EVIDENCE ═══════ */}
          <section id="evidence" className="scroll-mt-6 border-t border-[#1a1a1a]/8 pt-14 md:pt-20">
            <ScreenHeading n="03" kicker="The Evidence" title="The evidence, chapter by chapter." />
            <p className="mt-4 max-w-[560px] text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/50">
              Each chapter reads like a single slide: the finding, the data behind it, the sources, and our
              interpretation. Open what matters to you.
            </p>
            <div className="mt-9 flex flex-col gap-2.5">
              {memo.chapters.map((c, i) => (
                <Chapter key={c.id} chapter={c} defaultOpen={i === 0} />
              ))}
            </div>
          </section>

          {/* ═══════ SCREEN 4 — PERSONALISED DECISION ═══════ */}
          <section id="match" className="scroll-mt-6 border-t border-[#1a1a1a]/8 pt-14 md:pt-20">
            <ScreenHeading n="04" kicker="Personal Match" title="Is this right for you?" />
            <div className="mt-9">
              {activeBrief && match ? (
                <div className="rounded-xl border border-[#1a1a1a]/8 bg-white p-7 md:p-9">
                  <div className="flex flex-col gap-7 md:flex-row md:items-start md:gap-10">
                    <div className="flex shrink-0 flex-col items-center">
                      <span className="font-serif text-[3.6rem] font-medium leading-none text-[#1e6b45]">{match.pct}%</span>
                      <span className="mt-1.5 text-[9px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">Match</span>
                    </div>
                    <div className="flex-1">
                      {store.briefs.length > 1 && (
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/30">Active brief</span>
                          {store.briefs.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => setActiveBrief(b.id)}
                              className={`rounded-full border px-3.5 py-1.5 text-[0.74rem] font-light transition-all ${
                                b.id === store.activeId
                                  ? "border-[#1e6b45]/40 bg-[#1e6b45]/[0.06] text-[#1e6b45]"
                                  : "border-[#1a1a1a]/12 text-[#1a1a1a]/50 hover:border-[#1a1a1a]/25"
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="font-serif text-[1.12rem] font-light leading-relaxed text-[#1a1a1a]/80 md:text-[1.3rem]">
                        {match.reason}
                      </p>
                      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
                        {match.factors.map((f) => (
                          <span key={f.label} className="flex items-center gap-2 text-[0.82rem] font-light text-[#1a1a1a]/55">
                            <span className={f.hit ? "text-[#1e6b45]" : "text-[#1a1a1a]/25"}>{f.hit ? "✓" : "—"}</span>
                            {f.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <FindMyMatch defaultMarket={p.market} onCreate={addBrief} variant="full" />
              )}
            </div>
          </section>

          {/* ═══════ SCREEN 5 — ALTERNATIVES ═══════ */}
          <section id="alternatives" className="scroll-mt-6 border-t border-[#1a1a1a]/8 pt-14 md:pt-20">
            <ScreenHeading n="05" kicker="Alternatives" title="If not this, then what?" />
            <p className="mt-4 max-w-[560px] text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/50">
              Three projects worth investigating before you commit.
            </p>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {alternatives.map((a) => (
                <div key={a.name} className="flex flex-col rounded-xl border border-[#1a1a1a]/8 bg-white p-6">
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => goProject(a.name)}
                      className="text-left font-serif text-[1.12rem] font-medium leading-tight text-[#1a1a1a] hover:text-[#1e6b45]"
                    >
                      {a.name}
                    </button>
                    <div className="shrink-0 text-right">
                      <span className="font-serif text-[1.4rem] font-medium leading-none text-[#1e6b45]">{a.truthScore}</span>
                      <p className="text-[8px] font-light uppercase tracking-[0.15em] text-[#1a1a1a]/30">Score</p>
                    </div>
                  </div>
                  <p className="mt-1 text-[0.72rem] font-light text-[#1a1a1a]/35">
                    {a.developer} &middot; {a.market}
                  </p>
                  <p className="mt-4 flex-1 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/55">{a.difference}</p>
                  <button
                    onClick={() => doSearch(`${p.name} vs ${a.name}`)}
                    className="mt-5 self-start rounded-sm border border-[#1a1a1a]/15 px-5 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/65 transition-all hover:border-[#1e6b45]/40 hover:text-[#1e6b45]"
                  >
                    Compare
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════ SCREEN 6 — FINAL RECOMMENDATION ═══════ */}
          <section id="recommendation" className="scroll-mt-6 border-t border-[#1a1a1a]/8 pt-14 md:pt-20">
            <ScreenHeading n="06" kicker="The Recommendation" title="Where we land." />
            <div className="mt-9 rounded-xl border border-[#1a1a1a]/8 bg-white p-8 md:p-12">
              <div className="flex flex-wrap items-center gap-4">
                <VerdictBadge verdict={memo.recommendation.verdict} large />
                <ConfidencePill level={memo.recommendation.confidence} withLabel />
              </div>
              <p className="mt-7 font-serif text-[1.5rem] font-light leading-[1.5] text-[#1a1a1a] md:text-[2rem] md:leading-[1.45]">
                {memo.recommendation.statement}
              </p>

              <div className="mt-10 grid gap-8 border-t border-[#1a1a1a]/8 pt-8 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">Key Watchouts</p>
                  <ul className="flex flex-col gap-2.5">
                    {memo.recommendation.watchouts.map((w) => (
                      <li key={w} className="flex gap-2.5 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/60">
                        <span className="mt-0.5 text-[#c9a96e]">!</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">Review Timeline</p>
                  <p className="text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/60">
                    {memo.recommendation.reviewTimeline}
                  </p>
                  <p className="mt-3 text-[0.78rem] font-light text-[#1a1a1a]/35">
                    Next scheduled review &middot; {memo.nextReview}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 border-t border-[#1a1a1a]/8 pt-8 sm:flex-row">
                <button
                  onClick={consult}
                  className="rounded-sm bg-[#1e6b45] px-8 py-3.5 text-[12px] font-medium tracking-[0.06em] text-white shadow-lg shadow-black/10 transition-all hover:bg-[#238c55]"
                >
                  Request Independent Advice
                </button>
                <button
                  onClick={() => doSearch(`Would you personally invest in ${p.name}?`)}
                  className="rounded-sm border border-[#1a1a1a]/15 px-8 py-3.5 text-[12px] font-light tracking-[0.05em] text-[#1a1a1a]/65 transition-all hover:border-[#1a1a1a]/30"
                >
                  Challenge TruthGuide
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-[0.72rem] font-light leading-relaxed text-[#1a1a1a]/30">
              Truth Estate is independent. No developer can pay for a higher Truth Score, a recommendation, or to appear here.
            </p>
          </section>
        </article>

        {/* ───────────── RIGHT — TRUTHGUIDE ───────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 py-12">
            <TruthGuidePanel projectName={p.name} topAlt={topAlt} doSearch={doSearch} />
          </div>
        </aside>
      </div>

      {/* ───────────── MOBILE BOTTOM BAR ───────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1a1a1a]/10 bg-[#F5F0E8]/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[600px] items-stretch gap-2 px-4 py-3">
          <button
            onClick={() => jump("match")}
            className="flex-1 rounded-sm border border-[#1a1a1a]/15 py-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#1a1a1a]/65"
          >
            Find My Match
          </button>
          <button
            onClick={() => doSearch(`Should I buy ${p.name}?`)}
            className="flex-1 rounded-sm border border-[#1a1a1a]/15 py-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#1a1a1a]/65"
          >
            TruthGuide
          </button>
          <button
            onClick={consult}
            className="flex-[1.4] rounded-sm bg-[#1e6b45] py-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-white"
          >
            Request Advice
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════ */

function ScreenHeading({ n, kicker, title }: { n: string; kicker: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#c9a96e]">
        <span className="mr-3 text-[#1a1a1a]/25">{n}</span>
        {kicker}
      </p>
      <h2 className="mt-3 font-serif text-[1.9rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.5rem]">{title}</h2>
    </div>
  );
}

const CONF_STYLE: Record<Confidence, string> = {
  High: "border-[#1e6b45]/25 bg-[#1e6b45]/[0.07] text-[#1e6b45]",
  Medium: "border-[#c9a96e]/40 bg-[#c9a96e]/[0.12] text-[#9a7a2e]",
  Low: "border-[#a35a3a]/25 bg-[#a35a3a]/[0.07] text-[#a35a3a]",
};

function ConfidencePill({ level, withLabel }: { level: Confidence; withLabel?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] ${CONF_STYLE[level]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {withLabel ? `${level} Confidence` : level}
    </span>
  );
}

const VERDICT_STYLE: Record<Verdict, { c: string; bg: string; dot: string }> = {
  Proceed: { c: "text-[#1e6b45]", bg: "border-[#1e6b45]/25 bg-[#1e6b45]/[0.06]", dot: "bg-[#1e6b45]" },
  Watch: { c: "text-[#9a7a2e]", bg: "border-[#c9a96e]/40 bg-[#c9a96e]/[0.1]", dot: "bg-[#c9a96e]" },
  Wait: { c: "text-[#b5852f]", bg: "border-[#b5852f]/30 bg-[#b5852f]/[0.08]", dot: "bg-[#b5852f]" },
  Avoid: { c: "text-[#a33a3a]", bg: "border-[#a33a3a]/30 bg-[#a33a3a]/[0.07]", dot: "bg-[#a33a3a]" },
};

function VerdictBadge({ verdict, large }: { verdict: Verdict; large?: boolean }) {
  const s = VERDICT_STYLE[verdict];
  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-full border ${s.bg} ${
        large ? "px-5 py-2" : "px-4 py-1.5"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      <span className={`font-serif font-medium ${s.c} ${large ? "text-[1.15rem]" : "text-[0.9rem]"}`}>
        Truth Estate: {verdict}
      </span>
    </span>
  );
}

/* ── An evidence chapter — a consulting slide as an accordion ── */
function Chapter({ chapter, defaultOpen }: { chapter: ReturnType<typeof buildProjectMemo>["chapters"][number]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-[#1a1a1a]/8 bg-white">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 px-6 py-5 text-left md:px-7">
        <div className="flex-1">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#c9a96e]">{chapter.topic}</p>
          <p className="mt-1.5 font-serif text-[1.04rem] font-medium leading-snug text-[#1a1a1a]">{chapter.keyFinding}</p>
        </div>
        <span
          className={`shrink-0 text-[1.2rem] font-light text-[#1a1a1a]/30 transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>

      {open && (
        <div className="border-t border-[#1a1a1a]/8 px-6 pb-7 pt-6 md:px-7">
          <p className="text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/60">{chapter.summary}</p>

          {/* Visual evidence + supporting data */}
          <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-[#1a1a1a]/8 bg-[#1a1a1a]/[0.06] sm:grid-cols-3">
            {chapter.metrics.map((m) => (
              <Stat key={m.label} label={m.label} value={m.value} note={m.note} />
            ))}
          </div>

          {/* Sources */}
          <div className="mt-6">
            <p className="mb-2.5 text-[8.5px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/30">Source Documents</p>
            <div className="flex flex-wrap gap-2">
              {chapter.sources.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#1a1a1a]/10 px-3 py-1.5 text-[0.72rem] font-light text-[#1a1a1a]/50"
                >
                  <span className="text-[#c9a96e]">◆</span>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Interpretation */}
          <div className="mt-6 border-l-2 border-[#c9a96e]/40 pl-4">
            <p className="mb-1 text-[8.5px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">Truth Estate Interpretation</p>
            <p className="font-serif text-[0.95rem] font-light italic leading-relaxed text-[#1a1a1a]/70">
              {chapter.interpretation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  const m = /^(\d{1,3})%$/.exec(value);
  const pct = m ? Math.min(100, parseInt(m[1], 10)) : null;
  return (
    <div className="bg-white p-4 md:p-5">
      <p className="text-[8.5px] font-light uppercase tracking-[0.18em] text-[#1a1a1a]/30">{label}</p>
      <p className="mt-1.5 font-serif text-[1.15rem] font-medium text-[#1a1a1a]">{value}</p>
      {pct != null && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#1a1a1a]/8">
          <div className="h-full rounded-full bg-[#1e6b45]" style={{ width: `${pct}%` }} />
        </div>
      )}
      {note && <p className="mt-1.5 text-[0.68rem] font-light text-[#1a1a1a]/35">{note}</p>}
    </div>
  );
}

/* ── Compact match strip shown on the overview screen ── */
function CompactMatch({
  briefs,
  activeId,
  onSelect,
  pct,
  onJump,
}: {
  briefs: Brief[];
  activeId: string | null;
  onSelect: (id: string) => void;
  pct: number;
  onJump: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-[#1a1a1a]/8 bg-white px-6 py-5">
      <div className="flex items-baseline gap-2.5">
        <span className="font-serif text-[2rem] font-medium leading-none text-[#1e6b45]">{pct}%</span>
        <span className="text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">Your Match</span>
      </div>
      {briefs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {briefs.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-light transition-all ${
                b.id === activeId
                  ? "border-[#1e6b45]/40 bg-[#1e6b45]/[0.06] text-[#1e6b45]"
                  : "border-[#1a1a1a]/12 text-[#1a1a1a]/50 hover:border-[#1a1a1a]/25"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={onJump}
        className="ml-auto text-[0.78rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1e6b45]"
      >
        See the breakdown →
      </button>
    </div>
  );
}

/* ── Find My Match — a ~60-second brief, no login ── */
function FindMyMatch({
  defaultMarket,
  onCreate,
  variant,
}: {
  defaultMarket: string;
  onCreate: (b: Brief) => void;
  variant: "compact" | "full";
}) {
  const [openForm, setOpenForm] = useState(variant === "full");
  const [tmplIdx, setTmplIdx] = useState(0);
  const [budgetIdx, setBudgetIdx] = useState(2);
  const [markets, setMarkets] = useState<string[]>([defaultMarket]);

  const submit = () => {
    const t = BRIEF_TEMPLATES[tmplIdx];
    onCreate({
      id: `${t.label}-${Date.now()}`,
      label: t.label,
      goal: t.goal,
      budgetCr: BRIEF_BUDGETS[budgetIdx].cr,
      markets,
      priorities: t.priorities,
    });
  };

  if (!openForm) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-[#1a1a1a]/15 bg-white px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-[1.15rem] font-medium text-[#1a1a1a]">Would this project be right for you?</p>
          <p className="mt-1 text-[0.82rem] font-light text-[#1a1a1a]/45">
            Build a quick brief and we&apos;ll score the fit. 60 seconds &middot; no login required.
          </p>
        </div>
        <button
          onClick={() => setOpenForm(true)}
          className="shrink-0 rounded-sm bg-[#1e6b45] px-7 py-3 text-[11px] font-medium tracking-[0.08em] text-white transition-all hover:bg-[#238c55]"
        >
          Find My Match
        </button>
      </div>
    );
  }

  const toggleMarket = (m: string) =>
    setMarkets((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <div className="rounded-xl border border-[#1a1a1a]/8 bg-white p-6 md:p-8">
      <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#c9a96e]">Find My Match</p>
      <p className="mt-2 font-serif text-[1.3rem] font-medium text-[#1a1a1a]">Tell us the essentials.</p>

      {/* Goal */}
      <div className="mt-6">
        <p className="mb-2.5 text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/35">This is for</p>
        <div className="flex flex-wrap gap-2">
          {BRIEF_TEMPLATES.map((t, i) => (
            <Chip key={t.label} on={i === tmplIdx} onClick={() => setTmplIdx(i)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="mt-6">
        <p className="mb-2.5 text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/35">Budget</p>
        <div className="flex flex-wrap gap-2">
          {BRIEF_BUDGETS.map((b, i) => (
            <Chip key={b.label} on={i === budgetIdx} onClick={() => setBudgetIdx(i)}>
              {b.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Markets */}
      <div className="mt-6">
        <p className="mb-2.5 text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/35">Preferred markets</p>
        <div className="flex flex-wrap gap-2">
          {MARKET_PROFILES.map((m) => (
            <Chip key={m.name} on={markets.includes(m.name)} onClick={() => toggleMarket(m.name)}>
              {m.short}
            </Chip>
          ))}
        </div>
      </div>

      <button
        onClick={submit}
        className="mt-8 rounded-sm bg-[#1e6b45] px-8 py-3.5 text-[12px] font-medium tracking-[0.06em] text-white shadow-lg shadow-black/10 transition-all hover:bg-[#238c55]"
      >
        See My Match →
      </button>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[0.8rem] font-light transition-all ${
        on
          ? "border-[#1e6b45]/40 bg-[#1e6b45]/[0.06] text-[#1e6b45]"
          : "border-[#1a1a1a]/12 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/25 hover:text-[#1a1a1a]/80"
      }`}
    >
      {children}
    </button>
  );
}

/* ── The context-aware TruthGuide panel ── */
function TruthGuidePanel({ projectName, topAlt, doSearch }: { projectName: string; topAlt: string; doSearch: (q: string) => void }) {
  const [q, setQ] = useState("");
  const prompts = [
    `Should I buy ${projectName}?`,
    `Compare ${projectName} with ${topAlt}`,
    `What are the risks with ${projectName}?`,
    `Would you personally invest in ${projectName}?`,
  ];
  return (
    <div className="rounded-xl border border-[#1a1a1a]/8 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1e6b45]" />
        <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#c9a96e]">TruthGuide</p>
      </div>
      <p className="mt-3 font-serif text-[1.1rem] font-medium leading-snug text-[#1a1a1a]">
        Ask anything. It already knows {projectName}.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {prompts.map((pr) => (
          <button
            key={pr}
            onClick={() => doSearch(pr)}
            className="rounded-lg border border-[#1a1a1a]/8 px-3.5 py-2.5 text-left text-[0.8rem] font-light leading-snug text-[#1a1a1a]/60 transition-all hover:border-[#c9a96e]/40 hover:text-[#1a1a1a]/85"
          >
            {pr}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#1a1a1a]/10 px-3 py-2 focus-within:border-[#c9a96e]/40">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim()) {
              doSearch(q.trim());
              setQ("");
            }
          }}
          placeholder="Ask TruthGuide…"
          className="flex-1 bg-transparent text-[0.82rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30"
        />
        <button
          onClick={() => {
            if (q.trim()) {
              doSearch(q.trim());
              setQ("");
            }
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e6b45] text-white"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
