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
      {/* Preload the above-the-fold hero image per breakpoint (LCP). The URL,
         type and media MUST match what <Hero>'s <picture> actually serves, or
         the browser fetches the preloaded file AND the one the picture picks —
         mobile was doing exactly that (a 339 KB webp preload wasted alongside
         the 35 KB avif the picture chose). Both now preload the AVIF the picture
         prefers; `type` lets a non-AVIF browser skip the preload and fall to the
         picture's webp, so there is no wasted fetch either way. */}
      <link rel="preload" as="image" href={`${basePath}/images/new-hero-desktop.avif`} type="image/avif" media="(min-width: 768px)" fetchPriority="high" />
      <link rel="preload" as="image" href={`${basePath}/images/new-hero-mobile.avif`} type="image/avif" media="(max-width: 767px)" fetchPriority="high" />
      <main>
        <Hero index={index} />
        <ExperienceSection stats={coverage} />
      </main>
      <Footer />
    </>
  );
}
