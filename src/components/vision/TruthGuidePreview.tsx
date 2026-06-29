"use client";

import { useState } from "react";
import { classifyAndResearch, RESEARCH_SUGGESTIONS, type ResearchResult } from "@/lib/journey";

/* The intelligence, conversational. Ask anything — the same engine that
   powers our research returns an independent verdict, live, on the page. */

export default function TruthGuidePreview() {
  const [query, setQuery] = useState("Should I buy DLF Arbour?");
  const [result, setResult] = useState<ResearchResult>(() => classifyAndResearch("Should I buy DLF Arbour?"));

  const run = (q: string) => {
    const t = q.trim();
    if (!t) return;
    setQuery(t);
    setResult(classifyAndResearch(t));
  };

  return (
    <section id="truthguide" className="relative bg-[#F5F0E8] px-6 py-24 text-[#1a1a1a] md:px-10 md:py-32">
      <div className="mx-auto max-w-5xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#c9a96e]">TruthGuide</p>
        <h2 className="mt-6 max-w-3xl font-serif text-[2.3rem] font-medium leading-[1.1] tracking-[-0.015em] md:text-[3.4rem]">
          Ask anything. Get the truth.
        </h2>
        <p className="mt-6 max-w-xl text-[0.98rem] font-light leading-[1.8] text-[#1a1a1a]/50">
          No salesperson, no spin. Ask about a project, a developer, a market —
          and read an independent verdict drawn from our research, in seconds.
        </p>

        {/* Ask box */}
        <form
          onSubmit={(e) => { e.preventDefault(); run(query); }}
          className="mt-10 flex items-center gap-3 rounded-full border border-[#1a1a1a]/12 bg-white/70 px-3 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.05)] backdrop-blur-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5" className="ml-2 h-5 w-5 shrink-0 opacity-30"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Should I buy DLF Arbour?"
            className="min-w-0 flex-1 bg-transparent py-2 text-[0.95rem] text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30"
          />
          <button type="submit" className="shrink-0 rounded-full bg-[#1a1a1a] px-6 py-2.5 text-[0.8rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#1e6b45]">
            Ask
          </button>
        </form>

        {/* Suggestions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {RESEARCH_SUGGESTIONS.slice(0, 5).map((s) => (
            <button key={s} onClick={() => run(s)} className="rounded-full border border-[#1a1a1a]/10 px-3.5 py-1.5 text-[0.76rem] font-light text-[#1a1a1a]/50 transition-colors hover:border-[#c9a96e]/50 hover:text-[#1a1a1a]/80">
              {s}
            </button>
          ))}
        </div>

        {/* Result */}
        <div key={result.title} className="mt-10 rounded-2xl border border-[#1a1a1a]/8 bg-white/70 p-7 md:p-9" style={{ animation: "rise-in 0.6s cubic-bezier(0.16,1,0.3,1) both" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/35">{result.type}</p>
              <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-[1.15] md:text-[2.1rem]">{result.title}</h3>
              {result.subtitle && <p className="mt-2 text-[0.84rem] font-light text-[#1a1a1a]/45">{result.subtitle}</p>}
            </div>
            {typeof result.score === "number" && (
              <div className="text-right">
                <p className="text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/35">Truth Score</p>
                <p className="font-mono text-[2.6rem] font-light leading-none text-[#1e6b45]">{result.score}</p>
                {result.verdict && <p className="mt-1 text-[0.78rem] font-medium text-[#1e6b45]">{result.verdict}</p>}
              </div>
            )}
          </div>

          {/* Sections */}
          <div className="mt-7 space-y-5 border-t border-[#1a1a1a]/8 pt-7">
            {result.sections.slice(0, 4).map((sec) => (
              <div key={sec.label}>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#c9a96e]">{sec.label}</p>
                <p className="mt-2 text-[0.92rem] font-light leading-[1.75] text-[#1a1a1a]/65">{sec.body}</p>
              </div>
            ))}
          </div>

          {/* Strengths / watchouts */}
          {(result.strengths || result.watchouts) && (
            <div className="mt-7 grid gap-6 border-t border-[#1a1a1a]/8 pt-7 sm:grid-cols-2">
              {result.strengths && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#1e6b45]">Strengths</p>
                  <ul className="mt-3 space-y-2">
                    {result.strengths.map((x) => (
                      <li key={x} className="flex gap-2.5 text-[0.84rem] font-light text-[#1a1a1a]/60">
                        <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-[#1e6b45]" />{x}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.watchouts && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#b0843a]">Watch-outs</p>
                  <ul className="mt-3 space-y-2">
                    {result.watchouts.map((x) => (
                      <li key={x} className="flex gap-2.5 text-[0.84rem] font-light text-[#1a1a1a]/60">
                        <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-[#b0843a]" />{x}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Follow-ups */}
          <div className="mt-8 flex flex-wrap gap-2 border-t border-[#1a1a1a]/8 pt-6">
            {result.followUps.map((f) => (
              <button key={f} onClick={() => run(f)} className="rounded-full bg-[#1a1a1a]/[0.04] px-3.5 py-1.5 text-[0.76rem] font-light text-[#1a1a1a]/55 transition-colors hover:bg-[#1a1a1a]/[0.08] hover:text-[#1a1a1a]/80">
                {f} &rarr;
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
