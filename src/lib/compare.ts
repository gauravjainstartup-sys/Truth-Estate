/* ════════════════════════════════════════════════════════════════
   COMPARE — side-by-side intelligence for any two like things.
   Pairs are enumerated statically (project↔project, developer↔
   developer, market↔market) so every comparison gets a real,
   prerendered URL. Slugs are canonicalised (sorted) so A-vs-B and
   B-vs-A resolve to one page.

   Projects run on the LIVE tracked set (backlog_listing_public_v3):
   the picker + prerendered pairs are built at build time from the
   scored rows, and each project pair resolves through the same
   liveProjectIntel adapter the live report pages use — no curated
   sample data. Developers and markets stay on their curated
   registries (developerBySlug / marketBySlug). Project pairs are
   resolved asynchronously in the route (they need the live rows),
   so resolvePair() here covers developer/market only.
   ════════════════════════════════════════════════════════════════ */

import { DEVELOPERS, developerBySlug, type DeveloperIntel } from "./developers";
import { MARKETS, marketBySlug, type MarketIntel } from "./markets";
import type { ProjectIntel } from "./projects";

export type CompareKind = "project" | "developer" | "market";

const SEP = "-vs-";

export const comparePairSlug = (aSlug: string, bSlug: string): string =>
  [aSlug, bSlug].sort().join(SEP);

export function pairsOf(slugs: string[]): string[] {
  const s = [...slugs].sort();
  const out: string[] = [];
  for (let i = 0; i < s.length; i++)
    for (let j = i + 1; j < s.length; j++) out.push(`${s[i]}${SEP}${s[j]}`);
  return out;
}

export function splitPair(pair: string): [string, string] | null {
  const parts = pair.split(SEP);
  return parts.length === 2 ? [parts[0], parts[1]] : null;
}

/* The subset of `pairs` whose BOTH slugs are real live projects — i.e. the
   compare pages that will actually build and resolve this run. The route
   (generateStaticParams + resolution) and the sitemap both filter through this
   against the SAME backlog rows, so the sitemap can never list a pair that
   wasn't built. That invariant matters: the deploy regenerates redirects.conf
   from the sitemap and refuses to ship a 301 whose target isn't a built file,
   so a sitemap listing an unbuilt pair fails the deploy. */
export function resolvableProjectPairs(pairs: Iterable<string>, projectSlugs: Iterable<string>): string[] {
  const have = new Set(projectSlugs);
  const out: string[] = [];
  for (const p of pairs) {
    const sp = splitPair(p);
    if (sp && have.has(sp[0]) && have.has(sp[1])) out.push(p);
  }
  return out;
}

/* ── Live project set ───────────────────────────────────────────────
   The compare picker offers the scored tracked projects (real Truth
   Score), highest first. On a static export every offered pair must be
   prerendered, so the set is capped to keep the build bounded; the cap
   sits well above the current corpus, so today every scored project is
   comparable. */
export const PROJECT_COMPARE_CAP = 40;

export type LiveCompareRow = { slug: string; name: string; truthScore: number | null };
export type ProjectCompareOption = { slug: string; name: string; score: number };

export function scoredProjectOptions(
  rows: LiveCompareRow[] | null | undefined,
  cap = PROJECT_COMPARE_CAP,
): ProjectCompareOption[] {
  return (rows ?? [])
    .filter((r): r is LiveCompareRow & { truthScore: number } => typeof r.truthScore === "number" && r.truthScore > 0)
    .sort((a, b) => b.truthScore - a.truthScore)
    .slice(0, cap)
    .map((r) => ({ slug: r.slug, name: r.name, score: r.truthScore }));
}

/* every prerendered project pair among the scored/capped set */
export const projectComparePairs = (opts: { slug: string }[]): string[] =>
  pairsOf(opts.map((o) => o.slug));

/* developer/market pairs — curated registries, fully real */
export const DEV_PAIRS: string[] = pairsOf(DEVELOPERS.map((d) => d.slug));
export const MARKET_PAIRS: string[] = pairsOf(MARKETS.map((m) => m.slug));

export type ResolvedCompare =
  | { kind: "project"; a: ProjectIntel; b: ProjectIntel }
  | { kind: "developer"; a: DeveloperIntel; b: DeveloperIntel }
  | { kind: "market"; a: MarketIntel; b: MarketIntel };

/* Developer/market pairs resolve synchronously off the curated registries.
   Project pairs need the live rows, so they're resolved in the route. */
export function resolvePair(pair: string): ResolvedCompare | null {
  const sp = splitPair(pair);
  if (!sp) return null;
  const [x, y] = sp;

  const da = developerBySlug(x), db = developerBySlug(y);
  if (da && db) return { kind: "developer", a: da, b: db };

  const ma = marketBySlug(x), mb = marketBySlug(y);
  if (ma && mb) return { kind: "market", a: ma, b: mb };

  return null;
}

/* THE SAME TWO REGISTRIES, RESOLVED AGAINST THE PIPELINE.
   Comparison is where a stale number does the most damage: a reader
   picks a winner from it. Before this, "DLF vs Godrej" scored 92% vs 90%
   on-time off the hand-written dossiers when the filings say 84% vs 37%
   — the comparison did not merely mislead, it inverted. Markets were the
   same story on price: Dwarka Expressway was compared at ₹12,000/sq ft
   against a live ₹18,250. Same shape out, so ComparePage is untouched. */
export async function resolvePairLive(pair: string): Promise<ResolvedCompare | null> {
  const sp = splitPair(pair);
  if (!sp) return null;
  const [x, y] = sp;

  const { resolveDeveloperBySlug } = await import("./developersLive");
  const [da, db] = await Promise.all([resolveDeveloperBySlug(x), resolveDeveloperBySlug(y)]);
  if (da && db) return { kind: "developer", a: da, b: db };

  const { resolveMarketBySlug } = await import("./marketsLive");
  const [ma, mb] = await Promise.all([resolveMarketBySlug(x), resolveMarketBySlug(y)]);
  if (ma && mb) return { kind: "market", a: ma.m, b: mb.m };

  return null;
}

export const compareTitle = (r: ResolvedCompare): string => `${r.a.name} vs ${r.b.name}`;

/* Picker entries for the developer/market kinds (project kind is fed live) */
export const COMPARE_OPTIONS: Record<"developer" | "market", { slug: string; name: string }[]> = {
  developer: DEVELOPERS.map((d) => ({ slug: d.slug, name: d.name })),
  market: MARKETS.map((m) => ({ slug: m.slug, name: m.name })),
};

/* Curated "popular" pairs for developers & markets (real). Popular project
   pairs are derived from the live scored set in the picker component. */
export const POPULAR_COMPARISONS: { label: string; pair: string; kind: CompareKind }[] = [
  { label: "DLF vs Godrej", pair: comparePairSlug("dlf", "godrej"), kind: "developer" },
  { label: "M3M vs Birla Estates", pair: comparePairSlug("m3m", "birla"), kind: "developer" },
  { label: "Golf Course Extension vs SPR", pair: comparePairSlug("golf-course-extension", "spr"), kind: "market" },
  { label: "Dwarka Expressway vs SPR", pair: comparePairSlug("dwarka-expressway", "spr"), kind: "market" },
  { label: "Golf Course Road vs Golf Course Extension", pair: comparePairSlug("golf-course-road", "golf-course-extension"), kind: "market" },
];
