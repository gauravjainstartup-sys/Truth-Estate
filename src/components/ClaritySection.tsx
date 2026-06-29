"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ════════════════════════════════════════════════════════════════
   SECTION 4 — THE CLARITY
   Only now does Truth Estate appear — as clarity, not software. An
   institutional buyer-intelligence memo: a verdict, a confidence, the
   intelligence behind it. Calm, confident, editorial. Then it recedes
   into "Every property has two stories." and darkens to hand off.
   ════════════════════════════════════════════════════════════════ */

const INTELLIGENCE = [
  "Legal Intelligence",
  "Developer Intelligence",
  "Construction Intelligence",
  "Location Intelligence",
  "Financial Intelligence",
  "Unit Intelligence",
];

const IVORY = "#F8F5EF"; // continues the clean relief from the Noise
const DARK = "#0a0a0a";  // hands off to ExperienceSection

export default function ClaritySection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pin = ref.current;
    if (!pin) return;

    gsap.registerPlugin(ScrollTrigger);

    const bg       = pin.querySelector<HTMLElement>("[data-bg]");
    const heading  = pin.querySelector<HTMLElement>("[data-heading]");
    const report   = pin.querySelector<HTMLElement>("[data-report]");
    const reportEls = pin.querySelectorAll<HTMLElement>("[data-rv]");
    const twoStories = pin.querySelector<HTMLElement>("[data-twostories]");

    if (!bg || !heading || !report || !twoStories) return;

    gsap.set(bg, { backgroundColor: IVORY });
    gsap.set(heading, { opacity: 0, y: 16 });
    gsap.set(report, { opacity: 1, y: 0 });
    reportEls.forEach((el) => gsap.set(el, { opacity: 0, y: 12 }));
    gsap.set(twoStories, { opacity: 0, y: 16 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=470%",
        pin: true,
        scrub: 0.45,
        anticipatePin: 1,
      },
    });

    /* ── The heading — calm, on clean white ── */
    tl.to({}, { duration: 0.05 });
    tl.to(heading, { opacity: 1, y: 0, duration: 0.09, ease: "power2.out" });
    tl.to({}, { duration: 0.11 });
    tl.to(heading, { opacity: 0, y: -12, duration: 0.06, ease: "power2.in" });

    /* ── The report assembles, line by line. Confident, never hurried. ── */
    tl.to(reportEls, {
      opacity: 1,
      y: 0,
      duration: 0.05,
      stagger: 0.032,
      ease: "power2.out",
    });
    tl.to({}, { duration: 0.16 }); // hold on the full memo

    /* ── The report recedes ── */
    tl.to(report, { opacity: 0, y: -22, duration: 0.08, ease: "power2.in" });

    /* ── The bridge — seeds the anaphora ExperienceSection continues ── */
    tl.to(twoStories, { opacity: 1, y: 0, duration: 0.09, ease: "power2.out" });
    tl.to({}, { duration: 0.16 }); // long hold

    /* ── Darken into the next chapter (ExperienceSection is #0a0a0a) ── */
    tl.to(twoStories, { opacity: 0, y: -10, duration: 0.06, ease: "power2.in" });
    tl.to(bg, { backgroundColor: DARK, duration: 0.08, ease: "power1.inOut" });

    const st = tl.scrollTrigger;
    ScrollTrigger.refresh();
    return () => {
      st?.kill(true);
      tl.kill();
    };
  }, []);

  return (
    <div ref={ref} className="relative h-svh w-full overflow-hidden">
      <div data-bg className="absolute inset-0" style={{ backgroundColor: IVORY }} />

      {/* ── Heading ── */}
      <div
        data-heading
        className="absolute inset-0 flex items-center justify-center px-6 text-center"
      >
        <h2 className="font-serif text-[2.4rem] font-medium leading-[1.14] tracking-[-0.015em] text-[#1a1a1a] md:text-[3.4rem] lg:text-[4.2rem]">
          When the noise stops,
          <br />
          <span className="text-[#1a1a1a]/55">better decisions begin.</span>
        </h2>
      </div>

      {/* ── The Intelligence Report (the hero) ── */}
      <div
        data-report
        className="absolute inset-0 flex items-center justify-center px-6"
      >
        <div className="w-full max-w-md">
          {/* Letterhead */}
          <p
            data-rv
            className="text-center text-[12px] font-medium tracking-[0.5em] text-[#1a1a1a]/75"
          >
            TRUTH ESTATE
          </p>
          <p
            data-rv
            className="mt-3 text-center text-[9px] font-light uppercase tracking-[0.34em] text-[#c9a96e]"
          >
            Independent Buyer Intelligence
          </p>

          <div
            data-rv
            className="mx-auto mt-8 h-px w-14 bg-[#c9a96e]/40"
          />

          {/* Project */}
          <div data-rv className="mt-8 text-center">
            <p className="text-[9px] font-light uppercase tracking-[0.4em] text-[#1a1a1a]/35">
              Project
            </p>
            <p className="mt-2.5 font-serif text-[1.5rem] font-normal tracking-[0.01em] text-[#1a1a1a] md:text-[1.7rem]">
              DLF Arbour
            </p>
          </div>

          {/* Verdict · Confidence */}
          <div className="mt-9 grid grid-cols-2">
            <div data-rv className="border-r border-[#1a1a1a]/10 text-center">
              <p className="text-[9px] font-light uppercase tracking-[0.4em] text-[#1a1a1a]/35">
                Verdict
              </p>
              <p className="mt-3 font-serif text-[2.4rem] font-medium leading-none tracking-[0.01em] text-[#c9a96e] md:text-[3rem]">
                Proceed
              </p>
            </div>
            <div data-rv className="text-center">
              <p className="text-[9px] font-light uppercase tracking-[0.4em] text-[#1a1a1a]/35">
                Confidence
              </p>
              <p className="mt-3 font-serif text-[2.4rem] font-extralight leading-none text-[#1a1a1a]/85 md:text-[3rem]">
                97%
              </p>
            </div>
          </div>

          <div
            data-rv
            className="mx-auto mt-10 h-px w-14 bg-[#c9a96e]/40"
          />

          {/* Supported by */}
          <p
            data-rv
            className="mt-8 text-center text-[9px] font-light uppercase tracking-[0.4em] text-[#1a1a1a]/35"
          >
            Supported by
          </p>
          <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-x-8 gap-y-3.5">
            {INTELLIGENCE.map((item) => (
              <div data-rv key={item} className="flex items-center gap-2.5">
                <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-[#c9a96e]" />
                <span className="font-serif text-[0.92rem] font-light tracking-[0.01em] text-[#1a1a1a]/65">
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Closing line */}
          <p
            data-rv
            className="mt-12 text-center font-serif text-[1.05rem] font-light italic leading-[1.6] text-[#1a1a1a]/45"
          >
            Everything you need.
            <br />
            Before you decide.
          </p>
        </div>
      </div>

      {/* ── The bridge ── */}
      <div
        data-twostories
        className="absolute inset-0 flex items-center justify-center px-6 text-center"
      >
        <h2 className="font-serif text-[2.6rem] font-medium leading-[1.1] tracking-[-0.015em] text-[#1a1a1a] md:text-[3.6rem] lg:text-[4.4rem]">
          Every property
          <br />
          has two stories.
        </h2>
      </div>
    </div>
  );
}
