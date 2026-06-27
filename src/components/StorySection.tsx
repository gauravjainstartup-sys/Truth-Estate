"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const investigations = [
  "Developer",
  "Construction",
  "Legal",
  "Pricing",
  "Location",
  "Exit Strategy",
];

function setupDesktop(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);

  const editorial = root.querySelector<HTMLElement>("[data-editorial]");
  if (!editorial) return;

  const q = <T extends HTMLElement>(s: string) =>
    editorial.querySelector<T>(s);

  const bg = q("[data-bg]")!;
  const glow = q("[data-glow]")!;
  const story = q("[data-story]")!;
  const told = q('[data-el="told"]')!;
  const dataLine = q('[data-el="data"]')!;
  const brochure = q('[data-el="brochure"]')!;
  const dot = q('[data-el="dot"]')!;
  const cheque = q('[data-el="cheque"]')!;
  const bridge = q('[data-el="bridge"]')!;
  const evidence = q("[data-evidence]")!;
  const checks = evidence.querySelectorAll<HTMLElement>("[data-check]");
  const verdict = q("[data-verdict]")!;
  const railFill = q("[data-rail-fill]");
  const scrollNudge = q('[data-el="scroll-nudge"]');

  const exitY = -Math.round(window.innerHeight * 0.42);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: editorial,
      start: "top top",
      end: "+=420%",
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      onUpdate: (self) => {
        if (railFill) gsap.set(railFill, { scaleY: self.progress });
        // Show the scroll nudge only while resting at the very start
        if (scrollNudge)
          scrollNudge.style.opacity = self.progress > 0.02 ? "0" : "1";
      },
    },
  });

  // ── Recognition: emphasis transfers from "told" to "data"
  tl.to({}, { duration: 0.05 });
  tl.to(told, { opacity: 0.22, duration: 0.13 });
  tl.to(dataLine, { opacity: 0.9, duration: 0.13 }, "<");
  tl.to({}, { duration: 0.04 });

  // ── Reflection: "No brochure mentions this." + gold anchor
  tl.to(dot, { opacity: 1, duration: 0.06 });
  tl.to(
    brochure,
    { opacity: 0.95, y: 0, filter: "blur(0px)", duration: 0.1 },
    "<0.02"
  );
  tl.to({}, { duration: 0.05 });

  // ── The committee question
  tl.to(cheque, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.1 });
  tl.to({}, { duration: 0.1 });

  // ── Bridge: "Every verdict begins with evidence." (story still present)
  tl.to(bridge, { opacity: 0.9, y: 0, filter: "blur(0px)", duration: 0.09 });
  tl.to({}, { duration: 0.06 });

  // ── The page continues downward; the story drifts up, evidence takes over
  tl.to(story, { y: exitY, opacity: 0, duration: 0.13, ease: "power1.in" });
  tl.to(evidence, { opacity: 1, duration: 0.11 }, "-=0.05");

  // ── Evidence confirmed, one by one
  checks.forEach((check, i) => {
    const last = i === checks.length - 1;
    tl.to(check, { opacity: 1, duration: 0.045 });
    tl.to({}, { duration: last ? 0.14 : 0.05 });
  });
  tl.to({}, { duration: 0.04 });

  // ── The paper darkens; the desk emerges
  tl.to(bg, { backgroundColor: "#0a0a0a", duration: 0.15, ease: "power1.inOut" });
  tl.to(glow, { opacity: 1, duration: 0.15 }, "<");
  tl.to(evidence, { opacity: 0.05, duration: 0.13 }, "<");

  // ── The verdict was always there
  tl.to(verdict, {
    opacity: 1,
    filter: "brightness(1) blur(0px)",
    duration: 0.16,
    ease: "none",
  });
  tl.to({}, { duration: 0.08 });

  ScrollTrigger.refresh();

  return () => {
    tl.scrollTrigger?.kill(true);
    tl.kill();
  };
}

/* Mobile — the SAME narrative, pinned & scrubbed as discrete cross-fading
   beats so the phone gets the desktop cinema inside one viewport. */
