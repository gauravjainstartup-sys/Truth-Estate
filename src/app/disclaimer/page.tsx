import type { Metadata } from "next";
import DisclaimerContent from "@/components/legal/DisclaimerContent";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/disclaimer" },
  title: "Disclaimer",
  description:
    "What Truth Estate is, what it is not, and the boundaries of the independent research and intelligence we provide.",
  keywords: [
    "Truth Estate Disclaimer",
    "Real Estate Research Disclaimer",
    "Independent Advisory Disclaimer",
    "Property Research Limitations",
    "Truth Estate",
  ],
  openGraph: {
    title: "Disclaimer",
    description:
      "Understanding the nature and limitations of Truth Estate's independent real estate research and advisory services.",
    type: "article",
  },
};

export default function DisclaimerPage() {
  return (
    <>
      <main>
        <DisclaimerContent />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
