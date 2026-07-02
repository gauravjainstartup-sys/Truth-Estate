import { deliveryOutlook, type ProjectIntel } from "@/lib/projects";

/* Chapter II · Pillar II — Construction & Sales. Reads the QPR: build % vs
   the RERA-due %, absorption, and a delivery forecast (predicted vs RERA,
   delay probability) — in the warm report language, not the old dark card. */

const basePath = "/Truth-Estate";

export default function ReportConstruction({ p }: { p: ProjectIntel }) {
  const o = deliveryOutlook(p);
  if (!o) return null;
  const render = p.ops?.media?.render;
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
      <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar II · Construction &amp; Sales</p>
      <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">Is it actually getting built — and sold?</h3>
      <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">We track construction against the exact percentages the builder filed with RERA, quarter by quarter — then forecast the real handover, not the marketing one.</p>

      <div className="mt-6 rounded-2xl border-l-2 border-[#1e6b45]/40 bg-white/50 p-6 md:p-7">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/40">Analyst assessment</p>
        <p className="mt-2.5 font-serif text-[1.2rem] leading-[1.4] md:text-[1.35rem]">{assess}</p>
        <p className="mt-3 text-[0.72rem] font-light italic text-[#1a1a1a]/40">Source: latest Quarterly Progress Report filed with HRERA · {o.qpr}.</p>
      </div>

      {/* Render vs reality — the developer's render beside our latest dated
          field photo. Real images drop into these slots; until then we render
          brand-safe schematic stand-ins. */}
      <div className="mt-5">
        <p className="font-serif text-[1.25rem] font-medium md:text-[1.4rem]">What they sold. What&apos;s standing.</p>
        <p className="mt-1.5 max-w-xl text-[0.82rem] font-light leading-[1.55] text-[#1a1a1a]/50">The marketing render beside the tower as it actually stood on our last field visit — so you buy the building, not the brochure.</p>
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
        {/* one honest read tying photo to forecast — not the old data dump */}
        <div className="mt-4 rounded-r-xl border-l-2 border-[#9a7a2e] bg-[#9a7a2e]/[0.06] px-5 py-3.5">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#9a7a2e]">◆ The delivery read</p>
          <p className="mt-1.5 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70">
            Structure is <b className="font-medium text-[#1a1a1a]">{o.actualPct}% up</b> against {o.expectedPct}% due — {o.aheadOfPlan >= 0 ? "ahead of" : "behind"} the RERA plan. Our field read tracks to a <b className="font-medium text-[#1a1a1a]">{o.predictedDate}</b> handover{o.ahead !== 0 ? `, ${Math.abs(o.ahead)} months ${o.ahead > 0 ? "before" : "after"} the RERA date` : ""}.
            {!site && <span className="text-[#1a1a1a]/45"> Dated photographs from our next visit drop into the slot above.</span>}
          </p>
        </div>
      </div>

      {/* Construction vs RERA plan */}
      <div className="mt-5 rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6 md:p-7">
        <div className="flex items-center justify-between">
          <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Construction vs the RERA plan</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em] ${o.aheadOfPlan >= 0 ? "border-[#238c55]/25 bg-[#238c55]/[0.1] text-[#1c7a4c]" : "border-[#b0503e]/30 bg-[#b0503e]/[0.08] text-[#9a4130]"}`}>
            <span className={`h-[6px] w-[6px] rounded-full ${o.aheadOfPlan >= 0 ? "bg-[#238c55]" : "bg-[#b0503e]"}`} />{o.aheadOfPlan >= 0 ? "Ahead of schedule" : "Behind schedule"}
          </span>
        </div>
        <div className="relative mt-6 h-9 overflow-hidden rounded-lg bg-[#f0ebe1]">
          <div className="absolute inset-y-0 left-0 rounded-r-sm" style={{ width: `${o.expectedPct}%`, background: "repeating-linear-gradient(45deg,#e6ddc9,#e6ddc9 6px,#efe8d8 6px,#efe8d8 12px)" }} />
          <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${o.actualPct}%`, background: "linear-gradient(90deg,#1e6b45,#238c55)" }} />
          <span className="absolute top-1/2 -translate-y-1/2 pr-3 text-[0.78rem] font-semibold text-white" style={{ left: 0, width: `${o.actualPct}%`, textAlign: "right" }}>{o.actualPct}% built</span>
        </div>
        <div className="relative mt-2 h-8 text-[0.68rem]">
          <div className="absolute -translate-x-1/2 text-center" style={{ left: `${o.expectedPct}%` }}>
            <div className="font-semibold text-[#1a1a1a]/70">{o.expectedPct}%</div>
            <div className="text-[#1a1a1a]/40">RERA-due today</div>
          </div>
        </div>
        <span className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.78rem] font-semibold ${o.aheadOfPlan >= 0 ? "border-[#1e6b45]/20 bg-[#1e6b45]/[0.08] text-[#1e6b45]" : "border-[#b0503e]/25 bg-[#b0503e]/[0.06] text-[#9a4130]"}`}>
          {o.aheadOfPlan >= 0 ? "▲" : "▼"} {o.aheadOfPlan >= 0 ? "+" : ""}{o.aheadOfPlan} points {o.aheadOfPlan >= 0 ? "ahead" : "behind"}{o.ahead !== 0 && ` · ~${Math.abs(o.ahead)} months ${o.ahead > 0 ? "banked" : "at risk"}`}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Absorption */}
        <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6">
          <div className="flex items-center justify-between">
            <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Sales absorption</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em] ${o.absorptionPct >= 90 ? "border-[#238c55]/25 bg-[#238c55]/[0.1] text-[#1c7a4c]" : "border-[#9a7a2e]/30 bg-[#9a7a2e]/[0.12] text-[#8a6a1e]"}`}>
              <span className={`h-[6px] w-[6px] rounded-full ${o.absorptionPct >= 90 ? "bg-[#238c55]" : "bg-[#9a7a2e]"}`} />{o.absorptionPct >= 90 ? "High demand" : "Steady"}
            </span>
          </div>
          <p className="mt-4 font-mono text-[2.4rem] font-medium leading-none text-[#1e6b45]">{o.absorptionPct}<span className="text-[0.95rem] text-[#1a1a1a]/35">%</span></p>
          <div className="mt-3.5 h-3 overflow-hidden rounded-full bg-[#e9e2d3]"><div className="h-full rounded-full" style={{ width: `${o.absorptionPct}%`, background: "linear-gradient(90deg,#1e6b45,#238c55)" }} /></div>
          <p className="mt-3.5 text-[0.8rem] font-light leading-[1.55] text-[#1a1a1a]/55">
            {soldOut ? <>A full sell-out mid-construction means the developer isn&apos;t relying on future sales to fund the build — <b className="font-medium text-[#1a1a1a]/75">a quiet but real de-risking signal.</b></> : "Steady absorption at the current velocity."}
          </p>
        </div>
        {/* Forecast */}
        <div className="rounded-2xl border border-[#9a7a2e]/28 bg-gradient-to-br from-[#FBF8F2] to-[#f3ecdd] p-6">
          <div className="flex items-center justify-between">
            <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Truth Estate delivery forecast</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9a7a2e]/30 bg-[#9a7a2e]/[0.12] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-[#8a6a1e]"><span className="h-[6px] w-[6px] rounded-full bg-[#9a7a2e]" />{o.confidence}</span>
          </div>
          <p className="mt-3 font-serif text-[2rem] font-medium leading-none">{o.predictedDate}</p>
          <p className="mt-1.5 text-[0.74rem] font-light text-[#1a1a1a]/45">our predicted handover — from build pace + this developer&apos;s history</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-[#1a1a1a]/10 bg-white/70 px-3.5 py-2">
              <p className="text-[0.56rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">RERA promise</p>
              <p className="mt-0.5 font-mono text-[0.95rem] font-semibold">{o.reraDate}</p>
            </div>
            {o.ahead !== 0 && (
              <div className="rounded-lg border border-[#1a1a1a]/10 bg-white/70 px-3.5 py-2">
                <p className="text-[0.56rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">vs RERA</p>
                <p className={`mt-0.5 font-mono text-[0.95rem] font-semibold ${o.ahead > 0 ? "text-[#1e6b45]" : "text-[#9a4130]"}`}>{Math.abs(o.ahead)} mo {o.ahead > 0 ? "early" : "late"}</p>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <div className="relative h-[52px] w-[52px]">
                <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#9a7a2e 0 ${deg}deg, rgba(26,26,26,0.08) ${deg}deg 360deg)` }} />
                <div className="absolute inset-[5px] rounded-full bg-[#FBF8F2]" />
                <div className="absolute inset-0 grid place-items-center font-mono text-[0.86rem] font-bold text-[#8a6a1e]">{o.delayChance}%</div>
              </div>
              <p className="text-[0.72rem] font-light leading-tight text-[#1a1a1a]/55">chance of<br /><b className="font-medium text-[#1a1a1a]/75">any</b> delay</p>
            </div>
          </div>
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
