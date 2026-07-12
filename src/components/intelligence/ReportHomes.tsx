"use client";

import { useEffect, useState } from "react";
import { fmtPsf, type ProjectIntel } from "@/lib/projects";
import ZoomStage from "./ZoomStage";

/* Chapter I — the homes. One plan on screen at a time: BHK tabs pick the
   configuration, a size slider moves through the variants offered under it.
   Each shows a 2D floor plan (licensed image where we have one, else an
   indicative zoning schematic), the areas as measured, the derived
   efficiency read and the ticket. Dimensioned plan + 3D + sun/air/Vastu
   live inside Unit Intelligence — the gated layer. */

const basePath = "/Truth-Estate";
const asset = (s: string) => (/^(https?:\/\/|data:)/i.test(s) ? s : `${basePath}/${s}`);

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
  const [zoom, setZoom] = useState(false);
  const [planIdx, setPlanIdx] = useState(0); // which floor-plan (e.g. duplex level)
  const [imgErr, setImgErr] = useState(false); // active plan image failed to load

  // Esc closes the floor-plan lightbox
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  if (!homes.length) return null;

  const activeTab = groups[tab] ? tab : order[0];
  const variants = groups[activeTab];
  const i = Math.min(vIdx, variants.length - 1);
  const h = variants[i];

  // a home may carry several plan images (a duplex's levels); fall back to the
  // single `plan`, then to the schematic
  const plans = h.plans ?? (h.plan ? [{ src: h.plan, label: "" }] : []);
  const activePlan = plans.length ? plans[Math.min(planIdx, plans.length - 1)] : null;

  const eff = Math.round((h.carpetSqft / h.superSqft) * 100);
  const loading = 100 - eff;
  const psfOnSuper = Math.round((h.priceCr * 1e7) / h.superSqft / 100) * 100;
  const beds = h.beds ?? (parseInt(h.config, 10) || 3);
  const effRead =
    eff >= 72 ? { grade: "Strong", tone: "#1e6b45", note: "well above the segment norm — you keep more of what you pay for." }
    : eff >= 66 ? { grade: "Good", tone: "#238c55", note: "solid for a luxury high-rise, where lobbies and amenities eat carpet." }
    : { grade: "Watch", tone: "#9a7a2e", note: "on the lower side — negotiate on carpet, not super." };

  return (
    <div>
      <p className="-mt-2 mb-6 max-w-2xl text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/55">
        The home as your agreement will measure it. Pick a configuration, then a size offered under it — the plan, the carpet, and what the gap to super area costs you.
      </p>

      {/* ── BHK pills — a single horizontal-scroll row so many BHKs never wrap
         on mobile; they scroll sideways instead ── */}
      {order.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {order.map((cfg) => (
            <button key={cfg} onClick={() => { setTab(cfg); setVIdx(0); setPlanIdx(0); setImgErr(false); }}
              className={`inline-flex shrink-0 items-baseline gap-1.5 rounded-full border px-4 py-2 text-[0.82rem] font-medium transition-colors ${cfg === activeTab ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#1a1a1a]/12 bg-white/70 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"}`}>
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
            {h.config}
          </p>
          {h.priceCr > 0 && (
          <p className="text-right">
            <span className="font-mono text-[1.05rem] font-semibold">₹{h.priceCr} Cr</span>
            <span className="ml-2 text-[0.68rem] font-light text-[#1a1a1a]/45">≈ {fmtPsf(psfOnSuper)}/sqft on super</span>
          </p>
          )}
        </div>

        {/* ── size picker (segmented cards — only when the BHK has >1 size) ── */}
        {variants.length > 1 && (
          <div className="border-b border-[#1a1a1a]/8 bg-[#FBF8F2] px-6 py-4">
            <p className="mb-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">Choose a size · {variants.length} options</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v, idx) => {
                const on = idx === i;
                const psf = Math.round((v.priceCr * 1e7) / v.superSqft / 100) * 100;
                return (
                  <button key={idx} onClick={() => { setVIdx(idx); setPlanIdx(0); setImgErr(false); }}
                    className={`min-w-[112px] flex-1 rounded-xl border px-4 py-2.5 text-left transition-colors sm:flex-none ${on ? "border-[#9a7a2e] bg-[#9a7a2e]/[0.09] shadow-[0_0_0_1px_#9a7a2e]" : "border-[#1a1a1a]/12 bg-white hover:border-[#1a1a1a]/30"}`}>
                    <span className={`block text-[0.82rem] font-semibold ${on ? "text-[#7a5f1e]" : "text-[#1a1a1a]/75"}`}>{v.variant ?? `Size ${idx + 1}`}</span>
                    <span className="mt-0.5 block font-mono text-[0.68rem] text-[#1a1a1a]/50">{psf > 0 ? <>{v.superSqft.toLocaleString("en-IN")} sq ft · {fmtPsf(psf)}</> : <>{v.superSqft.toLocaleString("en-IN")} sq ft</>}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-5 p-6 lg:grid-cols-[1.2fr_1fr]">
          {/* ── the 2D plan — the image is the click target, enlarge affordance
             in the corner; same pattern as the masterplan ── */}
          <div>
            {/* level / plan toggle — only when the unit carries more than one plan
               (e.g. a duplex's lower + upper floor) */}
            {plans.length > 1 && (
              <div className="mb-2.5 flex flex-wrap gap-2">
                {plans.map((pl, idx) => (
                  <button key={idx} type="button" onClick={() => { setPlanIdx(idx); setImgErr(false); }}
                    className={`rounded-full border px-3.5 py-1.5 text-[0.72rem] font-medium transition-colors ${idx === planIdx ? "border-[#9a7a2e] bg-[#9a7a2e]/[0.09] text-[#7a5f1e]" : "border-[#1a1a1a]/12 bg-white/70 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"}`}>
                    {pl.label || `Plan ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setZoom(true)} aria-label="Enlarge the floor plan"
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-[#1a1a1a]/10 bg-[#FBF8F2] text-left">
              {activePlan && !imgErr ? (
                <img loading="lazy" src={asset(activePlan.src)} onError={() => setImgErr(true)} alt={`${h.config} ${activePlan.label || h.variant || ""} floor plan — ${p.name}`} className="block w-full transition-transform duration-500 group-hover:scale-[1.02]" />
              ) : (
                <FloorPlanSchematic beds={beds} balcony={h.balconySqft != null} />
              )}
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[#0b1f1a]/70 px-3 py-1.5 text-[0.66rem] font-medium text-white backdrop-blur-sm transition-colors group-hover:bg-[#0b1f1a]/90">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                Enlarge
              </span>
            </button>
          </div>

          {/* ── the areas, measured ── */}
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">The layout, measured</p>
            <dl className="mt-2.5">
              <Row k="Carpet area" v={`${h.carpetSqft.toLocaleString("en-IN")} sq ft`} strong />
              <Row k="Super area" v={`${h.superSqft.toLocaleString("en-IN")} sq ft`} />
              <Row k="Balcony / deck" v={h.balconySqft != null ? `${h.balconySqft.toLocaleString("en-IN")} sq ft` : "NA"} />
              <Row k="Loading" v={`${loading}%`} />
              <Row k="Carpet efficiency" v={`${eff}%`} strong />
            </dl>
            {/* the efficiency read — the same quiet left-rule strip as the report's
               other analyst reads; the grade rides as a hairline chip and the
               figure lives once, in the prose */}
            <div className="mt-4 rounded-r-xl border-l-2 px-5 py-3.5" style={{ borderColor: effRead.tone, background: `${effRead.tone}0f` }}>
              <p className="flex items-center gap-2.5 text-[0.6rem] font-bold uppercase tracking-[0.12em]" style={{ color: effRead.tone }}>
                ◆ The efficiency read
                <span className="rounded-full border px-2.5 py-[3px] text-[0.56rem] font-semibold uppercase tracking-[0.1em]" style={{ borderColor: `${effRead.tone}55`, color: effRead.tone }}>{effRead.grade}</span>
              </p>
              <p className="mt-1.5 text-[0.82rem] font-light leading-[1.6] text-[#1a1a1a]/70">
                <b className="font-semibold text-[#1a1a1a]">{eff}% usable</b> — {effRead.note}
              </p>
            </div>
          </div>
        </div>

        {/* the gated per-unit layer is pitched once — by the Tower & Unit
           Intelligence banner that directly follows this section */}
      </div>

      <p className="mt-4 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">
        Areas from RERA filings &amp; project documents; the price shown is indicative for this configuration, before floor-rise and preferential-location charges. Schematics show indicative zoning only — confirm the exact unit&apos;s dimensioned plan and areas in the Agreement to Sell before signing.
      </p>

      {/* floor-plan viewer — same chrome as the site-plan / document viewer:
         emerald full-screen backdrop, gold title, round ✕; Esc or tap-out closes */}
      {zoom && (
        <div className="fixed inset-0 z-[140] flex flex-col bg-[#0b1f1a]/90 backdrop-blur-sm" onClick={() => setZoom(false)} role="dialog" aria-modal="true" aria-label="Floor plan — enlarged">
          <div className="flex items-center justify-between gap-4 px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#B29668]">
              {h.config}{activePlan?.label ? ` · ${activePlan.label}` : ""} — Floor plan
            </p>
            <button onClick={() => setZoom(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white">✕</button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <ZoomStage>
              {activePlan && !imgErr ? (
                <img src={asset(activePlan.src)} onError={() => setImgErr(true)} alt={`${h.config} ${activePlan.label || ""} floor plan — ${p.name}`} className="max-h-[78vh] max-w-full rounded-lg shadow-[0_30px_90px_rgba(0,0,0,0.5)]" draggable={false} />
              ) : (
                <div className="w-[min(42rem,88vw)] overflow-hidden rounded-lg bg-[#FBF8F2] shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
                  <FloorPlanSchematic beds={beds} balcony={h.balconySqft != null} />
                </div>
              )}
            </ZoomStage>
          </div>
        </div>
      )}
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
