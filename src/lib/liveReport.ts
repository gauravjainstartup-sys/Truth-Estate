/* ════════════════════════════════════════════════════════════════
   LIVE REPORT — the FETCH-BOUND half of the live→report layer.

   The pure adapter (liveProjectIntel, toMatchInput, matchKey and every
   helper) moved to reportAdapter.ts, which imports NO Node-only code and
   so runs in the browser too (the live-data overlay). This module keeps
   only what needs the Supabase READERS — buildLiveCatalog / buildLiveMarket
   — and re-exports liveProjectIntel / toMatchInput so every existing
   `from "@/lib/liveReport"` import keeps working unchanged.

   Working agreement: during DB integration we never add or restyle UI
   components; the data adapts to the UI, not the other way round.
   ════════════════════════════════════════════════════════════════ */

import { fetchBacklogFull, fetchBacklogNameIds, fetchConfigurations, fetchCorridorPsf, fetchExtendedDetails } from "./supabase";
import { buildMarket, type MarketContext, type MatchInput } from "./matchEngine";
import type { ProjectIntel } from "./projects";
import { liveProjectIntel, matchKey } from "./reportAdapter";

/* re-exported so callers keep importing these from "@/lib/liveReport" */
export { liveProjectIntel, toMatchInput } from "./reportAdapter";

/* The full live tracked universe as ProjectIntel (each carrying matchInput) —
   the single builder for the catalog route and the market context. */
export async function buildLiveCatalog(): Promise<ProjectIntel[]> {
  const [rows, ext, cfg, nameIds, corridorPsf] = await Promise.all([
    fetchBacklogFull(), fetchExtendedDetails(), fetchConfigurations(), fetchBacklogNameIds(), fetchCorridorPsf(),
  ]);
  const seen = new Set<string>();
  const out: ProjectIntel[] = [];
  for (const r of rows ?? []) {
    const eKey = matchKey(r.id, r.name, ext, nameIds, r.altIds);
    const cKey = matchKey(r.id, r.name, cfg, nameIds, r.altIds);
    const intel = liveProjectIntel(r, eKey ? ext![eKey] : null, cKey ? cfg![cKey] : null, corridorPsf);
    if (!intel.slug || seen.has(intel.slug)) continue;
    seen.add(intel.slug);
    out.push(intel);
  }
  return out;
}

/* Corpus market context (corridor×bucket price medians + centroids) for the
   entry-price and location-distance factors. Built once over the catalog. */
export async function buildLiveMarket(): Promise<MarketContext> {
  const catalog = await buildLiveCatalog();
  return buildMarket(catalog.map((p) => p.matchInput).filter((m): m is MatchInput => !!m));
}
