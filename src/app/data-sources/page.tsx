import type { Metadata } from "next";
import DataSources from "@/components/data-sources/DataSources";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Data Sources — Truth Estate",
  description:
    "Where Truth Estate's intelligence comes from. Public, regulatory, financial and market sources independently verified to support every recommendation.",
  keywords: [
    "Real Estate Data Sources",
    "Property Research",
    "RERA Data",
    "Real Estate Due Diligence",
    "Developer Financial Analysis",
    "Project Research",
    "Property Intelligence",
    "Truth Estate",
  ],
  openGraph: {
    title: "Data Sources — Truth Estate",
    description:
      "Independent intelligence begins with reliable evidence. How Truth Estate gathers, verifies and interprets real estate data.",
    type: "article",
  },
};

export default function DataSourcesPage() {
  return (
    <main>
      <DataSources />
      <Footer />
    </main>
  );
}
