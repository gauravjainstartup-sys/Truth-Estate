import type { Metadata } from "next";
import ProjectsIndex from "@/components/intelligence/ProjectsIndex";
import { fetchBacklogFull, fetchCorridorPsf, fetchTrackedStats } from "@/lib/supabase";
import { liveProjectIntel } from "@/lib/liveReport";
import type { ProjectIntel } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";
import { ldJson } from "@/lib/seo";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/projects" },
  title: "Best Residential Projects in Gurugram — Ranked by Truth Score",
  description:
    "Independent Truth Scores for Gurugram residential projects — built from six audited inputs: delivery, legal, developer strength, liquidity, pricing and construction. No paid rankings.",
  openGraph: {
    title: "Best Residential Projects in Gurugram — Ranked by Truth Score",
    description:
      "Independent Truth Scores for Gurugram residential projects — built from six audited inputs. Evidence over marketing.",
    url: "/intelligence/projects",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Residential Projects in Gurugram — Ranked by Truth Score",
    description:
      "Independent Truth Scores for Gurugram residential projects. Evidence over marketing — no paid rankings.",
  },
};

/* The projects index is the tracked universe, live from Supabase: every row
   of backlog_listing_public is adapted onto the shared ProjectOptionCard.
   Pulled at build time so the page stays static; if the backend is
   unreachable the grid renders its "refreshing" state. */
export default async function Page() {
  const [rows, stats, corridorPsf] = await Promise.all([fetchBacklogFull(), fetchTrackedStats(), fetchCorridorPsf()]);
  const projects: ProjectIntel[] = (rows ?? []).map((r) => liveProjectIntel(r, null, null, corridorPsf));

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Best Residential Projects in Gurugram — Ranked by Truth Score",
    description:
      "Independent Truth Scores for Gurugram residential projects — built from six audited inputs: delivery, legal, developer strength, liquidity, pricing and construction.",
    url: `${SITE_URL}/intelligence/projects`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: projects.length,
      itemListElement: projects.slice(0, 50).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: `${SITE_URL}/projects/${p.seoSlug || p.slug}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(collectionLd)} />
      <ProjectsIndex projects={projects} stats={stats} />
    </>
  );
}
