"use client";

import { useEffect, useState } from "react";
import { lastUpdatedOn, type ProjectIntel } from "@/lib/projects";

/* Chapter II · Pillar V — Project USPs. Evidence-led differentiators, not
   brochure adjectives — each card is a substantiated advantage that moves
   livability, safety or resale. Bodies run long (they're forensic write-ups),
   so cards clamp to a uniform teaser and open the full evidence in a dialog —
   the grid stays perfectly even no matter how long any one write-up runs. */

const ICONS = ["⇅", "❦", "⌂", "◈", "✦", "◎"];

export default function ReportUSPs({ p }: { p: ProjectIntel }) {
  const usps = p.ops?.usps ?? [];
  const [open, setOpen] = useState<number | null>(null);
  const active = open != null ? usps[open] : null;

  // Escape to close + lock background scroll while the dialog is up.
  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  if (usps.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar V · Project USPs</p>
      <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">What actually makes it different?</h3>
      <p className="mt-2 text-[0.72rem] font-light italic text-[#1a1a1a]/40">Updated {lastUpdatedOn(p)}</p>
      <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">Not brochure adjectives — real edges on livability, safety and resale.</p>

      <div className="mt-6 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
        {usps.map((u, i) => (
          <div key={i} className="flex flex-col rounded-2xl border border-[#1a1a1a]/8 bg-gradient-to-br from-white/70 to-[#faf6ee] p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#9a7a2e]/10 text-[1.25rem] text-[#9a7a2e]" aria-hidden>{ICONS[i % ICONS.length]}</span>
            <h5 className="mt-3.5 font-serif text-[1.12rem] font-medium leading-tight">{u.title}</h5>
            <p className="mt-2 line-clamp-5 text-[0.84rem] font-light leading-[1.6] text-[#1a1a1a]/60">{u.body}</p>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="mt-auto inline-flex items-center gap-1.5 self-start pt-3.5 text-[0.76rem] font-semibold text-[#155a3a] transition-colors hover:text-[#0f4a2f]"
            >
              Read more <span aria-hidden>→</span>
            </button>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/45"><b className="font-medium text-[#1a1a1a]/70">How we read USPs:</b> we only count a differentiator if it&apos;s verifiable and it changes how you live or how the asset holds value. Marketing adjectives don&apos;t make this list.</p>

      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1a1a]/50 p-5 sm:p-8"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <div
            className="relative max-h-[82vh] w-full max-w-[600px] overflow-auto rounded-[18px] bg-[#FBF8F2] p-7 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-[#1a1a1a]/12 bg-white text-[1rem] text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/80"
            >
              ✕
            </button>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#9a7a2e]/10 text-[1.25rem] text-[#9a7a2e]" aria-hidden>{ICONS[open! % ICONS.length]}</span>
            <h4 className="mt-3.5 max-w-[92%] font-serif text-[1.3rem] font-medium leading-tight">{active.title}</h4>
            <p className="mt-3.5 whitespace-pre-line text-[0.92rem] font-light leading-[1.68] text-[#1a1a1a]/70">{active.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
