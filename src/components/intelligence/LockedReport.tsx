"use client";

/* ────────────────────────────────────────────────────────────────────────
   LockedReport — what a guest sees in place of the paid analysis.

   Shown from Chapter II · Pillar 1 (Developer DNA) down when the reader has
   no read access. A prominent unlock card (primary conversion surface) sits
   above a blurred, redacted teaser of every locked section — so the depth is
   visible, the intel is not.
   ──────────────────────────────────────────────────────────────────────── */

import { READ_FROM_INR } from "@/lib/journey";

const SECTIONS = [
  { k: "Pillar I", t: "Developer DNA — track record & financial audit" },
  { k: "Pillar II", t: "Construction & Sales — build pace vs the RERA clock" },
  { k: "Pillar III", t: "Location Intelligence — connectivity, infra & catalysts" },
  { k: "Pillar IV", t: "Legal & Compliance — title, RERA & litigation signals" },
  { k: "Pillar V", t: "Project USPs — the edge that actually holds value" },
  { k: "Chapter III", t: "Price journey & our ROI model" },
  { k: "Chapter IV", t: "The Verdict — read for your situation" },
  { k: "FAQs", t: "Straight answers to the questions that decide it" },
];

export default function LockedReport({
  projectName, onUnlock, sampleHref,
}: {
  projectName: string;
  onUnlock: () => void;
  sampleHref: string;
}) {
  return (
    <div className="mt-14 border-t border-[#1a1a1a]/8 pt-12">
      {/* unlock card — the primary conversion surface */}
      <div className="mx-auto max-w-lg rounded-2xl border border-[#c9a96e]/40 bg-white/70 p-7 text-center shadow-[0_24px_60px_-24px_rgba(60,42,10,0.30)] md:p-9">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#1e6b45]/10 text-[#1e6b45]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        </span>
        <p className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#9a7a2e]">The full read is locked</p>
        <h3 className="mt-2 font-serif text-[1.6rem] font-semibold leading-tight text-[#1a1a1a] md:text-[1.9rem]">Unlock the complete read</h3>
        <p className="mt-2.5 text-[0.9rem] leading-relaxed text-[#1a1a1a]/60">
          You&rsquo;re seeing the basics. The full read opens all five forensic pillars, the price journey, our ROI model, the legal audit and the verdict on {projectName}.
        </p>
        <button onClick={onUnlock} className="mt-6 w-full rounded-md bg-[#1e6b45] px-5 py-3.5 text-[0.92rem] font-semibold tracking-[0.01em] text-white transition-colors hover:bg-[#238c55]">
          Unlock Full Read — from ₹{READ_FROM_INR.toLocaleString("en-IN")} →
        </button>
        <a href={sampleHref} className="mt-3 inline-flex items-center gap-1 text-[0.85rem] font-medium text-[#9a7a2e] transition-colors hover:text-[#7a5f1e]">
          Check a sample read →
        </a>
        <p className="mt-5 border-t border-[#1a1a1a]/10 pt-4 text-[0.72rem] leading-relaxed text-[#1a1a1a]/45">
          Register, then pay once — no subscription. Custom packages are shaped on your first free advisor call.
        </p>
      </div>

      {/* redacted teaser — every locked section, masked (decorative) */}
      <div aria-hidden="true" className="relative mt-10 select-none">
        <p className="text-center text-[0.62rem] font-medium uppercase tracking-[0.24em] text-[#1a1a1a]/35">Inside the full read</p>
        <div className="pointer-events-none mt-5 space-y-8 blur-[3px]" style={{ maskImage: "linear-gradient(#000 55%, transparent)", WebkitMaskImage: "linear-gradient(#000 55%, transparent)", maxHeight: 460, overflow: "hidden" }}>
          {SECTIONS.map((s) => (
            <div key={s.t}>
              <div className="flex items-center gap-2.5">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1a1a1a]/10 text-[0.5rem] text-[#1a1a1a]/40">🔒</span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[#c9a96e]">{s.k}</span>
                <span className="text-[1rem] font-medium text-[#1a1a1a]/60">{s.t}</span>
              </div>
              <div className="mt-3 space-y-2 pl-6.5">
                <div className="h-3 w-full rounded bg-[#1a1a1a]/[0.07]" />
                <div className="h-3 w-[90%] rounded bg-[#1a1a1a]/[0.07]" />
                <div className="h-3 w-[72%] rounded bg-[#1a1a1a]/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
