import type { Metadata } from "next";
import About from "@/components/about/About";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
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

export default function AboutPage() {
  return (
    <>
      <main>
        <About />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
