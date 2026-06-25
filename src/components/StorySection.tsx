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

  root.querySelectorAll<HTMLElement>("[data-scene]").forEach((scene) => {
    const content = scene.querySelector<HTMLElement>("[data-content]");
    if (!content) return;
    const pin = parseInt(scene.dataset.pin || "80", 10);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: "top top",
        end: `+=${pin}%`,
        pin: true,
        scrub: 0.6,
      },
    });

    tl.fromTo(
      content,
      { opacity: 0, y: 10, filter: "blur(1.5px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.25, ease: "none" }
    );
    tl.to({}, { duration: 0.55 });
    tl.to(content, {
      opacity: 0,
      y: -6,
      filter: "blur(1.5px)",
      duration: 0.2,
      ease: "none",
    });
  });

  const txEl = root.querySelector<HTMLElement>("[data-transition-bg]");
  if (txEl) {
    ScrollTrigger.create({
      trigger: txEl,
      start: "top top",
      end: "+=60%",
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        const r = Math.round(247 - p * 237);
        const g = Math.round(245 - p * 235);
        const b = Math.round(242 - p * 232);
        txEl.style.backgroundColor = `rgb(${r},${g},${b})`;
      },
    });
  }

  const invEl = root.querySelector<HTMLElement>("[data-investigations]");
  if (invEl) {
    const items = invEl.querySelectorAll<HTMLElement>("[data-inv-item]");
    const checks = invEl.querySelectorAll<HTMLElement>("[data-check]");
    const container = invEl.querySelector<HTMLElement>("[data-inv-container]");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: invEl,
        start: "top top",
        end: "+=350%",
        pin: true,
        scrub: 0.8,
      },
    });

    items.forEach((item, i) => {
      const isLast = i === items.length - 1;
      tl.fromTo(
        item,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.2 }
      );
      if (checks[i]) {
        tl.fromTo(
          checks[i],
          { opacity: 0 },
          { opacity: 1, duration: 0.12 },
          "-=0.05"
        );
      }
      tl.to({}, { duration: isLast ? 0.5 : 0.25 });
    });

    if (container) {
      tl.to(container, { opacity: 0, duration: 0.25 });
    }
  }

  const verdictEl = root.querySelector<HTMLElement>("[data-verdict]");
  const verdictContent = verdictEl?.querySelector<HTMLElement>(
    "[data-content]"
  );
  if (verdictEl && verdictContent) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: verdictEl,
        start: "top top",
        end: "+=120%",
        pin: true,
        scrub: 1.0,
      },
    });

    tl.fromTo(
      verdictContent,
      { opacity: 0, filter: "brightness(0.15) blur(3px)" },
      {
        opacity: 1,
        filter: "brightness(1) blur(0px)",
        duration: 1.5,
        ease: "none",
      }
    );
    tl.to({}, { duration: 0.5 });
  }
}

