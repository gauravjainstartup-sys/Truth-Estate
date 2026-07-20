/* ════════════════════════════════════════════════════════════════
   SHORTLIST DERIVATIONS — the personalised copy on the #1 match.

   Everything here is computed from the buyer's own brief against the
   project data we already hold. We only claim what the data supports:
   a fit point appears only when it's true, and the "beats your #2"
   line names the single strongest real differentiator. No fabrication.
   ════════════════════════════════════════════════════════════════ */

import type { ProjectIntel } from "./projects";
import { rankCore } from "./journey";
import type { BuyData, DNA } from "./journey";

/* Rank the LIVE catalog (ProjectIntel from match-catalog.json) with the same
   heuristic the mock shortlist uses — so the standalone /shortlist ranks the
   real tracked universe instead of the ten hand-curated projects. The items
   already ARE ProjectIntel, so ShortlistCore consumes them directly (no
   projectByName lookup). Same weights, same relative matchPct as rankProjects. */
export type RankedIntel = ProjectIntel & { matchPct: number };

export function rankProjectsIntel(d: BuyData, catalog: ProjectIntel[]): RankedIntel[] {
  return rankCore(catalog, d);
}

type Pt = { weight: number; text: string };

/* Ranked reasons this project fits the buyer; the page shows the top 2. */
export function fitPoints(p: ProjectIntel, buy: BuyData, dna: DNA): string[] {
  const pts: Pt[] = [];
  const [lo, hi] = p.budget;

  // budget band
  if (buy.budgetCr >= lo - 1 && buy.budgetCr <= hi + 2)
    pts.push({ weight: 6, text: `Sits inside your ${dna.budgetRange} budget` });

  // corridor
  if (buy.locations.length && buy.locations.includes(p.market))
    pts.push({ weight: 5, text: `In ${p.marketShort} — a corridor you shortlisted` });

  // configuration
  const cfg = buy.configs.filter((c) => c !== "Flexible" && p.configs.includes(c));
  if (cfg.length) pts.push({ weight: 4, text: `Offers your ${cfg.join(" / ")}` });

  // priority alignment — the strongest priority this project genuinely serves
  const served = buy.priorities.filter((t) => p.tags.includes(t));
  if (served.length) pts.push({ weight: 5, text: `Strong on ${served[0].toLowerCase()}` });

  // possession preference
  if (buy.possession === "ready-to-move" && /ready|possession/i.test(`${p.recommendation} ${p.reason}`))
    pts.push({ weight: 3, text: "Ready to move — matches your timeline" });

  // quality floor — always true, lowest weight so it only surfaces as a filler
  pts.push({ weight: 1, text: `Truth Score ${p.truthScore}/100, independently scored` });

  return pts.sort((a, b) => b.weight - a.weight).map((x) => x.text);
}

/* The single strongest way #1 beats #2, from real signals — a bare phrase
   meant to follow "Beats your #2 on …", so it never repeats "your #2". */
export function beatsReason(top: ProjectIntel, second: ProjectIntel): string {
  const unique = top.tags.filter((t) => !second.tags.includes(t));
  const delta = top.truthScore - second.truthScore;

  if (unique.includes("On-Time Delivery")) return "a stronger delivery record";
  if (unique.includes("Liquidity")) return "better resale liquidity";
  if (unique.includes("Developer Reputation")) return "a more proven developer";
  if (unique.includes("Legal Safety")) return "a cleaner legal profile";
  if (delta >= 1) return `a higher Truth Score — by ${delta}`;
  if (unique.length) return unique[0].toLowerCase();
  return "a stronger all-round fit";
}

/* Collapsed brief summary: the three headline chips + "+N more". */
export function briefChips(dna: DNA): string[] {
  return [
    dna.budgetRange,
    dna.config === "Flexible" ? "Flexible config" : dna.config,
    dna.markets.join(" · "),
    dna.timeline,
    `Risk · ${dna.risk}`,
    ...(dna.topPriorities[0] && dna.topPriorities[0] !== "To be discovered together"
      ? [dna.topPriorities.slice(0, 2).join(" · ")]
      : []),
  ].filter(Boolean);
}
