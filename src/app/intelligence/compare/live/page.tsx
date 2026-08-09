import type { Metadata } from "next";
import CompareLive from "@/components/intelligence/CompareLive";

/* Client-rendered compare for any pair (?a=&b=). Param-driven, so it carries
   no unique build content — noindex, and canonical points at the compare hub
   so equity consolidates there. The demand/top-scored pairs keep their own
   prerendered, indexable pages; this covers everything else. */
export const metadata: Metadata = {
  title: "Compare — Truth Estate Intelligence",
  description:
    "Independent side-by-side comparison of any two Gurugram projects on the same evidence — Truth Score anatomy, delivery, pricing and outlook. No sponsored winner.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/intelligence/compare" },
};

export default function Page() {
  return <CompareLive />;
}
