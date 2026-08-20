import type { ProjectIntel } from "@/lib/projects";
import { projectHref } from "@/lib/projectHref";
import { delayRiskOf, roiOutlookOf } from "@/lib/redFlags";

/* The one project-option card, used everywhere we surface projects as a
   comparable set — the report's "If not this, then what?", the journey
   shortlist, the Projects index, the /apartments landers, /best-projects,
   market corridors, the workspace and the office. Founder-approved layout
   (catalogue mock, 20 Aug 2026): verdict and Truth Score on top, the filed
   configurations as an eyebrow, identity and ticket, and — below the
   hairline — the forensic strip no portal prints: delay risk from filed
   QPR pace, a qualitative ROI outlook, and the audited red-flag count.

   EVERY CHIP IS DERIVED, NEVER STORED: delay risk from actual-vs-expected
   completion %, outlook from the audited model's projected CAGR (the
   number itself stays on the report), the flag count recomputed from the
   founder's four rules (redFlags.ts). A chip whose inputs are absent is
   omitted — never guessed. */

/* verdict pill — green for a buy, gold for a hold. */
const recoPill = (reco: string) =>
  /strong buy/i.test(reco)
    ? "border-[#1e6b45]/40 bg-[#1e6b45]/[0.06] text-[#1e6b45]"
    : /buy/i.test(reco)
    ? "border-[#9a7a2e]/40 bg-[#c9a96e]/10 text-[#9a7a2e]"
    : "border-[#1a1a1a]/20 bg-[#1a1a1a]/[0.04] text-[#1a1a1a]/60";

/* "Sector 63, Golf Course Ext. Road" — sector + street, no market short and
   no city; "Extension" trimmed to "Ext." Falls back to the corridor when we
   hold no street address. */
export function streetAddress(p: ProjectIntel): string {
  const parts = p.ops?.address ? p.ops.address.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const street = (parts.length >= 2 ? parts.slice(0, -1) : parts).join(", ").replace(/Extension/g, "Ext.");
  return street || [p.marketShort, "Gurugram"].filter(Boolean).join(", ");
}

/* "3, 4, 5 BHK · Duplex Penthouse" from whatever the project filed — BHK
   sizes collapse into one ascending list, non-BHK formats follow. One
   truncating line, so a long filing never wraps the card. */
function cfgLine(p: ProjectIntel): string {
  const nums = new Set<string>();
  const other: string[] = [];
  for (const c of p.configs ?? []) {
    const m = c.match(/(\d+(?:\.\d+)?)\s*BHK/i);
    if (m) nums.add(m[1]);
    const rest = c.replace(/\d+(?:\.\d+)?\s*BHK\s*\+?\s*/i, "").trim();
    if (/penthouse|duplex|studio|villa|suite/i.test(rest) && !other.some((o) => o.toLowerCase() === rest.toLowerCase())) other.push(rest);
    else if (/penthouse|duplex|studio|villa|suite/i.test(c) && !m && !other.includes(c)) other.push(c);
  }
  const parts: string[] = [];
  if (nums.size) parts.push([...nums].sort((a, b) => Number(a) - Number(b)).join(", ") + " BHK");
  if (other.length) parts.push(other.join(" · "));
  return parts.join(" · ");
}

