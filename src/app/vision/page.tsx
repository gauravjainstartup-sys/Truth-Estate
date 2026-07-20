import type { Metadata } from "next";
import VisionHero from "@/components/vision/VisionHero";
import { fetchTrackedOverview } from "@/lib/supabase";
import BuyerJourneySection from "@/components/BuyerJourneySection";
import MarketIntelligence from "@/components/vision/MarketIntelligence";
import TruthScoreAnatomy from "@/components/vision/TruthScoreAnatomy";
import TruthGuidePreview from "@/components/vision/TruthGuidePreview";
import TrustClose from "@/components/vision/TrustClose";

export const metadata: Metadata = {
  title: "Truth Estate — Independent Real Estate Intelligence",
  description:
    "Bloomberg-grade intelligence and independent advisory for high-value property decisions in India. Proof, not promises.",
};

export default async function VisionPage() {
  const overview = await fetchTrackedOverview();
  return (
    <main className="bg-[#0a0a0a]">
      <VisionHero activeProjects={overview?.activeProjects} />
      <BuyerJourneySection />
      <MarketIntelligence />
      <TruthScoreAnatomy />
      <TruthGuidePreview />
      <TrustClose />
    </main>
  );
}
