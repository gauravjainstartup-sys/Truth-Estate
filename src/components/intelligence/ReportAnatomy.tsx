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
const ICON: Record<string, string> = { developer: "❦", construction: "▲", location: "◉", legal: "⚖", usps: "✦" };

export default function ReportAnatomy({ p }: { p: ProjectIntel }) {
  const rows = pillars(p);
  const ctx = rankContext(p);
  const deg = Math.round((p.truthScore / 100) * 360);
  const weakest = rows.reduce((a, b) => (b.score < a.score ? b : a), rows[0]);
  const strong = rows.filter((r) => r.band === "exceptional" || r.band === "strong").length;

  return (
    <div className="mt-9 grid gap-11 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Seal */}
      <div className="text-center">
        <div className="relative mx-auto h-[190px] w-[190px]">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#1e6b45 0 ${deg}deg, rgba(26,26,26,0.08) ${deg}deg 360deg)` }} />
          <div className="absolute inset-[9px] rounded-full bg-[#F5F0E8]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-[3.9rem] font-normal leading-none text-[#1e6b45]">{p.truthScore}</span>
            <span className="mt-0.5 font-mono text-[0.72rem] text-[#1a1a1a]/35">/ 100</span>
            <span className="mt-1.5 text-[0.5rem] font-medium uppercase tracking-[0.22em] text-[#1a1a1a]/40">Truth Score</span>
          </div>
        </div>
        <div className="mt-4 inline-block rounded-full bg-[#1e6b45] px-4 py-1.5 text-[0.72rem] font-semibold tracking-[0.02em] text-white">
          {p.recommendation}{ctx.topPct <= 25 && ` · Top ${ctx.topPct}%`}
        </div>
        <p className="mx-auto mt-3.5 max-w-[210px] text-[0.68rem] font-light leading-[1.5] text-[#1a1a1a]/40">
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
      <span className={`text-center text-[1.05rem] ${r.band === "watch" ? "text-[#b0503e]" : "text-[#9a7a2e]"}`} aria-hidden>{ICON[r.key] ?? "◆"}</span>
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
