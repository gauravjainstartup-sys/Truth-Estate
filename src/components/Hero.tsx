"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";

const basePath = "/Truth-Estate";

export default function Hero() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

          <div className="flex max-w-md flex-col lg:max-w-lg">
            <h1
              className="animate-fade-up font-serif text-[4.5rem] font-bold leading-[1.15] text-white lg:text-[5.5rem]"
              style={{ animationDelay: "100ms" }}
            >
              Decisions
              <br />
              Worth
              <br />
              Living With.
            </h1>

            <div style={{ height: "64px" }} />

            <p
              className="animate-fade-up text-[16px] leading-[1.8] text-white/40"
              style={{ animationDelay: "300ms" }}
            >
              Independent thinking for
              <br />
              life&apos;s biggest real estate decisions.
            </p>

            <div style={{ height: "28px" }} />

            <div
              className="animate-fade-up"
              style={{ animationDelay: "320ms" }}
            >
              <div
                style={{
                  width: "40px",
                  height: "1px",
                  background: "#c9a96e",
                }}
              />
            </div>

            <div style={{ height: "24px" }} />

            <p
              className="animate-fade-up font-serif text-[17px] italic leading-[1.7] text-white/35"
              style={{ animationDelay: "350ms" }}
            >
              We recommend only what
              <br />
              we&apos;d buy ourselves.
            </p>

            <div style={{ height: "64px" }} />

            <div
              className="animate-fade-up flex items-center gap-8"
              style={{ animationDelay: "400ms" }}
            >
              <a
                href="#"
                className="rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/30 transition-all duration-500 hover:bg-[#238c55]"
              >
                Get Your Verdict
              </a>
              <button
                onClick={() =>
                  document
                    .getElementById("editorial")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="text-[13px] tracking-[0.04em] text-white/55 transition-colors duration-500 hover:text-white/80"
              >
                See How We Think &rarr;
              </button>
            </div>
          </div>

          <div />
        </div>

        {/* Scroll cue — teaches the gesture, fades the moment you engage */}
        <div
          className="pointer-events-none absolute bottom-9 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 transition-opacity duration-700"
          style={{ opacity: scrolled ? 0 : 1 }}
        >
          <span className="text-[9px] font-light uppercase tracking-[0.42em] text-white/40">
            Scroll
          </span>
          <span className="relative block h-12 w-px overflow-hidden bg-white/15">
            <span
              className="absolute left-0 top-0 block h-3 w-px bg-[#c9a96e]"
              style={{
                animation: "scroll-travel 2.2s cubic-bezier(0.4,0,0.2,1) infinite",
              }}
            />
          </span>
        </div>
      </div>

      {/* ─── MOBILE ─── */}
      <div className="relative h-svh md:hidden overflow-hidden">
        <img
          src={`${basePath}/images/hero-mobile.jpg`}
          alt=""
          className="absolute left-0 top-0 w-full object-cover"
          style={{
            height: "145%",
            objectPosition: "center top",
            filter: "brightness(0.48) contrast(1.10) saturate(1.02)",
          }}
        />

        {/* Full-screen dark overlay — image as barely-there texture */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,6,5,0.97) 0%, rgba(4,6,5,0.95) 20%, rgba(4,6,5,0.90) 40%, rgba(4,6,5,0.92) 55%, rgba(4,6,5,0.93) 70%, rgba(4,6,5,0.96) 85%, rgba(4,6,5,0.98) 100%)",
          }}
        />

        {/* Subtle edge vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 45%, rgba(4,6,5,0.35) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between px-7 pt-10 pb-12">
          <nav className="animate-fade-up flex items-center justify-between">
            <Logo className="h-9 w-auto opacity-85" />
            <button className="flex flex-col gap-[6px]" aria-label="Open menu">
              <span className="block h-[1.5px] w-6 bg-white/40" />
              <span className="block h-[1.5px] w-6 bg-white/40" />
            </button>
          </nav>

          <div className="flex flex-col">
            <h1
              className="animate-fade-up font-serif text-[2.8rem] font-bold leading-[1.18] text-white"
              style={{ animationDelay: "100ms" }}
            >
              Decisions
              <br />
              Worth
              <br />
              Living With.
            </h1>

            <div style={{ height: "28px" }} />

            <p
              className="animate-fade-up text-[15px] leading-[1.8] text-white/60"
              style={{ animationDelay: "250ms" }}
            >
              Independent thinking for
              <br />
              life&apos;s biggest real estate decisions.
            </p>

            <div style={{ height: "20px" }} />

            <div
              className="animate-fade-up"
              style={{ animationDelay: "270ms" }}
            >
              <div
                style={{
                  width: "32px",
                  height: "1px",
                  background: "#c9a96e",
                }}
              />
            </div>

            <div style={{ height: "18px" }} />

            <p
              className="animate-fade-up font-serif text-[15px] italic leading-[1.7] text-white/45"
              style={{ animationDelay: "300ms" }}
            >
              We recommend only what
              <br />
              we&apos;d buy ourselves.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div
              className="animate-fade-up"
              style={{ animationDelay: "350ms" }}
            >
              <a
                href="#"
                className="inline-block rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/30 transition-all duration-500 hover:bg-[#238c55]"
              >
                Get Your Verdict
              </a>
            </div>

            <button
              onClick={() =>
                document
                  .getElementById("editorial")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="animate-fade-up text-[13px] tracking-[0.04em] text-white/55"
              style={{ animationDelay: "380ms" }}
            >
              See How We Think &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
