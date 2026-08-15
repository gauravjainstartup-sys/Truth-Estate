import { SITE_URL } from "./site";

/* Build a schema.org BreadcrumbList from an ordered list of crumbs. Emitting
   this on nested pages gives Google the breadcrumb trail it shows under a
   result, and helps AI answer engines place the page in the site hierarchy.
   `path` is site-relative (e.g. "/intelligence/projects"); "" is the home. */
export function breadcrumbLd(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

/* A CollectionPage wrapping an ordered ItemList — for catalogue / ranking
   pages (the project & developer indexes, best-projects landings). Exposes the
   listed set to crawlers and AI answer engines and makes the page eligible for
   list rich results. Built from the SAME rows the page renders, so the markup
   never claims items the page doesn't show. `items` is already in display
   order; positions are 1-based. */
export function collectionLd(opts: {
  name: string;
  description?: string;
  path: string;
  items: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    url: `${SITE_URL}${opts.path}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: `${SITE_URL}${it.path}`,
      })),
    },
  };
}

/* The developer as its own Organization entity on its dossier page — a distinct
   @id (…#developer), NOT the site's #organization, so the two never merge. A
   developer is a builder (Organization), not a RealEstateAgent. No
   aggregateRating: a delivery percentage is not a review score, and inventing
   one is exactly the spammy-markup Google penalises. Founding year only when we
   actually carry it. */
export function developerLd(opts: { name: string; slug: string; est?: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/intelligence/developers/${opts.slug}#developer`,
    name: opts.name,
    url: `${SITE_URL}/intelligence/developers/${opts.slug}`,
    areaServed: { "@type": "City", name: "Gurugram" },
    ...(opts.est ? { foundingDate: opts.est } : {}),
    ...(opts.description ? { description: opts.description } : {}),
  };
}

/* Serialise structured data for a <script type="application/ld+json"> tag. */
export function ldJson(data: unknown) {
  return { __html: JSON.stringify(data) };
}
