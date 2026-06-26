"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
   SECTION 5 — STORYTELLING
   "You have two choices … Or … Let us do it for you."
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
        { threshold: 0.35 }
      );
      els.forEach((el) => obs.observe(el));
      return () => obs.disconnect();
    }

    gsap.registerPlugin(ScrollTrigger);
    const pin = root.querySelector<HTMLElement>("[data-s5-pin]");
    if (!pin) return;

    const bg = pin.querySelector<HTMLElement>("[data-s5-bg]")!;
    const dark = pin.querySelectorAll<HTMLElement>("[data-s5-d]");
    const ivory = pin.querySelectorAll<HTMLElement>("[data-s5-i]");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=350%",
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });

    tl.to(dark[0], { opacity: 1, duration: 0.08 });
    tl.to({}, { duration: 0.06 });
    tl.to(dark[1], { opacity: 1, y: 0, duration: 0.08 });
    tl.to({}, { duration: 0.06 });
    tl.to(dark[2], { opacity: 1, duration: 0.07 });
    tl.to({}, { duration: 0.1 });

    dark.forEach((el) => tl.to(el, { opacity: 0, duration: 0.06 }, "<"));
    tl.to(bg, { backgroundColor: "#F5F0E8", duration: 0.13 });
    tl.to({}, { duration: 0.03 });

    tl.to(ivory[0], { opacity: 1, y: 0, duration: 0.09 });
    tl.to({}, { duration: 0.1 });
    tl.to(ivory[0], { opacity: 0, duration: 0.06 });

    tl.to(ivory[1], { opacity: 1, y: 0, duration: 0.09 });
    tl.to({}, { duration: 0.08 });

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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center">
          <p data-s5-d className="font-serif text-[2.8rem] font-medium leading-[1.15] text-white/90 lg:text-[3.6rem]" style={{ opacity: 0 }}>
            You have two choices.
          </p>
          <div className="h-10" />
          <p data-s5-d className="font-serif text-[2rem] font-light leading-[1.3] text-white/55 lg:text-[2.4rem]" style={{ opacity: 0, transform: "translateY(12px)" }}>
            Spend weeks researching.
          </p>
          <div className="h-10" />
          <p data-s5-d className="font-serif text-[3.4rem] font-medium leading-[1.1] text-white/80 lg:text-[4.2rem]" style={{ opacity: 0 }}>
            Or&hellip;
          </p>

          <p data-s5-i className="absolute font-serif text-[3rem] font-medium leading-[1.12] text-[#1a1a1a] lg:text-[4rem]" style={{ opacity: 0, transform: "translateY(16px)" }}>
            Let us do it for you.
          </p>
          <p data-s5-i className="absolute max-w-2xl font-serif text-[2rem] font-light leading-[1.35] text-[#1a1a1a]/75 lg:text-[2.6rem]" style={{ opacity: 0, transform: "translateY(16px)" }}>
            The biggest property decisions
            <br />
            deserve independent representation.
          </p>
        </div>
      </div>

      {/* Mobile — natural scroll */}
      <div className="md:hidden">
        <div className="bg-[#0a0a0a] px-8 py-[18vh] text-center">
          <p data-sm className="font-serif text-[2.4rem] font-medium leading-[1.15] text-white/90" style={{ opacity: 0, transform: "translateY(16px)" }}>
            You have two choices.
          </p>
          <div className="h-[16vh]" />
          <p data-sm className="font-serif text-[1.8rem] font-light leading-[1.3] text-white/55" style={{ opacity: 0, transform: "translateY(16px)" }}>
            Spend weeks researching.
          </p>
          <div className="h-[16vh]" />
          <p data-sm className="font-serif text-[2.8rem] font-medium leading-[1.1] text-white/80" style={{ opacity: 0, transform: "translateY(16px)" }}>
            Or&hellip;
          </p>
        </div>
        <div className="h-[16vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8]" />
        <div className="bg-[#F5F0E8] px-8 py-[16vh] text-center">
          <p data-sm className="font-serif text-[2.6rem] font-medium leading-[1.12] text-[#1a1a1a]" style={{ opacity: 0, transform: "translateY(16px)" }}>
            Let us do it for you.
          </p>
          <div className="h-[20vh]" />
          <p data-sm className="max-w-sm mx-auto font-serif text-[1.7rem] font-light leading-[1.35] text-[#1a1a1a]/75" style={{ opacity: 0, transform: "translateY(16px)" }}>
            The biggest property decisions
            <br />
            deserve independent representation.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 6 — TRUTH PRIVATE (HERO PRODUCT)
   ════════════════════════════════════════════════════════════════ */
