"use client";

import { usePathname } from "next/navigation";
import { useJourney } from "./JourneyProvider";

/* Tertiary CTA — the low-commitment "ask/challenge our read" affordance.
   A persistent, unobtrusive bubble that opens TruthGuide (research mode).
   Desktop only, so it never competes with the mobile primary sticky CTA.
   Stays off the investor memorandum — that page speaks to a different reader. */
export default function TruthGuideBubble() {
  const { open, isOpen } = useJourney();
  const pathname = usePathname();
  // Project detail pages render their own project-scoped "Challenge our read"
  // (ProjectProfile) — suppress the generic site-wide bubble there so there's
  // one, project-aware entry rather than two competing ones.
  if (isOpen || pathname?.startsWith("/investors") || pathname?.startsWith("/intelligence/projects/") || pathname?.startsWith("/get-custom-project-report")) return null;
  return (
    <>
      {/* Desktop — the full pill. */}
      <button
        onClick={() => open("research")}
        aria-label="Challenge TruthGuide"
        className="group fixed bottom-5 right-5 z-30 hidden items-center gap-3 rounded-full border border-[#c9a96e]/30 bg-[#0a0a0a]/95 py-2.5 pl-2.5 pr-5 text-white shadow-[0_18px_44px_-14px_rgba(0,0,0,0.7)] backdrop-blur transition-all duration-300 hover:border-[#c9a96e]/60 md:flex"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e6b45] text-[#eafff3]">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-[18px] w-[18px] motion-safe:animate-[tg-star-roll_4.5s_ease-in-out_infinite]">
            <path d="M12 2.4l1.75 7.1 7.1 1.75-7.1 1.75L12 21.6l-1.75-7.1L3.15 12.75l7.1-1.75z" />
          </svg>
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[#c9a96e]">TruthGuide</span>
          <span className="block text-[0.82rem] font-medium">Challenge our read &rarr;</span>
        </span>
      </button>

      {/* Mobile — a miniature echo of the desktop pill: the guiding-star FAB.
         The star gently rolls in and out; a label peeks out then tucks back so
         first-timers know what it opens. Both motions are motion-safe only. */}
      <button
        onClick={() => open("research")}
        aria-label="Ask TruthGuide"
        className="fixed bottom-5 right-5 z-30 h-12 w-12 md:hidden"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-[54px] top-1/2 flex -translate-y-1/2 items-center overflow-hidden whitespace-nowrap rounded-full border border-[#c9a96e]/25 bg-[#0a0a0a]/95 text-[0.72rem] font-medium text-[#f6f1e8] opacity-0 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.7)] backdrop-blur [max-width:0] motion-safe:animate-[tg-peek_13s_ease-in-out_infinite]"
        >
          <span className="px-3.5 py-1.5">Ask TruthGuide</span>
        </span>
        <span className="grid h-12 w-12 place-items-center rounded-full border border-[#c9a96e]/40 bg-[#1e6b45] text-[#eafff3] shadow-[0_14px_32px_-10px_rgba(30,107,69,0.75)]">
          <svg
            viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
            className="h-[22px] w-[22px] motion-safe:animate-[tg-star-roll_4.5s_ease-in-out_infinite]"
          >
            <path d="M12 2.4l1.75 7.1 7.1 1.75-7.1 1.75L12 21.6l-1.75-7.1L3.15 12.75l7.1-1.75z" />
          </svg>
        </span>
      </button>
    </>
  );
}
