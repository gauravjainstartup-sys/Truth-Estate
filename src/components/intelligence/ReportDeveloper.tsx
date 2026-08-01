import { developerOf, lastUpdatedOn, type ProjectIntel } from "@/lib/projects";
import { BAND_RANK, FIN_METRICS, type FinBand, type FinRating } from "@/lib/developers";

/* Chapter II · Pillar I — Developer DNA, in two parts:
   (a) Track record — the RERA delivery ledger, with "lapsed" flagged red
       above zero and a plain-English glossary; (b) Financial audit — the
       balance-sheet metrics as graded band cards. */

/* Five grades, not four. "Strained" is the deepest — a metric that has
   already gone wrong (negative earnings, cash burning, an inventory
   overhang) rather than one that might. It reuses the watch hue at full
   strength: a sixth colour would read as a new category, and this is the
   same category further down. */
type Band = FinBand;
const CHIP: Record<Band, string> = {
  exceptional: "text-[#155a3a] bg-[#1e6b45]/[0.12] border-[#1e6b45]/25",
  strong: "text-[#1c7a4c] bg-[#238c55]/[0.10] border-[#238c55]/25",
  moderate: "text-[#8a6a1e] bg-[#9a7a2e]/[0.12] border-[#9a7a2e]/30",
  watch: "text-[#9a4130] bg-[#b0503e]/[0.10] border-[#b0503e]/30",
  strained: "text-[#7e2d20] bg-[#8f3a2b]/[0.14] border-[#8f3a2b]/45",
};
const DOT: Record<Band, string> = { exceptional: "bg-[#1e6b45]", strong: "bg-[#238c55]", moderate: "bg-[#9a7a2e]", watch: "bg-[#b0503e]", strained: "bg-[#8f3a2b]" };
const VAL: Record<Band, string> = { exceptional: "text-[#1e6b45]", strong: "text-[#238c55]", moderate: "text-[#9a7a2e]", watch: "text-[#b0503e]", strained: "text-[#8f3a2b]" };
const LABEL: Record<Band, string> = { exceptional: "Exceptional", strong: "Strong", moderate: "Moderate", watch: "Watch", strained: "Strained" };
const fromRating = (r: FinRating): Band => (r === "strong" ? "strong" : r === "moderate" ? "moderate" : "watch");

