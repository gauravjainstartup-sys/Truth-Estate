import Hero from "@/components/Hero";
import ExperienceSection from "@/components/ExperienceSection";
import Footer from "@/components/Footer";
import { buildIndex } from "@/lib/omniIndex";
import { buildCoverageStats } from "@/lib/coverageStats";
import { basePath } from "@/lib/site";

export default async function Home() {
  /* the hero's ask line reads the same index the /intelligence omnibox does;
     the coverage band reads the same backlog, so its counts stay in step */
  const [index, coverage] = await Promise.all([buildIndex(), buildCoverageStats()]);
  return (
    <>
      {/* Preload the above-the-fold hero image per breakpoint (LCP). */}
      <link rel="preload" as="image" href={`${basePath}/images/new-hero-desktop.webp`} type="image/webp" media="(min-width: 768px)" />
      <link rel="preload" as="image" href={`${basePath}/images/new-hero-mobile.webp`} type="image/webp" media="(max-width: 767px)" />
      <main>
        <Hero index={index} />
        <ExperienceSection stats={coverage} />
      </main>
      <Footer />
    </>
  );
}
