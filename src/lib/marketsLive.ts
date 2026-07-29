/* ════════════════════════════════════════════════════════════════
   LOCATION INTELLIGENCE — curated prose, live numbers.

   MARKETS is a hand-written registry. Its prose (what a corridor is,
   who it suits, where it's headed) is editorial and stays. Its numbers
   were editorial too, and they had drifted:

     corridor        page said   pipeline says
     Dwarka Expy     ₹12,000     ₹18,250      −34%
     Sohna            ₹8,500     ₹12,500      −32%
     New Gurgaon     ₹10,000     ₹13,233      −24%
     GCE             ₹18,000     ₹21,550      −16%
     SPR             ₹13,500     ₹15,250      −11%
     GCR             ₹26,000     ₹27,500       −5%

   Every one understated, on the three surfaces that read the registry:
   the locations index, each corridor profile, and every market-vs-market
   comparison. A buyer who read "Dwarka averages ₹12,000" and then opened
   a Dwarka project report quoting ₹18,250 was reading the same site
   contradict itself by a third.

   This module resolves the registry against the pipeline at build time
   and returns the SAME MarketIntel shape, so every consumer renders
   unchanged. Backend unreachable → the curated values stand.
   ════════════════════════════════════════════════════════════════ */

import { MARKETS, type MarketIntel } from "./markets";
import { corridorKey } from "./journey";
import {
  fetchBacklogFull,
  fetchCorridorFiledPsf,
  fetchMarketIntel,
  type LiveBacklogFull,
  type LiveMarketIntel,
} from "./supabase";

/* The live-only facts a corridor carries that the curated registry has no
   field for. Kept beside MarketIntel rather than inside it so the curated
   type stays honest about what is hand-written. */
export type MarketLiveExtras = {
  potential: number | null; // pipeline's micro-market score /100
  cagrConfidence: string | null;
  supplyPressure: string | null;
  supplyReasoning: string | null;
  risks: string[];
  drivers: string[];
  asOf: string | null;
  projects: LiveBacklogFull[]; // the tracked projects in this corridor, best first
};

export type ResolvedMarket = { m: MarketIntel; live: MarketLiveExtras | null };

const cr = (v: number) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);

/* "₹1.9–15 Cr" from what the corridor's tracked projects actually start at.
   The curated bands were as far out as the rates: Dwarka read "₹1.5–6 Cr"
   against a live 1.92–15. */
function ticketBand(rows: LiveBacklogFull[]): string | null {
  const p = rows.map((r) => r.minPriceCr).filter((x): x is number => typeof x === "number" && x > 0);
  if (p.length < 3) return null; // too thin to describe a corridor
  const lo = cr(Math.min(...p)), hi = cr(Math.max(...p));
  /* U+2011, a NON-BREAKING hyphen. In the corridor profile's four-up stat
     grid this string is wider than its column at every mobile width, and a
     normal dash let the browser break inside the number — "₹1.9-" on one
     line and "15 Cr" on the next, which reads as two prices. It now breaks
     before the unit instead. */
  return lo === hi ? `₹${lo} Cr` : `₹${lo}‑${hi} Cr`;
}

/* The pipeline estimates a five-year CAGR per corridor, with a confidence
   and a written basis. The registry field it replaces was a three-year
   band, so the label moves with the number — see the call sites. */
const cagrText = (l: LiveMarketIntel): string | null =>
  l.cagr5y != null ? `${l.cagr5y.toFixed(1)}%` : null;

