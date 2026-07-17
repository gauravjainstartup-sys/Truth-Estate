import Hero from "@/components/Hero";
import StorySection from "@/components/StorySection";
import ExperienceSection from "@/components/ExperienceSection";
import Footer from "@/components/Footer";
import { buildIndex } from "@/lib/omniIndex";

export default async function Home() {
  /* the hero's ask line reads the same index the /intelligence omnibox does */
  const index = await buildIndex();
  return (
    <>
      <main>
        <Hero index={index} />
        <StorySection />
        <ExperienceSection />
      </main>
      <Footer />
    </>
  );
}
