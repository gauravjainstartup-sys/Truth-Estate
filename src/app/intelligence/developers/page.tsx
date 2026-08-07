import type { Metadata } from "next";
import DevelopersIndex from "@/components/intelligence/DevelopersIndex";
import { fetchDevelopersOverview } from "@/lib/supabase";
import { resolveDevelopers } from "@/lib/developersLive";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/intelligence/developers" },
  title: "Developer Intelligence",
  description:
    "Independent developer dossiers for Gurugram real estate — track record, delivery performance and financial health. No paid rankings.",
};

/* Live filings data is pulled at build time; unreachable backend
   simply hides the computed-track-records section. */
export default async function Page() {
  /* resolveDevelopers = all 17 (curated dossiers + computed-from-filings);
     `live` still feeds the detailed track-record table below the cards. */
  const [developers, live] = await Promise.all([resolveDevelopers(), fetchDevelopersOverview()]);
  return <DevelopersIndex developers={developers} live={live} />;
}
