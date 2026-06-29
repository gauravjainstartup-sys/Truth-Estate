import type { Metadata } from "next";
import VisionHero from "@/components/vision/VisionHero";
import BuyerJourneySection from "@/components/BuyerJourneySection";
import MarketIntelligence from "@/components/vision/MarketIntelligence";
import TruthGuidePreview from "@/components/vision/TruthGuidePreview";
import TrustClose from "@/components/vision/TrustClose";

export const metadata: Metadata = {
  title: "Truth Estate — Independent Real Estate Intelligence",
  description:
    "Bloomberg-grade intelligence and independent advisory for high-value property decisions in India. Proof, not promises.",
};

export default function VisionPage() {
  return (
    <main className="bg-[#0a0a0a]">
      <VisionHero />
      <BuyerJourneySection />
      <MarketIntelligence />
      <TruthGuidePreview />
      <TrustClose />
    </main>
  );
}
