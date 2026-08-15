import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IS_PRODUCTION_ORIGIN } from "@/lib/site";
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
  scoredProjectOptions,
  projectComparePairs,
  splitPair,
  type ResolvedCompare,
} from "@/lib/compare";
import ComparePage from "@/components/intelligence/ComparePage";
import { breadcrumbLd, ldJson } from "@/lib/seo";

export const INDEXABLE_COMPARE_PAIRS = new Set([
  "dlf-the-arbour-vs-m3m-altitude",
  "m3m-capital-vs-smartworld-the-edition",
]);

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

async function scoredOpts() {
  return scoredProjectOptions(await backlog());
}

async function resolveProjectPair(pair: string): Promise<ResolvedCompare | null> {
  const sp = splitPair(pair);
  if (!sp) return null;
  const rows = await backlog();
  if (!rows) return null;
  const allowed = new Set((await scoredOpts()).map((o) => o.slug));
  if (!allowed.has(sp[0]) || !allowed.has(sp[1])) return null;
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
  const projectPairs = projectComparePairs(await scoredOpts());
  const all = [...projectPairs, ...DEV_PAIRS, ...MARKET_PAIRS];
  console.log(`[urls] compare pairs → projects:${projectPairs.length} · developers:${DEV_PAIRS.length} · markets:${MARKET_PAIRS.length}`);
  return all.map((pair) => ({ pair }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const r = await resolve(pair);
  if (!r) return { title: "Compare" };
  const title = `${r.a.name} vs ${r.b.name}`;
  const desc = `Independent side-by-side comparison of ${title}: measured on the same evidence — score, signals, delivery, pricing and outlook. No paid rankings.`;
  const isIndexable = INDEXABLE_COMPARE_PAIRS.has(pair);

  return {
    title: `${title} — Compare`,
    description: desc,
    alternates: { canonical: `/intelligence/compare/${pair}` },
    robots: IS_PRODUCTION_ORIGIN && isIndexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: `${title} — Compare`,
      description: desc,
      url: `/intelligence/compare/${pair}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Compare`,
      description: desc,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const r = await resolve(pair);
  if (!r) notFound();

  const title = `${r.a.name} vs ${r.b.name}`;
  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Compare", path: "/intelligence/compare" },
    { name: title, path: `/intelligence/compare/${pair}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <ComparePage r={r} />
    </>
  );
}
