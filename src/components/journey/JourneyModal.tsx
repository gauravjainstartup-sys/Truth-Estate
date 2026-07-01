"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../Logo";
import BuyersOffice from "./BuyersOffice";
import LocationPicker from "./LocationPicker";
import ProjectProfile from "../intelligence/ProjectProfile";
import FocusOffRamp from "../FocusOffRamp";
import { projectByName } from "@/lib/projects";
import { useConsultation } from "../consultation/ConsultationProvider";
import type { ConsultIntent, ConsultProfileChip } from "@/lib/consultation";
import {
  ACTIVE_PROJECT_COUNT,
  ADVISORS,
  Account,
  Advisor,
  Booking,
  BuyData,
  CONFIGS,
  DNA,
  GOALS,
  INVEST_HORIZONS,
  INVEST_OBJECTIVES,
  INVEST_PRIORITIES,
  INVEST_RISKS,
  Intent,
  InvestData,
  InvestRecommendation,
  InvestStrategy,
  LOCATIONS,
  MAX_INVEST_PRIORITIES,
  MAX_PRIORITIES,
  MAX_SELL_PRIORITIES,
  POSSESSION_OPTIONS,
  prioritiesFor,
  PURCHASE_TYPES,
  SELL_CONFIGS,
  SELL_PRIORITIES,
  SELL_PROJECTS,
  SELL_TIMELINES,
  Scored,
  SellData,
  SellStrategy,
  TIMELINES,
  RESEARCH_PLACEHOLDERS,
  RESEARCH_SUGGESTIONS,
  RESEARCH_TOPICS,
  ResearchResult,
  budgetLabel,
  classifyAndResearch,
  deriveDNA,
  deriveInvestStrategy,
  deriveSellStrategy,
  emptyBuyData,
  emptyInvestData,
  emptySellData,
  rankInvestProjects,
  rankProjects,
  saveAccount,
  saveBuyData,
} from "@/lib/journey";

/* ════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ════════════════════════════════════════════════════════════════ */

