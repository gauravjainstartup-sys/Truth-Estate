import Hero from "@/components/Hero";
import BuyerJourneySection from "@/components/BuyerJourneySection";
import ExperienceSection from "@/components/ExperienceSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <BuyerJourneySection />
        <ExperienceSection />
      </main>
      <Footer />
    </>
  );
}
