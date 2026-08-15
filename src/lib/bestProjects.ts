/* ════════════════════════════════════════════════════════════════
   BEST-PROJECTS LANDING PAGES — the old site's /best-projects/ section,
   rebuilt against the live pipeline.

   These are not new pages. truthestate.in has been serving fifteen of
   them and they carry the rankings for the queries people actually type
   — "best projects in Gurugram under 3 Cr" is a search, "the tracked
   universe" is not. The crawl found them all unmatched, and the founder's
   call was to rebuild rather than redirect: a filtered view of the
   catalogue at its own address keeps the equity where it was earned.

   SEVEN, not fifteen. The other eight name a corridor —
   /best-projects/dwarka-expressway, /best-projects/golf-course-road —
   and those already redirect to the market page for that corridor, which
   is both where a corridor query belongs and the page already written
   for it. Rebuilding them here would put two of our own pages in front
   of Google for one query and let it choose.

   Each filter is a predicate over the live row, so a page is never
   hand-listed and cannot go stale: a project that drops below 3 Cr next
   quarter appears on the under-3-Cr page at the next build without
   anyone editing anything.
   ════════════════════════════════════════════════════════════════ */
import type { LiveBacklogFull } from "./supabase";

export type BestProjectsPage = {
  slug: string;
  /* The page's own words. Everything else on it — the grid, the search,
     the corridor chips, the cards — is the projects index verbatim. */
  h1: string;
  title: string;
  description: string;
  intro: string;
  match: (r: LiveBacklogFull) => boolean;
  /* THIS PAGE'S WHOLE CLAIM IS THE PRICE. Set on the four bands, and it
     makes the route drop any project whose listed price its own filed rate
     contradicts — see fetchPriceEnvelopes. Delphine Central Park Estates
     Phase 2 lists ₹2.8 Cr against filings whose cheapest possible flat is
     ₹11.88 Cr, and it was appearing under "₹3 Cr". The CAGR, delay and
     launch pages do not assert anything about price, so they are unaffected
     and still list it. */
  pricePage?: true;
};

/* REGISTRATION DATES ARRIVE IN TWO SHAPES. Most rows carry "25 Nov 2025",
   a handful carry "2024-07-01", and one carries nothing. Date.parse
   handles the first two inconsistently across runtimes, so the year is
   read directly and the month only when the format is recognised —
   a launch page that silently loses a third of its projects to a parsing
   difference is worse than one that rounds to the year. */
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
export function registeredAt(raw: string | null): Date | null {
  if (!raw) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const dmy = /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(raw);
  if (dmy) {
    const m = MONTHS[dmy[2].toLowerCase()];
    if (m != null) return new Date(Number(dmy[3]), m, Number(dmy[1]));
  }
  const y = /(19|20)\d{2}/.exec(raw);
  return y ? new Date(Number(y[0]), 0, 1) : null;
}

/* Twenty-four months, resolved once at build time. RERA registration is
   the only launch date the pipeline has, and it precedes the sales launch
   by a few months, so the window is generous on purpose. */
const LAUNCH_WINDOW_MONTHS = 24;
function recentlyRegistered(r: LiveBacklogFull): boolean {
  const d = registeredAt(r.registrationDate);
  if (!d) return false;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - LAUNCH_WINDOW_MONTHS);
  return d >= cutoff;
}

/* A ceiling on the ENTRY price, which is what a budget search means. A
   project whose smallest unit is 2.3 Cr belongs on the under-3-Cr page
   even though its penthouse is not; the reader is asking what they can
   get into, not what the developer's most expensive flat costs. */
const underCr = (cap: number) => (r: LiveBacklogFull) =>
  r.minPriceCr != null && r.minPriceCr > 0 && r.minPriceCr <= cap;

