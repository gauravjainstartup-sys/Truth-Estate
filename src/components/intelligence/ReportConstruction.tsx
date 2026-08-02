import { deliveryOutlook, lastUpdatedOn, type ProjectIntel } from "@/lib/projects";
import RenderVsReality from "./RenderVsReality";
import { basePath } from "@/lib/site";

/* Chapter II · Pillar II — Construction & Sales. Reads the QPR: build % vs
   the RERA-due %, absorption, and a delivery forecast (predicted vs RERA,
   delay probability) — in the warm report language, not the old dark card. */


/* a proof link: an absolute R2/CDN URL as-is, else same-origin under basePath. */
function pdfHref(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `${basePath}/${u.replace(/^\//, "")}`;
}

/* The QPR vintage behind the construction read — "Month Year", pulled from the
   QPR's own date so the bracket tracks the data itself, not the row's refresh
   date. Falls back to the quarter label, then to nothing. Keeps the header
   honest: the "Updated" date is when the DB last changed, the bracket is how
   old the underlying filing is. */
const QPR_MONTHS: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April", may: "May", jun: "June",
  jul: "July", aug: "August", sep: "September", oct: "October", nov: "November", dec: "December",
};
function qprVintage(o: { lastUpdated?: string; qpr?: string }): string | null {
  const m = o.lastUpdated?.match(/([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  if (m) {
    const full = QPR_MONTHS[m[1].toLowerCase()];
    if (full) return `${full} ${m[2]}`;
  }
  return o.qpr ?? null;
}

export default function ReportConstruction({ p }: { p: ProjectIntel }) {
  const o = deliveryOutlook(p);
  if (!o) return null;
  const qprBasis = qprVintage(o);
  // A delivered project (OC/CC on record) reports actuals, not a forecast:
  // the predicted-delivery + delay-chance read is moot and, worse, contradicts
  // the certificate. Switch it for the delivered fact everywhere below.
  const delivered = p.ops?.lifecycle === "delivered";
  const ocDate = p.ops?.ocDate;
  // Absorption in absolute terms: units sold of the total launched.
  const totalUnits = p.ops?.units;
  const unitsSold = totalUnits != null ? Math.round((totalUnits * o.absorptionPct) / 100) : null;
  const render = p.ops?.media?.render;
  const heroImg = p.ops?.media?.heroImage;
  const site = p.ops?.media?.sitePhotos?.[0];
  const builtPct = Math.round(o.actualPct); // whole-number, for the render-vs-reality captions
  const siteAsOf = site ? `◉ ${site.asOf} · on site` : `▦ schematic · ${builtPct}% built`;
  const assess =
    delivered ? `Delivered — the project is complete and handed over${ocDate ? ` (OC ${ocDate})` : ""}.`
    : o.aheadOfPlan > 0 && o.absorptionPct >= 95 ? "Ahead of schedule, and already sold out."
    : o.aheadOfPlan > 0 ? "Tracking ahead of the RERA plan."
    : o.aheadOfPlan < 0 ? "Running behind the RERA plan — watch closely."
    : "Building on plan.";

  // ── Construction & sales cards + delivery banner ──
  const absorption = o.absorptionPct;
  const paceMo = o.paceMonths;
  const paceAhead = paceMo != null ? paceMo >= 0 : o.aheadOfPlan >= 0;
  const paceHeadline =
    paceMo == null ? (o.aheadOfPlan >= 0 ? "Ahead of Plan" : "Behind Plan")
    : paceMo === 0 ? "On Schedule"
    : `${Math.abs(paceMo)} Month${Math.abs(paceMo) === 1 ? "" : "s"} ${paceMo > 0 ? "Ahead" : "Behind"}`;
  const predicted = o.predictedDateFull ?? o.predictedDate;
  const rera = o.reraDateFull ?? o.reraDate;
  // Delivered: the OC date measured against the RERA promise (+ early / − late).
  const aheadM = p.ops?.deliveredAheadMonths;
  const deliveredVsRera = aheadM == null ? null : (() => {
    const n = Math.round(Math.abs(aheadM));
    const unit = `${n} month${n === 1 ? "" : "s"}`;
    if (aheadM >= 0.5) return `${unit} ahead of the RERA promise${rera ? ` (${rera})` : ""}`;
    if (aheadM <= -0.5) return `${unit} after the RERA promise${rera ? ` (${rera})` : ""}`;
    return `on the RERA promise${rera ? ` (${rera})` : ""}`;
  })();
  const aheadMo = o.aheadMonths ?? o.ahead; // + = forecast beats the RERA promise
  const aheadPos = aheadMo > 0;
  const aheadTxt =
    aheadMo === 0 ? "On the RERA date"
    : `${Math.abs(aheadMo)} Month${Math.abs(aheadMo) === 1 ? "" : "s"} ${aheadMo > 0 ? "Ahead of RERA" : "Behind RERA"}`;
  const clampPct = (v: number) => Math.max(0, Math.min(100, v));

  return (
    <div className="mt-8">
      <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar II · Construction &amp; Sales</p>
      <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">Is it actually getting built — and sold?</h3>
      <p className="mt-2 text-[0.72rem] font-light italic text-[#1a1a1a]/40">Updated {lastUpdatedOn(p)}{qprBasis ? ` (based on ${qprBasis} QPR)` : ""}</p>
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
              left={render ? <img loading="lazy" src={`${basePath}/${render}`} alt={`${p.name} — developer render`} className="h-full w-full object-cover" draggable={false} /> : <RenderStandin />}
              right={<img loading="lazy" src={`${basePath}/${heroImg}`} alt={`${p.name} — site aerial`} className="h-full w-full object-cover" draggable={false} />}
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
              {site ? <img src={`${basePath}/${site.src}`} alt={`${p.name} site, ${site.asOf}`} className="h-full w-full object-cover" /> : <SiteStandin pct={builtPct} />}
              <span className="absolute bottom-2.5 right-2.5 rounded bg-[#141110]/75 px-2 py-1 font-mono text-[0.6rem] tracking-[0.06em] text-white">{siteAsOf}</span>
            </div>
            <figcaption className="px-5 py-2.5 text-[0.7rem] font-light text-[#1a1a1a]/50">{site?.note ?? `Structure at ${builtPct}% — verified against QPR ${o.qpr}.`}</figcaption>
          </figure>
        </div>
        )}
      </div>

      {/* Construction & sales — two comparison cards (actual vs expected build,
          and sales absorption), then a delivery-date verdict banner. No calendar
          cursor: build-% and the calendar are shown as separate, honest reads. */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* Sales momentum */}
        <div className="flex flex-col rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6">
          <div className="flex-1">
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]/45">Sales momentum</span>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/40">Units sold</p>
                <p className="mt-1.5 font-serif text-[1.85rem] font-medium leading-none">{unitsSold != null ? unitsSold.toLocaleString("en-IN") : "—"}{totalUnits != null && <span className="text-[1rem] font-normal text-[#1a1a1a]/40"> / {totalUnits.toLocaleString("en-IN")}</span>}</p>
              </div>
              <div className="text-right">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/40">Absorption</p>
                <p className="mt-1.5 font-serif text-[1.85rem] font-medium leading-none text-[#1e6b45]">{absorption}%</p>
              </div>
            </div>
            <div className="mt-4 h-[9px] overflow-hidden rounded-full bg-[#e9e2d3]"><div className="h-full rounded-full" style={{ width: `${clampPct(absorption)}%`, background: "linear-gradient(90deg,#1e6b45,#238c55)" }} /></div>
          </div>
          {o.salesProofPdf && (
            <a href={pdfHref(o.salesProofPdf)} target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center justify-center gap-2.5 rounded-xl border border-[#1a1a1a]/12 bg-white/70 px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-[#1a1a1a]/70 transition-colors hover:border-[#1e6b45]/40 hover:text-[#1e6b45]">
              <span className="grid h-[18px] w-[23px] shrink-0 place-items-center rounded border border-[#c9a96e]/50 bg-[#f6efe1] text-[0.5rem] font-bold text-[#9a7a2e]">PDF</span>
              View verified sales record <span className="text-[#1a1a1a]/35">↗</span>
            </a>
          )}
          <div className="-mx-6 mt-5 flex items-center gap-2.5 border-t border-[#1a1a1a]/8 px-6 pt-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e6b45" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9z" /></svg>
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#1e6b45]">{absorption >= 90 ? "High demand" : "Steady demand"}</span>
            <span title="Units sold as a share of total launched — from the developer MIS / RERA filing." className="ml-auto grid h-[15px] w-[15px] cursor-help place-items-center rounded-full border border-[#1a1a1a]/25 font-serif text-[0.55rem] italic text-[#1a1a1a]/40">i</span>
          </div>
        </div>

        {/* Construction progress vs plan */}
        <div className="flex flex-col rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6">
          <div className="flex-1">
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]/45">{delivered ? "Construction" : "Construction progress vs plan"}</span>
            {delivered ? (
              <>
                <p className="mt-4 font-serif text-[1.65rem] font-medium leading-tight text-[#1e6b45]">Complete</p>
                <div className="mt-5">
                  <div className="flex items-baseline justify-between"><span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/70">Build complete</span><span className="font-mono text-[0.9rem] font-bold text-[#1e6b45]">{o.actualPct}%</span></div>
                  <div className="mt-2 h-[9px] overflow-hidden rounded-full bg-[#e9e2d3]"><div className="h-full rounded-full" style={{ width: "100%", background: "linear-gradient(90deg,#1e6b45,#238c55)" }} /></div>
                </div>
              </>
            ) : (
              <>
                <p className={`mt-4 font-serif text-[1.65rem] font-medium leading-tight ${paceAhead ? "text-[#1e6b45]" : "text-[#9a4130]"}`}>{paceHeadline}</p>
                <div className="mt-5">
                  <div className="flex items-baseline justify-between"><span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/70">Actual progress</span><span className="font-mono text-[0.9rem] font-bold text-[#1e6b45]">{o.actualPct}%</span></div>
                  <div className="mt-2 h-[9px] overflow-hidden rounded-full bg-[#e9e2d3]"><div className="h-full rounded-full" style={{ width: `${clampPct(o.actualPct)}%`, background: "linear-gradient(90deg,#1e6b45,#238c55)" }} /></div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between"><span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/40">Expected progress</span><span className="font-mono text-[0.9rem] font-bold text-[#1a1a1a]/55">{o.expectedPct}%</span></div>
                  <div className="mt-2 h-[9px] overflow-hidden rounded-full bg-[#e9e2d3]"><div className="h-full rounded-full bg-[#c4bcab]" style={{ width: `${clampPct(o.expectedPct)}%` }} /></div>
                </div>
              </>
            )}
          </div>
          {o.constructionProofPdf && (
            <a href={pdfHref(o.constructionProofPdf)} target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center justify-center gap-2.5 rounded-xl border border-[#1a1a1a]/12 bg-white/70 px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-[#1a1a1a]/70 transition-colors hover:border-[#1e6b45]/40 hover:text-[#1e6b45]">
              <span className="grid h-[18px] w-[23px] shrink-0 place-items-center rounded border border-[#c9a96e]/50 bg-[#f6efe1] text-[0.5rem] font-bold text-[#9a7a2e]">PDF</span>
              View construction pace audit <span className="text-[#1a1a1a]/35">↗</span>
            </a>
          )}
          <div className="-mx-6 mt-5 flex items-center gap-2.5 border-t border-[#1a1a1a]/8 px-6 pt-4">
            {delivered ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e6b45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#1e6b45]">Complete{ocDate ? ` · handed over ${ocDate}` : ""}</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={paceAhead ? "#1e6b45" : "#9a4130"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 15c0-5.5 3-10.5 7-12.5 4 2 7 7 7 12.5l-3.6-1.6L12 20l-3.4-6.6z" /><circle cx="12" cy="8.5" r="1.5" /></svg>
                <span className={`text-[0.72rem] font-semibold uppercase tracking-[0.1em] ${paceAhead ? "text-[#1e6b45]" : "text-[#9a4130]"}`}>{paceAhead ? "Ahead of schedule" : "Behind schedule"}</span>
                <span title="Actual build against the % RERA required by the last quarterly progress report." className="ml-auto grid h-[15px] w-[15px] cursor-help place-items-center rounded-full border border-[#1a1a1a]/25 font-serif text-[0.55rem] italic text-[#1a1a1a]/40">i</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delivery verdict. Delivered → the OC on record (deep-green banner);
          otherwise the forecast (predicted date vs RERA promise + delay chance).
          Once the certificate exists, predicting a date the project already met
          is not just moot, it contradicts the OC — so we report, not forecast. */}
      {delivered ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#13341f] to-[#1e5133] px-7 py-7 text-[#eaf3ec]">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#eaf3ec]/60">Delivered · OC on record</p>
            <p className="mt-2 font-serif text-[2.3rem] font-medium leading-none md:text-[2.6rem]">{ocDate ?? "Delivered"}</p>
            {deliveredVsRera && <p className="mt-2.5 text-[0.82rem] text-[#eaf3ec]/70">Handed over {deliveredVsRera}.</p>}
          </div>
          {p.ops?.ocCertificateUrl && (
            <a href={p.ops.ocCertificateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 rounded-xl bg-[#eef3ee] px-4 py-3 text-[0.75rem] font-bold uppercase tracking-[0.06em] text-[#17402c] transition-transform hover:-translate-y-px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" /></svg>
              View OC Certificate <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#17130e] to-[#241d15] px-7 py-7 text-[#f3ecdd]">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#f3ecdd]/55">Predicted delivery date</p>
            <p className="mt-2 font-serif text-[2.3rem] font-medium leading-none md:text-[2.6rem]">{predicted}</p>
            <p className="mt-2.5 text-[0.82rem] text-[#f3ecdd]/60">RERA promise: {rera}</p>
            <span className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[0.75rem] font-bold ${aheadPos ? "border-[#7abe96]/40 bg-[#238c55]/[0.16] text-[#8fd6ac]" : "border-[#d99a86]/40 bg-[#9a4130]/25 text-[#e6a892]"}`}>
              <span aria-hidden>{aheadMo === 0 ? "◆" : aheadPos ? "▲" : "▼"}</span> {aheadTxt}
            </span>
          </div>
          <div className="flex items-center gap-3 sm:border-l sm:border-[#f3ecdd]/15 sm:pl-6">
            <span className="font-serif text-[2rem] font-semibold leading-none text-[#e9c675]">{o.delayChance}%</span>
            <span className="max-w-[84px] text-[0.66rem] font-semibold uppercase leading-[1.3] tracking-[0.1em] text-[#f3ecdd]/70">Chance of delay</span>
            <span title="Our pipeline's modelled probability the project slips past its RERA date." className="grid h-[15px] w-[15px] cursor-help place-items-center rounded-full border border-[#f3ecdd]/40 font-serif text-[0.55rem] italic text-[#f3ecdd]/60">i</span>
          </div>
        </div>
      )}
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
