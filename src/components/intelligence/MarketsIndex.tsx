"use client";

import Logo from "../Logo";
import GurugramMap from "./GurugramMap";
import { useJourney } from "../journey/JourneyProvider";
import { GURUGRAM_OVERVIEW, fmtPsf } from "@/lib/markets";
import type { MarketCard } from "@/lib/marketsLive";
import type { TrackedOverview } from "@/lib/supabase";
import { basePath } from "@/lib/site";


/* The headline stats, live from the tracked set where available (fallback to the
   curated overview). Keeps the labels; swaps the hand-set numbers for real ones. */
function liveStats(overview?: TrackedOverview | null): { k: string; v: string }[] {
  if (!overview) return GURUGRAM_OVERVIEW.stats;
  const psf =
    overview.psfMin != null && overview.psfMax != null
      ? `₹${Math.round(overview.psfMin / 1000)}K–${Math.round(overview.psfMax / 1000)}K / sq ft`
      : GURUGRAM_OVERVIEW.stats.find((s) => s.k === "Price range")?.v ?? "";
  return [
    { k: "Micro-markets tracked", v: `${overview.microMarkets}` },
    { k: "Active projects", v: `${overview.activeProjects}` },
    { k: "Price range", v: psf },
  ];
}

const TIER_TONE: Record<string, string> = {
  Established: "border-[#c9a96e]/40 text-[#9a7a2e]",
  Growth: "border-[#3e8e62]/40 text-[#3e8e62]",
  Value: "border-[#1a1a1a]/15 text-[#1a1a1a]/45",
  Emerging: "border-[#1a1a1a]/15 text-[#1a1a1a]/45",
};

export default function MarketsIndex({
  markets,
  uncovered,
  overview,
}: {
  markets: MarketCard[];
  uncovered: { name: string; count: number }[];
  overview?: TrackedOverview | null;
}) {
  const { open } = useJourney();
  const stats = liveStats(overview);
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
          <span className="text-[#1a1a1a]/20">/</span><span className="text-[#1a1a1a]/55">Locations</span>
        </div>

        {/* Gurugram overview */}
        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">Location Intelligence</p>
        <h1 className="mt-5 max-w-2xl font-serif text-[2.6rem] font-medium leading-[1.04] tracking-[-0.02em] md:text-[4rem]">{GURUGRAM_OVERVIEW.headline}</h1>
        <p className="mt-6 max-w-2xl text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/60 md:text-[1.05rem]">{GURUGRAM_OVERVIEW.body}</p>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
          {stats.map((s) => (
            <div key={s.k} className="flex items-baseline gap-2.5">
              <span className="font-mono text-[1.2rem] text-[#1a1a1a]">{s.v}</span>
              <span className="text-[0.74rem] font-light text-[#1a1a1a]/40">{s.k}</span>
            </div>
          ))}
        </div>

        {/* Interactive map */}
        <div className="mt-14">
          <GurugramMap markets={markets} />
        </div>

        {/* All micro-markets */}
        <h2 className="mt-20 font-serif text-[1.8rem] font-medium tracking-[-0.01em] md:text-[2.2rem]">Every micro-market</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {markets.map((m) => (
            <a key={m.slug} href={`${basePath}/intelligence/markets/${m.slug}`}
               className="group rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-7 transition-all duration-300 hover:border-[#c9a96e]/40 hover:bg-white/80">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-[1.6rem] font-medium text-[#1a1a1a]">{m.name}</h3>
                  <p className="mt-1 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-[#1a1a1a]/35">{m.short}</p>
                </div>
                <span className={`mt-1 rounded-full border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] ${TIER_TONE[m.tier]}`}>{m.tier}</span>
              </div>
              <p className="mt-4 text-[0.88rem] font-light leading-[1.6] text-[#1a1a1a]/55">{m.info}</p>
              {/* Same three slots, now filled from the pipeline: the tracked
                  count, the corridor's own average rate, and its five-year
                  CAGR estimate. The label moved with the number — the value
                  in this slot is no longer a three-year band. */}
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#1a1a1a]/8 pt-5">
                <Mini v={`${m.projectCount}`} k="Projects" />
                <Mini v={fmtPsf(m.psf.avg)} k="Avg/sqft" />
                <Mini v={m.appreciation3Y} k="5Y CAGR" accent />
              </div>
            </a>
          ))}
        </div>

        {/* ── Corridors tracked but not yet profiled ──
            This strip used to list all eight corridors under coverage —
            including the six already profiled directly above it — so the
            two that were genuinely new were indistinguishable from the
            repeats, and the copy promising "the rest" pointed at nothing.
            Now it lists only what is missing from the grid, with the number
            of projects already tracked in each. */}
        {uncovered.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3">
              <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">Tracked, profile in progress</span>
              <span className="rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-2.5 py-0.5 font-mono text-[0.54rem] tracking-[0.14em] text-[#1e6b45]">LIVE · FROM THE PIPELINE</span>
              <span className="h-px flex-1 bg-[#1a1a1a]/10" />
            </div>
            <p className="mt-2 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/50">
              These corridors are already under continuous coverage — infrastructure, supply and potential, refreshed with every deploy — and their projects are scored and searchable today. The written profiles land as coverage completes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {uncovered.map((m) => (
                <span key={m.name} className="rounded-full border border-[#1a1a1a]/12 bg-white/70 px-4 py-2 text-[0.8rem] font-light text-[#1a1a1a]/65">
                  {m.name}
                  {m.count > 0 && <span className="ml-2 font-mono text-[0.66rem] text-[#1a1a1a]/35">{m.count}</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Mini({ v, k, accent }: { v: string; k: string; accent?: boolean }) {
  return (
    <div>
      <p className={`font-mono text-[0.95rem] ${accent ? "text-[#3e8e62]" : "text-[#1a1a1a]/75"}`}>{v}</p>
      <p className="mt-1 text-[0.58rem] uppercase tracking-[0.1em] text-[#1a1a1a]/35">{k}</p>
    </div>
  );
}
