import Hero from "@/components/Hero";
import StorySection from "@/components/StorySection";
import ExperienceSection from "@/components/ExperienceSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <StorySection />
        <ExperienceSection />
      </main>
      <Footer />
    </>
  );
}