function setupMobilePinned(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const ed = root.querySelector<HTMLElement>("[data-m-editorial]");
  if (!ed) return;
  const q = <T extends HTMLElement>(s: string) => ed.querySelector<T>(s)!;

  const bg = q("[data-m-bg]");
  const glow = q("[data-m-glow]");
  const story = q('[data-m-beat="story"]');
  const told = q("[data-m-told]");
  const data = q("[data-m-data]");
  const nudge = q("[data-m-nudge]");
  const brochure = q('[data-m-beat="brochure"]');
  const cheque = q('[data-m-beat="cheque"]');
  const evidence = q('[data-m-beat="evidence"]');
  const checks = ed.querySelectorAll<HTMLElement>("[data-m-check]");
  const verdict = q("[data-m-verdict]");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ed,
      start: "top top",
      end: "+=400%",
      pin: true,
      scrub: 0.7,
      anticipatePin: 1,
      onUpdate: (self) => {
        if (nudge) nudge.style.opacity = self.progress > 0.02 ? "0" : "1";
      },
    },
  });

  // Two stories — emphasis transfers from what you're told to the data
  tl.to({}, { duration: 0.06 });
  tl.to(told, { opacity: 0.22, duration: 0.12 });
  tl.to(data, { opacity: 0.92, duration: 0.12 }, "<");
  tl.to({}, { duration: 0.14 });

  // Story drifts up and away; "No brochure mentions this." rises in
  tl.to(story, { opacity: 0, y: -48, duration: 0.1, ease: "power1.in" });
  tl.to(brochure, { opacity: 1, y: 0, duration: 0.11 }, ">-0.03");
  tl.to({}, { duration: 0.15 });

  // "Would we sign the cheque?"
  tl.to(brochure, { opacity: 0, y: -48, duration: 0.1, ease: "power1.in" });
  tl.to(cheque, { opacity: 1, y: 0, duration: 0.11 }, ">-0.03");
  tl.to({}, { duration: 0.15 });

  // Evidence, confirmed one by one
  tl.to(cheque, { opacity: 0, y: -48, duration: 0.1, ease: "power1.in" });
  tl.to(evidence, { opacity: 1, y: 0, duration: 0.11 }, ">-0.03");
  tl.to({}, { duration: 0.05 });
  checks.forEach((c, i) => {
    const last = i === checks.length - 1;
    tl.to(c, { opacity: 1, duration: 0.04 });
    tl.to({}, { duration: last ? 0.13 : 0.05 });
  });
  tl.to({}, { duration: 0.05 });

  // The desk darkens; the verdict was always there
  tl.to(evidence, { opacity: 0, duration: 0.1 });
  tl.to(bg, { backgroundColor: "#0a0a0a", duration: 0.13, ease: "power1.inOut" }, "<");
  tl.to(glow, { opacity: 1, duration: 0.13 }, "<");
  tl.to(verdict, { opacity: 1, filter: "brightness(1) blur(0px)", duration: 0.16, ease: "none" }, ">-0.04");
  tl.to({}, { duration: 0.1 });

  ScrollTrigger.refresh();

  return () => {
    tl.scrollTrigger?.kill(true);
    tl.kill();
  };
}

const verdictCard = (
  <div className="flex w-full max-w-sm flex-col items-center md:max-w-md">
    <p className="text-[10px] font-light tracking-[0.42em] text-white/30">
      PROPERTY VERDICT
    </p>

    <div className="mt-9 h-px w-20 bg-[#c9a96e]/40" />

    <p className="mt-12 text-[9px] font-light tracking-[0.4em] text-white/25">
      RECOMMENDATION
    </p>
    <p className="mt-4 font-serif text-[3.2rem] font-medium leading-none tracking-wide text-[#c9a96e] md:text-[4rem]">
      Proceed
    </p>

    <p className="mt-12 text-[9px] font-light tracking-[0.4em] text-white/25">
      CONFIDENCE
    </p>
    <p className="mt-4 font-serif text-[3.2rem] font-extralight leading-none text-white/90 md:text-[4rem]">
      97%
    </p>

    <div className="mt-12 h-px w-20 bg-[#c9a96e]/40" />

    <p className="mt-9 text-center font-serif text-[13px] font-light italic leading-relaxed text-white/35">
      Prepared after
      <br />
      independent due diligence.
    </p>

    <div className="mt-14 h-px w-10 bg-[#c9a96e]/20" />

    <button
      onClick={() => {
        document
          .getElementById("experience")
          ?.scrollIntoView({ behavior: "smooth" });
      }}
      className="mt-8 text-[11px] font-light tracking-[0.35em] text-white/30 transition-colors duration-300 hover:text-white/55"
    >
      Experience Independent Representation ↓
    </button>
  </div>
);

