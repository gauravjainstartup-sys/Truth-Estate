import { deliveryOutlook, type ProjectIntel } from "@/lib/projects";

/* Chapter II · Pillar II — Construction & Sales. Reads the QPR: build % vs
   the RERA-due %, absorption, and a delivery forecast (predicted vs RERA,
   delay probability) — in the warm report language, not the old dark card. */

export default function ReportConstruction({ p }: { p: ProjectIntel }) {
  const o = deliveryOutlook(p);
  if (!o) return null;
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

      {/* The brochure vs the ground — what was sold vs what's verified standing */}
      <div className="mt-5">
        <p className="font-serif text-[1.25rem] font-medium md:text-[1.4rem]">What they sold. What&apos;s standing.</p>
        <div className="relative mt-4 grid gap-4 md:grid-cols-2">
          <span className="absolute left-1/2 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#1a1a1a]/10 bg-[#F5F0E8] font-mono text-[0.68rem] uppercase tracking-[0.08em] text-[#1a1a1a]/45 shadow-md md:grid">vs</span>
          {/* the brochure */}
          <div className="overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/70">
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/8 px-5 py-3">
              <span className="flex items-center gap-2.5 text-[0.82rem] font-semibold"><span className="grid h-6 w-6 place-items-center rounded-md bg-[#9a7a2e]/[0.12] text-[0.72rem] text-[#9a7a2e]">❧</span>The brochure</span>
              <span className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/35">The promise</span>
            </div>
            <div className="px-5 py-4">
              <BRow k="Possession promised" v={o.reraDate} />
              {p.ops?.launch && <BRow k="Launched" v={`${p.ops.launch}${p.ops.price ? ` · at ₹${(p.ops.price.launchPsf / 1000).toFixed(1)}k/sqft` : ""}`} />}
              {p.ops?.openAreaPct != null && <BRow k="Sold on" v={`${p.ops.openAreaPct}% open area · ${p.configs.join(" & ")}`} />}
              <p className="mt-3.5 text-[0.72rem] font-light leading-[1.55] text-[#1a1a1a]/45">Every brochure looks immaculate. We file the promise — then hold the build against it, quarter by quarter.</p>
            </div>
          </div>
          {/* the ground */}
          <div className="overflow-hidden rounded-2xl border border-[#1e6b45]/25 bg-white/70">
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/8 px-5 py-3">
              <span className="flex items-center gap-2.5 text-[0.82rem] font-semibold"><span className="grid h-6 w-6 place-items-center rounded-md bg-[#1e6b45]/[0.1] text-[0.72rem] text-[#1e6b45]">◉</span>The ground</span>
              <span className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1e6b45]/70">Verified today</span>
            </div>
            <div className="px-5 py-4">
              <BRow k="Actually built" v={`${o.actualPct}% — vs ${o.expectedPct}% due`} strong />
              <BRow k="Units absorbed" v={`${o.absorptionPct}%`} />
              <BRow k="Our forecast handover" v={`${o.predictedDate}${o.ahead !== 0 ? ` · ${Math.abs(o.ahead)} mo ${o.ahead > 0 ? "early" : "late"}` : ""}`} strong />
              <div className="mt-3.5 flex items-center gap-3 rounded-lg border border-dashed border-[#1a1a1a]/15 bg-[#FBF8F2] px-3.5 py-2.5">
                <span className="text-[0.95rem] text-[#9a7a2e]" aria-hidden>◫</span>
                <p className="text-[0.7rem] font-light leading-[1.5] text-[#1a1a1a]/50">Dated site photographs from our field visits land here — verified against this QPR ({o.qpr}).</p>
              </div>
            </div>
          </div>
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

function BRow({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-dotted border-[#1a1a1a]/12 py-2 last:border-none">
      <span className="text-[0.76rem] font-light text-[#1a1a1a]/50">{k}</span>
      <span className={`ml-auto text-right font-mono text-[0.84rem] ${strong ? "font-semibold text-[#1a1a1a]" : "font-medium text-[#1a1a1a]/70"}`}>{v}</span>
    </div>
  );
}
