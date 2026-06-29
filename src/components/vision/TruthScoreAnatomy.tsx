"use client";

import { useEffect, useRef } from "react";

/* Trust is built by showing your work. The Truth Score isn't a vibe — it's
   six audited inputs, each traceable to evidence. Here we open the box. */

const SAMPLE = { name: "DLF Arbour", developer: "DLF", market: "Golf Course Extension", score: 92 };

const COMPONENTS = [
  { k: "Delivery Record", v: 95, note: "92% on-time across Haryana" },
  { k: "Legal & Title", v: 96, note: "RERA clean · clear title" },
  { k: "Resale Liquidity", v: 94, note: "Deepest buyer pool on GCE" },
  { k: "Financial Strength", v: 93, note: "Listed · debt reducing" },
  { k: "Pricing Position", v: 90, note: "~8% below comparable towers" },
  { k: "Construction", v: 88, note: "On schedule, verified on site" },
];

export default function TruthScoreAnatomy() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const bars = root.querySelectorAll<HTMLElement>("[data-bar]");
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            bars.forEach((b, i) => {
              b.style.transition = `width 1.1s cubic-bezier(0.16,1,0.3,1) ${i * 90}ms`;
              b.style.width = b.dataset.bar + "%";
            });
            obs.disconnect();
          }
        }),
      { threshold: 0.4 },
    );
    obs.observe(root);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="score" className="relative bg-[#F5F0E8] px-6 py-24 text-[#1a1a1a] md:px-10 md:py-32">
      <div ref={ref} className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
        {/* Left — the argument */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#c9a96e]">The Truth Score</p>
          <h2 className="mt-6 font-serif text-[2.3rem] font-medium leading-[1.1] tracking-[-0.015em] md:text-[3.4rem]">
            No black box.
          </h2>
          <p className="mt-6 max-w-md text-[0.98rem] font-light leading-[1.8] text-[#1a1a1a]/55">
            Every score is built from six audited inputs — each one traceable to
            a delivery record, a RERA filing, a balance sheet, a price. Not a
            rating we assert. A case we can show you, line by line.
          </p>
          <div className="mt-8 flex items-center gap-3 text-[0.82rem] font-light text-[#1a1a1a]/45">
            <svg viewBox="0 0 24 24" fill="none" stroke="#1e6b45" strokeWidth="1.6" className="h-5 w-5"><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" /></svg>
            Independently sourced · never developer-supplied
          </div>
        </div>

        {/* Right — the audited score */}
        <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/70 p-8 shadow-[0_16px_60px_rgba(0,0,0,0.05)] md:p-10">
          <div className="flex items-end justify-between border-b border-[#1a1a1a]/8 pb-6">
            <div>
              <p className="font-serif text-[1.4rem] text-[#1a1a1a]">{SAMPLE.name}</p>
              <p className="mt-1 font-mono text-[0.7rem] tracking-[0.05em] text-[#1a1a1a]/40">{SAMPLE.developer.toUpperCase()} · {SAMPLE.market.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/35">Truth Score</p>
              <p className="font-mono text-[3rem] font-light leading-none text-[#1e6b45]">{SAMPLE.score}</p>
            </div>
          </div>

          <div className="mt-7 space-y-4">
            {COMPONENTS.map((c) => (
              <div key={c.k}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[0.82rem] font-light text-[#1a1a1a]/70">{c.k}</span>
                  <span className="font-mono text-[0.78rem] text-[#1a1a1a]/45">{c.v}</span>
                </div>
                <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[#1a1a1a]/8">
                  <div data-bar={c.v} className="h-full rounded-full bg-[#c9a96e]" style={{ width: "0%" }} />
                </div>
                <p className="mt-1 text-[0.72rem] font-light text-[#1a1a1a]/35">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
