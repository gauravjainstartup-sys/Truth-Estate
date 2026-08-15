import type { Metadata } from "next";
import ProjectsIndex from "@/components/intelligence/ProjectsIndex";
import { fetchBacklogFull, fetchCorridorPsf, fetchTrackedStats } from "@/lib/supabase";
import { liveProjectIntel } from "@/lib/liveReport";
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
  const [rows, stats, corridorPsf] = await Promise.all([fetchBacklogFull(), fetchTrackedStats(), fetchCorridorPsf()]);
  const projects: ProjectIntel[] = (rows ?? []).map((r) => liveProjectIntel(r, null, null, corridorPsf));
  /* CollectionPage + ItemList of the tracked set (rows arrive Truth-Score
     ordered from the query). Capped so the markup stays lean; the list is the
     real catalogue, never invented. */
  const ld = collectionLd({
    name: "Gurugram Projects, Ranked by Truth Score",
    description: "Independent Truth Scores for tracked Gurugram residential projects.",
    path: "/intelligence/projects",
    items: (rows ?? []).filter((r) => r.seoSlug && r.name).slice(0, 60).map((r) => ({ name: r.name, path: `/projects/${r.seoSlug}` })),
  });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(ld)} />
      <ProjectsIndex projects={projects} stats={stats} />
    </>
  );
}
