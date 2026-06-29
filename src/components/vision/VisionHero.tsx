"use client";

import Logo from "../Logo";
import MarketPulse from "./MarketPulse";
import { useJourney } from "../journey/JourneyProvider";
import { PRIMARY_CTA, ACTIVE_PROJECT_COUNT } from "@/lib/journey";

const basePath = "/Truth-Estate";

export default function VisionHero() {
  const { open } = useJourney();
  return (
    <section className="relative flex min-h-svh flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Ambient field — a faint data grid + warm glow, the quiet of an institution */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 35%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 35%, black 30%, transparent 80%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,169,110,0.10) 0%, transparent 60%)" }}
      />

      {/* Nav */}
      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-6 py-7 md:px-10">
        <Logo className="h-9 w-auto opacity-90" />
        <div className="ml-auto hidden items-center gap-10 text-[11px] font-medium tracking-[0.14em] text-white/45 md:flex">
          <a href="#intelligence" className="transition-colors hover:text-white/85">Intelligence</a>
          <a href="#truthguide" className="transition-colors hover:text-white/85">TruthGuide</a>
          <a href="#advisory" className="transition-colors hover:text-white/85">Advisory</a>
          <a href={`${basePath}/methodology`} className="transition-colors hover:text-white/85">Methodology</a>
        </div>
        <button
          onClick={() => open()}
          className="ml-8 hidden rounded-sm bg-[#1e6b45] px-5 py-2.5 text-[12px] font-medium tracking-[0.06em] text-white transition-colors hover:bg-[#238c55] md:block"
        >
          {PRIMARY_CTA}
        </button>
      </nav>

      {/* Centerpiece */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-12 md:px-10">
        <p className="animate-fade-up text-[11px] font-medium uppercase tracking-[0.4em] text-[#c9a96e]">
          Independent Real Estate Intelligence
        </p>
        <h1
          className="animate-fade-up mt-7 max-w-4xl font-serif text-[3rem] font-medium leading-[1.04] tracking-[-0.02em] text-white md:text-[4.4rem] lg:text-[5.4rem]"
          style={{ animationDelay: "80ms" }}
        >
          Know what you&apos;re
          <br />
          <span className="text-white/55">really buying.</span>
        </h1>
        <p
          className="animate-fade-up mt-9 max-w-xl text-[1rem] font-light leading-[1.8] text-white/55 md:text-[1.1rem]"
          style={{ animationDelay: "200ms" }}
        >
          Bloomberg-grade intelligence and independent advisory for high-value
          property decisions in India. We answer to you — never the developer.
          Proof, not promises.
        </p>

        <div className="animate-fade-up mt-11 flex flex-wrap items-center gap-6" style={{ animationDelay: "320ms" }}>
          <button
            onClick={() => open()}
            className="rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.06em] text-white shadow-lg shadow-black/40 transition-all duration-300 hover:bg-[#238c55]"
          >
            {PRIMARY_CTA}
          </button>
          <a href="#intelligence" className="text-[13px] tracking-[0.04em] text-white/55 transition-colors hover:text-white/85">
            Explore the intelligence &darr;
          </a>
        </div>

        {/* Quiet proof line */}
        <div className="animate-fade-up mt-16 flex flex-wrap items-center gap-x-10 gap-y-3 text-[0.78rem] font-light text-white/35" style={{ animationDelay: "440ms" }}>
          <span><span className="font-mono text-white/70">{ACTIVE_PROJECT_COUNT}</span> active projects tracked</span>
          <span className="hidden h-3 w-px bg-white/15 sm:block" />
          <span><span className="font-mono text-white/70">6</span> micro-markets, live</span>
          <span className="hidden h-3 w-px bg-white/15 sm:block" />
          <span><span className="font-mono text-white/70">Zero</span> developer commissions</span>
        </div>
      </div>

      {/* Live ticker at the foot of the hero */}
      <div className="relative z-10">
        <MarketPulse />
      </div>
    </section>
  );
}
