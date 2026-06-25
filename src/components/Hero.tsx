"use client";

import Image from "next/image";
import Logo from "./Logo";

export default function Hero() {
  return (
    <section className="relative h-svh w-full overflow-hidden bg-[#122620]">
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

      {/* Left-side gradient: dark green fading to transparent on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#122620] via-[#122620]/95 via-40% to-transparent" />
      {/* Mobile: stronger overlay for readability */}
      <div className="absolute inset-0 bg-[#122620]/60 md:hidden" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between px-6 py-6 sm:px-10 md:px-16 lg:px-24">
        {/* Logo */}
        <nav className="flex items-center justify-between">
          <Logo className="h-10 w-auto sm:h-12 md:h-14" />

          <div className="hidden items-center gap-8 text-xs tracking-[0.2em] text-white/60 lg:flex">
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
              className="border border-white/20 px-5 py-2.5 text-white transition-all hover:border-[#c9a96e] hover:text-[#c9a96e]"
            >
              CONTACT
            </a>
          </div>

          {/* Mobile menu */}
          <button
            className="flex flex-col gap-1.5 lg:hidden"
            aria-label="Open menu"
          >
            <span className="block h-px w-6 bg-white" />
            <span className="block h-px w-6 bg-white" />
            <span className="block h-px w-4 bg-white" />
          </button>
        </nav>

        {/* Main hero content — left aligned */}
        <div className="flex max-w-xl flex-col gap-6 md:gap-8">
          {/* Label */}
          <div>
            <span className="text-[10px] tracking-[0.35em] text-white/50 sm:text-xs">
              INDEPENDENT INTELLIGENCE
            </span>
            <div className="mt-2 h-px w-10 bg-[#c9a96e]" />
          </div>

          {/* Headline */}
          <h1 className="font-serif text-[2.75rem] font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Decisions
            <br />
            Worth
            <br />
            Living With.
          </h1>

          {/* Body copy */}
          <div className="flex max-w-sm flex-col gap-4 text-base leading-relaxed text-white/70 sm:text-lg md:max-w-md">
            <p>Buying luxury real estate from overseas?</p>
            <p>
              You don&apos;t need
              <br />
              another broker.
            </p>
            <p>
              You need
              <br />
              <span className="font-serif italic text-[#c9a96e]">
                better judgment.
              </span>
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#"
              className="inline-flex items-center justify-center bg-[#1e4d3a] px-8 py-4 text-sm font-semibold tracking-[0.2em] text-white transition-all hover:bg-[#256b4e] sm:justify-start"
            >
              START MY SEARCH
            </a>

            <a
              href="#"
              className="group inline-flex items-center gap-2 px-1 text-sm tracking-[0.15em] text-white/50 transition-colors hover:text-white sm:px-4"
            >
              <span className="underline underline-offset-4">
                SEE HOW WE THINK
              </span>
              <svg
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
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
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="flex items-center gap-3">
          {/* Family icon */}
          <svg
            className="h-6 w-6 text-[#c9a96e] sm:h-7 sm:w-7"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="4" r="2" />
            <circle cx="6" cy="6" r="1.5" />
            <circle cx="18" cy="6" r="1.5" />
            <path d="M12 8c-1.5 0-2.5 1-2.5 2.5V14h5v-3.5C14.5 9 13.5 8 12 8z" />
            <path d="M6 9c-1 0-2 .8-2 2v3h3v-3.5c0-.6.1-1.1.3-1.5H6z" />
            <path d="M18 9h-.3c.2.4.3.9.3 1.5V14h3v-3c0-1.2-1-2-2-2z" />
            <rect x="5" y="15" width="14" height="1" rx="0.5" />
          </svg>
          <p className="font-serif text-xs italic text-white/50 sm:text-sm">
            Prepared as if it were
            <br className="sm:hidden" />
            {" "}our own family&apos;s decision.
          </p>
        </div>
      </div>
    </section>
  );
}
