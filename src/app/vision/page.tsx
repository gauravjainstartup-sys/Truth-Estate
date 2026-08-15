import type { Metadata } from "next";
import VisionHero from "@/components/vision/VisionHero";
import { fetchTrackedOverview } from "@/lib/supabase";
import BuyerJourneySection from "@/components/BuyerJourneySection";
import MarketIntelligence from "@/components/vision/MarketIntelligence";
import TruthScoreAnatomy from "@/components/vision/TruthScoreAnatomy";
import TruthGuidePreview from "@/components/vision/TruthGuidePreview";
import TrustClose from "@/components/vision/TrustClose";

export const metadata: Metadata = {
  /* Without this the route inherits metadataBase and Next emits the bare
     ROOT url as the canonical — telling Google this page is a duplicate of
     the home page. 25 pages in the sitemap were doing exactly that. */
  alternates: { canonical: "/vision" },
  // { absolute } so the "%s | Truth Estate" template doesn't double-brand, and
  // distinct from the homepage title so the two don't compete for one query.
  title: { absolute: "Our Vision — Truth Estate" },
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
