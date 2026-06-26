"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useJourney } from "./journey/JourneyProvider";

/* ── Shared reveal: any [data-r] child fades up on intersect ── */
function useReveal(ref: React.RefObject<HTMLElement | null>, threshold = 0.25) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>("[data-r]");
    els.forEach((el) => {
      el.style.transition = "opacity 1.1s ease, transform 1.1s ease";
    });
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            obs.unobserve(el);
          }
        }),
      { threshold }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ref, threshold]);
}

/* ── Staggered reveal: cascade a list of items on intersect ── */
function useStaggerReveal(
  ref: React.RefObject<HTMLElement | null>,
  selector: string,
  stepMs = 160
) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>(selector);
    items.forEach((el, i) => {
      el.style.transition = `opacity 0.9s ease ${i * stepMs}ms, transform 0.9s ease ${i * stepMs}ms`;
    });
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            obs.unobserve(el);
          }
        }),
      { threshold: 0.15 }
    );
    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ref, selector, stepMs]);
}

/* ── Animated counter ── */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const dur = 2400;
          let t0: number | null = null;
          const step = (ts: number) => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(eased * end));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 5 — THE TENSION
   "Every developer has a sales office. Every broker has an incentive.
    Every buyer… is left alone."  →  "We decided to change that."
   ════════════════════════════════════════════════════════════════ */