function Shell({
  onClose,
  onBack,
  progress,
  eyebrow,
  align = "center",
  wide,
  children,
}: {
  onClose: () => void;
  onBack?: () => void;
  progress?: number | null;
  eyebrow?: string;
  align?: "center" | "top";
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-full w-full flex-col bg-[#F5F0E8] text-[#1a1a1a]">
      <div className="h-[2px] w-full bg-[#1a1a1a]/8">
        {progress != null && (
          <div
            className="h-full bg-[#1e6b45] transition-all duration-700 ease-out"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        )}
      </div>

      <header className="flex items-center justify-between px-6 py-5 md:px-12 md:py-7">
        <Logo color="#1a1a1a" className="h-7 w-auto opacity-80 md:h-8" />
        {eyebrow && (
          <span className="hidden text-[10px] font-light uppercase tracking-[0.4em] text-[#1a1a1a]/40 md:block">
            {eyebrow}
          </span>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-[11px] font-light tracking-[0.18em] text-[#1a1a1a]/45 transition-colors duration-300 hover:text-[#1a1a1a]"
        >
          CLOSE
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className={`mx-auto flex min-h-full flex-col px-6 md:px-10 ${wide ? "max-w-5xl" : "max-w-3xl"} ${align === "top" ? "justify-start py-8 md:py-9" : "justify-center py-10 md:py-14"}`}>
          {children}
        </div>
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="absolute bottom-6 left-6 text-[11px] font-light tracking-[0.16em] text-[#1a1a1a]/40 transition-colors duration-300 hover:text-[#1a1a1a] md:bottom-8 md:left-12"
        >
          &larr; Back
        </button>
      )}
    </div>
  );
}

function ScreenHeading({
  kicker,
  title,
  sub,
  dense,
  compact,
}: {
  kicker?: string;
  title: React.ReactNode;
  sub?: string;
  dense?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={dense ? "mb-4 md:mb-5" : "mb-10 md:mb-14"}>
      {kicker && (
        <p className="mb-4 text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">{kicker}</p>
      )}
      <h2
        className={`font-serif font-medium leading-[1.12] text-[#1a1a1a] ${
          compact ? "text-[1.7rem] md:text-[2.3rem]" : "text-[2rem] md:text-[3rem]"
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p className="mt-5 max-w-xl text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.05rem]">
          {sub}
        </p>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  full,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-all duration-500 enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-30 ${
        full ? "w-full" : ""
      }`}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm border border-[#1a1a1a]/20 bg-white px-8 py-4 text-[13px] font-light tracking-[0.05em] text-[#1a1a1a]/80 transition-all duration-300 hover:border-[#1a1a1a]/40 hover:bg-white"
    >
      {children}
    </button>
  );
}

function NextBar({
  onNext,
  disabled,
  label = "Continue",
  tight,
}: {
  onNext: () => void;
  disabled?: boolean;
  label?: string;
  tight?: boolean;
}) {
  return (
    <div className={`flex justify-end ${tight ? "mt-6" : "mt-12 md:mt-16"}`}>
      <PrimaryButton onClick={onNext} disabled={disabled}>
        {label}
      </PrimaryButton>
    </div>
  );
}

function OptionRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-5 border-b py-5 text-left transition-colors duration-300 ${
        selected ? "border-[#1e6b45]/40" : "border-[#1a1a1a]/10 hover:border-[#1a1a1a]/25"
      }`}
    >
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
          selected ? "border-[#1e6b45]" : "border-[#1a1a1a]/30 group-hover:border-[#1a1a1a]/50"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-[#1e6b45]" />}
      </span>
      <span
        className={`font-serif text-[1.3rem] font-light transition-colors duration-300 md:text-[1.6rem] ${
          selected ? "text-[#1a1a1a]" : "text-[#1a1a1a]/65"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function PossessionRow({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-start gap-5 border-b py-4 text-left transition-colors duration-300 ${
        selected ? "border-[#1e6b45]/40" : "border-[#1a1a1a]/10 hover:border-[#1a1a1a]/25"
      }`}
    >
      <span
        className={`mt-1.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
          selected ? "border-[#1e6b45]" : "border-[#1a1a1a]/30 group-hover:border-[#1a1a1a]/50"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-[#1e6b45]" />}
      </span>
      <span className="flex flex-col gap-1">
        <span
          className={`font-serif text-[1.3rem] font-light leading-tight transition-colors duration-300 md:text-[1.6rem] ${
            selected ? "text-[#1a1a1a]" : "text-[#1a1a1a]/65"
          }`}
        >
          {label}
        </span>
        <span className="text-[0.84rem] font-light text-[#1a1a1a]/40 md:text-[0.9rem]">{sub}</span>
      </span>
    </button>
  );
}

function Chip({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled && !selected}
      className={`rounded-full border px-5 py-2.5 text-[0.85rem] font-light tracking-[0.02em] transition-all duration-300 md:text-[0.95rem] ${
        selected
          ? "border-[#1e6b45] bg-[#1e6b45] text-white shadow-md shadow-black/10"
          : disabled
          ? "cursor-not-allowed border-[#1a1a1a]/10 text-[#1a1a1a]/25"
          : "border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:border-[#1a1a1a]/45 hover:text-[#1a1a1a]"
      }`}
    >
      {label}
    </button>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/50 bg-[#c9a96e]/10 font-serif text-[1.1rem] font-medium text-[#1a1a1a]/70">
      {initials}
    </span>
  );
}

function useCountUp(end: number, run: boolean, dur = 1600) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let t0: number | null = null;
    let raf = 0;
    const tick = (ts: number) => {
      if (t0 == null) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, run, dur]);
  return n;
}

/* ════════════════════════════════════════════════════════════════
   STEP MACHINE
   ════════════════════════════════════════════════════════════════ */

const BUY_STEPS = ["possession", "purchase", "budget", "locations", "configs", "timeline", "priorities"] as const;
type BuyStep = (typeof BUY_STEPS)[number];

const SELL_STEPS = ["sell-intro", "sell-project", "sell-config", "sell-details", "sell-timeline", "sell-priorities"] as const;
type SellStep = (typeof SELL_STEPS)[number];

const INVEST_STEPS = ["invest-intro", "invest-capital", "invest-horizon", "invest-objective", "invest-risk", "invest-locations", "invest-priorities"] as const;
type InvestStep = (typeof INVEST_STEPS)[number];

type Step =
  | "welcome"
  | "goal"
  | "coming-soon"
  | BuyStep
  | "buy-offramp-rtm"
  | "buy-offramp-commercial"
  | SellStep
  | "sell-processing"
  | "sell-result"
  | "sell-consultation"
  | InvestStep
  | "invest-processing"
  | "invest-result"
  | "invest-consultation"
  | "processing"
  | "dna"
  | "shortlist"
  | "preview"
  | "truthguide"
  | "intelligence"
  | "consultation"
  | "auth"
  | "office"
  | "welcome-back"
  | "research";

const INTENT_STEP: Record<Intent, Step> = {
  buy: "possession",
  sell: "sell-intro",
  invest: "invest-intro",
  research: "research",
};

export default function JourneyModal({
  initialIntent,
  account,
  onClose,
}: {
  initialIntent?: Intent;
  account: Account | null;
  onClose: () => void;
}) {
  const initialStep: Step = initialIntent
    ? INTENT_STEP[initialIntent]
    : account
    ? "welcome-back"
    : "welcome";

  const [step, setStep] = useState<Step>(initialStep);
  const [goal, setGoal] = useState<Intent>(initialIntent ?? "buy");
  const [buy, setBuy] = useState<BuyData>(account?.buy ?? emptyBuyData);
  const [sell, setSell] = useState<SellData>(emptySellData);
  const [invest, setInvest] = useState<InvestData>(emptyInvestData);
  const [selected, setSelected] = useState<Scored | null>(null);
  // When editing a single answer from the Buyer DNA screen, the next "Continue"
  // returns straight to the DNA summary instead of walking forward.
  const [editReturn, setEditReturn] = useState(false);
  const [booking, setBooking] = useState<Booking>(account?.booking ?? null);
  const { openConsult } = useConsultation();
  const router = useRouter();

  // From any journey, "Request Independent Advice" hands off to the unified
  // consultation flow — preserving the journey context so the advisor
  // arrives already knowing the visitor's DNA. For a Buy journey we pass a
  // short profile summary, which puts the consultation on its warm
  // fast-track (skips re-asking what we already know).
  const consultProfile = (intent: ConsultIntent): ConsultProfileChip[] | undefined => {
    if (intent !== "buy") return undefined;
    return [
      { label: "Budget", value: dna.budgetRange },
      { label: "Markets", value: dna.markets.length ? dna.markets.slice(0, 3).join(", ") : "Open to guidance" },
      { label: "Timeline", value: dna.timeline },
      // Carries the chosen priorities — including deal-structure ones like a
      // flexible payment plan — into the advisor's brief.
      ...(buy.priorities.length ? [{ label: "Priorities", value: buy.priorities.join(", ") }] : []),
    ];
  };
  const requestAdvice = (intent: ConsultIntent) => {
    onClose();
    openConsult({ sourceKind: "journey", intent, profile: consultProfile(intent) });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const allScored = useMemo(() => rankProjects(buy), [buy]);
  const recs = useMemo(() => allScored.slice(0, 3), [allScored]);
  const dna = useMemo(() => deriveDNA(buy), [buy]);

  // Persist requirements once the buyer reaches the shortlist, so a project
  // report opened later reflects their real Match Score.
  useEffect(() => {
    if (step === "shortlist") saveBuyData(buy);
  }, [step, buy]);

  const set = <K extends keyof BuyData>(k: K, v: BuyData[K]) => setBuy((b) => ({ ...b, [k]: v }));
  // Priorities are tailored per purchase type — dropping the type prunes any
  // selections that no longer belong to the new profile's pool.
  const setPurchaseType = (t: string) =>
    setBuy((b) => {
      const pool = prioritiesFor(t);
      return { ...b, purchaseType: t, priorities: b.priorities.filter((p) => pool.includes(p)) };
    });
  const toggle = (k: "locations" | "configs", value: string) =>
    setBuy((b) => {
      const has = b[k].includes(value);
      return { ...b, [k]: has ? b[k].filter((x) => x !== value) : [...b[k], value] };
    });
  const togglePriority = (value: string) =>
    setBuy((b) => {
      const has = b.priorities.includes(value);
      if (has) return { ...b, priorities: b.priorities.filter((x) => x !== value) };
      if (b.priorities.length >= MAX_PRIORITIES) return b;
      return { ...b, priorities: [...b.priorities, value] };
    });

  const buyIndex = BUY_STEPS.indexOf(step as BuyStep);
  const inBuyFlow = buyIndex >= 0;
  const progress = inBuyFlow ? (buyIndex + 1) / BUY_STEPS.length : null;
  const nextBuy = () => {
    if (editReturn) {
      setEditReturn(false);
      setStep("dna");
      return;
    }
    if (buyIndex < BUY_STEPS.length - 1) setStep(BUY_STEPS[buyIndex + 1]);
    else setStep("dna");
  };
  const backBuy = () => {
    if (editReturn) setEditReturn(false);
    return buyIndex <= 0 ? setStep("goal") : setStep(BUY_STEPS[buyIndex - 1]);
  };

  const canContinue: Record<BuyStep, boolean> = {
    possession: buy.possession !== null,
    purchase: buy.purchaseType !== null,
    budget: true,
    locations: true,
    configs: true,
    timeline: buy.timeline !== null,
    priorities: buy.priorities.length > 0,
  };

  // Possession is a qualifier: "ready-to-move" diverts to the honest
  // off-ramp; "under-construction" and "open" continue into the journey.
  const nextPossession = () => {
    if (buy.possession === "ready-to-move") setStep("buy-offramp-rtm");
    else nextBuy();
  };
  const exploreMethodology = () => {
    onClose();
    router.push("/methodology");
  };

  const sellIndex = SELL_STEPS.indexOf(step as SellStep);
  const inSellFlow = sellIndex >= 0;
  const sellProgress = inSellFlow ? (sellIndex + 1) / SELL_STEPS.length : null;
  const nextSell = () =>
    sellIndex < SELL_STEPS.length - 1 ? setStep(SELL_STEPS[sellIndex + 1]) : setStep("sell-processing");
  const backSell = () => (sellIndex <= 0 ? setStep("goal") : setStep(SELL_STEPS[sellIndex - 1]));
  const setSellField = <K extends keyof SellData>(k: K, v: SellData[K]) => setSell((s) => ({ ...s, [k]: v }));
  const toggleSellPriority = (value: string) =>
    setSell((s) => {
      const has = s.priorities.includes(value);
      if (has) return { ...s, priorities: s.priorities.filter((x) => x !== value) };
      if (s.priorities.length >= MAX_SELL_PRIORITIES) return s;
      return { ...s, priorities: [...s.priorities, value] };
    });

  const canContinueSell: Record<SellStep, boolean> = {
    "sell-intro": true,
    "sell-project": sell.project !== null,
    "sell-config": sell.config !== null,
    "sell-details": true,
    "sell-timeline": sell.timeline !== null,
    "sell-priorities": sell.priorities.length > 0,
  };

  const investIndex = INVEST_STEPS.indexOf(step as InvestStep);
  const inInvestFlow = investIndex >= 0;
  const investProgress = inInvestFlow ? (investIndex + 1) / INVEST_STEPS.length : null;
  const nextInvest = () =>
    investIndex < INVEST_STEPS.length - 1 ? setStep(INVEST_STEPS[investIndex + 1]) : setStep("invest-processing");
  const backInvest = () => (investIndex <= 0 ? setStep("goal") : setStep(INVEST_STEPS[investIndex - 1]));
  const setInvestField = <K extends keyof InvestData>(k: K, v: InvestData[K]) => setInvest((s) => ({ ...s, [k]: v }));
  const toggleInvestLocation = (value: string) =>
    setInvest((s) => {
      const has = s.locations.includes(value);
      return { ...s, locations: has ? s.locations.filter((x) => x !== value) : [...s.locations, value] };
    });
  const toggleInvestPriority = (value: string) =>
    setInvest((s) => {
      const has = s.priorities.includes(value);
      if (has) return { ...s, priorities: s.priorities.filter((x) => x !== value) };
      if (s.priorities.length >= MAX_INVEST_PRIORITIES) return s;
      return { ...s, priorities: [...s.priorities, value] };
    });
  const canContinueInvest: Record<InvestStep, boolean> = {
    "invest-intro": true,
    "invest-capital": true,
    "invest-horizon": invest.horizon !== null,
    "invest-objective": invest.objective !== null,
    "invest-risk": invest.risk !== null,
    "invest-locations": true,
    "invest-priorities": invest.priorities.length > 0,
  };

  const completeAuth = () => {
    saveAccount({ name: "Member", createdAt: Date.now(), buy, booking });
    onClose();
    router.push("/office");
  };

  /* ── outer frame: entrance + background blur ── */
  const frame = (inner: React.ReactNode) => (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="The Truth Estate Journey">
      <div className="absolute inset-0 animate-journey-fade bg-[#0a0a0a]/45 backdrop-blur-xl" />
      <div className="absolute inset-0 animate-journey-in">{inner}</div>
    </div>
  );

  /* ─────────────── render by step ─────────────── */

  if (step === "welcome") {
    return frame(
      <Shell onClose={onClose} eyebrow="The Truth Estate Journey">
        <div key="welcome" className="animate-fade-up max-w-2xl">
          <ScreenHeading
            title={
              <>
                Welcome.
                <br />
                Let&apos;s understand
                <br />
                what you&apos;re looking for.
              </>
            }
            sub="We'll personalize everything from here."
          />
          <p className="mb-12 text-[0.8rem] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/40">
            Around 2 minutes
          </p>
          <PrimaryButton onClick={() => setStep("goal")}>Continue</PrimaryButton>
        </div>
      </Shell>
    );
  }

  if (step === "goal") {
    const pick = (g: Intent, live: boolean) => {
      setGoal(g);
      setStep(live ? INTENT_STEP[g] : "coming-soon");
    };
    return frame(
      <Shell onClose={onClose} eyebrow="The Truth Estate Journey">
        <div key="goal" className="animate-fade-up">
          <ScreenHeading title="What's your goal today?" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {GOALS.map((g) => (
              <button
                key={g.key}
                onClick={() => pick(g.key, g.live)}
                className="group flex flex-col items-start gap-6 rounded-xl border border-[#1a1a1a]/12 bg-white px-7 py-8 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1a1a1a]/25 hover:bg-white hover:shadow-lg hover:shadow-black/[0.04] md:px-8 md:py-10"
              >
                <span className="text-[2rem] transition-transform duration-500 group-hover:scale-110 md:text-[2.4rem]">
                  {g.icon}
                </span>
                <span className="flex w-full items-center justify-between">
                  <span className="font-serif text-[1.3rem] font-medium text-[#1a1a1a] md:text-[1.6rem]">
                    {g.label}
                  </span>
                  {!g.live && (
                    <span className="text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/35">
                      Soon
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (step === "coming-soon") {
    const g = GOALS.find((x) => x.key === goal);
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("goal")} eyebrow={g?.label}>
        <div key="coming-soon" className="animate-fade-up text-center">
          <span className="text-[3rem] md:text-[3.6rem]">{g?.icon}</span>
          <h2 className="mt-8 font-serif text-[2rem] font-medium leading-[1.15] text-[#1a1a1a] md:text-[3rem]">
            {g?.label} is coming soon.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[0.98rem] font-light leading-relaxed text-[#1a1a1a]/55">
            We&apos;re building this with the same independence and depth as our Buy experience.
            You&apos;ll be among the first to know when it opens.
          </p>
          <div className="mt-12 flex justify-center">
            <GhostButton onClick={() => setStep("goal")}>Explore Buying Instead</GhostButton>
          </div>
        </div>
      </Shell>
    );
  }

  /* ─────────────── SELL FLOW ─────────────── */

  if (step === "sell-intro") {
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("goal")} progress={sellProgress} eyebrow="Sell Property">
        <div key="sell-intro" className="animate-fade-up max-w-2xl">
          <ScreenHeading
            title={<>Tell us about<br />your property.</>}
            sub="We'll understand your property before suggesting the best selling strategy."
          />
          <PrimaryButton onClick={nextSell}>Continue</PrimaryButton>
        </div>
      </Shell>
    );
  }

  if (step === "sell-project") {
    return frame(
      <Shell onClose={onClose} onBack={backSell} progress={sellProgress} eyebrow="Sell Property">
        <div key="sell-project" className="animate-fade-up">
          <ScreenHeading title="Which project?" sub="Search for your project name." />
          <SellProjectSearch
            value={sell.project}
            onChange={(v) => setSellField("project", v)}
          />
          <NextBar onNext={nextSell} disabled={!canContinueSell["sell-project"]} />
        </div>
      </Shell>
    );
  }

  if (step === "sell-config") {
    return frame(
      <Shell onClose={onClose} onBack={backSell} progress={sellProgress} eyebrow="Sell Property">
        <div key="sell-config" className="animate-fade-up">
          <ScreenHeading title="Configuration" />
          <div className="flex flex-col">
            {SELL_CONFIGS.map((c) => (
              <OptionRow key={c} label={c} selected={sell.config === c} onClick={() => setSellField("config", c)} />
            ))}
          </div>
          <NextBar onNext={nextSell} disabled={!canContinueSell["sell-config"]} />
        </div>
      </Shell>
    );
  }

  if (step === "sell-details") {
    return frame(
      <Shell onClose={onClose} onBack={backSell} progress={sellProgress} eyebrow="Sell Property">
        <div key="sell-details" className="animate-fade-up">
          <ScreenHeading title="Property details" sub="All fields are optional — share what you know." />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SellTextField label="Tower" value={sell.tower} onChange={(v) => setSellField("tower", v)} placeholder="e.g. Tower A" />
            <SellTextField label="Floor" value={sell.floor} onChange={(v) => setSellField("floor", v)} placeholder="e.g. 12" />
            <SellTextField label="Facing" value={sell.facing} onChange={(v) => setSellField("facing", v)} placeholder="e.g. Park-facing" />
            <SellTextField label="Parking" value={sell.parking} onChange={(v) => setSellField("parking", v)} placeholder="e.g. 2 covered" />
          </div>
          <NextBar onNext={nextSell} />
        </div>
      </Shell>
    );
  }

  if (step === "sell-timeline") {
    return frame(
      <Shell onClose={onClose} onBack={backSell} progress={sellProgress} eyebrow="Sell Property">
        <div key="sell-timeline" className="animate-fade-up">
          <ScreenHeading title="When are you planning to sell?" />
          <div className="flex flex-col">
            {SELL_TIMELINES.map((t) => (
              <OptionRow key={t} label={t} selected={sell.timeline === t} onClick={() => setSellField("timeline", t)} />
            ))}
          </div>
          <NextBar onNext={nextSell} disabled={!canContinueSell["sell-timeline"]} />
        </div>
      </Shell>
    );
  }

  if (step === "sell-priorities") {
    const full = sell.priorities.length >= MAX_SELL_PRIORITIES;
    return frame(
      <Shell onClose={onClose} onBack={backSell} progress={sellProgress} eyebrow="Sell Property">
        <div key="sell-priorities" className="animate-fade-up">
          <ScreenHeading
            title="What matters most?"
            sub={`Select up to two. ${sell.priorities.length}/${MAX_SELL_PRIORITIES} chosen.`}
          />
          <div className="flex flex-wrap gap-3">
            {SELL_PRIORITIES.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={sell.priorities.includes(p)}
                onClick={() => toggleSellPriority(p)}
                disabled={full}
              />
            ))}
          </div>
          <NextBar onNext={nextSell} disabled={!canContinueSell["sell-priorities"]} label="See my strategy" />
        </div>
      </Shell>
    );
  }

  if (step === "sell-processing") {
    return frame(<SellProcessingScreen onDone={() => setStep("sell-result")} />);
  }

  if (step === "sell-result") {
    const strategy = deriveSellStrategy(sell);
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("sell-priorities")} eyebrow="Your Selling Strategy">
        <SellResultScreen
          sell={sell}
          strategy={strategy}
          onConsult={() => requestAdvice("sell")}
        />
      </Shell>
    );
  }

  if (step === "sell-consultation") {
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("sell-result")} eyebrow="Consultation">
        <div key="sell-consult" className="animate-fade-up">
          <ScreenHeading
            title={<>Every property deserves<br />a different selling strategy.</>}
            sub="Meet one of our advisors to discuss pricing, positioning, timing and negotiation. No sales pressure. No obligation."
          />
          <div className="flex flex-col gap-5">
            {ADVISORS.map((a) => (
              <AdvisorCard key={a.name} advisor={a} onBook={(slot) => {
                setBooking({ advisorName: a.name, slot });
                setStep("auth");
              }} />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  /* ─────────────── INVEST FLOW ─────────────── */

  if (step === "invest-intro") {
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("goal")} progress={investProgress} eyebrow="Invest">
        <div key="invest-intro" className="animate-fade-up max-w-2xl">
          <ScreenHeading
            title={<>Tell us about<br />your investment goals.</>}
            sub="We'll build a thesis around your capital, timeline, and risk appetite — not a property listing."
          />
          <PrimaryButton onClick={nextInvest}>Continue</PrimaryButton>
        </div>
      </Shell>
    );
  }

  if (step === "invest-capital") {
    return frame(
      <Shell onClose={onClose} onBack={backInvest} progress={investProgress} eyebrow="Invest">
        <div key="invest-capital" className="animate-fade-up">
          <ScreenHeading title="How much are you looking to deploy?" sub="This helps us calibrate the opportunity set." />
          <div className="mt-4">
            <div className="mb-10 text-center">
              <span className="font-serif text-[3.4rem] font-medium leading-none text-[#1a1a1a] md:text-[5rem]">
                {budgetLabel(invest.capitalCr)}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={21}
              step={1}
              value={invest.capitalCr}
              onChange={(e) => setInvestField("capitalCr", Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: "#1e6b45" }}
            />
            <div className="mt-4 flex justify-between text-[0.78rem] font-light tracking-[0.04em] text-[#1a1a1a]/40">
              <span>₹1 Cr</span>
              <span>₹20 Cr+</span>
            </div>
          </div>
          <NextBar onNext={nextInvest} />
        </div>
      </Shell>
    );
  }

  if (step === "invest-horizon") {
    return frame(
      <Shell onClose={onClose} onBack={backInvest} progress={investProgress} eyebrow="Invest">
        <div key="invest-horizon" className="animate-fade-up">
          <ScreenHeading title="What's your investment horizon?" />
          <div className="flex flex-col">
            {INVEST_HORIZONS.map((h) => (
              <OptionRow key={h} label={h} selected={invest.horizon === h} onClick={() => setInvestField("horizon", h)} />
            ))}
          </div>
          <NextBar onNext={nextInvest} disabled={!canContinueInvest["invest-horizon"]} />
        </div>
      </Shell>
    );
  }

  if (step === "invest-objective") {
    return frame(
      <Shell onClose={onClose} onBack={backInvest} progress={investProgress} eyebrow="Invest">
        <div key="invest-objective" className="animate-fade-up">
          <ScreenHeading title="What's your primary objective?" />
          <div className="flex flex-col">
            {INVEST_OBJECTIVES.map((o) => (
              <OptionRow key={o} label={o} selected={invest.objective === o} onClick={() => setInvestField("objective", o)} />
            ))}
          </div>
          <NextBar onNext={nextInvest} disabled={!canContinueInvest["invest-objective"]} />
        </div>
      </Shell>
    );
  }

  if (step === "invest-risk") {
    return frame(
      <Shell onClose={onClose} onBack={backInvest} progress={investProgress} eyebrow="Invest">
        <div key="invest-risk" className="animate-fade-up">
          <ScreenHeading title="What's your risk appetite?" sub="Be honest — it shapes everything we recommend." />
          <div className="flex flex-col">
            {INVEST_RISKS.map((r) => (
              <OptionRow key={r} label={r} selected={invest.risk === r} onClick={() => setInvestField("risk", r)} />
            ))}
          </div>
          <NextBar onNext={nextInvest} disabled={!canContinueInvest["invest-risk"]} />
        </div>
      </Shell>
    );
  }

  if (step === "invest-locations") {
    return frame(
      <Shell onClose={onClose} onBack={backInvest} progress={investProgress} eyebrow="Invest">
        <div key="invest-locations" className="animate-fade-up">
          <ScreenHeading
            title="Preferred markets"
            sub="Select any that interest you — or none, and we'll guide you."
          />
          <div className="flex flex-wrap gap-3">
            {LOCATIONS.map((l) => (
              <Chip key={l} label={l} selected={invest.locations.includes(l)} onClick={() => toggleInvestLocation(l)} />
            ))}
          </div>
          <NextBar onNext={nextInvest} />
        </div>
      </Shell>
    );
  }

  if (step === "invest-priorities") {
    const full = invest.priorities.length >= MAX_INVEST_PRIORITIES;
    return frame(
      <Shell onClose={onClose} onBack={backInvest} progress={investProgress} eyebrow="Invest">
        <div key="invest-priorities" className="animate-fade-up">
          <ScreenHeading
            title="What matters most?"
            sub={`Select up to three. ${invest.priorities.length}/${MAX_INVEST_PRIORITIES} chosen.`}
          />
          <div className="flex flex-wrap gap-3">
            {INVEST_PRIORITIES.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={invest.priorities.includes(p)}
                onClick={() => toggleInvestPriority(p)}
                disabled={full}
              />
            ))}
          </div>
          <NextBar onNext={nextInvest} disabled={!canContinueInvest["invest-priorities"]} label="See my strategy" />
        </div>
      </Shell>
    );
  }

  if (step === "invest-processing") {
    return frame(<InvestProcessingScreen onDone={() => setStep("invest-result")} />);
  }

  if (step === "invest-result") {
    const strategy = deriveInvestStrategy(invest);
    const recommendations = rankInvestProjects(invest);
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("invest-priorities")} eyebrow="Your Investment Strategy">
        <InvestResultScreen
          invest={invest}
          strategy={strategy}
          recommendations={recommendations}
          onConsult={() => requestAdvice("invest")}
        />
      </Shell>
    );
  }

  if (step === "invest-consultation") {
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("invest-result")} eyebrow="Consultation">
        <div key="invest-consult" className="animate-fade-up">
          <ScreenHeading
            title={<>Every portfolio deserves<br />an independent perspective.</>}
            sub="Meet an advisor who understands investment strategy — not just property listings. No sales pressure. No obligation."
          />
          <div className="flex flex-col gap-5">
            {ADVISORS.map((a) => (
              <AdvisorCard key={a.name} advisor={a} onBook={(slot) => {
                setBooking({ advisorName: a.name, slot });
                setStep("auth");
              }} />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  /* ─────────────── BUY FLOW ─────────────── */

  if (step === "possession") {
    return frame(
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy Property" align="top">
        <div key="possession" className="animate-fade-up">
          <ScreenHeading
            dense
            kicker="Where you're looking"
            title="Under construction, or ready to move?"
            sub="Truth Estate specialises in under-construction homes in Gurugram — where delivery risk is real and independent diligence changes the outcome."
          />
          <div className="flex flex-col">
            {POSSESSION_OPTIONS.map((o) => (
              <PossessionRow
                key={o.key}
                label={o.label}
                sub={o.sub}
                selected={buy.possession === o.key}
                onClick={() => set("possession", o.key)}
              />
            ))}
          </div>
          <button
            onClick={() => setStep("buy-offramp-commercial")}
            className="mt-4 text-[0.86rem] font-light text-[#1a1a1a]/45 underline decoration-[#1a1a1a]/15 underline-offset-4 transition-colors hover:text-[#1a1a1a]/80"
          >
            Looking for commercial space instead?
          </button>
          <NextBar onNext={nextPossession} disabled={!canContinue.possession} tight />
        </div>
      </Shell>
    );
  }

  if (step === "buy-offramp-rtm") {
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("possession")} eyebrow="Buy Property">
        <FocusOffRamp kind="ready-to-move" locations={buy.locations} onExplore={exploreMethodology} />
      </Shell>
    );
  }

  if (step === "buy-offramp-commercial") {
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("possession")} eyebrow="Buy Property">
        <FocusOffRamp kind="commercial" locations={buy.locations} />
      </Shell>
    );
  }

  if (step === "purchase") {
    return frame(
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy Property">
        <div key="purchase" className="animate-fade-up">
          <ScreenHeading title="What best describes your purchase?" />
          <div className="flex flex-col">
            {PURCHASE_TYPES.map((t) => (
              <OptionRow
                key={t}
                label={t}
                selected={buy.purchaseType === t}
                onClick={() => setPurchaseType(t)}
              />
            ))}
          </div>
          <NextBar onNext={nextBuy} disabled={!canContinue.purchase} />
        </div>
      </Shell>
    );
  }

  if (step === "budget") {
    return frame(
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy Property">
        <div key="budget" className="animate-fade-up">
          <ScreenHeading title="What's your budget?" sub="Drag to set the range you're comfortable exploring." />
          <div className="mt-4">
            <div className="mb-10 text-center">
              <span className="font-serif text-[3.4rem] font-medium leading-none text-[#1a1a1a] md:text-[5rem]">
                {budgetLabel(buy.budgetCr)}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={21}
              step={1}
              value={buy.budgetCr}
              onChange={(e) => set("budgetCr", Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: "#1e6b45" }}
            />
            <div className="mt-4 flex justify-between text-[0.78rem] font-light tracking-[0.04em] text-[#1a1a1a]/40">
              <span>₹1 Cr</span>
              <span>₹20 Cr+</span>
            </div>
          </div>
          <NextBar onNext={nextBuy} />
        </div>
      </Shell>
    );
  }

  if (step === "locations") {
    return frame(
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy Property">
        <div key="locations" className="animate-fade-up">
          <ScreenHeading
            title="Where are you looking?"
            sub="Think in areas, sectors or landmarks — we'll map it to the right micro-market."
          />
          <LocationPicker value={buy.locations} onChange={(m) => set("locations", m)} />
          <NextBar onNext={nextBuy} />
        </div>
      </Shell>
    );
  }

  if (step === "configs") {
    return frame(
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy Property">
        <div key="configs" className="animate-fade-up">
          <ScreenHeading title="Configuration" sub="What sizes feel right? Choose as many as you like." />
          <div className="flex flex-wrap gap-3">
            {CONFIGS.map((c) => (
              <Chip key={c} label={c} selected={buy.configs.includes(c)} onClick={() => toggle("configs", c)} />
            ))}
          </div>
          <NextBar onNext={nextBuy} />
        </div>
      </Shell>
    );
  }

  if (step === "timeline") {
    return frame(
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy Property">
        <div key="timeline" className="animate-fade-up">
          <ScreenHeading title="What's your timeline?" />
          <div className="flex flex-col">
            {TIMELINES.map((t) => (
              <OptionRow key={t} label={t} selected={buy.timeline === t} onClick={() => set("timeline", t)} />
            ))}
          </div>
          <NextBar onNext={nextBuy} disabled={!canContinue.timeline} />
        </div>
      </Shell>
    );
  }

  if (step === "priorities") {
    const full = buy.priorities.length >= MAX_PRIORITIES;
    const pool = prioritiesFor(buy.purchaseType);
    return frame(
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy Property">
        <div key="priorities" className="animate-fade-up">
          <ScreenHeading
            title="What matters most?"
            sub={`Select up to three. ${buy.priorities.length}/${MAX_PRIORITIES} chosen.`}
          />
          <div className="flex flex-wrap gap-3">
            {pool.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={buy.priorities.includes(p)}
                onClick={() => togglePriority(p)}
                disabled={full}
              />
            ))}
          </div>
          <NextBar onNext={nextBuy} disabled={!canContinue.priorities} label="See my Buyer DNA" />
        </div>
      </Shell>
    );
  }

  if (step === "processing") {
    return frame(<ProcessingScreen onDone={() => setStep("shortlist")} />);
  }

  if (step === "dna") {
    const editStep = (s: BuyStep) => {
      setEditReturn(true);
      setStep(s);
    };
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("priorities")} eyebrow="Your Buyer DNA" align="top" wide>
        <DnaScreen dna={dna} onContinue={() => setStep("processing")} onEdit={editStep} />
      </Shell>
    );
  }

  if (step === "shortlist") {
    return frame(
      <Shell onClose={onClose} eyebrow="Your Shortlist" align="top" wide>
        <ShortlistScreen
          recs={recs}
          onPick={(r) => {
            setSelected(r);
            setStep("preview");
          }}
          onChangePreferences={() => setStep("dna")}
          onConsult={() => requestAdvice("buy")}
        />
      </Shell>
    );
  }

  if (step === "preview" && selected) {
    const intel = projectByName(selected.name);
    return frame(
      intel ? (
        <ProjectProfile
          key={intel.slug}
          p={intel}
          embedded
          onClose={onClose}
          onBack={() => setStep("shortlist")}
          onConsult={() => requestAdvice("buy")}
          onChallenge={() => setStep("truthguide")}
          onSelectAlternative={(name) => {
            const s = allScored.find((x) => x.name === name);
            if (s) setSelected(s);
          }}
        />
      ) : (
        <Shell onClose={onClose} onBack={() => setStep("shortlist")} eyebrow="Project Preview">
          <div className="animate-fade-up">
            <ScreenHeading title={selected.name} sub="Full intelligence for this project is being prepared." />
          </div>
        </Shell>
      )
    );
  }

  if (step === "truthguide" && selected) {
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("preview")} eyebrow="TruthGuide">
        <ContextualTruthGuide
          project={selected}
          dna={dna}
          onConsult={() => requestAdvice("buy")}
          onExplore={() => setStep("shortlist")}
        />
      </Shell>
    );
  }

  if (step === "intelligence" && selected) {
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("preview")} eyebrow="Full Intelligence">
        <FullIntelligence
          project={selected}
          alternatives={recs.filter((r) => r.name !== selected.name)}
          onConsult={() => requestAdvice("buy")}
          onExplore={() => setStep("shortlist")}
        />
      </Shell>
    );
  }

  if (step === "consultation") {
    return frame(
      <Shell onClose={onClose} onBack={() => setStep(selected ? "preview" : "shortlist")} eyebrow="Consultation">
        <ConsultationScreen
          onBook={(advisorName, slot) => {
            setBooking({ advisorName, slot });
            setStep("auth");
          }}
        />
      </Shell>
    );
  }

  if (step === "auth") {
    return frame(
      <Shell onClose={onClose} onBack={() => setStep("consultation")} eyebrow="Your Buyer's Office">
        <AuthScreen booking={booking} onContinue={completeAuth} />
      </Shell>
    );
  }

  if (step === "office") {
    return frame(<BuyersOffice buy={buy} booking={booking} onClose={onClose} />);
  }

  if (step === "welcome-back") {
    return frame(
      <Shell onClose={onClose} eyebrow="Welcome Back">
        <div key="welcome-back" className="animate-fade-up max-w-2xl">
          <ScreenHeading title={<>Welcome back.<br />Continue your journey.</>} />
          <div className="flex flex-col gap-3.5">
            <PrimaryButton
              onClick={() => {
                if (account) {
                  setBuy(account.buy);
                  setBooking(account.booking);
                }
                onClose();
                router.push("/office");
              }}
            >
              Open Your Buyer&apos;s Office
            </PrimaryButton>
            <GhostButton
              onClick={() => {
                if (account) setBuy(account.buy);
                setStep("purchase");
              }}
            >
              Update My Requirements
            </GhostButton>
            <GhostButton
              onClick={() => {
                setBuy(emptyBuyData);
                setStep("welcome");
              }}
            >
              Start a New Journey
            </GhostButton>
          </div>
        </div>
      </Shell>
    );
  }

  if (step === "research") {
    return frame(
      <ResearchWorkspace
        onClose={onClose}
        onConsult={() => requestAdvice("research")}
        onStartJourney={() => setStep("goal")}
      />
    );
  }

  // Fallback (e.g. preview without selection): return to shortlist frame
  return frame(
    <Shell onClose={onClose} eyebrow="The Truth Estate Journey">
      <div className="animate-fade-up">
        <ScreenHeading title="Let's continue." />
        <PrimaryButton onClick={() => setStep("welcome")}>Start Your Journey</PrimaryButton>
      </div>
    </Shell>
  );
}

