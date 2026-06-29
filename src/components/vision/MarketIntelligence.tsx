"use client";

import { useState } from "react";
import { PROJECTS, MARKET_PROFILES } from "@/lib/journey";

/* The signature proof: an institutional intelligence terminal. Pick a
   micro-market, see the read and the ranked projects — independent Truth
   Scores and verdicts, not portal listings. All from our own data. */

const STATS: Record<string, { appr: string; band: string; demand: string; risk: string }> = {
  "Golf Course Extension": { appr: "+18–25%", band: "₹4–12 Cr", demand: "Strong", risk: "Low" },
  SPR: { appr: "+15–22%", band: "₹2–8 Cr", demand: "Growing", risk: "Low–Med" },
  "Golf Course Road": { appr: "+8–12%", band: "₹8–25 Cr+", demand: "Deep", risk: "Low" },
  "Dwarka Expressway": { appr: "+25–40%", band: "₹1.5–6 Cr", demand: "Strong", risk: "Med–High" },
  "New Gurgaon": { appr: "+10–15%", band: "₹1–4 Cr", demand: "Steady", risk: "Medium" },
  Sohna: { appr: "+12–18%", band: "₹1–4 Cr", demand: "Emerging", risk: "Medium" },
};

const verdictColor = (v: string) =>
  v.includes("Strong") ? "text-[#7fb98a] border-[#7fb98a]/30 bg-[#7fb98a]/10"
  : v === "Buy" ? "text-[#a9c8af] border-[#a9c8af]/25 bg-[#a9c8af]/8"
  : "text-[#d9bd84] border-[#d9bd84]/25 bg-[#d9bd84]/8";

const scoreColor = (n: number) => (n >= 90 ? "text-[#7fb98a]" : n >= 86 ? "text-[#c9a96e]" : "text-[#d9bd84]");

export default function MarketIntelligence() {
  const markets = MARKET_PROFILES;
  const [active, setActive] = useState(markets[0].name);
  const m = markets.find((x) => x.name === active)!;
  const s = STATS[active] ?? { appr: "—", band: "—", demand: "—", risk: "—" };
  const ranked = PROJECTS.filter((p) => p.market === active).sort((a, b) => b.truthScore - a.truthScore);

  return (
    <section id="intelligence" className="relative bg-[#0b0b0c] px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#c9a96e]">Market Intelligence</p>
        <h2 className="mt-6 max-w-3xl font-serif text-[2.3rem] font-medium leading-[1.1] tracking-[-0.015em] text-white md:text-[3.4rem]">
          The market, without the marketing.
        </h2>
        <p className="mt-6 max-w-xl text-[0.98rem] font-light leading-[1.8] text-white/45">
          Independent reads on every Gurugram micro-market and the projects within
          it — scored on delivery, pricing and risk. The numbers a brochure will
          never show you.
        </p>

        {/* Market selector */}
        <div className="mt-12 flex flex-wrap gap-2.5">
          {markets.map((mk) => {
            const on = mk.name === active;
            return (
              <button
                key={mk.name}
                onClick={() => setActive(mk.name)}
                className={`rounded-full border px-4 py-2 text-[0.78rem] tracking-[0.03em] transition-all duration-300 ${
                  on
                    ? "border-[#c9a96e]/50 bg-[#c9a96e]/10 text-white"
                    : "border-white/10 text-white/45 hover:border-white/25 hover:text-white/75"
                }`}
              >
                {mk.name} <span className="font-mono text-white/30">· {mk.short}</span>
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-white/8 bg-white/8 md:grid-cols-[300px_1fr]">
          {/* The read */}
          <div className="bg-[#0d0d0f] p-7">
            <p className="text-[10px] font-light uppercase tracking-[0.3em] text-white/30">The Read</p>
            <div className="mt-5 grid grid-cols-2 gap-5">
              <Stat k="3Y Appreciation" v={s.appr} accent />
              <Stat k="Entry Band" v={s.band} />
              <Stat k="Demand" v={s.demand} />
              <Stat k="Risk" v={s.risk} />
            </div>
            <div className="mt-7 border-t border-white/8 pt-6">
              <p className="text-[10px] font-light uppercase tracking-[0.3em] text-white/30">Outlook</p>
              <p className="mt-3 text-[0.86rem] font-light leading-[1.7] text-white/55">{m.outlook}</p>
            </div>
          </div>

          {/* The leaderboard */}
          <div className="bg-[#0d0d0f] p-7">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-light uppercase tracking-[0.3em] text-white/30">Tracked Projects · Ranked</p>
              <p className="font-mono text-[10px] text-white/25">TRUTH SCORE</p>
            </div>
            <div className="mt-4 divide-y divide-white/6">
              {ranked.length === 0 && (
                <p className="py-6 text-[0.86rem] font-light text-white/40">Coverage expanding in this corridor.</p>
              )}
              {ranked.map((p) => (
                <div key={p.name} className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-[1.1rem] text-white/90">{p.name}</p>
                    <p className="mt-1 font-mono text-[0.7rem] tracking-[0.04em] text-white/35">
                      {p.developer.toUpperCase()} · ₹{p.budget[0]}–{p.budget[1]} CR · {p.configs.join("/")}
                    </p>
                  </div>
                  <span className={`hidden rounded-full border px-3 py-1 text-[0.66rem] font-medium tracking-[0.04em] sm:inline-block ${verdictColor(p.recommendation)}`}>
                    {p.recommendation}
                  </span>
                  <span className={`w-12 text-right font-mono text-[1.5rem] font-light leading-none ${scoreColor(p.truthScore)}`}>
                    {p.truthScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-[0.72rem] font-light text-white/25">
          Truth Score weights delivery record, pricing position and legal/financial risk —
          never developer marketing. <a href="/Truth-Estate/methodology" className="text-[#c9a96e]/70 underline underline-offset-4 hover:text-[#c9a96e]">See the methodology →</a>
        </p>
      </div>
    </section>
  );
}

function Stat({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-light uppercase tracking-[0.16em] text-white/30">{k}</p>
      <p className={`mt-1.5 font-mono text-[1.15rem] ${accent ? "text-[#7fb98a]" : "text-white/85"}`}>{v}</p>
    </div>
  );
}
