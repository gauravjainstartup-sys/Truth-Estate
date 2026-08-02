"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ProjectProfile from "./ProjectProfile";
import { sampleProjectIntel } from "@/lib/sampleProject";

/* The sample read, as a STATIC document in a bottom sheet.

   It renders the REAL report — every pillar, same layout — via ProjectProfile
   in `frozen` mode, so a browsing buyer sees exactly what a paid read looks
   like on a project carrying real problems. The document is deliberately inert:
   the content wrapper hides every <button> and disables every link/input, so
   nothing is clickable. The only affordances are the sheet's own drag-handle
   and close — chrome, not report content — which sit OUTSIDE that wrapper. */
export default function SampleSheet({ onClose }: { onClose: () => void }) {
  const [shown, setShown] = useState(false);
  const p = sampleProjectIntel();

  useEffect(() => {
    setShown(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Sample read">
      {/* backdrop — tap to dismiss */}
      <button
        type="button"
        aria-label="Close sample read"
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      {/* panel */}
      <div
        className={`relative mx-auto flex h-[93vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-t-[28px] bg-[#F5F0E8] shadow-[0_-24px_80px_-24px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out ${shown ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* sheet chrome — the only interactive elements; kept outside the frozen
            content wrapper so they survive the button-hiding rule below */}
        <div className="relative shrink-0 border-b border-[#1a1a1a]/8 bg-[#F5F0E8]/95 px-5 pb-3 pt-2.5 backdrop-blur-sm">
          <div className="mx-auto h-1 w-10 rounded-full bg-[#1a1a1a]/15" aria-hidden />
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.56rem] font-bold uppercase tracking-[0.22em] text-[#9a7a2e]">Sample read · illustrative</p>
              <p className="truncate text-[0.9rem] font-semibold leading-tight text-[#1a1a1a]">What a full Truth Estate report looks like</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#1a1a1a]/12 text-[1.1rem] leading-none text-[#1a1a1a]/55 transition-colors hover:bg-[#1a1a1a]/[0.04] hover:text-[#1a1a1a]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* the frozen document — no clickable buttons, links or inputs */}
        <div className="min-h-0 flex-1 [&_a]:pointer-events-none [&_button]:!hidden [&_input]:pointer-events-none [&_select]:pointer-events-none">
          <ProjectProfile p={p} embedded frozen sample />
        </div>
      </div>
    </div>,
    document.body,
  );
}
