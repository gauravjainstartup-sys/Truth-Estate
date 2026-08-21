import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectsIndex from "@/components/intelligence/ProjectsIndex";
import { BEST_PROJECTS, bestProjectsBySlug } from "@/lib/bestProjects";
import { fetchBacklogFull, fetchCorridorPsf, fetchPriceEnvelopes, fetchTrackedStats } from "@/lib/supabase";
import { liveProjectIntel } from "@/lib/liveReport";
import type { ProjectIntel } from "@/lib/projects";
import { breadcrumbLd, collectionLd, ldJson } from "@/lib/seo";

/* ════════════════════════════════════════════════════════════════
   /best-projects/<filter> — the old site's landing pages, rebuilt.

   These addresses have been serving on truthestate.in and carry the
   rankings for the queries people type: "best projects in Gurugram under
   3 Cr", "new launches in Gurugram". The crawl found every one of them
   unmatched against this build. Redirecting them to the catalogue index
   would have pooled seven pages' equity onto one URL that answers none of
   their questions, so they are rebuilt at their own addresses instead.

   A page here is the projects index over a filtered set — the same grid,
   the same cards, the same search and corridor chips — with its own
   heading, intro and metadata. The filter is a predicate over the live
   row (see lib/bestProjects.ts), so nothing is hand-listed and no page
   can go stale against the pipeline.
   ════════════════════════════════════════════════════════════════ */

export function generateStaticParams() {
  return BEST_PROJECTS.map((p) => ({ filter: p.slug }));
}

/* Only the seven exist. An unknown /best-projects/<anything> is a 404,
   not a soft landing on an empty grid — a page listing nothing still
   returns 200 and Google indexes it as thin content. */
export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<{ filter: string }> },
): Promise<Metadata> {
  const { filter } = await params;
  const page = bestProjectsBySlug(filter);
  if (!page) return { title: "Project Intelligence" };
  return {
    /* Explicit, because without it the route inherits metadataBase and
       Next emits the bare root URL — telling Google seven distinct
       landing pages are all duplicates of the home page. */
    alternates: { canonical: `/best-projects/${page.slug}` },
    title: page.title,
    description: page.description,
  };
}

export default async function Page({ params }: { params: Promise<{ filter: string }> }) {
  const { filter } = await params;
  const page = bestProjectsBySlug(filter);
  if (!page) notFound();

  const [rows, stats, corridorPsf, envelopes] = await Promise.all([
    fetchBacklogFull(),
    fetchTrackedStats(),
    fetchCorridorPsf(),
    fetchPriceEnvelopes(),
  ]);
  let matched = (rows ?? []).filter(page.match);

  /* THE TEST IS WHETHER THIS PAGE'S CLAIM SURVIVES, not whether the data
     is tidy. Seven projects list a price their own filed rate and area
     cannot produce, but for most of them it changes nothing: Ashiana
     Amarah Phase 2 lists ₹1.9 Cr against a floor of ₹2.01 Cr, and both
     are under ₹3 Cr, so "under ₹3 Cr" is true either way and dropping it
     would hide a project that belongs there. Only Delphine Central Park
     Estates Phase 2 — ₹2.8 Cr listed, ₹11.88 Cr floor — actually breaks
     the claim.

     So the page's own predicate is re-run against the most conservative
     reading of the project's filings, the cheapest flat that can exist
     there, and the project stays only if the claim holds under both. A
     project we cannot check is kept: absent filings are not evidence. */
  let dropped: string[] = [];
  if (page.pricePage) {
    const before = matched;
    matched = before.filter((r) => {
      const env = envelopes[r.slug];
      return !env || env.credible || page.match({ ...r, minPriceCr: env.floorCr });
    });
    dropped = before.filter((r) => !matched.includes(r)).map((r) => {
      const env = envelopes[r.slug];
      return `${r.slug} (lists ₹${r.minPriceCr}Cr, cheapest possible ₹${env.floorCr.toFixed(2)}Cr)`;
    });
  }
  const projects: ProjectIntel[] = matched.map((r) => liveProjectIntel(r, null, null, corridorPsf));

  /* Say what came back. A filter that matches nothing is a data problem,
     and finding out from a silently empty page after it has shipped is
     how a landing page stays empty for a month. A silent DROP is worse
     still, so those are named. */
  console.log(`[urls] /best-projects/${page.slug}: ${projects.length} of ${(rows ?? []).length} project(s)`);
  if (dropped.length) {
    console.warn(`[urls]   withheld from this price page (listed price contradicts its own filed rate): ${dropped.join(", ")}`);
  }

  /* CollectionPage + ItemList of exactly the projects this filter surfaces —
     the commercial-intent ranking these pages exist to answer. Built from the
     same `matched` rows the grid renders, so it never over-claims. */
  const ld = collectionLd({
    name: page.title,
    description: page.description,
    path: `/best-projects/${page.slug}`,
    items: matched.filter((r) => r.seoSlug && r.name).slice(0, 60).map((r) => ({ name: r.name, path: `/projects/${r.seoSlug}` })),
  });

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Best Projects", path: "/intelligence/projects" },
    { name: page.title, path: `/best-projects/${page.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(ld)} />
      {/* THE DENSE CUT, same as the catalogue: these are landing pages, and
          their product is the filtered grid — the full-height masthead
          (4rem h1, six-line intro, four stat tiles, the universe band) put
          the first card more than a screen down. The head collapses to
          crumb + h1 + one fact line; the intro paragraph moves below the
          grid where a reader who wants the methodology still finds it (and
          Google still reads it). `intro` stays passed for the
          ?developer=-scoped line dense mode shows in that one case. */}
      <ProjectsIndex
        projects={projects}
        stats={stats}
        crumb={page.title}
        heading={page.h1}
        intro={page.intro}
        dense
        metaLine={`${projects.length} ${page.metaFact} | No Developer Bias`}
        tailIntro={page.intro}
      />
    </>
  );
}
