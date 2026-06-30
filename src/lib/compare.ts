/* ════════════════════════════════════════════════════════════════
   COMPARE — side-by-side intelligence for any two like things.
   Pairs are enumerated statically (project↔project, developer↔
   developer, market↔market) so every comparison gets a real,
   prerendered URL. Slugs are canonicalised (sorted) so A-vs-B and
   B-vs-A resolve to one page.
   ════════════════════════════════════════════════════════════════ */

import { PROJECT_INTEL, type ProjectIntel } from "./projects";
import { DEVELOPERS, developerBySlug, type DeveloperIntel } from "./developers";
import { MARKETS, marketBySlug, type MarketIntel } from "./markets";

export type CompareKind = "project" | "developer" | "market";

const SEP = "-vs-";

export const comparePairSlug = (aSlug: string, bSlug: string): string =>
  [aSlug, bSlug].sort().join(SEP);

function pairsOf(slugs: string[]): string[] {
  const s = [...slugs].sort();
  const out: string[] = [];
  for (let i = 0; i < s.length; i++)
    for (let j = i + 1; j < s.length; j++) out.push(`${s[i]}${SEP}${s[j]}`);
  return out;
}

export const COMPARE_PAIRS: string[] = [
  ...pairsOf(PROJECT_INTEL.map((p) => p.slug)),
  ...pairsOf(DEVELOPERS.map((d) => d.slug)),
  ...pairsOf(MARKETS.map((m) => m.slug)),
];

function splitPair(pair: string): [string, string] | null {
  const parts = pair.split(SEP);
  return parts.length === 2 ? [parts[0], parts[1]] : null;
}

export type ResolvedCompare =
  | { kind: "project"; a: ProjectIntel; b: ProjectIntel }
  | { kind: "developer"; a: DeveloperIntel; b: DeveloperIntel }
  | { kind: "market"; a: MarketIntel; b: MarketIntel };

export function resolvePair(pair: string): ResolvedCompare | null {
  const sp = splitPair(pair);
  if (!sp) return null;
  const [x, y] = sp;

  const pa = PROJECT_INTEL.find((p) => p.slug === x), pb = PROJECT_INTEL.find((p) => p.slug === y);
  if (pa && pb) return { kind: "project", a: pa, b: pb };

  const da = developerBySlug(x), db = developerBySlug(y);
  if (da && db) return { kind: "developer", a: da, b: db };

  const ma = marketBySlug(x), mb = marketBySlug(y);
  if (ma && mb) return { kind: "market", a: ma, b: mb };

  return null;
}

export const compareTitle = (r: ResolvedCompare): string => `${r.a.name} vs ${r.b.name}`;

/* Curated entries for the index picker */
export const COMPARE_OPTIONS: Record<CompareKind, { slug: string; name: string }[]> = {
  project: PROJECT_INTEL.map((p) => ({ slug: p.slug, name: p.name })),
  developer: DEVELOPERS.map((d) => ({ slug: d.slug, name: d.name })),
  market: MARKETS.map((m) => ({ slug: m.slug, name: m.name })),
};

export const POPULAR_COMPARISONS: { label: string; pair: string; kind: CompareKind }[] = [
  { label: "DLF Arbour vs Godrej Aristocrat", pair: comparePairSlug("dlf-arbour", "godrej-aristocrat"), kind: "project" },
  { label: "M3M Golf Estate II vs Birla Navya", pair: comparePairSlug("m3m-golf-estate-ii", "birla-navya"), kind: "project" },
  { label: "DLF Privana South vs Godrej Aristocrat", pair: comparePairSlug("dlf-privana-south", "godrej-aristocrat"), kind: "project" },
  { label: "DLF vs Godrej", pair: comparePairSlug("dlf", "godrej"), kind: "developer" },
  { label: "M3M vs Birla Estates", pair: comparePairSlug("m3m", "birla"), kind: "developer" },
  { label: "Golf Course Extension vs SPR", pair: comparePairSlug("golf-course-extension", "spr"), kind: "market" },
  { label: "Dwarka Expressway vs SPR", pair: comparePairSlug("dwarka-expressway", "spr"), kind: "market" },
  { label: "Golf Course Road vs Golf Course Extension", pair: comparePairSlug("golf-course-road", "golf-course-extension"), kind: "market" },
];
