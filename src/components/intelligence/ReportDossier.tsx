"use client";

/* ────────────────────────────────────────────────────────────────────────
   ReportDossier — the conversion surface a guest hits from Chapter II ·
   Pillar I down, in place of the paid analysis. A redesign of LockedReport:
   the same machinery (price anchoring, first-report-free, buyer/owner voice,
   the visible Truth Score tied to the locked detail), presented as an
   editorial DOSSIER INDEX — every chapter as the question it answers, the
   value you get when you unlock, and a redaction motif that signals "a
   specific finding sits here" WITHOUT shipping it.

   Paywall-leak discipline (tasks #6/#9): not one real finding is in this
   DOM. Rows carry the question and the value proposition only — both are
   already guest-safe today. The redaction bars are decorative; they encode
   no data. The finding (`Pillar.why`) never renders until the reader has
   paid, exactly as in the pillar anatomy.

   Motion is a one-time reveal on scroll-in plus hover — no infinite loops
   (kept off the Lighthouse budget), and fully disabled under
   prefers-reduced-motion, where every row is visible from first paint.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { discountOf } from "@/lib/journey";
import { usePackage } from "@/lib/usePricing";
import { useFirstFree } from "@/lib/useFirstFree";

/* The dossier's paid chapters, in reading order. Each row is the burning
   QUESTION (the pull) and the VALUE the reader walks away with (the promise).
   Generic-but-true — no fabricated, project-specific findings, so it is
   honest on all 97 reports. */
type Row = { n: string; t: string; q: string; get: string };
const ROWS: Row[] = [
  { n: "I", t: "Developer DNA", q: "Has this builder finished on time before?", get: "Grounds to hold them to the delivery date." },
  { n: "II", t: "Construction & sales", q: "On pace for its RERA date — or quietly slipping?", get: "Build-versus-promise, in numbers." },
  { n: "III", t: "Location intelligence", q: "What will actually move this price?", get: "The corridor, the catalysts and the connectivity that count." },
  { n: "IV", t: "Legal & compliance", q: "Anything to clear before you sign?", get: "The issues to fix — or the reason to walk." },
  { n: "V", t: "Project USPs", q: "Which claims hold real value?", get: "Real value, sorted from brochure gloss." },
  { n: "VI", t: "Price & ROI model", q: "Does it beat the corridor?", get: "Your five-year CAGR, hold period and exit." },
  { n: "VII", t: "The Verdict", q: "So — should you buy it?", get: "A clear buy / caution / avoid for your budget and risk." },
];

/* Owner path has already bought. Only the sentences that assume a decision
   still ahead of them are replaced — same rows, same price. */
