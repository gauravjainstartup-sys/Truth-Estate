import type { Metadata } from "next";
import ProjectsIndex from "@/components/intelligence/ProjectsIndex";
import { fetchTrackedStats } from "@/lib/supabase";
import { buildLiveCatalog } from "@/lib/liveReport";
import type { ProjectIntel } from "@/lib/projects";
import { collectionLd, ldJson } from "@/lib/seo";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/projects" },
  title: "Gurugram Projects, Ranked by Truth Score",
  description:
    "Independent Truth Scores for Gurugram residential projects — built from six audited inputs: delivery, legal, developer strength, liquidity, pricing and construction. No paid rankings.",
  openGraph: {
    title: "Gurugram Projects, Ranked by Truth Score",
    description: "Independent Truth Scores for Gurugram residential projects — delivery, legal, pricing and more. No paid rankings.",
    url: "/intelligence/projects",
    type: "website",
  },
};

/* The projects index is the tracked universe, live from Supabase: every row
   of backlog_listing_public is adapted onto the shared ProjectOptionCard.
   Pulled at build time so the page stays static; if the backend is
   unreachable the grid renders its "refreshing" state. */
export default async function Page() {
  /* buildLiveCatalog, not a thinner private mapping — the SAME builder the
     landers and market context use, extended-details join included. Before
     this the page passed ext=null into liveProjectIntel, so cards here
     showed corridor-derived prices/rates while the identical card one click
     away (lander, report) showed the developer's filed ones. One builder,
     one truth on every surface. */
  const [projects, stats]: [ProjectIntel[], Awaited<ReturnType<typeof fetchTrackedStats>>] =
    await Promise.all([buildLiveCatalog(), fetchTrackedStats()]);
  /* CollectionPage + ItemList of the tracked set (rows arrive Truth-Score
     ordered from the query). Capped so the markup stays lean; the list is the
     real catalogue, never invented. */
  const ld = collectionLd({
    name: "Gurugram Projects, Ranked by Truth Score",
    description: "Independent Truth Scores for tracked Gurugram residential projects.",
    path: "/intelligence/projects",
    items: projects.filter((p) => p.seoSlug && p.name).slice(0, 60).map((p) => ({ name: p.name, path: `/projects/${p.seoSlug}` })),
  });
  /* THE HEAD IS ONE LINE, NOT A HERO. This page's product is the 107
     options; a full-height masthead (4rem headline, six-line intro, four
     stacked stat tiles) put the first card ~1,400px down a phone — the
     same mistake the cluster landers were corrected for. The stat tiles'
     content survives here, in the line the founder approved on the mock,
     and the intro paragraph moves below the grid where a reader who wants
     the methodology will still find it (and Google still reads it). */
  const scored = projects.map((p) => p.truthScore).filter((s) => s > 0);
  const lo = scored.length ? Math.min(...scored) : 0;
  const hi = scored.length ? Math.max(...scored) : 0;
  const metaLine = [
    `${projects.length} audited files`,
    stats?.tracked ? `${stats.tracked.toLocaleString("en-IN")} RERA projects tracked live` : null,
    hi > 0 ? `Truth Score ${lo}–${hi}` : null,
    "no developer pays to rank",
  ].filter(Boolean).join(" · ");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(ld)} />
      <ProjectsIndex
        projects={projects}
        stats={stats}
        facetFilters
        dense
        metaLine={metaLine}
        tailIntro="One Truth Score per project, built from six audited inputs — delivery, legal, developer strength, liquidity, pricing and construction. No developer pays to appear here, and none can move a score. Open any project to see exactly how it’s built."
      />
    </>
  );
}
