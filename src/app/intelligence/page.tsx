import type { Metadata } from "next";
import IntelligenceWorkspace from "@/components/intelligence/IntelligenceWorkspace";
import { buildIndex } from "@/lib/omniIndex";

export const metadata: Metadata = {
  title: "Gurugram Real Estate Intelligence & Truth Scores",
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
    title: "Gurugram Real Estate Intelligence & Truth Scores",
    description:
      "Unbiased Truth Scores, developer intelligence and location analysis for Gurugram real estate. Evidence over marketing.",
    url: "/intelligence",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gurugram Real Estate Intelligence & Truth Scores",
    description:
      "Unbiased Truth Scores, developer intelligence and location analysis for Gurugram real estate.",
  },
};

export default async function IntelligencePage() {
  const index = await buildIndex();
  return <IntelligenceWorkspace index={index} />;
}
