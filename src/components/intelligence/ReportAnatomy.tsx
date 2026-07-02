import { pillars, rankContext, type Pillar, type PillarBand, type ProjectIntel } from "@/lib/projects";

/* Chapter II opener — the Truth Score, decomposed. A composition bar
   (width = weight, colour = health) over five pillar rows, each with a
   graded band, an illustrative /10, a one-line "why" and a jump into its
   audit. The black box, opened — and the honest weak pillar left visible. */

const BAND: Record<PillarBand, { chip: string; dot: string; seg: string; text: string }> = {
  exceptional: { chip: "text-[#155a3a] bg-[#1e6b45]/[0.12] border-[#1e6b45]/25", dot: "bg-[#1e6b45]", seg: "#1e6b45", text: "text-[#1a1a1a]" },
  strong: { chip: "text-[#1c7a4c] bg-[#238c55]/[0.10] border-[#238c55]/25", dot: "bg-[#238c55]", seg: "#2f9a68", text: "text-[#1a1a1a]" },
  moderate: { chip: "text-[#8a6a1e] bg-[#9a7a2e]/[0.12] border-[#9a7a2e]/30", dot: "bg-[#9a7a2e]", seg: "#9a7a2e", text: "text-[#1a1a1a]" },
  watch: { chip: "text-[#9a4130] bg-[#b0503e]/[0.10] border-[#b0503e]/30", dot: "bg-[#b0503e]", seg: "#b0503e", text: "text-[#b0503e]" },
};
const BAND_LABEL: Record<PillarBand, string> = { exceptional: "Exceptional", strong: "Strong", moderate: "Moderate", watch: "Watch this" };

