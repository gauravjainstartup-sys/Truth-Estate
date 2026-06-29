import Hero from "@/components/Hero";
import DreamSection from "@/components/DreamSection";
import NoiseSection from "@/components/NoiseSection";
import ClaritySection from "@/components/ClaritySection";
import ExperienceSection from "@/components/ExperienceSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <DreamSection />
        <NoiseSection />
        <ClaritySection />
        <ExperienceSection />
      </main>
      <Footer />
    </>
  );
}
