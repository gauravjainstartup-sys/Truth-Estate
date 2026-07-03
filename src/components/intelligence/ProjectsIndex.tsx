"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { PROJECT_INTEL } from "@/lib/projects";
import { ACTIVE_PROJECT_COUNT } from "@/lib/journey";

const basePath = "/Truth-Estate";

const recoTone = (r: string) =>
  r.includes("Strong") ? "border-[#1e6b45]/30 text-[#1e6b45] bg-[#1e6b45]/8"
  : r === "Buy" ? "border-[#3e8e62]/30 text-[#3e8e62] bg-[#3e8e62]/8"
  : "border-[#9a7a2e]/30 text-[#9a7a2e] bg-[#c9a96e]/10";

export default function ProjectsIndex() {
  const { open } = useJourney();
  const scores = PROJECT_INTEL.map((p) => p.truthScore);
  const lo = Math.min(...scores), hi = Math.max(...scores);

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={basePath} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          <button onClick={() => open()} className="ml-auto rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.74rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:px-5">
            Request Independent Advice
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-[14vh] pt-[7vh] md:px-10">
        <div className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/35">
          <a href={`${basePath}/intelligence`} className="transition-colors hover:text-[#1a1a1a]/70">Intelligence</a>
          <span className="text-[#1a1a1a]/20">/</span><span className="text-[#1a1a1a]/55">Projects</span>
        </div>

        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">Project Intelligence</p>
        <h1 className="mt-5 max-w-2xl font-serif text-[2.6rem] font-medium leading-[1.04] tracking-[-0.02em] md:text-[4rem]">Every project, independently scored.</h1>
        <p className="mt-6 max-w-2xl text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/60 md:text-[1.05rem]">
          One Truth Score per project, built from six audited inputs — delivery, legal, developer strength, liquidity, pricing and construction. No developer pays to appear here, and none can move a score. Open any project to see exactly how it&rsquo;s built.
        </p>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
          <Stat v={`${ACTIVE_PROJECT_COUNT}`} k="Active projects tracked" />
          <Stat v={`${PROJECT_INTEL.length}`} k="Deep dossiers" />
          <Stat v={`${lo}–${hi}`} k="Truth Score range" />
        </div>

        {/* Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {PROJECT_INTEL.map((p) => (
            <a key={p.slug} href={`${basePath}/intelligence/projects/${p.slug}`}
               className="group flex flex-col rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-7 transition-all duration-300 hover:border-[#c9a96e]/40 hover:bg-white/85">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-serif text-[1.5rem] font-medium leading-tight text-[#1a1a1a]">{p.name}</h3>
                  <p className="mt-1.5 font-mono text-[0.66rem] uppercase tracking-[0.08em] text-[#1a1a1a]/40">{p.developer} · {p.marketShort}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[1.9rem] font-light leading-none text-[#1e6b45]">{p.truthScore}</p>
                  <p className="mt-1 text-[0.55rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/35">Score</p>
                </div>
              </div>
              <p className="mt-4 flex-1 text-[0.9rem] font-light leading-[1.65] text-[#1a1a1a]/55">{p.reason}</p>
              <div className="mt-5 flex items-center justify-between border-t border-[#1a1a1a]/8 pt-4">
                <span className={`rounded-full border px-3 py-1 text-[0.64rem] font-medium ${recoTone(p.recommendation)}`}>{p.recommendation}</span>
                <span className="font-mono text-[0.78rem] text-[#1a1a1a]/55">₹{p.budget[0]}–{p.budget[1]} Cr</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ v, k }: { v: string; k: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="font-mono text-[1.2rem] text-[#1a1a1a]">{v}</span>
      <span className="text-[0.74rem] font-light text-[#1a1a1a]/40">{k}</span>
    </div>
  );
}