function setupMobile(root: HTMLElement) {
  const observers: IntersectionObserver[] = [];

  root.querySelectorAll<HTMLElement>("[data-content]").forEach((el) => {
    el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
  });

  const sceneObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const c = (entry.target as HTMLElement).querySelector<HTMLElement>(
          "[data-content]"
        );
        if (!c) return;
        c.style.opacity = entry.isIntersecting ? "1" : "0";
        c.style.transform = entry.isIntersecting
          ? "translateY(0)"
          : "translateY(16px)";
      });
    },
    { threshold: 0.25 }
  );
  root
    .querySelectorAll("[data-scene]")
    .forEach((el) => sceneObs.observe(el));
  observers.push(sceneObs);

  root.querySelectorAll<HTMLElement>("[data-inv-item]").forEach((el) => {
    el.style.transition = "opacity 0.7s ease, transform 0.7s ease";
  });
  root.querySelectorAll<HTMLElement>("[data-check]").forEach((el) => {
    el.style.transition = "opacity 0.5s ease";
  });

  const itemObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          const check = el.querySelector<HTMLElement>("[data-check]");
          if (check) setTimeout(() => (check.style.opacity = "1"), 400);
        }
      });
    },
    { threshold: 0.3 }
  );
  root
    .querySelectorAll("[data-inv-item]")
    .forEach((el) => itemObs.observe(el));
  observers.push(itemObs);

  const verdictObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const c = (entry.target as HTMLElement).querySelector<HTMLElement>(
            "[data-content]"
          );
          if (c) {
            c.style.opacity = "1";
            c.style.transform = "translateY(0)";
          }
        }
      });
    },
    { threshold: 0.15 }
  );
  const v = root.querySelector("[data-verdict]");
  if (v) verdictObs.observe(v);
  observers.push(verdictObs);

  return () => observers.forEach((o) => o.disconnect());
}

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
      {/* ─── SCENE 1 ─── */}
      <div
        data-scene
        data-pin="80"
        className="min-h-svh bg-[#F7F5F2]"
      >
        <div
          data-content
          className="flex min-h-svh items-center justify-center px-8"
          style={{ opacity: 0 }}
        >
          <h2 className="text-center font-serif text-[2.8rem] font-medium leading-[1.15] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]">
            Every property
            <br />
            has two stories.
          </h2>
        </div>
      </div>

      {/* ─── SCENE 2 ─── */}
      <div
        data-scene
        data-pin="60"
        className="min-h-svh bg-[#F7F5F2]"
      >
        <div
          data-content
          className="flex min-h-svh items-center justify-center px-8"
          style={{ opacity: 0 }}
        >
          <p className="text-center font-serif text-[2.8rem] leading-[1.15] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]">
            The one
            <br />
            you&apos;re told.
          </p>
        </div>
      </div>

      {/* ─── SCENE 3 ─── */}
      <div
        data-scene
        data-pin="60"
        className="min-h-svh bg-[#F7F5F2]"
      >
        <div
          data-content
          className="flex min-h-svh items-center justify-center px-8"
          style={{ opacity: 0 }}
        >
          <p className="text-center font-serif text-[2.8rem] leading-[1.15] text-[#1a1a1a] md:text-[4.5rem] lg:text-[5.5rem]">
            The one
            <br />
            the data tells.
          </p>
        </div>
      </div>

      {/* ─── SCENE 4 — poster punch ─── */}
      <div
        data-scene
        data-pin="80"
        className="min-h-svh bg-[#F7F5F2]"
      >
        <div
          data-content
          className="flex min-h-svh items-center justify-center px-8"
          style={{ opacity: 0 }}
        >
          <p className="text-center font-serif text-[3rem] font-semibold leading-[1.1] text-[#1a1a1a] md:text-[5.5rem] lg:text-[7rem]">
            No brochure
            <br />
            mentions this.
          </p>
        </div>
      </div>

      {/* ─── SCENE 5 — the final question ─── */}
      <div
        data-scene
        data-pin="120"
        className="min-h-svh bg-[#F7F5F2]"
      >
        <div
          data-content
          className="flex min-h-svh items-center justify-center px-8"
          style={{ opacity: 0 }}
        >
          <p className="text-center font-serif text-[3rem] font-light leading-[1.1] text-[#1a1a1a] md:text-[5.5rem] lg:text-[7rem]">
            Would we sign
            <br />
            the cheque?
          </p>
        </div>
      </div>

      {/* ─── TRANSITION: ivory → near-black ─── */}
      <div
        data-transition-bg
        className="hidden min-h-svh bg-[#F7F5F2] md:block"
      />
      <div className="h-[40vh] bg-gradient-to-b from-[#F7F5F2] to-[#0a0a0a] md:hidden" />

      {/* ─── DARK BREATH ─── */}
      <div className="h-[20vh] bg-[#0a0a0a] md:h-[30vh]" />

      {/* ─── CHAPTER 3: THE VERDICT PROCESS ─── */}
      <div
        data-scene
        data-pin="80"
        className="min-h-svh bg-[#0a0a0a]"
      >
        <div
          data-content
          className="flex min-h-svh items-center justify-center px-8"
          style={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center gap-5">
            <div className="h-px w-10 bg-[#c9a96e]" />
            <h3 className="text-center font-serif text-[2rem] font-light leading-[1.3] tracking-wide text-white/90 md:text-[3.2rem] lg:text-[4rem]">
              How We Arrive
              <br />
              at a Verdict
            </h3>
          </div>
        </div>
      </div>

      {/* ─── INVESTIGATIONS — sequential evidence ─── */}
      <div data-investigations className="min-h-svh bg-[#0a0a0a]">
        <div
          data-inv-container
          className="flex items-center justify-center px-8 md:h-svh"
        >
          <div className="flex flex-col items-center md:gap-10">
            {investigations.map((item, i) => {
              const isLast = i === investigations.length - 1;
              return (
                <div
                  key={item}
                  data-inv-item
                  className="flex min-h-[45vh] flex-col items-center justify-center gap-3 md:min-h-0"
                  style={{ opacity: 0, transform: "translateY(8px)" }}
                >
                  <p
                    className={`font-serif tracking-[0.12em] ${
                      isLast
                        ? "text-[1.5rem] font-normal text-white/90 md:text-[2.1rem]"
                        : "text-[1.4rem] font-light text-white/85 md:text-[2rem]"
                    }`}
                  >
                    {item}
                  </p>
                  <span
                    data-check
                    className={`text-sm ${
                      isLast ? "text-[#c9a96e]/80" : "text-[#c9a96e]/60"
                    }`}
                    style={{ opacity: 0 }}
                  >
                    &#10003;
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── PROPERTY VERDICT ─── */}
      <div data-verdict className="min-h-svh bg-[#0a0a0a]">
        <div
          data-content
          className="flex min-h-svh items-center justify-center px-6"
          style={{ opacity: 0 }}
        >
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
        </div>
      </div>
    </section>
  );
}