function TruthPrivateHero() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, 0.2);

  return (
    <div ref={ref} className="bg-[#F5F0E8] px-6 pb-[14vh] pt-[14vh] md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span data-r className="block text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/70" style={{ opacity: 0, transform: "translateY(16px)" }}>
          Truth Private
        </span>

        <h2 data-r className="mt-8 font-serif text-[3rem] font-medium leading-[1.08] text-[#1a1a1a] md:text-[3.8rem] lg:text-[4.6rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Independent
          <br />
          Real Estate Office.
        </h2>

        <div data-r className="mx-auto mt-12 h-px w-16 bg-[#c9a96e]/30" style={{ opacity: 0 }} />

        <p data-r className="mt-10 text-[1rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.1rem]" style={{ opacity: 0, transform: "translateY(16px)" }}>
          Tell us what you&apos;re looking for.
        </p>

        <ul data-r className="mt-8 space-y-2.5" style={{ opacity: 0, transform: "translateY(16px)" }}>
          {[
            "We’ll investigate.",
            "We’ll shortlist.",
            "We’ll negotiate.",
            "You make one confident decision.",
          ].map((t) => (
            <li key={t} className="font-serif text-[1.1rem] font-light leading-relaxed text-[#1a1a1a]/70 md:text-[1.25rem]">
              {t}
            </li>
          ))}
        </ul>

        <div data-r className="mx-auto mt-12 h-px w-10 bg-[#1a1a1a]/10" style={{ opacity: 0 }} />

        <ul data-r className="mt-10 space-y-2" style={{ opacity: 0, transform: "translateY(12px)" }}>
          {[
            "No broker spam.",
            "No conflicting opinions.",
            "No endless site visits.",
          ].map((t) => (
            <li key={t} className="text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/40">
              {t}
            </li>
          ))}
        </ul>

        <p data-r className="mt-10 font-serif text-[1rem] font-light italic leading-relaxed text-[#1a1a1a]/45 md:text-[1.1rem]" style={{ opacity: 0, transform: "translateY(12px)" }}>
          Just one recommendation backed by evidence.
        </p>

        <div data-r className="mt-14" style={{ opacity: 0, transform: "translateY(12px)" }}>
          <button className="group inline-flex items-center gap-2 text-[0.85rem] font-light tracking-[0.16em] text-[#1a1a1a]/75 transition-colors duration-300 hover:text-[#1a1a1a]">
            Start Your Private Office
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 7 — INTELLIGENCE ENGINE
   ════════════════════════════════════════════════════════════════ */
const engineLayers = [
  "Truth Intelligence",
  "TruthGuide",
  "Independent Analysts",
  "Truth Private",
  "One Recommendation",
];

function IntelligenceEngine() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>("[data-eng]");
    items.forEach((el, i) => {
      el.style.transition = `opacity 0.9s ease ${i * 180}ms, transform 0.9s ease ${i * 180}ms`;
    });
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }
        }),
      { threshold: 0.15 }
    );
    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useReveal(ref, 0.2);

  return (
    <div ref={ref} className="bg-[#F5F0E8] px-6 pb-[14vh] pt-[14vh] md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 data-r className="font-serif text-[2.6rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[3.2rem] lg:text-[3.8rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Because every recommendation
          <br />
          is backed by intelligence.
        </h2>

        <div className="mx-auto mt-20 flex max-w-xs flex-col items-center">
          {engineLayers.map((label, i) => {
            const isLast = i === engineLayers.length - 1;
            const isHero = label === "Truth Private";
            return (
              <div key={label} className="flex flex-col items-center">
                {i > 0 && (
                  <div data-eng className="flex flex-col items-center" style={{ opacity: 0, transform: "translateY(10px)" }}>
                    <div className="h-8 w-px bg-[#c9a96e]/30" />
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="mt-0.5 mb-0.5">
                      <path d="M1 1L5 5L9 1" stroke="#c9a96e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                    </svg>
                    <div className="h-8 w-px bg-[#c9a96e]/30" />
                  </div>
                )}
                <p
                  data-eng
                  className={`${
                    isHero
                      ? "font-serif text-[1.5rem] font-medium text-[#1a1a1a] md:text-[1.7rem]"
                      : isLast
                        ? "font-serif text-[1.8rem] font-medium text-[#c9a96e] md:text-[2rem]"
                        : "text-[0.95rem] font-light tracking-[0.12em] text-[#1a1a1a]/55 md:text-[1.05rem]"
                  }`}
                  style={{ opacity: 0, transform: "translateY(10px)" }}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        <p data-r className="mt-20 font-serif text-[1rem] font-light italic leading-relaxed text-[#1a1a1a]/40 md:text-[1.15rem]" style={{ opacity: 0, transform: "translateY(12px)" }}>
          Technology doesn&apos;t replace human judgement.
          <br />
          It strengthens it.
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 8 — TRUTHGUIDE
   ════════════════════════════════════════════════════════════════ */
const guidePrompts = [
  "Should I buy DLF Arbour?",
  "Compare Arbour with Puri Aravallis.",
  "Show me DLF’s Haryana track record.",
  "Is this project overpriced?",
  "How is this layout?",
];

const typedResponse =
  "Based on our analysis of 80+ proprietary signals, DLF Arbour shows strong fundamentals. Developer track record: 92% on-time delivery in Haryana. Current pricing is approximately 8% below comparable projects on Golf Course Extension Road.";

function TruthGuideSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [promptIdx, setPromptIdx] = useState(0);
  const [promptVisible, setPromptVisible] = useState(true);
  const [typed, setTyped] = useState("");
  const typingStarted = useRef(false);

  useReveal(ref, 0.2);

  useEffect(() => {
    const id = setInterval(() => {
      setPromptVisible(false);
      setTimeout(() => {
        setPromptIdx((p) => (p + 1) % guidePrompts.length);
        setPromptVisible(true);
      }, 400);
    }, 3000);
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
            if (i >= typedResponse.length) clearInterval(tid);
          }, 22);
        }
      },
      { threshold: 0.3 }
    );
    const target = el.querySelector("[data-type-trigger]");
    if (target) obs.observe(target);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-[#F5F0E8] px-6 pb-[14vh] pt-[14vh] md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span data-r className="block text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/70" style={{ opacity: 0, transform: "translateY(16px)" }}>
          TruthGuide
        </span>

        <h2 data-r className="mt-8 font-serif text-[2.6rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[3.2rem] lg:text-[3.8rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Every question deserves
          <br />
          an evidence-backed answer.
        </h2>

        {/* Interactive prompt */}
        <div data-r data-type-trigger className="mx-auto mt-16 max-w-lg text-left" style={{ opacity: 0, transform: "translateY(16px)" }}>
          <div className="flex items-center gap-3 border-b border-[#1a1a1a]/12 pb-3">
            <span
              className="font-serif text-[1.05rem] italic text-[#1a1a1a]/50"
              style={{ opacity: promptVisible ? 1 : 0, transition: "opacity 0.4s ease" }}
            >
              {guidePrompts[promptIdx]}
            </span>
            <span className="ml-auto h-[1.1rem] w-px bg-[#c9a96e]" style={{ animation: "caret-blink 1.1s ease-in-out infinite" }} />
          </div>

          {typed && (
            <div className="mt-8">
              <p className="text-[0.92rem] font-light leading-[1.7] text-[#1a1a1a]/60">
                {typed}
                <span className="ml-0.5 inline-block h-[0.9em] w-px bg-[#c9a96e]/60" style={{ animation: "caret-blink 1.1s ease-in-out infinite" }} />
              </p>
            </div>
          )}
        </div>

        <div data-r className="mt-14" style={{ opacity: 0, transform: "translateY(12px)" }}>
          <button className="group inline-flex items-center gap-2 text-[0.85rem] font-light tracking-[0.16em] text-[#1a1a1a]/75 transition-colors duration-300 hover:text-[#1a1a1a]">
            Talk to TruthGuide
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 9 — TRUTH INTELLIGENCE (quieter)
   ════════════════════════════════════════════════════════════════ */
function TruthIntelligenceSection() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, 0.2);

  return (
    <div ref={ref} className="bg-[#F5F0E8] px-6 pb-[14vh] pt-[10vh] md:px-8">
      <div className="mx-auto max-w-xl text-center">
        <h2 data-r className="font-serif text-[2.2rem] font-medium leading-[1.12] text-[#1a1a1a]/85 md:text-[2.8rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Prefer to investigate yourself?
        </h2>

        <p data-r className="mt-6 text-[1rem] font-light leading-relaxed text-[#1a1a1a]/45 md:text-[1.1rem]" style={{ opacity: 0, transform: "translateY(14px)" }}>
          Explore independent project intelligence.
        </p>

        <ul data-r className="mt-10 space-y-2" style={{ opacity: 0, transform: "translateY(14px)" }}>
          {["Deep research.", "Evidence.", "Risk analysis.", "Opportunity analysis.", "Real ROI."].map((t) => (
            <li key={t} className="font-serif text-[1rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.1rem]">
              {t}
            </li>
          ))}
        </ul>

        <div data-r className="mt-12" style={{ opacity: 0, transform: "translateY(12px)" }}>
          <button className="group inline-flex items-center gap-2 text-[0.85rem] font-light tracking-[0.16em] text-[#1a1a1a]/60 transition-colors duration-300 hover:text-[#1a1a1a]">
            Explore Reports
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
  { value: 100, suffix: "+", label: "Projects Covered" },
  { value: 80, suffix: "+", label: "Proprietary Signals" },
  { value: 4500, suffix: "+", label: "Intelligence Pages" },
  { value: 24, suffix: "×7", label: "TruthGuide" },
];

function CoverageSection() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, 0.15);

  return (
    <div ref={ref} className="bg-[#0a0a0a] px-6 pb-[14vh] pt-[14vh] md:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 data-r className="font-serif text-[2.8rem] font-medium leading-[1.1] text-white/90 md:text-[3.4rem] lg:text-[4rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Built for Gurugram.
        </h2>
        <p data-r className="mt-6 font-serif text-[1.4rem] font-light leading-[1.3] text-white/40 md:text-[1.7rem]" style={{ opacity: 0, transform: "translateY(14px)" }}>
          Because expertise
          <br />
          comes before scale.
        </p>

        {/* Abstract coverage pattern */}
        <div data-r className="mx-auto mt-16 flex items-center justify-center" style={{ opacity: 0 }}>
          <svg width="180" height="180" viewBox="0 0 180 180" fill="none" className="text-[#c9a96e]">
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
        <div data-r className="mx-auto mt-16 grid max-w-lg grid-cols-2 gap-12 md:grid-cols-4 md:max-w-2xl" style={{ opacity: 0, transform: "translateY(16px)" }}>
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center">
              <span className="font-serif text-[2.6rem] font-light leading-none text-white/85 md:text-[3rem]">
                <Counter end={m.value} suffix={m.suffix} />
              </span>
              <span className="mt-3 text-[10px] font-light uppercase tracking-[0.3em] text-white/30">
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
  useReveal(ref, 0.2);

  return (
    <div ref={ref} className="bg-[#0a0a0a] px-6 pb-[16vh] pt-[10vh] md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 data-r className="font-serif text-[2.6rem] font-medium leading-[1.12] text-white/90 md:text-[3.4rem] lg:text-[4.2rem]" style={{ opacity: 0, transform: "translateY(24px)" }}>
          Life&apos;s biggest property decisions
          <br />
          <span className="font-light italic text-white/55">deserve</span>
          <br />
          independent representation.
        </h2>

        <div data-r className="mt-16 flex flex-col items-center gap-8" style={{ opacity: 0, transform: "translateY(16px)" }}>
          <button className="group inline-flex items-center gap-2 border-b border-[#c9a96e]/30 pb-1.5 font-serif text-[1rem] font-light tracking-[0.12em] text-[#c9a96e] transition-colors duration-300 hover:border-[#c9a96e]/60 hover:text-[#c9a96e] md:text-[1.15rem]">
            Start Your Private Office
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </button>

          <button className="group inline-flex items-center gap-2 text-[0.85rem] font-light tracking-[0.14em] text-white/50 transition-colors duration-300 hover:text-white/75">
            Talk to TruthGuide
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </button>

          <button className="text-[0.8rem] font-light tracking-[0.12em] text-white/25 transition-colors duration-300 hover:text-white/45">
            Explore Reports &rarr;
          </button>
        </div>

        <div data-r className="mx-auto mt-16 h-px w-12 bg-[#c9a96e]/20" style={{ opacity: 0 }} />
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
      <TruthPrivateHero />
      <IntelligenceEngine />
      <TruthGuideSection />
      <TruthIntelligenceSection />
      <div className="h-[30vh] bg-gradient-to-b from-[#F5F0E8] to-[#0a0a0a]" />
      <CoverageSection />
      <ClosingSection />
    </section>
  );
}
