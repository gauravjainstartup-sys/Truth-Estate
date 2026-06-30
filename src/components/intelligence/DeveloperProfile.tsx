"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { FIN_METRICS, RATING_META, type DeveloperIntel, type FinRating } from "@/lib/developers";

const basePath = "/Truth-Estate";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">{children}</p>;
}

/* The signal gauge — where a metric sits on the health spectrum, without
   ever publishing the raw figure. */
function Signal({ rating, label, full, meaning }: { rating: FinRating; label: string; full: string; meaning: string }) {
  const m = RATING_META[rating];
  return (
    <div className="rounded-xl border border-[#1a1a1a]/8 bg-white/60 p-6">
      <div className="flex items-baseline justify-between">
        <p className="text-[0.95rem] font-medium text-[#1a1a1a]/85">{label}</p>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-[#1a1a1a]/30">{full}</p>
      </div>
      <p className="mt-1 text-[0.78rem] font-light leading-[1.5] text-[#1a1a1a]/40">{meaning}</p>

      {/* spectrum */}
      <div className="relative mt-6 h-[6px] w-full rounded-full" style={{ background: "linear-gradient(90deg, rgba(176,80,62,0.18), rgba(189,139,60,0.18) 50%, rgba(30,107,69,0.18))" }}>
        <span
          className="absolute top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
          style={{ left: `${m.pos}%`, backgroundColor: m.color, boxShadow: `0 0 0 4px ${m.color}22` }}
        />
      </div>
      <div className="mt-3 flex justify-between">
        <span className="text-[0.6rem] uppercase tracking-[0.12em] text-[#1a1a1a]/20">Strained</span>
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em]" style={{ color: m.color }}>{m.label}</span>
        <span className="text-[0.6rem] uppercase tracking-[0.12em] text-[#1a1a1a]/20">Strong</span>
      </div>
    </div>
  );
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
  const { open } = useJourney();
  const p = dev.performance;

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={basePath} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          <button
            onClick={() => open()}
            className="ml-auto rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.74rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:px-5"
          >
            Request Independent Advice
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-[12vh] pt-[6vh] md:px-10">
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
          <p className="mt-5 max-w-lg font-serif text-[1.15rem] font-light italic leading-[1.5] text-[#1a1a1a]/55 md:text-[1.3rem]">{dev.tagline}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.78rem] font-light text-[#1a1a1a]/45">
            <span>Established {dev.est}</span>
            <span className="h-3 w-px bg-[#1a1a1a]/15" />
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] ${dev.listed ? "border-[#1e6b45]/30 text-[#1e6b45]" : "border-[#1a1a1a]/15 text-[#1a1a1a]/45"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dev.listed ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/30"}`} />
              {dev.listed ? "Listed" : "Private"}
            </span>
          </div>
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
              <SubLabel>Signature projects</SubLabel>
              <ul className="mt-3 space-y-2">
                {dev.signature.map((s) => <Bullet key={s}>{s}</Bullet>)}
              </ul>
              <SubLabel className="mt-8">Recently launched</SubLabel>
              <ul className="mt-3 space-y-2">
                {dev.recent.map((s) => <Bullet key={s}>{s}</Bullet>)}
              </ul>
              <SubLabel className="mt-8">In the pipeline</SubLabel>
              <ul className="mt-3 space-y-2">
                {dev.pipeline.map((s) => <Bullet key={s}>{s}</Bullet>)}
              </ul>
            </div>
            <div className="border-l border-[#1a1a1a]/8 pl-8">
              <SubLabel>Brand value</SubLabel>
              <p className="mt-4 font-serif text-[1.3rem] font-light italic leading-[1.5] text-[#1a1a1a]/70 md:text-[1.5rem]">&ldquo;{dev.brandValue}&rdquo;</p>
            </div>
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
            <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] ${dev.listed ? "border-[#1e6b45]/30 text-[#1e6b45]" : "border-[#1a1a1a]/15 text-[#1a1a1a]/50"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dev.listed ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/30"}`} />
              {dev.listedNote}
            </span>
            <span className="text-[0.74rem] font-light text-[#1a1a1a]/40">Signals, not figures — directional health on each measure.</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FIN_METRICS.map((m) => (
              <Signal key={m.key} rating={dev.financials[m.key]} label={m.label} full={m.full} meaning={m.meaning} />
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-[0.85rem] font-light leading-[1.7] text-[#1a1a1a]/45">{dev.finNote}</p>
        </Section>

        {/* Legal footnote + CTA */}
        <div className="mt-14 border-t border-[#1a1a1a]/8 pt-8">
          <SubLabel>Legal & compliance</SubLabel>
          <p className="mt-3 max-w-2xl text-[0.9rem] font-light leading-[1.75] text-[#1a1a1a]/55">{dev.legal}</p>
        </div>

        <div className="mt-12 flex flex-col items-start gap-5 rounded-2xl bg-[#1a1a1a] p-9 text-white md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <p className="font-serif text-[1.5rem] font-medium leading-[1.2] md:text-[1.8rem]">Considering a {dev.name} project?</p>
            <p className="mt-2 text-[0.88rem] font-light text-white/55">Get an independent, project-specific read before you commit.</p>
          </div>
          <button onClick={() => open()} className="shrink-0 rounded-sm bg-[#1e6b45] px-7 py-3.5 text-[0.82rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55]">
            Request Independent Advice
          </button>
        </div>

        <p className="mt-8 text-[0.72rem] font-light leading-[1.7] text-[#1a1a1a]/35">
          Independent assessment by Truth Estate. We take no developer commissions. Performance figures are our own tracked estimates; financial signals are directional reads from public filings and parent-group strength — not a substitute for project-level due diligence.
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