function overlay(m: MarketIntel, l: LiveMarketIntel | undefined, rows: LiveBacklogFull[], filed: { low: number; high: number; n: number } | undefined): ResolvedMarket {
  if (!l && !rows.length) return { m, live: null };

  const avg = l?.avgPsf ?? m.psf.avg;
  /* low/high come from the projects' own filed rate bands; avg from the
     corridor rate the pipeline publishes. Two sources, so the band is
     clamped to contain the average no matter which one wins: Sohna took a
     live ₹12,500 average with a curated ₹7,000–10,500 band and printed an
     average outside its own range. A single filed project is one project,
     not a corridor, so two is the floor for using them. */
  const useFiled = !!filed && filed.n >= 2;
  const low = Math.min(useFiled ? filed!.low : m.psf.low, avg);
  const high = Math.max(useFiled ? filed!.high : m.psf.high, avg);

  return {
    m: {
      ...m,
      projectCount: rows.length || m.projectCount,
      psf: { low, avg, high },
      unitBand: ticketBand(rows) ?? m.unitBand,
      appreciation3Y: (l && cagrText(l)) ?? m.appreciation3Y,
      projectNames: rows.length
        ? rows
            .slice()
            .sort((a, b) => (b.truthScore ?? 0) - (a.truthScore ?? 0))
            .slice(0, 4)
            .map((r) => r.name)
        : m.projectNames,
    },
    live: l || rows.length
      ? {
          potential: l?.potential ?? null,
          cagrConfidence: l?.cagrConfidence ?? null,
          supplyPressure: l?.supplyPressure ?? null,
          supplyReasoning: l?.supplyReasoning ?? null,
          risks: l?.risks ?? [],
          drivers: l?.drivers ?? [],
          asOf: l?.asOf ?? null,
          projects: rows.slice().sort((a, b) => (b.truthScore ?? 0) - (a.truthScore ?? 0)),
        }
      : null,
  };
}

let cache: ResolvedMarket[] | undefined;

export async function resolveMarkets(): Promise<ResolvedMarket[]> {
  if (cache !== undefined) return cache;
  const [intel, rows, filed] = await Promise.all([fetchMarketIntel(), fetchBacklogFull(), fetchCorridorFiledPsf()]);

  const byCorridor: Record<string, LiveBacklogFull[]> = {};
  for (const r of rows ?? []) {
    const k = corridorKey(r.microMarket ?? r.location ?? "");
    (byCorridor[k] ??= []).push(r);
  }

  cache = MARKETS.map((m) => {
    const k = corridorKey(m.name);
    return overlay(m, intel?.[k], byCorridor[k] ?? [], filed[k]);
  });
  const wired = cache.filter((r) => r.live).length;
  console.log(`[markets] ${wired}/${cache.length} corridor(s) resolved against the pipeline`);
  return cache;
}

export async function resolveMarketBySlug(slug: string): Promise<ResolvedMarket | undefined> {
  return (await resolveMarkets()).find((r) => r.m.slug === slug);
}

/* The index is a client component — sending it the full backlog rows for
   six corridors would ship ~90 wide rows down the RSC payload for three
   numbers. This is the lean shape it actually renders. */
export type MarketCard = MarketIntel & {
  potential: number | null;
  supplyPressure: string | null;
  cagrConfidence: string | null;
};

export async function marketCards(): Promise<MarketCard[]> {
  return (await resolveMarkets()).map(({ m, live }) => ({
    ...m,
    potential: live?.potential ?? null,
    supplyPressure: live?.supplyPressure ?? null,
    cagrConfidence: live?.cagrConfidence ?? null,
  }));
}

/* Corridors the pipeline tracks that have NO curated profile yet. The
   locations index used to list all eight coverage chips including the six
   already profiled above them, so the two that were genuinely new were
   indistinguishable from the repeats. */
export async function uncoveredMarkets(): Promise<{ name: string; count: number }[]> {
  const [intel, rows] = await Promise.all([fetchMarketIntel(), fetchBacklogFull()]);
  if (!intel) return [];
  const profiled = new Set(MARKETS.map((m) => corridorKey(m.name)));
  const counts: Record<string, number> = {};
  for (const r of rows ?? []) {
    const k = corridorKey(r.microMarket ?? r.location ?? "");
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return Object.values(intel)
    .filter((l) => !profiled.has(l.key))
    .map((l) => ({ name: l.name, count: counts[l.key] ?? 0 }))
    .sort((a, b) => b.count - a.count);
}
