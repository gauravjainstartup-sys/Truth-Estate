/* ════════════════════════════════════════════════════════════════
   VERDICT COMPOSER — the report's short-answer, composed per project.

   The upstream rules engine writes a `rule_verdict.verdict` phrase into
   Supabase, but its vocabulary is tiny: across the 107 tracked reports it
   assigns "High Conviction" to ~100 of them and appends "Prime Location
   Tailwinds" to ~90 (the location scorer rates almost everything "strong"),
   so nearly every report reads the same sentence — and, per the note in
   reportAdapter, roughly two in three of those strings arrive broken.

   This composes the short-answer from the SAME numbers that build the Truth
   Score — the per-project `pillar_scores` — so each report states its own
   two strongest pillars and its one genuine watchpoint, and no two reports
   with different data read the same. It is deliberately "specifics only":
   the recommendation label beside it ("Strong Buy" / "Watchlist") already
   states the stance, so this carries the argument, never a second verdict
   word that could contradict the label.

   Honest by construction: it never invents a strength (a pillar must clear
   the STRONG bar to be named) and never hides a real weakness (the weakest
   pillar is named whenever it falls below the WEAK bar). `connectivity` is
   excluded — its upstream scorer is broken (every project scores ~8/100) —
   and `truth` is excluded because it is the composite, not a pillar.
   ════════════════════════════════════════════════════════════════ */

export type Pillar = "location" | "developer" | "legal" | "fundamentals" | "roi";
export type PillarScores = Record<Pillar, number | null>;

/* A pillar must clear this to be named a strength; must fall below the other
   to be named a watchpoint. The 55–70 middle is "neither" — a moderate pillar
   is left unspoken rather than mislabelled. */
const STRONG_BAR = 70;
const WEAK_BAR = 55;

const ORDER: Pillar[] = ["location", "developer", "legal", "fundamentals", "roi"];

const STRENGTH: Record<Pillar, string> = {
  location: "a prime-location address",
  developer: "a proven developer",
  legal: "a clean legal record",
  fundamentals: "strong demand",
  roi: "standout ROI",
};
const WATCH: Record<Pillar, string> = {
  location: "a weaker location",
  developer: "an unproven developer",
  legal: "legal gaps",
  fundamentals: "soft demand",
  roi: "a thin ROI runway",
};

const cap = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/* Returns a finished sentence, or null when the scores can't support an
   honest, differentiated read (too few pillars, or all in the neutral
   middle) — the caller then falls back to the DB verdict, then the insight. */
export function composeVerdict(scores: PillarScores): string | null {
  const present = ORDER
    .map((k) => ({ k, v: scores[k] }))
    .filter((x): x is { k: Pillar; v: number } => typeof x.v === "number" && Number.isFinite(x.v));
  if (present.length < 2) return null;

  const byHigh = [...present].sort((a, b) => b.v - a.v);
  const byLow = [...present].sort((a, b) => a.v - b.v);

  const strengths = byHigh.filter((x) => x.v >= STRONG_BAR).slice(0, 2).map((x) => STRENGTH[x.k]);
  const weakest = byLow[0].v < WEAK_BAR ? WATCH[byLow[0].k] : null;

  if (strengths.length) {
    const lead = strengths.length === 2 ? `${strengths[0]} and ${strengths[1]}` : strengths[0];
    return weakest ? `${cap(lead)}, offset by ${weakest}.` : `${cap(lead)}.`;
  }

  /* No pillar clears the strong bar — lead honestly with the concern(s)
     rather than manufacture a strength. */
  if (weakest) {
    const second = byLow[1] && byLow[1].v < WEAK_BAR ? WATCH[byLow[1].k] : null;
    return second ? `Held back by ${weakest} and ${second}.` : `Held back by ${weakest}.`;
  }

  /* Everything sits in the neutral middle — no honest specific to lead with. */
  return null;
}
