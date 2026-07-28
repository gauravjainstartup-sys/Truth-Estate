/* ════════════════════════════════════════════════════════════════
   COMPARABLE PROJECTS — computed at build time, rendered into the HTML.

   A locked report linked to exactly one project page: itself. Ninety-seven
   commercial pages with no links between them is not a small SEO
   inefficiency — internal links are how authority moves through a site and
   how a crawler learns that these pages belong to one another. A sitemap
   gets them discovered; it does not get them related.

   Build time, deliberately. Anything computed in the browser is invisible
   to the crawler and would have been the same bug wearing a different hat.

   THREE GROUPS, because "what else should I look at" is three different
   questions and a buyer asks them in this order:

     the corridor   the comparison they are actually making, and the one
                    the cluster search should learn
     within 5 km    the same commute and the same schools, which often
                    means a different corridor name on the hoarding
     same ticket    what else that budget buys, anywhere in the city

   A project can appear in more than one group. That is correct — it means
   it is comparable on more than one axis, and de-duplicating across tabs
   would hide the strongest matches from two of the three.
   ════════════════════════════════════════════════════════════════ */
import type { LiveBacklogFull } from "./supabase";

export type RelatedProject = {
  name: string;
  seoSlug: string;
  microMarket: string | null;
  truthScore: number | null;
  /* set only on the nearby group — the reason THIS project is in THIS tab */
  km?: number;
  psf?: number | null;
};

export type RelatedGroups = {
  sameMarket: RelatedProject[];
  nearby: RelatedProject[];
  samePrice: RelatedProject[];
  /* every project across the three groups, deduped — what the page uses for
     its outbound-link count and what verify-out measures. */
  all: RelatedProject[];
};

const PER_GROUP = 6;
const NEAR_KM = 5;
/* ±12% of the project's own rate. Wider and "similar ticket" stops meaning
   anything in a market whose corridors run 8k to 40k per sq ft. */
const PRICE_BAND = 0.12;

/* Straight-line kilometres. Gurugram is 30km across, so the error against a
   road distance is not what decides whether two projects are comparable —
   being on the same side of the expressway is, and that is what 5km buys. */
function km(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const toCard = (r: LiveBacklogFull, extra?: Partial<RelatedProject>): RelatedProject => ({
  name: r.name!,
  seoSlug: r.seoSlug!,
  microMarket: r.microMarket,
  truthScore: r.truthScore ?? null,
  psf: r.avgCostSqft ?? null,
  ...extra,
});

export function relatedProjects(
  current: {
    seoSlug: string;
    microMarket: string | null;
    truthScore: number | null;
    latitude?: number | null;
    longitude?: number | null;
    avgCostSqft?: number | null;
  },
  all: LiveBacklogFull[] | null,
): RelatedGroups {
  const empty: RelatedGroups = { sameMarket: [], nearby: [], samePrice: [], all: [] };
  if (!all?.length) return empty;
  const others = all.filter((r) => r.seoSlug && r.seoSlug !== current.seoSlug && r.name);

  /* Closest score first inside every group. Two projects a buyer is choosing
     between should be roughly as good as each other — a 91 next to a 44 is
     not an alternative, it is a different decision. */
  const score = current.truthScore ?? 0;
  const byCloseness = (a: LiveBacklogFull, b: LiveBacklogFull) =>
    Math.abs((a.truthScore ?? 0) - score) - Math.abs((b.truthScore ?? 0) - score);

  const sameMarket = current.microMarket
    ? [...others.filter((r) => r.microMarket === current.microMarket)].sort(byCloseness).slice(0, PER_GROUP).map((r) => toCard(r))
    : [];

  const lat = current.latitude, lng = current.longitude;
  const nearby =
    lat != null && lng != null && lat !== 0
      ? others
          .flatMap((r) => {
            if (r.latitude == null || r.longitude == null || r.latitude === 0) return [];
            const d = km(lat, lng, r.latitude, r.longitude);
            return d <= NEAR_KM ? [{ r, d }] : [];
          })
          .sort((a, b) => a.d - b.d)
          .slice(0, PER_GROUP)
          .map(({ r, d }) => toCard(r, { km: Math.round(d * 10) / 10 }))
      : [];

  const psf = current.avgCostSqft;
  const samePrice =
    psf != null && psf > 0
      ? others
          .filter((r) => r.avgCostSqft != null && r.avgCostSqft > 0 && Math.abs(r.avgCostSqft - psf) / psf <= PRICE_BAND)
          .sort((a, b) => Math.abs((a.avgCostSqft ?? 0) - psf) - Math.abs((b.avgCostSqft ?? 0) - psf))
          .slice(0, PER_GROUP)
          .map((r) => toCard(r))
      : [];

  /* A project in a thin corridor with no neighbours and no filed rate would
     otherwise link nowhere, which is the bug this file exists to fix. Top up
     from the nearest scores anywhere so every report keeps its links. */
  const seen = new Map<string, RelatedProject>();
  for (const c of [...sameMarket, ...nearby, ...samePrice]) if (!seen.has(c.seoSlug)) seen.set(c.seoSlug, c);
  if (seen.size < PER_GROUP) {
    for (const r of [...others].sort(byCloseness)) {
      if (seen.size >= PER_GROUP) break;
      if (!seen.has(r.seoSlug!)) seen.set(r.seoSlug!, toCard(r));
    }
  }

  return { sameMarket, nearby, samePrice, all: [...seen.values()] };
}
