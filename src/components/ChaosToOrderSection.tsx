"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const CHAOS_WORDS = [
  // People
  "Developer", "Broker", "Lawyer", "Bank", "CA", "Parents",
  "Spouse", "Architect", "Relationship Manager",
  // Channels
  "WhatsApp", "Emails", "Calls", "Site Visits",
  // Documents
  "Brochures", "Floor Plans", "Payment Receipts", "Demand Letters",
  "Builder Updates", "Legal Documents", "Loan Papers", "Agreements",
  "Investment Advice",
];

const ORDER_MODULES = [
  "Recommendations", "Conversations", "Documents",
  "Buyer Ledger", "TruthGuide", "Questions",
  "Consultations", "Property Timeline", "Ownership Updates",
];

/* Deterministic scatter positions — no Math.random() at render time */
const SCATTER: { x: number; y: number; rot: number; scale: number }[] = [
  { x: -38, y: -42, rot: -3.2, scale: 0.95 },
  { x: 32, y: -38, rot: 2.1, scale: 1.05 },
  { x: -22, y: -18, rot: -1.5, scale: 0.9 },
  { x: 40, y: -12, rot: 3.8, scale: 1.0 },
  { x: -42, y: 8, rot: -2.4, scale: 1.1 },
  { x: 18, y: 15, rot: 1.7, scale: 0.88 },
  { x: -30, y: 32, rot: -4.1, scale: 1.02 },
  { x: 38, y: 28, rot: 2.8, scale: 0.92 },
  { x: -10, y: -35, rot: 1.2, scale: 1.08 },
  { x: 28, y: -28, rot: -2.9, scale: 0.96 },
  { x: -36, y: -5, rot: 3.5, scale: 1.04 },
  { x: 12, y: 5, rot: -1.8, scale: 0.98 },
  { x: -18, y: 22, rot: 2.6, scale: 1.06 },
  { x: 36, y: 38, rot: -3.6, scale: 0.94 },
  { x: -44, y: 42, rot: 1.4, scale: 1.0 },
  { x: 8, y: -45, rot: -2.2, scale: 1.03 },
  { x: 44, y: 5, rot: 3.1, scale: 0.91 },
  { x: -26, y: 45, rot: -1.1, scale: 1.07 },
  { x: 22, y: 42, rot: 2.3, scale: 0.97 },
  { x: -8, y: -8, rot: -3.9, scale: 1.01 },
  { x: 30, y: -42, rot: 1.9, scale: 0.93 },
  { x: -40, y: 25, rot: -2.7, scale: 1.09 },
  { x: 14, y: -22, rot: 3.3, scale: 0.89 },
];

