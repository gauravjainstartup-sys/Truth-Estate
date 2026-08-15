import Hero from "@/components/Hero";
import StorySection from "@/components/StorySection";
import ExperienceSection from "@/components/ExperienceSection";
import Footer from "@/components/Footer";
import { buildIndex } from "@/lib/omniIndex";
import { basePath } from "@/lib/site";

export default async function Home() {
  /* the hero's ask line reads the same index the /intelligence omnibox does */
  const index = await buildIndex();
  return (
    <>
      {/* Preload the above-the-fold hero image per breakpoint (LCP). */}
      <link rel="preload" as="image" href={`${basePath}/images/new-hero-desktop.avif`} type="image/avif" media="(min-width: 768px)" fetchPriority="high" />
      <link rel="preload" as="image" href={`${basePath}/images/new-hero-mobile.avif`} type="image/avif" media="(max-width: 767px)" fetchPriority="high" />
      <link rel="preload" as="image" href={`${basePath}/images/new-hero-mobile.webp`} type="image/webp" media="(max-width: 767px)" fetchPriority="high" />
      <main>
        <Hero index={index} />
        <StorySection />
        <ExperienceSection />
      </main>
      <Footer />
    </>
  );
}
