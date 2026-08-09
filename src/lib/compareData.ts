/* ════════════════════════════════════════════════════════════════
   COMPARE DATA — the full ProjectIntel for every scored project, built
   once per deploy from the SAME sources and adapter the compare pair
   pages use (backlog_listing_public_v3 + project_extended_details +
   project_configurations → liveProjectIntel).

   Why this exists: the compare picker offers all scored projects, but a
   static export can only prerender a bounded number of A-vs-B pages
   (PROJECT_COMPARE_CAP pairs). Any pair OUTSIDE that set is rendered
   client-side on /intelligence/compare/live, which reads this index and
   feeds ComparePage the two ProjectIntels — no per-pair prerender, so
   every project (and every future one) is comparable with zero build
   growth. The data is the SAME build snapshot the prerendered pairs use,
   so a live and a prerendered comparison read identically.

   Server-only: pulls supabase.ts (fixture/fs path). Consumed by the
   compare-index.json route; never import from a client component.
   ════════════════════════════════════════════════════════════════ */

import {
  fetchBacklogFull,
  fetchExtendedDetails,
  fetchConfigurations,
  fetchBacklogNameIds,
  fetchCorridorPsf,
  type LiveExtendedDetails,
  type LiveConfiguration,
} from "./supabase";
import { liveProjectIntel } from "./liveReport";
import { trackedRankOf, type ProjectIntel } from "./projects";
import { scoredProjectOptions } from "./compare";

/* extended/config tables key on backlog_projects.id; join on the row id, else
   bridge through the project name (resolved per table) — mirrors the [pair]
   route's lookupKey exactly so the intel matches the prerendered pairs. */
function lookupKey<T>(
  rowId: string,
  name: string,
  table: Record<string, T> | null,
  nameIds: Record<string, string> | null,
  altIds: string[] = [],
): string | null {
  if (!table) return null;
  if (table[rowId] !== undefined) return rowId;
  for (const a of altIds) if (table[a] !== undefined) return a;
  const alt = nameIds?.[name];
  return alt && table[alt] !== undefined ? alt : null;
}

/* slug → full ProjectIntel for every scored tracked project (highest first).
   Fail-soft: a missing backlog fetch yields an empty map, and the compare-live
   page falls back to a "couldn't load" state — never a broken render. */
export async function buildScoredProjectIntel(): Promise<Record<string, ProjectIntel>> {
  const [rows, ext, cfg, nameIds, corridorPsf] = await Promise.all([
    fetchBacklogFull(),
    fetchExtendedDetails(),
    fetchConfigurations(),
    fetchBacklogNameIds(),
    fetchCorridorPsf(),
  ]);
  const all = rows ?? [];
  const scores = all
    .map((r) => r.truthScore)
    .filter((s): s is number => typeof s === "number" && s > 0);
  // every scored project (uncapped), sorted by score — the picker's universe
  const opts = scoredProjectOptions(rows, Number.POSITIVE_INFINITY);

  const extMap = ext as Record<string, LiveExtendedDetails> | null;
  const cfgMap = cfg as Record<string, LiveConfiguration[]> | null;

  const out: Record<string, ProjectIntel> = {};
  for (const o of opts) {
    const row = all.find((r) => r.slug === o.slug);
    if (!row) continue;
    const eK = lookupKey(row.id, row.name, extMap, nameIds, row.altIds);
    const cK = lookupKey(row.id, row.name, cfgMap, nameIds, row.altIds);
    const intel: ProjectIntel = {
      ...liveProjectIntel(row, eK ? extMap![eK] : null, cK ? cfgMap![cK] : null, corridorPsf),
      trackedRank: trackedRankOf(row.truthScore, scores),
    };
    // The comparison view never reads these heavy blobs (the developer dossier,
    // the legal audit, the match-engine inputs) — roiModel reads liveRoi, which
    // stays.
    delete intel.liveDeveloper;
    delete intel.liveLegal;
    delete intel.matchInput;
    // ops is ~90% of the weight, almost all of it in location (geo POIs), the
    // USP cards and the media manifest — none of which the comparison reads. It
    // uses only ops.homes / units / address / construction / price. Trimming the
    // rest takes each project from ~14KB to ~3KB (index ~2MB → ~300KB).
    if (intel.ops) {
      delete intel.ops.location;
      delete intel.ops.usps;
      delete intel.ops.media;
    }
    out[o.slug] = intel;
  }
  return out;
}
