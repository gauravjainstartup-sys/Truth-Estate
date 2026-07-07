"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import type { ProjectIntel } from "@/lib/projects";
import type { TrackedStats } from "@/lib/supabase";
import { ACTIVE_PROJECT_COUNT } from "@/lib/journey";
import ProjectOptionCard from "./ProjectOptionCard";

const basePath = "/Truth-Estate";

/* The projects index — the entire tracked universe, live from the pipeline.
   Every project is a real backlog_listing_public row adapted onto the shared
   ProjectOptionCard; no seed/demo entries. */
export default function ProjectsIndex({ projects, stats }: { projects: ProjectIntel[]; stats?: TrackedStats | null }) {
  const { open } = useJourney();
  const scores = projects.map((p) => p.truthScore).filter((s) => s > 0);
  const lo = scores.length ? Math.min(...scores) : 0;
  const hi = scores.length ? Math.max(...scores) : 0;

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
          {projects.length > 0 && <Stat v={`${projects.length}`} k="scored & listed here" />}
          {hi > 0 && <Stat v={`${lo}–${hi}`} k="Truth Score range" />}
        </div>

        {/* ── The tracked universe — every project live from the pipeline ── */}
        <div className="mt-11 flex items-center gap-3">
          <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">The tracked universe</span>
          <span className="rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-2.5 py-0.5 font-mono text-[0.54rem] tracking-[0.14em] text-[#1e6b45]">LIVE · FROM THE PIPELINE</span>
          <span className="h-px flex-1 bg-[#1a1a1a]/10" />
        </div>

        {projects.length > 0 ? (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectOptionCard key={p.slug} p={p} />
              ))}
            </div>
            <p className="mt-6 text-[0.68rem] font-light text-[#1a1a1a]/40">
              Scores computed by our pipeline from public filings — refreshed with every deploy, shown as scored and unedited. Deep files follow as each project clears review.
            </p>
          </>
        ) : (
          <p className="mt-6 text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/55">
            Live project files are refreshing from the pipeline — please check back shortly.
          </p>
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
