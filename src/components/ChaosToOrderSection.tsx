"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* 31 chaos items — full-screen absolute positions (% of viewport) */
const CHAOS_ITEMS: {
  text: string;
  left: number;
  top: number;
  fs: string;
  op: number;
  rot: number;
}[] = [
  { text: "Developer",            left:  7, top: 14, fs: "0.95rem", op: 0.38, rot: -1.2 },
  { text: "WhatsApp",             left: 13, top: 34, fs: "1.0rem",  op: 0.44, rot:  0.8 },
  { text: "Lawyer",               left:  5, top: 54, fs: "0.88rem", op: 0.28, rot: -2.0 },
  { text: "Brochures",            left:  9, top: 72, fs: "0.82rem", op: 0.32, rot:  1.4 },
  { text: "Floor Plans",          left: 14, top: 88, fs: "0.78rem", op: 0.24, rot: -0.8 },
  { text: "CA",                   left: 22, top:  9, fs: "0.85rem", op: 0.34, rot:  1.8 },
  { text: "Emails",               left: 26, top: 26, fs: "0.92rem", op: 0.40, rot: -1.6 },
  { text: "Bank",                 left: 19, top: 46, fs: "0.90rem", op: 0.36, rot:  0.6 },
  { text: "Agreements",           left: 24, top: 64, fs: "0.80rem", op: 0.28, rot: -2.2 },
  { text: "Loan Papers",          left: 17, top: 80, fs: "0.82rem", op: 0.30, rot:  1.0 },
  { text: "Architect",            left: 35, top:  6, fs: "0.90rem", op: 0.35, rot: -0.9 },
  { text: "Calls",                left: 33, top: 21, fs: "1.05rem", op: 0.46, rot:  2.1 },
  { text: "Parents",              left: 38, top: 40, fs: "0.95rem", op: 0.40, rot: -1.4 },
  { text: "Payment Receipts",     left: 30, top: 57, fs: "0.78rem", op: 0.26, rot:  1.8 },
  { text: "Legal Documents",      left: 34, top: 74, fs: "0.80rem", op: 0.28, rot: -0.5 },
  { text: "Site Visits",          left: 29, top: 89, fs: "0.85rem", op: 0.32, rot:  1.2 },
  { text: "Broker",               left: 47, top: 11, fs: "1.0rem",  op: 0.42, rot: -1.8 },
  { text: "WhatsApp",             left: 47, top: 22, fs: "0.88rem", op: 0.30, rot:  0.4 },
  { text: "Spouse",               left: 44, top: 33, fs: "0.92rem", op: 0.38, rot:  2.4 },
  { text: "Demand Letters",       left: 50, top: 48, fs: "0.78rem", op: 0.24, rot: -1.1 },
  { text: "Builder Updates",      left: 46, top: 62, fs: "0.82rem", op: 0.30, rot:  1.6 },
  { text: "Emails",               left: 49, top: 74, fs: "0.85rem", op: 0.28, rot: -2.0 },
  { text: "Investment Advice",    left: 43, top: 86, fs: "0.80rem", op: 0.26, rot:  0.7 },
  { text: "Relationship Manager", left: 60, top:  8, fs: "0.82rem", op: 0.32, rot:  1.3 },
  { text: "Calls",                left: 63, top: 28, fs: "0.90rem", op: 0.38, rot: -0.6 },
  { text: "Legal Documents",      left: 58, top: 45, fs: "0.78rem", op: 0.24, rot:  2.0 },
  { text: "Ownership Updates",    left: 65, top: 60, fs: "0.80rem", op: 0.28, rot: -1.4 },
  { text: "Calls",                left: 36, top: 89, fs: "0.82rem", op: 0.26, rot:  0.9 },
  { text: "NRI Compliance",       left: 74, top: 16, fs: "0.85rem", op: 0.30, rot: -1.8 },
  { text: "Site Visits",          left: 78, top: 35, fs: "0.90rem", op: 0.36, rot:  1.1 },
  { text: "Broker",               left: 82, top: 55, fs: "0.88rem", op: 0.34, rot: -0.5 },
];

const PILLARS = [
  "Conversations",
  "Documents",
  "Recommendations",
  "Buyer Ledger",
  "Ownership",
];

