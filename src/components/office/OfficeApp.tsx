"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import {
  CONSULT_DAYPARTS,
  CONSULT_DAYS,
  CONSULT_FORMATS,
} from "@/lib/consultation";
import {
  BuyMandate,
  Curation,
  DealOffer,
  DealStage,
  DEAL_PHASES,
  Negotiation,
  OfficeDoc,
  OfficeRec,
  OfficeState,
  OfficeThread,
  SaleOffer,
  SiteVisit,
  STAGE_ARC,
  STAGE_ORDER,
  STAGE_LABEL,
  SECTIONS,
  SectionKey,
  INR,
  MANDATE_FEE,
  activateMandate,
  callDone,
  dealDocs,
  dealPhaseIndex,
  isCurated,
  isPaid,
  loadOffice,
  newQuestion,
  nextStep,
  reseedOffice,
  saveOffice,
  stageIndex,
  wins,
} from "@/lib/office";

/* ════════════════════════════════════════════════════════════════
   THE PRIVATE OFFICE — routed client portal (Phase 1)
   ════════════════════════════════════════════════════════════════ */
export default function OfficeApp({ section }: { section: SectionKey }) {
  const [state, setState] = useState<OfficeState | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  useEffect(() => setState(loadOffice()), []);

  if (!state) {
    return <div className="min-h-svh bg-[#F5F0E8]" />;
  }

  const active = state.threads.find((t) => t.id === state.activeId) ?? state.threads[0];

  const update = (next: OfficeState) => {
    saveOffice(next);
    setState({ ...next });
  };
  const patchThread = (id: string, patch: Partial<OfficeThread>) =>
    update({ ...state, threads: state.threads.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  const setActive = (id: string) => update({ ...state, activeId: id });
  const setStage = (stage: DealStage) => patchThread(active.id, { stage });
  const cheer = (msg: string) => {
    setCelebrate(msg);
    setTimeout(() => setCelebrate(null), 4200);
  };
  const activate = () => {
    patchThread(active.id, activateMandate());
    setPayOpen(false);
    cheer("Mandate activated — we're representing you.");
  };
  const advanceTo = (stage: DealStage, msg?: string) => {
    patchThread(active.id, { stage });
    if (msg) cheer(msg);
  };

  return (
    <div className="flex min-h-svh w-full flex-col bg-[#F5F0E8] text-[#1a1a1a] md:flex-row">
      {/* ── Sidebar ── */}
      <aside className="sticky top-0 z-30 flex shrink-0 flex-col border-b border-[#1a1a1a]/8 bg-[#F5F0E8]/95 px-5 py-4 backdrop-blur-sm md:h-svh md:w-64 md:border-b-0 md:border-r md:px-6 md:py-7">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Home">
            <Logo color="#1a1a1a" className="h-7 w-auto opacity-80" />
          </Link>
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="text-[11px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/50 md:hidden"
          >
            {navOpen ? "Close" : "Menu"}
          </button>
        </div>

        <nav className={`${navOpen ? "flex" : "hidden"} mt-5 flex-col gap-0.5 md:mt-10 md:flex`}>
          {SECTIONS.filter((s) => !s.paidOnly || isPaid(active.stage) || s.key === section).map((s) => {
            const on = s.key === section;
            return (
              <Link
                key={s.key}
                href={s.path}
                className={`rounded-md px-3.5 py-2.5 text-[0.88rem] font-light tracking-[0.01em] transition-colors duration-200 ${
                  on ? "bg-[#1a1a1a]/[0.06] font-normal text-[#1a1a1a]" : "text-[#1a1a1a]/55 hover:bg-[#1a1a1a]/[0.04] hover:text-[#1a1a1a]/85"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
          <Link href="/" className="mt-6 px-3.5 text-[11px] font-light tracking-[0.16em] text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]">
            ← Back to site
          </Link>
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-6 py-9 md:px-12 md:py-12">
          {/* Thread switcher + preview control */}
          <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {state.threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`rounded-full border px-4 py-1.5 text-[0.78rem] font-light tracking-[0.02em] transition-all duration-200 ${
                    t.id === active.id
                      ? "border-[#1e6b45] bg-[#1e6b45] text-white"
                      : "border-[#1a1a1a]/15 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]"
                  }`}
                >
                  {t.label}
                  <span className="ml-2 opacity-70">{t.kind === "sell" ? "· Sell" : t.title.split(" · ")[0]}</span>
                </button>
              ))}
              {isPaid(active.stage) && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a96e]/50 bg-[#c9a96e]/[0.12] px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-[#9a7a2e]">
                  <span aria-hidden>★</span> Mandate Active
                </span>
              )}
            </div>
            <PreviewStage value={active.stage} onChange={setStage} onReset={() => update(reseedOffice())} />
          </div>

          {section === "home" && <HomeSection thread={active} />}
          {section === "requirements" && <RequirementsSection state={state} activeId={active.id} onPick={setActive} />}
          {section === "recommendations" && <RecommendationsSection thread={active} onActivate={() => setPayOpen(true)} />}
          {section === "deal" && <DealSection thread={active} onAdvance={advanceTo} onActivate={() => setPayOpen(true)} />}
          {section === "advice" && <AdviceSection thread={active} onReschedule={(c) => patchThread(active.id, { call: c })} />}
          {section === "questions" && (
            <QuestionsSection thread={active} onAsk={(q) => patchThread(active.id, { questions: q })} />
          )}
          {section === "documents" && <DocumentsSection thread={active} />}
          {section === "portfolio" && <PortfolioSection thread={active} />}
        </div>
        {payOpen && <PaymentSheet thread={active} onClose={() => setPayOpen(false)} onPay={activate} />}
        {celebrate && <Celebrate message={celebrate} />}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ════════════════════════════════════════════════════════════════ */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#c9a96e]">{children}</p>;
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <Eyebrow>{kicker}</Eyebrow>
      <h1 className="mt-3 font-serif text-[2rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.7rem]">{title}</h1>
      {sub && <p className="mt-3 max-w-[560px] text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55">{sub}</p>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-[#1a1a1a]/[0.08] bg-white p-6 ${className}`}>{children}</div>;
}

function LockBadge({ label = "Locked" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c9a96e]/15 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-[#9a7a2e]">
      <span aria-hidden>🔒</span>
      {label}
    </span>
  );
}

function recTone(s: OfficeRec["status"]) {
  return s === "recommended"
    ? "border-[#1e6b45]/30 bg-[#1e6b45]/8 text-[#1e6b45]"
    : s === "rejected"
    ? "border-[#b0503e]/25 bg-[#b0503e]/[0.06] text-[#b0503e]"
    : s === "new"
    ? "border-[#9a7a2e]/30 bg-[#c9a96e]/10 text-[#9a7a2e]"
    : "border-[#1a1a1a]/15 bg-[#1a1a1a]/[0.03] text-[#1a1a1a]/55";
}

/* The journey arc — dots span the width; labels show on desktop, and a
   current-step caption stands in on mobile (7 labels don't fit a phone). */
function StageArc({ stage }: { stage: DealStage }) {
  const cur = stageIndex(stage);
  let hereIdx = 0;
  STAGE_ARC.forEach((m, i) => {
    if (stageIndex(m.stage) <= cur) hereIdx = i;
  });

  return (
    <div>
      {/* Mobile current-step caption */}
      <div className="mb-3 flex items-baseline justify-between sm:hidden">
        <span className="text-[0.82rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]">{STAGE_ARC[hereIdx].short}</span>
        <span className="text-[0.66rem] font-light uppercase tracking-[0.12em] text-[#1a1a1a]/40">Step {hereIdx + 1} of {STAGE_ARC.length}</span>
      </div>
      <div className="flex items-center">
        {STAGE_ARC.map((m, i) => {
          const mi = stageIndex(m.stage);
          const done = mi < cur;
          const here = mi === cur || (i < STAGE_ARC.length - 1 && cur > mi && cur < stageIndex(STAGE_ARC[i + 1].stage));
          const reached = mi <= cur;
          return (
            <div key={m.stage} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border text-[0.6rem] ${
                    reached ? "border-[#1e6b45] bg-[#1e6b45] text-white" : "border-[#1a1a1a]/20 bg-[#F5F0E8] text-[#1a1a1a]/30"
                  } ${here ? "ring-2 ring-[#1e6b45]/25 ring-offset-2 ring-offset-white sm:ring-0" : ""}`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={`mt-2 hidden whitespace-nowrap text-[0.62rem] font-light uppercase tracking-[0.1em] sm:block ${here ? "text-[#1a1a1a]" : "text-[#1a1a1a]/40"}`}>
                  {m.short}
                </span>
              </div>
              {i < STAGE_ARC.length - 1 && (
                <span className={`mx-2 mb-0 h-px flex-1 sm:mb-5 ${mi < cur ? "bg-[#1e6b45]/50" : "bg-[#1a1a1a]/12"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Preview-stage control — lets the demo reach later (locked / paid) states. */
function PreviewStage({ value, onChange, onReset }: { value: DealStage; onChange: (s: DealStage) => void; onReset: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.66rem] font-light uppercase tracking-[0.16em] text-[#1a1a1a]/35">Preview</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DealStage)}
        className="rounded-full border border-[#1a1a1a]/15 bg-white px-3 py-1.5 text-[0.74rem] font-light text-[#1a1a1a]/70 outline-none transition-colors hover:border-[#1a1a1a]/30"
      >
        {STAGE_ORDER.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABEL[s]}
          </option>
        ))}
      </select>
      <button onClick={onReset} title="Reset demo" className="text-[0.7rem] font-light text-[#1a1a1a]/35 transition-colors hover:text-[#1a1a1a]/70">
        ↺
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HOME — the narrative, not a dashboard
   ════════════════════════════════════════════════════════════════ */
function HomeSection({ thread }: { thread: OfficeThread }) {
  const step = nextStep(thread);
  const paid = isPaid(thread.stage);
  return (
    <div className="animate-fade-up">
      <Eyebrow>Welcome back</Eyebrow>
      <h1 className="mt-3 font-serif text-[2.1rem] font-medium leading-[1.08] text-[#1a1a1a] md:text-[3rem]">
        {thread.label} · {thread.title}
      </h1>
      <p className="mt-3 max-w-[560px] text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55">
        {paid ? "Your mandate is active. Here's exactly where things stand." : "Here's exactly where your decision stands — and the one thing to do next."}
      </p>

      {/* Journey arc */}
      <div className="mt-9 rounded-xl border border-[#1a1a1a]/[0.08] bg-white px-6 py-7 md:px-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">Your journey</p>
          <span className="text-[0.72rem] font-light text-[#1e6b45]">{STAGE_LABEL[thread.stage]}</span>
        </div>
        <StageArc stage={thread.stage} />
      </div>

      {/* Next step — the single most important card */}
      <div className="mt-6 overflow-hidden rounded-xl bg-[#1a1a1a] text-white">
        <div className="flex flex-col gap-5 p-7 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="max-w-[560px]">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#c9a96e]">Your next step</p>
            <p className="mt-3 font-serif text-[1.5rem] font-medium leading-tight md:text-[1.8rem]">{step.title}</p>
            <p className="mt-2 text-[0.9rem] font-light leading-relaxed text-white/60">{step.body}</p>
          </div>
          <Link
            href={SECTIONS.find((s) => s.key === step.section)!.path}
            className="shrink-0 self-start rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]"
          >
            {step.cta} →
          </Link>
        </div>
      </div>

      {/* Micro-wins */}
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#1a1a1a]/[0.08] bg-[#1a1a1a]/[0.06] md:grid-cols-4">
        {wins(thread).map((w) => (
          <div key={w.label} className="bg-white px-5 py-6 text-center">
            <p className="font-serif text-[1.7rem] font-medium leading-none text-[#1e6b45]">{w.value}</p>
            <p className="mt-2 text-[0.68rem] font-light uppercase tracking-[0.12em] text-[#1a1a1a]/45">{w.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming call */}
      {thread.call && stageIndex(thread.stage) < stageIndex("call_done") && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">Consultation · Upcoming</p>
          <UpcomingCall thread={thread} />
        </div>
      )}
    </div>
  );
}

function UpcomingCall({ thread }: { thread: OfficeThread }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1e6b45]/10 font-serif text-[0.95rem] font-medium text-[#1e6b45]">
          {thread.advisor.initials}
        </div>
        <div>
          <p className="font-serif text-[1.2rem] font-medium text-[#1a1a1a]">{thread.advisor.name}</p>
          <p className="text-[0.8rem] font-light text-[#1a1a1a]/55">{thread.advisor.focus}</p>
        </div>
      </div>
      <div className="text-left sm:text-right">
        <p className="font-serif text-[1.05rem] font-medium text-[#1e6b45]">
          {thread.call!.day} · {thread.call!.time}
        </p>
        <p className="text-[0.78rem] font-light text-[#1a1a1a]/45">{thread.call!.format} · 45 minutes</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY REQUIREMENTS / BUYER DNA — multi-thread
   ════════════════════════════════════════════════════════════════ */
function RequirementsSection({ state, activeId, onPick }: { state: OfficeState; activeId: string; onPick: (id: string) => void }) {
  return (
    <div className="animate-fade-up">
      <SectionHead kicker="My Requirements" title="Your Buyer DNA" sub="Every decision you're running with us — each its own thread, with the requirements we hold." />
      <div className="flex flex-col gap-5">
        {state.threads.map((t) => {
          const on = t.id === activeId;
          return (
            <div key={t.id} className={`rounded-xl border bg-white p-6 transition-all ${on ? "border-[#1e6b45]/40 shadow-sm" : "border-[#1a1a1a]/[0.08]"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#1a1a1a]/[0.05] px-3 py-1 text-[0.72rem] font-medium tracking-[0.04em] text-[#1a1a1a]/70">{t.label}</span>
                  <span className="font-serif text-[1.25rem] font-medium text-[#1a1a1a]">{t.archetype}</span>
                </div>
                {on ? (
                  <span className="text-[0.72rem] font-light text-[#1e6b45]">● Viewing</span>
                ) : (
                  <button onClick={() => onPick(t.id)} className="text-[0.78rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]">
                    Switch to this →
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[0.82rem] font-light text-[#1a1a1a]/45">{t.title} · {STAGE_LABEL[t.stage]}</p>
              <div className="mt-5 flex flex-wrap gap-2.5 border-t border-[#1a1a1a]/[0.06] pt-5">
                {t.dna.map((c) => (
                  <span key={c.label} className="rounded-full border border-[#1a1a1a]/10 px-3.5 py-1.5 text-[0.78rem] font-light text-[#1a1a1a]/65">
                    <span className="text-[#1a1a1a]/40">{c.label}</span> {c.value}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Link href="/" className="mt-7 inline-block text-[0.82rem] font-light text-[#1e6b45] transition-colors hover:text-[#238c55]">
        + Start a new requirement
      </Link>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   RECOMMENDATIONS
   ════════════════════════════════════════════════════════════════ */
function RecommendationsSection({ thread, onActivate }: { thread: OfficeThread; onActivate: () => void }) {
  const postCall = callDone(thread.stage);
  const paid = isPaid(thread.stage);
  if (thread.kind === "sell") return <SellPosition thread={thread} />;
  return (
    <div className="animate-fade-up">
      <SectionHead
        kicker="Recommendations"
        title={postCall ? "What we found for you" : "What we're investigating"}
        sub={
          postCall
            ? "Updated after your consultation — what we'd pursue, what we ruled out, and why."
            : "The projects we're pressure-testing against your Buyer DNA. We'll challenge these on your call."
        }
      />

      <div className="flex flex-col gap-4">
        {thread.recs.map((r) => (
          <div key={r.name} className="flex items-stretch gap-4 rounded-xl border border-[#1a1a1a]/[0.08] bg-white p-5 md:gap-6 md:p-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-serif text-[1.2rem] font-medium text-[#1a1a1a] md:text-[1.4rem]">{r.name}</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.08em] ${recTone(r.status)}`}>
                  {r.status === "investigating" ? "Investigating" : r.status}
                </span>
              </div>
              <p className="mt-1 text-[0.8rem] font-light tracking-[0.04em] text-[#1a1a1a]/45">{r.developer} · {r.market}</p>
              {r.note && <p className="mt-2.5 text-[0.84rem] font-light leading-relaxed text-[#1a1a1a]/60">{r.note}</p>}
            </div>
            <div className="flex shrink-0 flex-col justify-center gap-3 border-l border-[#1a1a1a]/10 pl-4 text-right md:pl-6">
              <div>
                <p className="font-serif text-[1.2rem] font-medium leading-none text-[#1e6b45] md:text-[1.4rem]">{r.matchPct}%</p>
                <p className="mt-1 text-[8px] font-light uppercase tracking-[0.16em] text-[#1a1a1a]/40">Truth Match</p>
              </div>
              <div>
                <p className="font-serif text-[1.2rem] font-medium leading-none text-[#1a1a1a] md:text-[1.4rem]">{r.truthScore}</p>
                <p className="mt-1 text-[8px] font-light uppercase tracking-[0.16em] text-[#1a1a1a]/40">Truth Score</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Curated intelligence — preview before the mandate, open after */}
      {isCurated(thread.stage) && thread.curation && (
        <CuratedIntel curation={thread.curation} paid={paid} onActivate={onActivate} />
      )}
    </div>
  );
}

/* The conversion moment — preview the edge before the mandate, open it after. */
function CuratedIntel({ curation, paid, onActivate }: { curation: Curation; paid: boolean; onActivate: () => void }) {
  return (
    <div className="mt-12">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-[0.8rem] text-[#c9a96e]">★</span>
        <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] text-[#1a1a1a] md:text-[2rem]">
          {paid ? "Your full intelligence" : "What our team curated for you"}
        </h2>
      </div>
      <p className="mb-7 max-w-[620px] text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/55">
        {paid
          ? "Open — your complete report, every tower- and unit-level view, and the deal we sourced. We're representing you from here."
          : "Intelligence nobody else in the market puts in front of you. The numbers below are real — your full report, every unit-level view, and the deal we sourced unlock when you activate your mandate."}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <IntelCard title="Independent Project Report" meta={`${curation.report.pages}-page report`} teasers={curation.report.teasers} paid={paid} />
        <IntelCard title="Tower & Unit Intelligence" meta={curation.unit.tags.join(" · ")} teasers={curation.unit.teasers} paid={paid} />
      </div>

      {curation.deal && (
        <div className="mt-4 overflow-hidden rounded-xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] p-6 md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#1e6b45]">Best deal we sourced</p>
              <p className="mt-2 font-serif text-[1.8rem] font-medium leading-none text-[#1a1a1a] md:text-[2.1rem]">{curation.deal.headline}</p>
              <p className="mt-2 text-[0.9rem] font-light text-[#1a1a1a]/60">{curation.deal.sub}</p>
            </div>
            <div className="shrink-0">
              {paid ? <span className="text-[0.8rem] font-medium text-[#1e6b45]">View the offer →</span> : <LockBadge label="Offer unlocks with mandate" />}
            </div>
          </div>
        </div>
      )}

      {paid ? (
        <div className="mt-5 flex flex-col items-start gap-4 rounded-xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] p-7 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div className="max-w-[560px]">
            <p className="font-serif text-[1.5rem] font-medium leading-tight text-[#1a1a1a]">Mandate active — we&apos;re representing you.</p>
            <p className="mt-2 text-[0.88rem] font-light text-[#1a1a1a]/55">Your reports are open and your advisor is now acting on your behalf, end to end.</p>
          </div>
          <Link href="/office/documents" className="shrink-0 rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
            Open your reports →
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-start gap-4 rounded-xl bg-[#1a1a1a] p-7 text-white sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div className="max-w-[560px]">
            <p className="font-serif text-[1.5rem] font-medium leading-tight">Unlock the full intelligence</p>
            <p className="mt-2 text-[0.88rem] font-light text-white/55">
              Your complete report, every tower- and unit-level view, and the deal we sourced — and we begin representing you, end to end.
            </p>
          </div>
          <button onClick={onActivate} className="shrink-0 rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
            Activate your mandate
          </button>
        </div>
      )}
    </div>
  );
}

function IntelCard({ title, meta, teasers, paid }: { title: string; meta: string; teasers: { label: string; value: string }[]; paid: boolean }) {
  return (
    <div className={`rounded-xl border p-6 ${paid ? "border-[#1e6b45]/20 bg-white" : "border-[#1a1a1a]/[0.08] bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-[1.2rem] font-medium text-[#1a1a1a]">{title}</p>
          <p className="mt-1 text-[0.72rem] font-light uppercase tracking-[0.1em] text-[#1a1a1a]/40">{meta}</p>
        </div>
        {paid ? <span className="shrink-0 whitespace-nowrap text-[0.72rem] font-medium text-[#1e6b45]">Open →</span> : <LockBadge label="Preview" />}
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-[#1a1a1a]/[0.06] pt-5">
        {teasers.map((t) => (
          <div key={t.label} className="flex items-baseline justify-between gap-3">
            <span className="text-[0.8rem] font-light text-[#1a1a1a]/50">{t.label}</span>
            <span className="text-right font-serif text-[1.05rem] font-medium text-[#1a1a1a]">{t.value}</span>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-[#1a1a1a]/10 pt-3">
          <span className="text-[0.8rem] font-light text-[#1a1a1a]/50">Full breakdown</span>
          <span className={`shrink-0 whitespace-nowrap text-[0.82rem] font-light ${paid ? "text-[#1e6b45]" : "text-[#9a7a2e]"}`}>{paid ? "Open report →" : "🔒 in the report"}</span>
        </div>
      </div>
    </div>
  );
}

/* The seller's view of Recommendations — exit position, not project picks. */
function SellPosition({ thread }: { thread: OfficeThread }) {
  const property = thread.dna.find((c) => c.label === "Property")?.value ?? "your property";
  const tiles = [
    { label: "Indicative value", value: "₹4.6–4.9 Cr", note: "Independent — not an agent's quote" },
    { label: "Comparable exits · 90 days", value: "7 closed", note: "₹4.7 Cr median, your tower line" },
    { label: "Active buyer demand", value: "High", note: "3 live buyer mandates match" },
    { label: "Best window", value: "Now → Q3", note: "Ahead of fresh nearby supply" },
  ];
  const prep = [
    "An independent valuation — with the comparable evidence behind every rupee",
    "A pricing strategy: list price, your floor, and the room to negotiate",
    "Qualified buyers from our live mandates — so you're not just waiting on the open market",
  ];
  return (
    <div className="animate-fade-up">
      <SectionHead
        kicker="Recommendations"
        title="Where your exit stands"
        sub={`We're valuing ${property} independently, benchmarking real exits in your line, and lining up qualified buyers — so you price on evidence and never leave money on the table.`}
      />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#1a1a1a]/[0.08] bg-[#1a1a1a]/[0.06] md:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white px-5 py-6">
            <p className="text-[0.62rem] font-light uppercase tracking-[0.12em] text-[#1a1a1a]/40">{t.label}</p>
            <p className="mt-2 font-serif text-[1.4rem] font-medium text-[#1a1a1a]">{t.value}</p>
            <p className="mt-1 text-[0.74rem] font-light leading-snug text-[#1a1a1a]/50">{t.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-[#1a1a1a]/[0.08] bg-white p-6 md:p-7">
        <p className="text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">What we&apos;re preparing for your call</p>
        <div className="mt-5 flex flex-col gap-3 border-t border-[#1a1a1a]/[0.06] pt-5">
          {prep.map((s) => (
            <div key={s} className="flex items-center gap-3 text-[0.9rem] font-light text-[#1a1a1a]/70">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#c9a96e] text-[0.7rem] text-[#c9a96e]">•</span>
              {s}
            </div>
          ))}
        </div>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#c9a96e]/12 px-4 py-2 text-[0.8rem] font-light text-[#9a7a2e]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96e]" />
          {thread.call ? `Firmed up on your call · ${thread.call.day} · ${thread.call.time}` : "Firmed up on your consultation"}
        </p>
      </div>
      <p className="mt-6 text-[0.82rem] font-light italic text-[#1a1a1a]/45">
        Indicative figures from our market read — every number gets its evidence on your call.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY DEAL — the execution room (paid → closed)
   Site visits → lock unit → negotiate → terms → token → BBA → owned.
   ════════════════════════════════════════════════════════════════ */
function DealSection({ thread, onAdvance, onActivate }: { thread: OfficeThread; onAdvance: (s: DealStage, msg?: string) => void; onActivate: () => void }) {
  if (!isPaid(thread.stage)) {
    return (
      <div className="animate-fade-up">
        <SectionHead kicker="My Deal" title="Your deal room" sub="Where we take it from intelligence to keys — site visits, negotiation, paperwork and close, all run for you." />
        <div className="rounded-2xl bg-[#1a1a1a] p-8 text-white md:p-10">
          <p className="mx-auto mb-4 flex w-fit"><LockBadge label="Opens with your mandate" /></p>
          <p className="font-serif text-[1.6rem] font-medium leading-tight md:text-[1.9rem]">This is where we start representing you.</p>
          <p className="mt-3 max-w-[540px] text-[0.92rem] font-light leading-relaxed text-white/60">
            The moment your mandate is active, your deal room opens: accompanied site visits, a locked target unit, our negotiation, your terms, token, BBA — every step, run end to end.
          </p>
          <button onClick={onActivate} className="mt-7 rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
            Activate your mandate
          </button>
        </div>
      </div>
    );
  }

  const curIdx = dealPhaseIndex(thread.stage);
  return (
    <div className="animate-fade-up">
      <SectionHead kicker="My Deal" title="Your deal room" sub="From intelligence to keys — here's exactly where your deal stands, and the one move that's yours to make." />
      <DealPhaseRail stage={thread.stage} />
      <div className="mt-9 flex flex-col gap-4">
        {DEAL_PHASES.map((p, i) => {
          const done = stageIndex(thread.stage) > stageIndex(p.stage);
          const active = i === curIdx && !done;
          return (
            <PhaseShell key={p.stage} n={i + 1} title={p.title} done={done} active={active} tag={p.stage === "closed" ? "" : "In progress"}>
              {active && <PhaseBody thread={thread} stage={p.stage} onAdvance={onAdvance} />}
              {done && <p className="text-[0.85rem] font-light text-[#1a1a1a]/55">{doneSummary(p.stage, thread)}</p>}
            </PhaseShell>
          );
        })}
      </div>
    </div>
  );
}

/* Horizontal progress spine across the deal phases. */
function DealPhaseRail({ stage }: { stage: DealStage }) {
  const curIdx = dealPhaseIndex(stage);
  return (
    <div className="mt-2 flex items-center overflow-x-auto rounded-xl border border-[#1a1a1a]/[0.08] bg-white px-5 py-5">
      {DEAL_PHASES.map((p, i) => {
        const done = stageIndex(stage) > stageIndex(p.stage);
        const here = i === curIdx && !done;
        const reached = done || here;
        return (
          <div key={p.stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border text-[0.6rem] ${reached ? "border-[#1e6b45] bg-[#1e6b45] text-white" : "border-[#1a1a1a]/20 bg-[#F5F0E8] text-[#1a1a1a]/30"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span className={`mt-2 whitespace-nowrap text-[0.6rem] font-light uppercase tracking-[0.1em] ${here ? "text-[#1a1a1a]" : "text-[#1a1a1a]/40"}`}>{p.short}</span>
            </div>
            {i < DEAL_PHASES.length - 1 && <span className={`mx-2 mb-5 h-px flex-1 ${done ? "bg-[#1e6b45]/50" : "bg-[#1a1a1a]/12"}`} />}
          </div>
        );
      })}
    </div>
  );
}

/* A numbered phase card — expanded when active, a quiet check when done. */
function PhaseShell({ n, title, done, active, tag = "In progress", children }: { n: number; title: string; done: boolean; active: boolean; tag?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-6 transition-all md:p-7 ${active ? "border-[#1e6b45]/30 bg-white shadow-sm" : done ? "border-[#1a1a1a]/[0.06] bg-white/60" : "border-dashed border-[#1a1a1a]/12 bg-transparent"}`}>
      <div className="flex items-center gap-3.5">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.72rem] font-medium ${done ? "bg-[#1e6b45] text-white" : active ? "border-2 border-[#1e6b45] text-[#1e6b45]" : "border border-[#1a1a1a]/20 text-[#1a1a1a]/30"}`}>
          {done ? "✓" : n}
        </span>
        <p className={`font-serif text-[1.2rem] font-medium md:text-[1.35rem] ${active || done ? "text-[#1a1a1a]" : "text-[#1a1a1a]/40"}`}>{title}</p>
        {active && tag && <span className="ml-auto text-[0.66rem] font-light uppercase tracking-[0.16em] text-[#1e6b45]">{tag}</span>}
      </div>
      {(active || done) && <div className="mt-5 pl-[2.6rem]">{children}</div>}
    </div>
  );
}

function doneSummary(stage: DealStage, t: OfficeThread): string {
  switch (stage) {
    case "site_visits":
      return `${t.visits.length || 2} accompanied visits completed and noted.`;
    case "buy_mandate":
      return `${t.mandate?.project ?? "Your unit"} · ${t.mandate?.tower ?? ""} locked as your target.`;
    case "offers":
      return `Best offer selected${t.saleOffer ? ` · ${INR(t.saleOffer.price)}` : ""}.`;
    case "sale_offer":
      return "Terms reviewed and accepted.";
    case "token":
      return `Token paid${t.saleOffer ? ` · ${INR(t.saleOffer.token)}` : ""} · allotment received.`;
    case "bba":
      return "Builder–Buyer Agreement signed and registered.";
    default:
      return "Done.";
  }
}

/* The interactive body for whichever phase is active. */
function PhaseBody({ thread, stage, onAdvance }: { thread: OfficeThread; stage: DealStage; onAdvance: (s: DealStage, msg?: string) => void }) {
  switch (stage) {
    case "site_visits":
      return <VisitsPhase thread={thread} onAdvance={onAdvance} />;
    case "buy_mandate":
      return <MandatePhase thread={thread} onAdvance={onAdvance} />;
    case "offers":
      return <OffersPhase thread={thread} onAdvance={onAdvance} />;
    case "sale_offer":
      return <TermsPhase thread={thread} onAdvance={onAdvance} />;
    case "token":
      return <TokenPhase onAdvance={onAdvance} />;
    case "bba":
      return <BbaPhase onAdvance={onAdvance} />;
    case "closed":
      return <ClosedPhase />;
    default:
      return null;
  }
}

function DealCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-6 rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
      {label}
    </button>
  );
}

function visitTone(s: SiteVisit["status"]) {
  return s === "completed"
    ? "border-[#1e6b45]/30 bg-[#1e6b45]/8 text-[#1e6b45]"
    : s === "confirmed"
    ? "border-[#9a7a2e]/30 bg-[#c9a96e]/10 text-[#9a7a2e]"
    : "border-[#1a1a1a]/15 bg-[#1a1a1a]/[0.03] text-[#1a1a1a]/55";
}

function VisitsPhase({ thread, onAdvance }: { thread: OfficeThread; onAdvance: (s: DealStage, msg?: string) => void }) {
  const entering = thread.stage === "paid"; // visits proposed, not yet confirmed
  if (!thread.visits.length) {
    return <p className="text-[0.88rem] font-light text-[#1a1a1a]/55">Your advisor is lining up accompanied visits — you&apos;ll see the slots here shortly.</p>;
  }
  return (
    <div>
      <p className="text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/60">
        {entering
          ? "We see the real thing with you — same day, back to back, so you compare like for like. No show-flat theatre."
          : "Visited and noted. Here's your advisor's honest read on each — then lock the one you want and we go to work on the price."}
      </p>
      <div className="mt-5 flex flex-col gap-3">
        {thread.visits.map((v) => {
          const status: SiteVisit["status"] = entering ? v.status : "completed";
          return (
            <div key={v.id} className="rounded-lg border border-[#1a1a1a]/[0.08] bg-[#F5F0E8]/50 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-serif text-[1.05rem] font-medium text-[#1a1a1a]">{v.project}</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] ${visitTone(status)}`}>
                  {status}
                </span>
              </div>
              <p className="mt-1 text-[0.8rem] font-light text-[#1a1a1a]/50">{v.day} · {v.time}{v.note ? ` · ${v.note}` : ""}</p>
              {!entering && (
                <p className="mt-2.5 border-t border-[#1a1a1a]/[0.06] pt-2.5 text-[0.84rem] font-light leading-relaxed text-[#1a1a1a]/65">
                  <span className="text-[#1e6b45]">Advisor&apos;s read · </span>
                  {v.verdict ?? "Construction quality holds up, light and cross-ventilation are genuine. Worth your shortlist."}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {entering ? (
        <DealCta label="Confirm my site visits →" onClick={() => onAdvance("site_visits", "Visits confirmed — your advisor will be there with you.")} />
      ) : (
        <DealCta label="Lock my target unit →" onClick={() => onAdvance("buy_mandate", "Target locked — we're going to negotiate for you.")} />
      )}
    </div>
  );
}

function MandatePhase({ thread, onAdvance }: { thread: OfficeThread; onAdvance: (s: DealStage, msg?: string) => void }) {
  const m = thread.mandate;
  if (!m) return <p className="text-[0.88rem] font-light text-[#1a1a1a]/55">We&apos;re preparing your buy mandate.</p>;
  const rows: { label: string; value: string }[] = [
    { label: "Project", value: m.project },
    { label: "Developer", value: m.developer },
    { label: "Configuration", value: m.config },
    { label: "Tower", value: m.tower },
    { label: "Floor", value: m.floorBand },
    { label: "Carpet", value: m.carpet },
  ];
  return (
    <div>
      <p className="text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/60">
        This is your target — locked in writing so we negotiate hard on one thing, not five. You can still change it before we make an offer.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#1a1a1a]/[0.08] bg-[#1a1a1a]/[0.06] md:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="bg-white px-4 py-4">
            <p className="text-[0.62rem] font-light uppercase tracking-[0.12em] text-[#1a1a1a]/40">{r.label}</p>
            <p className="mt-1 font-serif text-[1.02rem] font-medium text-[#1a1a1a]">{r.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[0.82rem] font-light italic text-[#1a1a1a]/50">{m.note}</p>
      <DealCta label="Confirm mandate — start negotiating →" onClick={() => onAdvance("offers", "Mandate confirmed — your advisor is negotiating now.")} />
    </div>
  );
}

function OffersPhase({ thread, onAdvance }: { thread: OfficeThread; onAdvance: (s: DealStage, msg?: string) => void }) {
  const neg = thread.negotiation;
  if (!neg || !neg.offers.length) {
    return (
      <div>
        <p className="font-serif text-[1.25rem] font-medium text-[#1a1a1a]">We&apos;re working the price.</p>
        <p className="mt-1.5 text-[0.88rem] font-light text-[#1a1a1a]/55">Our team is pressing every channel. Offers land here.</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#c9a96e]/12 px-4 py-2 text-[0.8rem] font-light text-[#9a7a2e]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9a96e]" />
          {`Best terms in ${neg?.tat ?? "about 5 working days"}`}
        </p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/60">{neg.note}</p>
      <div className="mt-5 flex flex-col gap-4">
        {neg.offers.map((o) => (
          <OfferCard key={o.id} offer={o} onChoose={() => onAdvance("sale_offer", "Offer selected — preparing your terms.")} />
        ))}
      </div>
    </div>
  );
}

function OfferCard({ offer, onChoose }: { offer: DealOffer; onChoose: () => void }) {
  return (
    <div className={`rounded-xl border p-5 md:p-6 ${offer.recommended ? "border-[#1e6b45]/30 bg-[#1e6b45]/[0.04]" : "border-[#1a1a1a]/[0.08] bg-white"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-serif text-[1.15rem] font-medium text-[#1a1a1a]">{offer.source}</p>
            {offer.recommended && <span className="rounded-full border border-[#1e6b45]/30 bg-[#1e6b45]/8 px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] text-[#1e6b45]">We recommend</span>}
          </div>
          <p className="mt-1 text-[0.8rem] font-light text-[#1a1a1a]/50">{offer.unit}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="font-serif text-[1.5rem] font-medium leading-none text-[#1a1a1a]">{INR(offer.price)}</p>
          <p className="mt-1 text-[0.72rem] font-light text-[#1a1a1a]/45">{INR(offer.perSqft)}/sq ft · ₹{offer.vsQuoted}L under quoted</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#1a1a1a]/[0.06] pt-4">
        {offer.terms.map((t) => (
          <span key={t} className="rounded-full bg-[#1a1a1a]/[0.04] px-3 py-1 text-[0.74rem] font-light text-[#1a1a1a]/65">{t}</span>
        ))}
        <button onClick={onChoose} className="ml-auto rounded-sm bg-[#1e6b45] px-5 py-2 text-[0.78rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
          Take this forward →
        </button>
      </div>
    </div>
  );
}

function TermsPhase({ thread, onAdvance }: { thread: OfficeThread; onAdvance: (s: DealStage, msg?: string) => void }) {
  const [agreed, setAgreed] = useState(false);
  const s = thread.saleOffer;
  if (!s) return <p className="text-[0.88rem] font-light text-[#1a1a1a]/55">Your offer and terms are being drawn up.</p>;
  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-[#1e6b45]/20 bg-white">
        <div className="flex flex-col gap-2 border-b border-[#1a1a1a]/[0.06] bg-[#1e6b45]/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.62rem] font-light uppercase tracking-[0.16em] text-[#1e6b45]">Your offer</p>
            <p className="mt-1 font-serif text-[1.1rem] font-medium text-[#1a1a1a]">{s.unit}</p>
          </div>
          <p className="font-serif text-[1.7rem] font-medium leading-none text-[#1a1a1a]">{INR(s.price)}</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-[#1a1a1a]/[0.06] md:grid-cols-4">
          {s.schedule.map((m) => (
            <div key={m.label} className="bg-white px-4 py-4">
              <p className="text-[0.62rem] font-light uppercase tracking-[0.1em] text-[#1a1a1a]/40">{m.label}</p>
              <p className="mt-1 text-[0.86rem] font-medium text-[#1a1a1a]">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <p className="mb-3 text-[10px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">Terms & protections</p>
        <ul className="flex flex-col gap-2.5">
          {s.conditions.map((c) => (
            <li key={c} className="flex gap-2.5 text-[0.86rem] font-light leading-snug text-[#1a1a1a]/70">
              <span className="mt-0.5 shrink-0 text-[#1e6b45]">✓</span>
              {c}
            </li>
          ))}
        </ul>
      </div>
      <label className="mt-6 flex cursor-pointer items-center gap-3 text-[0.85rem] font-light text-[#1a1a1a]/70">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-4 w-4 accent-[#1e6b45]" />
        I&apos;ve read the terms and want to proceed.
      </label>
      <button
        onClick={() => onAdvance("token", "Token paid — your unit is held in your name.")}
        disabled={!agreed}
        className="mt-5 rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-30"
      >
        Accept & pay token {INR(s.token)} →
      </button>
      <p className="mt-3 text-[0.74rem] font-light text-[#1a1a1a]/45">Paid to the developer&apos;s RERA escrow — never to us. Refundable if due-diligence flags a red line.</p>
    </div>
  );
}

function TokenPhase({ onAdvance }: { onAdvance: (s: DealStage, msg?: string) => void }) {
  return (
    <div>
      <p className="font-serif text-[1.25rem] font-medium text-[#1a1a1a]">Your unit is held. 🎉</p>
      <p className="mt-1.5 max-w-[520px] text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/60">
        Token paid into RERA escrow and the allotment letter is in — both filed in your documents. Next, we prepare your Builder–Buyer Agreement and read every clause before you sign.
      </p>
      <Link href="/office/documents" className="mt-4 inline-block text-[0.82rem] font-light text-[#1e6b45] transition-colors hover:text-[#238c55]">
        See your token receipt & allotment →
      </Link>
      <div>
        <DealCta label="Continue to your BBA →" onClick={() => onAdvance("bba", "BBA ready — reviewed and annotated for you.")} />
      </div>
    </div>
  );
}

function BbaPhase({ onAdvance }: { onAdvance: (s: DealStage, msg?: string) => void }) {
  return (
    <div>
      <p className="font-serif text-[1.25rem] font-medium text-[#1a1a1a]">Your BBA — read line by line, for you.</p>
      <p className="mt-1.5 max-w-[520px] text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/60">
        We&apos;ve reviewed and annotated the Builder–Buyer Agreement — flagging every clause that matters before a rupee more moves. Sign when you&apos;re ready and we register it.
      </p>
      <Link href="/office/documents" className="mt-4 inline-block text-[0.82rem] font-light text-[#1e6b45] transition-colors hover:text-[#238c55]">
        Open the annotated BBA →
      </Link>
      <div>
        <DealCta label="Confirm registration & handover →" onClick={() => onAdvance("closed", "Congratulations — it's yours. Welcome to ownership.")} />
      </div>
    </div>
  );
}

function ClosedPhase() {
  return (
    <div>
      <p className="font-serif text-[1.35rem] font-medium text-[#1a1a1a]">It&apos;s yours. Welcome home.</p>
      <p className="mt-1.5 max-w-[520px] text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/60">
        Registration and handover are done. Your property — with every document, the price you paid and our continuing independent read — now lives in your portfolio.
      </p>
      <Link href="/office/portfolio" className="mt-5 inline-block rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
        See it in your portfolio →
      </Link>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INDEPENDENT ADVICE — scheduled + reschedule + before-call + past
   ════════════════════════════════════════════════════════════════ */
function AdviceSection({ thread, onReschedule }: { thread: OfficeThread; onReschedule: (c: NonNullable<OfficeThread["call"]>) => void }) {
  const past = callDone(thread.stage);
  const upcoming = !past && !!thread.call;
  const done = past;
  const history = thread.pastCalls.length
    ? thread.pastCalls
    : past && thread.call
    ? [{ ...thread.call, done: true }]
    : [];

  return (
    <div className="animate-fade-up">
      <SectionHead kicker="Independent Advice" title="Your consultations" sub="Prepared, independent conversations about your decision — past and scheduled." />

      {upcoming && thread.call && <RescheduleCard call={thread.call} advisor={thread.advisor} onReschedule={onReschedule} />}

      {/* Before-call checklist */}
      {upcoming && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">Before your call</p>
          <Card>
            <ul className="flex flex-col gap-3.5">
              {[
                { t: "We've reviewed your Buyer DNA", done: true },
                { t: "Your advisor is preparing the project comparison", done: true },
                { t: "Add anything specific you want covered", done: false },
              ].map((it) => (
                <li key={it.t} className="flex items-center gap-3 text-[0.92rem] font-light text-[#1a1a1a]/75">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.7rem] ${it.done ? "bg-[#1e6b45] text-white" : "border border-[#1a1a1a]/25 text-transparent"}`}>✓</span>
                  {it.t}
                  {!it.done && (
                    <Link href="/office/questions" className="ml-auto text-[0.78rem] font-light text-[#1e6b45]">Add →</Link>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* After-call — recording & synopsis are yours, free */}
      {done && (
        <div className="mt-8">
          <p className="mb-3 text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">After your call · yours to keep</p>
          <div className="grid gap-4 md:grid-cols-2">
            <AfterCallTile title="Call recording" body="Re-watch your consultation any time — no charge, it's yours." action="Watch · 45 min" />
            <AfterCallTile
              title="Synopsis"
              body={thread.call?.summary ?? history[0]?.summary ?? "A written summary of what was discussed and decided."}
              action="Read"
            />
          </div>
          <div className="mt-4">
            <WhatWeDoingNow thread={thread} />
          </div>
        </div>
      )}

      {/* Past calls list */}
      <div className="mt-8">
        <p className="mb-3 text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">History</p>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#1a1a1a]/15 px-6 py-6 text-[0.86rem] font-light text-[#1a1a1a]/40">
            No past consultations yet — your scheduled call will appear here once it&apos;s done.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-[#1a1a1a]/[0.08] bg-white px-5 py-4">
                <span className="text-[0.9rem] font-light text-[#1a1a1a]/70">{c.day} · {c.time}</span>
                <span className="text-[0.78rem] font-light text-[#1a1a1a]/40">{c.format} · completed</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AfterCallTile({ title, body, action }: { title: string; body: string; action: string }) {
  return (
    <div className="h-full rounded-xl border border-[#1a1a1a]/[0.08] bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-serif text-[1.15rem] font-medium text-[#1a1a1a]">{title}</p>
        <span className="shrink-0 text-[0.74rem] font-light text-[#1e6b45]">{action} →</span>
      </div>
      <p className="mt-2.5 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/55">{body}</p>
    </div>
  );
}

/* The "team at work" moment — TAT before curation is ready, then the hand-off. */
function WhatWeDoingNow({ thread }: { thread: OfficeThread }) {
  const ready = isCurated(thread.stage);
  return (
    <div className={`rounded-xl border p-6 md:p-7 ${ready ? "border-[#1e6b45]/25 bg-[#1e6b45]/[0.05]" : "border-[#1a1a1a]/[0.08] bg-white"}`}>
      <p className="text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">What we&apos;re doing now</p>
      {ready ? (
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[520px]">
            <p className="font-serif text-[1.4rem] font-medium text-[#1a1a1a]">Your intelligence is ready.</p>
            <p className="mt-1.5 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/55">
              Our team has curated the full picture on your shortlist — the real numbers, the tower- and unit-level intel, and the deal we sourced.
            </p>
          </div>
          <Link href="/office/recommendations" className="shrink-0 self-start rounded-sm bg-[#1e6b45] px-6 py-3 text-[0.8rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] sm:self-auto">
            See what we found →
          </Link>
        </div>
      ) : (
        <div className="mt-3">
          <p className="font-serif text-[1.4rem] font-medium text-[#1a1a1a]">Our team is building your decision matrix.</p>
          <p className="mt-1.5 max-w-[560px] text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/55">
            We&apos;re pulling the independent project report, tower- and unit-level intelligence, and live pricing for everything on your shortlist.
          </p>
          <div className="mt-5 flex flex-col gap-3 border-t border-[#1a1a1a]/[0.06] pt-5">
            {[
              { t: "Call reviewed · decision matrix scoped", on: true },
              { t: "Independent project report being compiled", on: false },
              { t: "Unit-level intel & best deal sourced", on: false },
            ].map((s) => (
              <div key={s.t} className="flex items-center gap-3 text-[0.9rem] font-light text-[#1a1a1a]/70">
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.7rem] ${s.on ? "bg-[#1e6b45] text-white" : "border border-[#c9a96e] text-[#c9a96e]"}`}>
                  {s.on ? "✓" : "•"}
                </span>
                {s.t}
              </div>
            ))}
          </div>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#c9a96e]/12 px-4 py-2 text-[0.8rem] font-light text-[#9a7a2e]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9a96e]" />
            {`Ready in ${thread.curation?.tat ?? "about 48 hours"} — we'll notify you`}
          </p>
        </div>
      )}
    </div>
  );
}

function RescheduleCard({
  call,
  advisor,
  onReschedule,
}: {
  call: NonNullable<OfficeThread["call"]>;
  advisor: OfficeThread["advisor"];
  onReschedule: (c: NonNullable<OfficeThread["call"]>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState(call.day);
  const [time, setTime] = useState(call.time);
  const [format, setFormat] = useState(call.format);
  const [saved, setSaved] = useState(false);

  const confirm = () => {
    onReschedule({ ...call, day, time, format });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div className="rounded-xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] p-6 md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1e6b45]/10 font-serif text-[1rem] font-medium text-[#1e6b45]">
            {advisor.initials}
          </div>
          <div>
            <p className="text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/35">Scheduled with</p>
            <p className="font-serif text-[1.2rem] font-medium text-[#1a1a1a]">{advisor.name}</p>
            <p className="font-serif text-[1.05rem] font-medium text-[#1e6b45]">{call.day} · {call.time} · {call.format}</p>
          </div>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 self-start rounded-full border border-[#1a1a1a]/20 px-5 py-2 text-[0.8rem] font-light text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a]/40 hover:text-[#1a1a1a] sm:self-auto"
        >
          {editing ? "Cancel" : "Reschedule"}
        </button>
      </div>

      {saved && <p className="mt-4 text-[0.82rem] font-light text-[#1e6b45]">✓ Rescheduled — your advisor has been notified.</p>}

      {editing && (
        <div className="mt-6 animate-fade-up border-t border-[#1e6b45]/15 pt-6">
          <Picker label="Day" options={CONSULT_DAYS} value={day} onChange={setDay} />
          <div className="mt-5">
            <p className="mb-2.5 text-[10px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">Time</p>
            <div className="flex flex-wrap gap-2.5">
              {CONSULT_DAYPARTS.flatMap((dp) => dp.slots).map((s) => (
                <Chip key={s} on={time === s} onClick={() => setTime(s)}>{s}</Chip>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <Picker label="Format" options={[...CONSULT_FORMATS]} value={format} onChange={setFormat} />
          </div>
          <button onClick={confirm} className="mt-6 rounded-sm bg-[#1e6b45] px-7 py-3 text-[0.8rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
            Confirm new time
          </button>
        </div>
      )}
    </div>
  );
}

function Picker({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="mb-2.5 text-[10px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => (
          <Chip key={o} on={value === o} onClick={() => onChange(o)}>{o}</Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[0.8rem] font-light transition-all duration-200 ${
        on ? "border-[#1e6b45] bg-[#1e6b45] text-white" : "border-[#1a1a1a]/15 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/35"
      }`}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   QUESTIONS — submit → drafting → answered
   ════════════════════════════════════════════════════════════════ */
function QuestionsSection({ thread, onAsk }: { thread: OfficeThread; onAsk: (q: OfficeThread["questions"]) => void }) {
  const [draft, setDraft] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const ask = () => {
    const text = draft.trim();
    if (!text) return;
    const q = newQuestion(text);
    const next = [q, ...thread.questions];
    onAsk(next);
    setDraft("");
    // Simulate an answer landing.
    const t = setTimeout(() => {
      onAsk(
        next.map((x) =>
          x.id === q.id
            ? {
                ...x,
                status: "answered",
                by: "TruthGuide AI",
                a: "Here's our independent read on that — grounded in the evidence we hold for your decision. Your advisor will go deeper on the call if it needs a judgement call.",
              }
            : x
        )
      );
    }, 1800);
    timers.current.push(t);
  };

  return (
    <div className="animate-fade-up">
      <SectionHead kicker="Questions" title="Ask anything" sub="Get an instant independent read from TruthGuide — your advisor weighs in on the judgement calls." />

      <Card>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="e.g. Is DLF Privana South worth the floor-rise premium?"
          className="w-full resize-none bg-transparent font-serif text-[1.1rem] font-light leading-relaxed text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/25 md:text-[1.2rem]"
        />
        <div className="mt-4 flex justify-end border-t border-[#1a1a1a]/[0.06] pt-4">
          <button
            onClick={ask}
            disabled={!draft.trim()}
            className="rounded-sm bg-[#1e6b45] px-6 py-2.5 text-[0.8rem] font-medium tracking-[0.04em] text-white transition-colors enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-30"
          >
            Ask →
          </button>
        </div>
      </Card>

      <div className="mt-8 flex flex-col gap-4">
        {thread.questions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#1a1a1a]/15 px-6 py-6 text-[0.86rem] font-light text-[#1a1a1a]/40">
            No questions yet. Ask anything about your decision — there&apos;s no such thing as too small.
          </p>
        ) : (
          thread.questions.map((q) => (
            <div key={q.id} className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white p-6">
              <p className="font-serif text-[1.15rem] font-medium text-[#1a1a1a]">{q.q}</p>
              {q.status === "pending" ? (
                <p className="mt-3 flex items-center gap-2 text-[0.85rem] font-light italic text-[#1a1a1a]/45">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9a96e]" />
                  TruthGuide is drafting an answer…
                </p>
              ) : (
                <div className="mt-4 border-t border-[#1a1a1a]/[0.06] pt-4">
                  <p className="text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/70">{q.a}</p>
                  <p className="mt-3 text-[0.72rem] font-light uppercase tracking-[0.12em] text-[#c9a96e]">— {q.by}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DOCUMENTS & REPORTS
   ════════════════════════════════════════════════════════════════ */
function DocumentsSection({ thread }: { thread: OfficeThread }) {
  const groups: OfficeDoc["group"][] = ["Project Reports", "Legal & BBA", "Letters & Allotment"];
  const paid = isPaid(thread.stage);
  const allDocs = [...dealDocs(thread), ...thread.docs];
  return (
    <div className="animate-fade-up">
      <SectionHead kicker="Documents & Reports" title="Everything in one place" sub="Independent reports we prepare, and the paperwork you share — reviewed and annotated by your advisor." />
      <div className="flex flex-col gap-8">
        {groups.map((g) => {
          const docs = allDocs.filter((d) => d.group === g);
          return (
            <div key={g}>
              <p className="mb-3 text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">{g}</p>
              <div className="overflow-hidden rounded-xl border border-[#1a1a1a]/[0.08]">
                {docs.map((d, i) => {
                  const report = d.group === "Project Reports";
                  const note = report && paid && d.status !== "uploaded" ? "Prepared by your advisor · open any time" : d.note;
                  return (
                    <div key={d.id} className={`flex items-center justify-between gap-4 px-5 py-4 ${i % 2 === 0 ? "bg-white" : "bg-[#F5F0E8]/60"}`}>
                      <div className="min-w-0">
                        <p className="text-[0.95rem] font-light text-[#1a1a1a]/80">{d.name}</p>
                        {note && <p className="mt-0.5 text-[0.76rem] font-light italic text-[#1a1a1a]/40">{note}</p>}
                      </div>
                      {d.status === "uploaded" ? (
                        <span className="shrink-0 text-[0.74rem] font-light text-[#1e6b45]">Uploaded ✓</span>
                      ) : d.status === "ready" || (report && paid) ? (
                        <span className="shrink-0 text-[0.74rem] font-light text-[#1e6b45]">Open →</span>
                      ) : paid ? (
                        <span className="shrink-0 text-[0.74rem] font-light text-[#1e6b45]">Upload →</span>
                      ) : (
                        <LockBadge />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-7 text-[0.8rem] font-light italic text-[#1a1a1a]/40">
        {paid
          ? "Your mandate is active — upload anything and your advisor reviews and annotates it for you."
          : "Upload unlocks once your mandate is active — your advisor reviews and annotates everything you share."}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY PORTFOLIO
   ════════════════════════════════════════════════════════════════ */
function PortfolioSection({ thread }: { thread: OfficeThread }) {
  const owned = stageIndex(thread.stage) >= stageIndex("closed");
  const name = thread.mandate?.project ?? thread.recs[0]?.name ?? "Your property";
  const developer = thread.mandate?.developer ?? thread.recs[0]?.developer ?? "";
  const stats: { value: string; label: string }[] = [
    { value: thread.saleOffer ? INR(thread.saleOffer.price) : "—", label: "Acquired for" },
    { value: thread.mandate?.tower ?? "—", label: "Tower" },
    { value: thread.mandate?.carpet ?? "—", label: "Carpet" },
    { value: thread.saleOffer ? `${thread.negotiation?.offers[0]?.vsQuoted ?? 18} L` : "—", label: "Saved vs quoted" },
  ];
  return (
    <div className="animate-fade-up">
      <SectionHead kicker="My Portfolio" title="What you own" sub="Every property you close with us lives here — with the documents, the numbers, and our ongoing read." />
      {owned ? (
        <div className="overflow-hidden rounded-2xl border border-[#1e6b45]/25 bg-white">
          <div className="flex items-center justify-between border-b border-[#1a1a1a]/[0.06] px-6 py-6 md:px-8">
            <div>
              <p className="font-serif text-[1.6rem] font-medium text-[#1a1a1a] md:text-[1.9rem]">{name}</p>
              <p className="mt-1 text-[0.85rem] font-light text-[#1a1a1a]/50">{developer} · {thread.mandate?.config ?? ""} · {thread.recs[0]?.market}</p>
            </div>
            <span className="shrink-0 rounded-full border border-[#1e6b45]/30 bg-[#1e6b45]/8 px-3.5 py-1.5 text-[0.66rem] font-medium uppercase tracking-[0.1em] text-[#1e6b45]">★ Owned</span>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[#1a1a1a]/[0.06] md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white px-5 py-6 text-center">
                <p className="font-serif text-[1.35rem] font-medium leading-none text-[#1a1a1a]">{s.value}</p>
                <p className="mt-2 text-[0.64rem] font-light uppercase tracking-[0.12em] text-[#1a1a1a]/45">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <p className="text-[0.86rem] font-light leading-relaxed text-[#1a1a1a]/60">
              Your documents, pricing history and our continued independent read all live here — so you never start from scratch again.
            </p>
            <Link href="/office/documents" className="shrink-0 text-[0.82rem] font-light text-[#1e6b45] transition-colors hover:text-[#238c55]">
              View documents →
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#1a1a1a]/15 p-10 text-center">
          <p className="mx-auto mb-4 flex w-fit"><LockBadge label="Begins at handover" /></p>
          <p className="font-serif text-[1.4rem] font-medium text-[#1a1a1a]">Nothing here yet — and that&apos;s the point.</p>
          <p className="mx-auto mt-3 max-w-[440px] text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/55">
            When you close with us, the property lands here with its BBA, allotment, pricing history and our continued independent view — so you never start from scratch again.
          </p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAYMENT — activate the mandate
   ════════════════════════════════════════════════════════════════ */
function PaymentSheet({ thread, onClose, onPay }: { thread: OfficeThread; onClose: () => void; onPay: () => void }) {
  const [processing, setProcessing] = useState(false);
  const pay = () => {
    setProcessing(true);
    setTimeout(onPay, 1500);
  };
  const includes = [
    "Your full project report + tower- and unit-level intelligence, unlocked",
    "The deal we sourced — and we negotiate to the best price",
    "Site visits arranged and accompanied by your advisor",
    "Every document managed — token, BBA, allotment — to handover",
    "One independent advisor, representing only you, end to end",
  ];
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-[#0a0a0a]/55 backdrop-blur-sm" />
      <div className="animate-fade-up relative max-h-[92svh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-[#F5F0E8] p-7 shadow-2xl shadow-black/30 md:p-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#c9a96e]">Truth Estate Mandate</p>
            <h2 className="mt-3 font-serif text-[1.9rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.2rem]">
              Activate {thread.label}&apos;s mandate.
            </h2>
          </div>
          <button onClick={onClose} className="shrink-0 text-[11px] font-light tracking-[0.16em] text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]">
            CLOSE
          </button>
        </div>

        <ul className="mt-7 flex flex-col gap-3.5">
          {includes.map((t) => (
            <li key={t} className="flex gap-3 text-[0.92rem] font-light leading-snug text-[#1a1a1a]/75">
              <span className="mt-0.5 text-[#1e6b45]">✓</span>
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex items-baseline justify-between border-t border-[#1a1a1a]/10 pt-6">
          <div>
            <p className="font-serif text-[2rem] font-medium leading-none text-[#1a1a1a]">{INR(MANDATE_FEE)}</p>
            <p className="mt-2 text-[0.78rem] font-light text-[#1a1a1a]/50">Fully adjustable against our fee at closing</p>
          </div>
          <span className="text-[0.72rem] font-light text-[#1a1a1a]/40">GST included</span>
        </div>

        <button
          onClick={pay}
          disabled={processing}
          className="mt-6 w-full rounded-sm bg-[#1e6b45] px-7 py-4 text-[0.86rem] font-medium tracking-[0.04em] text-white transition-all duration-300 enabled:hover:bg-[#238c55] disabled:opacity-70"
        >
          {processing ? "Processing…" : `Pay ${INR(MANDATE_FEE)} & activate`}
        </button>
        <p className="mt-4 text-center text-[0.76rem] font-light leading-relaxed text-[#1a1a1a]/45">
          Independent · no developer commissions · refundable if we don&apos;t add value in 30 days.
        </p>
      </div>
    </div>
  );
}

function Celebrate({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-6 z-[130] -translate-x-1/2 px-4">
      <div className="animate-fade-up flex items-center gap-2.5 rounded-full bg-[#1a1a1a] px-6 py-3 text-white shadow-xl shadow-black/25">
        <span className="text-[#c9a96e]">★</span>
        <span className="text-[0.84rem] font-light tracking-[0.02em]">{message}</span>
      </div>
    </div>
  );
}
