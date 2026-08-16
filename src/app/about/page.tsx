import type { Metadata } from "next";
import About from "@/components/about/About";
import Footer from "@/components/Footer";
import { breadcrumbLd, ldJson } from "@/lib/seo";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/about" },
  title: "About Truth Estate — Independent Real Estate Advisory",
  description:
    "Why Truth Estate exists. Independent intelligence, buyer representation and evidence-first research for life's biggest real estate decisions.",
  keywords: [
    "Independent Real Estate Advisory",
    "Independent Property Research",
    "Real Estate Intelligence",
    "Buyer's Office",
    "Property Due Diligence",
    "Truth Estate",
    "Independent Buyer Representation",
    "Real Estate Research",
  ],
  openGraph: {
    title: "About Truth Estate — Independent Real Estate Advisory",
    description:
      "We didn't build another property portal. We built the buyer's office the industry never had.",
    type: "article",
  },
};

const breadcrumb = breadcrumbLd([
  { name: "Home", path: "" },
  { name: "About", path: "/about" },
]);

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <main>
        <About />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
