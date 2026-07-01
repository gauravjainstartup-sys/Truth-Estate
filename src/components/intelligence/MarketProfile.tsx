"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { fmtPsf, scoredProjectsIn, type MarketIntel } from "@/lib/markets";
import { projectSlug } from "@/lib/projects";

const basePath = "/Truth-Estate";

const DEV_SLUG: Record<string, string> = {
  DLF: "dlf", Godrej: "godrej", M3M: "m3m", "Birla Estates": "birla", Smartworld: "smartworld", Emaar: "emaar",
};

const verdictTone = (v: string) =>
  v.includes("Strong") ? "border-[#1e6b45]/30 text-[#1e6b45] bg-[#1e6b45]/8"
  : v === "Buy" ? "border-[#3e8e62]/30 text-[#3e8e62] bg-[#3e8e62]/8"
  : "border-[#9a7a2e]/30 text-[#9a7a2e] bg-[#c9a96e]/10";

export default function MarketProfile({ m }: { m: MarketIntel }) {
  const { open } = useJourney();
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
            <div className="mt-8 divide-y divide-[#1a1a1a]/8 overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/50">
              {scored.map((p) => {
                const ds = DEV_SLUG[p.developer];
                return (
                  <div key={p.name} className="flex items-center gap-4 p-5 md:p-6">
                    <div className="min-w-0 flex-1">
                      <a href={`${basePath}/intelligence/projects/${projectSlug(p.name)}`} className="font-serif text-[1.15rem] text-[#1a1a1a] transition-colors hover:text-[#1e6b45]">{p.name}</a>
                      <p className="mt-1 font-mono text-[0.68rem] tracking-[0.04em] text-[#1a1a1a]/40">
                        {ds ? <a href={`${basePath}/intelligence/developers/${ds}`} className="underline decoration-[#c9a96e]/40 underline-offset-2 hover:text-[#1a1a1a]/70">{p.developer.toUpperCase()}</a> : p.developer.toUpperCase()}
                        {" "}· ₹{p.budget[0]}–{p.budget[1]} CR
                      </p>
                    </div>
                    <span className={`hidden rounded-full border px-3 py-1 text-[0.64rem] font-medium sm:inline-block ${verdictTone(p.recommendation)}`}>{p.recommendation}</span>
                    <span className="w-10 text-right font-mono text-[1.3rem] font-light text-[#1e6b45]">{p.truthScore}</span>
                  </div>
                );
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
