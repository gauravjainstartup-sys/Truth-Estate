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
  DealStage,
  OfficeDoc,
  OfficeRec,
  OfficeState,
  OfficeThread,
  STAGE_ARC,
  STAGE_ORDER,
  STAGE_LABEL,
  SECTIONS,
  SectionKey,
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
          {SECTIONS.map((s) => {
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
            </div>
            <PreviewStage value={active.stage} onChange={setStage} onReset={() => update(reseedOffice())} />
          </div>

          {section === "home" && <HomeSection thread={active} />}
          {section === "requirements" && <RequirementsSection state={state} activeId={active.id} onPick={setActive} />}
          {section === "recommendations" && <RecommendationsSection thread={active} />}
          {section === "advice" && <AdviceSection thread={active} onReschedule={(c) => patchThread(active.id, { call: c })} />}
          {section === "questions" && (
            <QuestionsSection thread={active} onAsk={(q) => patchThread(active.id, { questions: q })} />
          )}
          {section === "documents" && <DocumentsSection thread={active} />}
          {section === "portfolio" && <PortfolioSection thread={active} />}
        </div>
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

/* The journey arc — current stage highlighted. */
function StageArc({ stage }: { stage: DealStage }) {
  const cur = stageIndex(stage);
  return (
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
                className={`grid h-[22px] w-[22px] place-items-center rounded-full border text-[0.6rem] ${
                  reached ? "border-[#1e6b45] bg-[#1e6b45] text-white" : "border-[#1a1a1a]/20 bg-[#F5F0E8] text-[#1a1a1a]/30"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={`mt-2 text-[0.62rem] font-light uppercase tracking-[0.1em] ${here ? "text-[#1a1a1a]" : "text-[#1a1a1a]/40"}`}>
                {m.short}
              </span>
            </div>
            {i < STAGE_ARC.length - 1 && (
              <span className={`mx-2 mb-5 h-px flex-1 ${mi < cur ? "bg-[#1e6b45]/50" : "bg-[#1a1a1a]/12"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Preview-stage control — lets the demo reach later (locked / paid) states. */
function PreviewStage({ value, onChange, onReset }: { value: DealStage; onChange: (s: DealStage) => void; onReset: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[0.66rem] font-light uppercase tracking-[0.16em] text-[#1a1a1a]/35 sm:inline">Preview</span>
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
function RecommendationsSection({ thread }: { thread: OfficeThread }) {
  const postCall = stageIndex(thread.stage) >= stageIndex("call_done");
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

      {/* Post-call locked intelligence — the paywall teaser */}
      {postCall && !paid && (
        <div className="mt-7 rounded-xl border border-[#c9a96e]/30 bg-[#c9a96e]/[0.06] p-7 text-center">
          <div className="mx-auto mb-3 flex w-fit"><LockBadge label="Unlocks with your mandate" /></div>
          <p className="font-serif text-[1.3rem] font-medium text-[#1a1a1a]">The full picture is ready</p>
          <p className="mx-auto mt-2 max-w-[460px] text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/55">
            Two more projects we ruled out (with reasons), the unit-level shortlist, and the pricing intelligence your advisor prepared — unlock to see everything.
          </p>
          <Link href="/office/advice" className="mt-5 inline-block rounded-sm bg-[#1e6b45] px-6 py-3 text-[0.8rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
            Activate your mandate →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INDEPENDENT ADVICE — scheduled + reschedule + before-call + past
   ════════════════════════════════════════════════════════════════ */
function AdviceSection({ thread, onReschedule }: { thread: OfficeThread; onReschedule: (c: NonNullable<OfficeThread["call"]>) => void }) {
  const past = stageIndex(thread.stage) >= stageIndex("call_done");
  const upcoming = !past && !!thread.call;
  const done = past;
  const paid = isPaid(thread.stage);
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

      {/* After-call */}
      {done && (
        <div className="mt-8">
          <p className="mb-3 text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">After your call</p>
          <div className="grid gap-4 md:grid-cols-2">
            <AfterCallTile title="Call recording" body="Re-watch your consultation any time." locked={!paid} />
            <AfterCallTile title="Synopsis" body={thread.call?.summary ?? history[0]?.summary ?? "A written summary of what was discussed and decided."} locked={!paid} />
            <AfterCallTile title="What we're doing now" body="The actions your advisor is running on your behalf this week." locked={!paid} />
            <AfterCallTile title="Updated recommendations" body="What we found, what we ruled out, and the pricing intelligence." locked={!paid} href="/office/recommendations" />
          </div>
          {!paid && (
            <div className="mt-5 flex flex-col items-start gap-4 rounded-xl bg-[#1a1a1a] p-7 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-serif text-[1.35rem] font-medium">Activate your mandate to unlock everything</p>
                <p className="mt-1.5 text-[0.85rem] font-light text-white/55">Recording, synopsis, the full recommendation set and every report — and we begin representing you.</p>
              </div>
              <button className="shrink-0 cursor-not-allowed rounded-sm bg-[#1e6b45]/70 px-6 py-3 text-[0.8rem] font-medium tracking-[0.04em] text-white/80" title="Coming in the next phase">
                Activate · invoicing
              </button>
            </div>
          )}
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

function AfterCallTile({ title, body, locked, href }: { title: string; body: string; locked: boolean; href?: string }) {
  const inner = (
    <div className={`h-full rounded-xl border p-6 ${locked ? "border-[#1a1a1a]/[0.08] bg-[#1a1a1a]/[0.015]" : "border-[#1e6b45]/20 bg-white"}`}>
      <div className="flex items-center justify-between">
        <p className="font-serif text-[1.15rem] font-medium text-[#1a1a1a]">{title}</p>
        {locked ? <LockBadge /> : <span className="text-[0.7rem] font-light text-[#1e6b45]">Ready →</span>}
      </div>
      <p className="mt-2.5 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/55">{body}</p>
    </div>
  );
  return !locked && href ? <Link href={href}>{inner}</Link> : inner;
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
  return (
    <div className="animate-fade-up">
      <SectionHead kicker="Documents & Reports" title="Everything in one place" sub="Independent reports we prepare, and the paperwork you share — reviewed and annotated by your advisor." />
      <div className="flex flex-col gap-8">
        {groups.map((g) => {
          const docs = thread.docs.filter((d) => d.group === g);
          return (
            <div key={g}>
              <p className="mb-3 text-[10px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">{g}</p>
              <div className="overflow-hidden rounded-xl border border-[#1a1a1a]/[0.08]">
                {docs.map((d, i) => (
                  <div key={d.id} className={`flex items-center justify-between gap-4 px-5 py-4 ${i % 2 === 0 ? "bg-white" : "bg-[#F5F0E8]/60"}`}>
                    <div className="min-w-0">
                      <p className="text-[0.95rem] font-light text-[#1a1a1a]/80">{d.name}</p>
                      {d.note && <p className="mt-0.5 text-[0.76rem] font-light italic text-[#1a1a1a]/40">{d.note}</p>}
                    </div>
                    {d.status === "locked" ? <LockBadge /> : d.status === "uploaded" ? (
                      <span className="text-[0.74rem] font-light text-[#1e6b45]">Uploaded ✓</span>
                    ) : (
                      <span className="text-[0.74rem] font-light text-[#1e6b45]">Ready →</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-7 text-[0.8rem] font-light italic text-[#1a1a1a]/40">
        Upload unlocks once your mandate is active — your advisor reviews and annotates everything you share.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY PORTFOLIO
   ════════════════════════════════════════════════════════════════ */
function PortfolioSection({ thread }: { thread: OfficeThread }) {
  const owned = stageIndex(thread.stage) >= stageIndex("closed");
  return (
    <div className="animate-fade-up">
      <SectionHead kicker="My Portfolio" title="What you own" sub="Every property you close with us lives here — with the documents, the numbers, and our ongoing read." />
      {owned ? (
        <Card className="border-[#1e6b45]/25">
          <div className="flex items-center justify-between">
            <p className="font-serif text-[1.4rem] font-medium text-[#1a1a1a]">{thread.recs[0]?.name ?? "Your property"}</p>
            <span className="rounded-full border border-[#1e6b45]/30 bg-[#1e6b45]/8 px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.08em] text-[#1e6b45]">Owned</span>
          </div>
          <p className="mt-1 text-[0.82rem] font-light text-[#1a1a1a]/50">{thread.recs[0]?.developer} · {thread.recs[0]?.market}</p>
        </Card>
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
