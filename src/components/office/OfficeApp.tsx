"use client";

import Link from "next/link";
import DashboardHome from "./DashboardHome";
import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import SignIn from "./SignIn";
import { isSignedIn, clearAllDemoData, loadAccount } from "@/lib/journey";
import { projectByName } from "@/lib/projects";
import ProjectOptionCard from "../intelligence/ProjectOptionCard";
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
  dealPhaseIndex,
  isCurated,
  isPaid,
  loadOffice,
  nextStep,
  reseedOffice,
  saveOffice,
  stageIndex,
  wins,
} from "@/lib/office";
import { basePath } from "@/lib/site";
import {
  recordReportView,
  listPurchased,
  listViewed,
  listOwned,
  listPayments,
  getRating,
  rateReport,
  unmarkOwned,
  getVote,
  setVote,
  loadReportDates,
  reportUpdates,
  type Payment,
  type Vote,
  type ReportDates,
  type SectionUpdate,
  type PurchasedRow,
  type ViewRecord,
  type OwnedRecord,
} from "@/lib/officeReports";

/* ════════════════════════════════════════════════════════════════
   THE PRIVATE OFFICE — routed client portal (Phase 1)
   ════════════════════════════════════════════════════════════════ */
export default function OfficeApp({ section }: { section: SectionKey }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [state, setState] = useState<OfficeState | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  /* Gate the office behind sign-in. A hard refresh wipes the session (root
     layout), so a reloaded visitor lands on the sign-in screen; the office
     only loads — and only seeds its demo — once they're signed in. */
  useEffect(() => {
    const m = isSignedIn();
    setAuthed(m);
    if (m) setState(loadOffice());
  }, []);

  if (authed === null) return <div className="min-h-svh bg-[#F5F0E8]" />;
  if (!authed) return <SignIn onSignedIn={() => { setAuthed(true); setState(loadOffice()); }} />;
  if (!state) return <div className="min-h-svh bg-[#F5F0E8]" />;

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

  /* THE WHOLE PORTAL SITS IN THE HOME PAGE'S COLUMN.
     Full-bleed cream at the page level; the sidebar + content flex row is
     then centred at max-w-7xl — the exact measure the home header uses — so
     the run from the logo (top of the sidebar) to the right edge of the
     content lines up with the marketing site instead of stretching edge to
     edge. The earlier attempt only widened the content INSIDE the sidebar's
     offset, which made the span wider, not aligned; the cap belongs on the
     shell, not the column within it. */
  return (
    <div className="min-h-svh w-full bg-[#F5F0E8] text-[#1a1a1a]">
     <div className="mx-auto flex min-h-svh max-w-7xl flex-col md:flex-row">
      {/* ── Sidebar ── */}
      <aside className="sticky top-0 z-30 flex shrink-0 flex-col border-b border-[#1a1a1a]/8 bg-[#F5F0E8]/95 px-5 py-4 backdrop-blur-sm md:h-svh md:w-60 md:border-b-0 md:border-r md:px-6 md:py-7">
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
          <button
            onClick={() => { clearAllDemoData(); setState(null); setAuthed(false); setNavOpen(false); }}
            className="mt-2 px-3.5 text-left text-[11px] font-light tracking-[0.16em] text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]"
          >
            Sign out
          </button>
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="min-w-0 flex-1">
        {/* No max-width here any more — the shell above is already capped at
           max-w-7xl, so the content just needs its gutters. A second cap
           here is what pushed the column narrow-and-offset before. */}
        <div className="px-6 py-9 md:px-10 md:py-12">
          {/* Thread switcher + preview control.
              HIDDEN ON THE DASHBOARD HOME. The switcher is demo scaffolding
              — three seeded threads and a "PREVIEW · stage" dropdown that
              lets you fast-forward the journey — and it sat directly above
              the verdict, which is the one thing on that page a real buyer
              is meant to read first. A control for inspecting a demo has no
              business being the first thing on the page that tells someone
              what to do about a seven-crore decision. The deal sections
              still need it, so it stays everywhere else. */}
          <div className={`mb-9 flex-wrap items-center justify-between gap-4 ${section === "home" ? "hidden" : "flex"}`}>
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
                  <span className="ml-2 opacity-70">{t.title.split(" · ")[0]}</span>
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

          {section === "home" && <DashboardHome name={loadAccount()?.name ?? null} />}
          {section === "requirements" && <RequirementsSection state={state} activeId={active.id} onPick={setActive} />}
          {section === "recommendations" && <RecommendationsSection thread={active} onActivate={() => setPayOpen(true)} />}
          {section === "deal" && <DealSection thread={active} onAdvance={advanceTo} onActivate={() => setPayOpen(true)} />}
          {section === "advice" && <AdviceSection thread={active} onReschedule={(c) => patchThread(active.id, { call: c })} />}
          {section === "documents" && <DocumentsSection />}
          {section === "portfolio" && <PortfolioSection />}
        </div>
        {payOpen && <PaymentSheet thread={active} onClose={() => setPayOpen(false)} onPay={activate} />}
        {celebrate && <Celebrate message={celebrate} />}
      </main>
     </div>
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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {thread.recs.map((r) => {
          const intel = projectByName(r.name);
          if (!intel) return null;
          return (
            <div key={r.name} className="flex flex-col gap-2">
              <ProjectOptionCard p={intel} matchPct={r.matchPct} />
              <div className="rounded-xl border border-[#1a1a1a]/8 bg-[#FBF8F2] px-4 py-3">
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.08em] ${recTone(r.status)}`}>
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
                {r.note && <p className="mt-2 text-[0.82rem] font-light leading-relaxed text-[#1a1a1a]/60">{r.note}</p>}
              </div>
            </div>
          );
        })}
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
        <IntelCard title="Sun & Vastu 3D" meta={curation.unit.tags.join(" · ")} teasers={curation.unit.teasers} paid={paid} />
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
   DOCUMENTS & REPORTS + MY PORTFOLIO
   Rebuilt on real data: purchased entitlements, viewed (preview) reports,
   client-generated invoices, self-declared ownership, date-based "see new
   update" flags and per-report feedback. See src/lib/officeReports.ts.
   ════════════════════════════════════════════════════════════════ */
const MONTHS3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(v: number | string | null | undefined): string {
  if (v == null || v === "") return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS3[d.getMonth()]} ${d.getFullYear()}`;
}
/* Initials for the report thumbnail — first letters of the first two words. */
function initialsOf(name: string): string {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "—";
  return ((w[0]?.[0] ?? "") + (w[1]?.[0] ?? w[0]?.[1] ?? "")).toUpperCase();
}
const reportHref = (seoSlug: string | null): string =>
  seoSlug ? `${basePath}/projects/${seoSlug}` : `${basePath}/intelligence/projects`;

function Thumb({ initials }: { initials: string }) {
  return (
    <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#0b1f1a] to-[#173d2e] font-serif text-[1.05rem] text-[#cbb98a]">
      {initials}
    </div>
  );
}

function Pill({ tone = "neutral", children }: { tone?: "neutral" | "green"; children: React.ReactNode }) {
  const cls =
    tone === "green"
      ? "border-[#1e6b45]/30 bg-[#1e6b45]/[0.08] text-[#1e6b45]"
      : "border-[#1a1a1a]/12 text-[#1a1a1a]/55";
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-medium ${cls}`}>{children}</span>;
}

/* Interactive ★ rating — click a star to set it; read-only when onRate is absent. */
function Stars({ value, onRate }: { value: number; onRate?: (n: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onRate}
          onClick={() => onRate?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`text-[1.05rem] leading-none transition-colors ${onRate ? "cursor-pointer" : "cursor-default"} ${n <= value ? "text-[#c9a96e]" : "text-[#1a1a1a]/25"}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

/* ★ + optional free-text feedback for one report (Documents & Portfolio). */
function RatingRow({ slug, label }: { slug: string; label: string }) {
  const [rating, setRating] = useState(() => getRating(slug));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(rating?.comment ?? "");
  const [saved, setSaved] = useState(false);
  const rate = (n: number) => {
    rateReport(slug, n, rating?.comment);
    setRating(getRating(slug));
  };
  const saveComment = () => {
    rateReport(slug, rating?.stars ?? 0, draft);
    setRating(getRating(slug));
    setOpen(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  };
  return (
    <div className="mt-3.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[0.72rem] font-medium text-[#1a1a1a]/40">{label}</span>
        <Stars value={rating?.stars ?? 0} onRate={rate} />
        <button onClick={() => setOpen((v) => !v)} className="text-[0.78rem] font-medium text-[#9a7a2e] transition-colors hover:text-[#7a5f1e]">
          {rating?.comment ? "Edit feedback" : "Leave feedback"}
        </button>
        {saved && <span className="text-[0.74rem] font-light text-[#1e6b45]">✓ Thanks — noted.</span>}
      </div>
      {open && (
        <div className="mt-3 max-w-[440px]">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Tell us where we were right or wrong…"
            className="w-full resize-y rounded-lg border border-[#1a1a1a]/15 bg-white px-3.5 py-2.5 text-[0.85rem] font-light text-[#1a1a1a] outline-none transition-colors focus:border-[#1e6b45]/50"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={saveComment} className="rounded-sm bg-[#1e6b45] px-4 py-2 text-[0.78rem] font-medium text-white transition-colors hover:bg-[#238c55]">Save feedback</button>
            <button onClick={() => { setOpen(false); setDraft(rating?.comment ?? ""); }} className="rounded-sm border border-[#1a1a1a]/15 px-4 py-2 text-[0.78rem] font-light text-[#1a1a1a]/60 transition-colors hover:border-[#1a1a1a]/30">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const SECTION_SHORT: Record<string, string> = { legal: "Legal", construction: "Construction", location: "Location", hero: "Report" };
/* Gold pulsing "See new update" badge — names the changed sections, expands to
   per-section detail on click. Renders nothing when nothing has moved. */
function UpdateBadge({ updates, since }: { updates: SectionUpdate[]; since?: number }) {
  const [open, setOpen] = useState(false);
  if (!updates.length) return null;
  const summary = updates.map((u) => SECTION_SHORT[u.key] ?? u.label).join(", ");
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-[#9a7a2e]/40 bg-[#c9a96e]/[0.12] px-3 py-1 text-[0.68rem] font-semibold text-[#9a7a2e] transition-colors hover:bg-[#c9a96e]/20"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9a7a2e]" />
        Updated · {summary}
      </button>
      {open && (
        <div className="mt-3 border-t border-dashed border-[#1a1a1a]/12 pt-3">
          <p className="mb-2 text-[0.78rem] font-semibold text-[#1a1a1a]">
            {updates.length} section{updates.length > 1 ? "s" : ""} changed{since ? ` since you last opened this (${fmtDate(since)})` : ""}
          </p>
          <div className="flex flex-col gap-1.5">
            {updates.map((u) => (
              <div key={u.key} className="flex gap-2.5 text-[0.82rem] font-light leading-snug text-[#1a1a1a]/70">
                <span className="mt-[6px] h-2 w-2 shrink-0 rounded-[2px]" style={{ background: u.key === "legal" ? "#b0503e" : "#9a7a2e" }} />
                <span>
                  <b className="font-medium text-[#1a1a1a]">{u.label}</b> — the record refreshed <b className="font-medium text-[#1a1a1a]">{fmtDate(u.iso)}</b>.
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* The label · rule · count sub-header used inside Documents & Portfolio. */
function SubHead({ title, count }: { title: string; count?: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-3.5">
      <h2 className="whitespace-nowrap text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a]/55">{title}</h2>
      <span className="h-px flex-1 bg-[#1a1a1a]/10" />
      {count != null && <span className="whitespace-nowrap text-[0.7rem] font-medium text-[#1a1a1a]/35">{count}</span>}
    </div>
  );
}

/* Row action column (Open / Invoice etc.). */
function ReportShell({ initials, children, acts }: { initials: string; children: React.ReactNode; acts: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#1a1a1a]/[0.08] bg-white p-5 sm:flex-row sm:items-start">
      <Thumb initials={initials} />
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">{acts}</div>
    </div>
  );
}

function DocumentsSection() {
  const [dates, setDates] = useState<ReportDates>({});
  const [purchased, setPurchased] = useState<PurchasedRow[]>([]);
  const [viewed, setViewed] = useState<(ViewRecord & { slug: string })[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoice, setInvoice] = useState<Payment | null>(null);

  useEffect(() => {
    setPurchased(listPurchased());
    setViewed(listViewed());
    setPayments(listPayments());
    loadReportDates().then(setDates);
  }, []);

  /* Opening the report from here refreshes the "last opened" clock so the
     update badge is already cleared when the buyer comes back. */
  const touch = (row: { slug: string; name: string; market: string; seoSlug: string | null }) =>
    recordReportView(row.slug, row.name, row.market, row.seoSlug);

  return (
    <div className="animate-fade-up">
      <SectionHead
        kicker="Documents & Reports"
        title="Every report you've bought or opened, in one place."
        sub="Your purchased reports and their invoices, plus the ones you've previewed. We flag any report whose findings have moved since you last read it."
      />
      <div className="mb-8 rounded-xl border border-dashed border-[#9a7a2e]/40 bg-[#c9a96e]/[0.07] px-4 py-3 text-[0.82rem] font-light leading-relaxed text-[#1a1a1a]/60">
        Reports and invoices only, driven by your real purchase &amp; view data. Document uploads and agreement workflows aren&apos;t part of this tab.
      </div>

      {/* ── Purchased ── */}
      <section className="mt-2">
        <SubHead title="Purchased" count={purchased.length ? `${purchased.length} report${purchased.length > 1 ? "s" : ""}` : undefined} />
        {purchased.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1a1a1a]/15 px-6 py-8 text-center">
            <p className="text-[0.9rem] font-light text-[#1a1a1a]/55">No reports unlocked yet — buy any full read and it lands here with its invoice.</p>
            <a href={`${basePath}/intelligence/projects`} className="mt-3 inline-block text-[0.84rem] font-medium text-[#1e6b45] transition-colors hover:text-[#238c55]">Browse reports →</a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {purchased.map((row) => {
              const upd = row.allAccess ? [] : reportUpdates(dates[row.seoSlug ?? ""], row.at);
              const pay = row.allAccess
                ? payments.find((p) => p.slug === null || /all-access/i.test(p.item))
                : payments.find((p) => p.slug === row.slug);
              const meta = row.allAccess
                ? `Every report & 3D across the site${pay ? ` · ${INR(pay.amountInr)}` : ""}${pay ? ` · unlocked ${fmtDate(pay.date)}` : ""}`
                : `${row.market ? `${row.market} · ` : ""}Full read${pay ? ` · ${INR(pay.amountInr)}` : ""}${pay ? ` · unlocked ${fmtDate(pay.date)}` : row.at ? ` · opened ${fmtDate(row.at)}` : ""}`;
              return (
                <ReportShell
                  key={row.slug}
                  initials={row.allAccess ? "TE" : initialsOf(row.name)}
                  acts={
                    <>
                      <a
                        href={reportHref(row.seoSlug)}
                        onClick={() => !row.allAccess && touch(row as { slug: string; name: string; market: string; seoSlug: string | null })}
                        className="rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.8rem] font-medium text-white transition-colors hover:bg-[#238c55]"
                      >
                        {row.allAccess ? "Browse reports →" : "Open report →"}
                      </a>
                      {pay && (
                        <button onClick={() => setInvoice(pay)} className="text-[0.78rem] font-medium text-[#9a7a2e] transition-colors hover:text-[#7a5f1e]">
                          Invoice ↗
                        </button>
                      )}
                    </>
                  }
                >
                  <p className="font-serif text-[1.1rem] font-medium leading-tight text-[#1a1a1a]">{row.name}</p>
                  <p className="mt-1 text-[0.78rem] font-light text-[#1a1a1a]/40">{meta}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Pill tone="green">✓ Purchased{row.allAccess ? " · All-Access" : ""}</Pill>
                    {!row.allAccess && upd.length === 0 && row.at && <Pill>No change since {fmtDate(row.at)}</Pill>}
                  </div>
                  <UpdateBadge updates={upd} since={row.at} />
                  {!row.allAccess && <RatingRow slug={row.slug} label="Rate this report" />}
                </ReportShell>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Viewed (opened, not bought) ── */}
      <section className="mt-8">
        <SubHead title="Viewed" count="opened, not bought" />
        {viewed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1a1a1a]/15 px-6 py-8 text-center">
            <p className="text-[0.9rem] font-light text-[#1a1a1a]/55">Reports you open — but haven&apos;t unlocked — show up here as previews.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {viewed.map((v) => {
              const upd = reportUpdates(dates[v.seoSlug ?? ""], v.at);
              return (
                <ReportShell
                  key={v.slug}
                  initials={initialsOf(v.name)}
                  acts={
                    <>
                      <a
                        href={reportHref(v.seoSlug)}
                        onClick={() => touch({ slug: v.slug, name: v.name, market: v.market, seoSlug: v.seoSlug })}
                        className="rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.8rem] font-medium text-white transition-colors hover:bg-[#238c55]"
                      >
                        Unlock · ₹999 →
                      </a>
                      <a
                        href={reportHref(v.seoSlug)}
                        onClick={() => touch({ slug: v.slug, name: v.name, market: v.market, seoSlug: v.seoSlug })}
                        className="text-[0.78rem] font-medium text-[#9a7a2e] transition-colors hover:text-[#7a5f1e]"
                      >
                        Reopen preview →
                      </a>
                    </>
                  }
                >
                  <p className="font-serif text-[1.1rem] font-medium leading-tight text-[#1a1a1a]">{v.name}</p>
                  <p className="mt-1 text-[0.78rem] font-light text-[#1a1a1a]/40">
                    {v.market ? `${v.market} · ` : ""}opened {fmtDate(v.at)} · preview only
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Pill>Preview</Pill>
                  </div>
                  <UpdateBadge updates={upd} since={v.at} />
                </ReportShell>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Invoices ── */}
      {payments.length > 0 && (
        <section className="mt-8">
          <SubHead title="Invoices" count={String(payments.length)} />
          <div className="flex flex-col gap-3">
            {[...payments].sort((a, b) => b.date - a.date).map((p) => (
              <div key={p.id} className="flex flex-col gap-2 rounded-2xl border border-[#1a1a1a]/[0.08] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[0.92rem] font-medium text-[#1a1a1a]">Invoice {p.invoiceNo} — {p.item}</p>
                  <p className="mt-0.5 text-[0.78rem] font-light text-[#1a1a1a]/45">{fmtDate(p.date)} · {INR(p.amountInr)} · paid via Razorpay</p>
                </div>
                <button onClick={() => setInvoice(p)} className="shrink-0 self-start text-[0.78rem] font-medium text-[#9a7a2e] transition-colors hover:text-[#7a5f1e] sm:self-auto">
                  View / download ↗
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {invoice && <InvoiceModal payment={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INVOICE — client-side, Truth Estate seller, no GST
   ════════════════════════════════════════════════════════════════ */
function InvoiceModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const account = loadAccount();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-[#0a0a0a]/55 backdrop-blur-sm" />
      <div className="animate-fade-up relative max-h-[92svh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl shadow-black/30">
        <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-[#1a1a1a]/12 text-[#1a1a1a]/50 transition-colors hover:text-[#1a1a1a]">✕</button>

        <div className="flex items-start justify-between gap-4 border-b border-[#1a1a1a]/10 pb-5">
          <div>
            <Logo color="#1a1a1a" className="h-6 w-auto" />
            <p className="mt-2 text-[0.72rem] font-light text-[#1a1a1a]/45">Independent real-estate intelligence</p>
          </div>
          <div className="text-right text-[0.7rem] leading-relaxed tracking-[0.08em] text-[#1a1a1a]/45">
            INVOICE
            <br />
            <span className="font-mono text-[0.9rem] font-medium tracking-normal text-[#1a1a1a]">{payment.invoiceNo}</span>
            <br />
            {fmtDate(payment.date)}
          </div>
        </div>

        <div className="mt-5 flex justify-between gap-6 text-[0.82rem] leading-relaxed text-[#1a1a1a]/60">
          <div>
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Billed to</p>
            <p className="mt-1 font-medium text-[#1a1a1a]">{account?.name || "Your account"}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Seller</p>
            <p className="mt-1 font-medium text-[#1a1a1a]">Truth Estate</p>
            <p className="text-[0.74rem]">Paid via Razorpay{payment.razorpayId ? ` · ${payment.razorpayId}` : ""}</p>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-[0.86rem]">
          <tbody>
            <tr>
              <td className="border-b border-[#1a1a1a]/[0.07] py-3 pr-3 text-[#1a1a1a]/80">{payment.item}</td>
              <td className="border-b border-[#1a1a1a]/[0.07] py-3 text-right font-medium tabular-nums text-[#1a1a1a]">{INR(payment.amountInr)}</td>
            </tr>
            <tr>
              <td className="border-b border-[#1a1a1a]/[0.07] py-3 pr-3 text-[#1a1a1a]/40">Tax</td>
              <td className="border-b border-[#1a1a1a]/[0.07] py-3 text-right text-[#1a1a1a]/40">—</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="font-serif text-[1.3rem] font-medium text-[#1a1a1a]">Total paid</span>
          <span className="font-serif text-[1.3rem] font-medium tabular-nums text-[#1a1a1a]">{INR(payment.amountInr)}</span>
        </div>

        <p className="mt-4 rounded-lg bg-[#c9a96e]/[0.1] px-3.5 py-3 text-[0.74rem] font-light leading-relaxed text-[#1a1a1a]/55">
          No GST is charged at present. This receipt confirms your payment to Truth Estate; the authoritative record is held against your account{payment.razorpayId ? " and the Razorpay reference above" : ""}.
        </p>

        <div className="mt-5 flex gap-2.5">
          <button onClick={() => window.print()} className="rounded-sm bg-[#1e6b45] px-5 py-2.5 text-[0.8rem] font-medium text-white transition-colors hover:bg-[#238c55]">Download PDF</button>
          <button onClick={onClose} className="rounded-sm border border-[#1a1a1a]/15 px-5 py-2.5 text-[0.8rem] font-light text-[#1a1a1a]/60 transition-colors hover:border-[#1a1a1a]/30">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY PORTFOLIO — the homes you self-declare you own
   ════════════════════════════════════════════════════════════════ */
function PortfolioSection() {
  const [owned, setOwned] = useState<(OwnedRecord & { slug: string })[]>([]);
  const [dates, setDates] = useState<ReportDates>({});
  const [showAdd, setShowAdd] = useState(false);
  const [vote, setVoteState] = useState<Vote | null>(null);

  useEffect(() => {
    setOwned(listOwned());
    setVoteState(getVote("add-property"));
    loadReportDates().then(setDates);
  }, []);

  const remove = (slug: string) => { unmarkOwned(slug); setOwned(listOwned()); };
  const castVote = (v: Vote) => { setVote("add-property", v); setVoteState(v); };
  const expanded = showAdd || vote != null;

  return (
    <div className="animate-fade-up">
      <SectionHead
        kicker="My Portfolio"
        title="The homes you actually own."
        sub="Mark a project as owned and its report lives here, kept current. If our read on it changes, you'll see which sections moved — and you can rate the report or tell us where we were right or wrong."
      />

      <section>
        <SubHead title="Owned" count={owned.length ? `${owned.length} propert${owned.length > 1 ? "ies" : "y"}` : undefined} />
        {owned.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1a1a1a]/15 px-6 py-9 text-center">
            <p className="font-serif text-[1.3rem] font-medium text-[#1a1a1a]">Nothing here yet.</p>
            <p className="mx-auto mt-2 max-w-[440px] text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/55">
              Open any report and hit &ldquo;I&apos;ve invested / I own this&rdquo; — it lands here, kept current, with a flag whenever our read on it changes.
            </p>
            <a href={`${basePath}/intelligence/projects`} className="mt-4 inline-block text-[0.84rem] font-medium text-[#1e6b45] transition-colors hover:text-[#238c55]">Browse reports →</a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {owned.map((o) => {
              const upd = reportUpdates(dates[o.seoSlug ?? ""], o.at);
              return (
                <ReportShell
                  key={o.slug}
                  initials={initialsOf(o.name)}
                  acts={
                    <>
                      <a
                        href={reportHref(o.seoSlug)}
                        onClick={() => recordReportView(o.slug, o.name, o.market, o.seoSlug)}
                        className="rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.8rem] font-medium text-white transition-colors hover:bg-[#238c55]"
                      >
                        Open report →
                      </a>
                      <button onClick={() => remove(o.slug)} className="text-[0.78rem] font-light text-[#1a1a1a]/40 transition-colors hover:text-[#b0503e]">
                        Remove
                      </button>
                    </>
                  }
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-serif text-[1.1rem] font-medium leading-tight text-[#1a1a1a]">{o.name}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#1e6b45]/30 bg-[#1e6b45]/[0.08] px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[#1e6b45]">
                      ● Owned · marked {fmtDate(o.at)}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.78rem] font-light text-[#1a1a1a]/40">{o.market ? `${o.market} · ` : ""}self-declared{o.note ? ` · ${o.note}` : ""}</p>
                  <UpdateBadge updates={upd} since={o.at} />
                  <RatingRow slug={o.slug} label="Your rating" />
                </ReportShell>
              );
            })}
          </div>
        )}

        {/* + Add a property you own → upcoming-feature vote (not built) */}
        {!expanded ? (
          <div className="mt-3 rounded-2xl border border-dashed border-[#1a1a1a]/15 p-6 text-center">
            <p className="text-[0.9rem] font-light text-[#1a1a1a]/55">Own something else? We&apos;re building a way to add any home you own.</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 rounded-sm border border-[#1a1a1a]/15 px-5 py-2.5 text-[0.8rem] font-medium text-[#1a1a1a] transition-colors hover:border-[#1a1a1a]/35">
              + Add a property you own
            </button>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-[#9a7a2e]/30 bg-[#c9a96e]/[0.06] p-6">
            <Eyebrow>Upcoming feature</Eyebrow>
            <h3 className="mt-1.5 font-serif text-[1.25rem] font-medium text-[#1a1a1a]">Add a home you already own.</h3>
            <p className="mt-2 max-w-[56ch] text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/60">
              Pull its live report into your portfolio, get told when our read changes, and keep it on your radar — even if you didn&apos;t buy through us. We&apos;re gauging interest before we build it.
            </p>
            {vote ? (
              <p className="mt-4 text-[0.84rem] font-medium text-[#1e6b45]">
                Thanks — your vote is in ({vote === "in" ? "interested" : "not for me"}). We prioritise what buyers actually ask for.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button onClick={() => castVote("in")} className="rounded-lg border border-[#1e6b45]/40 px-4 py-2.5 text-[0.82rem] font-medium text-[#1e6b45] transition-colors hover:bg-[#1e6b45]/[0.06]">
                  👍 Yes, I&apos;d use this
                </button>
                <button onClick={() => castVote("no")} className="rounded-lg border border-[#1a1a1a]/15 px-4 py-2.5 text-[0.82rem] font-medium text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a]/35">
                  Not for me
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-8">
        <SubHead title="How a project lands here" />
        <div className="rounded-2xl border border-[#1a1a1a]/[0.08] bg-white p-6">
          <p className="text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/65">
            Anywhere you read a report, an <b className="font-medium text-[#1a1a1a]">&ldquo;I&apos;ve invested / I own this&rdquo;</b> button adds it to your portfolio — self-declared, no proof needed. From then on we watch the report&apos;s section dates and tell you when anything material moves.
          </p>
        </div>
      </section>
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
          <span className="text-[0.72rem] font-light text-[#1a1a1a]/40">No GST charged</span>
        </div>

        <button
          onClick={pay}
          disabled={processing}
          className="mt-6 w-full rounded-sm bg-[#1e6b45] px-7 py-4 text-[0.86rem] font-medium tracking-[0.04em] text-white transition-all duration-300 enabled:hover:bg-[#238c55] disabled:opacity-70"
        >
          {processing ? "Processing…" : `Pay ${INR(MANDATE_FEE)} & activate`}
        </button>
        <p className="mt-4 text-center text-[0.76rem] font-light leading-relaxed text-[#1a1a1a]/45">
          Our advice isn&apos;t for sale · full fee transparency · refundable if we don&apos;t add value in 30 days.
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
