import { deliveryOutlook, type ProjectIntel } from "@/lib/projects";
import RenderVsReality from "./RenderVsReality";

/* Chapter II · Pillar III — Construction & Sales. Reads the QPR: build % vs
   the RERA-due %, absorption, and a delivery forecast (predicted vs RERA,
   delay probability) — in the warm report language, not the old dark card. */

const basePath = "/Truth-Estate";

/* RERA QPRs report against quarter-end dates — "Q1 2026" → "31 Mar 2026". */
function qprEndDate(qpr: string): string {
  const m = qpr.match(/Q([1-4])\D*(\d{4})/i);
  if (!m) return qpr;
  const ends: Record<string, string> = { "1": "31 Mar", "2": "30 Jun", "3": "30 Sep", "4": "31 Dec" };
  return `${ends[m[1]]} ${m[2]}`;
}

export default function ReportConstruction({ p }: { p: ProjectIntel }) {
  const o = deliveryOutlook(p);
  if (!o) return null;
  // Launch shown as month + year — prefer the precise price-history launch date
  // where we track it, falling back to the coarser launch field.
  const launchLabel = p.ops?.price?.launchDate ?? p.ops?.launch ?? "—";
  // Absorption in absolute terms: units sold of the total launched.
  const totalUnits = p.ops?.units;
  const unitsSold = totalUnits != null ? Math.round((totalUnits * o.absorptionPct) / 100) : null;
  const render = p.ops?.media?.render;
  const heroImg = p.ops?.media?.heroImage;
  const site = p.ops?.media?.sitePhotos?.[0];
  const siteAsOf = site ? `◉ ${site.asOf} · on site` : `▦ schematic · ${o.actualPct}% built`;
  const soldOut = o.absorptionPct >= 98;
  const assess =
    o.aheadOfPlan > 0 && o.absorptionPct >= 95 ? "Ahead of schedule, and already sold out."
    : o.aheadOfPlan > 0 ? "Tracking ahead of the RERA plan."
    : o.aheadOfPlan < 0 ? "Running behind the RERA plan — watch closely."
    : "Building on plan.";
  const deg = Math.round((o.delayChance / 100) * 360);

  return (
    <div className="mt-8">
      <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar III · Construction &amp; Sales</p>
      <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">Is it actually getting built — and sold?</h3>
      <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">Build progress against the RERA filings — and the Expected OC date.</p>

      <div className="mt-6 rounded-2xl border-l-2 border-[#1e6b45]/40 bg-white/50 p-6 md:p-7">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/40">Analyst assessment</p>
        <p className="mt-2.5 font-serif text-[1.2rem] leading-[1.4] md:text-[1.35rem]">{assess}</p>
        <p className="mt-3 text-[0.72rem] font-light italic text-[#1a1a1a]/40">Source: latest Quarterly Progress Report filed with HRERA · {o.qpr}.</p>
      </div>

      {/* Render vs reality — one frame, split by a draggable line: the
          brochure's promise on the left, the site as it stands on the right.
          Real brochure art drops into the left slot as coverage lands; until
          then the brand-safe render stand-in holds it. Projects without a
          site image keep the two-card layout. */}
      <div className="mt-5">
        <p className="font-serif text-[1.25rem] font-medium md:text-[1.4rem]">What they sold. What&apos;s standing.</p>
        <p className="mt-1.5 max-w-xl text-[0.82rem] font-light leading-[1.55] text-[#1a1a1a]/50">
          {heroImg
            ? <>Hold the line and pull it either way — the brochure&apos;s promise against the plot as it stands.</>
            : <>The marketing render beside the tower as it actually stood on our last field visit — so you buy the building, not the brochure.</>}
        </p>
        {heroImg ? (
          <div className="mt-4">
            <RenderVsReality
              left={render ? <img src={`${basePath}/${render}`} alt={`${p.name} — developer render`} className="h-full w-full object-cover" draggable={false} /> : <RenderStandin />}
              right={<img src={`${basePath}/${heroImg}`} alt={`${p.name} — site aerial`} className="h-full w-full object-cover" draggable={false} />}
              leftChip="The brochure · artist's impression"
              rightChip={`The site · ${site?.asOf ?? p.ops?.reviewed ?? "satellite"}`}
            />
          </div>
        ) : (
        <div className="relative mt-4 grid gap-4 md:grid-cols-2">
          <span className="absolute left-1/2 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#1a1a1a]/10 bg-[#F5F0E8] font-mono text-[0.68rem] uppercase tracking-[0.08em] text-[#1a1a1a]/45 shadow-md md:grid">vs</span>
          {/* the render */}
          <figure className="overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/70">
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/8 px-5 py-2.5">
              <span className="flex items-center gap-2.5 text-[0.8rem] font-semibold"><span className="grid h-5 w-5 place-items-center rounded-md bg-[#9a7a2e]/[0.12] text-[0.66rem] text-[#9a7a2e]">❧</span>The render</span>
              <span className="text-[0.58rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/35">Marketing image</span>
            </div>
            <div className="aspect-[4/3] w-full">
              {render ? <img src={`${basePath}/${render}`} alt={`${p.name} developer render`} className="h-full w-full object-cover" /> : <RenderStandin />}
            </div>
            <figcaption className="px-5 py-2.5 text-[0.7rem] font-light text-[#1a1a1a]/50">Developer render{p.ops?.launch ? ` · ${p.ops.launch} launch imagery` : ""}. Artist&apos;s impression.</figcaption>
          </figure>
          {/* the site */}
          <figure className="overflow-hidden rounded-2xl border border-[#1e6b45]/25 bg-white/70">
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/8 px-5 py-2.5">
              <span className="flex items-center gap-2.5 text-[0.8rem] font-semibold"><span className="grid h-5 w-5 place-items-center rounded-md bg-[#1e6b45]/[0.1] text-[0.66rem] text-[#1e6b45]">◉</span>The site</span>
              <span className="text-[0.58rem] font-medium uppercase tracking-[0.1em] text-[#1e6b45]/70">Our field visit</span>
            </div>
            <div className="relative aspect-[4/3] w-full">
              {site ? <img src={`${basePath}/${site.src}`} alt={`${p.name} site, ${site.asOf}`} className="h-full w-full object-cover" /> : <SiteStandin pct={o.actualPct} />}
              <span className="absolute bottom-2.5 right-2.5 rounded bg-[#141110]/75 px-2 py-1 font-mono text-[0.6rem] tracking-[0.06em] text-white">{siteAsOf}</span>
            </div>
            <figcaption className="px-5 py-2.5 text-[0.7rem] font-light text-[#1a1a1a]/50">{site?.note ?? `Structure at ${o.actualPct}% — verified against QPR ${o.qpr}.`}</figcaption>
          </figure>
        </div>
        )}
      </div>

      {/* Construction → delivery — one timeline. Progress is read from the RERA
          Quarterly Progress Report (quarterly, not "today"): what's actually
          built vs the % RERA required by the quarter-end. Forecast folded in. */}
      <div className="mt-5 rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Construction &rarr; delivery</span>
        </div>
        <p className="mt-1.5 text-[0.68rem] font-light leading-[1.5] text-[#1a1a1a]/45">From the latest RERA Quarterly Progress Report ({o.qpr}) — actual build against the % RERA required by the quarter-end.</p>

        {/* the progress timeline */}
        <div className="mt-[4.5rem] px-1">
          <div className="relative">
            {/* actual-built marker above the track (as per QPR) */}
            <div className="absolute bottom-full mb-2.5 -translate-x-1/2 whitespace-nowrap text-center" style={{ left: `${Math.min(90, Math.max(10, o.actualPct))}%` }}>
              <span className="rounded-md bg-[#1e6b45] px-2 py-0.5 text-[0.68rem] font-bold text-white">{o.actualPct}% built</span>
              <span className="mt-1 block text-[0.52rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">actual</span>
            </div>
            {/* track */}
            <div className="relative h-2.5 rounded-full bg-[#ece5d7]">
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${o.actualPct}%`, background: "linear-gradient(90deg,#1e6b45,#238c55)" }} />
              {/* RERA-due tick — the % RERA required by the QPR quarter-end */}
              <span aria-hidden className="absolute -bottom-2 -top-2 w-[2px] rounded bg-[#1a1a1a]/55" style={{ left: `calc(${o.expectedPct}% - 1px)` }} />
              {/* milestone dots: launch · QPR read · handover */}
              <span aria-hidden className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-[#1e6b45] shadow-sm" />
              <span aria-hidden className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1e6b45] shadow" style={{ left: `${o.actualPct}%` }} />
              <span aria-hidden className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-[#9a7a2e] shadow-sm" />
            </div>
            {/* milestone labels below */}
            <div className="relative mt-3.5 h-8 text-[0.63rem] leading-tight">
              <div className="absolute left-0 top-0 text-[#1a1a1a]/45"><span className="block font-semibold text-[#1a1a1a]/75">Launch</span>{launchLabel}</div>
              <div className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-center text-[#1a1a1a]/45" style={{ left: `${Math.min(78, Math.max(22, o.expectedPct))}%` }}><span className="block font-semibold text-[#1a1a1a]/75">{o.expectedPct}% RERA-due</span>by {qprEndDate(o.qpr)}</div>
              <div className="absolute right-0 top-0 text-right text-[#1a1a1a]/45"><span className="block font-semibold text-[#1a1a1a]/75">Expected OC</span>{o.reraDate} &middot; RERA</div>
            </div>
          </div>
        </div>

        {/* the forecast, merged — same journey, so same div */}
        <div className="mt-11 flex flex-wrap items-end gap-x-7 gap-y-4 border-t border-[#1a1a1a]/8 pt-5">
          <div className="min-w-0">
            <p className="text-[0.56rem] font-bold uppercase tracking-[0.12em] text-[#9a7a2e]">Truth Estate forecast</p>
            <p className="mt-1.5 font-serif text-[1.9rem] font-medium leading-none text-[#1a1a1a]">{o.predictedDate}</p>
            <p className="mt-1.5 text-[0.72rem] font-light text-[#1a1a1a]/45">our predicted OC &mdash; from build pace + {p.developer}&rsquo;s record</p>
          </div>
          {o.ahead !== 0 && (
            <div className="rounded-lg border border-[#1a1a1a]/10 bg-white/70 px-3.5 py-2">
              <p className="text-[0.54rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">vs RERA promise</p>
              <p className={`mt-0.5 font-mono text-[0.98rem] font-semibold ${o.ahead > 0 ? "text-[#1e6b45]" : "text-[#9a4130]"}`}>{Math.abs(o.ahead)} mo {o.ahead > 0 ? "early" : "late"}</p>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <div className="relative h-[50px] w-[50px]">
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#9a7a2e 0 ${deg}deg, rgba(26,26,26,0.08) ${deg}deg 360deg)` }} />
              <div className="absolute inset-[5px] rounded-full bg-white" />
              <div className="absolute inset-0 grid place-items-center font-mono text-[0.82rem] font-bold text-[#8a6a1e]">{o.delayChance}%</div>
            </div>
            <p className="text-[0.72rem] font-light leading-tight text-[#1a1a1a]/55">chance of<br /><b className="font-medium text-[#1a1a1a]/75">any</b> delay</p>
          </div>
        </div>
      </div>

      {/* Sales absorption — a distinct signal (demand, not delivery). */}
      <div className="mt-4 rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6">
        <div className="flex items-center justify-between">
          <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Sales absorption</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em] ${o.absorptionPct >= 90 ? "border-[#238c55]/25 bg-[#238c55]/[0.1] text-[#1c7a4c]" : "border-[#9a7a2e]/30 bg-[#9a7a2e]/[0.12] text-[#8a6a1e]"}`}>
            <span className={`h-[6px] w-[6px] rounded-full ${o.absorptionPct >= 90 ? "bg-[#238c55]" : "bg-[#9a7a2e]"}`} />{o.absorptionPct >= 90 ? "High demand" : "Steady"}
          </span>
        </div>
        <p className="mt-4 font-mono text-[2.4rem] font-medium leading-none text-[#1e6b45]">
          {o.absorptionPct}<span className="text-[0.95rem] text-[#1a1a1a]/35">%</span>
          <span className="ml-2.5 font-sans text-[0.72rem] font-light tracking-normal text-[#1a1a1a]/45">of launched units sold</span>
        </p>
        <div className="mt-3.5 h-3 overflow-hidden rounded-full bg-[#e9e2d3]"><div className="h-full rounded-full" style={{ width: `${o.absorptionPct}%`, background: "linear-gradient(90deg,#1e6b45,#238c55)" }} /></div>
        {totalUnits != null && (
          <div className="mt-3 flex items-stretch gap-3">
            <div className="flex-1 rounded-xl border border-[#1a1a1a]/8 bg-white/60 px-4 py-2.5">
              <p className="text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/40">Units sold</p>
              <p className="mt-0.5 font-mono text-[1.15rem] font-semibold leading-none text-[#1e6b45]">{unitsSold!.toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 rounded-xl border border-[#1a1a1a]/8 bg-white/60 px-4 py-2.5">
              <p className="text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/40">Total units</p>
              <p className="mt-0.5 font-mono text-[1.15rem] font-semibold leading-none text-[#1a1a1a]/75">{totalUnits.toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}
        {/* the read, in the same voice as "The delivery read" above */}
        <div className="mt-4 rounded-r-xl border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.05] px-5 py-3.5">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#1e6b45]">&#9670; The demand read</p>
          <p className="mt-1.5 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70">
            {soldOut ? <>A full sell-out mid-construction means the developer isn&apos;t relying on future sales to fund the build &mdash; <b className="font-medium text-[#1a1a1a]">a quiet but real de-risking signal.</b></> : "Steady absorption at the current velocity."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Brand-safe stand-ins until real imagery lands — a glossy render vs a grey,
   under-construction site (concrete floors, safety netting, a tower crane). */
function RenderStandin() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Indicative render">
      <defs>
        <linearGradient id="rc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a7c6dd" /><stop offset=".55" stopColor="#d7dccb" /><stop offset="1" stopColor="#efe3cd" /></linearGradient>
        <linearGradient id="rc-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7ba0ba" /><stop offset="1" stopColor="#cfe0e9" /></linearGradient>
        <pattern id="rc-grid" width="10" height="13" patternUnits="userSpaceOnUse"><path d="M0 0H10M0 0V13" stroke="#5f8299" strokeWidth=".5" opacity=".35" /></pattern>
      </defs>
      <rect width="400" height="300" fill="url(#rc-sky)" />
      <circle cx="312" cy="70" r="88" fill="#fff6e7" opacity=".55" />
      <g><rect x="132" y="60" width="66" height="176" fill="url(#rc-glass)" /><rect x="132" y="60" width="66" height="176" fill="url(#rc-grid)" /><rect x="132" y="60" width="66" height="176" fill="none" stroke="#6c8fa7" strokeWidth="1" opacity=".5" /></g>
      <g><rect x="210" y="98" width="58" height="138" fill="url(#rc-glass)" /><rect x="210" y="98" width="58" height="138" fill="url(#rc-grid)" /><rect x="210" y="98" width="58" height="138" fill="none" stroke="#6c8fa7" strokeWidth="1" opacity=".5" /></g>
      <rect x="112" y="224" width="180" height="24" fill="#e7dfce" />
      <rect x="0" y="244" width="400" height="56" fill="#ccd2bb" />
      <g fill="#a6ba86"><circle cx="86" cy="238" r="16" /><circle cx="316" cy="240" r="18" /></g>
    </svg>
  );
}
function SiteStandin({ pct }: { pct: number }) {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Indicative construction site schematic">
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c4c2b7" /><stop offset="1" stopColor="#d9d3c5" /></linearGradient>
        <pattern id="sc-slab" width="66" height="14" patternUnits="userSpaceOnUse"><path d="M0 0H66" stroke="#8f897b" strokeWidth="1.4" /></pattern>
        <pattern id="sc-net" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0H8M0 0V8" stroke="#6f7d5c" strokeWidth=".7" opacity=".5" /></pattern>
      </defs>
      <rect width="400" height="300" fill="url(#sc-sky)" />
      {/* tower A — clad lower, raw upper (build % marks the clad line) */}
      <rect x="132" y="70" width="66" height="166" fill="#b6b1a4" />
      <rect x="132" y="70" width="66" height="166" fill="url(#sc-slab)" />
      <rect x="132" y="70" width="66" height={`${Math.max(20, (100 - pct) * 1.4)}`} fill="#9fb184" opacity=".38" />
      <rect x="132" y="70" width="66" height={`${Math.max(20, (100 - pct) * 1.4)}`} fill="url(#sc-net)" />
      {/* tower B */}
      <rect x="210" y="112" width="58" height="124" fill="#aca69a" /><rect x="210" y="112" width="58" height="124" fill="url(#sc-slab)" />
      {/* crane */}
      <g stroke="#c69a3e" strokeWidth="3" fill="none" opacity=".92"><line x1="286" y1="44" x2="286" y2="236" /><line x1="196" y1="56" x2="344" y2="56" /><line x1="286" y1="44" x2="196" y2="56" /><line x1="286" y1="44" x2="344" y2="56" /><line x1="232" y1="56" x2="232" y2="104" /></g>
      {/* hoarding + dust */}
      <rect x="0" y="236" width="400" height="64" fill="#c3bba9" /><rect x="0" y="232" width="400" height="10" fill="#b3a98f" />
      <ellipse cx="200" cy="240" rx="180" ry="14" fill="#cfc7b4" opacity=".55" />
    </svg>
  );
}
