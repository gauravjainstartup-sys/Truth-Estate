"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative h-svh w-full overflow-hidden">
      {/* Desktop background */}
      <Image
        src="/images/hero-desktop.jpg"
        alt=""
        fill
        priority
        className="hidden md:block object-cover object-center"
        sizes="100vw"
        quality={90}
      />

      {/* Mobile background */}
      <Image
        src="/images/hero-mobile.jpg"
        alt=""
        fill
        priority
        className="block md:hidden object-cover object-center"
        sizes="100vw"
        quality={90}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between px-6 py-8 sm:px-12 md:px-20 lg:px-28">
        {/* Top nav bar */}
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl tracking-[0.2em] text-white sm:text-2xl">
              TRUTH ESTATE
            </span>
          </div>

          <div className="hidden items-center gap-8 text-sm tracking-widest text-white/70 md:flex">
            <a href="#" className="transition-colors hover:text-white">
              ADVISORY
            </a>
            <a href="#" className="transition-colors hover:text-white">
              RESEARCH
            </a>
            <a href="#" className="transition-colors hover:text-white">
              ABOUT
            </a>
            <a
              href="#"
              className="border border-white/30 px-5 py-2 text-white transition-all hover:border-[#c9a96e] hover:text-[#c9a96e]"
            >
              CONTACT
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="flex flex-col gap-1.5 md:hidden"
            aria-label="Open menu"
          >
            <span className="block h-px w-6 bg-white" />
            <span className="block h-px w-6 bg-white" />
            <span className="block h-px w-4 bg-white" />
          </button>
        </nav>

        {/* Hero content */}
        <div className="flex max-w-2xl flex-col gap-6 pb-16 sm:pb-24 md:pb-28 lg:pb-32">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#c9a96e]" />
            <span className="text-xs tracking-[0.3em] text-[#c9a96e] sm:text-sm">
              INDEPENDENT ADVISORY
            </span>
          </div>

          <h1 className="font-serif text-4xl font-medium leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            The truth behind
            <br />
            every property
            <br />
            <span className="italic text-[#c9a96e]">decision.</span>
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
            Research-driven real estate advisory for discerning NRI investors.
            We help you see what developers won&apos;t show you.
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#"
              className="group inline-flex items-center gap-3 bg-[#c9a96e] px-8 py-4 text-sm tracking-widest text-black transition-all hover:bg-[#d4b97a]"
            >
              REQUEST A DECISION MEMO
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>

            <a
              href="#"
              className="inline-flex items-center gap-2 px-2 py-4 text-sm tracking-widest text-white/50 transition-colors hover:text-white sm:px-4"
            >
              VIEW SAMPLE REPORT
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-end justify-between border-t border-white/10 pt-6">
          <div className="hidden text-xs tracking-widest text-white/30 sm:block">
            TRUSTED BY NRI FAMILIES ACROSS 12 COUNTRIES
          </div>
          <div className="flex items-center gap-2 text-xs tracking-widest text-white/30">
            <span className="inline-block h-2 w-2 rounded-full bg-[#c9a96e]" />
            SCROLL TO EXPLORE
          </div>
        </div>
      </div>
    </section>
  );
}