export default function ChaosToOrderSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);

    /* ── Headline reveal ── */
    const headEls = root.querySelectorAll<HTMLElement>("[data-ch]");
    headEls.forEach((el) => {
      el.style.transition = "opacity 1.1s ease, transform 1.1s ease";
    });
    const headObs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
            headObs.unobserve(e.target);
          }
        }),
      { threshold: 0.3 },
    );
    headEls.forEach((el) => headObs.observe(el));

    /* ── Chaos → Order scroll animation ── */
    const pinWrap = root.querySelector<HTMLElement>("[data-chaos-pin]");
    if (!pinWrap) return;

    const words = pinWrap.querySelectorAll<HTMLElement>("[data-word]");
    const chaosLabel = pinWrap.querySelector<HTMLElement>("[data-chaos-label]");
    const panel = pinWrap.querySelector<HTMLElement>("[data-panel]");
    const modules = pinWrap.querySelectorAll<HTMLElement>("[data-mod]");
    const punchline = pinWrap.querySelector<HTMLElement>("[data-punchline]");
    const micro = pinWrap.querySelector<HTMLElement>("[data-micro]");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pinWrap,
        start: "top top",
        end: "+=500%",
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
      },
    });

    // Phase 1: Words are scattered (initial state set via inline styles).
    // Hold the chaos for a beat.
    tl.to({}, { duration: 0.12 });

    // Phase 2: Fade out the chaos label
    if (chaosLabel) {
      tl.to(chaosLabel, { opacity: 0, duration: 0.04 });
    }

    // Phase 3: Words converge to center and fade out
    tl.to(
      words,
      {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 0,
        duration: 0.18,
        ease: "power2.inOut",
        stagger: 0.005,
      },
    );

    tl.to({}, { duration: 0.04 });

    // Phase 4: Panel appears
    if (panel) {
      tl.to(panel, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" });
    }

    // Phase 5: Modules reveal one by one
    modules.forEach((mod, i) => {
      tl.to(mod, { opacity: 1, y: 0, duration: 0.04, ease: "power2.out" }, `>-${i ? 0.02 : 0}`);
    });

    tl.to({}, { duration: 0.08 });

    // Phase 6: Punchline
    if (punchline) {
      tl.to(punchline, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" });
    }

    tl.to({}, { duration: 0.12 });

    // Phase 7: Microcopy
    if (micro) {
      tl.to(micro, { opacity: 1, duration: 0.08 });
    }

    tl.to({}, { duration: 0.1 });

    const st = tl.scrollTrigger;
    ScrollTrigger.refresh();
    return () => {
      headObs.disconnect();
      st?.kill(true);
      tl.kill();
    };
  }, []);

  return (
    <div ref={ref} className="bg-[#F5F0E8]">
      {/* ── Headline ── */}
      <div className="px-6 pb-[6vh] pt-[16vh] md:px-8 md:pt-[20vh]">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            data-ch
            className="font-serif text-[2.4rem] font-medium leading-[1.08] text-[#1a1a1a] md:text-[3.6rem] lg:text-[4.4rem]"
            style={{ opacity: 0, transform: "translateY(24px)" }}
          >
            One Property.
            <br />
            Too Many Conversations.
          </h2>
          <p
            data-ch
            className="mx-auto mt-8 max-w-lg text-[0.95rem] font-light leading-[1.9] text-[#1a1a1a]/35 md:mt-10 md:text-[1.05rem]"
            style={{ opacity: 0, transform: "translateY(16px)" }}
          >
            Buying a property isn&apos;t one decision.
            <br />
            It&apos;s hundreds of conversations, documents and opinions
            <br className="hidden md:block" />
            spread across different people.
          </p>
        </div>
      </div>

      {/* ── Pinned chaos → order ── */}
      <div data-chaos-pin className="relative h-svh overflow-hidden bg-[#F5F0E8]">
        {/* Scattered words */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-[70vh] w-full max-w-5xl">
            {CHAOS_WORDS.map((word, i) => {
              const s = SCATTER[i % SCATTER.length];
              return (
                <span
                  key={word}
                  data-word
                  className="absolute text-[0.78rem] font-light tracking-[0.08em] text-[#1a1a1a]/25 md:text-[0.88rem]"
                  style={{
                    left: `${50 + s.x}%`,
                    top: `${50 + s.y}%`,
                    transform: `translate(-50%, -50%) rotate(${s.rot}deg) scale(${s.scale})`,
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>

        {/* Chaos label */}
        <div
          data-chaos-label
          className="absolute bottom-[12%] left-0 right-0 text-center"
        >
          <p className="font-serif text-[1rem] italic text-[#1a1a1a]/20 md:text-[1.15rem]">
            Everything important lives somewhere else.
          </p>
        </div>

        {/* ── Resolution panel (initially hidden) ── */}
        <div
          data-panel
          className="absolute inset-0 flex items-center justify-center px-6"
          style={{ opacity: 0, transform: "translateY(30px)" }}
        >
          <div className="w-full max-w-2xl">
            {/* Panel heading */}
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a96e]">
              Your Private Office
            </p>

            {/* Module grid */}
            <div className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-x-8 gap-y-6">
              {ORDER_MODULES.map((mod) => (
                <div
                  key={mod}
                  data-mod
                  className="text-center"
                  style={{ opacity: 0, transform: "translateY(12px)" }}
                >
                  <div className="mx-auto mb-2.5 h-px w-6 bg-[#c9a96e]/30" />
                  <span className="text-[0.78rem] font-light tracking-[0.04em] text-[#1a1a1a]/50 md:text-[0.82rem]">
                    {mod}
                  </span>
                </div>
              ))}
            </div>

            {/* Punchline */}
            <div
              data-punchline
              className="mt-16 text-center md:mt-20"
              style={{ opacity: 0, transform: "translateY(16px)" }}
            >
              <p className="font-serif text-[1.8rem] font-medium leading-[1.15] text-[#1a1a1a] md:text-[2.6rem] lg:text-[3.2rem]">
                Everything important.
                <br />
                One place.
              </p>
            </div>

            {/* Microcopy */}
            <div
              data-micro
              className="mx-auto mt-10 max-w-md text-center md:mt-14"
              style={{ opacity: 0 }}
            >
              <p className="text-[0.85rem] font-light leading-[2] text-[#1a1a1a]/30 md:text-[0.92rem]">
                Instead of managing dozens of conversations,
                <br className="hidden md:block" />
                you now have one trusted place for everything
                <br className="hidden md:block" />
                related to your property journey.
              </p>
              <div className="mx-auto mt-8 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[0.78rem] font-light italic text-[#1a1a1a]/22">
                <span>Every recommendation.</span>
                <span>Every conversation.</span>
                <span>Every document.</span>
                <span>Every milestone.</span>
              </div>
              <p className="mt-4 text-[0.82rem] font-light tracking-[0.06em] text-[#c9a96e]/60">
                Preserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
