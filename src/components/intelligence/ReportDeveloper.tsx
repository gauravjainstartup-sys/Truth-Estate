import { developerOf, type ProjectIntel } from "@/lib/projects";
import { FIN_METRICS, type FinRating } from "@/lib/developers";

/* Chapter II · Pillar I — Developer DNA, in two parts:
   (a) Track record — the RERA delivery ledger, with "lapsed" flagged red
       above zero and a plain-English glossary; (b) Financial audit — the
       balance-sheet metrics as graded band cards. */

type Band = "exceptional" | "strong" | "moderate" | "watch";
const CHIP: Record<Band, string> = {
  exceptional: "text-[#155a3a] bg-[#1e6b45]/[0.12] border-[#1e6b45]/25",
  strong: "text-[#1c7a4c] bg-[#238c55]/[0.10] border-[#238c55]/25",
  moderate: "text-[#8a6a1e] bg-[#9a7a2e]/[0.12] border-[#9a7a2e]/30",
  watch: "text-[#9a4130] bg-[#b0503e]/[0.10] border-[#b0503e]/30",
};
const DOT: Record<Band, string> = { exceptional: "bg-[#1e6b45]", strong: "bg-[#238c55]", moderate: "bg-[#9a7a2e]", watch: "bg-[#b0503e]" };
const VAL: Record<Band, string> = { exceptional: "text-[#1e6b45]", strong: "text-[#238c55]", moderate: "text-[#9a7a2e]", watch: "text-[#b0503e]" };
const LABEL: Record<Band, string> = { exceptional: "Exceptional", strong: "Strong", moderate: "Moderate", watch: "Watch" };
const fromRating = (r: FinRating): Band => (r === "strong" ? "strong" : r === "moderate" ? "moderate" : "watch");

