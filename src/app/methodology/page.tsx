import type { Metadata } from "next";
import Methodology from "@/components/methodology/Methodology";
import Footer from "@/components/Footer";
import { breadcrumbLd, ldJson } from "@/lib/seo";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/methodology" },
  title: "Our Research Methodology",
  description:
    "How Truth Estate researches real estate. An independent, evidence-first methodology for evaluating projects, developers and markets — and how Truth Score and Match Score work.",
  keywords: [
    "Real Estate Research Methodology",
    "How Truth Score Works",
    "Independent Property Research",
    "Real Estate Due Diligence",
    "Project Evaluation Methodology",
    "Truth Estate",
  ],
  openGraph: {
    title: "Our Research Methodology",
    description:
      "Every recommendation begins with evidence. How Truth Estate reaches its independent real estate research conclusions.",
    type: "article",
  },
};

const breadcrumb = breadcrumbLd([
  { name: "Home", path: "" },
  { name: "Methodology", path: "/methodology" },
]);

export default function MethodologyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <main>
        <Methodology />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
