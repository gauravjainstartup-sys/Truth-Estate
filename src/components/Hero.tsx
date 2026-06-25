"use client";

import Logo from "./Logo";

const basePath = "/Truth-Estate";

export default function Hero() {
  return (
    <section className="relative min-h-svh w-full overflow-hidden bg-[#080c0a]">
      {/* ─── DESKTOP ─── */}
      <div className="hidden h-svh md:flex">
        {/* Left panel */}
        <div className="relative z-10 flex w-[50%] shrink-0 flex-col justify-between py-10 pl-16 pr-12 lg:py-14 lg:pl-24 lg:pr-16">
          {/* Nav */}
          <nav
            className="animate-fade-up flex items-center justify-between"
            style={{ animationDelay: "0ms" }}
          >
            <Logo className="h-11 w-auto lg:h-13" />
            <div className="hidden items-center gap-10 text-[11px] font-light tracking-[0.25em] text-white/35 lg:flex">
              <a href="#" className="transition-colors duration-300 hover:text-white/70">ADVISORY</a>
              <a href="#" className="transition-colors duration-300 hover:text-white/70">RESEARCH</a>
              <a href="#" className="transition-colors duration-300 hover:text-white/70">ABOUT</a>
              <a href="#" className="border border-white/15 px-5 py-2 text-white/40 transition-all duration-300 hover:border-white/30 hover:text-white/70">CONTACT</a>
            </div>
          </nav>

          {/* Content stack with precise vertical rhythm */}
          <div className="flex flex-col">
            {/* Eyebrow */}
            <div
              className="animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              <span className="text-[10px] font-light tracking-[0.4em] text-white/40">
                INDEPENDENT INTELLIGENCE
              </span>
              <div className="mt-3 h-px w-8 bg-[#c9a96e]/60" />
            </div>

            {/* 48px gap */}
            <div className="h-12" />

            {/* Headline */}
            <h1
              className="animate-fade-up font-serif text-[4.25rem] font-bold leading-[1.12] text-white lg:text-[5.25rem]"
              style={{ animationDelay: "200ms" }}
            >
              Decisions
              <br />
              Worth
              <br />
              Living With.
            </h1>

            {/* 56px gap */}
            <div className="h-14" />

            {/* Body copy */}
            <div
              className="animate-fade-up flex flex-col gap-4 text-[17px] leading-[1.7] text-white/55"
              style={{ animationDelay: "350ms" }}
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

            {/* 48px gap */}
            <div className="h-12" />

            {/* CTAs */}
            <div
              className="animate-fade-up flex items-center gap-8"
              style={{ animationDelay: "500ms" }}
            >
              <a
                href="#"
                className="bg-[#1e4d3a] px-8 py-4 text-[13px] font-medium tracking-[0.2em] text-white transition-colors duration-300 hover:bg-[#256b4e]"
              >
                START MY SEARCH
              </a>
              <a
                href="#"
                className="group flex items-center gap-2 text-[13px] tracking-[0.12em] text-white/35 transition-colors duration-300 hover:text-white/60"
              >
                <span>See How We Think</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </a>
            </div>

            {/* 40px gap */}
            <div className="h-10" />

            {/* Brand philosophy */}
            <p
              className="animate-fade-up font-serif text-[15px] italic leading-[1.7] text-white/30"
              style={{ animationDelay: "650ms" }}
            >
              Prepared as if it were
              <br />
              our own family&apos;s decision.
            </p>
          </div>

          {/* Spacer to push content toward vertical center */}
          <div className="h-10" />
        </div>

        {/* Right panel — image bleeds to edge */}
        <div className="relative w-[50%]">
          <img
            src={`${basePath}/images/hero-desktop.jpg`}
            alt="Property Decision Memo — DLF Arbour"
            className="h-full w-full object-cover object-center brightness-[0.85]"
          />
          {/* Subtle left-to-right gradient over image */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(8,12,10,0.92) 0%, rgba(8,12,10,0.72) 30%, rgba(8,12,10,0) 70%)",
            }}
          />
        </div>
      </div>

      {/* ─── MOBILE ─── */}
      <div className="flex min-h-svh flex-col md:hidden">
        {/* Nav */}
        <nav className="animate-fade-up flex items-center justify-between px-6 py-6">
          <Logo className="h-9 w-auto" />
          <button className="flex flex-col gap-1.5" aria-label="Open menu">
            <span className="block h-px w-5 bg-white/50" />
            <span className="block h-px w-5 bg-white/50" />
            <span className="block h-px w-3.5 bg-white/50" />
          </button>
        </nav>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-center px-7 py-8">
          {/* Eyebrow */}
          <div
            className="animate-fade-up"
            style={{ animationDelay: "100ms" }}
          >
            <span className="text-[10px] font-light tracking-[0.4em] text-white/40">
              INDEPENDENT INTELLIGENCE
            </span>
            <div className="mt-2.5 h-px w-7 bg-[#c9a96e]/60" />
          </div>

          <div className="h-8" />

          {/* Headline */}
          <h1
            className="animate-fade-up font-serif text-[2.5rem] font-bold leading-[1.12] text-white"
            style={{ animationDelay: "200ms" }}
          >
            Decisions
            <br />
            Worth
            <br />
            Living With.
          </h1>

          <div className="h-10" />

          {/* Body copy */}
          <div
            className="animate-fade-up flex flex-col gap-3.5 text-[15px] leading-[1.7] text-white/55"
            style={{ animationDelay: "350ms" }}
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

          {/* CTAs */}
          <div
            className="animate-fade-up flex flex-col gap-5"
            style={{ animationDelay: "500ms" }}
          >
            <a
              href="#"
              className="w-full bg-[#1e4d3a] px-8 py-4 text-center text-[13px] font-medium tracking-[0.2em] text-white transition-colors duration-300 hover:bg-[#256b4e]"
            >
              START MY SEARCH
            </a>
            <a
              href="#"
              className="flex items-center justify-center gap-2 text-[13px] tracking-[0.12em] text-white/35"
            >
              <span>See How We Think</span>
              <span>&rarr;</span>
            </a>
          </div>

          <div className="h-8" />

          {/* Brand philosophy */}
          <p
            className="animate-fade-up font-serif text-[14px] italic leading-[1.7] text-white/25"
            style={{ animationDelay: "650ms" }}
          >
            Prepared as if it were
            <br />
            our own family&apos;s decision.
          </p>
        </div>

        {/* Hero image — separate, below content, not overlaid */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: "750ms" }}
        >
          <img
            src={`${basePath}/images/hero-mobile.jpg`}
            alt="Property Decision Memo — DLF Arbour"
            className="h-[45vh] w-full object-cover object-top brightness-[0.85]"
          />
        </div>
      </div>
    </section>
  );
}
