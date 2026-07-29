/* ════════════════════════════════════════════════════════════════
   DEVELOPER DOSSIERS — curated prose, filed ledger.

   What a builder is known for is editorial. How many buildings it has
   actually handed over is not, and the hand-written numbers had drifted
   from the pipeline that scores every project on this site:

     developer   dossier said        developers_overview says
     DLF         92% on-time / 38    84% / 31
     Godrej      90% / 22            37% / 1
     M3M         74% / 18            55% / 15
     Birla       85% / 4             22% / 2
     Smartworld  80% / 1             60% / 3
     Emaar       —                   68% / 13

   Every error flattered the builder, and the project reports — which
   read the same filings — contradicted the dossiers on the same site.

   One resolver, three consumers: the developers index, each dossier,
   and every developer-vs-developer comparison. Returns the SAME
   DeveloperIntel shape, so the UI renders unchanged; backend
   unreachable → the curated values stand.
   ════════════════════════════════════════════════════════════════ */

import { DEVELOPERS, type DeveloperIntel } from "./developers";
import { fetchDevelopersOverview, type LiveDeveloper } from "./supabase";

export function overlayDeveloper(curated: DeveloperIntel, live: LiveDeveloper[] | null | undefined): DeveloperIntel {
  const l = (live ?? []).find(
    (d) =>
      d.name.toLowerCase() === curated.name.toLowerCase() ||
      (d.slug ?? "").toLowerCase() === curated.slug.toLowerCase(),
  );
  if (!l) return curated;
  return {
    ...curated,
    performance: {
      ...curated.performance,
      launched: l.total ?? curated.performance.launched,
      delivered: l.delivered ?? curated.performance.delivered,
      ongoing: l.ongoing ?? curated.performance.ongoing,
      onTimePct: l.delayedPct != null ? Math.round(100 - l.delayedPct) : curated.performance.onTimePct,
      avgDelayMonths:
        l.avgDelayMonths != null ? Math.round(l.avgDelayMonths * 10) / 10 : curated.performance.avgDelayMonths,
    },
  };
}

let cache: DeveloperIntel[] | undefined;

export async function resolveDevelopers(): Promise<DeveloperIntel[]> {
  if (cache !== undefined) return cache;
  const live = await fetchDevelopersOverview();
  cache = DEVELOPERS.map((d) => overlayDeveloper(d, live));
  const wired = live ? cache.filter((d, i) => d.performance !== DEVELOPERS[i].performance).length : 0;
  console.log(`[developers] ${wired}/${cache.length} dossier(s) resolved against the filings`);
  return cache;
}

export async function resolveDeveloperBySlug(slug: string): Promise<DeveloperIntel | undefined> {
  return (await resolveDevelopers()).find((d) => d.slug === slug);
}
