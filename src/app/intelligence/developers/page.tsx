import type { Metadata } from "next";
import DevelopersIndex from "@/components/intelligence/DevelopersIndex";

export const metadata: Metadata = {
  title: "Developer Intelligence — Truth Estate",
  description:
    "Independent developer dossiers for Gurugram real estate — track record, delivery performance and financial health. No paid rankings.",
};

export default function Page() {
  return <DevelopersIndex />;
}
