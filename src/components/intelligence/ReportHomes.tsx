"use client";

import { fmtPsf, type ProjectIntel } from "@/lib/projects";
import { openUnitIntel } from "./TowerIntel";

/* Chapter I — the homes. Per-configuration cards: the areas as measured
   (carpet / super / balcony), the derived loading & efficiency with an
   honest read, and the indicative ticket. Dimensioned floor plans and the
   3D walkthrough live inside Unit Intelligence — the gated layer. */

export default function ReportHomes({ p }: { p: ProjectIntel }) {
  const homes = p.ops?.homes;
  if (!homes?.length) return null;

  return (
    <div>
      <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
        The home as it will be measured in your agreement — carpet, super and what the gap between them costs you. Indicative; exact areas vary by tower and stack.
      </p>
      <div className={`grid gap-4 ${homes.length > 1 ? "lg:grid-cols-2" : ""}`}>
        {homes.map((h) => {
          const eff = Math.round((h.carpetSqft / h.superSqft) * 100);
          const loading = 100 - eff;
          const midCr = (h.priceCr[0] + h.priceCr[1]) / 2;
          const psfOnSuper = Math.round((midCr * 1e7) / h.superSqft / 100) * 100;
          const effRead =
            eff >= 72 ? { grade: "Strong", tone: "#1e6b45", note: "well above the segment norm — you keep more of what you pay for." }
            : eff >= 66 ? { grade: "Good", tone: "#238c55", note: "solid for a luxury high-rise, where lobbies and amenities eat carpet." }
            : { grade: "Watch", tone: "#9a7a2e", note: "on the lower side — negotiate on carpet, not super." };
          return (
            <div key={h.config} className="overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/60">
              {/* header */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5 border-b border-[#1a1a1a]/8 px-6 py-4">
                <p className="font-serif text-[1.3rem] font-medium">{h.config}</p>
                <p className="text-right">
                  <span className="font-mono text-[1.05rem] font-semibold">₹{h.priceCr[0]}–{h.priceCr[1]} Cr</span>
                  <span className="ml-2 text-[0.68rem] font-light text-[#1a1a1a]/45">≈ {fmtPsf(psfOnSuper)}/sqft on super</span>
                </p>
              </div>
              {/* the layout, measured */}
              <div className="px-6 py-5">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">The layout, measured</p>
                <dl className="mt-2.5">
                  <Row k="Carpet area" v={`${h.carpetSqft.toLocaleString("en-IN")} sq ft`} strong />
                  <Row k="Super area" v={`${h.superSqft.toLocaleString("en-IN")} sq ft`} />
                  {h.balconySqft != null && <Row k="Balcony / deck" v={`${h.balconySqft.toLocaleString("en-IN")} sq ft`} />}
                  <Row k="Loading" v={`${loading}%`} />
                  <Row k="Carpet efficiency" v={`${eff}%`} strong />
                </dl>
                {/* efficiency read */}
                <div className="mt-4 rounded-xl border px-4 py-3" style={{ borderColor: `${effRead.tone}40`, background: `${effRead.tone}0d` }}>
                  <p className="flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.12em]" style={{ color: effRead.tone }}>
                    ◆ The efficiency read
                    <span className="ml-auto rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold text-white" style={{ background: effRead.tone }}>{effRead.grade} · {eff}%</span>
                  </p>
                  <p className="mt-1.5 text-[0.78rem] font-light leading-[1.55] text-[#1a1a1a]/65">
                    <b className="font-semibold text-[#1a1a1a]">{eff}% usable</b> — {effRead.note}
                  </p>
                </div>
                {/* plans hook */}
                <button onClick={openUnitIntel} className="group mt-4 flex w-full items-center gap-3.5 rounded-xl border border-dashed border-[#9a7a2e]/40 bg-[#FBF8F2] px-4 py-3.5 text-left transition-colors hover:border-[#9a7a2e]/70">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#9a7a2e]/[0.12] text-[1rem] text-[#9a7a2e]" aria-hidden>▦</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.82rem] font-semibold text-[#1a1a1a]/85">Dimensioned floor plan &amp; 3D walkthrough</span>
                    <span className="block text-[0.7rem] font-light text-[#1a1a1a]/45">room-by-room, with sun &amp; airflow per unit — inside Unit Intelligence</span>
                  </span>
                  <span className="text-[#9a7a2e] transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">
        Areas from RERA filings &amp; project documents; prices are tracked bands, not quotes — confirm the exact unit&apos;s areas in the Agreement to Sell before signing.
      </p>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-dotted border-[#1a1a1a]/12 py-2 last:border-none">
      <dt className="text-[0.8rem] font-light text-[#1a1a1a]/55">{k}</dt>
      <dd className="ml-auto font-mono text-[0.92rem] font-semibold" style={{ color: strong ? "#1a1a1a" : "rgba(26,26,26,0.7)" }}>{v}</dd>
    </div>
  );
}