export default function ReportAnatomy({ p }: { p: ProjectIntel }) {
  const rows = pillars(p);
  const ctx = rankContext(p);
  const grade = p.truthScore >= 90 ? "Exceptional" : p.truthScore >= 80 ? "Strong" : p.truthScore >= 70 ? "Solid" : p.truthScore >= 60 ? "Fair" : "Watch";
  const filled = Math.round(p.truthScore / 10);
  const weakest = rows.reduce((a, b) => (b.score < a.score ? b : a), rows[0]);
  const strong = rows.filter((r) => r.band === "exceptional" || r.band === "strong").length;

  return (
    <div className="mt-9 grid gap-11 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* The Stat — headline number, grade + reco, a 10-segment meter */}
      <div className="text-center lg:text-left">
        <p className="text-[0.55rem] font-medium uppercase tracking-[0.24em] text-[#1a1a1a]/40">Truth Score</p>
        <p className="mt-1.5 flex items-baseline justify-center lg:justify-start">
          <span className="font-serif text-[5rem] font-normal leading-[0.8] text-[#1e6b45]">{p.truthScore}</span>
          <span className="ml-2 font-mono text-[1.2rem] text-[#1a1a1a]/30">/100</span>
        </p>
        <p className="mt-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#1e6b45]">
          {grade} · {p.recommendation}{ctx.topPct <= 25 && ` · Top ${ctx.topPct}%`}
        </p>
        <div className="mx-auto mt-3 flex max-w-[240px] gap-[3px] lg:mx-0">
          {Array.from({ length: 10 }).map((_, idx) => (
            <span key={idx} className={`h-[10px] flex-1 rounded-[2px] ${idx < filled ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/[0.1]"}`} />
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-[230px] text-[0.68rem] font-light leading-[1.5] text-[#1a1a1a]/40 lg:mx-0">
          Five weighted pillars, re-scored quarterly. No developer can pay to move it.
        </p>
      </div>

      {/* Composition + pillar rows */}
      <div>
        <div className="mb-3 flex items-baseline justify-between text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">
          <span>What the {p.truthScore} is made of</span>
          <span className="hidden sm:inline">width = weight · colour = health</span>
        </div>
        <div className="flex h-4 gap-0.5 overflow-hidden rounded-md">
          {rows.map((r) => (
            <div key={r.key} title={`${r.label} · ${BAND_LABEL[r.band]}`} style={{ width: `${r.weight * 100}%`, background: BAND[r.band].seg }} />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[0.58rem] text-[#1a1a1a]/35">
          {rows.map((r) => (
            <span key={r.key} className={r.band === "watch" ? "text-[#b0503e]/70" : ""}>{r.label.split(" ")[0]} {Math.round(r.weight * 100)}%</span>
          ))}
        </div>

        <div className="mt-6 border-t border-[#1a1a1a]/10">
          {rows.map((r) => <PillarRow key={r.key} r={r} weak={r.key === weakest.key && r.band === "watch"} />)}
        </div>

        <p className="mt-5 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/55">
          <span className="font-medium text-[#1a1a1a]">The one-line read:</span>{" "}
          {strong} of {rows.length} pillars land strong or better
          {weakest.band === "watch"
            ? <>, with one to watch — <span className="font-medium text-[#b0503e]">{weakest.label}</span>. That&apos;s the section we&apos;d read before signing.</>
            : <>. A clean read across the board — the detail is below.</>}
        </p>
      </div>
    </div>
  );
}

function PillarRow({ r, weak }: { r: Pillar; weak: boolean }) {
  const b = BAND[r.band];
  return (
    <a href={`#${r.anchor}`} className={`group relative grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-4 border-b border-[#1a1a1a]/10 py-4 ${weak ? "-mx-3.5 rounded-lg bg-[#b0503e]/[0.04] px-3.5" : ""}`}>
      {weak && <span className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded bg-[#b0503e]" />}
      <span className="flex justify-center" aria-hidden>{pillarIcon(r.key, r.band === "watch" ? "#b0503e" : "#9a7a2e")}</span>
      <div className="min-w-0">
        <p className="font-serif text-[1.12rem] leading-tight">{r.label}</p>
        <p className="mt-1 text-[0.78rem] font-light leading-snug text-[#1a1a1a]/55">{r.why}</p>
        <p className="mt-1.5 flex items-center gap-2 text-[0.6rem] text-[#1a1a1a]/40">
          Weight {Math.round(r.weight * 100)}%
          <span className="relative inline-block h-[3px] w-[110px] overflow-hidden rounded-full bg-[#e3dccb]">
            <span className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.min(100, r.score * 10)}%`, background: r.band === "watch" ? "#c56a56" : "#c9a96e" }} />
          </span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 text-right">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em] ${b.chip}`}>
          <span className={`h-[6px] w-[6px] rounded-full ${b.dot}`} />{BAND_LABEL[r.band]}
        </span>
        <span className={`font-mono text-[1.5rem] font-medium leading-none ${b.text}`}>{r.score.toFixed(1)}<span className="text-[0.7rem] text-[#1a1a1a]/35">/10</span></span>
        <span className={`text-[0.68rem] ${r.band === "watch" ? "text-[#c56a56]" : "text-[#9a7a2e]"}`}>Read the audit →</span>
      </div>
    </a>
  );
}

/* One consistent line-icon set for the five pillars (replaces ad-hoc glyphs). */
function pillarIcon(k: string, tone: string) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", className: "h-[1.15rem] w-[1.15rem]" } as const;
  switch (k) {
    case "developer": // developer / company track record — building
      return <svg {...common} style={{ color: tone }} aria-hidden><path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h6A1.5 1.5 0 0 1 13 5.5V21" /><path d="M13 10h5.5A1.5 1.5 0 0 1 20 11.5V21" /><path d="M3 21h18M7 8h2M7 12h2M7 16h2M16 14h1M16 17.5h1" /></svg>;
    case "construction": // construction & sales — hard hat
      return <svg {...common} style={{ color: tone }} aria-hidden><path d="M3 18.5h18" /><path d="M5.5 18.5a6.5 6.5 0 0 1 13 0" /><path d="M12 6v3.4M9.4 9.6 8.7 6.6M14.6 9.6l.7-3" /></svg>;
    case "location": // location intelligence — pin
      return <svg {...common} style={{ color: tone }} aria-hidden><path d="M12 21c4.4-4 7-7.1 7-11a7 7 0 1 0-14 0c0 3.9 2.6 7 7 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>;
    case "legal": // legal & compliance — scales
      return <svg {...common} style={{ color: tone }} aria-hidden><path d="M12 3.5v16M8 19.5h8" /><path d="M4.6 7h14.8M12 3.6 4.6 7M12 3.6 19.4 7" /><path d="M4.6 7 2.4 11.5a2.5 2.5 0 0 0 4.4 0z" /><path d="M19.4 7l-2.2 4.5a2.5 2.5 0 0 0 4.4 0z" /></svg>;
    case "usps": // project USPs — sparkle
      return <svg {...common} style={{ color: tone }} aria-hidden><path d="M12 3.2c.5 3.6 1.9 5 5.5 5.5-3.6.5-5 1.9-5.5 5.5-.5-3.6-1.9-5-5.5-5.5 3.6-.5 5-1.9 5.5-5.5Z" /><path d="M18.6 15.4c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2Z" /></svg>;
    default:
      return <svg {...common} style={{ color: tone }} aria-hidden><circle cx="12" cy="12" r="8" /></svg>;
  }
}
