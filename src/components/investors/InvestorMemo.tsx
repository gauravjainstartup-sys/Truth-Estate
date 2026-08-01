"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import { basePath } from "@/lib/site";

/* ════════════════════════════════════════════════════════════════
   INVESTOR DECK — six scroll-snap frames, sized for the room.
   Frame 1 is the brand bookend. Frames 2–6 are Act I of the founder's
   Decision Check™ narrative: one investor question per frame, one
   insight per frame, each built to earn the next. Editorial premium:
   large serif type, hairline ledgers, massive whitespace, ink + cream
   neutrals and ONE accent (emerald). More acts follow the same grammar.
   Cmd+P still yields a page-per-slide PDF.
   ════════════════════════════════════════════════════════════════ */


/* the one accent (emerald) + the ink field; everything else is neutral */
const ACCENT = "#1e6b45";
const INK = "#0b1f1a";

/* mono breadcrumb that opens every act frame */
function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[0.58rem] uppercase tracking-[0.26em] text-[#1a1a1a]/40 lg:text-[0.7rem]">{children}</p>;
}

/* the editorial display headline */
function Display({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`mt-5 font-serif text-[clamp(1.7rem,4.6vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.015em] lg:mt-7 ${className}`}>{children}</h2>;
}

/* the closing line of a frame — the sentence the investor leaves with */
function Coda({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-t border-[#1a1a1a]/10 pt-5 lg:mt-12 lg:pt-6">
      <p className="max-w-[34em] font-serif text-[1rem] leading-[1.5] text-[#1a1a1a]/80 lg:text-[1.3rem]">{children}</p>
      {right && <div className="text-right">{right}</div>}
    </div>
  );
}

/* ── frame 2 · the missing category ── */
function SlideCategory() {
  const ROWS: [string, string][] = [
    ["Stocks", "Equity research"],
    ["Insurance", "Plan comparison"],
    ["Loans", "Credit score"],
    ["Used cars", "Inspection report"],
  ];
  return (
    <div className="w-full">
      <Kicker>01 · The missing category</Kicker>
      <Display>
        Every major financial decision has a Decision&nbsp;Check.<br />
        <span style={{ color: ACCENT }}>Homes don&rsquo;t.</span>
      </Display>

      <div className="mt-8 max-w-[52rem] lg:mt-12">
        <div className="flex items-baseline justify-between border-b border-[#1a1a1a]/25 pb-2.5">
          <span className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-[#1a1a1a]/40 lg:text-[0.64rem]">The decision</span>
          <span className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-[#1a1a1a]/40 lg:text-[0.64rem]">The independent check</span>
        </div>
        {ROWS.map(([d, c]) => (
          <div key={d} className="flex items-baseline justify-between border-b border-[#1a1a1a]/10 py-3 lg:py-[1.05rem]">
            <span className="text-[0.95rem] font-light text-[#1a1a1a]/70 lg:text-[1.2rem]">{d}</span>
            <span className="text-[0.95rem] font-light text-[#1a1a1a]/70 lg:text-[1.2rem]">{c}</span>
          </div>
        ))}
        <div className="flex items-baseline justify-between border-b-2 py-3.5 lg:py-5" style={{ borderColor: ACCENT }}>
          <span className="font-serif text-[1.15rem] font-medium lg:text-[1.55rem]">Buying a home</span>
          <span className="font-serif text-[1.15rem] font-medium lg:text-[1.55rem]" style={{ color: ACCENT }}>None.</span>
        </div>
      </div>

      <Coda
        right={
          <>
            <p className="font-serif text-[1rem] font-medium lg:text-[1.2rem]">Truth Estate</p>
            <p className="mt-1 text-[0.74rem] font-light text-[#1a1a1a]/55 lg:text-[0.88rem]">Building the Decision Check for residential real estate.</p>
          </>
        }>
        Every year, Indian families commit lakhs &mdash; often crores &mdash; to a home without one.
      </Coda>
    </div>
  );
}

/* ── frame 3 · the cost of being wrong ── */
function SlideCost() {
  const SMALL: [string, string][] = [
    ["A wrong stock", "You sell in a day."],
    ["A wrong policy", "You switch at renewal."],
    ["A wrong car", "You resell at a haircut."],
  ];
  const FACTS: [string, string][] = [
    ["₹2–10 Cr", "locked into one illiquid asset"],
    ["15–25 years", "of EMI, signed in an afternoon"],
    ["Possession", "arrives years late — or never"],
    ["Opportunity cost", "the portfolio you didn’t build"],
    ["Emotional stress", "a family decision you can’t unwind"],
    ["Exit", "selling a mistake takes years"],
  ];
  return (
    <div className="w-full">
      <Kicker>02 · The stakes</Kicker>
      <Display>The cost of being wrong.</Display>

      <div className="mt-8 grid gap-4 lg:mt-12 lg:grid-cols-[1fr_2.2fr] lg:gap-6">
        <div className="flex flex-col justify-end gap-2.5 lg:gap-3">
          {SMALL.map(([t, b]) => (
            <div key={t} className="rounded-xl border border-[#1a1a1a]/10 px-4 py-3 lg:px-5 lg:py-4">
              <p className="text-[0.86rem] font-medium text-[#1a1a1a]/55 lg:text-[1rem]">{t}</p>
              <p className="mt-0.5 flex items-baseline justify-between gap-3 text-[0.74rem] font-light text-[#1a1a1a]/45 lg:text-[0.86rem]">
                {b} <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-[#1a1a1a]/35 lg:text-[0.56rem]">Recoverable</span>
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6 text-[#F7F3EA] sm:p-8 lg:p-10" style={{ background: INK }}>
          <p className="flex items-baseline justify-between gap-4">
            <span className="font-serif text-[1.5rem] font-medium lg:text-[2.1rem]">A wrong home</span>
            <span className="font-mono text-[0.52rem] uppercase tracking-[0.16em] text-[#F7F3EA]/45 lg:text-[0.62rem]">Not recoverable</span>
          </p>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:mt-8 lg:gap-x-8 lg:gap-y-7">
            {FACTS.map(([v, l]) => (
              <div key={v}>
                <p className="font-serif text-[1.05rem] font-medium leading-tight lg:text-[1.45rem]">{v}</p>
                <p className="mt-1 text-[0.7rem] font-light leading-[1.5] text-[#F7F3EA]/55 lg:mt-1.5 lg:text-[0.84rem]">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Coda>
        The problem isn&rsquo;t lack of information. It&rsquo;s the inability to independently verify and synthesize it &mdash; <em className="not-italic" style={{ color: ACCENT }}>before signing</em>.
      </Coda>
    </div>
  );
}

/* ── frame 4 · transactions vs decisions ── */
function SlideIncentives() {
  const LEDGER: [string, string][] = [
    ["Developers", "Sell inventory"],
    ["Brokers", "Close deals"],
    ["Property portals", "Generate leads"],
    ["Banks", "Finance purchases"],
  ];
  const JOURNEY = ["Discovery", "Shortlisting", "Site visits", "Confusion", "Token", "Booking"];
  return (
    <div className="w-full">
      <Kicker>03 · Structurally different</Kicker>
      <Display>
        The industry optimises transactions.<br />
        <span style={{ color: ACCENT }}>Not decisions.</span>
      </Display>

      <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
        <div>
          <div className="flex items-baseline justify-between border-b border-[#1a1a1a]/25 pb-2.5">
            <span className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-[#1a1a1a]/40 lg:text-[0.62rem]">Who</span>
            <span className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-[#1a1a1a]/40 lg:text-[0.62rem]">Is paid to</span>
          </div>
          {LEDGER.map(([w, i]) => (
            <div key={w} className="flex items-baseline justify-between border-b border-[#1a1a1a]/10 py-2.5 lg:py-3.5">
              <span className="text-[0.9rem] font-light text-[#1a1a1a]/70 lg:text-[1.05rem]">{w}</span>
              <span className="text-[0.9rem] font-light text-[#1a1a1a]/50 lg:text-[1.05rem]">{i}</span>
            </div>
          ))}
          <div className="flex items-baseline justify-between border-b-2 py-3 lg:py-4" style={{ borderColor: ACCENT }}>
            <span className="font-serif text-[1rem] font-medium lg:text-[1.25rem]">Truth Estate</span>
            <span className="font-serif text-[1rem] font-medium lg:text-[1.25rem]" style={{ color: ACCENT }}>Help buyers decide</span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-[#1a1a1a]/40 lg:text-[0.62rem]">The buying journey</p>
          <div className="mt-4 flex flex-col gap-1.5 lg:mt-5">
            {JOURNEY.map((s, i) => {
              const ours = s === "Confusion" || s === "Token";
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className={`flex-1 rounded-lg border px-4 py-2 text-[0.84rem] lg:py-2.5 lg:text-[1rem] ${ours ? "font-medium" : "border-[#1a1a1a]/10 font-light text-[#1a1a1a]/55"}`}
                    style={ours ? { borderColor: ACCENT, color: ACCENT, background: "rgba(30,107,69,0.05)" } : undefined}>
                    {s}{i < JOURNEY.length - 1 ? "" : ""}
                  </span>
                  {ours && s === "Confusion" && (
                    <span className="hidden w-40 font-mono text-[0.56rem] uppercase leading-[1.6] tracking-[0.14em] sm:block lg:w-48 lg:text-[0.62rem]" style={{ color: ACCENT }}>
                      Truth Estate exists only here
                    </span>
                  )}
                  {ours && s === "Token" && <span className="hidden w-40 sm:block lg:w-48" aria-hidden />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Coda>
        The industry is built to complete transactions. Truth Estate is built to improve decisions.
      </Coda>
    </div>
  );
}

/* ── frame 5 · the product ── */
function SlideEngine() {
  const SIGNALS = ["Developer", "Legal", "Financial", "Construction", "Location", "Spatial — Horizon™"];
  return (
    <div className="w-full">
      <Kicker>04 · The product</Kicker>
      <Display>
        Decision&nbsp;Check&trade;<br />
        <span className="text-[0.62em] text-[#1a1a1a]/55">One independent decision engine.</span>
      </Display>

      <div className="mx-auto mt-7 flex max-w-[44rem] flex-col items-center lg:mt-10">
        <p className="rounded-full border border-[#1a1a1a]/15 px-5 py-2 text-[0.86rem] font-light text-[#1a1a1a]/70 lg:px-6 lg:py-2.5 lg:text-[1rem]">The home a buyer is about to commit to</p>
        <span aria-hidden className="my-1.5 font-mono text-[0.9rem] text-[#1a1a1a]/35 lg:my-2">&darr;</span>

        <div className="w-full rounded-2xl p-5 text-center text-[#F7F3EA] sm:p-6 lg:p-8" style={{ background: INK }}>
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#F7F3EA]/50 lg:text-[0.68rem]">Truth Estate Decision Engine&trade;</p>
          <div className="mt-3.5 flex flex-wrap justify-center gap-2 lg:mt-5 lg:gap-2.5">
            {SIGNALS.map((s) => (
              <span key={s} className="rounded-full border border-[#F7F3EA]/20 px-3.5 py-1.5 text-[0.72rem] font-light text-[#F7F3EA]/80 lg:px-4 lg:py-2 lg:text-[0.86rem]">{s}</span>
            ))}
          </div>
        </div>

        <span aria-hidden className="my-1.5 font-mono text-[0.9rem] text-[#1a1a1a]/35 lg:my-2">&darr;</span>
        <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
          <span className="rounded-full px-5 py-2 font-mono text-[0.62rem] tracking-[0.14em] text-white lg:px-6 lg:py-2.5 lg:text-[0.72rem]" style={{ background: ACCENT }}>PROCEED</span>
          <span className="rounded-full border px-5 py-2 font-mono text-[0.62rem] tracking-[0.14em] lg:px-6 lg:py-2.5 lg:text-[0.72rem]" style={{ borderColor: ACCENT, color: ACCENT }}>PROCEED WITH CAUTION</span>
          <span className="rounded-full border border-[#1a1a1a]/30 px-5 py-2 font-mono text-[0.62rem] tracking-[0.14em] text-[#1a1a1a]/60 lg:px-6 lg:py-2.5 lg:text-[0.72rem]">RECONSIDER</span>
        </div>
      </div>

      <Coda right={<p className="font-mono text-[0.56rem] uppercase tracking-[0.18em] text-[#1a1a1a]/40 lg:text-[0.64rem]">Software economics &middot; not a marketplace</p>}>
        One engine. Hundreds of signals. One independent decision.
      </Coda>
    </div>
  );
}

/* ── frame 6 · why incumbents can't follow ── */
function SlideMoat() {
  const LEFT: [string, string][] = [
    ["Property portals", "Lead generation"],
    ["Brokers", "Commission"],
    ["Developers", "Inventory sales"],
    ["Banks", "Loan distribution"],
  ];
  const RIGHT = ["No listings", "No brokerage", "No inventory", "No transaction incentives"];
  return (
    <div className="w-full">
      <Kicker>05 · Why incumbents can&rsquo;t follow</Kicker>
      <Display>Why this category remained empty.</Display>
      <p className="mt-3 max-w-[42rem] text-[0.9rem] font-light leading-[1.65] text-[#1a1a1a]/55 lg:mt-4 lg:text-[1.05rem]">
        Housing, MagicBricks, Square Yards, NoBroker, every brokerage &mdash; why hasn&rsquo;t anyone built this?
      </p>

      <div className="mt-7 grid gap-4 lg:mt-10 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-2xl border border-[#1a1a1a]/10 p-5 sm:p-6 lg:p-8">
          <p className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-[#1a1a1a]/40 lg:text-[0.62rem]">The existing ecosystem</p>
          {LEFT.map(([w, r]) => (
            <div key={w} className="flex items-baseline justify-between border-b border-[#1a1a1a]/[0.07] py-2.5 last:border-none lg:py-3.5">
              <span className="text-[0.9rem] font-light text-[#1a1a1a]/65 lg:text-[1.02rem]">{w}</span>
              <span className="text-[0.9rem] font-light text-[#1a1a1a]/45 lg:text-[1.02rem]">{r}</span>
            </div>
          ))}
          <p className="mt-4 border-t border-[#1a1a1a]/15 pt-3.5 text-[0.84rem] font-medium text-[#1a1a1a]/60 lg:text-[0.98rem]">Every rupee is earned when a transaction closes.</p>
        </div>

        <div className="rounded-2xl border-2 p-5 sm:p-6 lg:p-8" style={{ borderColor: ACCENT }}>
          <p className="font-mono text-[0.56rem] uppercase tracking-[0.2em] lg:text-[0.62rem]" style={{ color: ACCENT }}>Truth Estate</p>
          <div className="mt-1">
            {RIGHT.map((r) => (
              <p key={r} className="border-b border-[#1a1a1a]/[0.07] py-2.5 font-serif text-[1.02rem] font-medium last:border-none lg:py-3.5 lg:text-[1.2rem]">{r}</p>
            ))}
          </div>
          <p className="mt-4 border-t pt-3.5 text-[0.84rem] font-medium lg:text-[0.98rem]" style={{ borderColor: "rgba(30,107,69,0.3)", color: ACCENT }}>Paid only by the buyer. Only for the decision.</p>
        </div>
      </div>

      <Coda>
        Decision Check isn&rsquo;t another feature. It&rsquo;s a different business model &mdash; one the incumbents can&rsquo;t adopt without giving up the revenue they live on.
      </Coda>
    </div>
  );
}

type Slide = { key: string; node: React.ReactNode; backdrop?: "cream" | "emerald" | "ink" };

const SLIDES: Slide[] = [
  {
    key: "brand",
    backdrop: "ink",
    node: (
      <div className="mx-auto flex max-w-[62rem] flex-col items-center px-4 text-center">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[#c9a96e] lg:text-[0.72rem]">The Independent Buyer&rsquo;s Office</p>
        <Logo color="#F7F3EA" className="mt-8 h-9 w-auto lg:mt-10 lg:h-[3.4rem]" />
        <h1 className="mt-11 font-serif text-[clamp(2.2rem,5.4vw,4rem)] font-medium leading-[1.05] tracking-[-0.01em] text-[#F7F3EA] lg:mt-14 lg:whitespace-nowrap">Less promises. More proof.</h1>
        <p className="mt-7 max-w-[41rem] font-serif text-[1.02rem] font-light leading-[1.6] text-[#F7F3EA]/55 lg:mt-9 lg:text-[1.35rem]">
          Independent real estate intelligence &amp; advisory for NRI buyers in India &mdash; forensic due diligence, unbiased Truth Scores, one advisor who represents only you.
        </p>
        <p className="mt-14 font-mono text-[0.56rem] uppercase tracking-[0.24em] text-[#c9a96e]/70 lg:mt-20 lg:text-[0.68rem]">Gurugram &middot; Delhi NCR</p>
      </div>
    ),
  },
  { key: "category", node: <SlideCategory /> },
  { key: "cost", node: <SlideCost /> },
  { key: "incentives", node: <SlideIncentives /> },
  { key: "engine", node: <SlideEngine /> },
  { key: "moat", node: <SlideMoat /> },
];

/* ── the deck shell ── */

export default function InvestorMemo() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [fs, setFs] = useState(false);
  const total = SLIDES.length;

  // target accumulates so rapid keypresses advance multiple slides mid-animation
  const targetRef = useRef(0);

  const go = useCallback((i: number) => {
    const t = Math.max(0, Math.min(total - 1, i));
    targetRef.current = t;
    const el = scrollerRef.current?.children[t] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth" });
  }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(targetRef.current + 1); }
      if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(targetRef.current - 1); }
    };
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", onFs); };
  }, [go]);

  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const settleT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const near = Math.round(el.scrollTop / el.clientHeight);
    setIdx(Math.max(0, Math.min(total - 1, near)));
    // sync the keyboard target only once scrolling has actually settled,
    // so pass-through frames can't clobber an accumulated target
    if (settleT.current) clearTimeout(settleT.current);
    settleT.current = setTimeout(() => {
      const p = el.scrollTop / el.clientHeight;
      targetRef.current = Math.max(0, Math.min(total - 1, Math.round(p)));
    }, 180);
  };

  // the finale sits on an emerald backdrop — the fixed chrome flips to cream there
  const onDark = SLIDES[idx]?.backdrop === "emerald" || SLIDES[idx]?.backdrop === "ink";

  return (
    <div className="relative h-svh bg-[#F1EBDF] text-[#1a1a1a]">
      {/* deck progress — stepped by slide */}
      <div className={`fixed inset-x-0 top-0 z-50 h-[2px] print:hidden ${onDark ? "bg-[#F7F3EA]/[0.12]" : "bg-[#1a1a1a]/[0.07]"}`}>
        <div className="h-full bg-[#9a7a2e] transition-[width] duration-300" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      {/* chrome */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 sm:px-8 print:hidden">
        <a href={basePath} aria-label="Truth Estate — Home" className="pointer-events-auto"><Logo color={onDark ? "#F7F3EA" : "#1a1a1a"} className="h-6 w-auto sm:h-7" /></a>
        <span className="flex items-center gap-4">
          <span className={`font-mono text-[0.52rem] uppercase tracking-[0.2em] sm:text-[0.56rem] lg:text-[0.64rem] ${onDark ? "text-[#F7F3EA]/50" : "text-[#1a1a1a]/40"}`}>Private memorandum</span>
          <button onClick={toggleFs} aria-label={fs ? "Exit fullscreen" : "Present fullscreen"}
            className={`pointer-events-auto hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[0.56rem] tracking-[0.14em] transition-colors lg:flex ${onDark ? "border-[#F7F3EA]/25 text-[#F7F3EA]/60 hover:border-[#F7F3EA]/50 hover:text-[#F7F3EA]/90" : "border-[#1a1a1a]/15 text-[#1a1a1a]/50 hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]/80"}`}>
            {fs ? "EXIT" : "PRESENT"} <span aria-hidden className="text-[0.8rem] leading-none">{fs ? "⤡" : "⤢"}</span>
          </button>
        </span>
      </div>
      <span className={`fixed bottom-4 left-5 z-40 font-mono text-[0.62rem] tabular-nums tracking-[0.18em] sm:left-8 lg:text-[0.72rem] print:hidden ${onDark ? "text-[#F7F3EA]/50" : "text-[#1a1a1a]/45"}`}>
        {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      {idx === 0 && (
        <span aria-hidden className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 animate-bounce text-[#9a7a2e] print:hidden">↓</span>
      )}
      {/* dot rail */}
      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex print:hidden">
        {SLIDES.map((s, i) => (
          <button key={s.key} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${i === idx ? "h-5 w-[7px] bg-[#9a7a2e]" : "h-[7px] w-[7px] bg-[#1a1a1a]/20 hover:bg-[#1a1a1a]/40"}`} />
        ))}
      </div>

      {/* slides */}
      <div ref={scrollerRef} onScroll={onScroll}
        className="h-svh snap-y snap-mandatory overflow-y-auto print:h-auto print:snap-none print:overflow-visible">
        {SLIDES.map((s, i) => (
          <section key={s.key} data-active={i === idx}
            className="group relative flex h-svh snap-start items-center justify-center overflow-hidden px-4 pb-12 pt-16 sm:px-8 print:h-auto print:overflow-visible print:py-10"
            style={{ breakAfter: "page" }}>
            {/* full-bleed backdrops for the bookend slides */}
            {s.backdrop && (
              <>
                {s.backdrop !== "ink" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${basePath}/images/aerial-dlf-arbour.webp`} alt="" aria-hidden
                    className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="absolute inset-0" style={{
                  background: s.backdrop === "cream"
                    ? "linear-gradient(180deg, rgba(241,235,223,0.93) 0%, rgba(241,235,223,0.88) 55%, rgba(241,235,223,0.95) 100%)"
                    : s.backdrop === "ink"
                      ? "radial-gradient(115% 85% at 50% 32%, #1c1710 0%, #100d09 55%, #070605 100%)"
                      : "linear-gradient(180deg, rgba(11,31,26,0.94) 0%, rgba(11,31,26,0.9) 55%, rgba(11,31,26,0.96) 100%)",
                }} />
              </>
            )}
            <div className="relative z-10 max-h-full w-full max-w-[1080px] overflow-y-auto transition-[opacity,transform] duration-500 ease-out [-ms-overflow-style:none] [scrollbar-width:none] lg:max-w-[1240px] lg:translate-y-4 lg:opacity-0 lg:group-data-[active=true]:translate-y-0 lg:group-data-[active=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 print:translate-y-0 print:opacity-100 [&::-webkit-scrollbar]:hidden">
              {s.node}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
