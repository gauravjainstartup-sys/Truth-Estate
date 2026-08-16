import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { buildIndex } from "@/lib/omniIndex";
import { basePath } from "@/lib/site";

// Dynamic import below-the-fold heavy animation sections so GSAP is split from critical initial bundle
const StorySection = dynamic(() => import("@/components/StorySection"));
const ExperienceSection = dynamic(() => import("@/components/ExperienceSection"));

export default async function Home() {
  /* the hero's ask line reads the same index the /intelligence omnibox does */
  const index = await buildIndex();
  return (
    <>
      {/* Preload only the exact 1-to-1 LCP hero image per breakpoint */}
      <link rel="preload" as="image" href={`${basePath}/images/new-hero-desktop.avif`} type="image/avif" media="(min-width: 768px)" fetchPriority="high" />
      <link rel="preload" as="image" href={`${basePath}/images/new-hero-mobile.avif`} type="image/avif" media="(max-width: 767px)" fetchPriority="high" />
      <main>
        <Hero index={index} />
        <StorySection />
        <ExperienceSection />
      </main>
      <Footer />
    </>
  );
}
