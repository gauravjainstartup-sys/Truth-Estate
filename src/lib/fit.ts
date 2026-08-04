/* ════════════════════════════════════════════════════════════════
   FIT TO BRIEF — how well a project answers THIS buyer, which is a
   different question from how good the project is.

   The Truth Score says whether a development is sound. Fit says whether
   it is the one you should be looking at. They are deliberately shown as
   two separate readings on the dashboard, because a 90 that does not fit
   you is still the wrong flat — and a dashboard that blends them into one
   number is just the leaderboard again, wearing your name.

   Three dimensions, weighted by how expensive it is to be wrong about
   each. Corridor is heaviest: budget can stretch and a configuration can
   be compromised on, but nobody buys in a part of the city they have
   ruled out. Every score comes with the reason it landed there, because
   an unexplained fit number is a horoscope.
   ════════════════════════════════════════════════════════════════ */
import type { BriefProject, BuyerBrief } from "@/lib/buyerBrief";
import { matchLabel } from "@/lib/matchEngine";

const W_CORRIDOR = 45;
const W_BUDGET = 35;
const W_CONFIG = 20;

export type Fit = {
  /* 0–100, or null when the brief says too little to judge against.
     Null is a real answer — scoring a project against nothing and
     calling it 50 would be inventing agreement. */
  score: number | null;
  reasons: string[];
  /* Full sentences, for prose: "sits on SPR, which isn't on your list". */
  misses: string[];
  /* Two or three words, for the fit column. The full sentence truncates to
     "sits on Southern Peripher…" in a 8.5rem cell, which tells the reader
     nothing. Same judgement, sized for where it is shown. */
  shortMisses: string[];
};

/* Corridor names differ in punctuation between the brief and the
   catalogue — "Golf Course Road Extension (GCRE)" vs "Golf Course Ext".
   Compare on the significant words rather than the whole string, or
   every real match reads as a miss. */
function corridorMatches(want: string, have: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/)
      .filter((w) => w.length > 2 && !["the", "road", "corridor", "extension", "sector"].includes(w));
  const a = new Set(norm(want));
  const b = norm(have);
  return b.some((w) => a.has(w));
}

const bhkOf = (s: string): number | null => {
  const m = s.match(/(\d+)\s*BHK/i);
  return m ? Number(m[1]) : null;
};

export function fitFor(p: BriefProject, brief: BuyerBrief): Fit {
  const reasons: string[] = [];
  const misses: string[] = [];
  const shortMisses: string[] = [];
  let earned = 0;
  let possible = 0;

  const wantCorridors = brief.corridor.value;
  if (wantCorridors?.length && p.microMarket) {
    possible += W_CORRIDOR;
    if (wantCorridors.some((c) => corridorMatches(c, p.microMarket!))) {
      earned += W_CORRIDOR;
      reasons.push("in your corridor");
    } else {
      /* Phrased to survive being dropped into a sentence — "but it …".
         The first version produced "but it Southern Peripheral Road isn't
         on your list", which is not English. */
      misses.push(`sits on ${p.microMarket}, which isn't on your list`);
      shortMisses.push("outside your corridor");
    }
  }

  const band = brief.budgetCr.value;
  if (band && typeof p.minPriceCr === "number") {
    possible += W_BUDGET;
    /* Three bands, not two. The first version gave full marks to anything
       at or under the ceiling, which scored a ₹2.1 Cr project as a perfect
       budget match for someone shopping at ₹8 Cr — and made three
       unrelated projects tie at exactly 55%. Entry price signals the CLASS
       of a development, so landing far below the brief is a real mismatch,
       not a bargain. */
    if (p.minPriceCr > band.max) {
      misses.push(`starts at ₹${p.minPriceCr} Cr, above your ceiling`);
      shortMisses.push("above your budget");
    } else if (p.minPriceCr >= band.min * 0.7) {
      earned += W_BUDGET;
      reasons.push(`starts at ₹${p.minPriceCr} Cr`);
    } else {
      /* Partial: the bigger units here may reach the brief, but the
         project is positioned well below it. */
      earned += Math.round(W_BUDGET * 0.4);
      misses.push(`starts at ₹${p.minPriceCr} Cr — well below your range`);
      shortMisses.push("below your range");
    }
  }

  const wantBhk = brief.config.value ? bhkOf(brief.config.value) : null;
  if (wantBhk != null && typeof p.bhk === "number") {
    possible += W_CONFIG;
    if (p.bhk <= wantBhk) {
      earned += W_CONFIG;
      reasons.push(`${p.bhk} BHK available`);
    } else {
      misses.push(`starts at ${p.bhk} BHK, above the size you want`);
      shortMisses.push(`${p.bhk} BHK minimum`);
    }
  }

  /* Nothing to judge against is not a middling fit — it is no answer.
     Returning a number here would let the table imply agreement the
     brief never expressed. */
  if (!possible) return { score: null, reasons, misses, shortMisses };
  return { score: Math.round((earned / possible) * 100), reasons, misses, shortMisses };
}

/* Ranked worst-fit-last, so the table opens on what the buyer should
   actually be looking at rather than on whatever they clicked most. */
export function rankByFit(projects: BriefProject[], brief: BuyerBrief) {
  return projects
    .map((p) => ({ p, fit: fitFor(p, brief) }))
    .sort((a, b) => (b.fit.score ?? -1) - (a.fit.score ?? -1) || (b.p.truthScore ?? 0) - (a.p.truthScore ?? 0));
}

/* The one line the dashboard leads with. Written here rather than in the
   component because it is a claim about a person, and a claim should sit
   next to the evidence that produced it.

   Returns null when there is nothing honest to say — the caller shows the
   capture flow instead of a verdict with holes in it. */
export function verdictFor(brief: BuyerBrief, ranked: ReturnType<typeof rankByFit>): string | null {
  if (!brief.known || !ranked.length) return null;
  const scored = ranked.filter((r) => r.fit.score != null);
  if (!scored.length) return null;

  /* "Genuinely fits" reads off the app-wide match band (matchLabel: good =
     Strong/Ideal, ≥ 68), not a private cutoff — so the headline count agrees
     with the Fit bars below it and with Recommendations. */
  const good = scored.filter((r) => r.fit.score != null && matchLabel(r.fit.score).tone === "good");
  const most = [...ranked].sort((a, b) => b.p.views - a.p.views)[0];

  const bits: string[] = [];
  const want = [brief.config.value, brief.corridor.value?.[0], brief.budgetCr.value ? `around ${brief.budgetCr.display}` : null]
    .filter(Boolean).join(" on ").replace(" on around", " around");
  if (want) bits.push(`You're looking at ${want}.`);

  bits.push(
    good.length === 0
      ? `Of the ${scored.length} report${scored.length === 1 ? "" : "s"} you've opened, none is a clean match for that brief.`
      : `Of the ${scored.length} report${scored.length === 1 ? "" : "s"} you've opened, ${good.length === scored.length ? "all" : good.length} genuinely fit${good.length === 1 ? "s" : ""} it.`,
  );
  if (most && most.p.views > 1) {
    const f = most.fit.score;
    bits.push(
      f != null && matchLabel(f).tone === "low"
        ? `The one you keep returning to, ${most.p.name}, is not among them.`
        : `The one you keep returning to is ${most.p.name}.`,
    );
  }
  return bits.join(" ");
}
