import type { Metadata } from "next";
import VisionMission from "@/components/vision/VisionMission";
import Footer from "@/components/Footer";
import { fetchTrackedOverview, fetchDevelopersOverview } from "@/lib/supabase";
import { breadcrumbLd, ldJson } from "@/lib/seo";

/* This is the PUBLIC Vision & Mission page — the one the footer's
   "Vision & Mission" link points at, and the one that carries the /vision
   URL's existing index equity.

   The earlier six-section deck that lived here now sits at
   /internal/vision-deck, noindexed, kept for internal use. */

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. */
  alternates: { canonical: "/vision" },
  title: { absolute: "Vision & Mission — Truth Estate" },
  description:
    "To make truth the default currency of Indian real estate. The manifesto, 10-year vision, and fiduciary mission of Truth Estate.",
  keywords: [
    "Truth Estate Vision",
    "Truth Estate Mission",
    "Real Estate Transparency Manifesto",
    "Independent Property Advisory",
    "Real Estate Fiduciary Duty",
    "Forensic Property Intelligence",
    "Gurugram Real Estate Research",
  ],
  openGraph: {
    title: "Vision & Mission — Truth Estate",
    description:
      "To make truth the default currency of Indian real estate. A home is a family's largest financial commitment and greatest emotional anchor.",
    type: "article",
  },
};

const breadcrumb = breadcrumbLd([
  { name: "Home", path: "" },
  { name: "Vision & Mission", path: "/vision" },
]);

export default async function VisionPage() {
  /* Coverage figures are read from the database at build time rather than
     written into the copy: a public claim about how much we cover has to
     track what we actually cover. Both reads fail soft — the component drops
     the numbers from the sentence rather than printing a zero. */
  const [overview, developers] = await Promise.all([
    fetchTrackedOverview(),
    fetchDevelopersOverview(),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <main>
        <VisionMission
          coverage={{
            activeProjects: overview?.activeProjects,
            microMarkets: overview?.microMarkets,
            developers: developers?.length,
          }}
        />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
