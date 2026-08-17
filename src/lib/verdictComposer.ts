/* ════════════════════════════════════════════════════════════════
   VERDICT COMPOSER — the report's short-answer, composed per project.

   The upstream rules engine writes a `rule_verdict.verdict` phrase into
   Supabase, but its vocabulary is tiny: it assigns "High Conviction" to
   ~100 of the 107 tracked reports and appends "Prime Location Tailwinds"
   to ~90 (the location scorer rates almost everything "strong"), so nearly
   every short-answer read the same sentence; and, per the note in
   reportAdapter, ~2/3 of those strings arrive broken.

   This composes the short-answer from the SAME per-project signals that
   build the Truth Score, so each report states its own two strongest
   themes and its one genuine watchpoint, and no two reports with different
   data read alike. It is "specifics only": the recommendation label beside
   it ("Strong Buy" / "Watchlist") already states the stance, so this
   carries the argument, never a second verdict word that could contradict
   the label.

   CONSISTENT WITH THE REST OF THE REPORT — the same page shows a curated
   strengths/watch-outs list. So DEMAND here is the project's real
   absorption (sales velocity / units sold), the SAME signal that drives
   the "most of the inventory has gone — demand has been strong" bullet —
   NOT the `fundamentals` pillar, which is a distinct measure and can move
   the opposite way (a fast-selling project can still have soft
   fundamentals). Its bars match the report's own liquidity thresholds
   (≥85 strong, <45 weak). "A clean legal record" needs the report's
   legal-strong bar (≥80) so a good-but-flagged profile is not over-claimed.

   Honest by construction: a theme must clear its strong bar to be named a
   strength and fall below its weak bar to be named a watchpoint; the middle
   is left unspoken. `connectivity` is excluded — its upstream scorer is
   uniformly broken (~8/100) — and `truth` is excluded because it is the
   composite, not a theme.
   ════════════════════════════════════════════════════════════════ */

export type Theme = "demand" | "location" | "developer" | "legal" | "roi" | "fundamentals";

/* All on a 0–100 scale. `demand` is sales-velocity / absorption percent;
   the rest are the rule engine's pillar_scores. null = not on file. */
export type VerdictSignals = Record<Theme, number | null>;

type Cfg = { strong: number; weak: number; up: string; down: string };

const CONFIG: Record<Theme, Cfg> = {
  demand: { strong: 85, weak: 45, up: "strong demand", down: "soft demand" },
  location: { strong: 70, weak: 55, up: "a prime-location address", down: "a weaker location" },
  developer: { strong: 70, weak: 55, up: "a proven developer", down: "an unproven developer" },
  legal: { strong: 80, weak: 55, up: "a clean legal record", down: "legal gaps" },
  roi: { strong: 70, weak: 55, up: "standout ROI", down: "a thin ROI runway" },
  fundamentals: { strong: 70, weak: 55, up: "solid fundamentals", down: "soft fundamentals" },
};

/* Ties in ranking resolve in this order (demand and location lead when they
   tie a pillar, since they are what a buyer feels first). */
const ORDER: Theme[] = ["demand", "location", "developer", "legal", "roi", "fundamentals"];

const cap = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/* Returns a finished sentence, or null when the signals can't support an
   honest, differentiated read (fewer than two on file, or all in the
   neutral middle) — the caller then falls back to the DB verdict, then the
   insight, then the generic scored line. */
export function composeVerdict(signals: VerdictSignals): string | null {
  const present = ORDER
    .map((t) => ({ t, v: signals[t] }))
    .filter((x): x is { t: Theme; v: number } => typeof x.v === "number" && Number.isFinite(x.v));
  if (present.length < 2) return null;

  const strong = present.filter((x) => x.v >= CONFIG[x.t].strong).sort((a, b) => b.v - a.v);
  const weak = present.filter((x) => x.v < CONFIG[x.t].weak).sort((a, b) => a.v - b.v);

  const strengths = strong.slice(0, 2).map((x) => CONFIG[x.t].up);
  if (strengths.length) {
    const lead = strengths.join(" and ");
    const w = weak[0] ? CONFIG[weak[0].t].down : null;
    return cap(w ? `${lead}, offset by ${w}.` : `${lead}.`);
  }

  /* No theme clears its strong bar — lead honestly with the concern(s)
     rather than manufacture a strength. */
  if (weak[0]) {
    const w1 = CONFIG[weak[0].t].down;
    const w2 = weak[1] ? CONFIG[weak[1].t].down : null;
    return w2 ? `Held back by ${w1} and ${w2}.` : `Held back by ${w1}.`;
  }

  /* Everything sits in the neutral middle — no honest specific to lead with. */
  return null;
}
