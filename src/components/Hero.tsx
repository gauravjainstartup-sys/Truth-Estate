"use client";

import Logo from "./Logo";
import { useJourney } from "./journey/JourneyProvider";
import { PRIMARY_CTA } from "@/lib/journey";

const basePath = "/Truth-Estate";

export default function Hero() {
  const { open } = useJourney();
  return (
    <section className="relative min-h-svh w-full overflow-hidden">
      {/* ─── DESKTOP ─── */}
      <div className="hidden h-svh md:block">
        <img
          src={`${basePath}/images/hero-desktop.jpg`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "center center",
            transform: "scale(1.01) rotate(-0.15deg)",
            filter: "brightness(0.68) contrast(1.10) saturate(1.02)",
          }}
        />

        {/* Depth of field — verdict document stays sharp */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(1.8px)",
            WebkitBackdropFilter: "blur(1.8px)",
            maskImage:
              "radial-gradient(ellipse 28% 48% at 60% 50%, transparent 28%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 28% 48% at 60% 50%, transparent 28%, black 100%)",
          }}
        />

        {/* Warm morning light */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(255,220,170,0.025) 0%, transparent 100%)",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 72% 68% at 50% 50%, transparent 42%, rgba(4,6,5,0.42) 100%)",
          }}
        />

        {/* Text readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(4,6,5,0.78) 0%, rgba(4,6,5,0.45) 22%, rgba(4,6,5,0.10) 38%, transparent 48%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between py-14 pl-20 lg:py-20 lg:pl-28">
          <nav className="animate-fade-up flex items-center pr-12 lg:pr-20">
            <Logo className="h-10 w-auto opacity-75 lg:h-[3rem]" />
            <div className="ml-auto hidden items-center gap-20 text-[10px] font-light tracking-[0.18em] text-white/50 lg:flex">
              <a href="#" className="transition-colors duration-500 hover:text-white/80">
                Projects
              </a>
              <a href="#" className="transition-colors duration-500 hover:text-white/80">
                Compare
              </a>
              <a href="#" className="transition-colors duration-500 hover:text-white/80">
                TruthGuide
              </a>
              <a href="#" className="transition-colors duration-500 hover:text-white/80">
                Private Office
              </a>
            </div>
          </nav>

          <div className="flex max-w-xl flex-col">
            <h1
              className="animate-fade-up font-serif text-[3.2rem] font-bold leading-[1.1] text-white lg:text-[3.9rem]"
              style={{ animationDelay: "100ms" }}
            >
              Decisions
              <br />
              Worth Living With.
            </h1>

            <div style={{ height: "40px" }} />

            <p
              className="animate-fade-up text-[16px] leading-[1.8] text-white/45"
              style={{ animationDelay: "300ms" }}
            >
              Independent representation for
              <br />
              life&apos;s biggest real estate decisions.
            </p>

            <div style={{ height: "44px" }} />

            <div
              className="animate-fade-up flex items-center gap-8"
              style={{ animationDelay: "400ms" }}
            >
              <button
                onClick={() => open()}
                className="rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/30 transition-all duration-500 hover:bg-[#238c55]"
              >
                {PRIMARY_CTA}
              </button>
              <button
                onClick={() => open("research")}
                className="text-[13px] tracking-[0.04em] text-white/55 transition-colors duration-500 hover:text-white/80"
              >
                Challenge TruthGuide &rarr;
              </button>
            </div>
          </div>

          {/* Verdict-paper belief — captioned at the foot of the hero */}
          <div
            className="animate-fade-up max-w-md"
            style={{ animationDelay: "560ms" }}
          >
            <div className="h-px w-full bg-white/15" />
            <p className="mt-7 font-serif text-[17px] italic leading-[1.7] text-white/40">
              &ldquo;We recommend only what we&apos;d buy ourselves.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* ─── MOBILE ─── */}
      <div className="relative h-svh md:hidden overflow-hidden">
        <img
          src={`${basePath}/images/hero-mobile.jpg`}
          alt=""
          className="absolute left-0 top-0 w-full object-cover"
          style={{
            height: "140%",
            objectPosition: "center 8%",
            /* Blur applied directly to the image — reliable on iOS Safari,
               unlike masked backdrop-filter. Keeps the document soft. */
            filter: "brightness(0.42) contrast(1.06) saturate(1.0) blur(2px)",
          }}
        />

        {/* Dark scrim — heavy enough that the verdict document reads only
            as faint atmospheric texture, never a competing focal point,
            even on bright OLED displays */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,6,5,0.96) 0%, rgba(4,6,5,0.95) 38%, rgba(4,6,5,0.92) 58%, rgba(4,6,5,0.88) 74%, rgba(4,6,5,0.78) 88%, rgba(4,6,5,0.66) 100%)",
          }}
        />

        {/* Subtle edge vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 45%, rgba(4,6,5,0.40) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col px-7 pt-10 pb-8">
          <nav className="animate-fade-up flex items-center justify-between">
            <Logo className="h-9 w-auto opacity-85" />
            <button className="flex flex-col gap-[6px]" aria-label="Open menu">
              <span className="block h-[1.5px] w-6 bg-white/40" />
              <span className="block h-[1.5px] w-6 bg-white/40" />
            </button>
          </nav>

          <div className="mt-[9vh] flex flex-col">
            <h1
              className="animate-fade-up font-serif text-[2.3rem] font-bold leading-[1.16] text-white"
              style={{ animationDelay: "100ms" }}
            >
              Decisions
              <br />
              Worth Living With.
            </h1>

            <div style={{ height: "26px" }} />

            <p
              className="animate-fade-up text-[15px] leading-[1.85] text-white/60"
              style={{ animationDelay: "250ms", textShadow: "0 1px 14px rgba(4,6,5,0.6)" }}
            >
              Independent representation for
              <br />
              life&apos;s biggest real estate decisions.
            </p>

            <div style={{ height: "34px" }} />

            {/* CTAs */}
            <div className="flex flex-col gap-4">
              <button
                onClick={() => open()}
                className="animate-fade-up inline-block self-start rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/30 transition-all duration-500 hover:bg-[#238c55]"
                style={{ animationDelay: "350ms" }}
              >
                {PRIMARY_CTA}
              </button>

              <button
                onClick={() => open("research")}
                className="animate-fade-up self-start text-[13px] tracking-[0.04em] text-white/45 transition-colors duration-500 hover:text-white/70"
                style={{ animationDelay: "400ms" }}
              >
                Challenge TruthGuide &rarr;
              </button>
            </div>
          </div>

          {/* Verdict-paper belief — captioned at the foot of the hero */}
          <div className="animate-fade-up mt-auto" style={{ animationDelay: "520ms" }}>
            <div className="h-px w-full bg-white/15" />
            <p
              className="mt-6 font-serif text-[15px] italic leading-[1.7] text-white/55"
              style={{ textShadow: "0 1px 14px rgba(4,6,5,0.6)" }}
            >
              &ldquo;We recommend only what we&apos;d buy ourselves.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