export default function StorySection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    return isDesktop ? setupDesktop(root) : setupMobilePinned(root);
  }, []);

  return (
    <section ref={ref} id="editorial">
      {/* ════════ DESKTOP — one continuous pinned narrative ════════ */}
      <div data-editorial className="relative hidden h-svh overflow-hidden md:block">
        {/* Background paper → desk */}
        <div data-bg className="absolute inset-0 bg-[#F5F0E8]" />
        {/* Pool of light that emerges with the desk */}
        <div
          data-glow
          className="absolute inset-0"
          style={{
            opacity: 0,
            background:
              "radial-gradient(ellipse 50% 55% at 50% 52%, rgba(201,169,110,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Progress rail — confirms your scrolling is advancing the narrative */}
        <div className="absolute right-8 top-1/2 z-30 hidden h-32 w-px -translate-y-1/2 bg-[#c9a96e]/12 lg:block">
          <div
            data-rail-fill
            className="absolute left-0 top-0 h-full w-px origin-top bg-[#c9a96e]/55"
            style={{ transform: "scaleY(0)" }}
          />
        </div>

        {/* STORY column (additive) */}
        <div
          data-story
          className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
        >
          <h2 className="font-serif text-[3.4rem] font-medium leading-[1.12] text-[#1a1a1a] lg:text-[4.4rem]">
            Every property
            <br />
            has two stories.
          </h2>

          <div className="h-9 lg:h-11" />

          <p
            data-el="told"
            className="font-serif text-[1.7rem] leading-[1.4] text-[#1a1a1a] lg:text-[2.1rem]"
            style={{ opacity: 0.7 }}
          >
            The one you&apos;re told.
          </p>

          <div className="h-2.5" />

          <p
            data-el="data"
            className="font-serif text-[1.7rem] leading-[1.4] text-[#1a1a1a] lg:text-[2.1rem]"
            style={{ opacity: 0.3 }}
          >
            The one the data tells.
          </p>

          {/* Scroll nudge — visible & animated when Section 2 is at rest;
              JS fades it out the moment the user scrolls (see onUpdate) */}
          <div
            data-el="scroll-nudge"
            className="mt-16 flex flex-col items-center"
            style={{ opacity: 1, transition: "opacity 0.55s ease" }}
          >
            <span className="mb-3 text-[10px] font-light uppercase tracking-[0.4em] text-[#1a1a1a]/45">
              Scroll
            </span>
            <svg
              width="26"
              height="22"
              viewBox="0 0 26 22"
              fill="none"
              style={{ animation: "nudge-down 1.7s ease-in-out infinite" }}
            >
              <path
                d="M2 2L13 11L24 2"
                stroke="#c9a96e"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 11L13 20L24 11"
                stroke="#c9a96e"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
              />
            </svg>
          </div>

          <div className="h-11 lg:h-14" />

          {/* gold anchor dot */}
          <span
            data-el="dot"
            className="mb-7 block h-[6px] w-[6px] rounded-full bg-[#c9a96e]"
            style={{ opacity: 0 }}
          />

          <p
            data-el="brochure"
            className="font-serif text-[2.6rem] font-semibold leading-[1.12] text-[#1a1a1a] lg:text-[3.4rem]"
            style={{ opacity: 0, transform: "translateY(8px)", filter: "blur(2px)" }}
          >
            No brochure
            <br />
            mentions this.
          </p>

          <div className="h-12 lg:h-16" />

          <p
            data-el="cheque"
            className="font-serif text-[2.4rem] font-light leading-[1.12] text-[#1a1a1a] lg:text-[3.2rem]"
            style={{ opacity: 0, transform: "translateY(8px)", filter: "blur(2px)" }}
          >
            Would we sign the cheque?
          </p>

          <div className="h-12 lg:h-16" />

          <p
            data-el="bridge"
            className="font-serif text-[1.05rem] font-light italic tracking-wide text-[#1a1a1a] lg:text-[1.25rem]"
            style={{ opacity: 0, transform: "translateY(8px)", filter: "blur(2px)" }}
          >
            Every verdict begins with evidence.
          </p>
        </div>

        {/* EVIDENCE — investigations confirmed one by one */}
        <div
          data-evidence
          className="absolute inset-0 flex flex-col items-center justify-center px-8"
          style={{ opacity: 0 }}
        >
          <p className="mb-12 font-serif text-[0.95rem] font-light italic tracking-wide text-[#1a1a1a]/35 lg:text-[1.1rem]">
            Every verdict begins with evidence.
          </p>
          <div className="flex flex-col items-center gap-7">
            {investigations.map((item, i) => {
              const last = i === investigations.length - 1;
              return (
                <div
                  key={item}
                  className="flex items-center justify-center gap-4"
                >
                  <span
                    className={`font-serif tracking-[0.1em] text-[#1a1a1a] ${
                      last
                        ? "text-[1.55rem] font-normal lg:text-[1.95rem]"
                        : "text-[1.45rem] font-light lg:text-[1.8rem]"
                    }`}
                  >
                    {item}
                  </span>
                  <span
                    data-check
                    className="text-[1.1rem] text-[#c9a96e]"
                    style={{ opacity: 0 }}
                  >
                    &#10003;
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* VERDICT — emerges from the darkening desk */}
        <div
          data-verdict
          className="absolute inset-0 z-20 flex items-center justify-center px-6"
          style={{
            opacity: 0,
            filter: "brightness(0.12) blur(3px)",
            pointerEvents: "none",
          }}
        >
          {verdictCard}
        </div>
      </div>

      {/* ════════ MOBILE — the same narrative, pinned & scrubbed ════════ */}
      <div
        data-m-editorial
        className="relative block h-svh overflow-hidden md:hidden"
      >
        <div data-m-bg className="absolute inset-0 bg-[#F5F0E8]" />
        <div
          data-m-glow
          className="absolute inset-0"
          style={{
            opacity: 0,
            background:
              "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(201,169,110,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Beat 1 — two stories */}
        <div
          data-m-beat="story"
          className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
        >
          <h2 className="font-serif text-[2.5rem] font-medium leading-[1.14] text-[#1a1a1a]">
            Every property
            <br />
            has two stories.
          </h2>
          <div className="h-8" />
          <p
            data-m-told
            className="font-serif text-[1.5rem] leading-[1.4] text-[#1a1a1a]"
            style={{ opacity: 0.7 }}
          >
            The one you&apos;re told.
          </p>
          <div className="h-2.5" />
          <p
            data-m-data
            className="font-serif text-[1.5rem] leading-[1.4] text-[#1a1a1a]"
            style={{ opacity: 0.3 }}
          >
            The one the data tells.
          </p>

          <div
            data-m-nudge
            className="mt-16 flex flex-col items-center"
            style={{ opacity: 1, transition: "opacity 0.5s ease" }}
          >
            <span className="mb-3 text-[10px] font-light uppercase tracking-[0.4em] text-[#1a1a1a]/45">
              Scroll
            </span>
            <svg
              width="24"
              height="20"
              viewBox="0 0 26 22"
              fill="none"
              style={{ animation: "nudge-down 1.7s ease-in-out infinite" }}
            >
              <path d="M2 2L13 11L24 2" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11L13 20L24 11" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Beat 2 — no brochure */}
        <div
          data-m-beat="brochure"
          className="absolute inset-0 flex items-center justify-center px-8 text-center"
          style={{ opacity: 0, transform: "translateY(20px)" }}
        >
          <p className="font-serif text-[2.7rem] font-semibold leading-[1.12] text-[#1a1a1a]">
            No brochure
            <br />
            mentions this.
          </p>
        </div>

        {/* Beat 3 — the cheque */}
        <div
          data-m-beat="cheque"
          className="absolute inset-0 flex items-center justify-center px-8 text-center"
          style={{ opacity: 0, transform: "translateY(20px)" }}
        >
          <p className="font-serif text-[2.4rem] font-light leading-[1.16] text-[#1a1a1a]">
            Would we sign
            <br />
            the cheque?
          </p>
        </div>

        {/* Beat 4 — evidence */}
        <div
          data-m-beat="evidence"
          className="absolute inset-0 flex flex-col items-center justify-center px-8"
          style={{ opacity: 0, transform: "translateY(20px)" }}
        >
          <p className="mb-10 font-serif text-[1rem] font-light italic tracking-wide text-[#1a1a1a]/40">
            Every verdict begins with evidence.
          </p>
          <div className="flex flex-col items-center gap-5">
            {investigations.map((item, i) => {
              const last = i === investigations.length - 1;
              return (
                <div key={item} className="flex items-center justify-center gap-3">
                  <span
                    className={`font-serif tracking-[0.1em] text-[#1a1a1a] ${
                      last ? "text-[1.5rem] font-normal" : "text-[1.4rem] font-light"
                    }`}
                  >
                    {item}
                  </span>
                  <span data-m-check className="text-[1.05rem] text-[#c9a96e]" style={{ opacity: 0 }}>
                    &#10003;
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verdict */}
        <div
          data-m-verdict
          className="absolute inset-0 z-20 flex items-center justify-center px-6"
          style={{ opacity: 0, filter: "brightness(0.12) blur(3px)", pointerEvents: "none" }}
        >
          {verdictCard}
        </div>
      </div>
    </section>
  );
}
