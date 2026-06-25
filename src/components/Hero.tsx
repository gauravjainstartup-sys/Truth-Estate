"use client";

import Logo from "./Logo";

const basePath = "/Truth-Estate";

export default function Hero() {
  return (
    <section className="relative min-h-svh w-full overflow-hidden">
      {/* ─── DESKTOP ─── */}
      <div className="hidden h-svh md:block">
        {/* The photograph */}
        <img
          src={`${basePath}/images/hero-desktop.jpg`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "center center",
            transform: "scale(1.03) rotate(-0.4deg)",
            filter: "brightness(0.76) contrast(1.08)",
          }}
        />

        {/* Depth of field — everything soft except the memo */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(1.5px)",
            WebkitBackdropFilter: "blur(1.5px)",
            maskImage:
              "radial-gradient(ellipse 26% 36% at 58% 44%, transparent 35%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 26% 36% at 58% 44%, transparent 35%, black 100%)",
          }}
        />

        {/* Memo spotlight */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 22% 30% at 58% 44%, rgba(255,240,210,0.09) 0%, transparent 100%)",
          }}
        />

        {/* Morning light — upper left */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 10% 5%, rgba(255,220,170,0.04) 0%, transparent 100%)",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 45%, rgba(4,6,5,0.35) 100%)",
          }}
        />

        {/* Text gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(4,6,5,0.72) 0%, rgba(4,6,5,0.35) 28%, rgba(4,6,5,0.06) 48%, transparent 58%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between py-12 pl-20 lg:py-16 lg:pl-28">
          <nav className="animate-fade-up flex items-center pr-12 lg:pr-20">
            <Logo className="h-11 w-auto lg:h-[3.4rem]" />
            <div className="ml-auto hidden items-center gap-12 text-[11px] font-light tracking-[0.25em] text-white/35 lg:flex">
              <a href="#" className="transition-colors duration-500 hover:text-white/55">ADVISORY</a>
              <a href="#" className="transition-colors duration-500 hover:text-white/55">RESEARCH</a>
              <a href="#" className="transition-colors duration-500 hover:text-white/55">ABOUT</a>
              <a href="#" className="transition-colors duration-500 hover:text-white/55">CONTACT</a>
            </div>
          </nav>

          <div className="flex max-w-md flex-col lg:max-w-lg">
            <h1
              className="animate-fade-up font-serif text-[4.5rem] font-bold leading-[1.18] text-white lg:text-[5.5rem]"
              style={{ animationDelay: "100ms" }}
            >
              Decisions
              <br />
              Worth
              <br />
              Living With.
            </h1>

            <div className="h-20" />

            <div
              className="animate-fade-up flex flex-col gap-[14px] text-[17px] leading-[1.8] text-white/50"
              style={{ animationDelay: "300ms" }}
            >
              <p>Buying luxury real estate from overseas?</p>
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
              className="animate-fade-up flex items-center gap-10"
              style={{ animationDelay: "300ms" }}
            >
              <a
                href="#"
                className="bg-[#1e4d3a] px-8 py-4 text-[13px] tracking-[0.1em] text-white/90 transition-colors duration-500 hover:bg-[#256b4e]"
              >
                Start My Search
              </a>
              <a
                href="#"
                className="text-[13px] tracking-[0.06em] text-white/30 transition-colors duration-500 hover:text-white/55"
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
        <nav className="animate-fade-up flex items-center justify-between px-7 py-7">
          <Logo className="h-9 w-auto" />
          <button className="flex flex-col gap-[5px]" aria-label="Open menu">
            <span className="block h-px w-5 bg-white/35" />
            <span className="block h-px w-5 bg-white/35" />
          </button>
        </nav>

        <div className="flex flex-1 flex-col justify-center px-7 pb-8">
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

          <div className="h-10" />

          <div
            className="animate-fade-up flex flex-col gap-3 text-[15px] leading-[1.8] text-white/45"
            style={{ animationDelay: "250ms" }}
          >
            <p>Buying luxury real estate from overseas?</p>
            <p>You don&apos;t need more opinions.</p>
            <p>
              You need{" "}
              <span className="font-serif italic text-[#c9a96e]">
                one conclusion.
              </span>
            </p>
          </div>

          <div className="h-10" />

          <div
            className="animate-fade-up flex flex-col gap-5"
            style={{ animationDelay: "250ms" }}
          >
            <a
              href="#"
              className="w-full bg-[#1e4d3a] px-8 py-4 text-center text-[13px] tracking-[0.1em] text-white/90 transition-colors duration-500 hover:bg-[#256b4e]"
            >
              Start My Search
            </a>
            <a
              href="#"
              className="text-center text-[13px] tracking-[0.06em] text-white/25"
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
            style={{ filter: "brightness(0.72) contrast(1.08)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(8,12,10,0.3) 0%, transparent 25%, transparent 80%, rgba(8,12,10,0.2) 100%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
