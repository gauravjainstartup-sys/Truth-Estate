"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { DEVELOPERS } from "@/lib/developers";

const basePath = "/Truth-Estate";

export default function DevelopersIndex() {
  const { open } = useJourney();
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
        <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">Developer Intelligence</p>
        <h1 className="mt-5 max-w-2xl font-serif text-[2.6rem] font-medium leading-[1.05] tracking-[-0.02em] md:text-[3.8rem]">
          Every developer, x-rayed.
        </h1>
        <p className="mt-5 max-w-xl text-[1rem] font-light leading-[1.8] text-[#1a1a1a]/50">
          Independent dossiers on the developers shaping Gurugram — track record, delivery
          performance and financial health. No commissions, no spin.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {DEVELOPERS.map((d) => (
            <a
              key={d.slug}
              href={`${basePath}/intelligence/developers/${d.slug}`}
              className="group rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-7 transition-all duration-300 hover:border-[#c9a96e]/40 hover:bg-white/80"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-serif text-[1.7rem] font-medium text-[#1a1a1a]">{d.name}</h2>
                <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] ${d.listed ? "border-[#1e6b45]/30 text-[#1e6b45]" : "border-[#1a1a1a]/15 text-[#1a1a1a]/40"}`}>
                  <span className={`h-1 w-1 rounded-full ${d.listed ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/30"}`} />
                  {d.listed ? "Listed" : "Private"}
                </span>
              </div>
              <p className="mt-2 text-[0.78rem] font-light text-[#1a1a1a]/40">Established {d.est}</p>
              <p className="mt-4 font-serif text-[1.02rem] font-light italic leading-[1.5] text-[#1a1a1a]/60">{d.tagline}</p>
              <div className="mt-6 flex items-center gap-6 border-t border-[#1a1a1a]/8 pt-5">
                <span className="font-mono text-[0.8rem] text-[#1a1a1a]/55">{d.performance.onTimePct}% <span className="text-[0.62rem] uppercase tracking-[0.08em] text-[#1a1a1a]/35">on-time</span></span>
                <span className="font-mono text-[0.8rem] text-[#1a1a1a]/55">{d.performance.delivered} <span className="text-[0.62rem] uppercase tracking-[0.08em] text-[#1a1a1a]/35">delivered</span></span>
                <span className="ml-auto text-[0.8rem] text-[#c9a96e] transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
