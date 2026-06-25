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
            transform: "scale(1.03) rotate(-0.4deg)",
            filter: "brightness(0.58) contrast(1.15) saturate(0.95)",
          }}
        />

        {/* Depth — scene falls softly out of focus */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(1.8px)",
            WebkitBackdropFilter: "blur(1.8px)",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 65% at 50% 50%, transparent 40%, rgba(4,6,5,0.45) 100%)",
          }}
        />

        {/* Text readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(4,6,5,0.72) 0%, rgba(4,6,5,0.35) 28%, rgba(4,6,5,0.06) 48%, transparent 58%)",
          }}
        />

        {/* ─── The Verdict ─── */}
        <div
          className="absolute right-[8%] top-1/2 z-10 hidden lg:block"
          style={{ transform: "translateY(-50%) rotate(-0.8deg)" }}
        >
          <div className="animate-fade-up" style={{ animationDelay: "500ms" }}>
            <div
              className="w-[260px] px-10 py-12"
              style={{
                background: "rgba(245, 240, 232, 0.93)",
                boxShadow:
                  "8px 16px 60px rgba(0,0,0,0.45), 2px 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              <p
                className="font-sans uppercase"
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.35em",
                  color: "rgba(30,30,30,0.4)",
                }}
              >
                Property Verdict
              </p>

              <div
                className="my-5 h-px"
                style={{ background: "rgba(201,169,110,0.3)" }}
              />

              <p
                className="font-serif font-light leading-none"
                style={{ fontSize: "2.2rem", color: "#1a1a1a" }}
              >
                Proceed
              </p>

              <p
                className="mt-2 font-serif"
                style={{
                  fontSize: "1rem",
                  letterSpacing: "0.06em",
                  color: "rgba(30,30,30,0.55)",
                }}
              >
                DLF Arbour
              </p>

              <div className="mt-7">
                <p
                  className="font-sans uppercase"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.3em",
                    color: "rgba(30,30,30,0.35)",
                  }}
                >
                  Confidence
                </p>
                <p
                  className="mt-0.5 font-serif font-light"
                  style={{ fontSize: "1.8rem", color: "#1a1a1a" }}
                >
                  97%
                </p>
              </div>

              <div
                className="my-5 h-px"
                style={{ background: "rgba(201,169,110,0.3)" }}
              />

              <p
                className="font-sans uppercase"
                style={{
                  fontSize: "8px",
                  letterSpacing: "0.3em",
                  color: "rgba(30,30,30,0.28)",
                }}
              >
                Prepared by
              </p>
              <p
                className="mt-1 font-serif"
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  color: "rgba(30,30,30,0.45)",
                }}
              >
                Truth Estate
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between py-14 pl-20 lg:py-20 lg:pl-28">
          <nav className="animate-fade-up flex items-center pr-12 lg:pr-20">
            <Logo className="h-10 w-auto opacity-70 lg:h-[3rem]" />
            <div className="ml-auto hidden items-center gap-16 text-[10px] font-light tracking-[0.3em] text-white/30 lg:flex">
              <a href="#" className="transition-colors duration-500 hover:text-white/50">
                ADVISORY
              </a>
              <a href="#" className="transition-colors duration-500 hover:text-white/50">
                RESEARCH
              </a>
              <a href="#" className="transition-colors duration-500 hover:text-white/50">
                ABOUT
              </a>
              <a href="#" className="transition-colors duration-500 hover:text-white/50">
                CONTACT
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

            <div className="h-28" />

            <div
              className="animate-fade-up flex flex-col gap-[14px] text-[17px] leading-[1.9] text-white/45"
              style={{ animationDelay: "300ms" }}
            >
              <p>Buying luxury real estate?</p>
              <p>You don&apos;t need more opinions.</p>
              <p>
                You need{" "}
                <span className="font-serif italic text-[#c9a96e]">
                  one conclusion.
                </span>
              </p>
            </div>

            <div className="h-20" />

            <div
              className="animate-fade-up flex items-center gap-10"
              style={{ animationDelay: "300ms" }}
            >
              <a
                href="#"
                className="border border-white/15 px-10 py-4 text-[12px] tracking-[0.14em] text-white/60 transition-all duration-500 hover:border-white/30 hover:text-white/80"
              >
                Start My Search
              </a>
              <a
                href="#"
                className="text-[12px] tracking-[0.06em] text-white/25 transition-colors duration-500 hover:text-white/45"
              >
                See How We Think &rarr;
              </a>
            </div>
          </div>

          <div />
        </div>
      </div>

      {/* ─── MOBILE ─── */}
      <div className="flex min-h-svh flex-col bg-[#080c0a] md:hidden">
        <nav className="animate-fade-up flex items-center justify-between px-7 py-8">
          <Logo className="h-8 w-auto opacity-70" />
          <button className="flex flex-col gap-[5px]" aria-label="Open menu">
            <span className="block h-px w-5 bg-white/30" />
            <span className="block h-px w-5 bg-white/30" />
          </button>
        </nav>

        <div className="flex flex-1 flex-col justify-center px-7 pb-10">
          <h1
            className="animate-fade-up font-serif text-[2.6rem] font-bold leading-[1.18] text-white"
            style={{ animationDelay: "100ms" }}
          >
            Decisions
            <br />
            Worth
            <br />
            Living With.
          </h1>

          <div className="h-14" />

          <div
            className="animate-fade-up flex flex-col gap-3 text-[15px] leading-[1.9] text-white/40"
            style={{ animationDelay: "250ms" }}
          >
            <p>Buying luxury real estate?</p>
            <p>You don&apos;t need more opinions.</p>
            <p>
              You need{" "}
              <span className="font-serif italic text-[#c9a96e]">
                one conclusion.
              </span>
            </p>
          </div>

          <div className="h-14" />

          <div
            className="animate-fade-up flex flex-col gap-5"
            style={{ animationDelay: "250ms" }}
          >
            <a
              href="#"
              className="w-full border border-white/15 py-4 text-center text-[12px] tracking-[0.14em] text-white/60 transition-all duration-500 hover:border-white/30 hover:text-white/80"
            >
              Start My Search
            </a>
            <a
              href="#"
              className="text-center text-[12px] tracking-[0.06em] text-white/20"
            >
              See How We Think &rarr;
            </a>
          </div>
        </div>

        <div className="relative animate-fade-up" style={{ animationDelay: "400ms" }}>
          <img
            src={`${basePath}/images/hero-mobile.jpg`}
            alt=""
            className="h-[42vh] w-full object-cover object-top"
            style={{ filter: "brightness(0.62) contrast(1.12)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(8,12,10,0.4) 0%, transparent 25%, transparent 80%, rgba(8,12,10,0.3) 100%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
