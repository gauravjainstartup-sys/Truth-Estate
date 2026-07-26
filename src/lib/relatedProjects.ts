/* ════════════════════════════════════════════════════════════════
   COMPARABLE PROJECTS — computed at build time, rendered into the HTML.

   A locked report linked to exactly one project page: itself. Ninety-seven
   commercial pages with no links between them is not a small SEO
   inefficiency — internal links are how authority moves through a site and
   how a crawler learns that these pages belong to one another. A sitemap
   gets them discovered; it does not get them related.

   The alternatives that already exist on an UNLOCKED report render inside
   the paid branch, so they were never in the static HTML a crawler reads.
   This is the free-tier version of the same idea: names, corridor and
   score, which are all free anyway, as real links.

   Build time, deliberately. Anything computed in the browser is invisible
   to the crawler and would have been the same bug wearing a different hat.
   ════════════════════════════════════════════════════════════════ */
import type { LiveBacklogFull } from "./supabase";

export type RelatedProject = {
  name: string;
  seoSlug: string;
  microMarket: string | null;
  truthScore: number | null;
};

const RELATED_COUNT = 6;

/* Same corridor first — that is the comparison a buyer is actually
   making, and the cluster search should learn. Then the nearest scores
   anywhere, so a project in a thin corridor still gets a full set of
   links rather than one. */
export function relatedProjects(
  current: { seoSlug: string; microMarket: string | null; truthScore: number | null },
  all: LiveBacklogFull[] | null,
): RelatedProject[] {
  if (!all?.length) return [];
  const others = all.filter((r) => r.seoSlug && r.seoSlug !== current.seoSlug && r.name);

  const sameCorridor = current.microMarket
    ? others.filter((r) => r.microMarket === current.microMarket)
    : [];

  const score = current.truthScore ?? 0;
  const byCloseness = (a: LiveBacklogFull, b: LiveBacklogFull) =>
    Math.abs((a.truthScore ?? 0) - score) - Math.abs((b.truthScore ?? 0) - score);

  const picked: LiveBacklogFull[] = [...sameCorridor].sort(byCloseness).slice(0, RELATED_COUNT);
  if (picked.length < RELATED_COUNT) {
    const have = new Set(picked.map((r) => r.seoSlug));
    for (const r of [...others].sort(byCloseness)) {
      if (picked.length >= RELATED_COUNT) break;
      if (!have.has(r.seoSlug)) { picked.push(r); have.add(r.seoSlug); }
    }
  }

  return picked.map((r) => ({
    name: r.name,
    seoSlug: r.seoSlug,
    microMarket: r.microMarket,
    truthScore: r.truthScore ?? null,
  }));
}
