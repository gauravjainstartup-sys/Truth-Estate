import type { OmniProject } from "@/lib/omni";
import { projectHref } from "@/lib/projectHref";

/* A project tile drawn from the LIVE index rather than the curated set.
 *
 * The one on this page before it went through projectByName(), which
 * searches PROJECT_INTEL — and PROJECT_INTEL is `PROJECTS.map(enrich)`,
 * the hand-written demo set. So the front door of the intelligence
 * product could only ever render six invented projects: three of them
 * did not exist in the database at all (their links 404'd), and every
 * score was 9 to 30 points above the real one. The live set tops out at
 * 86; the page was advertising a 94, a 92 and a 90.
 *
 * OmniProject carries more than the old tile showed — verdict, red-flag
 * count, delivery year, source count — all populated on 97 of 97 rows.
 * Showing them costs nothing and is the difference between a tile that
 * looks like a listing and one that looks like a file.
 */

const VERDICT_TONE: Record<string, string> = {
  Proceed: "text-[#1e6b45]",
  Caution: "text-[#9a7a2e]",
  Avoid: "text-[#b0503e]",
};

/* "Sector 93 · New Gurgaon" — the corridor is the second half and is
   repeated on every card in a corridor-filtered list, so the sector
   leads and the corridor trails in lighter type. */
function place(location: string | null): { lead: string; trail: string | null } {
  if (!location) return { lead: "Location NA", trail: null };
  const bits = location.split(" · ");
  return bits.length > 1 ? { lead: bits[0], trail: bits.slice(1).join(" · ") } : { lead: location, trail: null };
}

export default function LiveProjectCard({ p }: { p: OmniProject }) {
  const { lead, trail } = place(p.location);
  const tone = VERDICT_TONE[p.verdict ?? ""] ?? "text-[#1a1a1a]/45";

  return (
    <a
      href={projectHref(p)}
      className="group relative flex min-h-[210px] flex-col rounded-lg border border-[#1a1a1a]/[0.07] bg-white p-6 transition-all duration-300 hover:-translate-y-[2px] hover:border-[#1e6b45]/25 hover:shadow-[0_14px_38px_-18px_rgba(0,0,0,0.22)]"
    >
      {p.verdict && (
        <span className={`text-[9.5px] font-semibold uppercase tracking-[0.12em] ${tone}`}>{p.verdict}</span>
      )}

      {p.score != null && (
        <div className="absolute right-6 top-5 text-right">
          <span className="font-serif text-[2.65rem] font-medium leading-[0.78] tracking-[-0.01em] text-[#1a1a1a] tabular-nums">{p.score}</span>
          <span className="mt-1 block font-mono text-[7.5px] uppercase tracking-[0.13em] text-[#1a1a1a]/32">Truth Score</span>
        </div>
      )}

      <div className="mt-auto">
        <h3 className="min-h-[2.24em] max-w-[80%] font-serif text-[1.32rem] font-medium leading-[1.12] tracking-[-0.01em] text-[#1a1a1a] transition-colors duration-300 group-hover:text-[#1e6b45]">
          {p.name}
        </h3>
        <p className="mt-2 text-[0.75rem] leading-snug text-[#1a1a1a]/50">
          {lead}
          {trail && <span className="text-[#1a1a1a]/30"> · {trail}</span>}
        </p>
        <p className="mt-1.5 font-mono text-[0.84rem] text-[#1a1a1a] tabular-nums">
          {p.minPriceCr != null && p.minPriceCr > 0 ? `₹${p.minPriceCr} Cr+` : "Price NA"}
          {p.config && <span className="text-[#1a1a1a]/40"> · {p.config}</span>}
        </p>

        {/* The line the old tile had no room for, because it had nothing
            to put in it. Possession and flag count are the two things a
            buyer scanning a grid actually sorts on. */}
        <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.66rem] uppercase tracking-[0.06em] text-[#1a1a1a]/35">
          {p.deliveryYear != null && <span>Possession {p.deliveryYear}</span>}
          {p.redFlags != null && p.redFlags > 0 && (
            <>
              <span className="text-[#1a1a1a]/15">·</span>
              <span className="text-[#9a7a2e]">{p.redFlags} flag{p.redFlags === 1 ? "" : "s"}</span>
            </>
          )}
          {p.has3D && (
            <>
              <span className="text-[#1a1a1a]/15">·</span>
              <span className="text-[#1e6b45]">3D</span>
            </>
          )}
        </p>
      </div>
    </a>
  );
}