function Storytelling() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    if (!isDesktop) {
      const els = root.querySelectorAll<HTMLElement>("[data-sm]");
      els.forEach((el) => {
        el.style.transition = "opacity 1s ease, transform 1s ease";
      });
      const obs = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const el = e.target as HTMLElement;
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
              obs.unobserve(el);
            }
          }),
        { threshold: 0.4 }
      );
      els.forEach((el) => obs.observe(el));
      return () => obs.disconnect();
    }

    gsap.registerPlugin(ScrollTrigger);
    const pin = root.querySelector<HTMLElement>("[data-s5-pin]");
    if (!pin) return;

    const bg = pin.querySelector<HTMLElement>("[data-s5-bg]")!;
    const dark = pin.querySelectorAll<HTMLElement>("[data-s5-d]");
    const ivory = pin.querySelector<HTMLElement>("[data-s5-i]")!;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=420%",
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });

    // The three premises stack, building the argument.
    tl.to(dark[0], { opacity: 1, duration: 0.06 });
    tl.to({}, { duration: 0.06 });
    tl.to(dark[1], { opacity: 1, duration: 0.06 });
    tl.to({}, { duration: 0.06 });
    tl.to(dark[2], { opacity: 1, y: 0, duration: 0.07 }); // Every buyer…
    tl.to({}, { duration: 0.14 }); // the long pause
    tl.to(dark[3], { opacity: 1, y: 0, duration: 0.07 }); // …is left alone.
    tl.to({}, { duration: 0.16 }); // let it land

    // Everything dissolves; warmth arrives.
    tl.to(dark, { opacity: 0, duration: 0.08 });
    tl.to(bg, { backgroundColor: "#F5F0E8", duration: 0.11 }, "<+=0.02");
    tl.to({}, { duration: 0.03 });
    tl.to(ivory, { opacity: 1, y: 0, duration: 0.1 });
    tl.to({}, { duration: 0.14 });

    const st = tl.scrollTrigger;
    ScrollTrigger.refresh();
    return () => {
      st?.kill(true);
      tl.kill();
    };
  }, []);

  return (
    <div ref={ref} id="experience">
      {/* Desktop — pinned */}
      <div data-s5-pin className="relative hidden h-svh overflow-hidden md:block">
        <div data-s5-bg className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute inset-0 z-10">
          {/* The tension — three premises stacking */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <p data-s5-d className="font-serif text-[1.7rem] font-light leading-[1.3] text-white/45 lg:text-[2.1rem]" style={{ opacity: 0 }}>
              Every developer has a sales office.
            </p>
            <p data-s5-d className="mt-7 font-serif text-[1.7rem] font-light leading-[1.3] text-white/45 lg:text-[2.1rem]" style={{ opacity: 0 }}>
              Every broker has an incentive.
            </p>
            <p data-s5-d className="mt-16 font-serif text-[3.2rem] font-medium leading-[1.06] text-white/90 lg:text-[4.4rem]" style={{ opacity: 0, transform: "translateY(16px)" }}>
              Every buyer&hellip;
            </p>
            <p data-s5-d className="mt-5 font-serif text-[2.3rem] font-light italic leading-[1.2] text-white/50 lg:text-[3rem]" style={{ opacity: 0, transform: "translateY(16px)" }}>
              &hellip;is left alone.
            </p>
          </div>
          {/* The turn */}
          <div data-s5-i className="absolute inset-0 flex items-center justify-center px-8 text-center" style={{ opacity: 0, transform: "translateY(18px)" }}>
            <p className="font-serif text-[2.8rem] font-medium leading-[1.1] text-[#1a1a1a] lg:text-[3.8rem]">
              We decided to change that.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile — natural scroll: each premise gets its own scroll moment */}
      <div className="md:hidden">
        <div className="bg-[#0a0a0a] text-center">
          <div className="flex min-h-[70svh] items-center justify-center px-10">
            <p data-sm className="font-serif text-[1.35rem] font-light leading-[1.4] text-white/45" style={{ opacity: 0, transform: "translateY(16px)" }}>
              Every developer has a sales office.
            </p>
          </div>
          <div className="flex min-h-[70svh] items-center justify-center px-10">
            <p data-sm className="font-serif text-[1.35rem] font-light leading-[1.4] text-white/45" style={{ opacity: 0, transform: "translateY(16px)" }}>
              Every broker has an incentive.
            </p>
          </div>
          <div className="flex min-h-[85svh] flex-col items-center justify-center px-10">
            <p data-sm className="font-serif text-[2.4rem] font-medium leading-[1.08] text-white/90" style={{ opacity: 0, transform: "translateY(16px)" }}>
              Every buyer&hellip;
            </p>
            <div className="h-[8vh]" />
            <p data-sm className="font-serif text-[1.7rem] font-light italic leading-[1.2] text-white/50" style={{ opacity: 0, transform: "translateY(16px)" }}>
              &hellip;is left alone.
            </p>
          </div>
        </div>
        <div className="h-[25vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8]" />
        <div className="flex min-h-[60svh] items-center justify-center bg-[#F5F0E8] px-10 text-center">
          <p data-sm className="font-serif text-[2.2rem] font-medium leading-[1.12] text-[#1a1a1a]" style={{ opacity: 0, transform: "translateY(16px)" }}>
            We decided to change that.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 6 — YOUR INDEPENDENT BUYER'S OFFICE
   ════════════════════════════════════════════════════════════════ */
const journey = [
  "You share your requirements.",
  "We investigate the market.",
  "We challenge assumptions.",
  "We shortlist only what deserves your attention.",
  "We negotiate in your interest.",
  "You make one confident decision.",
];

function BuyersOffice() {
  const ref = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  useReveal(ref, 0.18);
  useStaggerReveal(ref, "[data-step]", 150);

  return (
    <div ref={ref} className="bg-[#F5F0E8] px-6 pb-[12vh] pt-[12vh] md:px-8 md:pb-[16vh] md:pt-[16vh]">
      <div className="mx-auto max-w-2xl text-center">
        <span data-r className="block text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/70" style={{ opacity: 0, transform: "translateY(16px)" }}>
          Truth Private
        </span>

        <h2 data-r className="mt-6 font-serif text-[2.2rem] font-medium leading-[1.08] text-[#1a1a1a] md:mt-8 md:text-[3.8rem] lg:text-[4.6rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Your Independent
          <br />
          Buyer&apos;s Office.
        </h2>

        <div data-r className="mx-auto mt-10 max-w-md space-y-1.5 md:mt-12" style={{ opacity: 0, transform: "translateY(16px)" }}>
          <p className="text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/45 md:text-[0.95rem]">Not another broker.</p>
          <p className="text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/45 md:text-[0.95rem]">Not another property portal.</p>
          <p className="text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/45 md:text-[0.95rem]">Not another opinion.</p>
        </div>

        <p data-r className="mx-auto mt-8 max-w-md font-serif text-[1.05rem] font-light leading-relaxed text-[#1a1a1a]/70 md:text-[1.3rem]" style={{ opacity: 0, transform: "translateY(16px)" }}>
          An independent office that represents
          <br className="hidden md:block" /> only one side.{" "}
          <span className="italic text-[#1a1a1a]">Yours.</span>
        </p>

        {/* The journey */}
        <div className="mx-auto mt-16 flex max-w-md flex-col items-center md:mt-24">
          {journey.map((step, i) => {
            const isLast = i === journey.length - 1;
            return (
              <div key={step} className="flex w-full flex-col items-center">
                {i > 0 && (
                  <div data-step className="my-4 h-7 w-px bg-[#c9a96e]/30 md:my-5 md:h-8" style={{ opacity: 0, transform: "translateY(8px)" }} />
                )}
                <p
                  data-step
                  className={
                    isLast
                      ? "font-serif text-[1.25rem] font-medium leading-snug text-[#1a1a1a] md:text-[1.7rem]"
                      : "font-serif text-[1rem] font-light leading-snug text-[#1a1a1a]/65 md:text-[1.3rem]"
                  }
                  style={{ opacity: 0, transform: "translateY(10px)" }}
                >
                  {step}
                </p>
              </div>
            );
          })}
        </div>

        <div data-r className="mt-14 md:mt-20" style={{ opacity: 0, transform: "translateY(12px)" }}>
          <button onClick={() => open()} className="group inline-flex items-center gap-2 border-b border-[#c9a96e]/30 pb-1.5 font-serif text-[0.9rem] font-light tracking-[0.1em] text-[#1a1a1a] transition-colors duration-300 hover:border-[#c9a96e]/70 md:text-[1.1rem]">
            Become a Private Client
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 7 — THE INTELLIGENCE ENGINE
   "Every recommendation is earned."
   ════════════════════════════════════════════════════════════════ */
const engineLayers = [
  "Truth Intelligence",
  "TruthGuide",
  "Independent Research",
  "Human Judgement",
  "Truth Private",
  "One Recommendation",
];

function IntelligenceEngine() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, 0.2);
  useStaggerReveal(ref, "[data-eng]", 170);

  return (
    <div ref={ref} className="bg-[#F5F0E8] px-6 pb-[12vh] pt-[12vh] md:px-8 md:pb-[16vh] md:pt-[16vh]">
      <div className="mx-auto max-w-2xl text-center">
        <h2 data-r className="font-serif text-[2rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[3.4rem] lg:text-[4rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Every recommendation
          <br />
          is earned.
        </h2>

        <div className="mx-auto mt-14 flex max-w-xs flex-col items-center md:mt-20">
          {engineLayers.map((label, i) => {
            const isLast = i === engineLayers.length - 1;
            const isHero = label === "Truth Private";
            return (
              <div key={label} className="flex flex-col items-center">
                {i > 0 && (
                  <div data-eng className="flex flex-col items-center" style={{ opacity: 0, transform: "translateY(10px)" }}>
                    <div className="h-7 w-px bg-[#c9a96e]/30" />
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="my-0.5">
                      <path d="M1 1L5 5L9 1" stroke="#c9a96e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                    </svg>
                    <div className="h-7 w-px bg-[#c9a96e]/30" />
                  </div>
                )}
                <p
                  data-eng
                  className={
                    isHero
                      ? "font-serif text-[1.5rem] font-medium text-[#1a1a1a] md:text-[1.7rem]"
                      : isLast
                        ? "font-serif text-[1.8rem] font-medium text-[#c9a96e] md:text-[2rem]"
                        : "text-[0.95rem] font-light tracking-[0.12em] text-[#1a1a1a]/55 md:text-[1.05rem]"
                  }
                  style={{ opacity: 0, transform: "translateY(10px)" }}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        <p data-r className="mt-14 font-serif text-[0.9rem] font-light italic leading-relaxed text-[#1a1a1a]/40 md:mt-20 md:text-[1.15rem]" style={{ opacity: 0, transform: "translateY(12px)" }}>
          Technology doesn&apos;t replace judgement.
          <br />
          It strengthens it.
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 8 — TRUTHGUIDE
   "Every recommendation can be questioned."
   ════════════════════════════════════════════════════════════════ */
const guidePrompts = [
  "Should I buy DLF Arbour?",
  "Compare Arbour with Puri Aravallis.",
  "Show DLF’s Haryana RERA history.",
  "Why is this project risky?",
];

const typedResponse =
  "DLF Arbour shows strong fundamentals. Developer track record: 92% on-time delivery across Haryana. Current pricing sits roughly 8% below comparable towers on Golf Course Extension Road — with two risks worth weighing before you commit.";

const guideSources = ["Haryana RERA", "DLF delivery records", "6 comparable projects"];

function TruthGuideSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  const [promptIdx, setPromptIdx] = useState(0);
  const [promptVisible, setPromptVisible] = useState(true);
  const [typed, setTyped] = useState("");
  const [answered, setAnswered] = useState(false);
  const typingStarted = useRef(false);

  useReveal(ref, 0.2);

  useEffect(() => {
    const id = setInterval(() => {
      setPromptVisible(false);
      setTimeout(() => {
        setPromptIdx((p) => (p + 1) % guidePrompts.length);
        setPromptVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !typingStarted.current) {
          typingStarted.current = true;
          let i = 0;
          const tid = setInterval(() => {
            i++;
            setTyped(typedResponse.slice(0, i));
            if (i >= typedResponse.length) {
              clearInterval(tid);
              setTimeout(() => setAnswered(true), 350);
            }
          }, 20);
        }
      },
      { threshold: 0.4 }
    );
    const target = el.querySelector("[data-type-trigger]");
    if (target) obs.observe(target);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-[#F5F0E8] px-6 pb-[12vh] pt-[12vh] md:px-8 md:pb-[16vh] md:pt-[16vh]">
      <div className="mx-auto max-w-2xl text-center">
        <span data-r className="block text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/70" style={{ opacity: 0, transform: "translateY(16px)" }}>
          TruthGuide
        </span>

        <h2 data-r className="mt-6 font-serif text-[1.9rem] font-medium leading-[1.12] text-[#1a1a1a] md:mt-8 md:text-[3.2rem] lg:text-[3.8rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Every recommendation
          <br />
          can be questioned.
        </h2>

        <p data-r className="mx-auto mt-6 max-w-md text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/50 md:mt-8 md:text-[1.05rem]" style={{ opacity: 0, transform: "translateY(16px)" }}>
          Trust comes from transparency. Every recommendation should be explainable.
        </p>

        {/* Conversational interface */}
        <div data-r data-type-trigger className="mx-auto mt-10 max-w-lg text-left md:mt-16" style={{ opacity: 0, transform: "translateY(16px)" }}>
          <div className="flex items-center gap-3 border-b border-[#1a1a1a]/12 pb-3">
            <span
              className="font-serif text-[0.92rem] italic text-[#1a1a1a]/50 md:text-[1.05rem]"
              style={{ opacity: promptVisible ? 1 : 0, transition: "opacity 0.4s ease" }}
            >
              {guidePrompts[promptIdx]}
            </span>
            <span className="ml-auto h-[1.1rem] w-px bg-[#c9a96e]" style={{ animation: "caret-blink 1.1s ease-in-out infinite" }} />
          </div>

          {typed && (
            <div className="mt-8">
              <p className="text-[0.84rem] font-light leading-[1.7] text-[#1a1a1a]/65 md:text-[0.92rem]">
                {typed}
                {!answered && (
                  <span className="ml-0.5 inline-block h-[0.9em] w-px bg-[#c9a96e]/60 align-middle" style={{ animation: "caret-blink 1.1s ease-in-out infinite" }} />
                )}
              </p>

              {answered && (
                <div className="mt-7 animate-fade-up space-y-5 border-t border-[#1a1a1a]/8 pt-6">
                  <div>
                    <span className="block text-[9px] font-light uppercase tracking-[0.35em] text-[#1a1a1a]/35">
                      Sources
                    </span>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {guideSources.map((s) => (
                        <span key={s} className="rounded-full border border-[#1a1a1a]/12 px-3 py-1 text-[0.72rem] font-light text-[#1a1a1a]/55">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-light uppercase tracking-[0.35em] text-[#1a1a1a]/35">
                      Confidence
                    </span>
                    <div className="h-px flex-1 bg-[#1a1a1a]/10">
                      <div className="h-px w-[86%] bg-[#c9a96e]" />
                    </div>
                    <span className="text-[0.72rem] font-light tracking-[0.1em] text-[#1a1a1a]/55">High</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div data-r className="mt-14" style={{ opacity: 0, transform: "translateY(12px)" }}>
          <button onClick={() => open("research")} className="group inline-flex items-center gap-2 text-[0.85rem] font-light tracking-[0.16em] text-[#1a1a1a]/75 transition-colors duration-300 hover:text-[#1a1a1a]">
            Challenge Our Thinking
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 9 — TRUTH INTELLIGENCE (self-service, intentionally quieter)
   ════════════════════════════════════════════════════════════════ */
function TruthIntelligenceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  useReveal(ref, 0.2);

  return (
    <div ref={ref} className="bg-[#F5F0E8] px-6 pb-[10vh] pt-[10vh] md:px-8 md:pb-[16vh]">
      <div className="mx-auto max-w-xl text-center">
        <span data-r className="block text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/60" style={{ opacity: 0, transform: "translateY(16px)" }}>
          Truth Intelligence
        </span>

        <h2 data-r className="mt-6 font-serif text-[1.8rem] font-medium leading-[1.15] text-[#1a1a1a]/85 md:mt-8 md:text-[2.9rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Prefer to investigate
          <br />
          before trusting us?
        </h2>

        <p data-r className="mt-5 font-serif text-[1.35rem] font-light leading-snug text-[#1a1a1a] md:mt-7 md:text-[1.9rem]" style={{ opacity: 0, transform: "translateY(16px)" }}>
          Good. So do we.
        </p>

        <p data-r className="mt-10 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/45 md:mt-12 md:text-[0.95rem]" style={{ opacity: 0, transform: "translateY(14px)" }}>
          Independent project intelligence.
        </p>

        <ul data-r className="mt-8 space-y-2" style={{ opacity: 0, transform: "translateY(14px)" }}>
          {[
            "Evidence.",
            "Developer analysis.",
            "Legal analysis.",
            "Construction monitoring.",
            "Real ROI.",
            "Opportunity analysis.",
          ].map((t) => (
            <li key={t} className="font-serif text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.1rem]">
              {t}
            </li>
          ))}
        </ul>

        <div data-r className="mt-10 md:mt-12" style={{ opacity: 0, transform: "translateY(12px)" }}>
          <button onClick={() => open("research")} className="group inline-flex items-center gap-2 text-[0.82rem] font-light tracking-[0.16em] text-[#1a1a1a]/60 transition-colors duration-300 hover:text-[#1a1a1a] md:text-[0.85rem]">
            Investigate Independently
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 10 — COVERAGE
   ════════════════════════════════════════════════════════════════ */
const metrics = [
  { value: 100, suffix: "+", label: "Projects" },
  { value: 80, suffix: "+", label: "Proprietary Signals" },
  { value: 4500, suffix: "+", label: "Knowledge Pages" },
  { value: 24, suffix: "×7", label: "TruthGuide" },
];

function CoverageSection() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, 0.15);

  return (
    <div ref={ref} className="bg-[#0a0a0a] px-6 pb-[10vh] pt-[10vh] md:px-8 md:pb-[14vh] md:pt-[14vh]">
      <div className="mx-auto max-w-3xl text-center">
        <span data-r className="block text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/50" style={{ opacity: 0, transform: "translateY(16px)" }}>
          Coverage
        </span>

        <h2 data-r className="mt-6 font-serif text-[2.2rem] font-medium leading-[1.1] text-white/90 md:mt-8 md:text-[3.4rem] lg:text-[4rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Built for Gurugram.
        </h2>
        <p data-r className="mt-4 font-serif text-[1.1rem] font-light leading-[1.3] text-white/40 md:mt-6 md:text-[1.7rem]" style={{ opacity: 0, transform: "translateY(14px)" }}>
          Because expertise
          <br />
          comes before scale.
        </p>

        {/* Abstract coverage pattern */}
        <div data-r className="mx-auto mt-10 flex items-center justify-center md:mt-16" style={{ opacity: 0 }}>
          <svg width="140" height="140" viewBox="0 0 180 180" fill="none" className="text-[#c9a96e] md:h-[180px] md:w-[180px]">
            <circle cx="90" cy="90" r="18" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
            <circle cx="90" cy="90" r="50" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <circle cx="90" cy="90" r="82" stroke="currentColor" strokeWidth="0.5" opacity="0.15" strokeDasharray="4 6" />
            <circle cx="90" cy="90" r="3" fill="currentColor" opacity="0.8" />
            <circle cx="90" cy="40" r="2" fill="currentColor" opacity="0.4" />
            <circle cx="130" cy="65" r="2" fill="currentColor" opacity="0.35" />
            <circle cx="140" cy="100" r="2" fill="currentColor" opacity="0.3" />
            <circle cx="55" cy="120" r="2" fill="currentColor" opacity="0.3" />
            <circle cx="50" cy="70" r="2" fill="currentColor" opacity="0.35" />
            <circle cx="110" cy="135" r="2" fill="currentColor" opacity="0.3" />
            <line x1="90" y1="8" x2="90" y2="172" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
            <line x1="8" y1="90" x2="172" y2="90" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
          </svg>
        </div>

        {/* Metrics */}
        <div data-r className="mx-auto mt-10 grid max-w-xs grid-cols-2 gap-8 md:mt-16 md:max-w-2xl md:grid-cols-4 md:gap-12" style={{ opacity: 0, transform: "translateY(16px)" }}>
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center">
              <span className="font-serif text-[2rem] font-light leading-none text-white/85 md:text-[3rem]">
                <Counter end={m.value} suffix={m.suffix} />
              </span>
              <span className="mt-2 text-[9px] font-light uppercase tracking-[0.25em] text-white/30 md:mt-3 md:text-[10px] md:tracking-[0.3em]">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 11 — CLOSING
   ════════════════════════════════════════════════════════════════ */
function ClosingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  useReveal(ref, 0.2);

  return (
    <div ref={ref} className="bg-[#0a0a0a] px-6 pb-[14vh] pt-[10vh] md:px-8 md:pb-[16vh] md:pt-[12vh]">
      <div className="mx-auto max-w-2xl text-center">
        <h2 data-r className="font-serif text-[2rem] font-medium leading-[1.16] text-white/90 md:text-[3.4rem] lg:text-[4.2rem]" style={{ opacity: 0, transform: "translateY(24px)" }}>
          Life&apos;s biggest property decision
          <br />
          <span className="font-light italic text-white/55">deserves</span>
          <br />
          an independent buyer&apos;s office.
        </h2>

        <div data-r className="mt-12 flex flex-col items-center gap-6 md:mt-16 md:gap-8" style={{ opacity: 0, transform: "translateY(16px)" }}>
          <button onClick={() => open()} className="group inline-flex items-center gap-2 border-b border-[#c9a96e]/30 pb-1.5 font-serif text-[0.9rem] font-light tracking-[0.12em] text-[#c9a96e] transition-colors duration-300 hover:border-[#c9a96e]/60 md:text-[1.15rem]">
            Become a Private Client
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </button>

          <button onClick={() => open("research")} className="group inline-flex items-center gap-2 text-[0.8rem] font-light tracking-[0.14em] text-white/50 transition-colors duration-300 hover:text-white/75 md:text-[0.85rem]">
            Challenge TruthGuide
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </button>

          <button onClick={() => open("research")} className="text-[0.75rem] font-light tracking-[0.12em] text-white/25 transition-colors duration-300 hover:text-white/45 md:text-[0.8rem]">
            Explore Reports &rarr;
          </button>
        </div>

        {/* The thesis — bookend to where this chapter began */}
        <div data-r className="mt-20 md:mt-28" style={{ opacity: 0, transform: "translateY(16px)" }}>
          <div className="mx-auto mb-6 h-px w-12 bg-[#c9a96e]/20 md:mb-8" />
          <p className="font-serif text-[0.82rem] font-light italic leading-[1.9] text-white/30 md:text-[1.05rem]">
            Every developer has a sales office.
            <br />
            Every buyer deserves a buyer&apos;s office.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════════════════ */
export default function ExperienceSection() {
  return (
    <section>
      <Storytelling />
      <BuyersOffice />
      <IntelligenceEngine />
      <TruthGuideSection />
      <TruthIntelligenceSection />
      <div className="h-[20vh] bg-gradient-to-b from-[#F5F0E8] to-[#0a0a0a] md:h-[30vh]" />
      <CoverageSection />
      <ClosingSection />
    </section>
  );
}
