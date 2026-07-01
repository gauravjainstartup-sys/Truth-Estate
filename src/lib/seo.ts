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

/* Serialise structured data for a <script type="application/ld+json"> tag. */
export function ldJson(data: unknown) {
  return { __html: JSON.stringify(data) };
}
