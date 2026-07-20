import type { Metadata } from "next";
import ProjectsIndex from "@/components/intelligence/ProjectsIndex";
import { fetchBacklogFull, fetchCorridorPsf, fetchTrackedStats } from "@/lib/supabase";
import { liveProjectIntel } from "@/lib/liveReport";
import type { ProjectIntel } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Project Intelligence — Truth Estate",
  description:
    "Independent Truth Scores for Gurugram residential projects — built from six audited inputs: delivery, legal, developer strength, liquidity, pricing and construction. No paid rankings.",
};

/* The projects index is the tracked universe, live from Supabase: every row
   of backlog_listing_public is adapted onto the shared ProjectOptionCard.
   Pulled at build time so the page stays static; if the backend is
   unreachable the grid renders its "refreshing" state. */
export default async function Page() {
  const [rows, stats, corridorPsf] = await Promise.all([fetchBacklogFull(), fetchTrackedStats(), fetchCorridorPsf()]);
  const projects: ProjectIntel[] = (rows ?? []).map((r) => liveProjectIntel(r, null, null, corridorPsf));
  return <ProjectsIndex projects={projects} stats={stats} />;
}
