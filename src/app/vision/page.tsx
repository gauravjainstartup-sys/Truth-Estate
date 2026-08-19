import type { Metadata } from "next";
import VisionMission from "@/components/vision/VisionMission";
import Footer from "@/components/Footer";
import { breadcrumbLd, ldJson } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/vision" },
  title: { absolute: "Vision & Mission — Truth Estate" },
  description:
    "To make truth the default currency of Indian real estate. The manifesto, 10-year macro vision, and fiduciary mission of Truth Estate.",
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

export default function VisionPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <main>
        <VisionMission />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