/* ════════════════════════════════════════════════════════════════
   AI PROCESSING
   ════════════════════════════════════════════════════════════════ */
function ProcessingScreen({ onDone }: { onDone: () => void }) {
  const lines = useMemo(
    () => [
      "Understanding your priorities…",
      "Comparing active projects…",
      "Evaluating developer quality…",
      "Finding opportunities…",
    ],
    []
  );
  const [i, setI] = useState(0);
  useEffect(() => {
    const rot = setInterval(() => setI((x) => (x + 1) % 4), 1000);
    const done = setTimeout(onDone, 4200);
    return () => {
      clearInterval(rot);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#F5F0E8] px-6 text-center text-[#1a1a1a]">
      <div className="relative mb-12 h-12 w-12">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-[#1a1a1a]/10 border-t-[#1e6b45]" />
      </div>
      <h2 className="mb-6 font-serif text-[1.7rem] font-medium text-[#1a1a1a] md:text-[2.4rem]">
        Analysing your preferences…
      </h2>
      <p key={i} className="animate-fade-up font-serif text-[1.1rem] font-light italic text-[#1a1a1a]/55 md:text-[1.4rem]">
        {lines[i]}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BUYER DNA (profile)
   ════════════════════════════════════════════════════════════════ */
function DnaScreen({
  dna,
  onContinue,
  onEdit,
}: {
  dna: DNA;
  onContinue: () => void;
  onEdit: (step: BuyStep) => void;
}) {
  const article = /^[aeiou]/i.test(dna.archetype) ? "an" : "a";
  return (
    <div key="dna" className="animate-fade-up">
      <div className="grid grid-cols-1 gap-9 md:grid-cols-2 md:gap-14">
        {/* ── Identity ── */}
        <div className="md:pt-6">
          <p className="text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">Your Buyer DNA</p>
          <h2 className="mt-5 font-serif text-[2.1rem] font-medium leading-[1.06] text-[#1a1a1a] md:text-[3rem]">
            You&apos;re {article} <span className="text-[#1e6b45]">{dna.archetype}</span>.
          </h2>
          <p className="mt-5 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/60 md:text-[1.08rem]">
            {dna.insight}
          </p>
          {/* desktop CTA + anticipation */}
          <div className="mt-9 hidden md:block">
            <PrimaryButton onClick={onContinue}>See what we&apos;d investigate</PrimaryButton>
            <p className="mt-4 text-[0.82rem] font-light text-[#1a1a1a]/45">
              Next: we scan {ACTIVE_PROJECT_COUNT} projects against your brief.
            </p>
          </div>
        </div>

        {/* ── The brief ── */}
        <div className="rounded-2xl border border-[#1a1a1a]/10 bg-white/60 p-6 md:p-7">
          <div className="mb-1.5 flex items-baseline justify-between">
            <p className="text-[10px] font-light uppercase tracking-[0.3em] text-[#c9a96e]">Your Brief</p>
            <p className="text-[0.72rem] font-light text-[#1a1a1a]/35">Tap to change</p>
          </div>
          <BriefRow label="Budget" value={dna.budgetRange} onEdit={() => onEdit("budget")} />
          <BriefRow label="Preferred Markets" value={dna.markets.join(" · ")} onEdit={() => onEdit("locations")} />
          <BriefRow label="Configuration" value={dna.config} onEdit={() => onEdit("configs")} />
          <BriefRow label="Timeline" value={dna.timeline} onEdit={() => onEdit("timeline")} />
          <BriefRow label="Focus" value={dna.possession} />
          <BriefRow label="Risk Appetite" value={dna.risk} onEdit={() => onEdit("purchase")} />
          <BriefRow label="Top Priorities" value={dna.topPriorities.join(" · ")} onEdit={() => onEdit("priorities")} />
        </div>
      </div>

      {/* ── Mobile anticipation + sticky CTA ── */}
      <p className="mt-8 text-center text-[0.82rem] font-light text-[#1a1a1a]/45 md:hidden">
        Next: we scan {ACTIVE_PROJECT_COUNT} projects against your brief.
      </p>
      <div className="sticky bottom-0 -mx-6 mt-4 border-t border-[#1a1a1a]/10 bg-[#F5F0E8]/95 px-6 py-4 backdrop-blur md:hidden">
        <PrimaryButton onClick={onContinue} full>
          See what we&apos;d investigate
        </PrimaryButton>
      </div>
    </div>
  );
}

/* A single editable line in the Buyer DNA "brief" — label left, value right,
   tap to jump back and change it. Omit onEdit to render a fixed row. */
function BriefRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <button
      onClick={onEdit}
      disabled={!onEdit}
      className="group flex w-full items-baseline justify-between gap-5 border-b border-[#1a1a1a]/[0.07] py-3.5 text-left last:border-0 disabled:cursor-default"
    >
      <span className="shrink-0 text-[10px] font-light uppercase tracking-[0.18em] text-[#1a1a1a]/40">{label}</span>
      <span className="flex items-center gap-1.5 text-right font-serif text-[1rem] font-light leading-snug text-[#1a1a1a] transition-colors group-enabled:group-hover:text-[#1e6b45] md:text-[1.05rem]">
        {value}
        {onEdit && (
          <span className="text-[0.68rem] text-[#c9a96e] opacity-45 transition-opacity group-hover:opacity-100" aria-hidden>
            ✎
          </span>
        )}
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHORTLIST — 127 → 3 reveal + recommendations
   ════════════════════════════════════════════════════════════════ */
/* An animated circular gauge for the Truth Score (out of 100). */
function ScoreRing({ score, delay = 0 }: { score: number; delay?: number }) {
  const R = 27;
  const C = 2 * Math.PI * R;
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={R} fill="none" stroke="#1a1a1a" strokeOpacity="0.08" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="#1e6b45"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={on ? C * (1 - score / 100) : C}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif text-[1.3rem] font-medium leading-none text-[#1a1a1a]">{score}</span>
      </div>
    </div>
  );
}

/* Recommendation badge, colour-coded by conviction. */
function RecoPill({ reco }: { reco: string }) {
  const cls =
    reco === "Strong Buy"
      ? "border-[#1e6b45]/25 bg-[#1e6b45]/[0.09] text-[#1e6b45]"
      : reco === "Buy"
      ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.14] text-[#9a7a2e]"
      : "border-[#1a1a1a]/15 bg-[#1a1a1a]/[0.04] text-[#1a1a1a]/55";
  return (
    <span className={`rounded-full border px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.08em] ${cls}`}>
      {reco}
    </span>
  );
}

function ShortlistScreen({
  recs,
  onPick,
  onChangePreferences,
  onConsult,
}: {
  recs: Scored[];
  onPick: (r: Scored) => void;
  onChangePreferences: () => void;
  onConsult: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const total = useCountUp(ACTIVE_PROJECT_COUNT, true, 1700);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div key="shortlist" className="animate-fade-up">
      {/* ── Compact reveal header ── */}
      <div className="text-center">
        <p className="text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">Your Shortlist</p>
        <h2 className="mx-auto mt-4 max-w-xl font-serif text-[1.6rem] font-medium leading-tight text-[#1a1a1a] md:text-[2.1rem]">
          Based on everything you&apos;ve shared.
        </h2>
        <div className="mt-5 inline-flex items-center gap-4 rounded-full border border-[#1a1a1a]/10 bg-white/60 px-6 py-2.5 md:gap-5">
          <span className="font-serif text-[1.7rem] font-medium leading-none text-[#1a1a1a] md:text-[2rem]">{total}</span>
          <span className="text-[0.68rem] font-light uppercase tracking-[0.16em] text-[#1a1a1a]/45">active projects</span>
          <span className="text-[#c9a96e]" aria-hidden>&rarr;</span>
          <span className="font-serif text-[1.7rem] font-medium leading-none text-[#1e6b45] md:text-[2rem]">{recs.length}</span>
          <span className="text-[0.68rem] font-light uppercase tracking-[0.16em] text-[#1e6b45]/70">worth investigating</span>
        </div>
      </div>

      {/* ── Cards ── */}
      <div
        className="mt-9 transition-all duration-1000 md:mt-11"
        style={{ opacity: revealed ? 1 : 0, transform: revealed ? "translateY(0)" : "translateY(20px)" }}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          {recs.map((r, idx) => (
            <button
              key={r.name}
              onClick={() => onPick(r)}
              className="group flex flex-col rounded-2xl border border-[#1a1a1a]/10 bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1a1a1a]/20 hover:shadow-xl hover:shadow-black/[0.06]"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-[0.95rem] font-light text-[#1a1a1a]/30">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <RecoPill reco={r.recommendation} />
              </div>

              <h3 className="mt-4 font-serif text-[1.3rem] font-medium leading-tight text-[#1a1a1a]">{r.name}</h3>
              <p className="mt-1.5 text-[0.78rem] font-light tracking-[0.03em] text-[#1a1a1a]/45">
                {r.developer} · {r.market}
              </p>

              <div className="mt-5 flex items-center gap-4">
                <div className="text-center">
                  <ScoreRing score={r.truthScore} delay={revealed ? 200 + idx * 120 : 4000} />
                  <p className="mt-1.5 text-[8px] font-light uppercase tracking-[0.16em] text-[#1a1a1a]/40">Truth Score</p>
                </div>
                <div className="h-11 w-px bg-[#1a1a1a]/10" />
                <div>
                  <p className="font-serif text-[1.6rem] font-medium leading-none text-[#1e6b45]">{r.matchPct}%</p>
                  <p className="mt-1.5 text-[8px] font-light uppercase tracking-[0.16em] text-[#1a1a1a]/40">Match to you</p>
                </div>
              </div>

              <p className="mt-5 flex-1 text-[0.86rem] font-light leading-relaxed text-[#1a1a1a]/60">{r.reason}</p>

              <p className="mt-5 border-t border-[#1a1a1a]/[0.07] pt-4 text-[0.76rem] font-light tracking-[0.02em] text-[#1a1a1a]/50">
                {r.configs.join(" · ")}
                <span className="mx-2 text-[#c9a96e]">·</span>
                ₹{r.budget[0]}–{r.budget[1]} Cr
              </p>

              <span className="mt-5 inline-flex items-center gap-1.5 text-[0.84rem] font-medium text-[#1e6b45] transition-all duration-300 group-hover:gap-2.5">
                See the full read <span aria-hidden>&rarr;</span>
              </span>
            </button>
          ))}
        </div>

        {/* ── CTA band ── */}
        <div className="mt-9 rounded-2xl border border-[#1a1a1a]/10 bg-white/50 px-7 py-8 text-center md:mt-11">
          <p className="font-serif text-[1.2rem] font-medium text-[#1a1a1a] md:text-[1.4rem]">
            Not sure which one is right for you?
          </p>
          <p className="mx-auto mt-2.5 max-w-md text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/55">
            Talk it through with an independent advisor who represents only you — no pressure,
            just an honest read on your options.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <PrimaryButton onClick={onConsult}>Request Independent Advice</PrimaryButton>
            <button
              onClick={onChangePreferences}
              className="inline-flex items-center gap-2 rounded-sm border border-[#1a1a1a]/20 bg-white px-8 py-4 text-[13px] font-light tracking-[0.05em] text-[#1a1a1a]/75 transition-all duration-300 hover:border-[#1a1a1a]/40"
            >
              Refine my preferences
            </button>
          </div>
          <p className="mt-6 text-[0.75rem] font-light italic text-[#1a1a1a]/35">
            No pricing yet — and no registration. Just our honest read.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-right">
      <p
        className={`font-serif text-[1.2rem] font-medium leading-none md:text-[1.45rem] ${
          accent ? "text-[#1e6b45]" : "text-[#1a1a1a]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">{label}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PROJECT PREVIEW
   ════════════════════════════════════════════════════════════════ */
function ProjectPreview({
  project,
  onTruthGuide,
  onIntelligence,
  onConsult,
}: {
  project: Scored;
  onTruthGuide: () => void;
  onIntelligence: () => void;
  onConsult: () => void;
}) {
  return (
    <div key={project.name} className="animate-fade-up">
      <p className="mb-4 text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">Project Preview</p>
      <h2 className="font-serif text-[2rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.9rem]">
        {project.name}
      </h2>
      <p className="mt-2 text-[0.9rem] font-light tracking-[0.04em] text-[#1a1a1a]/50">
        {project.developer} · {project.market}
      </p>

      <div className="mt-9 grid grid-cols-3 gap-4 border-y border-[#1a1a1a]/15 py-7">
        <Stat label="Truth Score" value={`${project.truthScore}`} />
        <div className="text-center">
          <p className="font-serif text-[1.2rem] font-medium leading-none text-[#1e6b45] md:text-[1.45rem]">
            {project.recommendation}
          </p>
          <p className="mt-1.5 text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">Recommendation</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-[1.2rem] font-medium leading-none text-[#1a1a1a] md:text-[1.45rem]">
            {project.confidence}
          </p>
          <p className="mt-1.5 text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">Confidence</p>
        </div>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <p className="mb-4 text-[10px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/40">Top Strengths</p>
          <ul className="flex flex-col gap-3">
            {project.strengths.map((s) => (
              <li key={s} className="flex gap-3 text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/75">
                <span className="text-[#1e6b45]">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[10px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/40">Watchouts</p>
          <ul className="flex flex-col gap-3">
            {project.watchouts.map((w) => (
              <li key={w} className="flex gap-3 text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/75">
                <span className="text-[#c9a96e]">!</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
        <PrimaryButton onClick={onConsult}>Request Independent Advice</PrimaryButton>
        <GhostButton onClick={onIntelligence}>View Full Intelligence</GhostButton>
        <GhostButton onClick={onTruthGuide}>Challenge TruthGuide</GhostButton>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CONTEXTUAL TRUTHGUIDE (knows DNA + project)
   ════════════════════════════════════════════════════════════════ */
type TGAnswer = { answer: string; reasoning: string; evidence: string; confidence: string; next: string };

function buildAnswer(q: string, p: Scored, dna: DNA): TGAnswer {
  if (q.startsWith("Is")) {
    return {
      answer: `For a ${dna.archetype.toLowerCase()} like you, ${p.name} is a ${p.recommendation.toLowerCase()}.`,
      reasoning: `It aligns with your ${dna.budgetRange} budget and priorities (${dna.topPriorities
        .slice(0, 2)
        .join(", ")}). ${p.strengths[0]}.`,
      evidence: `Truth Score ${p.truthScore}/100 · ${p.developer} delivery record · ${p.market} comparables.`,
      confidence: p.confidence,
      next: "Discuss your specific unit and floor with an advisor.",
    };
  }
  if (q.startsWith("What are the risks")) {
    return {
      answer: `Two things we'd weigh before you commit to ${p.name}.`,
      reasoning: `${p.watchouts.join(". ")}. None are deal-breakers for your profile, but they affect timing and unit selection.`,
      evidence: `Construction tracking, RERA filings, and ${p.market} price history.`,
      confidence: p.confidence,
      next: "Ask an advisor which stacks avoid these issues.",
    };
  }
  if (q.startsWith("Compare")) {
    return {
      answer: `Against your other matches, ${p.name} leads on ${p.tags[0]?.toLowerCase()}.`,
      reasoning: `Your shortlist was ranked on fit to your DNA. ${p.name} earns a ${p.matchPct}% Truth Match versus the field.`,
      evidence: `Relative scoring across location, budget, configuration and your top priorities.`,
      confidence: p.confidence,
      next: "See the full side-by-side in Full Intelligence.",
    };
  }
  return {
    answer: `We only surface what we'd seriously consider for you — and ${p.name} made the cut.`,
    reasoning: `From ${ACTIVE_PROJECT_COUNT} active projects, three fit your ${dna.budgetRange} ${dna.archetype.toLowerCase()} profile. ${p.reason}`,
    evidence: `Independent scoring of developer, construction, location and price.`,
    confidence: p.confidence,
    next: "Book a consultation to pressure-test our thinking.",
  };
}

function ContextualTruthGuide({
  project,
  dna,
  onConsult,
  onExplore,
}: {
  project: Scored;
  dna: DNA;
  onConsult: () => void;
  onExplore: () => void;
}) {
  const questions = [
    `Is ${project.name} right for me?`,
    "What are the risks?",
    "Compare it with my other matches.",
    "Why did this make the cut?",
  ];
  const [active, setActive] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [ans, setAns] = useState<TGAnswer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ask = (q: string) => {
    setActive(q);
    setAns(null);
    setThinking(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setAns(buildAnswer(q, project, dna));
    }, 1000);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div key="tg" className="animate-fade-up">
      <ScreenHeading
        kicker="TruthGuide"
        title="Challenge our thinking."
        sub={`TruthGuide already knows your Buyer DNA, budget and shortlist. Ask about ${project.name} — no need to repeat anything.`}
      />
      <div className="mb-8 flex flex-wrap gap-3">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            className={`rounded-full border px-5 py-2.5 text-left text-[0.85rem] font-light transition-all duration-300 md:text-[0.92rem] ${
              active === q
                ? "border-[#1e6b45] bg-[#1e6b45] text-white"
                : "border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:border-[#1a1a1a]/45 hover:text-[#1a1a1a]"
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {active && (
        <div className="border-t border-[#1a1a1a]/12 pt-8">
          <p className="font-serif text-[1.2rem] font-light italic text-[#1a1a1a]/55 md:text-[1.4rem]">{active}</p>
          <div className="mt-5 min-h-[3rem]">
            {thinking ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b45]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b45] [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b45] [animation-delay:300ms]" />
              </span>
            ) : (
              ans && (
                <div className="animate-fade-up flex flex-col gap-5">
                  <TGBlock label="Answer" text={ans.answer} lead />
                  <TGBlock label="Reasoning" text={ans.reasoning} />
                  <TGBlock label="Evidence" text={ans.evidence} />
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                    <span className="text-[0.82rem] font-light text-[#1a1a1a]/55">
                      <span className="uppercase tracking-[0.2em] text-[#1a1a1a]/35">Confidence</span>{" "}
                      <span className="text-[#1e6b45]">{ans.confidence}</span>
                    </span>
                  </div>
                  <TGBlock label="Suggested next step" text={ans.next} />
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div className="mt-12 flex flex-col gap-3.5 border-t border-[#1a1a1a]/12 pt-8 sm:flex-row">
        <PrimaryButton onClick={onConsult}>Request Independent Advice</PrimaryButton>
        <GhostButton onClick={onExplore}>Continue Exploring</GhostButton>
      </div>
    </div>
  );
}

function TGBlock({ label, text, lead }: { label: string; text: string; lead?: boolean }) {
  return (
    <div>
      <p className="mb-1.5 text-[9px] font-light uppercase tracking-[0.24em] text-[#c9a96e]">{label}</p>
      <p
        className={`font-light text-[#1a1a1a]/80 ${
          lead ? "font-serif text-[1.15rem] leading-snug md:text-[1.35rem]" : "text-[0.95rem] leading-relaxed"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FULL INTELLIGENCE (report preview)
   ════════════════════════════════════════════════════════════════ */
function FullIntelligence({
  project,
  alternatives,
  onConsult,
  onExplore,
}: {
  project: Scored;
  alternatives: Scored[];
  onConsult: () => void;
  onExplore: () => void;
}) {
  const sections: { label: string; body: string }[] = [
    { label: "Developer", body: `${project.developer} — ${project.strengths.find((s) => /deliver|brand|record|execution|credibility/i.test(s)) ?? "established track record in this market"}.` },
    { label: "Construction", body: `${project.recommendation} with ${project.confidence.toLowerCase()} confidence; progress tracked against the committed handover schedule.` },
    { label: "Legal", body: "RERA-registered with clear title and approvals on record. Full documents reviewed with your advisor." },
    { label: "Location", body: `${project.market} — ${project.strengths.find((s) => /location|corridor|connectivity|address/i.test(s)) ?? "well-positioned within the micro-market"}.` },
    { label: "Price", body: `${project.strengths.find((s) => /below|value|entry|pricing/i.test(s)) ?? "Positioned competitively for the segment"}. Exact pricing is discussed with your advisor — never on a portal.` },
    { label: "ROI", body: `Aligned to ${project.tags.slice(0, 2).join(" and ").toLowerCase()}; our read on appreciation and liquidity for your horizon.` },
    { label: "Layouts", body: `Available in ${project.configs.join(", ")}. Efficiency and livability assessed per stack.` },
    { label: "Alternatives", body: alternatives.length ? alternatives.map((a) => a.name).join(" · ") : "Reviewed against the full active set." },
  ];

  return (
    <div key="intel" className="animate-fade-up">
      <ScreenHeading
        kicker="Full Intelligence"
        title={project.name}
        sub="A preview of the independent report. The complete investigation is walked through with your advisor."
      />
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#1a1a1a]/12 bg-[#1a1a1a]/10 md:grid-cols-2">
        {sections.map((s) => (
          <div key={s.label} className="bg-[#F5F0E8] p-6">
            <p className="mb-2 text-[10px] font-light uppercase tracking-[0.28em] text-[#c9a96e]">{s.label}</p>
            <p className="text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/75">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-col gap-3.5 sm:flex-row">
        <PrimaryButton onClick={onConsult}>Request Independent Advice</PrimaryButton>
        <GhostButton onClick={onExplore}>Continue Exploring</GhostButton>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CONSULTATION — the most important conversion
   ════════════════════════════════════════════════════════════════ */
function ConsultationScreen({ onBook }: { onBook: (advisorName: string, slot: string) => void }) {
  return (
    <div key="consult" className="animate-fade-up">
      <ScreenHeading
        title={
          <>
            You&apos;ve done the research.
            <br />
            The next step isn&apos;t another report.
            <br />
            It&apos;s a conversation.
          </>
        }
        sub="Meet an independent advisor who will discuss your specific situation. No sales pitch. No obligations. Only independent advice."
      />
      <div className="flex flex-col gap-5">
        {ADVISORS.map((a) => (
          <AdvisorCard key={a.name} advisor={a} onBook={(slot) => onBook(a.name, slot)} />
        ))}
      </div>
    </div>
  );
}

function AdvisorCard({ advisor, onBook }: { advisor: Advisor; onBook: (slot: string) => void }) {
  return (
    <div className="rounded-xl border border-[#1a1a1a]/12 bg-white p-6 md:p-7">
      <div className="flex items-start gap-5">
        <Avatar initials={advisor.initials} />
        <div className="flex-1">
          <p className="font-serif text-[1.3rem] font-medium text-[#1a1a1a] md:text-[1.5rem]">{advisor.name}</p>
          <p className="mt-1 text-[0.85rem] font-light text-[#1a1a1a]/55">
            {advisor.experience} · {advisor.specialisation}
          </p>
          <p className="mt-1 text-[0.8rem] font-light text-[#1a1a1a]/40">
            Speaks {advisor.languages.join(", ")}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2.5">
        {advisor.slots.map((slot) => (
          <button
            key={slot}
            onClick={() => onBook(slot)}
            className="rounded-full border border-[#1e6b45]/40 px-4 py-2 text-[0.82rem] font-light text-[#1e6b45] transition-all duration-300 hover:bg-[#1e6b45] hover:text-white"
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   AUTH — only after a consultation is booked
   ════════════════════════════════════════════════════════════════ */
function AuthScreen({ booking, onContinue }: { booking: Booking; onContinue: () => void }) {
  const perks = [
    "Buyer DNA",
    "Recommendations",
    "TruthGuide history",
    "Documents",
    "Meeting recordings",
    "Future updates",
  ];
  const providers = ["Continue with Google", "Continue with Apple", "Continue with Phone", "Continue with Email"];
  return (
    <div key="auth" className="animate-fade-up">
      {booking && (
        <div className="mb-8 rounded-lg border border-[#1e6b45]/25 bg-[#1e6b45]/[0.06] px-5 py-4">
          <p className="text-[0.9rem] font-light text-[#1a1a1a]/75">
            <span className="text-[#1e6b45]">✓</span> Consultation reserved with{" "}
            <span className="font-medium">{booking.advisorName}</span> · {booking.slot}
          </p>
        </div>
      )}
      <ScreenHeading
        kicker="Your Buyer's Office"
        title={<>Let&apos;s save your journey.</>}
        sub="We'll create your private workspace where you'll always find:"
      />
      <ul className="mb-12 grid grid-cols-1 gap-x-10 gap-y-3.5 sm:grid-cols-2">
        {perks.map((p) => (
          <li key={p} className="flex items-center gap-3 text-[0.98rem] font-light text-[#1a1a1a]/75">
            <span className="text-[#1e6b45]">✓</span>
            {p}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3.5">
        {providers.map((label) => (
          <button
            key={label}
            onClick={onContinue}
            className="rounded-sm border border-[#1a1a1a]/20 bg-white px-8 py-4 text-[13px] font-light tracking-[0.05em] text-[#1a1a1a]/80 transition-all duration-300 hover:border-[#1a1a1a]/40 hover:bg-white"
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-7 text-[0.78rem] font-light italic leading-relaxed text-[#1a1a1a]/40">
        No passwords. Nothing shared. Your journey stays private to you.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   RESEARCH WORKSPACE — premium research terminal
   ════════════════════════════════════════════════════════════════ */
function ResearchWorkspace({
  onClose,
  onConsult,
  onStartJourney,
}: {
  onClose: () => void;
  onConsult: () => void;
  onStartJourney: () => void;
}) {
  const [query, setQuery] = useState("");
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderFade, setPlaceholderFade] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const iv = setInterval(() => {
      setPlaceholderFade(false);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % RESEARCH_PLACEHOLDERS.length);
        setPlaceholderFade(true);
      }, 400);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setResult(null);
    setThinking(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const r = classifyAndResearch(q);
      setResult(r);
      setThinking(false);
      setHistory((h) => [q, ...h.filter((x) => x !== q)].slice(0, 8));
    }, 2200);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleSubmit = () => doSearch(query);
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") doSearch(query); };

  const clearResult = () => {
    setResult(null);
    setThinking(false);
    setQuery("");
    inputRef.current?.focus();
  };

  const showingLanding = !result && !thinking;

  return (
    <div className="flex h-full w-full flex-col bg-[#F5F0E8] text-[#1a1a1a]">
      {/* Header — minimal, only close */}
      <div className="flex shrink-0 items-center justify-end px-6 py-5 md:px-10 md:py-6">
        <button
          onClick={onClose}
          className="text-[11px] font-light tracking-[0.15em] text-[#1a1a1a]/35 transition-colors duration-300 hover:text-[#1a1a1a]/70"
        >
          CLOSE
        </button>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <div className="flex flex-1 flex-col overflow-y-auto">
          {showingLanding ? (
            <ResearchLanding
              query={query}
              setQuery={setQuery}
              placeholderIdx={placeholderIdx}
              placeholderFade={placeholderFade}
              inputRef={inputRef}
              onSubmit={handleSubmit}
              onKey={handleKey}
              onChip={doSearch}
            />
          ) : (
            <div className="mx-auto w-full max-w-[820px] px-6 py-6 md:px-10 md:py-8">
              {/* Persistent search bar */}
              <div className="mb-8">
                <div className="flex h-[52px] items-center gap-3 rounded-2xl border border-[#1a1a1a]/[0.06] bg-white px-5 transition-all duration-500 focus-within:border-[#c9a96e]/30 focus-within:shadow-[0_0_0_3px_rgba(201,169,110,0.06)] md:gap-4 md:px-6">
                  <svg className="h-4 w-4 shrink-0 text-[#1a1a1a]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKey}
                    className="flex-1 bg-transparent font-serif text-[1rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/22 md:text-[1.1rem]"
                    placeholder="Ask another question…"
                  />
                  {query && (
                    <button onClick={clearResult} className="text-[#1a1a1a]/25 transition-colors hover:text-[#1a1a1a]/50">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M6 18 18 6M6 6l12 12"/></svg>
                    </button>
                  )}
                  <button onClick={handleSubmit} className="group/arrow flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e6b45] text-white transition-all duration-300 hover:scale-[1.06]">
                    <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover/arrow:translate-x-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>

              {thinking ? (
                <ResearchThinking query={query} />
              ) : result ? (
                <ResearchResultView
                  result={result}
                  onFollowUp={doSearch}
                  onConsult={onConsult}
                  onStartJourney={onStartJourney}
                />
              ) : null}
            </div>
          )}
        </div>

        {/* Desktop sidebar — only when viewing results */}
        {!showingLanding && (
          <div className="hidden w-[220px] shrink-0 border-l border-[#1a1a1a]/[0.06] px-5 py-8 lg:block">
            {history.length > 0 && (
              <div>
                <p className="mb-4 text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/25">
                  Recently Viewed
                </p>
                <div className="flex flex-col gap-2.5">
                  {history.map((h) => (
                    <button
                      key={h}
                      onClick={() => doSearch(h)}
                      className="text-left text-[0.8rem] font-light leading-snug text-[#1a1a1a]/40 transition-colors duration-300 hover:text-[#1a1a1a]/70"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-10">
              <button
                onClick={onConsult}
                className="w-full rounded-sm bg-[#1e6b45] px-4 py-3 text-[10px] font-medium tracking-[0.1em] text-white transition-all duration-500 hover:bg-[#238c55]"
              >
                Request Independent Advice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Research landing — redesigned from first principles ── */
function ResearchLanding({
  query,
  setQuery,
  placeholderIdx,
  placeholderFade,
  inputRef,
  onSubmit,
  onKey,
  onChip,
}: {
  query: string;
  setQuery: (q: string) => void;
  placeholderIdx: number;
  placeholderFade: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: () => void;
  onKey: (e: React.KeyboardEvent) => void;
  onChip: (q: string) => void;
}) {
  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center px-5 md:px-8">
      {/* Top spacer — pushes content toward visual center but allows scroll */}
      <div className="w-full pt-[max(2vh,16px)] md:pt-[max(6vh,40px)]" />

      <div className="flex w-full max-w-[820px] flex-col items-center">
        {/* Label */}
        <p className="mb-8 text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a96e] md:mb-10">
          TruthGuide
        </p>

        {/* Headline */}
        <div className="mb-6 max-w-[700px] text-center md:mb-8">
          <h1 className="font-serif text-[2.2rem] font-medium leading-[1.12] tracking-[-0.01em] text-[#1a1a1a] md:text-[3.4rem]">
            Ask Better Questions.
          </h1>
          <h2 className="mt-1 font-serif text-[2.2rem] font-medium leading-[1.12] tracking-[-0.01em] text-[#1a1a1a]/40 md:mt-1.5 md:text-[3.4rem]">
            Get Better Property Decisions.
          </h2>
        </div>

        {/* Supporting copy */}
        <p className="mb-10 max-w-[460px] text-center text-[0.85rem] font-light leading-[1.75] text-[#1a1a1a]/40 md:mb-12 md:text-[0.92rem]">
          Independent answers about projects, developers, pricing,
          legal risks and investment opportunities.
          <br />
          <span className="text-[#1a1a1a]/28">No account required. No sales pressure.</span>
        </p>

        {/* ── Search input — the hero ── */}
        <div className="w-full max-w-[790px]">
          <div className="flex h-[56px] items-center gap-3 rounded-2xl border border-[#1a1a1a]/[0.06] bg-white px-5 transition-all duration-700 focus-within:border-[#c9a96e]/30 focus-within:shadow-[0_0_0_4px_rgba(201,169,110,0.06)] md:h-[64px] md:gap-4 md:px-7">
            {/* Search icon */}
            <svg className="h-[18px] w-[18px] shrink-0 text-[#1a1a1a]/20 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            {/* Input + animated placeholder */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKey}
                className="w-full bg-transparent font-serif text-[1.05rem] font-light text-[#1a1a1a] outline-none md:text-[1.2rem]"
              />
              {!query && (
                <span className="pointer-events-none absolute inset-0 flex items-center">
                  <span
                    className={`font-serif text-[1.05rem] font-light text-[#1a1a1a]/25 transition-opacity duration-500 md:text-[1.2rem] ${
                      placeholderFade ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {RESEARCH_PLACEHOLDERS[placeholderIdx]}
                  </span>
                  <span
                    className={`ml-[1px] inline-block h-[1.15em] w-[1.5px] bg-[#1a1a1a]/30 transition-opacity duration-100 ${
                      cursorVisible ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </span>
              )}
            </div>

            {/* Mic icon */}
            <button className="group/mic hidden shrink-0 text-[#1a1a1a]/18 transition-colors duration-300 hover:text-[#1a1a1a]/40 md:block" aria-label="Voice">
              <svg className="h-[18px] w-[18px] transition-transform duration-500 group-hover/mic:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="23" />
              </svg>
            </button>

            {/* Submit arrow */}
            <button
              onClick={onSubmit}
              className="group/arrow flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e6b45] text-white transition-all duration-300 hover:scale-[1.06] md:h-10 md:w-10"
            >
              <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover/arrow:translate-x-[3px] md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Divider text */}
        <p className="mt-8 text-center text-[0.76rem] font-light tracking-[0.02em] text-[#1a1a1a]/25 md:mt-10">
          Or continue one of these conversations
        </p>

        {/* Conversation chips */}
        <div className="mx-auto mt-4 flex max-w-[700px] flex-wrap justify-center gap-2.5 md:mt-5">
          {RESEARCH_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onChip(s)}
              className="rounded-full border border-[#1a1a1a]/[0.06] px-5 py-2.5 text-[0.78rem] font-light text-[#1a1a1a]/45 transition-all duration-300 hover:-translate-y-[2px] hover:border-[#1a1a1a]/15 hover:text-[#1a1a1a]/70 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] md:text-[0.84rem]"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Explore by Topic */}
        <div className="mt-10 text-center md:mt-14">
          <p className="mb-4 text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/22 md:mb-5">
            Explore by Topic
          </p>
          <div className="mx-auto flex max-w-[560px] flex-wrap justify-center gap-2">
            {RESEARCH_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => { setQuery(t); onChip(`Best ${t.toLowerCase()} in Gurugram`); }}
                className="rounded-full border border-[#1a1a1a]/[0.05] px-5 py-2 text-[0.76rem] font-light tracking-[0.04em] text-[#1a1a1a]/30 transition-all duration-300 hover:border-[#1a1a1a]/12 hover:text-[#1a1a1a]/50 md:text-[0.8rem]"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pb-10 md:mt-16 md:pb-16">
          {[
            "Independent Intelligence",
            "No Sponsored Recommendations",
            "Answers Backed by Evidence",
          ].map((t) => (
            <span key={t} className="flex items-center gap-2 text-[0.7rem] font-light tracking-[0.02em] text-[#1a1a1a]/20 md:text-[0.74rem]">
              <span className="text-[#c9a96e]/50">&#10003;</span>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Research thinking animation ── */
function ResearchThinking({ query }: { query: string }) {
  const lines = useMemo(
    () => [
      "Analysing market data…",
      "Cross-referencing projects…",
      "Reviewing developer records…",
      "Building your research brief…",
    ],
    []
  );
  const [i, setI] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setI((x) => (x + 1) % 4), 1100);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-10 h-10 w-10">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-[#1a1a1a]/8 border-t-[#1e6b45]" />
      </div>
      <p className="mb-4 font-serif text-[1.1rem] font-light italic text-[#1a1a1a]/40 md:text-[1.3rem]">
        &ldquo;{query}&rdquo;
      </p>
      <p key={i} className="animate-fade-up text-[0.85rem] font-light text-[#1a1a1a]/45">
        {lines[i]}
      </p>
    </div>
  );
}

/* ── Research result view ── */
function ResearchResultView({
  result,
  onFollowUp,
  onConsult,
  onStartJourney,
}: {
  result: ResearchResult;
  onFollowUp: (q: string) => void;
  onConsult: () => void;
  onStartJourney: () => void;
}) {
  const typeLabel: Record<ResearchResult["type"], string> = {
    project: "Project Analysis",
    developer: "Developer Profile",
    location: "Market Intelligence",
    comparison: "Comparative Analysis",
    question: "Research Brief",
  };

  return (
    <div className="animate-fade-up pb-16">
      {/* Type kicker */}
      <p className="mb-3 text-[9px] font-light uppercase tracking-[0.3em] text-[#c9a96e]">
        {typeLabel[result.type]}
      </p>

      {/* Title */}
      <h2 className="font-serif text-[1.6rem] font-medium leading-[1.2] text-[#1a1a1a] md:text-[2.2rem]">
        {result.title}
      </h2>
      {result.subtitle && (
        <p className="mt-2 font-serif text-[1rem] font-light text-[#1a1a1a]/45 md:text-[1.15rem]">
          {result.subtitle}
        </p>
      )}

      {/* Verdict + score */}
      {result.verdict && (
        <div className="mt-8 flex items-start gap-5 rounded-lg border border-[#1a1a1a]/10 bg-white px-6 py-5">
          {result.score != null && (
            <div className="flex flex-col items-center">
              <span className="font-serif text-[2rem] font-medium text-[#1e6b45] md:text-[2.4rem]">
                {result.score}
              </span>
              <span className="mt-0.5 text-[8px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/35">
                Truth Score
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="mb-1 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">
              {result.confidence ?? "Truth Verdict"}
            </p>
            <p className="font-serif text-[1rem] font-light leading-[1.7] text-[#1a1a1a]/75 md:text-[1.08rem]">
              {result.verdict}
            </p>
          </div>
        </div>
      )}

      {/* Highlights grid */}
      {result.highlights && result.highlights.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#1a1a1a]/10 bg-[#1a1a1a]/8 md:grid-cols-3">
          {result.highlights.map((h) => (
            <div key={h.label} className="bg-[#F5F0E8] p-4 md:p-5">
              <p className="mb-1.5 text-[8px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">
                {h.label}
              </p>
              <p className="font-serif text-[0.95rem] font-medium leading-snug text-[#1a1a1a] md:text-[1.08rem]">
                {h.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Strengths + Watchouts */}
      {(result.strengths?.length || result.watchouts?.length) && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {result.strengths && result.strengths.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-light uppercase tracking-[0.22em] text-[#1e6b45]">
                Strengths
              </p>
              <ul className="flex flex-col gap-2">
                {result.strengths.map((s) => (
                  <li key={s} className="flex gap-2.5 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/65">
                    <span className="mt-0.5 text-[#1e6b45]">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.watchouts && result.watchouts.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">
                Watchouts
              </p>
              <ul className="flex flex-col gap-2">
                {result.watchouts.map((w) => (
                  <li key={w} className="flex gap-2.5 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/65">
                    <span className="mt-0.5 text-[#c9a96e]">!</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sections */}
      {result.sections.length > 0 && (
        <div className="mt-8 flex flex-col gap-6 border-t border-[#1a1a1a]/8 pt-8">
          {result.sections.map((sec) => (
            <div key={sec.label}>
              <p className="mb-2 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">
                {sec.label}
              </p>
              <p className="font-serif text-[0.95rem] font-light leading-[1.8] text-[#1a1a1a]/65 md:text-[1.02rem]">
                {sec.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Follow-up questions */}
      {result.followUps.length > 0 && (
        <div className="mt-10 border-t border-[#1a1a1a]/8 pt-8">
          <p className="mb-4 text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/30">
            Continue Researching
          </p>
          <div className="flex flex-wrap gap-2.5">
            {result.followUps.map((f) => (
              <button
                key={f}
                onClick={() => onFollowUp(f)}
                className="rounded-full border border-[#1a1a1a]/10 bg-white px-5 py-2.5 text-[0.8rem] font-light text-[#1a1a1a]/55 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1a1a1a]/25 hover:text-[#1a1a1a]/80 hover:shadow-md hover:shadow-black/[0.04] md:text-[0.85rem]"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 border-t border-[#1a1a1a]/8 pt-8 text-center">
        <p className="mb-5 font-serif text-[1.1rem] font-light text-[#1a1a1a]/50 md:text-[1.2rem]">
          Need independent advice?
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <PrimaryButton onClick={onConsult}>Request Independent Advice</PrimaryButton>
          <GhostButton onClick={onStartJourney}>Start Your Journey</GhostButton>
        </div>
      </div>

      {/* Confidence statement */}
      <p className="mt-10 text-center text-[0.7rem] font-light text-[#1a1a1a]/20">
        Every answer combines Truth Intelligence, independent research and human judgement.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ANONYMOUS TRUTHGUIDE (homepage "Challenge TruthGuide")
   ════════════════════════════════════════════════════════════════ */
function AnonymousTruthGuide() {
  const prompts = [
    "Should I buy DLF Arbour?",
    "Compare DLF Arbour with Puri Aravallis.",
    "Which developers are most reliable?",
    "Best luxury projects under ₹7 Cr.",
  ];
  const [active, setActive] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ask = (q: string) => {
    setActive(q);
    setAnswer(null);
    setThinking(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setThinking(false);
      setAnswer(CANNED[q] ?? "Here's how we'd think about that — grounded in delivery records, pricing, and risk.");
    }, 1100);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div key="anon" className="animate-fade-up">
      <ScreenHeading
        kicker="TruthGuide"
        title="Ask anything. Anonymously."
        sub="No account needed. Start with a question — or one of these."
      />
      <div className="mb-9 flex flex-wrap gap-3">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => ask(p)}
            className={`rounded-full border px-5 py-2.5 text-left text-[0.85rem] font-light transition-all duration-300 md:text-[0.92rem] ${
              active === p
                ? "border-[#1e6b45] bg-[#1e6b45] text-white"
                : "border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:border-[#1a1a1a]/45 hover:text-[#1a1a1a]"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      {active && (
        <div className="border-t border-[#1a1a1a]/12 pt-8">
          <p className="font-serif text-[1.2rem] font-light italic text-[#1a1a1a]/55 md:text-[1.4rem]">{active}</p>
          <div className="mt-5 min-h-[3rem]">
            {thinking ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b45]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b45] [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b45] [animation-delay:300ms]" />
              </span>
            ) : (
              <p className="animate-fade-up text-[0.98rem] font-light leading-[1.85] text-[#1a1a1a]/80 md:text-[1.05rem]">
                {answer}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SELL — PROJECT SEARCH
   ════════════════════════════════════════════════════════════════ */
function SellProjectSearch({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);

  const filtered = query.trim()
    ? SELL_PROJECTS.filter((p) => p.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : SELL_PROJECTS.slice(0, 8);

  const pick = (p: string) => {
    onChange(p);
    setQuery(p);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search your project…"
        className="w-full border-b-2 border-[#1a1a1a]/15 bg-transparent py-4 font-serif text-[1.3rem] font-light text-[#1a1a1a] outline-none transition-colors duration-300 placeholder:text-[#1a1a1a]/30 focus:border-[#1e6b45]/50 md:text-[1.6rem]"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[280px] overflow-y-auto rounded-lg border border-[#1a1a1a]/12 bg-[#F5F0E8] shadow-xl shadow-black/[0.06]">
          {filtered.map((p) => (
            <button
              key={p}
              onClick={() => pick(p)}
              className={`block w-full px-5 py-3.5 text-left text-[0.95rem] font-light transition-colors duration-200 hover:bg-[#1e6b45]/[0.06] md:text-[1.05rem] ${
                value === p ? "text-[#1e6b45]" : "text-[#1a1a1a]/75"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      {value && (
        <p className="mt-3 text-[0.8rem] font-light text-[#1e6b45]">
          ✓ {value}
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SELL — TEXT FIELD
   ════════════════════════════════════════════════════════════════ */
function SellTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-[#1a1a1a]/15 bg-transparent py-3 text-[0.95rem] font-light text-[#1a1a1a] outline-none transition-colors duration-300 placeholder:text-[#1a1a1a]/25 focus:border-[#1e6b45]/40 md:text-[1.05rem]"
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SELL — AI PROCESSING
   ════════════════════════════════════════════════════════════════ */
function SellProcessingScreen({ onDone }: { onDone: () => void }) {
  const lines = useMemo(
    () => [
      "Analysing demand…",
      "Understanding competition…",
      "Reviewing market behaviour…",
      "Preparing your selling strategy…",
    ],
    []
  );
  const [i, setI] = useState(0);
  useEffect(() => {
    const rot = setInterval(() => setI((x) => (x + 1) % 4), 1100);
    const done = setTimeout(onDone, 4800);
    return () => {
      clearInterval(rot);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#F5F0E8] px-6 text-center text-[#1a1a1a]">
      <div className="relative mb-12 h-12 w-12">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-[#1a1a1a]/10 border-t-[#1e6b45]" />
      </div>
      <h2 className="mb-6 font-serif text-[1.7rem] font-medium text-[#1a1a1a] md:text-[2.4rem]">
        Understanding your property…
      </h2>
      <p key={i} className="animate-fade-up font-serif text-[1.1rem] font-light italic text-[#1a1a1a]/55 md:text-[1.4rem]">
        {lines[i]}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SELL — RESULT SCREEN
   ════════════════════════════════════════════════════════════════ */
function SellResultScreen({
  sell,
  strategy,
  onConsult,
}: {
  sell: SellData;
  strategy: SellStrategy;
  onConsult: () => void;
}) {
  const insights: { label: string; value: string }[] = [
    { label: "Market Position", value: strategy.marketPosition },
    { label: "Demand", value: strategy.demand },
    { label: "Competition", value: strategy.competition },
    { label: "Suggested Pricing Approach", value: strategy.pricingApproach },
    { label: "Expected Selling Window", value: strategy.sellingWindow },
  ];

  return (
    <div key="sell-result" className="animate-fade-up">
      <ScreenHeading
        kicker="Selling Strategy"
        title={<>Your Selling<br />Strategy</>}
      />

      {sell.project && (
        <p className="mb-10 font-serif text-[1.1rem] font-light text-[#1a1a1a]/55 md:text-[1.25rem]">
          {sell.project}{sell.config ? ` · ${sell.config}` : ""}
        </p>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#1a1a1a]/12 bg-[#1a1a1a]/10 md:grid-cols-3">
        {insights.map((ins) => (
          <div key={ins.label} className="bg-[#F5F0E8] p-5 md:p-6">
            <p className="mb-2 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">
              {ins.label}
            </p>
            <p className="font-serif text-[1.15rem] font-medium text-[#1a1a1a] md:text-[1.35rem]">
              {ins.value}
            </p>
          </div>
        ))}
        <div className="bg-[#F5F0E8] p-5 md:p-6">
          <p className="mb-2 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">
            Most Important Watchout
          </p>
          <p className="text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/75">
            {strategy.watchout}
          </p>
        </div>
      </div>

      <p className="mt-10 font-serif text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/65 md:text-[1.1rem]">
        {strategy.summary}
      </p>

      <div className="mt-10 border-t border-[#1a1a1a]/12 pt-8">
        <p className="mb-2 text-[10px] font-light uppercase tracking-[0.3em] text-[#c9a96e]">
          Next Best Steps
        </p>
        <ul className="flex flex-col gap-3 mt-4">
          <li className="flex gap-3 text-[0.92rem] font-light text-[#1a1a1a]/75">
            <span className="text-[#1e6b45]">→</span>
            Understand recent market movement
          </li>
          <li className="flex gap-3 text-[0.92rem] font-light text-[#1a1a1a]/75">
            <span className="text-[#1e6b45]">→</span>
            Review comparable opportunities
          </li>
          <li className="flex gap-3 text-[0.92rem] font-light text-[#1a1a1a]/75">
            <span className="text-[#1e6b45]">→</span>
            Speak with an independent advisor
          </li>
        </ul>
      </div>

      <div className="mt-12 flex flex-col gap-3.5 sm:flex-row">
        <PrimaryButton onClick={onConsult}>Request Independent Advice</PrimaryButton>
        <GhostButton onClick={onConsult}>Explore Market Intelligence</GhostButton>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INVEST — AI PROCESSING
   ════════════════════════════════════════════════════════════════ */
function InvestProcessingScreen({ onDone }: { onDone: () => void }) {
  const lines = useMemo(
    () => [
      "Analysing market fundamentals…",
      "Evaluating risk-adjusted returns…",
      "Matching developer track records…",
      "Building your investment thesis…",
    ],
    []
  );
  const [i, setI] = useState(0);
  useEffect(() => {
    const rot = setInterval(() => setI((x) => (x + 1) % 4), 1100);
    const done = setTimeout(onDone, 4800);
    return () => {
      clearInterval(rot);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#F5F0E8] px-6 text-center text-[#1a1a1a]">
      <div className="relative mb-12 h-12 w-12">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-[#1a1a1a]/10 border-t-[#1e6b45]" />
      </div>
      <h2 className="mb-6 font-serif text-[1.7rem] font-medium text-[#1a1a1a] md:text-[2.4rem]">
        Evaluating opportunities…
      </h2>
      <p key={i} className="animate-fade-up font-serif text-[1.1rem] font-light italic text-[#1a1a1a]/55 md:text-[1.4rem]">
        {lines[i]}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INVEST — RESULT SCREEN
   ════════════════════════════════════════════════════════════════ */
function InvestResultScreen({
  strategy,
  recommendations,
  onConsult,
}: {
  invest: InvestData;
  strategy: InvestStrategy;
  recommendations: InvestRecommendation[];
  onConsult: () => void;
}) {
  const insights: { label: string; value: string }[] = [
    { label: "Investment Style", value: strategy.investmentStyle },
    { label: "Horizon", value: strategy.horizon },
    { label: "Risk Profile", value: strategy.riskProfile },
    { label: "Capital Objective", value: strategy.capitalObjective },
    { label: "Preferred Opportunity", value: strategy.preferredOpportunity },
    { label: "Market Position", value: strategy.marketPosition },
  ];

  return (
    <div key="invest-result" className="animate-fade-up">
      <ScreenHeading
        kicker="Investment Strategy"
        title={<>Your Investment<br />Thesis</>}
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#1a1a1a]/12 bg-[#1a1a1a]/10 md:grid-cols-3">
        {insights.map((ins) => (
          <div key={ins.label} className="bg-[#F5F0E8] p-5 md:p-6">
            <p className="mb-2 text-[9px] font-light uppercase tracking-[0.22em] text-[#c9a96e]">
              {ins.label}
            </p>
            <p className="font-serif text-[1rem] font-medium leading-snug text-[#1a1a1a] md:text-[1.15rem]">
              {ins.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-[#1a1a1a]/12 pt-8">
        <p className="mb-2 text-[10px] font-light uppercase tracking-[0.3em] text-[#c9a96e]">
          Truth Estate&apos;s View
        </p>
        <p className="mt-4 font-serif text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/65 md:text-[1.1rem]">
          {strategy.view}
        </p>
      </div>

      <div className="mt-10 border-t border-[#1a1a1a]/12 pt-8">
        <p className="mb-6 text-[10px] font-light uppercase tracking-[0.3em] text-[#c9a96e]">
          Opportunities We&apos;d Investigate
        </p>
        <div className="flex flex-col gap-4">
          {recommendations.map((r, idx) => (
            <div
              key={r.name}
              className="flex items-start gap-5 rounded-lg border border-[#1a1a1a]/12 bg-white px-6 py-5"
            >
              <span className="mt-1 font-serif text-[1.1rem] text-[#1a1a1a]/30">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <p className="font-serif text-[1.15rem] font-medium text-[#1a1a1a] md:text-[1.3rem]">{r.name}</p>
                <p className="mt-0.5 text-[0.8rem] font-light tracking-[0.04em] text-[#1a1a1a]/45">
                  {r.developer} · {r.market}
                </p>
                <p className="mt-2 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/65">
                  {r.investRationale}
                </p>
              </div>
              <div className="flex flex-col items-end text-right">
                <p className="font-serif text-[1.15rem] font-medium text-[#1e6b45] md:text-[1.3rem]">
                  {r.truthMatch}%
                </p>
                <p className="mt-1 text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">
                  Truth Match
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[0.75rem] font-light italic text-[#1a1a1a]/35">
          No pricing shown. No returns promised. Just our honest read.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-3.5 sm:flex-row">
        <PrimaryButton onClick={onConsult}>Request Independent Advice</PrimaryButton>
        <GhostButton onClick={onConsult}>Explore Market Intelligence</GhostButton>
      </div>
    </div>
  );
}

const CANNED: Record<string, string> = {
  "Should I buy DLF Arbour?":
    "DLF Arbour shows strong fundamentals. Developer track record: 92% on-time delivery across Haryana. Current pricing sits roughly 8% below comparable towers on Golf Course Extension Road — with two risks worth weighing before you commit: handover timeline pressure and a premium floor-rise structure.",
  "Compare DLF Arbour with Puri Aravallis.":
    "Different buyers. DLF Arbour wins on liquidity, brand resale, and delivery certainty on GCE. Puri Aravallis wins on entry price and layout generosity along the Sohna belt — higher upside, higher patience required. Growth-first → Arbour. Value-first → Aravallis.",
  "Which developers are most reliable?":
    "On delivery certainty and build quality, our data favours DLF, Godrej, and Birla Estates in the current Gurugram cycle. M3M leads on lifestyle positioning. We weight RERA history, on-time ratios, and post-possession complaints — not brochures.",
  "Best luxury projects under ₹7 Cr.":
    "Under ₹7 Cr, the strongest luxury value today sits with DLF Arbour (GCE), Godrej Aristocrat (SPR), and Conscient Parq (GCE) — each balancing layout quality, developer strength, and a credible appreciation case without paying purely for a brand premium.",
};
