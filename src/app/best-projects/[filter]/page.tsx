import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectsIndex from "@/components/intelligence/ProjectsIndex";
import { BEST_PROJECTS, bestProjectsBySlug } from "@/lib/bestProjects";
import { fetchBacklogFull, fetchCorridorPsf, fetchTrackedStats } from "@/lib/supabase";
import { liveProjectIntel } from "@/lib/liveReport";
import type { ProjectIntel } from "@/lib/projects";

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

  const [rows, stats, corridorPsf] = await Promise.all([
    fetchBacklogFull(),
    fetchTrackedStats(),
    fetchCorridorPsf(),
  ]);
  const matched = (rows ?? []).filter(page.match);
  const projects: ProjectIntel[] = matched.map((r) => liveProjectIntel(r, null, null, corridorPsf));

  /* Say what came back. A filter that matches nothing is a data problem,
     and finding out from a silently empty page after it has shipped is
     how a landing page stays empty for a month. */
  console.log(`[urls] /best-projects/${page.slug}: ${projects.length} of ${(rows ?? []).length} project(s)`);

  return (
    <ProjectsIndex
      projects={projects}
      stats={stats}
      crumb={page.title}
      heading={page.h1}
      intro={page.intro}
    />
  );
}
