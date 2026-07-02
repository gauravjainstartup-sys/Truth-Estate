"use client";

import { useState } from "react";
import { fmtPsf, type ProjectIntel } from "@/lib/projects";
import { openUnitIntel } from "./TowerIntel";

/* Chapter I — the homes. One plan on screen at a time: BHK tabs pick the
   configuration, a size slider moves through the variants offered under it.
   Each shows a 2D floor plan (licensed image where we have one, else an
   indicative zoning schematic), the areas as measured, the derived
   efficiency read and the ticket. Dimensioned plan + 3D + sun/air/Vastu
   live inside Unit Intelligence — the gated layer. */

const basePath = "/Truth-Estate";

export default function ReportHomes({ p }: { p: ProjectIntel }) {
  const homes = p.ops?.homes ?? [];

  // group by configuration (BHK), preserving first-seen order
  const order: string[] = [];
  const groups: Record<string, typeof homes> = {};
  for (const hh of homes) {
    if (!groups[hh.config]) { groups[hh.config] = []; order.push(hh.config); }
    groups[hh.config].push(hh);
  }

  const [tab, setTab] = useState(order[0] ?? "");
  const [vIdx, setVIdx] = useState(0);

  if (!homes.length) return null;

  const activeTab = groups[tab] ? tab : order[0];
  const variants = groups[activeTab];
  const i = Math.min(vIdx, variants.length - 1);
  const h = variants[i];

  const eff = Math.round((h.carpetSqft / h.superSqft) * 100);
  const loading = 100 - eff;
  const midCr = (h.priceCr[0] + h.priceCr[1]) / 2;
  const psfOnSuper = Math.round((midCr * 1e7) / h.superSqft / 100) * 100;
  const beds = h.beds ?? (parseInt(h.config, 10) || 3);
  const effRead =
    eff >= 72 ? { grade: "Strong", tone: "#1e6b45", note: "well above the segment norm — you keep more of what you pay for." }
    : eff >= 66 ? { grade: "Good", tone: "#238c55", note: "solid for a luxury high-rise, where lobbies and amenities eat carpet." }
    : { grade: "Watch", tone: "#9a7a2e", note: "on the lower side — negotiate on carpet, not super." };

  return (
    <div>
      <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
        The home as your agreement will measure it. Pick a configuration, then slide through the sizes offered under it — the plan, the carpet, and what the gap to super area costs you.
      </p>

      {/* ── BHK tabs ── */}
      {order.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {order.map((cfg) => (
            <button key={cfg} onClick={() => { setTab(cfg); setVIdx(0); }}
              className={`inline-flex items-baseline gap-1.5 rounded-full border px-4 py-2 text-[0.82rem] font-medium transition-colors ${cfg === activeTab ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#1a1a1a]/12 bg-white/70 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"}`}>
              {cfg}
              <span className={`text-[0.62rem] font-normal ${cfg === activeTab ? "text-white/55" : "text-[#1a1a1a]/35"}`}>{groups[cfg].length} {groups[cfg].length > 1 ? "sizes" : "size"}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── the one card ── */}
      <div className="overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/60">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5 border-b border-[#1a1a1a]/8 px-6 py-4">
          <p className="font-serif text-[1.3rem] font-medium">
            {h.config}{h.variant && <span className="ml-2 align-middle text-[0.82rem] font-normal text-[#1a1a1a]/45">{h.variant}</span>}
          </p>
          <p className="text-right">
            <span className="font-mono text-[1.05rem] font-semibold">₹{h.priceCr[0]}–{h.priceCr[1]} Cr</span>
            <span className="ml-2 text-[0.68rem] font-light text-[#1a1a1a]/45">≈ {fmtPsf(psfOnSuper)}/sqft on super</span>
          </p>
        </div>

        {/* ── size slider (only when the BHK has more than one size) ── */}
        {variants.length > 1 && (
          <div className="border-b border-[#1a1a1a]/8 bg-[#FBF8F2] px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">Size · {i + 1} of {variants.length}</span>
              <span className="font-mono text-[0.78rem] font-semibold text-[#1a1a1a]">{h.superSqft.toLocaleString("en-IN")} <span className="text-[0.62rem] font-light text-[#1a1a1a]/45">sq ft super</span></span>
            </div>
            <input type="range" min={0} max={variants.length - 1} step={1} value={i} onChange={(e) => setVIdx(Number(e.target.value))}
              className="mt-2.5 w-full accent-[#9a7a2e]" aria-label={`Choose ${h.config} size`} />
            <div className="mt-1 flex justify-between">
              {variants.map((v, idx) => (
                <button key={idx} onClick={() => setVIdx(idx)}
                  className={`text-[0.66rem] transition-colors ${idx === i ? "font-semibold text-[#9a7a2e]" : "font-light text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70"}`}>
                  {v.variant ?? `${v.superSqft.toLocaleString("en-IN")} sqft`}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-5 p-6 lg:grid-cols-[1.2fr_1fr]">
          {/* ── the 2D plan ── */}
          <div>
            <div className="overflow-hidden rounded-xl border border-[#1a1a1a]/10 bg-[#FBF8F2]">
              {h.plan ? (
                <img src={`${basePath}/${h.plan}`} alt={`${h.config} ${h.variant ?? ""} floor plan — ${p.name}`} className="block w-full" />
              ) : (
                <FloorPlanSchematic beds={beds} balcony={h.balconySqft != null} />
              )}
            </div>
            <p className="mt-2 flex items-center justify-between text-[0.66rem] font-light text-[#1a1a1a]/40">
              <span>{h.plan ? "Developer floor plan · indicative unit" : "Indicative zoning schematic · not to scale"}</span>
              <button onClick={openUnitIntel} className="font-medium text-[#9a7a2e] hover:text-[#7a5f1e]">Dimensioned plan ↗</button>
            </p>
          </div>

          {/* ── the areas, measured ── */}
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">The layout, measured</p>
            <dl className="mt-2.5">
              <Row k="Carpet area" v={`${h.carpetSqft.toLocaleString("en-IN")} sq ft`} strong />
              <Row k="Super area" v={`${h.superSqft.toLocaleString("en-IN")} sq ft`} />
              {h.balconySqft != null && <Row k="Balcony / deck" v={`${h.balconySqft.toLocaleString("en-IN")} sq ft`} />}
              <Row k="Loading" v={`${loading}%`} />
              <Row k="Carpet efficiency" v={`${eff}%`} strong />
            </dl>
            <div className="mt-4 rounded-xl border px-4 py-3" style={{ borderColor: `${effRead.tone}40`, background: `${effRead.tone}0d` }}>
              <p className="flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.12em]" style={{ color: effRead.tone }}>
                ◆ The efficiency read
                <span className="ml-auto rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold text-white" style={{ background: effRead.tone }}>{effRead.grade} · {eff}%</span>
              </p>
              <p className="mt-1.5 text-[0.78rem] font-light leading-[1.55] text-[#1a1a1a]/65">
                <b className="font-semibold text-[#1a1a1a]">{eff}% usable</b> — {effRead.note}
              </p>
            </div>
          </div>
        </div>

        {/* gated deep layer */}
        <button onClick={openUnitIntel} className="group flex w-full items-center gap-3.5 border-t border-dashed border-[#9a7a2e]/30 bg-[#FBF8F2] px-6 py-3.5 text-left transition-colors hover:bg-[#f6efe1]">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#9a7a2e]/[0.12] text-[1rem] text-[#9a7a2e]" aria-hidden>▦</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.82rem] font-semibold text-[#1a1a1a]/85">Walk this exact home — 3D model, sun path, airflow &amp; Vastu</span>
            <span className="block text-[0.7rem] font-light text-[#1a1a1a]/45">the dimensioned floor plan + per-unit intelligence, inside Unit Intelligence</span>
          </span>
          <span className="text-[#9a7a2e] transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
        </button>
      </div>

      <p className="mt-4 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">
        Areas from RERA filings &amp; project documents; prices are tracked bands, not quotes. Schematics show indicative zoning only — confirm the exact unit&apos;s dimensioned plan and areas in the Agreement to Sell before signing.
      </p>
    </div>
  );
}

/* An indicative, brand-safe zoning schematic — deliberately not a surveyed
   plan (that's the licensed image + the gated dimensioned plan). Reads as
   "a floor plan" without asserting one. */
function FloorPlanSchematic({ beds, balcony }: { beds: number; balcony: boolean }) {
  const bedLabels = beds >= 4 ? ["Master bed", "Bed 2", "Bed 3", "Bed 4"] : ["Master bed", "Bed 2", "Bed 3"];
  return (
    <svg viewBox="0 0 340 250" className="block w-full" role="img" aria-label="Indicative zoning schematic">
      <rect width="340" height="250" fill="#FBF8F2" />
      {/* unit boundary */}
      <rect x="12" y="12" width="316" height="226" rx="6" fill="#fff" stroke="#9a7a2e" strokeWidth="2" opacity="0.9" />
      {/* zones */}
      <Zone x={18} y={18} w={168} h={128} label="Living / Dining" big />
      <Zone x={18} y={150} w={168} h={82} label="Kitchen" />
      <Zone x={190} y={18} w={132} h={78} label={bedLabels[0]} />
      <Zone x={190} y={100} w={132} h={64} label={beds >= 4 ? "Bed 2 · Bed 4" : "Bed 2"} />
      <Zone x={190} y={168} w={72} h={64} label="Bed 3" />
      <Zone x={266} y={168} w={56} h={64} label="Bath" small />
      {/* balcony strip */}
      {balcony && <><rect x="18" y="146" width="168" height="0" /></>}
      {/* door + compass */}
      <path d="M96 232 q14 -14 28 0" fill="none" stroke="#9a7a2e" strokeWidth="1.5" opacity="0.6" />
      <g transform="translate(305 34)" opacity="0.5">
        <circle r="9" fill="none" stroke="#9a7a2e" strokeWidth="1" />
        <path d="M0 -7 L0 5 M0 -7 L-3 -2 M0 -7 L3 -2" stroke="#9a7a2e" strokeWidth="1" fill="none" />
        <text y="16" textAnchor="middle" fontSize="7" fill="#9a7a2e" fontFamily="ui-sans-serif">N</text>
      </g>
    </svg>
  );
}

function Zone({ x, y, w, h, label, big, small }: { x: number; y: number; w: number; h: number; label: string; big?: boolean; small?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={big ? "#9a7a2e0f" : "#1a1a1a05"} stroke="#9a7a2e" strokeWidth="1" opacity="0.5" />
      <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize={small ? 8.5 : big ? 12 : 10} fill="#1a1a1a" opacity="0.6" fontFamily="ui-sans-serif" fontWeight={big ? 600 : 400}>{label}</text>
    </g>
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
