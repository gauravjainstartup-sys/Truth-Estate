import type { Metadata } from "next";
import ProjectsIndex from "@/components/intelligence/ProjectsIndex";

export const metadata: Metadata = {
  title: "Project Intelligence — Truth Estate",
  description:
    "Independent Truth Scores for Gurugram residential projects — built from six audited inputs: delivery, legal, developer strength, liquidity, pricing and construction. No paid rankings.",
};

export default function Page() {
  return <ProjectsIndex />;
}
