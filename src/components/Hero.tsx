"use client";

import Logo from "./Logo";

const basePath = "/Truth-Estate";

export default function Hero() {
  return (
    <section className="relative min-h-svh w-full overflow-hidden bg-[#080c0a]">
      {/* ─── DESKTOP ─── */}
      <div className="hidden h-svh md:flex">
        {/* Left panel */}
        <div className="relative z-10 flex w-[50%] shrink-0 flex-col justify-between py-12 pl-20 pr-14 lg:py-16 lg:pl-28 lg:pr-20">
          <nav className="animate-fade-up flex items-center justify-between">
            <Logo className="h-11 w-auto lg:h-13" />
            <div className="hidden items-center gap-12 text-[11px] font-light tracking-[0.25em] text-white/30 lg:flex">
              <a href="#" className="transition-colors duration-500 hover:text-white/60">ADVISORY</a>
              <a href="#" className="transition-colors duration-500 hover:text-white/60">RESEARCH</a>
              <a href="#" className="transition-colors duration-500 hover:text-white/60">ABOUT</a>
              <a href="#" className="transition-colors duration-500 hover:text-white/60">CONTACT</a>
            </div>
          </nav>

          <div className="flex flex-col">
            <h1
              className="animate-fade-up font-serif text-[4.25rem] font-bold leading-[1.15] text-white lg:text-[5.25rem]"
              style={{ animationDelay: "150ms" }}
            >
              Decisions
              <br />
              Worth
              <br />
              Living With.
            </h1>

            <div className="h-16" />

            <div
              className="animate-fade-up flex flex-col gap-5 text-[17px] leading-[1.75] text-white/50"
              style={{ animationDelay: "350ms" }}
            >
              <p>Buying luxury real estate from overseas?</p>
              <p>You don&apos;t need more opinions.</p>
              <p>You need one conclusion.</p>
            </div>

            <div className="h-14" />

            <div
              className="animate-fade-up flex items-center gap-10"
              style={{ animationDelay: "350ms" }}
            >
              <a
                href="#"
                className="bg-[#1e4d3a] px-8 py-4 text-[13px] tracking-[0.15em] text-white/90 transition-colors duration-500 hover:bg-[#256b4e]"
              >
                Begin a Conversation
              </a>
              <a
                href="#"
                className="text-[13px] tracking-[0.08em] text-white/30 transition-colors duration-500 hover:text-white/55"
              >
                See How We Think &rarr;
              </a>
            </div>

            <div className="h-12" />

            <p
              className="animate-fade-up font-serif text-base italic leading-[1.8] text-white/25"
              style={{ animationDelay: "350ms" }}
            >
              Prepared as if it were
              <br />
              our own family&apos;s decision.
            </p>
          </div>

          <div />
        </div>

        {/* Right panel */}
        <div className="relative w-[50%]">
          <img
            src={`${basePath}/images/hero-desktop.jpg`}
            alt=""
            className="h-full w-full object-cover object-center brightness-[0.85]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(8,12,10,0.92) 0%, rgba(8,12,10,0.55) 35%, rgba(8,12,10,0) 65%)",
            }}
          />
        </div>
      </div>

      {/* ─── MOBILE ─── */}
      <div className="flex min-h-svh flex-col md:hidden">
        <nav className="animate-fade-up flex items-center justify-between px-7 py-7">
          <Logo className="h-9 w-auto" />
          <button className="flex flex-col gap-[5px]" aria-label="Open menu">
            <span className="block h-px w-5 bg-white/40" />
            <span className="block h-px w-5 bg-white/40" />
          </button>
        </nav>

        <div className="flex flex-1 flex-col justify-center px-7 pb-10">
          <h1
            className="animate-fade-up font-serif text-[2.5rem] font-bold leading-[1.15] text-white"
            style={{ animationDelay: "150ms" }}
          >
            Decisions
            <br />
            Worth
            <br />
            Living With.
          </h1>

          <div className="h-10" />

          <div
            className="animate-fade-up flex flex-col gap-3.5 text-[15px] leading-[1.75] text-white/50"
            style={{ animationDelay: "300ms" }}
          >
            <p>Buying luxury real estate from overseas?</p>
            <p>You don&apos;t need more opinions.</p>
            <p>You need one conclusion.</p>
          </div>

          <div className="h-10" />

          <div
            className="animate-fade-up flex flex-col gap-5"
            style={{ animationDelay: "300ms" }}
          >
            <a
              href="#"
              className="w-full bg-[#1e4d3a] px-8 py-4 text-center text-[13px] tracking-[0.15em] text-white/90 transition-colors duration-500 hover:bg-[#256b4e]"
            >
              Begin a Conversation
            </a>
            <a
              href="#"
              className="text-center text-[13px] tracking-[0.08em] text-white/30"
            >
              See How We Think &rarr;
            </a>
          </div>

          <div className="h-8" />

          <p
            className="animate-fade-up font-serif text-[14px] italic leading-[1.8] text-white/20"
            style={{ animationDelay: "300ms" }}
          >
            Prepared as if it were
            <br />
            our own family&apos;s decision.
          </p>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "450ms" }}>
          <img
            src={`${basePath}/images/hero-mobile.jpg`}
            alt=""
            className="h-[42vh] w-full object-cover object-top brightness-[0.85]"
          />
        </div>
      </div>
    </section>
  );
}
