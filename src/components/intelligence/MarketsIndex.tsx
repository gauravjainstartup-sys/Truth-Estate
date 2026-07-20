"use client";

import Logo from "../Logo";
import GurugramMap from "./GurugramMap";
import { useJourney } from "../journey/JourneyProvider";
import { MARKETS, GURUGRAM_OVERVIEW, fmtPsf } from "@/lib/markets";
import { corridorKey } from "@/lib/journey";
import type { LiveMicroMarket, TrackedOverview } from "@/lib/supabase";

const basePath = "/Truth-Estate";

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

export default function MarketsIndex({ live, overview }: { live?: LiveMicroMarket[] | null; overview?: TrackedOverview | null }) {
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
          <GurugramMap counts={overview?.byCorridor} />
        </div>

        {/* All micro-markets */}
        <h2 className="mt-20 font-serif text-[1.8rem] font-medium tracking-[-0.01em] md:text-[2.2rem]">Every micro-market</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {MARKETS.map((m) => (
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
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#1a1a1a]/8 pt-5">
                <Mini v={`${overview?.byCorridor[corridorKey(m.name)] ?? m.projectCount}`} k="Projects" />
                <Mini v={fmtPsf(m.psf.avg)} k="Avg/sqft" />
                <Mini v={m.appreciation3Y} k="3Y" accent />
              </div>
            </a>
          ))}
        </div>

        {/* ── Corridors under live pipeline coverage ── */}
        {live && live.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3">
              <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">Under live coverage</span>
              <span className="rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-2.5 py-0.5 font-mono text-[0.54rem] tracking-[0.14em] text-[#1e6b45]">LIVE · FROM THE PIPELINE</span>
              <span className="h-px flex-1 bg-[#1a1a1a]/10" />
            </div>
            <p className="mt-2 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/50">
              Micro-markets our data pipeline tracks continuously — infrastructure, supply and potential, refreshed with every deploy. Deep profiles above; the rest graduate as coverage completes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {live.map((m) => (
                <span key={m.slug} className="rounded-full border border-[#1a1a1a]/12 bg-white/70 px-4 py-2 text-[0.8rem] font-light text-[#1a1a1a]/65">{m.name}</span>
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
