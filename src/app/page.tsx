import Hero from "@/components/Hero";
import ChaosToOrderSection from "@/components/ChaosToOrderSection";
import StorySection from "@/components/StorySection";
import ExperienceSection from "@/components/ExperienceSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <ChaosToOrderSection />
        <StorySection />
        <ExperienceSection />
      </main>
      <Footer />
    </>
  );
}
