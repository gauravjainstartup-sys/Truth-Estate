"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function setupDesktop(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);

  const editorial = root.querySelector<HTMLElement>("[data-editorial]");
  if (!editorial) return;

  const bg = editorial.querySelector<HTMLElement>("[data-bg]");
  const headline = editorial.querySelector<HTMLElement>('[data-el="headline"]');
  const told = editorial.querySelector<HTMLElement>('[data-el="told"]');
  const dataLine = editorial.querySelector<HTMLElement>('[data-el="data"]');
  const brochure = editorial.querySelector<HTMLElement>('[data-el="brochure"]');
  const cheque = editorial.querySelector<HTMLElement>('[data-el="cheque"]');
  const textLayer = editorial.querySelector<HTMLElement>("[data-text-layer]");
  const verdictLayer = editorial.querySelector<HTMLElement>(
    "[data-verdict-layer]"
  );

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: editorial,
      start: "top top",
      end: "+=250%",
      pin: true,
      scrub: 0.6,
    },
  });

  // Hold initial state
  tl.to({}, { duration: 0.06 });

  // Emphasis shift — "told" dims, "data" brightens
  tl.to(told!, { opacity: 0.25, duration: 0.14 });
  tl.to(dataLine!, { opacity: 0.9, duration: 0.14 }, "<");

  // Hold shifted state
  tl.to({}, { duration: 0.04 });

  // "No brochure" emerges
  tl.to(brochure!, {
    opacity: 0.9,
    y: 0,
    filter: "blur(0px)",
    duration: 0.1,
  });
  tl.to({}, { duration: 0.05 });

  // "Would we sign the cheque?" — the final question
  tl.to(cheque!, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.1 });

  // Hold on the question
  tl.to({}, { duration: 0.11 });

  // Background darkens — the paper becomes transparent
  tl.to(bg!, {
    backgroundColor: "#0a0a0a",
    duration: 0.16,
    ease: "power1.inOut",
  });
  tl.to(
    [headline!, told!, dataLine!, brochure!],
    { opacity: 0.06, duration: 0.16 },
    "<"
  );
  tl.to(cheque!, { opacity: 0.1, duration: 0.16 }, "<");

  // Text layer dissolves
  tl.to(textLayer!, { opacity: 0, duration: 0.06 });

  // Verdict emerges from darkness
  tl.to(verdictLayer!, {
    opacity: 1,
    filter: "brightness(1) blur(0px)",
    duration: 0.16,
    ease: "none",
  });

  // Hold on verdict
  tl.to({}, { duration: 0.06 });
}

function setupMobile(root: HTMLElement) {
  const observers: IntersectionObserver[] = [];

  root.querySelectorAll<HTMLElement>("[data-el]").forEach((el) => {
    el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
  });

  const textObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.4 }
  );
  root.querySelectorAll("[data-el]").forEach((el) => textObs.observe(el));
  observers.push(textObs);

  root.querySelectorAll<HTMLElement>("[data-mob-content]").forEach((el) => {
    el.style.transition = "opacity 1.2s ease, transform 1s ease";
  });

  const verdictObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const c = entry.target as HTMLElement;
          c.style.opacity = "1";
          c.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.15 }
  );
  const v = root.querySelector("[data-mob-content]");
  if (v) verdictObs.observe(v);
  observers.push(verdictObs);

  return () => observers.forEach((o) => o.disconnect());
}

