"use client";

import { useEffect, useState } from "react";
import type { ProjectIntel } from "@/lib/projects";
import ZoomStage from "./ZoomStage";
import { basePath } from "@/lib/site";

/* Chapter I — the homes. One plan on screen at a time: BHK tabs pick the
   configuration, a size slider moves through the variants offered under it.
   Each shows a 2D floor plan (licensed image where we have one), the areas as
   measured, the derived efficiency read and the ticket. When no plan image is
   on file the plan panel is omitted entirely — the measured areas take the
   width — rather than showing an empty placeholder. Dimensioned plan + 3D +
   sun/air/Vastu live inside Unit Intelligence — the gated layer. */

const asset = (s: string) => (/^(https?:\/\/|data:)/i.test(s) ? s : `${basePath}/${s}`);

/* A size "variant" is sometimes filed as an area TYPE ("Carpet Area", "Super
   Area", …) rather than a real variant name (a tower, a floor band). Those are
   redundant — the size shown is the super area, already broken down in the
   measured table — and worse, misleading (a chip reading "Carpet Area" above
   the super-area figure). Suppress them; keep genuine variant names. */
const AREA_TYPE = /\b(carpet|super|built[\s-]?up|saleable|covered|plot|land)\s*area\b/i;

export default function ReportHomes({ p }: { p: ProjectIntel }) {
  const homes = p.ops?.homes ?? [];

  // group by configuration (BHK), preserving first-seen order
  const order: string[] = [];
  const groups: Record<string, typeof homes> = {};
  for (const hh of homes) {
    if (!groups[hh.config]) { groups[hh.config] = []; order.push(hh.config); }
    groups[hh.config].push(hh);
  }
  // tab order — plain BHKs first (ascending by BHK count), then the penthouses /
  // duplex penthouses (also ascending). "Penthouse"/"Duplex" anywhere in the
  // config name drops it to the second group.
  const isPenthouse = (c: string) => /penthouse|duplex/i.test(c);
  const bhkCount = (c: string) => { const m = c.match(/\d+(?:\.\d+)?/); return m ? parseFloat(m[0]) : 99; };
  order.sort((a, b) => (isPenthouse(a) ? 1 : 0) - (isPenthouse(b) ? 1 : 0) || bhkCount(a) - bhkCount(b));

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
  // single `plan`, then to nothing
  const plans = h.plans ?? (h.plan ? [{ src: h.plan, label: "" }] : []);
  const activePlan = plans.length ? plans[Math.min(planIdx, plans.length - 1)] : null;
  // whether a real floor-plan image is available for this size right now
  const hasPlan = !!activePlan && !imgErr;

  // carpet is sometimes filed after the size is listed; when it's missing the
  // efficiency read can't be computed, so it (and Loading) show as NA
  const eff = h.carpetSqft != null && h.superSqft > 0 ? Math.round((h.carpetSqft / h.superSqft) * 100) : null;
  const loading = eff != null ? 100 - eff : null;
  /* THE UNIT'S COST — super area × THIS PROJECT'S filed rate.
   *
   * It used to multiply by p.psf.avg, and the comment here said that was
   * "the project's own filed avg psf". It is not: p.psf is built from
   * avg_cost_sqft, which the pipeline writes identically for every project
   * in a micro-market — eight distinct values across ninety-seven projects.
   * So every flat in Gurugram was being priced at its corridor's average
   * rate. Signature Global Tonino Lamborghini files ₹22,000/sq ft; SPR's
   * average is ₹15,524; its 2,050 sq ft 3 BHK therefore read ~₹3 Cr on a
   * page whose own hero said "from ₹4.5 Cr". Across the projects that could
   * be checked, 45 of 63 were out by more than a tenth, the worst by three
   * quarters — in both directions, so it was not even conservative.
   *
   * The low end of the filed range is used for every configuration rather
   * than interpolating up to the high end: the spread is the developer's
   * floor-rise and preferential-location scale, which we do not know how to
   * apportion, and understating is the safer error on a page that tells
   * people what to pay. Where no rate is filed (1 of 97) there is no
   * price — the corridor average is not a substitute for it. */
  const psfOwn = p.psfOwn?.low ?? null;
  const approxCr = (superSqft: number, ticketCr: number): string | null => {
    const cr = psfOwn ? (psfOwn * superSqft) / 1e7 : ticketCr > 0 ? ticketCr : null;
    if (cr == null) return null;
    /* Half a crore is the right granularity at ₹9 Cr and much too coarse at
       ₹1.3 Cr, where it rounds to ₹1.5 Cr and overstates by ₹23 lakh — real
       money to the buyer that price point belongs to. Tenths under ₹5 Cr,
       halves above, so the step is never a big share of the ticket. */
    const r = cr < 5 ? Math.round(cr * 10) / 10 : Math.round(cr * 2) / 2;
    return `~${Number.isInteger(r) ? r : r.toFixed(1)} Cr`;
  };
  const effRead =
    eff == null ? null
    : eff >= 72 ? { grade: "Strong", tone: "#1e6b45", note: "well above the segment norm — you keep more of what you pay for." }
    : eff >= 66 ? { grade: "Good", tone: "#238c55", note: "solid for a luxury high-rise, where lobbies and amenities eat carpet." }
    : { grade: "Watch", tone: "#9a7a2e", note: "on the lower side — negotiate on carpet, not super." };

  /* the areas + the efficiency read — composed differently depending on whether
     a plan sits beside them (stacked in the right column) or not (side by side,
     using the full width the absent plan frees up) */
  const measuredBlock = (
    <div>
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">The layout, measured</p>
      <dl className="mt-2.5">
        <Row k="Carpet area" v={h.carpetSqft != null ? `${h.carpetSqft.toLocaleString("en-IN")} sq ft` : "NA"} strong />
        <Row k="Super area" v={`${h.superSqft.toLocaleString("en-IN")} sq ft`} />
        <Row k="Balcony / deck" v={h.balconySqft != null ? `${h.balconySqft.toLocaleString("en-IN")} sq ft` : "NA"} />
        <Row k="Loading" v={loading != null ? `${loading}%` : "NA"} />
        <Row k="Carpet efficiency" v={eff != null ? `${eff}%` : "NA"} strong />
      </dl>
    </div>
  );
  const efficiencyBlock = effRead ? (
    <div className="rounded-r-xl border-l-2 px-5 py-3.5" style={{ borderColor: effRead.tone, background: `${effRead.tone}0f` }}>
      <p className="flex items-center gap-2.5 text-[0.6rem] font-bold uppercase tracking-[0.12em]" style={{ color: effRead.tone }}>
        ◆ The efficiency read
        <span className="rounded-full border px-2.5 py-[3px] text-[0.56rem] font-semibold uppercase tracking-[0.1em]" style={{ borderColor: `${effRead.tone}55`, color: effRead.tone }}>{effRead.grade}</span>
      </p>
      <p className="mt-1.5 text-[0.82rem] font-light leading-[1.6] text-[#1a1a1a]/70">
        <b className="font-semibold text-[#1a1a1a]">{eff}% usable</b> — {effRead.note}
      </p>
    </div>
  ) : null;

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
        {/* the configuration is named by the selected tab above; the card only
           repeats it when there is no tab row (a single-configuration project) */}
        {order.length === 1 && (
          <div className="border-b border-[#1a1a1a]/8 px-6 py-4">
            <p className="font-serif text-[1.3rem] font-medium">{h.config}</p>
          </div>
        )}

        {/* ── size picker (segmented cards) — the unit's ~price rides on each
           chip. The "Choose a size" label shows only when there's a real choice;
           a single size needs no heading (the section is already "The homes"). ── */}
        <div className="border-b border-[#1a1a1a]/8 bg-[#FBF8F2] px-6 py-4">
          {variants.length > 1 && (
            <p className="mb-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">Choose a size · {variants.length} options</p>
          )}
          <div className="flex flex-wrap gap-2">
            {variants.map((v, idx) => {
              const on = idx === i;
              const price = approxCr(v.superSqft, v.priceCr);
              const showVariant = !!v.variant && !AREA_TYPE.test(v.variant);
              return (
                <button key={idx} onClick={() => { setVIdx(idx); setPlanIdx(0); setImgErr(false); }}
                  className={`min-w-[112px] flex-1 rounded-xl border px-4 py-2.5 text-left transition-colors sm:flex-none ${on ? "border-[#9a7a2e] bg-[#9a7a2e]/[0.09] shadow-[0_0_0_1px_#9a7a2e]" : "border-[#1a1a1a]/12 bg-white hover:border-[#1a1a1a]/30"}`}>
                  {showVariant && (
                    <span className={`block text-[0.82rem] font-semibold ${on ? "text-[#7a5f1e]" : "text-[#1a1a1a]/75"}`}>{v.variant}</span>
                  )}
                  <span className={`block font-mono text-[0.68rem] text-[#1a1a1a]/50 ${showVariant ? "mt-0.5" : ""}`}>{v.superSqft.toLocaleString("en-IN")} sq ft</span>
                  {price && <span className={`mt-1 block font-mono text-[0.98rem] font-semibold ${on ? "text-[#7a5f1e]" : "text-[#1a1a1a]"}`}>{price}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* with a plan: [plan · measured]; the efficiency read stacks under the
           measured column. Without a plan: the plan panel is omitted and the
           measured areas + efficiency read share the freed width. */}
        <div className={`grid gap-5 p-6 ${hasPlan ? "lg:grid-cols-[1.2fr_1fr]" : effRead ? "lg:grid-cols-2" : ""}`}>
          {hasPlan && (
            <div className="lg:flex lg:flex-col">
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
                className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-[#1a1a1a]/10 bg-[#FBF8F2] text-left lg:min-h-0 lg:flex-1">
                <img loading="lazy" src={asset(activePlan!.src)} onError={() => setImgErr(true)} alt={`${h.config} ${activePlan!.label || h.variant || ""} floor plan — ${p.name}`} className="block w-full transition-transform duration-500 group-hover:scale-[1.02] lg:h-full lg:object-contain" />
                <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[#0b1f1a]/70 px-3 py-1.5 text-[0.66rem] font-medium text-white backdrop-blur-sm transition-colors group-hover:bg-[#0b1f1a]/90">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                  Enlarge
                </span>
              </button>
            </div>
          )}

          {/* ── the areas, measured (+ the efficiency read) ── */}
          {hasPlan ? (
            <div className="space-y-4">
              {measuredBlock}
              {efficiencyBlock}
            </div>
          ) : (
            <>
              {measuredBlock}
              {efficiencyBlock}
            </>
          )}
        </div>

        {/* the gated per-unit layer is pitched once — by the Tower & Unit
           Intelligence banner that directly follows this section */}
      </div>

      <p className="mt-4 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">
        Areas from RERA filings &amp; project documents; the price shown is indicative for this configuration, before floor-rise and preferential-location charges. Schematics show indicative zoning only — confirm the exact unit&apos;s dimensioned plan and areas in the Agreement to Sell before signing.
      </p>

      {/* floor-plan viewer — same chrome as the site-plan / document viewer:
         emerald full-screen backdrop, gold title, round ✕; Esc or tap-out closes */}
      {zoom && hasPlan && (
        <div className="fixed inset-0 z-[140] flex flex-col bg-[#0b1f1a]/90 backdrop-blur-sm" onClick={() => setZoom(false)} role="dialog" aria-modal="true" aria-label="Floor plan — enlarged">
          <div className="flex items-center justify-between gap-4 px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#B29668]">
              {h.config}{activePlan!.label ? ` · ${activePlan!.label}` : ""} — Floor plan
            </p>
            <button onClick={() => setZoom(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white">✕</button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <ZoomStage>
              <img src={asset(activePlan!.src)} onError={() => setImgErr(true)} alt={`${h.config} ${activePlan!.label || ""} floor plan — ${p.name}`} className="max-h-[78vh] max-w-full rounded-lg shadow-[0_30px_90px_rgba(0,0,0,0.5)]" draggable={false} />
            </ZoomStage>
          </div>
        </div>
      )}
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