const CHIP = "rounded-[3px] border px-2 py-1 font-mono text-[0.55rem] uppercase tracking-[0.08em]";
const TONE = {
  green: "border-[#1e6b45]/40 bg-[#1e6b45]/[0.06] text-[#1e6b45]",
  gold: "border-[#9a7a2e]/40 bg-[#c9a96e]/[0.12] text-[#9a7a2e]",
  rust: "border-[#b0503e]/40 bg-[#b0503e]/[0.07] text-[#b0503e]",
  ink: "border-[#1a1a1a]/20 bg-[#1a1a1a]/[0.03] text-[#1a1a1a]/60",
} as const;

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
  const c = p.ops?.construction;
  const delay = delayRiskOf(c?.actualPct, c?.expectedPct);
  const outlook = roiOutlookOf(p.liveRoi?.adjCagr);
  const flags = p.redFlags;
  /* psfOwn ONLY — p.psf is the CORRIDOR's rate, and this line says "filed".
     A project without a filed rate shows no rate, not a neighbour's. */
  const psf = p.psfOwn?.low;
  const cfgs = cfgLine(p);
  const hasStrip = delay != null || outlook != null || flags != null;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-[3px] border px-2 py-1 font-mono text-[0.56rem] uppercase tracking-[0.12em] ${recoPill(p.recommendation)}`}>
          {p.recommendation}
        </span>
        <div className="text-right">
          <span className="font-serif text-[2.4rem] font-medium leading-[0.82] tracking-[-0.01em] text-[#1a1a1a] tabular-nums">{p.truthScore}</span>
          <span className="mt-1 block font-mono text-[7.5px] uppercase tracking-[0.13em] text-[#1a1a1a]/32">Truth Score</span>
        </div>
      </div>

      <div className="mt-auto">
        {cfgs && (
          <p className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[0.58rem] uppercase tracking-[0.1em] text-[#9a7a2e]">{cfgs}</p>
        )}
        {/* the name reserves two lines so every card's name starts on the
            same line whether it wraps or not */}
        <h3 className="mt-1 min-h-[2.24em] max-w-[95%] font-serif text-[1.28rem] font-medium leading-[1.12] tracking-[-0.01em] text-[#1a1a1a] transition-colors duration-300 group-hover:text-[#1e6b45]">{p.name}</h3>
        <p className="mt-1.5 text-[0.75rem] leading-snug text-[#1a1a1a]/50">{streetAddress(p)}</p>
        <p className="mt-2.5 font-mono text-[0.92rem] font-medium text-[#1a1a1a] tabular-nums">
          {p.budget[0] <= 0
            ? "Price NA"
            : p.budget[0] === p.budget[1]
            ? `₹${p.budget[0]} Cr+`
            : `₹${p.budget[0]}–${p.budget[1]} Cr`}
        </p>
        {psf != null && psf > 0 && (
          <p className="mt-0.5 font-mono text-[0.62rem] text-[#1a1a1a]/40 tabular-nums">₹{Math.round(psf).toLocaleString("en-IN")}/sq ft filed</p>
        )}
        {matchPct != null && (
          <p className="mt-2 font-mono text-[0.68rem] font-semibold tracking-[0.02em] text-[#1e6b45] tabular-nums">{matchPct}% fit to you</p>
        )}

        {/* ── the forensic strip ── */}
        {hasStrip && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#1a1a1a]/[0.06] pt-3">
            {delay != null && (
              <span className={`${CHIP} ${delay === "Low" ? TONE.green : delay === "Medium" ? TONE.gold : TONE.rust}`}>
                Delay risk · {delay}
              </span>
            )}
            {outlook != null && (
              <span className={`${CHIP} ${outlook === "Strong" ? TONE.green : outlook === "Fair" ? TONE.gold : TONE.ink}`}>
                ROI outlook · {outlook}
              </span>
            )}
            {flags != null && (
              <span className={`${CHIP} ${flags > 0 ? TONE.rust : TONE.green}`}>
                {flags > 0 ? `⚑ ${flags} red flag${flags === 1 ? "" : "s"}` : "⚑ No red flags"}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const cls = "group relative flex min-h-[380px] flex-col overflow-hidden rounded-[12px] border border-[#1a1a1a]/[0.13] bg-[#FBF8F2] p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1e6b45]/45";
  /* projectHref, not a hand-built path — one helper knows a project's
     public address; this is one of the places that asks it. */
  return onSelect ? (
    <button onClick={onSelect} className={cls}>{inner}</button>
  ) : (
    <a href={href ?? projectHref(p)} className={cls}>{inner}</a>
  );
}