function BandChip({ band }: { band: Band }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em] ${CHIP[band]}`}>
      <span className={`h-[6px] w-[6px] rounded-full ${DOT[band]}`} />{LABEL[band]}
    </span>
  );
}

export default function ReportDeveloper({ p }: { p: ProjectIntel }) {
  const dev = developerOf(p);
  if (!dev) return null;
  const perf = dev.performance;
  const lapsed = perf.lapsed ?? Math.max(0, perf.launched - perf.delivered - perf.ongoing);
  const onTime = Math.round((perf.delivered * perf.onTimePct) / 100);
  const delayed = Math.max(0, perf.delivered - onTime);
  const relBand: Band = perf.onTimePct >= 90 ? "exceptional" : perf.onTimePct >= 80 ? "strong" : perf.onTimePct >= 70 ? "moderate" : "watch";
  const slipBand: Band = perf.avgDelayMonths <= 3 ? "strong" : perf.avgDelayMonths <= 7 ? "moderate" : "watch";

  return (
    <div className="mt-8">
      {/* ── Part A · track record ── */}
      <div>
        <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar I · Developer DNA — a</p>
        <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">Does {dev.name} actually deliver?</h3>
        <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">Every RERA-registered project this developer has launched — delivered, running, or lapsed. Straight from the registry, never the brochure.</p>
      </div>

      <div className="mt-6 rounded-2xl border-l-2 border-[#1e6b45]/40 bg-white/50 p-6 md:p-7">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/40">Analyst assessment</p>
        <p className="mt-2.5 font-serif text-[1.2rem] leading-[1.4] md:text-[1.35rem]">{dev.verdict}</p>
      </div>

      {/* stat row */}
      <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#1a1a1a]/8 bg-white/60 sm:grid-cols-3 lg:grid-cols-6">
        <Stat hero v={`${perf.onTimePct}%`} k="On-time record" />
        <Stat v={`${perf.launched}`} k="Launched" />
        <Stat v={`${perf.delivered}`} k="Delivered" />
        <Stat v={`${perf.ongoing}`} k="Ongoing" />
        <Stat v={`${lapsed}`} k="Lapsed" tone={lapsed > 0 ? "red" : "clean"} />
        <Stat v={`${perf.avgDelayMonths}`} unit="mo" k="Avg slippage" />
      </div>
      <p className="mt-3 text-[0.72rem] font-light leading-[1.5] text-[#1a1a1a]/40">
        <span className="text-[#9a4130]">&ldquo;Lapsed&rdquo;</span> turns alarming red the moment it&apos;s above zero — a lapsed RERA registration means buyers lost the regulator&apos;s safety net.{lapsed === 0 && " Here it's clean."}
      </p>

      {/* reliability + slippage */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-6">
          <div className="flex items-center justify-between"><span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Delivery reliability</span><BandChip band={relBand} /></div>
          <p className="mt-3 font-mono text-[1.9rem] font-medium leading-none">{perf.onTimePct}<span className="text-[0.9rem] text-[#1a1a1a]/35">%</span></p>
          <Meter band={relBand} />
          <div className="mt-3.5 flex gap-6">
            <Split n={perf.launched} l="Launched" /><Split n={onTime} l="On-time" tone="green" /><Split n={delayed} l="Delayed" tone="gold" />
          </div>
        </div>
        <div className="rounded-2xl border border-[#1a1a1a]/8 bg-white/50 p-6">
          <div className="flex items-center justify-between"><span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">Historical slippage</span><BandChip band={slipBand} /></div>
          <p className="mt-3 font-mono text-[1.9rem] font-medium leading-none">{perf.avgDelayMonths}<span className="ml-1 text-[0.9rem] text-[#1a1a1a]/35">months</span></p>
          <Meter band={slipBand} />
          <p className="mt-3.5 text-[0.8rem] font-light leading-[1.55] text-[#1a1a1a]/55">When {dev.name} is late, it&apos;s late by <b className="font-medium text-[#1a1a1a]/75">~{perf.avgDelayMonths} months on average</b> — price a buffer into your plans.</p>
        </div>
      </div>

      {/* definitions */}
      <details className="group mt-5 overflow-hidden rounded-2xl border border-[#1a1a1a]/8">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 bg-[#efeae0] px-5 py-3.5 text-[0.86rem] font-semibold">
          <span aria-hidden>📖</span> What these terms mean
          <span className="font-normal text-[0.72rem] text-[#1a1a1a]/40">— no jargon left unexplained</span>
          <span className="ml-auto text-[#9a7a2e] transition-transform group-open:rotate-180" aria-hidden>⌄</span>
        </summary>
        <dl className="bg-white/60 px-5 py-2">
          {[
            ["On-time record", "Share of delivered projects handed over on or before the possession date the builder committed in its RERA filing."],
            ["Delivered", "Project has received its occupation / completion certificate — legally ready to live in."],
            ["Ongoing", "Under active construction and still within its RERA-registered timeline."],
            ["Lapsed", "RERA registration expired without completion or a filed extension. Buyers of a lapsed project lose the RERA safety net — refunds and penalties get much harder to enforce.", true],
            ["Avg slippage", "Average gap, in months, between the RERA-promised and actual handover date across delivered projects."],
          ].map(([term, def, flag]) => (
            <div key={term as string} className="grid gap-4 border-b border-dotted border-[#1a1a1a]/12 py-3 last:border-none sm:grid-cols-[170px_1fr]">
              <dt className="text-[0.82rem] font-semibold">{term}{flag && <span className="ml-1.5 rounded border border-[#b0503e]/40 px-1.5 py-0.5 align-middle text-[0.52rem] uppercase tracking-[0.06em] text-[#9a4130]">Red flag</span>}</dt>
              <dd className="text-[0.82rem] font-light leading-[1.55] text-[#1a1a1a]/60">{def}</dd>
            </div>
          ))}
        </dl>
      </details>

      {/* ── Part B · financial audit ── */}
      <div className="mt-12">
        <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar I · Developer DNA — b</p>
        <h3 className="mt-2 flex flex-wrap items-center gap-3 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">
          Can the balance sheet finish the building?
          <span className="rounded-full border border-[#1a1a1a]/12 bg-white/60 px-2.5 py-1 align-middle text-[0.58rem] font-sans font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/45">▪ {dev.listed ? "Listed · MCA-filed" : "Privately held"}</span>
        </h3>
        <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">A builder can have a great record and still run out of money mid-tower. These numbers say whether the finances can carry {p.name} to handover.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIN_METRICS.map((f) => {
          const band = dev.finBand?.[f.key] ?? fromRating(dev.financials[f.key]);
          const value = dev.finValues?.[f.key];
          return (
            <div key={f.key} className="rounded-2xl border border-[#1a1a1a]/8 bg-white/60 p-6">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-[#1a1a1a]/45">{f.full}</p>
              <p className="mt-1.5 text-[0.72rem] font-light leading-[1.4] text-[#1a1a1a]/40">{f.meaning}</p>
              {value ? (
                <p className={`mt-4 font-mono text-[2.1rem] font-medium leading-none ${VAL[band]}`}>{value}</p>
              ) : (
                <p className="mt-4 text-[1.1rem] font-medium text-[#1a1a1a]/25">—</p>
              )}
              <div className="mt-4"><BandChip band={band} /></div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[0.8rem] font-light leading-[1.65] text-[#1a1a1a]/55">{dev.finNote}</p>
      <p className="mt-5 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">Sources: MCA filings + latest annual &amp; quarterly financial reports · Haryana RERA track record. Independent read — not supplied by the developer.</p>
    </div>
  );
}

function Stat({ v, unit, k, hero, tone }: { v: string; unit?: string; k: string; hero?: boolean; tone?: "red" | "clean" }) {
  const color = tone === "red" ? "text-[#b0503e]" : hero || tone === "clean" ? "text-[#1e6b45]" : "text-[#1a1a1a]";
  return (
    <div className={`border-b border-r border-[#1a1a1a]/[0.06] p-5 ${hero || tone ? "bg-[#1e6b45]/[0.04]" : ""} ${tone === "red" ? "!bg-[#b0503e]/[0.05]" : ""}`}>
      <p className={`font-mono text-[2rem] font-medium leading-none ${color}`}>{v}{unit && <span className="text-[0.85rem] text-[#1a1a1a]/35">{unit}</span>}</p>
      {tone === "clean" && <p className="mt-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-[#238c55]">✓ Clean</p>}
      {tone === "red" && <p className="mt-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-[#9a4130]">⚠ Red flag</p>}
      <p className="mt-2 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">{k}</p>
    </div>
  );
}

function Meter({ band }: { band: Band }) {
  const lit = band === "exceptional" || band === "strong" ? 3 : band === "moderate" ? 2 : 1;
  const color = band === "watch" ? "#b0503e" : band === "moderate" ? "#9a7a2e" : "#1e6b45";
  return (
    <div className="mt-3.5 flex gap-1.5">
      {[0, 1, 2].map((i) => <span key={i} className="h-[7px] flex-1 rounded-full" style={{ background: i < lit ? color : "#e6dfd0" }} />)}
    </div>
  );
}

function Split({ n, l, tone }: { n: number; l: string; tone?: "green" | "gold" }) {
  return (
    <div>
      <p className={`font-mono text-[1.1rem] font-semibold ${tone === "green" ? "text-[#238c55]" : tone === "gold" ? "text-[#9a7a2e]" : "text-[#1a1a1a]"}`}>{n}</p>
      <p className="text-[0.58rem] font-medium uppercase tracking-[0.08em] text-[#1a1a1a]/40">{l}</p>
    </div>
  );
}
