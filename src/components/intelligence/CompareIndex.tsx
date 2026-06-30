"use client";

import { useState } from "react";
import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { COMPARE_OPTIONS, POPULAR_COMPARISONS, comparePairSlug, type CompareKind } from "@/lib/compare";

const basePath = "/Truth-Estate";

const KIND_LABEL: Record<CompareKind, string> = { project: "Projects", developer: "Developers", market: "Markets" };

export default function CompareIndex() {
  const { open } = useJourney();
  const [kind, setKind] = useState<CompareKind>("project");
  const opts = COMPARE_OPTIONS[kind];
  const [a, setA] = useState(opts[0].slug);
  const [b, setB] = useState(opts[1].slug);

  const switchKind = (k: CompareKind) => {
    setKind(k);
    setA(COMPARE_OPTIONS[k][0].slug);
    setB(COMPARE_OPTIONS[k][1].slug);
  };

  const go = () => {
    if (a === b) return;
    window.location.href = `${basePath}/intelligence/compare/${comparePairSlug(a, b)}`;
  };

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
          <span className="text-[#1a1a1a]/20">/</span><span className="text-[#1a1a1a]/55">Compare</span>
        </div>

        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">Comparative Intelligence</p>
        <h1 className="mt-5 max-w-2xl font-serif text-[2.6rem] font-medium leading-[1.04] tracking-[-0.02em] md:text-[4rem]">Compare anything, side by side.</h1>
        <p className="mt-6 max-w-2xl text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/60 md:text-[1.05rem]">
          Two projects, two developers or two markets — measured on the same evidence. Score anatomy against score anatomy, delivery against delivery, price against price. No spin, no sponsored winner.
        </p>

        {/* Picker */}
        <div className="mt-10 rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-7 md:p-9">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(KIND_LABEL) as CompareKind[]).map((k) => (
              <button key={k} onClick={() => switchKind(k)}
                className={`rounded-full border px-4 py-2 text-[0.76rem] font-medium tracking-[0.02em] transition-colors ${kind === k ? "border-[#1e6b45] bg-[#1e6b45] text-white" : "border-[#1a1a1a]/15 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/30"}`}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="mt-6 grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <Select label="First" value={a} onChange={setA} opts={opts} />
            <span className="hidden pb-3 text-center font-serif text-[1.1rem] text-[#1a1a1a]/25 sm:block">vs</span>
            <Select label="Second" value={b} onChange={setB} opts={opts} />
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button onClick={go} disabled={a === b}
              className="rounded-sm bg-[#1e6b45] px-8 py-3 text-[0.8rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] disabled:opacity-30">
              Compare &rarr;
            </button>
            {a === b && <span className="text-[0.78rem] font-light text-[#1a1a1a]/40">Pick two different {KIND_LABEL[kind].toLowerCase()}.</span>}
          </div>
        </div>

        {/* Popular */}
        <h2 className="mt-16 font-serif text-[1.6rem] font-medium tracking-[-0.01em] md:text-[2rem]">Popular comparisons</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {POPULAR_COMPARISONS.map((c) => (
            <a key={c.pair} href={`${basePath}/intelligence/compare/${c.pair}`}
              className="group flex items-center justify-between rounded-xl border border-[#1a1a1a]/8 bg-white/55 px-6 py-4 transition-all duration-300 hover:border-[#c9a96e]/40 hover:bg-white/80">
              <div>
                <span className="font-serif text-[1.02rem] font-light text-[#1a1a1a]/75">{c.label}</span>
                <span className="ml-3 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[#1a1a1a]/30">{KIND_LABEL[c.kind].slice(0, -1)}</span>
              </div>
              <span className="text-[#1a1a1a]/20 transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: { slug: string; name: string }[] }) {
  return (
    <label className="block">
      <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-sm border border-[#1a1a1a]/15 bg-white px-4 py-3 font-serif text-[1.02rem] font-light text-[#1a1a1a] outline-none transition-colors focus:border-[#c9a96e]">
        {opts.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
      </select>
    </label>
  );
}
