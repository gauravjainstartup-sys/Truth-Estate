/* ════════════════════════════════════════════════════════════════
   COVERAGE STATS — build-time counts for the home "Our Focus" band.

   Each count is read from the SAME source its dedicated page uses, so
   the band always agrees with the rest of the site and grows on its own
   as data is added — no hand-editing the home page:

     • Projects Analysed  → the scored backlog (the omnibox / report set)
     • Developers Covered → the developers index (/intelligence/developers)
     • Micro Markets      → the micro-market table (/intelligence markets)

   "Intelligence Signals" is the one figure with no underlying dataset:
   it states how many structured signals the forensic pipeline evaluates
   per project (a methodology claim, not a row count), so it lives here
   as a single named constant.
   ════════════════════════════════════════════════════════════════ */
import { fetchBacklogFull, fetchMicroMarkets } from "@/lib/supabase";
import { resolveDevelopers } from "@/lib/developersLive";

/* Methodology depth per project. Not row-derived — see note above.
   Consistent with the unlock copy ("150+ signals / 150+ checks",
   src/components/intelligence/UnlockModal.tsx). */
export const INTELLIGENCE_SIGNALS = 150;

export type CoverageStats = {
  projects: number;
  signals: number;
  developers: number;
  markets: number;
};

export async function buildCoverageStats(): Promise<CoverageStats> {
  const [rows, developers, markets] = await Promise.all([
    fetchBacklogFull(),
    resolveDevelopers(), // the same merged, zero-project-filtered set the /developers page renders
    fetchMicroMarkets(),
  ]);

  const analysed = (rows ?? []).filter(
    (r) => typeof r.truthScore === "number" && (r.truthScore ?? 0) > 0,
  );

  // Fail-soft to the last-known coverage per metric: the band is decorative,
  // so a missing source is never allowed to blank or zero it.
  return {
    projects: analysed.length || 100,
    signals: INTELLIGENCE_SIGNALS,
    developers: developers.length || 18,
    markets: markets?.length || 8,
  };
}
