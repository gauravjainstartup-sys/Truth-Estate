import type { Metadata } from "next";
import DevelopersIndex from "@/components/intelligence/DevelopersIndex";
import { fetchDevelopersOverview } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Developer Intelligence — Truth Estate",
  description:
    "Independent developer dossiers for Gurugram real estate — track record, delivery performance and financial health. No paid rankings.",
};

/* Live filings data is pulled at build time; unreachable backend
   simply hides the computed-track-records section. */
export default async function Page() {
  const live = await fetchDevelopersOverview();
  return <DevelopersIndex live={live} />;
}
