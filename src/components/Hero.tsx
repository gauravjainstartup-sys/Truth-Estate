"use client";

import { useState } from "react";
import Logo from "./Logo";
import { useJourney } from "./journey/JourneyProvider";
import { PRIMARY_CTA } from "@/lib/journey";

const basePath = "/Truth-Estate";

export default function Hero() {
  const { open } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
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
            <div className="ml-auto hidden items-center gap-12 text-[11px] font-medium tracking-[0.14em] text-white/55 lg:flex xl:gap-14">
              <a href={`${basePath}/intelligence`} className="transition-colors duration-500 hover:text-white/90">
                Truth Intelligence
              </a>
              <a href={`${basePath}/pricing`} className="transition-colors duration-500 hover:text-white/90">
                Private Office
              </a>
              <a href={`${basePath}/intelligence`} className="transition-colors duration-500 hover:text-white/90">
                Ownership Intelligence
              </a>
              <a
                href={`${basePath}/nri`}
                className="rounded-full border border-[#c9a96e]/45 bg-[#c9a96e]/[0.12] px-4 py-1.5 text-[#ecdcb0] transition-all duration-300 hover:border-[#c9a96e]/85 hover:bg-[#c9a96e]/25 hover:text-[#f6ecd0]"
              >
                NRI Desk
              </a>
            </div>
          </nav>

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
            /* No full-image blur — keep the photograph crisp like desktop;
               readability is handled by the scrim, not by dimming the photo */
            filter: "brightness(0.66) contrast(1.12) saturate(1.05)",
          }}
        />

        {/* Scrim — dark over the headline/CTAs up top, lifts through the
            middle so the verdict page reads clearly in the gap, then settles
            again behind the foot quote */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,6,5,0.92) 0%, rgba(4,6,5,0.86) 32%, rgba(4,6,5,0.76) 46%, rgba(4,6,5,0.40) 57%, rgba(4,6,5,0.18) 67%, rgba(4,6,5,0.16) 78%, rgba(4,6,5,0.38) 90%, rgba(4,6,5,0.72) 100%)",
          }}
        />

        {/* Subtle edge vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 88% 82% at 50% 50%, transparent 52%, rgba(4,6,5,0.30) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col px-7 pt-10 pb-8">
          <nav className="animate-fade-up flex items-center justify-between">
            <Logo className="h-9 w-auto opacity-85" />
            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col gap-[6px] p-1"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span className="block h-[1.5px] w-6 bg-white/40" />
              <span className="block h-[1.5px] w-6 bg-white/40" />
            </button>
          </nav>

          <div className="mt-[9vh] flex flex-col">
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
          className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] md:hidden"
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
            <a
              href={`${basePath}/intelligence`}
              className="font-serif text-[2rem] font-light text-white/80 transition-colors hover:text-white"
            >
              Truth Intelligence
            </a>
            <a
              href={`${basePath}/pricing`}
              className="font-serif text-[2rem] font-light text-white/80 transition-colors hover:text-white"
            >
              Private Office
            </a>
            <a
              href={`${basePath}/intelligence`}
              className="font-serif text-[2rem] font-light text-white/80 transition-colors hover:text-white"
            >
              Ownership Intelligence
            </a>
            <a
              href={`${basePath}/nri`}
              className="flex items-center gap-3 font-serif text-[2rem] font-light text-[#e3c98f] transition-colors hover:text-[#f2e2b8]"
            >
              NRI Desk
              <span className="text-[1.2rem] text-[#c9a96e]">&rarr;</span>
            </a>
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
