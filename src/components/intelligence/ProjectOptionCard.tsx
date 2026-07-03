import type { ProjectIntel } from "@/lib/projects";

/* The one project-option card, used everywhere we surface projects as a
   comparable set — the report's "If not this, then what?", the journey
   shortlist, the Projects index, market corridors, the workspace and the
   office. A "ledger line": no box, a hairline rule, the name leading in
   serif, and the Truth Score (with the % fit when a brief is set) landing
   as plain figures on one quiet footer. Type and space do the work. */

const basePath = "/Truth-Estate";

/* verdict as coloured text, not a chip — green for a buy, gold for a hold. */
const recoText = (reco: string) =>
  /strong buy/i.test(reco) ? "text-[#1e6b45]" : /buy/i.test(reco) ? "text-[#9a7a2e]" : "text-[#1a1a1a]/45";

/* "Sector 63, SPR, Gurugram" — sector from the tracked address, the market
   short, and the city. Falls back gracefully when we hold less. */
export function shortLocation(p: ProjectIntel): string {
  const parts = p.ops?.address ? p.ops.address.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const sector = parts[0] ?? null;
  const city = parts.length > 1 ? parts[parts.length - 1] : "Gurugram";
  return [sector, p.marketShort, city].filter(Boolean).join(", ");
}

export default function ProjectOptionCard({
  p,
  rank,
  matchPct,
  onSelect,
  href,
}: {
  p: ProjectIntel;
  rank?: number;
  matchPct?: number | null;
  onSelect?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      {/* eyebrow — index left, verdict right */}
      <div className="flex items-center justify-between">
        {rank != null ? (
          <span className="font-mono text-[11px] tracking-[0.16em] text-[#1a1a1a]/28 tabular-nums">{String(rank).padStart(2, "0")}</span>
        ) : (
          <span aria-hidden />
        )}
        <span className={`text-[10px] font-semibold uppercase tracking-[0.13em] ${recoText(p.recommendation)}`}>{p.recommendation}</span>
      </div>

      {/* the name leads */}
      <h3 className="mt-3.5 font-serif text-[1.55rem] font-medium leading-[1.08] tracking-[-0.01em] text-[#1a1a1a] transition-colors duration-300 group-hover:text-[#1e6b45] md:text-[1.8rem]">{p.name}</h3>
      <p className="mt-2.5 text-[0.78rem] leading-snug text-[#1a1a1a]/48">{shortLocation(p)}</p>

      {/* footer ledger — Truth Score, % fit (when a brief is set), ticket */}
      <div className="mt-auto flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-[#1a1a1a]/[0.11] pt-4">
        <span className="font-serif text-[1.5rem] font-medium leading-none tabular-nums text-[#1a1a1a]">
          {p.truthScore}<span className="ml-1 font-mono text-[9px] font-normal tracking-[0.06em] text-[#1a1a1a]/32">/100</span>
        </span>
        {matchPct != null && (
          <span className="font-serif text-[1.2rem] font-medium leading-none tabular-nums text-[#1e6b45]">
            {matchPct}%<span className="ml-1 font-mono text-[9px] font-normal uppercase tracking-[0.1em] text-[#1a1a1a]/32">fit</span>
          </span>
        )}
        <span className="ml-auto self-center font-mono text-[0.76rem] text-[#1a1a1a]/52">₹{p.budget[0]}–{p.budget[1]} Cr</span>
      </div>
    </>
  );

  const cls = "group flex h-full flex-col border-t border-[#1a1a1a]/15 pt-6 text-left transition-colors duration-300 hover:border-[#1e6b45]/45";
  return onSelect ? (
    <button onClick={onSelect} className={cls}>{inner}</button>
  ) : (
    <a href={href ?? `${basePath}/intelligence/projects/${p.slug}`} className={cls}>{inner}</a>
  );
}
