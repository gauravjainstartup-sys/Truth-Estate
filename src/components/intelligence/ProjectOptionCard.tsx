import type { ProjectIntel } from "@/lib/projects";

/* The one project-option card, used everywhere we surface alternatives —
   the report's "If not this, then what?" grid and the journey shortlist.
   Deliberately short: identity, location, the Truth Score (our house
   readout — big number + a ten-segment bar), match, ticket. No prose
   verdict; the full read is one tap away. */

const basePath = "/Truth-Estate";

export const recoTone = (reco: string) =>
  /strong buy/i.test(reco)
    ? "border-[#1e6b45]/25 bg-[#1e6b45]/[0.09] text-[#1e6b45]"
    : /buy/i.test(reco)
    ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.14] text-[#9a7a2e]"
    : "border-[#1a1a1a]/15 bg-[#1a1a1a]/[0.04] text-[#1a1a1a]/55";

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
}: {
  p: ProjectIntel;
  rank: number;
  matchPct?: number | null;
  onSelect?: () => void;
}) {
  const filled = Math.round(p.truthScore / 10);
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="font-serif text-[0.95rem] font-light text-[#1a1a1a]/30">{String(rank).padStart(2, "0")}</span>
        <span className={`rounded-full border px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.08em] ${recoTone(p.recommendation)}`}>{p.recommendation}</span>
      </div>

      <h3 className="mt-4 font-serif text-[1.3rem] font-medium leading-tight text-[#1a1a1a]">{p.name}</h3>
      <p className="mt-1.5 flex items-center gap-1.5 text-[0.74rem] font-light tracking-[0.02em] text-[#1a1a1a]/45">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[#9a7a2e]">
          <path d="M12 21.5s-6.2-5.4-6.2-10.3a6.2 6.2 0 1 1 12.4 0C18.2 16.1 12 21.5 12 21.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        {shortLocation(p)}
      </p>

      {/* Truth Score — the house readout: big figure + ten-segment bar */}
      <div className="mt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.5rem] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/40">Truth Score</p>
            <p className="mt-0.5 flex items-baseline">
              <span className="font-serif text-[2.5rem] font-normal leading-[0.8] text-[#1e6b45]">{p.truthScore}</span>
              <span className="ml-1 font-mono text-[0.72rem] text-[#1a1a1a]/30">/100</span>
            </p>
          </div>
          {matchPct != null && (
            <div className="text-right">
              <p className="font-serif text-[1.5rem] font-medium leading-none text-[#1e6b45]">{matchPct}%</p>
              <p className="mt-1 text-[8px] font-light uppercase tracking-[0.14em] text-[#1a1a1a]/40">Match to you</p>
            </div>
          )}
        </div>
        <div className="mt-2.5 flex w-full gap-[3px]">
          {Array.from({ length: 10 }).map((_, idx) => (
            <span key={idx} className={`h-[7px] flex-1 rounded-[2px] ${idx < filled ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/[0.1]"}`} />
          ))}
        </div>
      </div>

      <p className="mt-5 flex-1 border-t border-[#1a1a1a]/[0.07] pt-4 text-[0.74rem] font-light tracking-[0.02em] text-[#1a1a1a]/50">
        {p.configs.slice(0, 3).join(" · ")}<span className="mx-2 text-[#c9a96e]">·</span>₹{p.budget[0]}–{p.budget[1]} Cr
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-[#1e6b45] transition-all duration-300 group-hover:gap-2.5">See the full read <span aria-hidden>→</span></span>
    </>
  );

  const cls = "group flex flex-col rounded-2xl border border-[#1a1a1a]/10 bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1a1a1a]/20 hover:shadow-xl hover:shadow-black/[0.06]";
  return onSelect ? (
    <button onClick={onSelect} className={cls}>{inner}</button>
  ) : (
    <a href={`${basePath}/intelligence/projects/${p.slug}`} className={cls}>{inner}</a>
  );
}
