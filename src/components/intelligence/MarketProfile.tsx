"use client";

import Logo from "../Logo";
import { useConsultation } from "../consultation/ConsultationProvider";
import { fmtPsf, scoredProjectsIn, type MarketIntel } from "@/lib/markets";
import { projectByName } from "@/lib/projects";
import ProjectOptionCard from "./ProjectOptionCard";

const basePath = "/Truth-Estate";

export default function MarketProfile({ m }: { m: MarketIntel }) {
  const { openConsult } = useConsultation();
  // Advice sought from a corridor page is about that market — the
  // consultation opens knowing it ("We'll prepare the SPR market picture…").
  const open = () => openConsult({ source: m.name, sourceKind: "location" });
  const scored = scoredProjectsIn(m.name);

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

      <div className="mx-auto max-w-5xl px-6 pb-[14vh] pt-[6vh] md:px-10">
        <div className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/35">
          <a href={`${basePath}/intelligence/markets`} className="transition-colors hover:text-[#1a1a1a]/70">Locations</a>
          <span className="text-[#1a1a1a]/20">/</span><span className="text-[#1a1a1a]/55">{m.name}</span>
        </div>

        {/* Hero */}
        <div className="mt-9">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">Location Intelligence</p>
          <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-3">
            <h1 className="font-serif text-[3rem] font-medium leading-[1.0] tracking-[-0.02em] md:text-[4.2rem]">{m.name}</h1>
            <span className="mb-2 rounded-full border border-[#1a1a1a]/15 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-[#1a1a1a]/50">{m.short} · {m.tier}</span>
          </div>
          <p className="mt-5 max-w-2xl text-[1.02rem] font-light leading-[1.8] text-[#1a1a1a]/60">{m.info}</p>
        </div>

        {/* Verdict */}
        <div className="mt-10 rounded-2xl border border-[#c9a96e]/30 bg-white/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">Our Verdict</p>
          <p className="mt-5 font-serif text-[1.4rem] font-normal leading-[1.5] md:text-[1.7rem]">{m.verdict}</p>
          <p className="mt-5 text-[0.82rem] font-light text-[#1a1a1a]/45">Best for · {m.bestFor}</p>
        </div>

        {/* Numbers */}
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-8 md:grid-cols-4 md:p-10">
          <Num v={`${m.projectCount}`} k="Projects tracked" />
          <Num v={fmtPsf(m.psf.avg)} k="Avg / sq ft" />
          <Num v={m.unitBand} k="Typical ticket" />
          <Num v={m.appreciation3Y} k="3-Year trend" accent />
        </div>
        <div className="mt-3 flex items-center gap-3 text-[0.78rem] font-light text-[#1a1a1a]/45">
          <span>Price range</span>
          <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          <span className="font-mono text-[#1a1a1a]/70">{fmtPsf(m.psf.low)} <span className="text-[#1a1a1a]/35">low</span> &nbsp;·&nbsp; {fmtPsf(m.psf.high)} <span className="text-[#1a1a1a]/35">high</span></span>
        </div>

        {/* Trends */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <Trend label="Where it is now" body={m.currentTrend} icon="now" />
          <Trend label="Where it's headed" body={m.futureTrend} icon="next" />
        </div>

        {/* Infra + demand */}
        <div className="mt-10 grid gap-8 border-t border-[#1a1a1a]/8 pt-10 md:grid-cols-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#1a1a1a]/40">Infrastructure</p>
            <p className="mt-3 text-[0.92rem] font-light leading-[1.75] text-[#1a1a1a]/60">{m.infra}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#1a1a1a]/40">Demand</p>
            <p className="mt-3 text-[0.92rem] font-light leading-[1.75] text-[#1a1a1a]/60">{m.demand}</p>
          </div>
        </div>

        {/* Projects in this market */}
        <section className="mt-16 border-t border-[#1a1a1a]/8 pt-12">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[0.8rem] text-[#c9a96e]">→</span>
            <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] md:text-[2.1rem]">Projects in {m.short}</h2>
          </div>

          {scored.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {scored.map((p, i) => {
                const intel = projectByName(p.name);
                return intel ? <ProjectOptionCard key={p.name} p={intel} rank={i + 1} /> : null;
              })}
            </div>
          )}

          <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.24em] text-[#1a1a1a]/40">Notable addresses</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {m.projectNames.map((n) => (
              <span key={n} className="rounded-full border border-[#1a1a1a]/10 px-3.5 py-1.5 text-[0.78rem] font-light text-[#1a1a1a]/55">{n}</span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-14 flex flex-col items-start gap-5 rounded-2xl bg-[#1a1a1a] p-9 text-white md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <p className="font-serif text-[1.5rem] font-medium leading-[1.2] md:text-[1.8rem]">Looking at {m.short}?</p>
            <p className="mt-2 text-[0.88rem] font-light text-white/55">Get an independent read on the right project, at the right price.</p>
          </div>
          <button onClick={() => open()} className="shrink-0 rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
            Request Independent Advice
          </button>
        </div>

        <p className="mt-8 text-[0.72rem] font-light leading-[1.7] text-[#1a1a1a]/35">
          Independent assessment by Truth Estate. No developer can pay for a higher score or a better placement. Price bands are our tracked estimates for the corridor and vary by project, tower and floor.
        </p>
      </div>
    </div>
  );
}

function Num({ v, k, accent }: { v: string; k: string; accent?: boolean }) {
  return (
    <div>
      <p className={`font-mono text-[1.8rem] font-light leading-none md:text-[2.1rem] ${accent ? "text-[#3e8e62]" : "text-[#1a1a1a]"}`}>{v}</p>
      <p className="mt-2.5 text-[0.68rem] font-light uppercase tracking-[0.12em] text-[#1a1a1a]/40">{k}</p>
    </div>
  );
}
function Trend({ label, body, icon }: { label: string; body: string; icon: "now" | "next" }) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-7">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c9a96e]/15 text-[#c9a96e]">
          {icon === "now" ? "◷" : "↗"}
        </span>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#1a1a1a]/45">{label}</p>
      </div>
      <p className="mt-4 text-[0.95rem] font-light leading-[1.75] text-[#1a1a1a]/65">{body}</p>
    </div>
  );
}
