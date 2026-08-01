"use client";

/* ────────────────────────────────────────────────────────────────────────
   UnlockDesk — the conversion card that occupies the "Independent Desk" slot
   on a LOCKED report (desktop sticky rail + mobile inline). It replaces the
   free-callback form, which on a locked report leaks conversions: a free call
   reads as a way to get the answers without paying.

   Instead this card:
     • keeps the founder's face as a trust seal (an unknown brand needs the
       human), reframed from "call me free" to "I've read this file";
     • folds the 1:1 call in as an *included* bonus of the paid read — the
       call becomes a reason to buy, not a reason not to;
     • drives the single ₹999 unlock, with a full sample read as the only
       low-risk escape hatch (never leaks this project's answers for free).

   The unlocked report keeps its callback form — advice is the right next step
   there. This card is locked-only.
   ──────────────────────────────────────────────────────────────────────── */

import { READ_FROM_INR } from "@/lib/journey";
import { basePath } from "@/lib/site";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const INCLUDED: { t: string; bonus?: boolean }[] = [
  { t: "The full 5-pillar forensic audit" },
  { t: "Price journey & 5-year ROI model" },
  { t: "The verdict — our call for your budget" },
  { t: "A 1:1 call with the founder who signed it off", bonus: true },
];

export default function UnlockDesk({ onUnlock, sampleHref }: { onUnlock: () => void; sampleHref: string }) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a]/10 bg-[#FBF8F2] p-6">
      {/* founder as a trust seal — not a free-call offer */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${basePath}/images/founder-gaurav.webp`} alt="Gaurav Jain — Founder, Truth Estate" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[#B29668]/50" />
        <div className="min-w-0">
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[#9a7a2e]">The Independent Desk</p>
          <p className="mt-0.5 text-[0.82rem] font-semibold leading-tight text-[#1a1a1a]">Gaurav Jain</p>
          <p className="truncate text-[0.64rem] font-light text-[#1a1a1a]/45">Founder, Truth Estate</p>
        </div>
      </div>

      <p className="mt-4 font-serif text-[1.32rem] font-medium leading-[1.24] text-[#1a1a1a]">
        I&rsquo;ve read this file. Unlock what I found.
      </p>

      {/* value stack — the read includes the call (the reframe) */}
      <ul className="mt-4 space-y-2">
        {INCLUDED.map((it) => (
          <li key={it.t} className="flex items-start gap-2.5 text-[0.8rem] leading-snug text-[#1a1a1a]/75">
            <span aria-hidden className="mt-[1px] shrink-0 text-[#1e6b45]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <span>
              {it.t}
              {it.bonus && <span className="ml-1.5 rounded-full bg-[#9a7a2e]/12 px-1.5 py-[1px] text-[0.56rem] font-bold uppercase tracking-[0.1em] text-[#9a7a2e]">included</span>}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onUnlock}
        className="group mt-5 block w-full rounded-xl bg-[#1e6b45] px-5 py-3.5 text-center text-[0.85rem] font-semibold text-white transition-colors hover:bg-[#238c55]"
      >
        Unlock the full read — {inr(READ_FROM_INR)}{" "}
        <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
      </button>

      <a href={sampleHref} className="mt-3 block text-center text-[0.72rem] font-medium text-[#9a7a2e] transition-colors hover:text-[#7a5f1e]">
        See a full sample read first →
      </a>

      <p className="mt-5 border-t border-[#1a1a1a]/8 pt-3.5 text-[0.64rem] font-light leading-[1.5] text-[#1a1a1a]/40">
        Priced once — no subscription. Independent: no inventory, no builder commission.
      </p>
    </div>
  );
}
