"use client";

import { useJourney } from "./JourneyProvider";

/* Tertiary CTA — the low-commitment "ask/challenge our read" affordance.
   A persistent, unobtrusive bubble that opens TruthGuide (research mode).
   Desktop only, so it never competes with the mobile primary sticky CTA. */
export default function TruthGuideBubble() {
  const { open, isOpen } = useJourney();
  if (isOpen) return null;
  return (
    <button
      onClick={() => open("research")}
      aria-label="Challenge TruthGuide"
      className="group fixed bottom-5 right-5 z-30 hidden items-center gap-3 rounded-full border border-[#c9a96e]/30 bg-[#0a0a0a]/95 py-2.5 pl-2.5 pr-5 text-white shadow-[0_18px_44px_-14px_rgba(0,0,0,0.7)] backdrop-blur transition-all duration-300 hover:border-[#c9a96e]/60 md:flex"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e6b45] text-[0.95rem] transition-transform duration-300 group-hover:scale-105">◆</span>
      <span className="text-left leading-tight">
        <span className="block text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[#c9a96e]">TruthGuide</span>
        <span className="block text-[0.82rem] font-medium">Challenge our read &rarr;</span>
      </span>
    </button>
  );
}
