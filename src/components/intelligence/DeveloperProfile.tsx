"use client";

import Logo from "../Logo";
import SearchPalette from "./SearchPalette";
import { useConsultation } from "../consultation/ConsultationProvider";
import { FIN_METRICS, type DeveloperIntel } from "@/lib/developers";
import RatingMeter from "./RatingMeter";
import { basePath, homeHref } from "@/lib/site";


function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">{children}</p>;
}

function Stat({ n, k, suffix }: { n: number; k: string; suffix?: string }) {
  return (
    <div>
      <p className="font-mono text-[2.4rem] font-light leading-none text-[#1a1a1a] md:text-[2.8rem]">
        {n}<span className="text-[1.1rem] text-[#1a1a1a]/40">{suffix}</span>
      </p>
      <p className="mt-2.5 text-[0.72rem] font-light uppercase tracking-[0.14em] text-[#1a1a1a]/40">{k}</p>
    </div>
  );
}

export default function DeveloperProfile({ dev }: { dev: DeveloperIntel }) {
  const { openConsult } = useConsultation();
  // Advice sought from a developer dossier is about that developer — the
  // consultation opens knowing it ("We'll review DLF's track record…").
  const open = () => openConsult({ source: dev.name, sourceKind: "developer" });
  const p = dev.performance;
  // Buyer-facing short name for the end CTA; formal `dev.name` stays in the hero.
  const short = dev.shortName ?? dev.name;

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={homeHref} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          <SearchPalette className="ml-auto" />
          <button
            onClick={() => open()}
            className="rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.74rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:px-5"
          >
            Request Independent Advice
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-[12vh] pt-[6vh] md:px-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/35">
          <a href={`${basePath}/intelligence/developers`} className="transition-colors hover:text-[#1a1a1a]/70">Developers</a>
          <span className="text-[#1a1a1a]/20">/</span>
          <span className="text-[#1a1a1a]/55">{dev.name}</span>
        </div>

        {/* Hero */}
        <div className="mt-9 max-w-2xl">
          <Eyebrow>Developer Profile</Eyebrow>
          <h1 className="mt-5 font-serif text-[3rem] font-medium leading-[1.02] tracking-[-0.02em] md:text-[4.2rem]">{dev.name}</h1>
          {dev.tagline && (
            <p className="mt-5 max-w-lg font-serif text-[1.15rem] font-light italic leading-[1.5] text-[#1a1a1a]/55 md:text-[1.3rem]">{dev.tagline}</p>
          )}
          {(dev.est || !dev.computed) && (
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.78rem] font-light text-[#1a1a1a]/45">
              {dev.est && <span>Established {dev.est}</span>}
              {dev.est && !dev.computed && <span className="h-3 w-px bg-[#1a1a1a]/15" />}
              {!dev.computed && (
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] ${dev.listed ? "border-[#1e6b45]/30 text-[#1e6b45]" : "border-[#1a1a1a]/15 text-[#1a1a1a]/45"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dev.listed ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/30"}`} />
                  {dev.listed ? "Listed" : "Private"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Truth Verdict */}
        <div className="mt-12 rounded-2xl border border-[#c9a96e]/30 bg-white/70 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.04)] md:p-10">
          <Eyebrow>Truth Verdict</Eyebrow>
          <p className="mt-5 font-serif text-[1.4rem] font-normal leading-[1.5] text-[#1a1a1a] md:text-[1.7rem]">{dev.verdict}</p>
        </div>

        {/* 1 · About */}
        <Section n="01" title="About the developer">
          <p className="max-w-2xl text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/65 md:text-[1.05rem]">{dev.about}</p>
        </Section>

        {/* 2 · Track Record */}
        <Section n="02" title="Track record">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              {(dev.trackedProjects?.length ?? 0) > 0 && (
                <>
                  <SubLabel>Projects we track</SubLabel>
                  <ul className="mt-3 space-y-2">
                    {dev.trackedProjects!.map((pr) => (
                      <li key={pr.href} className="flex gap-3 text-[0.95rem] font-light text-[#1a1a1a]/70">
                        <span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-[#c9a96e]" />
                        <a
                          href={`${basePath}${pr.href}`}
                          className="underline decoration-[#c9a96e]/40 underline-offset-2 transition-colors hover:text-[#1a1a1a] hover:decoration-[#c9a96e]"
                        >
                          {pr.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {dev.signature.length > 0 && (
                <>
                  <SubLabel className="mt-8">Flagship projects</SubLabel>
                  <ul className="mt-3 space-y-2">
                    {dev.signature.map((s) => <Bullet key={s}>{s}</Bullet>)}
                  </ul>
                </>
              )}
              {dev.recent.length > 0 && (
                <>
                  <SubLabel className="mt-8">Recently launched</SubLabel>
                  <ul className="mt-3 space-y-2">
                    {dev.recent.map((s) => <Bullet key={s}>{s}</Bullet>)}
                  </ul>
                </>
              )}
              {dev.pipeline.length > 0 && (
                <>
                  <SubLabel className="mt-8">In the pipeline</SubLabel>
                  <ul className="mt-3 space-y-2">
                    {dev.pipeline.map((s) => <Bullet key={s}>{s}</Bullet>)}
                  </ul>
                </>
              )}
            </div>
            {dev.brandValue && (
              <div className="border-l border-[#1a1a1a]/8 pl-8">
                <SubLabel>Brand value</SubLabel>
                <p className="mt-4 font-serif text-[1.3rem] font-light italic leading-[1.5] text-[#1a1a1a]/70 md:text-[1.5rem]">&ldquo;{dev.brandValue}&rdquo;</p>
              </div>
            )}
          </div>
        </Section>

        {/* 3 · Performance */}
        <Section n="03" title="Performance">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-8 sm:grid-cols-3 lg:grid-cols-5 md:p-10">
            <Stat n={p.launched} k="Projects launched" />
            <Stat n={p.delivered} k="Delivered" />
            <Stat n={p.ongoing} k="Ongoing" />
            <Stat n={p.onTimePct} k="On-time" suffix="%" />
            <Stat n={p.avgDelayMonths} k="Avg delay" suffix="mo" />
          </div>
        </Section>

        {/* 4 · Financials */}
        <Section n="04" title="Financial health">
          <div className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-2">
            {dev.listedNote && (
              <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] ${dev.listed ? "border-[#1e6b45]/30 text-[#1e6b45]" : "border-[#1a1a1a]/15 text-[#1a1a1a]/50"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dev.listed ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/30"}`} />
                {dev.listedNote}
              </span>
            )}
            <span className="text-[0.74rem] font-light text-[#1a1a1a]/40">Signals, not figures — directional health on each measure.</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FIN_METRICS.map((m) => (
              <RatingMeter key={m.key} rating={dev.financials[m.key]} label={m.label} sub={m.full} meaning={m.meaning} />
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-[0.85rem] font-light leading-[1.7] text-[#1a1a1a]/45">{dev.finNote}</p>
        </Section>

        {/* End CTA — browse every project this developer files, in the catalogue */}
        <div className="mt-14 flex flex-col items-start gap-5 rounded-2xl bg-[#1a1a1a] p-9 text-white md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <p className="font-serif text-[1.5rem] font-medium leading-[1.2] md:text-[1.8rem]">See all {short} projects</p>
            <p className="mt-2 max-w-md text-[0.88rem] font-light text-white/55">Every project we track from this developer — Truth Score, entry price and delivery risk, side by side.</p>
          </div>
          <a
            href={`${basePath}/intelligence?developer=${encodeURIComponent(short)}`}
            className="group shrink-0 rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]"
          >
            View projects <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>

        <p className="mt-8 text-[0.72rem] font-light leading-[1.7] text-[#1a1a1a]/35">
          Independent assessment by Truth Estate. No developer can pay for a higher score or a better placement. Performance figures are our own tracked estimates; financial signals are directional reads from public filings and parent-group strength — not a substitute for project-level due diligence.
        </p>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16 border-t border-[#1a1a1a]/8 pt-12 md:mt-20">
      <div className="flex items-center gap-4">
        <span className="font-mono text-[0.8rem] text-[#c9a96e]">{n}</span>
        <h2 className="font-serif text-[1.7rem] font-medium tracking-[-0.01em] text-[#1a1a1a] md:text-[2.1rem]">{title}</h2>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
function SubLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[10px] font-medium uppercase tracking-[0.24em] text-[#1a1a1a]/40 ${className}`}>{children}</p>;
}
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[0.95rem] font-light text-[#1a1a1a]/70">
      <span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-[#c9a96e]" />{children}
    </li>
  );
}
