"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Logo from "../Logo";
import BuyersOffice from "./BuyersOffice";
import {
  BuyData,
  CONFIGS,
  Intent,
  LOCATIONS,
  MAX_PRIORITIES,
  PRIORITIES,
  PURCHASE_TYPES,
  TIMELINES,
  budgetLabel,
  deriveDNA,
  emptyBuyData,
  rankProjects,
} from "@/lib/journey";

/* ════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ════════════════════════════════════════════════════════════════ */

function Shell({
  onClose,
  onBack,
  progress,
  eyebrow,
  children,
}: {
  onClose: () => void;
  onBack?: () => void;
  progress?: number | null; // 0..1
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#F5F0E8] text-[#1a1a1a]">
      {/* progress hairline */}
      <div className="h-[2px] w-full bg-[#1a1a1a]/8">
        {progress != null && (
          <div
            className="h-full bg-[#1e6b45] transition-all duration-700 ease-out"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        )}
      </div>

      {/* top bar */}
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

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-10 md:px-10 md:py-16">
          {children}
        </div>
      </div>

      {/* back affordance */}
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

function ScreenHeading({ kicker, title, sub }: { kicker?: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-10 md:mb-14">
      {kicker && (
        <p className="mb-5 text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">{kicker}</p>
      )}
      <h2 className="font-serif text-[2rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[3rem]">
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-all duration-500 enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function NextBar({ onNext, disabled, label = "Continue" }: { onNext: () => void; disabled?: boolean; label?: string }) {
  return (
    <div className="mt-12 flex justify-end md:mt-16">
      <PrimaryButton onClick={onNext} disabled={disabled}>
        {label}
      </PrimaryButton>
    </div>
  );
}

/* radio-style single select */
function OptionRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
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

/* multi-select chip */
function Chip({ label, selected, onClick, disabled }: { label: string; selected: boolean; onClick: () => void; disabled?: boolean }) {
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

/* eased count-up */
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
   THE MODAL
   ════════════════════════════════════════════════════════════════ */

const BUY_STEPS = ["purchase", "budget", "locations", "configs", "timeline", "priorities"] as const;
type BuyStep = (typeof BUY_STEPS)[number];
type Step = "intent" | BuyStep | "loading" | "dna" | "save" | "office" | "sell" | "invest" | "research";

const INTENT_STEP: Record<Intent, Step> = {
  buy: "purchase",
  sell: "sell",
  invest: "invest",
  research: "research",
};

export default function JourneyModal({
  initialIntent,
  onClose,
}: {
  initialIntent?: Intent;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>(initialIntent ? INTENT_STEP[initialIntent] : "intent");
  const [buy, setBuy] = useState<BuyData>(emptyBuyData);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof BuyData>(k: K, v: BuyData[K]) => setBuy((b) => ({ ...b, [k]: v }));

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

  /* ── navigation ── */
  const buyIndex = BUY_STEPS.indexOf(step as BuyStep);
  const inBuyFlow = buyIndex >= 0;
  const progress = inBuyFlow ? (buyIndex + 1) / BUY_STEPS.length : null;

  const nextBuy = () => {
    if (buyIndex < BUY_STEPS.length - 1) setStep(BUY_STEPS[buyIndex + 1]);
    else setStep("loading");
  };
  const backBuy = () => {
    if (buyIndex <= 0) setStep("intent");
    else setStep(BUY_STEPS[buyIndex - 1]);
  };

  const canContinue: Record<BuyStep, boolean> = {
    purchase: buy.purchaseType !== null,
    budget: true,
    locations: true,
    configs: true,
    timeline: buy.timeline !== null,
    priorities: buy.priorities.length > 0,
  };

  /* ── INTENT (Screen 1) ── */
  if (step === "intent") {
    const choices: { icon: string; label: string; go: () => void }[] = [
      { icon: "🏡", label: "Buy a Property", go: () => setStep("purchase") },
      { icon: "💰", label: "Sell a Property", go: () => setStep("sell") },
      { icon: "📈", label: "Invest in Real Estate", go: () => setStep("invest") },
      { icon: "🔍", label: "Research & Compare", go: () => setStep("research") },
    ];
    return (
      <Shell onClose={onClose} eyebrow="The Truth Estate Journey">
        <div key="intent" className="animate-fade-up">
          <ScreenHeading
            title={
              <>
                Welcome.
                <br />
                Let&apos;s understand
                <br />
                what brings you here.
              </>
            }
            sub="Choose what you'd like to accomplish today."
          />
          <div className="flex flex-col">
            {choices.map((c) => (
              <button
                key={c.label}
                onClick={c.go}
                className="group flex items-center gap-5 border-b border-[#1a1a1a]/10 py-6 text-left md:py-7"
              >
                <span className="text-[1.6rem] opacity-80 transition-transform duration-500 group-hover:scale-110 md:text-[2rem]">
                  {c.icon}
                </span>
                <span className="relative font-serif text-[1.5rem] font-light text-[#1a1a1a]/70 transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-[#1a1a1a] md:text-[2.1rem]">
                  {c.label}
                </span>
                <span className="ml-auto text-[1.1rem] text-[#1a1a1a]/0 transition-all duration-500 group-hover:translate-x-0 group-hover:text-[#c9a96e] md:text-[1.3rem]">
                  &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  /* ── BUY: Screen 2 — purchase type ── */
  if (step === "purchase") {
    return (
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy a Property">
        <div key="purchase" className="animate-fade-up">
          <ScreenHeading title="What best describes your purchase?" />
          <div className="flex flex-col">
            {PURCHASE_TYPES.map((t) => (
              <OptionRow key={t} label={t} selected={buy.purchaseType === t} onClick={() => set("purchaseType", t)} />
            ))}
          </div>
          <NextBar onNext={nextBuy} disabled={!canContinue.purchase} />
        </div>
      </Shell>
    );
  }

  /* ── BUY: Screen 3 — budget ── */
  if (step === "budget") {
    return (
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy a Property">
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

  /* ── BUY: Screen 4 — locations ── */
  if (step === "locations") {
    return (
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy a Property">
        <div key="locations" className="animate-fade-up">
          <ScreenHeading title="Preferred locations" sub="Select any that interest you — or none, and we'll guide you." />
          <div className="flex flex-wrap gap-3">
            {LOCATIONS.map((l) => (
              <Chip key={l} label={l} selected={buy.locations.includes(l)} onClick={() => toggle("locations", l)} />
            ))}
          </div>
          <NextBar onNext={nextBuy} />
        </div>
      </Shell>
    );
  }

  /* ── BUY: Screen 5 — configuration ── */
  if (step === "configs") {
    return (
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy a Property">
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

  /* ── BUY: Screen 6 — timeline ── */
  if (step === "timeline") {
    return (
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy a Property">
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

  /* ── BUY: Screen 7 — priorities ── */
  if (step === "priorities") {
    const full = buy.priorities.length >= MAX_PRIORITIES;
    return (
      <Shell onClose={onClose} onBack={backBuy} progress={progress} eyebrow="Buy a Property">
        <div key="priorities" className="animate-fade-up">
          <ScreenHeading
            title="What matters most?"
            sub={`Select up to three. ${buy.priorities.length}/${MAX_PRIORITIES} chosen.`}
          />
          <div className="flex flex-wrap gap-3">
            {PRIORITIES.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={buy.priorities.includes(p)}
                onClick={() => togglePriority(p)}
                disabled={full}
              />
            ))}
          </div>
          <NextBar onNext={nextBuy} disabled={!canContinue.priorities} label="See my matches" />
        </div>
      </Shell>
    );
  }

  /* ── BUY: Screen 8 — loading ── */
  if (step === "loading") {
    return <LoadingScreen onDone={() => setStep("dna")} />;
  }

  /* ── BUY: Screen 9 — Buyer DNA ── */
  if (step === "dna") {
    return (
      <Shell onClose={onClose} onBack={() => setStep("priorities")} eyebrow="Your Buyer DNA">
        <DnaScreen buy={buy} onContinue={() => setStep("save")} />
      </Shell>
    );
  }

  /* ── Screen 10 — save journey ── */
  if (step === "save") {
    return (
      <Shell onClose={onClose} onBack={() => setStep("dna")} eyebrow="Your Buyer's Office">
        <SaveScreen onContinue={() => setStep("office")} />
      </Shell>
    );
  }

  /* ── Screen 11 — Buyer's Office ── */
  if (step === "office") {
    return <BuyersOffice buy={buy} onClose={onClose} />;
  }

  /* ── FLOW 2 / 3 — waitlists ── */
  if (step === "sell") {
    return (
      <Shell onClose={onClose} onBack={() => setStep("intent")} eyebrow="Sell a Property">
        <WaitlistScreen
          kicker="Private Beta"
          title="Selling Intelligence is currently in private beta."
          body="We're onboarding a small group of sellers first. Leave your email and we'll invite you ahead of the public release."
        />
      </Shell>
    );
  }
  if (step === "invest") {
    return (
      <Shell onClose={onClose} onBack={() => setStep("intent")} eyebrow="Invest in Real Estate">
        <WaitlistScreen
          kicker="Coming Soon"
          title="The Investment Office is coming soon."
          body="A dedicated workspace for portfolio-grade real estate decisions. Join the waitlist and we'll bring you in early."
        />
      </Shell>
    );
  }

  /* ── FLOW 4 — research (anonymous) ── */
  if (step === "research") {
    return (
      <Shell onClose={onClose} onBack={() => setStep("intent")} eyebrow="Research & Compare">
        <ResearchScreen />
      </Shell>
    );
  }

  return null;
}

/* ════════════════════════════════════════════════════════════════
   SCREEN 8 — LOADING
   ════════════════════════════════════════════════════════════════ */
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const lines = useMemo(
    () => [
      "Understanding your priorities…",
      "Analysing projects…",
      "Evaluating opportunities…",
      "Matching your preferences…",
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
  }, [onDone, lines.length]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F5F0E8] text-[#1a1a1a]">
      <div className="relative mb-12 h-12 w-12">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-[#1a1a1a]/10 border-t-[#1e6b45]" />
      </div>
      <p
        key={i}
        className="animate-fade-up font-serif text-[1.4rem] font-light italic text-[#1a1a1a]/70 md:text-[2rem]"
      >
        {lines[i]}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SCREEN 9 — BUYER DNA
   ════════════════════════════════════════════════════════════════ */
function DnaScreen({ buy, onContinue }: { buy: BuyData; onContinue: () => void }) {
  const recs = useMemo(() => rankProjects(buy).slice(0, 3), [buy]);
  const dna = useMemo(() => deriveDNA(buy), [buy]);
  const [revealed, setRevealed] = useState(false);
  const total = useCountUp(127, true, 1800);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div key="dna" className="animate-fade-up">
      <ScreenHeading kicker="Buyer DNA" title={<>We&apos;ve understood<br />what you&apos;re looking for.</>} />

      {/* Profile card */}
      <div className="border-y border-[#1a1a1a]/15 py-8 md:py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 h-px w-16 bg-[#c9a96e]/50" />
          <p className="font-serif text-[1.9rem] font-medium text-[#1a1a1a] md:text-[2.6rem]">{dna.archetype}</p>
          <div className="mx-auto mt-5 h-px w-16 bg-[#c9a96e]/50" />
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-3">
          <Field label="Budget" value={dna.budgetRange} />
          <Field label="Preferred Markets" value={dna.markets.join("  ·  ")} />
          <Field label="Configuration" value={dna.config} />
          <Field label="Risk Appetite" value={dna.risk} />
          <Field label="Buying Timeline" value={dna.timeline} />
          <Field label="Top Priorities" value={dna.topPriorities.join("  ·  ")} />
        </dl>
      </div>

      {/* Funnel reveal */}
      <div className="py-12 text-center md:py-16">
        <p className="font-serif text-[1.5rem] font-light leading-snug text-[#1a1a1a]/80 md:text-[2.1rem]">
          Based on your profile, we&apos;d investigate
        </p>
        <p className="mt-6 font-serif text-[1.5rem] font-light leading-snug text-[#1a1a1a]/80 md:text-[2.1rem]">
          only{" "}
          <span className="font-medium text-[#1e6b45]">3</span> out of{" "}
          <span className="font-medium text-[#1a1a1a]">{total}</span> active projects.
        </p>
      </div>

      {/* Recommendations */}
      <div
        className="transition-all duration-1000"
        style={{ opacity: revealed ? 1 : 0, transform: revealed ? "translateY(0)" : "translateY(16px)" }}
      >
        <p className="mb-7 text-center text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">
          Top 3 Recommendations
        </p>
        <div className="flex flex-col gap-4">
          {recs.map((r, idx) => (
            <div
              key={r.name}
              className="flex flex-col gap-3 border border-[#1a1a1a]/12 bg-white/40 px-6 py-5 md:flex-row md:items-center md:gap-6"
            >
              <span className="font-serif text-[1.1rem] text-[#1a1a1a]/30 md:text-[1.3rem]">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <p className="font-serif text-[1.2rem] font-medium text-[#1a1a1a] md:text-[1.45rem]">{r.name}</p>
                <p className="mt-0.5 text-[0.8rem] font-light tracking-[0.04em] text-[#1a1a1a]/45">
                  {r.developer} · {r.market}
                </p>
                <p className="mt-2 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/65">{r.reason}</p>
              </div>
              <div className="flex gap-8 md:flex-col md:items-end md:gap-2 md:text-right">
                <Metric label="Match" value={`${r.matchPct}%`} accent />
                <Metric label="Truth Score" value={`${r.truthScore}`} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[0.75rem] font-light italic text-[#1a1a1a]/35">
          Pricing and the full investigation are shared inside your Buyer&apos;s Office.
        </p>
      </div>

      <NextBar onNext={onContinue} label="Continue" />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">{label}</dt>
      <dd className="mt-2 font-serif text-[1.02rem] font-light leading-snug text-[#1a1a1a] md:text-[1.15rem]">
        {value}
      </dd>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="md:text-right">
      <p className={`font-serif text-[1.25rem] font-medium leading-none md:text-[1.5rem] ${accent ? "text-[#1e6b45]" : "text-[#1a1a1a]"}`}>
        {value}
      </p>
      <p className="mt-1.5 text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">{label}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SCREEN 10 — SAVE JOURNEY  (never "sign up")
   ════════════════════════════════════════════════════════════════ */
function SaveScreen({ onContinue }: { onContinue: () => void }) {
  const perks = [
    "Your recommendations",
    "Saved projects",
    "TruthGuide",
    "Documents",
    "Advisor",
    "Future updates",
  ];
  const buttons = [
    { label: "Continue with Google", primary: false },
    { label: "Continue with Apple", primary: false },
    { label: "Continue with Phone", primary: false },
    { label: "Continue with Email", primary: false },
  ];
  return (
    <div key="save" className="animate-fade-up">
      <ScreenHeading
        kicker="Your Buyer's Office"
        title={<>Would you like us to<br />save this journey?</>}
        sub="We'll create your Buyer's Office — a private workspace where you'll always have access to:"
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
        <button
          onClick={onContinue}
          className="rounded-sm bg-[#1e6b45] px-8 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-all duration-500 hover:bg-[#238c55]"
        >
          Continue
        </button>
        {buttons.map((b) => (
          <button
            key={b.label}
            onClick={onContinue}
            className="rounded-sm border border-[#1a1a1a]/20 bg-white/30 px-8 py-4 text-[13px] font-light tracking-[0.05em] text-[#1a1a1a]/80 transition-all duration-300 hover:border-[#1a1a1a]/40 hover:bg-white/60"
          >
            {b.label}
          </button>
        ))}
      </div>
      <p className="mt-7 text-[0.78rem] font-light italic leading-relaxed text-[#1a1a1a]/40">
        No passwords to remember. Nothing shared. You can leave anytime — your journey stays private to you.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FLOWS 2 & 3 — WAITLIST
   ════════════════════════════════════════════════════════════════ */
function WaitlistScreen({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div key={title} className="animate-fade-up">
      <ScreenHeading kicker={kicker} title={title} sub={body} />
      {done ? (
        <div className="border-y border-[#1a1a1a]/15 py-10 text-center">
          <p className="font-serif text-[1.6rem] font-light italic text-[#1a1a1a]/80 md:text-[2rem]">
            You&apos;re on the list.
          </p>
          <p className="mt-4 text-[0.9rem] font-light text-[#1a1a1a]/50">
            We&apos;ll reach out personally when it&apos;s your turn.
          </p>
        </div>
      ) : (
        <div className="flex max-w-md flex-col gap-3.5 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 border-b border-[#1a1a1a]/25 bg-transparent py-3 text-[0.95rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30 focus:border-[#1e6b45]"
          />
          <button
            onClick={() => email.includes("@") && setDone(true)}
            className="rounded-sm bg-[#1e6b45] px-8 py-3.5 text-[13px] font-medium tracking-[0.08em] text-white transition-all duration-500 hover:bg-[#238c55]"
          >
            Notify me first
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FLOW 4 — RESEARCH (anonymous TruthGuide)
   ════════════════════════════════════════════════════════════════ */
function ResearchScreen() {
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
    <div key="research" className="animate-fade-up">
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
              <span className="inline-flex items-center gap-1.5 text-[#1a1a1a]/40">
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
