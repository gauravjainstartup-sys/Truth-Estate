import type { Metadata } from "next";
import Methodology from "@/components/methodology/Methodology";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Our Research Methodology — Truth Estate",
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
    title: "Our Research Methodology — Truth Estate",
    description:
      "Every recommendation begins with evidence. How Truth Estate reaches its independent real estate research conclusions.",
    type: "article",
  },
};

export default function MethodologyPage() {
  return (
    <>
      <main>
        <Methodology />
      </main>
      <Footer precededByDark={false} />
    </>
  );
}
