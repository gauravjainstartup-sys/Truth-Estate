import type { Metadata } from "next";
import Pricing from "@/components/pricing/Pricing";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/pricing" },
  title: "Engagement Models",
  description:
    "Explore how Truth Estate supports your property decision — from independent research intelligence to dedicated buyer representation.",
  keywords: [
    "Truth Estate Pricing",
    "Real Estate Advisory Engagement",
    "Independent Buyer Representation",
    "Private Office Advisory",
    "Truth Intelligence",
    "Property Research India",
    "NRI Real Estate Advisory",
  ],
  openGraph: {
    title: "Engagement Models",
    description:
      "Choose how Truth Estate supports your decision. From self-directed intelligence to dedicated buyer representation.",
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <>
      <main>
        <Pricing />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
