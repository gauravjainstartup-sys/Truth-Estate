import type { Metadata } from "next";
import ProjectsIndex from "@/components/intelligence/ProjectsIndex";
import { fetchBacklogFull, fetchTrackedStats } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Project Intelligence — Truth Estate",
  description:
    "Independent Truth Scores for Gurugram residential projects — built from six audited inputs: delivery, legal, developer strength, liquidity, pricing and construction. No paid rankings.",
};

/* Live pipeline data is pulled at build time so the page stays fully
   static; when the backend is unreachable the sections simply hide. */
export default async function Page() {
  const [rows, stats] = await Promise.all([fetchBacklogFull(), fetchTrackedStats()]);
  return <ProjectsIndex live={rows?.slice(0, 12) ?? null} stats={stats} />;
}
