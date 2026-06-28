import type { Metadata } from "next";
import DisclaimerContent from "@/components/legal/DisclaimerContent";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Disclaimer — Truth Estate",
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
    title: "Disclaimer — Truth Estate",
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