function BandChip({ band, label }: { band: Band; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em] ${CHIP[band]}`}>
      <span className={`h-[6px] w-[6px] rounded-full ${DOT[band]}`} />{label ?? LABEL[band]}
    </span>
  );
}

/* Analyst assessment — turn the pipeline's grade into a chip, and (when it
   hands us a bare word rather than prose) compose a grounded, honest one-liner
   from the RERA delivery ledger, so the block never reads as a raw DB value. */
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const numWord = (n: number) => (Number.isInteger(n) && n >= 0 && n < NUM.length ? NUM[n] : String(n));
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
function wordToBand(w: string): Band {
  const s = w.toLowerCase();
  if (/except|robust|excellent/.test(s)) return "exceptional";
  if (/weak|poor|distress|concern|caution|\brisk|watch this/.test(s)) return "watch";
  if (/healthy|strong|solid|good|stable|sound|clean/.test(s)) return "strong";
  return "moderate"; // fair / mixed / adequate / anything we don't recognise
}
function composeAssessment(perf: { onTimePct?: number; delivered?: number; ongoing?: number; avgDelayMonths?: number }, lapsed: number): string {
  const delivered = perf.delivered ?? 0, ongoing = perf.ongoing ?? 0, delay = perf.avgDelayMonths ?? 0, onTime = perf.onTimePct;
  const article = /^(8|11|18|8[0-9])$/.test(String(onTime)) ? "an" : "a"; // "an 88%", "a 95%"
  const open = typeof onTime === "number" && delivered > 0
    ? (lapsed === 0 && onTime >= 90 ? "a clean " : `${article} `) + `${onTime}% on-time record` + (lapsed === 0 ? " with zero lapsed registrations" : `, though ${numWord(lapsed)} registration${lapsed === 1 ? " has" : "s have"} lapsed`)
    : lapsed === 0 ? "no lapsed registrations on file" : `${cap(numWord(lapsed))} lapsed registration${lapsed === 1 ? "" : "s"} on file`;
  const base = delivered === 0
    ? (ongoing > 0 ? `${numWord(ongoing)} project${ongoing === 1 ? " is" : "s are"} still under construction — no completed handover to judge yet` : "no completed handovers on record yet")
    : delivered <= 2 && ongoing >= 3 ? `on a thin base of ${numWord(delivered)} delivered project${delivered === 1 ? "" : "s"}, with ${numWord(ongoing)} still under construction — a promising start, not yet proven at scale`
    : delivered >= 5 ? `across ${delivered} delivered projects — a proven record at scale`
    : `with ${numWord(delivered)} delivered and ${numWord(ongoing)} under way`;
  let s = delivered === 0 ? `${open}; ${base}.` : `${open}, ${base.startsWith("on a thin") ? "but " : ""}${base}.`;
  if (delay > 0) s += ` When late, typically by ~${delay} month${delay === 1 ? "" : "s"}.`;
  return cap(s);
}

export default function ReportDeveloper({ p }: { p: ProjectIntel }) {
  const dev = developerOf(p);
  if (!dev) return null;
  const perf = dev.performance;
  const lapsed = perf.lapsed ?? Math.max(0, perf.launched - perf.delivered - perf.ongoing);

  // the pipeline hands developer.verdict either a bare grade word ("healthy")
  // or full prose. A bare word (or a blank) becomes a grade chip + a composed,
  // ledger-grounded sentence; real prose is shown as-is under a derived chip.
  const rawVerdict = (dev.verdict ?? "").trim();
  const gradeWord = rawVerdict.length > 0 && rawVerdict.split(/\s+/).length <= 2 && !/[.:;!?]/.test(rawVerdict);
  const perfBand: Band = lapsed > 0 ? "watch" : (perf.onTimePct ?? 0) >= 92 ? "exceptional" : (perf.onTimePct ?? 0) >= 80 ? "strong" : (perf.onTimePct ?? 0) >= 65 ? "moderate" : "watch";
  const chipBand: Band = gradeWord ? wordToBand(rawVerdict) : perfBand;
  const chipLabel = gradeWord ? cap(rawVerdict) : LABEL[perfBand];
  const assessment = gradeWord || rawVerdict.length === 0 ? composeAssessment(perf, lapsed) : cap(rawVerdict);

  // Part B · financial audit — an overall band from the metric grades, and an
  // assessment sentence: the developer's own note where it's real prose, else
  // one composed from how the balance-sheet lines score.
  const finBands = FIN_METRICS.map((f) => dev.finBand?.[f.key] ?? fromRating(dev.financials[f.key]));
  const finAvg = finBands.length ? finBands.reduce((a, b) => a + BAND_RANK[b], 0) / finBands.length : 3;
  const finBand: Band = finAvg >= 4.3 ? "exceptional" : finAvg >= 3.5 ? "strong" : finAvg >= 2.6 ? "moderate" : finAvg >= 1.8 ? "watch" : "strained";
  const finStrong = finBands.filter((b) => b === "exceptional" || b === "strong").length;
  const finStrained = finBands.filter((b) => b === "strained").length;
  const finRaw = (dev.finNote ?? "").trim();
  const finProse = finRaw.split(/\s+/).length > 2 && !/scoring pipeline|financial band from filings/i.test(finRaw);
  const finSentence = finProse
    ? cap(finRaw)
    : `${finStrong} of ${finBands.length} balance-sheet metric${finBands.length === 1 ? "" : "s"} score strong or better${finStrained > 0 ? `, and ${finStrained} ${finStrained === 1 ? "is" : "are"} already strained` : finBand === "watch" ? ", with real strain in the weaker lines" : ""}. ${
        finBand === "exceptional" || finBand === "strong"
          ? "Well-capitalised to finish construction from its own resources."
          : finBand === "moderate"
          ? "Adequately placed to reach handover — worth monitoring."
          : finBand === "watch"
          ? "Balance-sheet strain worth watching before you commit."
          : "The sheet is under real strain — ask how this project is being funded before you commit."
      }`;

  return (
    <div className="mt-8">
      {/* ── Part A · track record ── */}
      <div>
        <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar I · Developer DNA — a</p>
        <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">Does {dev.name} actually deliver?</h3>
        <p className="mt-2 text-[0.72rem] font-light italic text-[#1a1a1a]/40">Updated {lastUpdatedOn(p)}</p>
        <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">Every project this developer filed with RERA — registry, not brochure.</p>
      </div>

      <div className="mt-6 rounded-2xl border-l-2 border-[#1e6b45]/40 bg-white/50 p-6 md:p-7">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/40">Analyst assessment</p>
        <div className="mt-2.5"><BandChip band={chipBand} label={chipLabel} /></div>
        <p className="mt-3 font-serif text-[1.2rem] leading-[1.45] md:text-[1.3rem]">{assessment}</p>
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

      {perf.avgDelayMonths > 0 && (
        <p className="mt-3 text-[0.72rem] font-light leading-[1.5] text-[#1a1a1a]/40">When {dev.name} is late, it&apos;s late by ~{perf.avgDelayMonths} months on average — price that buffer into your plans.</p>
      )}

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

      <p className="mt-4 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">Sources: Haryana RERA track record. Independent read — not supplied by the developer.</p>

      {/* ── Part B · financial audit ── */}
      <div className="mt-12">
        <p className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#1a1a1a]/40">Pillar I · Developer DNA — b</p>
        <h3 className="mt-2 font-serif text-[1.7rem] font-medium leading-tight md:text-[2rem]">Can the balance sheet finish the building?</h3>
        <p className="mt-2.5 max-w-xl text-[0.9rem] font-light leading-[1.6] text-[#1a1a1a]/55">The numbers behind whether the money actually reaches handover.</p>
      </div>

      <div className="mt-6 rounded-2xl border-l-2 border-[#1e6b45]/40 bg-white/50 p-6 md:p-7">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/40">Analyst assessment</p>
        <div className="mt-2.5"><BandChip band={finBand} /></div>
        <p className="mt-3 font-serif text-[1.2rem] leading-[1.45] md:text-[1.3rem]">{finSentence}</p>
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
              {/* only where the raw figure would mislead — see FIN_CAP */}
              {dev.finCaveat?.[f.key] && (
                <p className="mt-3 text-[0.66rem] font-light leading-[1.45] text-[#1a1a1a]/40">{dev.finCaveat[f.key]}</p>
              )}
            </div>
          );
        })}
      </div>
      {/* This used to branch on dev.listed and call the result "a private
          developer's MCA-filed financial statements". Every live dossier is
          built with listed:false — there is no column for it — so DLF,
          Godrej, Sobha, Oberoi and Max Estates, all of them listed, were
          each described as private on their own page. The line now says the
          one thing that is true of every row: these are the company's own
          annual statements, at group level, not a project SPV's. */}
      <p className="mt-5 text-[0.68rem] font-light italic leading-[1.5] text-[#1a1a1a]/35">Sources: {dev.name}&rsquo;s own audited annual financial statements, read at company level rather than project. Independent read — not supplied by the developer.</p>
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
