"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { DEVELOPERS } from "@/lib/developers";
import type { LiveDeveloper } from "@/lib/supabase";
import { basePath, homeHref } from "@/lib/site";


const bandTone = (b: string | null) =>
  b && /strong|good|high/i.test(b)
    ? "border-[#238c55]/30 bg-[#238c55]/[0.08] text-[#1c7a4c]"
    : b && /weak|poor|low/i.test(b)
      ? "border-[#9a4130]/30 bg-[#9a4130]/[0.07] text-[#9a4130]"
      : "border-[#9a7a2e]/35 bg-[#9a7a2e]/[0.08] text-[#8a6a1e]";

export default function DevelopersIndex({ live }: { live?: LiveDeveloper[] | null }) {
  const { open } = useJourney();

  /* THE SAME PAGE WAS PUBLISHING TWO ANSWERS.
     The dossier cards carried hand-written performance — DLF 92% on-time
     and 38 delivered, Godrej 90% and 22 — while the table beneath them
     printed the pipeline's: DLF 84% and 31, Godrej 37% and ONE. Both
     were on screen at once, about the same developers, and the project
     reports elsewhere on the site agree with the table, not the cards.
     The filings win; the cards are editorial about a builder, not a
     second opinion on its record. */
  const byName = new Map((live ?? []).map((d) => [d.name.toLowerCase(), d]));
  const bySlug = new Map((live ?? []).map((d) => [(d.slug ?? "").toLowerCase(), d]));
  const record = (name: string, slug: string) => {
    const l = byName.get(name.toLowerCase()) ?? bySlug.get(slug.toLowerCase());
    if (!l) return null;
    return {
      onTimePct: l.delayedPct != null ? Math.round(100 - l.delayedPct) : null,
      delivered: l.delivered ?? null,
    };
  };

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={homeHref} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
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
          performance and financial health. No paid placements, no spin.
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
              {(() => {
                const r = record(d.name, d.slug);
                const onTime = r?.onTimePct ?? d.performance.onTimePct;
                const delivered = r?.delivered ?? d.performance.delivered;
                return (
                  <div className="mt-6 flex items-center gap-6 border-t border-[#1a1a1a]/8 pt-5">
                    <span className="font-mono text-[0.8rem] text-[#1a1a1a]/55">{onTime}% <span className="text-[0.62rem] uppercase tracking-[0.08em] text-[#1a1a1a]/35">on-time</span></span>
                    <span className="font-mono text-[0.8rem] text-[#1a1a1a]/55">{delivered} <span className="text-[0.62rem] uppercase tracking-[0.08em] text-[#1a1a1a]/35">delivered</span></span>
                    <span className="ml-auto text-[0.8rem] text-[#c9a96e] transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                  </div>
                );
              })()}
            </a>
          ))}
        </div>

        {/* ── Track records, computed — live from the filings pipeline ── */}
        {live && live.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3">
              <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">Track records, computed</span>
              <span className="rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-2.5 py-0.5 font-mono text-[0.54rem] tracking-[0.14em] text-[#1e6b45]">LIVE · FROM THE FILINGS</span>
              <span className="h-px flex-1 bg-[#1a1a1a]/10" />
            </div>
            <p className="mt-2 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/50">
              Delivery and delay numbers computed straight from RERA filings by our pipeline — refreshed with every deploy. Full dossiers follow as each developer clears review.
            </p>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-[#1a1a1a]/10 bg-white/60">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[1.6fr_repeat(4,minmax(84px,0.7fr))_1.2fr] gap-3 border-b border-[#1a1a1a]/[0.08] bg-[#1a1a1a]/[0.02] px-5 py-2.5">
                  {["Developer", "Projects", "Delivered", "Delayed", "Avg delay", "Health signals"].map((h) => (
                    <span key={h} className="font-mono text-[0.54rem] uppercase tracking-[0.14em] text-[#1a1a1a]/40">{h}</span>
                  ))}
                </div>
                {live.map((d, i) => (
                  <div key={`${d.name}-${i}`} className={`grid grid-cols-[1.6fr_repeat(4,minmax(84px,0.7fr))_1.2fr] items-center gap-3 px-5 py-3 ${i > 0 ? "border-t border-[#1a1a1a]/[0.06]" : ""}`}>
                    <span className="truncate font-serif text-[0.98rem] font-medium">{d.name}</span>
                    <span className="font-mono text-[0.76rem] tabular-nums text-[#1a1a1a]/60">{d.total ?? "—"}</span>
                    <span className="font-mono text-[0.76rem] tabular-nums text-[#1e6b45]">{d.delivered ?? "—"}</span>
                    <span className="font-mono text-[0.76rem] tabular-nums text-[#1a1a1a]/60">{d.delayedPct != null ? `${Math.round(d.delayedPct)}%` : "—"}</span>
                    <span className="font-mono text-[0.76rem] tabular-nums text-[#1a1a1a]/60">{d.avgDelayMonths != null ? `${Math.round(d.avgDelayMonths)} mo` : "—"}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {d.financialBand && <span className={`rounded-full border px-2 py-0.5 text-[0.56rem] font-medium uppercase tracking-[0.06em] ${bandTone(d.financialBand)}`}>FIN · {d.financialBand}</span>}
                      {d.legalBand && <span className={`rounded-full border px-2 py-0.5 text-[0.56rem] font-medium uppercase tracking-[0.06em] ${bandTone(d.legalBand)}`}>LEGAL · {d.legalBand}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[0.68rem] font-light text-[#1a1a1a]/40">Computed from public filings, unedited · deep dossiers above are hand-reviewed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
