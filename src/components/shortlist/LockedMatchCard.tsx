"use client";

import { streetAddress } from "@/components/intelligence/ProjectOptionCard";
import { projectHref } from "@/lib/projectHref";
import type { ProjectIntel } from "@/lib/projects";
import type { BuyData, DNA } from "@/lib/journey";
import { fitPoints, beatsReason } from "@/lib/shortlist";

/* The #1 match — the gated card. It deliberately mirrors the live
   ProjectOptionCard's score-corner family (verdict top-left, Truth Score
   struck top-right) so it reads as one of the three, not a different object.
   What differs is the gate: the name blurs behind an inline lock, and the
   identity is replaced by the two strongest fit points + the single reason it
   beats #2 — the tease that earns the OTP. This is a NEW component; the shared
   ProjectOptionCard is never touched. On reveal the blur lifts, the street
   address resolves, and the CTA hands off to the full file. */

const basePath = "/Truth-Estate";

/* verdict colour — matches ProjectOptionCard exactly (green buy / gold hold). */
const recoText = (reco: string) =>
  /strong buy/i.test(reco) ? "text-[#1e6b45]" : /buy/i.test(reco) ? "text-[#9a7a2e]" : "text-[#1a1a1a]/50";

export default function LockedMatchCard({
  p,
  second,
  buy,
  dna,
  matchPct,
  revealed,
  onUnlock,
  onOpen,
}: {
  p: ProjectIntel;
  second: ProjectIntel | null;
  buy: BuyData;
  dna: DNA;
  matchPct: number;
  revealed: boolean;
  onUnlock: () => void;
  /* When set, the revealed CTA opens the report via this callback (the modal
     closes itself first) instead of navigating by link. */
  onOpen?: () => void;
}) {
  const points = fitPoints(p, buy, dna).slice(0, 2); // top 2 only — keeps the card light

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[12px] border-[1.5px] bg-[#FBF8F2] p-6 transition-colors duration-500"
      style={{ borderColor: revealed ? "rgba(30,107,69,.32)" : "rgba(154,122,46,.34)" }}
    >
      {/* faint green wash from the score corner — signals "premium pick" */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 80% at 92% 0%, rgba(30,107,69,.05), transparent 55%)" }}
      />

      {/* verdict + the #1 flag (gold while locked, green once revealed) */}
      <span className={`relative text-[9.5px] font-semibold uppercase tracking-[0.12em] ${recoText(p.recommendation)}`}>
        {p.recommendation}
        <span
          className={`ml-2.5 inline-flex items-center gap-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] transition-colors duration-500 ${
            revealed ? "text-[#1e6b45]" : "text-[#9a7a2e]"
          }`}
        >
          {revealed ? "" : "🔒 "}Your #1 match
        </span>
      </span>

      {/* Truth Score — struck in the top-right, identical to ProjectOptionCard */}
      <div className="absolute right-6 top-5 text-right">
        <span className="font-serif text-[2.65rem] font-medium leading-[0.78] tracking-[-0.01em] text-[#1a1a1a] tabular-nums">{p.truthScore}</span>
        <span className="mt-1 block font-mono text-[7.5px] uppercase tracking-[0.13em] text-[#1a1a1a]/32">Truth Score</span>
      </div>

      <div className="relative mt-[22px]">
        {/* name — blurred behind an inline gold lock until verified. Right pad
            reserves the Truth Score corner so the blur + lock never collide
            with the score. */}
        <div className="flex min-h-[30px] items-center gap-2.5 pr-[68px]">
          <h3
            className="min-w-0 font-serif text-[1.5rem] font-medium leading-tight tracking-[-0.01em] text-[#1a1a1a] transition-all duration-500"
            style={revealed ? undefined : { filter: "blur(9px)", opacity: 0.5, userSelect: "none" }}
          >
            {p.name}
          </h3>
          {!revealed && (
            <span className="flex flex-shrink-0 text-[#9a7a2e]" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
          )}
        </div>

        {/* street address resolves only once the name is unlocked */}
        {revealed && <p className="mt-2 text-[0.75rem] leading-snug text-[#1a1a1a]/50">{streetAddress(p)}</p>}

        <p className="mt-[11px] font-mono text-[0.68rem] font-semibold tracking-[0.02em] text-[#1e6b45] tabular-nums">{matchPct}% fit to you</p>

        {/* the two strongest reasons this is the buyer's match */}
        <div className="mt-[15px] flex flex-col gap-2">
          {points.map((t) => (
            <div key={t} className="flex gap-2.5 text-[0.8rem] leading-[1.45] text-[#1a1a1a]/[0.72]">
              <span className="mt-px text-[#1e6b45]" aria-hidden>+</span>
              <span>{t}</span>
            </div>
          ))}
        </div>

        {/* the single strongest way it beats #2 */}
        {second && (
          <div className="mt-3.5 rounded-r-[10px] border-l-2 border-[#1e6b45]/40 bg-[#1e6b45]/[0.04] px-3 py-2.5 text-[0.75rem] leading-[1.5] text-[#1a1a1a]/[0.68]">
            <b className="font-semibold text-[#1a1a1a]">Beats your #2</b> on {beatsReason(p, second)}.
          </div>
        )}

        {/* CTA — unlock while gated, hand off to the file once revealed */}
        {revealed ? (
          onOpen ? (
            <button
              onClick={onOpen}
              className="mt-[18px] flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#0b1f1a] py-4 text-[0.9rem] font-semibold text-white transition-colors duration-300 hover:bg-[#12352c]"
            >
              Open the full file →
            </button>
          ) : (
            <a
              href={projectHref(p)}
              className="mt-[18px] flex items-center justify-center gap-2 rounded-[13px] bg-[#0b1f1a] py-4 text-[0.9rem] font-semibold text-white transition-colors duration-300 hover:bg-[#12352c]"
            >
              Open the full file →
            </a>
          )
        ) : (
          <>
            <button
              onClick={onUnlock}
              className="mt-[18px] flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#1e6b45] py-4 text-[0.9rem] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(30,107,69,0.6)] transition-colors duration-300 hover:bg-[#238c55]"
            >
              Unlock with OTP →
            </button>
            <p className="mt-2.5 text-center font-mono text-[0.66rem] leading-relaxed tracking-[0.02em] text-[#1a1a1a]/40">
              Free · 30 seconds · buyer-side only, never shared with developers
            </p>
          </>
        )}
      </div>
    </div>
  );
}
