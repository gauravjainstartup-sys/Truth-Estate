"use client";

import { useState, useEffect, useCallback } from "react";
import Logo from "./Logo";
import { useJourney } from "./journey/JourneyProvider";
import { PRIMARY_CTA } from "@/lib/journey";

const basePath = "/Truth-Estate";

const NAV_PILLARS = [
  { label: "Truth Intelligence", target: "#truth-intelligence" },
  { label: "Private Office", target: "#private-office" },
  { label: "Ownership Intelligence", target: "#ownership-intelligence" },
  { label: "Methodology", target: `${basePath}/methodology` },
] as const;

export default function Hero() {
  const { open } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = useCallback((target: string) => {
    if (target.startsWith("#")) {
      const el = document.getElementById(target.slice(1));
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = target;
    }
  }, []);

  return (
    <section className="relative min-h-svh w-full overflow-hidden">
      {/* ─── STICKY HEADER ─── */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-700 ${
          scrolled
            ? "border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-7 py-5 md:px-12 lg:px-20">
          <a href={basePath} className="shrink-0">
            <Logo
              className={`h-9 w-auto transition-opacity duration-500 lg:h-10 ${scrolled ? "opacity-85" : "opacity-75"}`}
              color={scrolled ? "#1a1a1a" : "white"}
            />
          </a>

          {/* Desktop nav — centered pillars */}
          <nav className="hidden items-center gap-10 lg:flex xl:gap-12">
            {NAV_PILLARS.map(({ label, target }) => (
              <button
                key={label}
                onClick={() => handleNav(target)}
                className={`group relative text-[14px] font-medium tracking-[0.14em] transition-colors duration-500 ${
                  scrolled
                    ? "text-[#1a1a1a]/40 hover:text-[#1a1a1a]/80"
                    : "text-white/40 hover:text-[#F5F0E8]"
                }`}
              >
                {label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-[#c9a96e] transition-all duration-500 group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <button
            onClick={() => open()}
            className={`hidden rounded-sm px-7 py-3 text-[12px] font-medium tracking-[0.08em] transition-all duration-500 lg:block ${
              scrolled
                ? "bg-[#1e6b45] text-white shadow-sm hover:bg-[#238c55]"
                : "bg-white/10 text-white/70 backdrop-blur-sm hover:bg-white/15 hover:text-white"
            }`}
          >
            {PRIMARY_CTA}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col gap-[6px] p-1 lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span className={`block h-[1.5px] w-6 transition-colors duration-500 ${scrolled ? "bg-[#1a1a1a]/40" : "bg-white/40"}`} />
            <span className={`block h-[1.5px] w-6 transition-colors duration-500 ${scrolled ? "bg-[#1a1a1a]/40" : "bg-white/40"}`} />
          </button>
        </div>
      </header>

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
        <div className="relative z-10 flex h-full flex-col justify-between px-20 py-14 pt-32 lg:px-28 lg:py-20 lg:pt-36">
          <div className="flex max-w-xl flex-col">
            <h1
              className="animate-fade-up font-serif text-[3.2rem] font-bold leading-[1.1] text-white lg:text-[3.9rem]"
              style={{ animationDelay: "100ms" }}
            >
              Decisions
              <br />
              Worth Living With.
            </h1>

            <div style={{ height: "40px" }} />

            <p
              className="animate-fade-up text-[16px] leading-[1.8] text-white/45"
              style={{ animationDelay: "300ms" }}
            >
              The Independent Buyer&apos;s Office
              <br />
              for High-Value Real Estate Decisions.
            </p>

            <div style={{ height: "44px" }} />

            <div
              className="animate-fade-up flex items-center gap-8"
              style={{ animationDelay: "400ms" }}
            >
              <button
                onClick={() => open()}
                className="rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/30 transition-all duration-500 hover:bg-[#238c55]"
              >
                {PRIMARY_CTA}
              </button>
              <button
                onClick={() => open("research")}
                className="text-[13px] tracking-[0.04em] text-white/55 transition-colors duration-500 hover:text-white/80"
              >
                Challenge TruthGuide &rarr;
              </button>
            </div>
          </div>

          {/* Operating philosophy — quietly revealed at the foot of the hero */}
          <div className="max-w-md">
            <div className="h-px w-full bg-white/15" />
            <p className="mt-7 font-serif text-[22px] italic leading-[1.7] text-[#A7A29B]">
              Less promises. More proof.
            </p>
          </div>
        </div>
      </div>

      {/* ─── MOBILE ─── */}
      <div className="relative h-svh md:hidden overflow-hidden">
        <img
          src={`${basePath}/images/hero-mobile.jpg`}
          alt=""
          className="absolute left-0 top-0 w-full object-cover"
          style={{
            /* Scale tuned so the verdict page lands in the gap between the
               secondary CTA and the foot quote */
            height: "122%",
            objectPosition: "center center",
            filter: "brightness(0.58) contrast(1.05) saturate(1.0) blur(0.6px)",
          }}
        />

        {/* Scrim — dark over the headline/CTAs up top, lifts through the
            middle so the verdict page reads clearly in the gap, then settles
            again behind the foot quote */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,6,5,0.95) 0%, rgba(4,6,5,0.93) 46%, rgba(4,6,5,0.82) 54%, rgba(4,6,5,0.44) 64%, rgba(4,6,5,0.28) 74%, rgba(4,6,5,0.34) 84%, rgba(4,6,5,0.58) 94%, rgba(4,6,5,0.74) 100%)",
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
        <div className="relative z-10 flex h-full flex-col px-7 pt-24 pb-8">
          <div className="mt-[5vh] flex flex-col">
            <h1
              className="animate-fade-up font-serif text-[2.3rem] font-bold leading-[1.16] text-white"
              style={{ animationDelay: "100ms" }}
            >
              Decisions
              <br />
              Worth Living With.
            </h1>

            <div style={{ height: "26px" }} />

            <p
              className="animate-fade-up text-[15px] leading-[1.85] text-white/60"
              style={{ animationDelay: "250ms", textShadow: "0 1px 14px rgba(4,6,5,0.6)" }}
            >
              The Independent Buyer&apos;s Office
              <br />
              for High-Value Real Estate Decisions.
            </p>

            <div style={{ height: "34px" }} />

            {/* CTAs */}
            <div className="flex flex-col gap-4">
              <button
                onClick={() => open()}
                className="animate-fade-up inline-block self-start rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/30 transition-all duration-500 hover:bg-[#238c55]"
                style={{ animationDelay: "350ms" }}
              >
                {PRIMARY_CTA}
              </button>

              <button
                onClick={() => open("research")}
                className="animate-fade-up self-start text-[13px] tracking-[0.04em] text-white/45 transition-colors duration-500 hover:text-white/70"
                style={{ animationDelay: "400ms" }}
              >
                Challenge TruthGuide &rarr;
              </button>
            </div>
          </div>

          {/* Operating philosophy — quietly revealed at the foot of the hero */}
          <div className="mt-auto">
            <div className="h-px w-full bg-white/15" />
            <p className="mt-6 font-serif text-[18px] italic leading-[1.7] text-[#A7A29B]">
              Less promises. More proof.
            </p>
          </div>
        </div>
      </div>

      {/* ─── MOBILE MENU OVERLAY ─── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-[#0a0a0a]"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between px-7 pt-10">
            <Logo className="h-9 w-auto opacity-85" />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="text-[11px] font-light tracking-[0.18em] text-white/50 transition-colors hover:text-white/80"
            >
              CLOSE
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-8 px-7">
            {NAV_PILLARS.map(({ label, target }) => (
              <button
                key={label}
                onClick={() => {
                  setMenuOpen(false);
                  handleNav(target);
                }}
                className="group text-left font-serif text-[2rem] font-light text-white/60 transition-colors hover:text-[#F5F0E8]"
              >
                <span className="relative">
                  {label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#c9a96e]/50 transition-all duration-500 group-hover:w-full" />
                </span>
              </button>
            ))}
          </nav>

          <div className="px-7 pb-12">
            <button
              onClick={() => {
                setMenuOpen(false);
                open();
              }}
              className="w-full rounded-sm bg-[#1e6b45] px-9 py-4 text-[13px] font-medium tracking-[0.08em] text-white transition-colors hover:bg-[#238c55]"
            >
              {PRIMARY_CTA}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
