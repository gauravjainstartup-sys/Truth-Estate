import type { Metadata } from "next";
import CompareIndex from "@/components/intelligence/CompareIndex";
import { fetchBacklogFull } from "@/lib/supabase";
import { scoredProjectOptions } from "@/lib/compare";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/compare" },
  title: "Compare Gurugram Real Estate Projects & Developers",
  description:
    "Compare any two Gurugram projects, developers or markets side by side on the same independent evidence — Truth Score anatomy, delivery, financial signals, pricing and outlook. No sponsored winner.",
  openGraph: {
    title: "Compare Gurugram Real Estate Projects & Developers",
    description:
      "Compare any two Gurugram projects, developers or markets side by side on independent evidence.",
    url: "/intelligence/compare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare Gurugram Real Estate Projects & Developers",
    description:
      "Compare any two Gurugram projects, developers or markets side by side on independent evidence.",
  },
};

/* The project picker + comparisons run on the live tracked set (fetched once
   per build); developers & markets come from the curated registries. */
export default async function Page() {
  const rows = await fetchBacklogFull();
  const projectOptions = scoredProjectOptions(rows);
  return <CompareIndex projectOptions={projectOptions} />;
}