export const BEST_PROJECTS: BestProjectsPage[] = [
  {
    slug: "under-3-cr-gurugram",
    h1: "Best projects in Gurugram under ₹3 Cr.",
    title: "Best Projects in Gurugram Under ₹3 Cr — Scored",
    description:
      "Every tracked Gurugram project under ₹3 Cr, independently scored on delivery, legal health, developer strength, pricing & construction. No paid rankings.",
    intro:
      "Every project we track whose entry price sits under ₹3 Cr — each one carrying the same Truth Score, built from the same six audited inputs as the rest of the catalogue. No developer pays to appear here, and none can move a score.",
    match: underCr(3),
    pricePage: true,
  },
  {
    slug: "under-5-cr-gurugram",
    h1: "Best projects in Gurugram under ₹5 Cr.",
    title: "Best Projects in Gurugram Under ₹5 Cr — Scored",
    description:
      "Every tracked Gurugram project under ₹5 Cr, independently scored on delivery, RERA legal checks, developer health, and pricing. No paid rankings.",
    intro:
      "Every project we track whose entry price sits under ₹5 Cr — each one carrying the same Truth Score, built from the same six audited inputs as the rest of the catalogue. No developer pays to appear here, and none can move a score.",
    match: underCr(5),
    pricePage: true,
  },
  {
    slug: "under-8-cr-gurugram",
    h1: "Best projects in Gurugram under ₹8 Cr.",
    title: "Best Projects in Gurugram Under ₹8 Cr — Scored",
    description:
      "Every tracked Gurugram project under ₹8 Cr, independently scored on delivery, RERA legal checks, developer health, and pricing. No paid rankings.",
    intro:
      "Every project we track whose entry price sits under ₹8 Cr — each one carrying the same Truth Score, built from the same six audited inputs as the rest of the catalogue. No developer pays to appear here, and none can move a score.",
    match: underCr(8),
    pricePage: true,
  },
  {
    slug: "luxury-above-10-cr",
    h1: "Luxury projects in Gurugram above ₹10 Cr.",
    title: "Luxury Projects in Gurugram Above ₹10 Cr — Scored",
    description:
      "Gurugram ₹10 Cr+ luxury residential projects, independently scored on delivery, RERA title checks, developer strength, & build pace. No paid rankings.",
    intro:
      "The projects we track that start at ₹10 Cr and above. A larger cheque buys a bigger flat, not a safer one — every project here is scored on the same six audited inputs as everything else in the catalogue.",
    match: (r) => r.minPriceCr != null && r.minPriceCr >= 10,
    pricePage: true,
  },
  {
    slug: "high-appreciation-cagr",
    h1: "Gurugram projects with the strongest expected appreciation.",
    title: "High-Appreciation Projects in Gurugram (CAGR)",
    description:
      "Gurugram projects with the highest expected CAGR against a 9% city baseline, from the pipeline scoring delivery, legal and construction risk.",
    /* THE BASELINE IS ON THE PAGE ON PURPOSE. "High appreciation" means
       nothing without the number it beats; roi_city_cagr is 9 across the
       set, and 12 is the first threshold clearly above it. */
    intro:
      "Projects whose expected CAGR clears 12% — against a Gurugram baseline of roughly 9%. Expected appreciation is a projection, not a promise, and it is worth reading next to each project's delivery and legal score rather than on its own.",
    match: (r) => r.expectedCagrNum != null && r.expectedCagrNum >= 12,
  },
  {
    slug: "lowest-construction-delays",
    h1: "Gurugram projects least likely to run late.",
    title: "Lowest Delay Risk Projects in Gurugram — Ranked",
    description:
      "Gurugram projects with a modelled delay risk ≤ 30%, from construction pace measured against RERA-promised dates. Unbiased due diligence.",
    intro:
      "Projects whose modelled chance of running late is 30% or below — computed from construction pace against the date the developer promised RERA, not from what a brochure says. Most of the tracked set sits well above this.",
    match: (r) => r.delayChancePct != null && r.delayChancePct <= 30,
  },
  {
    slug: "new-launches",
    h1: "New launches in Gurugram.",
    title: "New Launches in Gurugram — Scored & Audited",
    description:
      "Gurugram projects registered with RERA in the last two years, independently scored on delivery, legal health, builder history, and pricing.",
    /* The honest caveat belongs on this page more than any other: a new
       launch has no construction history to score, so its delivery risk
       leans almost entirely on the developer's record. */
    intro:
      "Projects registered with Haryana RERA in the last two years. A new launch has barely any construction history to judge, so its delivery risk rests mostly on what the developer has done before — which is exactly what the Truth Score reads.",
    match: recentlyRegistered,
  },
];

export const bestProjectsBySlug = (slug: string): BestProjectsPage | undefined =>
  BEST_PROJECTS.find((p) => p.slug === slug);
