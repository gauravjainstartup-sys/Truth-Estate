import type { Metadata } from "next";
import Pricing from "@/components/pricing/Pricing";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Engagement Models — Truth Estate",
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
    title: "Engagement Models — Truth Estate",
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