const verdictCard = (
  <div className="flex w-full max-w-sm flex-col items-center py-16 md:max-w-md">
    <p className="text-[10px] font-light tracking-[0.4em] text-white/25">
      PROPERTY VERDICT
    </p>

    <div className="mt-10 h-px w-16 bg-[#c9a96e]/40" />

    <p className="mt-12 font-serif text-[3rem] font-medium leading-none text-[#c9a96e] md:text-[4rem]">
      Proceed
    </p>

    <p className="mt-4 font-serif text-[1.3rem] font-light text-white/60 md:text-[1.6rem]">
      DLF Arbour
    </p>

    <div className="mt-14 flex flex-col items-center">
      <p className="text-[9px] font-light tracking-[0.35em] text-white/20">
        CONFIDENCE
      </p>
      <p className="mt-3 font-serif text-[3.5rem] font-extralight leading-none text-white/90 md:text-[4.5rem]">
        97%
      </p>
    </div>

    <div className="mt-14 h-px w-16 bg-[#c9a96e]/40" />

    <div className="mt-8 flex flex-col items-center">
      <p className="text-[8px] font-light tracking-[0.35em] text-white/15">
        PREPARED BY
      </p>
      <p className="mt-2 font-serif text-[13px] tracking-[0.2em] text-white/35">
        Truth Estate
      </p>
    </div>
  </div>
);

export default function StorySection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    if (isDesktop) {
      setupDesktop(root);
      return () => ScrollTrigger.getAll().forEach((st) => st.kill(true));
    } else {
      return setupMobile(root);
    }
  }, []);

  return (
    <section ref={ref}>
      {/* ─── ONE EDITORIAL CANVAS ─── */}
      <div data-editorial className="relative min-h-svh">
        {/* Background layer */}
        <div data-bg className="absolute inset-0 bg-[#F7F5F2]" />

        {/* Text layer */}
        <div
          data-text-layer
          className="relative z-10 flex min-h-svh flex-col items-center px-8 py-[18vh] text-center md:justify-center md:py-[12vh]"
        >
          <h2
            data-el="headline"
            className="font-serif text-[2.6rem] font-medium leading-[1.15] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]"
            style={{ opacity: 0.9 }}
          >
            Every property
            <br />
            has two stories.
          </h2>

          <div className="h-12 md:h-14" />

          <p
            data-el="told"
            className="font-serif text-[1.6rem] leading-[1.4] text-[#1a1a1a] md:text-[2.8rem] lg:text-[3.2rem]"
            style={{ opacity: 0.7 }}
          >
            The one you&apos;re told.
          </p>

          <div className="h-3 md:h-4" />

          <p
            data-el="data"
            className="font-serif text-[1.6rem] leading-[1.4] text-[#1a1a1a] md:text-[2.8rem] lg:text-[3.2rem]"
            style={{ opacity: 0.3 }}
          >
            The one the data tells.
          </p>

          <div className="h-14 md:h-16" />

          <p
            data-el="brochure"
            className="font-serif text-[2.2rem] font-semibold leading-[1.15] text-[#1a1a1a] md:text-[3.8rem] lg:text-[4.5rem]"
            style={{ opacity: 0, transform: "translateY(6px)", filter: "blur(2px)" }}
          >
            No brochure
            <br />
            mentions this.
          </p>

          <div className="h-16 md:h-20" />

          <p
            data-el="cheque"
            className="font-serif text-[2.4rem] font-light leading-[1.12] text-[#1a1a1a] md:text-[4rem] lg:text-[5rem]"
            style={{ opacity: 0, transform: "translateY(6px)", filter: "blur(2px)" }}
          >
            Would we sign
            <br />
            the cheque?
          </p>
        </div>

        {/* Verdict overlay — desktop only */}
        <div
          data-verdict-layer
          className="absolute inset-0 z-20 hidden items-center justify-center px-6 md:flex"
          style={{
            opacity: 0,
            filter: "brightness(0.15) blur(3px)",
            pointerEvents: "none",
          }}
        >
          {verdictCard}
        </div>
      </div>

      {/* ─── MOBILE: transition + verdict ─── */}
      <div className="md:hidden">
        <div className="h-[40vh] bg-gradient-to-b from-[#F7F5F2] to-[#0a0a0a]" />
        <div className="min-h-[80vh] bg-[#0a0a0a]">
          <div
            data-mob-content
            className="flex min-h-[80vh] items-center justify-center px-6"
            style={{ opacity: 0, transform: "translateY(12px)" }}
          >
            {verdictCard}
          </div>
        </div>
      </div>
    </section>
  );
}
