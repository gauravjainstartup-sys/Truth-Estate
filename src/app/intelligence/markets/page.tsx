import type { Metadata } from "next";
import MarketsIndex from "@/components/intelligence/MarketsIndex";
import { fetchMicroMarkets } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Location Intelligence — Truth Estate",
  description:
    "Independent location intelligence for Gurugram real estate — every micro-market mapped, with project counts, price bands and outlook. No paid rankings.",
};

/* Live coverage list is pulled at build time; unreachable backend
   simply hides the under-live-coverage strip. */
export default async function Page() {
  const live = await fetchMicroMarkets();
  return <MarketsIndex live={live} />;
}
