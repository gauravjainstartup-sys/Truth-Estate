import type { Metadata } from "next";
import MarketsIndex from "@/components/intelligence/MarketsIndex";

export const metadata: Metadata = {
  title: "Location Intelligence — Truth Estate",
  description:
    "Independent location intelligence for Gurugram real estate — every micro-market mapped, with project counts, price bands and outlook. No paid rankings.",
};

export default function Page() {
  return <MarketsIndex />;
}
