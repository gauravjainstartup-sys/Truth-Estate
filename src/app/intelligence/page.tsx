import type { Metadata } from "next";
import IntelligenceWorkspace from "@/components/intelligence/IntelligenceWorkspace";

export const metadata: Metadata = {
  title: "Truth Intelligence — Independent Property Research",
  description:
    "Independent Gurugram real estate intelligence: unbiased Truth Scores for projects, developer track records, location analysis and side-by-side comparisons. Evidence over marketing — no paid rankings.",
  keywords: [
    "Gurugram real estate intelligence",
    "property Truth Score",
    "independent project research India",
    "developer track record Gurugram",
    "compare Gurugram projects",
  ],
  alternates: { canonical: "/intelligence" },
  openGraph: {
    title: "Truth Intelligence — Independent Property Research",
    description:
      "Unbiased Truth Scores, developer intelligence and location analysis for Gurugram real estate. Evidence over marketing.",
    url: "/intelligence",
  },
};

export default function IntelligencePage() {
  return <IntelligenceWorkspace />;
}
