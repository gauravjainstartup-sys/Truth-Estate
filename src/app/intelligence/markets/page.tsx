import type { Metadata } from "next";
import MarketsIndex from "@/components/intelligence/MarketsIndex";
import { fetchMicroMarkets, fetchTrackedOverview } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Location Intelligence",
  description:
    "Independent location intelligence for Gurugram real estate — every micro-market mapped, with project counts, price bands and outlook. No paid rankings.",
};

/* Live coverage list is pulled at build time; unreachable backend
   simply hides the under-live-coverage strip. */
export default async function Page() {
  const [live, overview] = await Promise.all([fetchMicroMarkets(), fetchTrackedOverview()]);
  return <MarketsIndex live={live} overview={overview} />;
}
