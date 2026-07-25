/* ════════════════════════════════════════════════════════════════
   The one place that knows a project's public address.

   Reports moved from /intelligence/projects/<db-name-slug> to
   /projects/<seo-slug> — the URL truthestate.in already serves and
   Google has indexed — so the domain can migrate to this build without
   every ranking page 404ing.

   Everything internal still speaks the DB-name slug: events, entitlements,
   the inferred brief. Only the href changed, and only here, so no call
   site has to remember which of the two it is holding.

   The fallback matters. An omni-index published by an earlier deploy has
   no seoSlug, and the old address still resolves — as a redirect stub —
   so a stale index degrades to one extra hop rather than a broken link.
   ════════════════════════════════════════════════════════════════ */
const BASE = "/Truth-Estate";

export function projectPath(p: { slug: string; seoSlug?: string | null }): string {
  return p.seoSlug ? `/projects/${p.seoSlug}` : `/intelligence/projects/${p.slug}`;
}

export function projectHref(p: { slug: string; seoSlug?: string | null }): string {
  return `${BASE}${projectPath(p)}`;
}
