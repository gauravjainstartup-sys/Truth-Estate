import type { Metadata } from "next";
import CustomReportPage from "./CustomReportPage";

export const metadata: Metadata = {
  title: "Get a custom project report · Truth Estate",
  description:
    "Considering a project we haven't covered? Our analysts build you an independent, buyer-side forensic report — from RERA filings and public records, anywhere in India. Never paid by builders.",
  alternates: { canonical: "/get-custom-project-report" },
};

export default function Page() {
  return <CustomReportPage />;
}