const OWNER_Q: Record<string, string> = {
  "Legal & compliance": "What does your agreement actually oblige them to?",
  "The Verdict": "Where does this leave you now?",
};
const OWNER_GET: Record<string, string> = {
  "Legal & compliance": "The clauses that protect you — and the ones that do not.",
  "The Verdict": "Hold, push the developer, or get out.",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ReportDossier({
  projectName, truthScore = 0, grade = "", ticket = "", onUnlock, audience = "buyer",
}: {
  projectName: string;
  truthScore?: number;
  grade?: string;
  ticket?: string;
  onUnlock: () => void;
  audience?: "buyer" | "owner";
}) {
  const lost = Math.max(0, 100 - Math.round(truthScore));
  const owner = audience === "owner";
  const read = usePackage("read");
  const d = discountOf(read);
  /* First report free — offered to anyone who does not yet own a report.
     Same gate the paid CTA in LockedReport used; kept verbatim so the price
     shown here never diverges from what checkout will charge. */
  const firstFree = useFirstFree();

  /* Reveal-on-scroll, added only when JS is present and motion is welcome —
     so without JS, or under reduced-motion, every row paints visible. */
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("is-armed");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.setAttribute("data-inview", "");
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="ted mt-14 border-t border-[#1a1a1a]/8 pt-12">
      <style>{`
        .ted .ted-row{transition:opacity .6s cubic-bezier(.2,.6,.2,1),transform .6s cubic-bezier(.2,.6,.2,1);}
        .ted.is-armed .ted-row{opacity:0;transform:translateY(10px);}
        .ted.is-armed[data-inview] .ted-row{opacity:1;transform:none;}
        .ted .ted-arw{transition:transform .3s ease;}
        .ted .ted-row:hover .ted-arw{transform:translateX(3px);}
        .ted .ted-bar{background:rgba(26,26,26,.10);border-radius:3px;height:7px;display:block;}
        .ted.is-armed .ted-bar{opacity:0;transform:scaleX(.6);transform-origin:left;transition:opacity .7s ease,transform .7s cubic-bezier(.2,.6,.2,1);}
        .ted.is-armed[data-inview] .ted-bar{opacity:1;transform:none;}
        @media (prefers-reduced-motion:reduce){
          .ted .ted-row,.ted .ted-bar{opacity:1!important;transform:none!important;transition:none!important;}
        }
      `}</style>

      {/* ── the pitch (unchanged machinery: score → lost points → price) ── */}
      <div className="mx-auto max-w-xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#b0503e]/30 bg-[#b0503e]/[0.06] px-3.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#b0503e]">
          <Lock className="h-3 w-3" /> {owner ? "The part that tells you where you stand is locked" : "The part that decides it is locked"}
        </span>
        <h3 className="mt-5 text-balance font-serif text-[1.95rem] font-semibold leading-[1.1] text-[#1a1a1a] md:text-[2.5rem]">
          {owner
            ? <>The full audit on your home.</>
            : ticket ? <>Don&rsquo;t stake {ticket} on a brochure.</> : <>Don&rsquo;t buy on a brochure.</>}
        </h3>
        {truthScore > 0 && (
          <p className="mt-4 text-[0.98rem] leading-relaxed text-[#1a1a1a]/65">
            {projectName} scored <b className="font-semibold text-[#1a1a1a]">{Math.round(truthScore)}/100</b>
            {grade ? <> — &ldquo;{grade}&rdquo;</> : null}. The full read shows exactly what cost it the other{" "}
            <b className="font-semibold text-[#b0503e]">{lost} points</b>
            {owner ? <> — and which of them you can still do something about.</> : <> — and whether that&rsquo;s a dealbreaker for you.</>}
          </p>
        )}
        <button
          onClick={onUnlock}
          className="group mt-7 inline-flex w-full flex-col items-center justify-center gap-0.5 rounded-lg bg-[#1e6b45] px-6 py-3 text-white shadow-[0_18px_40px_-16px_rgba(30,107,69,0.6)] transition-all hover:bg-[#238c55] sm:w-auto sm:px-12"
        >
          <span className="inline-flex items-center gap-2 text-[1rem] font-semibold tracking-[0.01em]">
            {firstFree ? "Unlock First Report at ₹0" : <>Get the full read — {inr(read.inr)}</>}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
          {firstFree
            ? <span className="text-[0.72rem] font-medium text-white/85"><span className="text-white/55 line-through">{inr(d?.mrp ?? read.inr)}</span> · your first report is free</span>
            : d && (
              <span className="text-[0.72rem] font-medium text-white/85">
                <span className="text-white/55 line-through">{inr(d.mrp)}</span> · save {inr(d.mrp - read.inr)} ({d.pct}% off)
              </span>
            )}
        </button>
        <p className="mt-3.5 text-[0.82rem] leading-relaxed text-[#1a1a1a]/55">
          {firstFree
            ? <>Free on sign-up — no card. One missed red flag costs a great deal more.</>
            : owner
            ? <>While it&rsquo;s still going up, what this finds is still worth acting on.</>
            : ticket
            ? <>That&rsquo;s a rounding error on {ticket} — one missed red flag costs a great deal more.</>
            : <>One missed red flag costs a great deal more than the read.</>}
        </p>
      </div>

      {/* ── the dossier index — question · value · redaction, per chapter ── */}
      <div className="mx-auto mt-12 max-w-2xl">
        <div className="mb-1 flex items-baseline justify-between gap-4">
          <p className="font-serif text-[1.15rem] italic text-[#1a1a1a]/70">Inside the dossier</p>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/40">Eight chapters · one read</p>
        </div>
        <div className="border-t border-[#1a1a1a]/12">
          {ROWS.map((r) => {
            const q = (owner && OWNER_Q[r.t]) || r.q;
            const get = (owner && OWNER_GET[r.t]) || r.get;
            return (
              <button
                key={r.t}
                onClick={onUnlock}
                className="ted-row group flex w-full items-start gap-4 border-b border-[#1a1a1a]/8 py-5 text-left transition-colors hover:bg-[#1e6b45]/[0.04] md:gap-5"
              >
                <span className="w-[2.2ch] shrink-0 pt-0.5 text-center font-serif text-[1.1rem] leading-none text-[#c9a96e]">{r.n}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-serif text-[1.2rem] font-medium leading-tight text-[#1a1a1a]">{r.t}</span>
                    <span className="text-[0.82rem] font-light leading-snug text-[#1a1a1a]/55">{q}</span>
                  </span>
                  {/* Decorative redaction — the shape of a finding, none of its data. */}
                  <span aria-hidden className="mt-2.5 flex items-center gap-1.5">
                    <span className="ted-bar w-16" /><span className="ted-bar w-8" /><span className="ted-bar w-20" /><span className="ted-bar w-10" />
                  </span>
                  <span className="mt-2.5 flex items-baseline gap-2 text-[0.84rem] leading-snug">
                    <span aria-hidden className="ted-arw font-serif text-[#9a7a2e]">→</span>
                    <span className="text-[#1a1a1a]/60">What you get: <span className="font-medium text-[#1e6b45]">{get}</span></span>
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                  <span aria-hidden className="text-[0.7rem] font-semibold text-[#1e6b45] opacity-60 transition-opacity group-hover:opacity-100">Unlock →</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-5 text-center text-[0.74rem] leading-relaxed text-[#1a1a1a]/45">
          The vitals, floor plans and the developer&rsquo;s brochure stay free above — this is the analysis.
          Register, then pay once — no subscription.
        </p>
      </div>
    </div>
  );
}

function Lock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
