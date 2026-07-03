import type { ProjectIntel } from "@/lib/projects";

/* The one project-option card, used everywhere we surface projects as a
   comparable set — the report's "If not this, then what?", the journey
   shortlist, the Projects index, market corridors, the workspace and the
   office. A square "score-corner" tile: verdict on the top-left, the Truth
   Score struck large in the top-right, and the identity — name, street
   address, ticket, and the % fit when a brief is set — gathered at the base.
   Minimal, near-monochrome, one green accent. */

const basePath = "/Truth-Estate";

/* verdict as coloured text — green for a buy, gold for a hold. */
const recoText = (reco: string) =>
  /strong buy/i.test(reco) ? "text-[#1e6b45]" : /buy/i.test(reco) ? "text-[#9a7a2e]" : "text-[#1a1a1a]/50";

/* "Sector 63, Golf Course Ext. Road" — sector + street, no market short and
   no city; "Extension" trimmed to "Ext." Falls back to the corridor when we
   hold no street address. */
export function streetAddress(p: ProjectIntel): string {
  const parts = p.ops?.address ? p.ops.address.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const street = (parts.length >= 2 ? parts.slice(0, -1) : parts).join(", ").replace(/Extension/g, "Ext.");
  return street || [p.marketShort, "Gurugram"].filter(Boolean).join(", ");
}

export default function ProjectOptionCard({
  p,
  matchPct,
  onSelect,
  href,
}: {
  p: ProjectIntel;
  /* accepted for call-site compatibility; the tile shows the verdict, not a rank */
  rank?: number;
  matchPct?: number | null;
  onSelect?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <span className={`text-[9.5px] font-semibold uppercase tracking-[0.12em] ${recoText(p.recommendation)}`}>{p.recommendation}</span>

      {/* Truth Score — struck in the top-right corner */}
      <div className="absolute right-6 top-5 text-right">
        <span className="font-serif text-[2.65rem] font-medium leading-[0.78] tracking-[-0.01em] text-[#1a1a1a] tabular-nums">{p.truthScore}</span>
        <span className="mt-1 block font-mono text-[7.5px] uppercase tracking-[0.13em] text-[#1a1a1a]/32">Truth Score</span>
      </div>

      {/* identity, anchored at the base. The name reserves two lines so every
         card's name starts on the same line whether it wraps or not — short
         names simply carry a line of air beneath them. */}
      <div className="mt-auto">
        <h3 className="min-h-[2.24em] max-w-[92%] font-serif text-[1.5rem] font-medium leading-[1.12] tracking-[-0.01em] text-[#1a1a1a] transition-colors duration-300 group-hover:text-[#1e6b45]">{p.name}</h3>
        <p className="mt-2 text-[0.75rem] leading-snug text-[#1a1a1a]/50">{streetAddress(p)}</p>
        <p className="mt-1.5 font-mono text-[0.84rem] text-[#1a1a1a] tabular-nums">₹{p.budget[0]}–{p.budget[1]} Cr</p>
        {matchPct != null && (
          <p className="mt-2.5 font-mono text-[0.68rem] font-semibold tracking-[0.02em] text-[#1e6b45] tabular-nums">{matchPct}% fit to you</p>
        )}
      </div>
    </>
  );

  const cls = "group relative flex min-h-[380px] flex-col overflow-hidden rounded-[12px] border border-[#1a1a1a]/[0.13] bg-[#FBF8F2] p-6 text-left transition-colors duration-300 hover:border-[#1e6b45]/45";
  return onSelect ? (
    <button onClick={onSelect} className={cls}>{inner}</button>
  ) : (
    <a href={href ?? `${basePath}/intelligence/projects/${p.slug}`} className={cls}>{inner}</a>
  );
}
