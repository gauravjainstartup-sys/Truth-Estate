"use client";

import Logo from "./Logo";

const basePath = "/Truth-Estate";

export default function Hero() {
  return (
    <section className="relative min-h-svh w-full overflow-hidden">
      {/* ─── DESKTOP ─── */}
      <div className="hidden h-svh md:block">
        {/* Full-bleed hero image — this IS the hero */}
        <img
          src={`${basePath}/images/hero-desktop.jpg`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "center center",
            transform: "scale(1.04) rotate(-0.5deg)",
            filter: "brightness(0.78) contrast(1.06)",
          }}
        />

        {/* Warm light on the report */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 35% 45% at 58% 42%, rgba(255,235,200,0.06) 0%, transparent 100%)",
          }}
        />

        {/* Text readability gradient — just enough, nothing more */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(6,8,7,0.68) 0%, rgba(6,8,7,0.4) 32%, rgba(6,8,7,0.08) 52%, transparent 65%)",
          }}
        />

        {/* Content — floating inside the photography */}
        <div className="relative z-10 flex h-full flex-col justify-between py-12 pl-20 lg:py-16 lg:pl-28">
          <nav className="animate-fade-up flex items-center pr-12 lg:pr-20">
            <Logo className="h-11 w-auto lg:h-13" />
            <div className="ml-auto hidden items-center gap-12 text-[11px] font-light tracking-[0.25em] text-white/25 lg:flex">
              <a href="#" className="transition-colors duration-500 hover:text-white/50">ADVISORY</a>
              <a href="#" className="transition-colors duration-500 hover:text-white/50">RESEARCH</a>
              <a href="#" className="transition-colors duration-500 hover:text-white/50">ABOUT</a>
              <a href="#" className="transition-colors duration-500 hover:text-white/50">CONTACT</a>
            </div>
          </nav>

          <div className="flex max-w-md flex-col lg:max-w-lg">
            <h1
              className="animate-fade-up font-serif text-[4.25rem] font-bold leading-[1.15] text-white lg:text-[5.25rem]"
              style={{ animationDelay: "100ms" }}
            >
              Decisions
              <br />
              Worth
              <br />
              Living With.
            </h1>

            <div className="h-16" />

            <div
              className="animate-fade-up flex flex-col gap-[14px] text-[17px] leading-[1.8] text-white/50"
              style={{ animationDelay: "300ms" }}
            >
              <p>Buying in India.</p>
              <p>Living anywhere.</p>
              <p>One decision. No second chances.</p>
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

            <div className="h-12" />

            <p
              className="animate-fade-up font-serif text-[15px] italic leading-[1.8] text-white/18"
              style={{ animationDelay: "300ms" }}
            >
              Prepared as if it were
              <br />
              our own family&apos;s decision.
            </p>
          </div>

          <div />
        </div>
      </div>

      {/* ─── MOBILE ─── */}
      <div className="flex min-h-svh flex-col md:hidden">
        <nav className="animate-fade-up flex items-center justify-between px-7 py-7">
          <Logo className="h-9 w-auto" />
          <button className="flex flex-col gap-[5px]" aria-label="Open menu">
            <span className="block h-px w-5 bg-white/35" />
            <span className="block h-px w-5 bg-white/35" />
          </button>
        </nav>

        <div className="flex flex-1 flex-col justify-center px-7 pb-8">
          <h1
            className="animate-fade-up font-serif text-[2.5rem] font-bold leading-[1.15] text-white"
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
            <p>Buying in India.</p>
            <p>Living anywhere.</p>
            <p>One decision. No second chances.</p>
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

        <div className="animate-fade-up" style={{ animationDelay: "400ms" }}>
          <img
            src={`${basePath}/images/hero-mobile.jpg`}
            alt=""
            className="h-[40vh] w-full object-cover object-top"
            style={{ filter: "brightness(0.72) contrast(1.08)" }}
          />
        </div>
      </div>
    </section>
  );
}
