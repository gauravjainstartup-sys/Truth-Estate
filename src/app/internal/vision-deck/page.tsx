import type { Metadata } from "next";
import VisionHero from "@/components/vision/VisionHero";
import { fetchTrackedOverview } from "@/lib/supabase";
import BuyerJourneySection from "@/components/BuyerJourneySection";
import MarketIntelligence from "@/components/vision/MarketIntelligence";
import TruthScoreAnatomy from "@/components/vision/TruthScoreAnatomy";
import TruthGuidePreview from "@/components/vision/TruthGuidePreview";
import TrustClose from "@/components/vision/TrustClose";

/* The original /vision deck, kept for internal use after the public
   Vision & Mission page took over the /vision URL.

   NOT public: noindex + nofollow, and deliberately absent from
   src/app/sitemap.ts. Crawling stays allowed (see the reasoning in
   src/app/robots.ts) precisely so the noindex here can be read — a
   Disallow would block the fetch and leave the URL eligible to surface
   as a bare result.

   No canonical is set: a noindexed page pointing a canonical at itself
   is noise, and pointing it at /vision would tell Google these are the
   same document when they are two different decks. */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { absolute: "Vision Deck (internal) — Truth Estate" },
  description: "Internal vision deck. Not a public page.",
};

export default async function InternalVisionDeckPage() {
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
