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
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(ld)} />
      <ProjectsIndex projects={projects} stats={stats} />
    </>
  );
}
