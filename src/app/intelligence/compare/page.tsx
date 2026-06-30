import type { Metadata } from "next";
import CompareIndex from "@/components/intelligence/CompareIndex";

export const metadata: Metadata = {
  title: "Compare — Truth Estate Intelligence",
  description:
    "Compare any two Gurugram projects, developers or markets side by side on the same independent evidence — Truth Score anatomy, delivery, financial signals, pricing and outlook. No sponsored winner.",
};

export default function Page() {
  return <CompareIndex />;
}
