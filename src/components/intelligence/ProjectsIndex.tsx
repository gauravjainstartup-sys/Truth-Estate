"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { PROJECT_INTEL } from "@/lib/projects";
import { ACTIVE_PROJECT_COUNT } from "@/lib/journey";
import type { LiveScoredProject, TrackedStats } from "@/lib/supabase";
import ProjectOptionCard from "./ProjectOptionCard";

const basePath = "/Truth-Estate";

export default function ProjectsIndex({ live, stats }: { live?: LiveScoredProject[] | null; stats?: TrackedStats | null }) {
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
          <Stat v={stats ? stats.tracked.toLocaleString("en-IN") : `${ACTIVE_PROJECT_COUNT}`} k={stats ? "RERA projects tracked · live" : "Active projects tracked"} />
          {stats?.delayed != null && stats.delayed > 0 && (
            <Stat v={`${Math.round((stats.delayed / stats.tracked) * 100)}%`} k="of them running delayed" />
          )}
          <Stat v={`${PROJECT_INTEL.length}`} k="Deep dossiers" />
          <Stat v={`${lo}–${hi}`} k="Truth Score range" />
        </div>

        {/* Grid — the shared project-option card, ranked by Truth Score */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECT_INTEL.map((p, i) => (
            <ProjectOptionCard key={p.slug} p={p} rank={i + 1} />
          ))}
        </div>

        {/* ── The tracked universe — live from the scoring pipeline ── */}
        {live && live.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3">
              <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">The tracked universe</span>
              <span className="rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-2.5 py-0.5 font-mono text-[0.54rem] tracking-[0.14em] text-[#1e6b45]">LIVE · FROM THE PIPELINE</span>
              <span className="h-px flex-1 bg-[#1a1a1a]/10" />
            </div>
            <p className="mt-2 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/50">
              Beyond the deep dossiers, our pipeline scores the wider market from RERA filings — refreshed with every deploy. Highest-scored first; full files as they graduate from the backlog.
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60">
              {live.map((p, i) => (
                <div key={`${p.name}-${i}`} className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 ${i > 0 ? "border-t border-[#1a1a1a]/[0.06]" : ""}`}>
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate font-serif text-[1.02rem] font-medium leading-tight">{p.name}</p>
                    <p className="mt-0.5 truncate text-[0.72rem] font-light text-[#1a1a1a]/45">
                      {[p.developer, p.microMarket ?? p.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {p.config && <span className="hidden font-mono text-[0.68rem] text-[#1a1a1a]/45 md:inline">{p.config}</span>}
                  {p.budget && <span className="hidden font-mono text-[0.68rem] text-[#1a1a1a]/45 sm:inline">{p.budget}</span>}
                  {p.delayRisk && (
                    <span className={`rounded-full border px-2.5 py-1 text-[0.6rem] font-medium ${/low/i.test(p.delayRisk) ? "border-[#238c55]/30 bg-[#238c55]/[0.08] text-[#1c7a4c]" : /high/i.test(p.delayRisk) ? "border-[#9a4130]/30 bg-[#9a4130]/[0.07] text-[#9a4130]" : "border-[#9a7a2e]/35 bg-[#9a7a2e]/[0.08] text-[#8a6a1e]"}`}>
                      {p.delayRisk}{p.delayDelta ? ` · ${p.delayDelta}` : ""}
                    </span>
                  )}
                  {p.redFlags != null && p.redFlags > 0 && (
                    <span className="font-mono text-[0.64rem] text-[#9a4130]">{p.redFlags} red flag{p.redFlags > 1 ? "s" : ""}</span>
                  )}
                  <span className="ml-auto flex items-baseline gap-1.5">
                    <span className="font-serif text-[1.35rem] font-medium leading-none text-[#1e6b45]">{p.truthScore}</span>
                    <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-[#1a1a1a]/35">/100</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[0.68rem] font-light text-[#1a1a1a]/40">
              Scores computed by our pipeline from public filings · shown as scored, unedited · deep files follow as each project clears review.
            </p>
          </div>
        )}
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
