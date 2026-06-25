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
            filter: "brightness(0.55) contrast(1.18) saturate(1.05)",
          }}
        />

        {/* Depth of field — sharp zone around the memo */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(2.2px)",
            WebkitBackdropFilter: "blur(2.2px)",
            maskImage:
              "radial-gradient(ellipse 24% 40% at 75% 50%, transparent 30%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 24% 40% at 75% 50%, transparent 30%, black 100%)",
          }}
        />

        {/* Warm morning light */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(255,220,170,0.03) 0%, transparent 100%)",
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
              "linear-gradient(to right, rgba(4,6,5,0.75) 0%, rgba(4,6,5,0.40) 25%, rgba(4,6,5,0.08) 45%, transparent 55%)",
          }}
        />

        {/* ─── The Verdict ─── */}
        <div
          className="absolute right-[6%] top-1/2 z-10 hidden lg:block"
          style={{ transform: "translateY(-50%) rotate(-0.8deg)" }}
        >
          <div className="animate-fade-up" style={{ animationDelay: "500ms" }}>
            <div
              className="w-[320px]"
              style={{
                background: "rgba(245, 240, 232, 0.94)",
                boxShadow:
                  "10px 20px 70px rgba(0,0,0,0.5), 3px 6px 20px rgba(0,0,0,0.18)",
                padding: "56px 48px",
              }}
            >
              <p
                className="font-sans uppercase"
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.35em",
                  color: "rgba(30,30,30,0.38)",
                }}
              >
                Property Verdict
              </p>

              <div
                className="my-7 h-px"
                style={{ background: "rgba(201,169,110,0.28)" }}
              />

              <p
                className="font-serif font-light leading-none"
                style={{ fontSize: "2.6rem", color: "#1a1a1a" }}
              >
                Proceed
              </p>

              <p
                className="mt-3 font-serif"
                style={{
                  fontSize: "1.1rem",
                  letterSpacing: "0.06em",
                  color: "rgba(30,30,30,0.5)",
                }}
              >
                DLF Arbour
              </p>

              <div className="mt-9">
                <p
                  className="font-sans uppercase"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.3em",
                    color: "rgba(30,30,30,0.32)",
                  }}
                >
                  Confidence
                </p>
                <p
                  className="mt-1 font-serif font-light"
                  style={{ fontSize: "2rem", color: "#1a1a1a" }}
                >
                  97%
                </p>
              </div>

              <div
                className="my-7 h-px"
                style={{ background: "rgba(201,169,110,0.28)" }}
              />

              <p
                className="font-sans uppercase"
                style={{
                  fontSize: "8px",
                  letterSpacing: "0.3em",
                  color: "rgba(30,30,30,0.25)",
                }}
              >
                Prepared by
              </p>
              <p
                className="mt-1 font-serif"
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  color: "rgba(30,30,30,0.42)",
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
            <Logo className="h-10 w-auto opacity-75 lg:h-[3rem]" />
            <div className="ml-auto hidden items-center gap-16 text-[10px] font-light tracking-[0.3em] text-white/25 lg:flex">
              <a href="#" className="transition-colors duration-500 hover:text-white/45">
                ADVISORY
              </a>
              <a href="#" className="transition-colors duration-500 hover:text-white/45">
                RESEARCH
              </a>
              <a href="#" className="transition-colors duration-500 hover:text-white/45">
                ABOUT
              </a>
              <a href="#" className="transition-colors duration-500 hover:text-white/45">
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

            <div style={{ height: "56px" }} />

            <p
              className="animate-fade-up text-[16px] leading-[1.8] text-white/40"
              style={{ animationDelay: "300ms" }}
            >
              Independent intelligence
              <br />
              for India&apos;s biggest purchase.
            </p>

            <div style={{ height: "40px" }} />

            <p
              className="animate-fade-up font-serif text-[17px] italic leading-[1.7] text-white/50"
              style={{ animationDelay: "350ms" }}
            >
              We recommend only what
              <br />
              we&apos;d buy ourselves.
            </p>

            <div style={{ height: "56px" }} />

            <div
              className="animate-fade-up flex items-center gap-8"
              style={{ animationDelay: "400ms" }}
            >
              <a
                href="#"
                className="rounded bg-[#1e4d3a] px-8 py-3.5 text-[13px] tracking-[0.06em] text-white/90 transition-colors duration-500 hover:bg-[#256b4e]"
              >
                Tell Us What Matters
              </a>
              <a
                href="#"
                className="text-[13px] tracking-[0.04em] text-white/25 transition-colors duration-500 hover:text-white/45"
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
          <Logo className="h-8 w-auto opacity-75" />
          <button className="flex flex-col gap-[5px]" aria-label="Open menu">
            <span className="block h-px w-5 bg-white/25" />
            <span className="block h-px w-5 bg-white/25" />
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

          <div style={{ height: "44px" }} />

          <p
            className="animate-fade-up text-[15px] leading-[1.8] text-white/40"
            style={{ animationDelay: "250ms" }}
          >
            Independent intelligence
            <br />
            for India&apos;s biggest purchase.
          </p>

          <div style={{ height: "32px" }} />

          <p
            className="animate-fade-up font-serif text-[15px] italic leading-[1.7] text-white/45"
            style={{ animationDelay: "300ms" }}
          >
            We recommend only what
            <br />
            we&apos;d buy ourselves.
          </p>

          <div style={{ height: "44px" }} />

          <div
            className="animate-fade-up flex flex-col gap-5"
            style={{ animationDelay: "350ms" }}
          >
            <a
              href="#"
              className="w-full rounded bg-[#1e4d3a] py-4 text-center text-[13px] tracking-[0.06em] text-white/90 transition-colors duration-500 hover:bg-[#256b4e]"
            >
              Tell Us What Matters
            </a>
            <a
              href="#"
              className="text-center text-[13px] tracking-[0.04em] text-white/20"
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
            style={{ filter: "brightness(0.60) contrast(1.14)" }}
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
