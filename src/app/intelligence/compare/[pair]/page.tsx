import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchBacklogFull,
  fetchExtendedDetails,
  fetchConfigurations,
  fetchBacklogNameIds,
  fetchCorridorPsf,
  type LiveBacklogFull,
  type LiveConfiguration,
  type LiveExtendedDetails,
} from "@/lib/supabase";
import { liveProjectIntel } from "@/lib/liveReport";
import { trackedRankOf } from "@/lib/projects";
import {
  DEV_PAIRS,
  MARKET_PAIRS,
  resolvePairLive,
  compareTitle,
  scoredProjectOptions,
  projectComparePairs,
  resolvableProjectPairs,
  splitPair,
  type ResolvedCompare,
} from "@/lib/compare";
import ComparePage from "@/components/intelligence/ComparePage";
import { INDEXABLE_COMPARE_PAIRS } from "@/lib/indexableCompares";
import { IS_PRODUCTION_ORIGIN } from "@/lib/site";
import { breadcrumbLd, ldJson } from "@/lib/seo";

/* Project comparisons run on the LIVE tracked set (backlog_listing_public_v3):
   the scored rows define the picker AND the prerendered pairs, and each project
   resolves through the same liveProjectIntel adapter the live report pages use.
   Developer/market pairs resolve synchronously off the curated registries. The
   backlog + join tables are fetched once per build (fail-soft). */

let backlogCache: LiveBacklogFull[] | null | undefined;
async function backlog(): Promise<LiveBacklogFull[] | null> {
  if (backlogCache === undefined) backlogCache = await fetchBacklogFull();
  return backlogCache;
}
let extCache: Record<string, LiveExtendedDetails> | null | undefined;
async function extended(): Promise<Record<string, LiveExtendedDetails> | null> {
  if (extCache === undefined) extCache = await fetchExtendedDetails();
  return extCache;
}
let cfgCache: Record<string, LiveConfiguration[]> | null | undefined;
async function configurations(): Promise<Record<string, LiveConfiguration[]> | null> {
  if (cfgCache === undefined) cfgCache = await fetchConfigurations();
  return cfgCache;
}
let nameIdCache: Record<string, string> | null | undefined;
async function backlogNameIds(): Promise<Record<string, string> | null> {
  if (nameIdCache === undefined) nameIdCache = await fetchBacklogNameIds();
  return nameIdCache;
}
async function liveScores(): Promise<number[]> {
  const rows = await backlog();
  return (rows ?? []).map((r) => r.truthScore).filter((s): s is number => typeof s === "number" && s > 0);
}

/* extended/config tables key on backlog_projects.id; join on the row id, else
   bridge through the project name (resolved per table) */
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

/* Resolve a live project pair → two rich ProjectIntels (the same shape the
   sample pair used, so ComparePage renders unchanged). Only pairs within the
   scored/capped set resolve — everything else falls through to dev/market. */
async function resolveProjectPair(pair: string): Promise<ResolvedCompare | null> {
  const sp = splitPair(pair);
  if (!sp) return null;
  const rows = await backlog();
  if (!rows) return null;
  /* Any two REAL tracked projects can be compared (not just the top-scored
     picker set): direct URLs to demand-proven pairs — the ones Google already
     ranks — must resolve, not 404. The pair is prerendered only if it's in the
     scored set OR the demand allowlist (see generateStaticParams). */
  const have = new Set(rows.map((r) => r.slug));
  if (!have.has(sp[0]) || !have.has(sp[1])) return null;
  const ra = rows.find((r) => r.slug === sp[0]);
  const rb = rows.find((r) => r.slug === sp[1]);
  if (!ra || !rb) return null;
  const [ext, cfg, nameIds, scores, corridorPsf] = [await extended(), await configurations(), await backlogNameIds(), await liveScores(), await fetchCorridorPsf()];
  const build = (row: LiveBacklogFull) => {
    const eK = lookupKey(row.id, row.name, ext, nameIds, row.altIds);
    const cK = lookupKey(row.id, row.name, cfg, nameIds, row.altIds);
    return {
      ...liveProjectIntel(row, eK ? ext![eK] : null, cK ? cfg![cK] : null, corridorPsf),
      trackedRank: trackedRankOf(row.truthScore, scores),
    };
  };
  return { kind: "project", a: build(ra), b: build(rb) };
}

async function resolve(pair: string): Promise<ResolvedCompare | null> {
  return (await resolveProjectPair(pair)) ?? (await resolvePairLive(pair));
}

export async function generateStaticParams() {
  const rows = await backlog();
  /* The default set: every pair among the top-scored projects (the picker
     offers these). PLUS the demand-proven pairs (INDEXABLE_COMPARE_PAIRS) that
     resolve to two real projects — these are the ones Google already ranks, so
     they get a real page even when a project sits outside the picker's cap.
     Deduped; the sitemap lists exactly the resolvable demand pairs. */
  const projectPairs = projectComparePairs(scoredProjectOptions(rows));
  const demandPairs = resolvableProjectPairs(INDEXABLE_COMPARE_PAIRS, (rows ?? []).map((r) => r.slug));
  const all = [...new Set([...projectPairs, ...demandPairs, ...DEV_PAIRS, ...MARKET_PAIRS])];
  console.log(`[urls] compare pairs → scored:${projectPairs.length} · demand:${demandPairs.length} · developers:${DEV_PAIRS.length} · markets:${MARKET_PAIRS.length} · total:${all.length}`);
  return all.map((pair) => ({ pair }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const r = await resolve(pair);
  if (!r) return { title: "Compare" };
  const title = compareTitle(r);
  return {
    title: `${title} — Compare`,
    description: `Independent side-by-side comparison of ${title}: measured on the same evidence — score, signals, delivery, pricing and outlook. No paid rankings.`,
    alternates: { canonical: `/intelligence/compare/${pair}` },
    /* Combinatorial pair pages (97 projects → thousands of near-identical
       A-vs-B permutations) are NOINDEX by default — Google collapses them as
       "duplicate, chose different canonical", they earn no individual ranking,
       and at scale they dilute the site's quality signal. The exception is
       INDEXABLE_COMPARE_PAIRS: pairs that ALREADY earned search impressions
       (GSC Performance export) and so have proven demand — those get
       index:true and are listed in sitemap.xml. Every pair stays fully live
       for buyers, and `follow` lets equity flow to the two reports either way.
       Gated on IS_PRODUCTION_ORIGIN like the root robots, so a preview/branch
       build still ships every pair noindex (a page-level `robots` overrides the
       root's site-wide noindex, so without this gate the allowlist would leak
       into the github.io preview's index). */
    robots: { index: IS_PRODUCTION_ORIGIN && INDEXABLE_COMPARE_PAIRS.has(pair), follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const r = await resolve(pair);
  if (!r) notFound();

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Compare", path: "/intelligence/compare" },
    { name: compareTitle(r), path: `/intelligence/compare/${pair}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <ComparePage r={r} />
    </>
  );
}
