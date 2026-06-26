"use client";

import Logo from "./Logo";

const basePath = "/Truth-Estate";

export default function Hero() {
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
            filter: "brightness(0.52) contrast(1.10) saturate(1.02)",
          }}
        />

        {/* Depth blur — verdict document becomes an atmospheric artifact */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(2.5px)",
            WebkitBackdropFilter: "blur(2.5px)",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 55%, transparent 78%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 55%, transparent 78%, transparent 100%)",
          }}
        />

        {/* Dark scrim */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,6,5,0.90) 0%, rgba(4,6,5,0.88) 30%, rgba(4,6,5,0.82) 52%, rgba(4,6,5,0.72) 68%, rgba(4,6,5,0.55) 82%, rgba(4,6,5,0.50) 100%)",
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
        <div className="relative z-10 flex h-full flex-col px-7 pt-10 pb-12">
          <nav className="animate-fade-up flex items-center justify-between">
            <Logo className="h-9 w-auto opacity-85" />
            <button className="flex flex-col gap-[6px]" aria-label="Open menu">
              <span className="block h-[1.5px] w-6 bg-white/40" />
              <span className="block h-[1.5px] w-6 bg-white/40" />
            </button>
          </nav>

          <div className="mt-[13vh] flex flex-col">
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

            <div style={{ height: "36px" }} />

            <p
              className="animate-fade-up text-[15px] leading-[1.85] text-white/60"
              style={{ animationDelay: "250ms", textShadow: "0 1px 14px rgba(4,6,5,0.6)" }}
            >
              Independent thinking for
              <br />
              India&apos;s biggest purchase.
            </p>

            <div style={{ height: "36px" }} />

            {/* Brand belief — editorial pull quote */}
            <div
              className="animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <div className="w-12 h-px bg-[#c9a96e]/50" />
              <p
                className="my-5 font-serif text-[15px] italic leading-[1.75] text-white/45"
                style={{ textShadow: "0 1px 14px rgba(4,6,5,0.6)" }}
              >
                We recommend only what
                <br />
                we&apos;d buy ourselves.
              </p>
              <div className="w-12 h-px bg-[#c9a96e]/50" />
            </div>

            <div style={{ height: "44px" }} />

            {/* CTAs */}
            <div className="flex flex-col gap-5">
              <a
                href="#"
                className="animate-fade-up inline-block self-start rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/30 transition-all duration-500 hover:bg-[#238c55]"
                style={{ animationDelay: "380ms" }}
              >
                Start Your Private Office
              </a>

              <button
                onClick={() =>
                  document
                    .getElementById("editorial")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="animate-fade-up self-start text-[13px] tracking-[0.04em] text-white/45 transition-colors duration-500 hover:text-white/70"
                style={{ animationDelay: "420ms" }}
              >
                Ask TruthGuide &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