export default function ChaosToOrderSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pin = ref.current;
    if (!pin) return;

    gsap.registerPlugin(ScrollTrigger);

    const screen1   = pin.querySelector<HTMLElement>("[data-screen1]");
    const words     = pin.querySelectorAll<HTMLElement>("[data-word]");
    const chaosLbl  = pin.querySelector<HTMLElement>("[data-chaos-lbl]");
    const goldLine  = pin.querySelector<HTMLElement>("[data-gold-line]");
    const poTitle   = pin.querySelector<HTMLElement>("[data-po-title]");
    const pillarsEls = pin.querySelectorAll<HTMLElement>("[data-pillar]");
    const finalEl   = pin.querySelector<HTMLElement>("[data-final]");

    if (!screen1 || !goldLine || !poTitle || !finalEl) return;

    /* Pre-compute convergence deltas using container dimensions */
    const W = pin.offsetWidth  || window.innerWidth;
    const H = pin.offsetHeight || window.innerHeight;
    CHAOS_ITEMS.forEach((item, i) => {
      const word = words[i];
      if (!word) return;
      const dx = ((50 - item.left) / 100) * W;
      const dy = ((50 - item.top)  / 100) * H;
      word.dataset.dx = String(Math.round(dx));
      word.dataset.dy = String(Math.round(dy));
    });

    gsap.set(goldLine, { scaleX: 0, opacity: 0, transformOrigin: "center center" });
    gsap.set(poTitle,  { opacity: 0, y: 8 });
    pillarsEls.forEach((el) => gsap.set(el, { opacity: 0, y: 10 }));
    gsap.set(finalEl,  { opacity: 0, y: 16 });
    gsap.set(words,    { opacity: 0 });
    gsap.set(chaosLbl, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=480%",
        pin: true,
        scrub: 0.3,
        anticipatePin: 1,
      },
    });

    /* ── ACT 1: REALIZATION — headline holds calm ── */
    tl.to({}, { duration: 0.08 });

    /* ── ACT 2: CHAOS — headline retreats, words flood in ── */
    tl.to(screen1, { opacity: 0, y: -14, duration: 0.07, ease: "power2.in" });

    /* Words flood in staggered */
    tl.to(words, {
      opacity: (i: number) => CHAOS_ITEMS[i]?.op ?? 0.3,
      duration: 0.14,
      stagger: 0.004,
      ease: "power1.out",
    });

    /* Chaos label appears */
    tl.to(chaosLbl, { opacity: 1, duration: 0.07, ease: "power1.out" });

    /* Tension — freeze here */
    tl.to({}, { duration: 0.07 });

    /* Label fades before collapse */
    tl.to(chaosLbl, { opacity: 0, duration: 0.03 });

    /* One-by-one gravity convergence */
    words.forEach((word) => {
      tl.to(
        word,
        {
          x: Number(word.dataset.dx ?? 0),
          y: Number(word.dataset.dy ?? 0),
          opacity: 0,
          scale: 0.4,
          duration: 0.022,
          ease: "power3.in",
        },
        ">-0.008",
      );
    });

    /* Empty screen — breath */
    tl.to({}, { duration: 0.05 });

    /* ── ACT 3: RELIEF — gold line unfolds ── */
    tl.to(goldLine, { opacity: 1, scaleX: 1, duration: 0.07, ease: "power2.out" });
    tl.to(poTitle,  { opacity: 1, y: 0,      duration: 0.07, ease: "power2.out" });

    /* Pillars appear one by one */
    pillarsEls.forEach((el) => {
      tl.to(el, { opacity: 1, y: 0, duration: 0.04, ease: "power2.out" });
      tl.to({}, { duration: 0.018 });
    });

    /* Resolution fades, leaving only the final statement */
    tl.to({}, { duration: 0.04 });
    tl.to([goldLine, poTitle, ...Array.from(pillarsEls)], {
      opacity: 0,
      duration: 0.07,
      ease: "power2.in",
    });

    /* Final statement — alone on screen */
    tl.to(finalEl, { opacity: 1, y: 0, duration: 0.09, ease: "power2.out" });

    /* Long hold */
    tl.to({}, { duration: 0.14 });

    const st = tl.scrollTrigger;
    ScrollTrigger.refresh();
    return () => {
      st?.kill(true);
      tl.kill();
    };
  }, []);

  return (
    /* Single pinned section — full viewport height, ivory background */
    <div
      ref={ref}
      className="relative h-svh w-full overflow-hidden bg-[#F5F0E8]"
    >
      {/* ── ACT 1: Headline ── */}
      <div
        data-screen1
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <h2 className="font-serif text-[2.6rem] font-medium leading-[1.08] tracking-[-0.02em] text-[#1a1a1a] md:text-[4rem] lg:text-[5rem]">
          One Property.
          <br />
          Too Many Conversations.
        </h2>
        <p className="mx-auto mt-8 max-w-[38ch] text-[0.92rem] font-light leading-[2] text-[#1a1a1a]/28">
          Buying a property isn&apos;t one decision. It&apos;s hundreds of
          conversations, documents and opinions spread across different people.
        </p>
      </div>

      {/* ── ACT 2: Chaos words (full-screen absolute) ── */}
      {CHAOS_ITEMS.map((item, i) => (
        <span
          key={`${item.text}-${i}`}
          data-word
          className="pointer-events-none absolute select-none font-light text-[#1a1a1a]"
          style={{
            left:      `${item.left}%`,
            top:       `${item.top}%`,
            fontSize:  item.fs,
            transform: `rotate(${item.rot}deg)`,
            letterSpacing: "0.03em",
          }}
        >
          {item.text}
        </span>
      ))}

      {/* Chaos label */}
      <div
        data-chaos-lbl
        className="pointer-events-none absolute bottom-[11%] left-0 right-0 text-center"
      >
        <p className="font-serif text-[1rem] italic text-[#1a1a1a]/22 md:text-[1.15rem]">
          Everything important lives somewhere else.
        </p>
      </div>

      {/* ── ACT 3: Resolution panel ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Gold line */}
        <div
          data-gold-line
          className="h-px w-12 bg-[#c9a96e]/60"
          style={{ transformOrigin: "center center" }}
        />

        {/* "YOUR PRIVATE OFFICE" */}
        <p
          data-po-title
          className="mt-6 text-[9px] font-medium uppercase tracking-[0.44em] text-[#c9a96e]"
        >
          Your Private Office
        </p>

        {/* 5 pillars */}
        <div className="mt-10 flex flex-col items-center gap-5">
          {PILLARS.map((pillar) => (
            <p
              key={pillar}
              data-pillar
              className="font-serif text-[1.1rem] font-light tracking-[0.01em] text-[#1a1a1a]/50 md:text-[1.4rem]"
            >
              {pillar}
            </p>
          ))}
        </div>

        {/* Final statement — rendered here, animated to appear after pillars fade */}
        <div
          data-final
          className="absolute inset-0 flex items-center justify-center px-6 text-center"
        >
          <p className="font-serif text-[2.8rem] font-medium leading-[1.1] tracking-[-0.02em] text-[#1a1a1a] md:text-[4rem] lg:text-[5.2rem]">
            Everything important.
            <br />
            One place.
          </p>
        </div>
      </div>
    </div>
  );
}
