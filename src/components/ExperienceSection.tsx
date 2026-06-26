"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface Offering {
  num: string;
  headline: string;
  small: string;
  product: string;
  bullets: string[];
  cta: string;
}

const offerings: Offering[] = [
  {
    num: "01",
    headline: "Explore Independently",
    small: "For buyers who enjoy researching before making a decision.",
    product: "Truth Intelligence",
    bullets: [
      "Independent project intelligence.",
      "Evidence-backed reports.",
      "Compare projects.",
      "Understand risks.",
      "Discover opportunities.",
    ],
    cta: "Explore Intelligence",
  },
  {
    num: "02",
    headline: "Ask Anything",
    small: "For buyers who want answers instantly.",
    product: "TruthGuide",
    bullets: [
      "Ask natural questions.",
      "Compare projects.",
      "Analyse layouts.",
      "Understand pricing.",
      "Get answers in seconds.",
    ],
    cta: "Talk to TruthGuide",
  },
  {
    num: "03",
    headline: "Delegate Everything",
    small: "For buyers who value their time more than the research.",
    product: "Truth Private",
    bullets: [
      "Share your requirements once.",
      "We investigate.",
      "We shortlist.",
      "We negotiate.",
      "You make one confident decision.",
    ],
    cta: "Start Private Office",
  },
];

function setupDesktop(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);

  const pin = root.querySelector<HTMLElement>("[data-exp-pin]");
  if (!pin) return;

  const landing = pin.querySelector<HTMLElement>("[data-exp-landing]")!;
  const panels = pin.querySelectorAll<HTMLElement>("[data-exp-panel]");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pin,
      start: "top top",
      end: "+=500%",
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
    },
  });

  // Hold landing
  tl.to({}, { duration: 0.08 });

  // Fade out landing
  tl.to(landing, { opacity: 0, duration: 0.08, ease: "power1.in" });

  // Three panels: fade in, hold, fade out (last one stays)
  panels.forEach((panel, i) => {
    const isLast = i === panels.length - 1;
    tl.to(panel, { opacity: 1, duration: 0.09, ease: "power1.out" });
    tl.to({}, { duration: 0.12 });
    if (!isLast) {
      tl.to(panel, { opacity: 0, duration: 0.08, ease: "power1.in" });
    }
  });

  // Hold final panel
  tl.to({}, { duration: 0.06 });

  ScrollTrigger.refresh();
}

function setupMobile(root: HTMLElement) {
  const observers: IntersectionObserver[] = [];

  root.querySelectorAll<HTMLElement>("[data-exp-m]").forEach((el) => {
    el.style.transition = "opacity 1s ease, transform 1s ease";
  });

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.2 }
  );

  root.querySelectorAll("[data-exp-m]").forEach((el) => obs.observe(el));
  observers.push(obs);

  return () => observers.forEach((o) => o.disconnect());
}

function OfferingPanel({
  o,
  idx,
  mobile,
}: {
  o: Offering;
  idx: number;
  mobile?: boolean;
}) {
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (idx !== 1 || mobile) return;
    const el = cursorRef.current;
    if (!el) return;

    let frame: number;
    let visible = true;
    const blink = () => {
      visible = !visible;
      el.style.opacity = visible ? "1" : "0";
      frame = window.setTimeout(blink, 530);
    };
    blink();
    return () => clearTimeout(frame);
  }, [idx, mobile]);

  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-[11px] font-light tracking-[0.5em] text-[#1a1a1a]/30">
        {o.num}
      </span>

      <h3 className="mt-6 font-serif text-[2.6rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[3.6rem] lg:text-[4.2rem]">
        {o.headline}
      </h3>

      <p className="mt-5 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/50 md:text-[1.05rem]">
        {o.small}
      </p>

      <div className="mt-12 h-px w-16 bg-[#c9a96e]/30 md:mt-16" />

      <p className="mt-10 text-[10px] font-light tracking-[0.45em] text-[#c9a96e]/70 md:mt-12">
        {o.product.toUpperCase()}
      </p>

      <ul className="mt-8 flex flex-col gap-2.5 md:mt-10">
        {o.bullets.map((b) => (
          <li
            key={b}
            className="font-serif text-[1rem] font-light leading-relaxed text-[#1a1a1a]/65 md:text-[1.15rem]"
          >
            {b}
          </li>
        ))}
      </ul>

      {idx === 1 && (
        <div className="mt-10 flex items-center gap-1 md:mt-12">
          <span className="font-serif text-[1rem] font-light italic text-[#1a1a1a]/25 md:text-[1.1rem]">
            What should I look for in
          </span>
          <span
            ref={cursorRef}
            className="inline-block h-[1.2em] w-[1.5px] bg-[#c9a96e]/60"
            style={{ transition: "opacity 0.15s" }}
          />
        </div>
      )}

      <button
        className="group mt-12 inline-flex items-center gap-2 text-[0.85rem] font-light tracking-[0.15em] text-[#1a1a1a]/70 transition-colors duration-300 hover:text-[#1a1a1a] md:mt-14"
      >
        {o.cta}
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
          &rarr;
        </span>
      </button>
    </div>
  );
}

export default function ExperienceSection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    if (isDesktop) {
      setupDesktop(root);
      return () => ScrollTrigger.getAll().forEach((st) => st.kill(true));
    }
    return setupMobile(root);
  }, []);

  return (
    <section ref={ref} id="experience">
      {/* Transition: black → off-white */}
      <div className="h-[40vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8]" />

      {/* ════════ DESKTOP ════════ */}
      <div data-exp-pin className="relative hidden h-svh overflow-hidden md:block">
        <div className="absolute inset-0 bg-[#F5F0E8]" />

        {/* Landing headline */}
        <div
          data-exp-landing
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center"
        >
          <h2 className="font-serif text-[3rem] font-medium leading-[1.15] text-[#1a1a1a] lg:text-[4rem]">
            The same intelligence.
            <br />
            Experienced differently.
          </h2>
          <p className="mt-8 max-w-lg text-[1.05rem] font-light leading-relaxed text-[#1a1a1a]/45 lg:text-[1.15rem]">
            Every buyer makes decisions differently.
            <br />
            Choose the experience that suits you.
          </p>
        </div>

        {/* Three offering panels — stacked, faded in/out by GSAP */}
        {offerings.map((o, i) => (
          <div
            key={o.num}
            data-exp-panel
            className="absolute inset-0 z-10 flex items-center justify-center px-8"
            style={{ opacity: 0 }}
          >
            <OfferingPanel o={o} idx={i} />
          </div>
        ))}
      </div>

      {/* ════════ MOBILE ════════ */}
      <div className="bg-[#F5F0E8] md:hidden">
        {/* Landing */}
        <div
          data-exp-m
          className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center"
          style={{ opacity: 0, transform: "translateY(20px)" }}
        >
          <h2 className="font-serif text-[2.6rem] font-medium leading-[1.15] text-[#1a1a1a]">
            The same intelligence.
            <br />
            Experienced differently.
          </h2>
          <p className="mt-6 max-w-sm text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/45">
            Every buyer makes decisions differently.
            <br />
            Choose the experience that suits you.
          </p>
        </div>

        {/* Three offerings — native scroll */}
        {offerings.map((o, i) => (
          <div
            key={o.num}
            data-exp-m
            className="flex min-h-[90vh] flex-col items-center justify-center px-8 py-20"
            style={{ opacity: 0, transform: "translateY(20px)" }}
          >
            <OfferingPanel o={o} idx={i} mobile />
          </div>
        ))}
      </div>
    </section>
  );
}
