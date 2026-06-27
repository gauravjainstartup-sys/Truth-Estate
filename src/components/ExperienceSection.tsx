"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useJourney } from "./journey/JourneyProvider";
import { useConsultation } from "./consultation/ConsultationProvider";
import { ADVISORS, PRIMARY_CTA } from "@/lib/journey";

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

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
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
      {/* One pinned, scrubbed narrative — desktop and mobile alike */}
      <div data-s5-pin className="relative block h-svh overflow-hidden">
        <div data-s5-bg className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute inset-0 z-10">
          {/* The tension — three premises stacking */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <p data-s5-d className="font-serif text-[1.3rem] font-light leading-[1.3] text-white/45 md:text-[1.7rem] lg:text-[2.1rem]" style={{ opacity: 0 }}>
              Every developer has a sales office.
            </p>
            <p data-s5-d className="mt-6 font-serif text-[1.3rem] font-light leading-[1.3] text-white/45 md:mt-7 md:text-[1.7rem] lg:text-[2.1rem]" style={{ opacity: 0 }}>
              Every broker has an incentive.
            </p>
            <p data-s5-d className="mt-12 font-serif text-[2.3rem] font-medium leading-[1.06] text-white/90 md:mt-16 md:text-[3.2rem] lg:text-[4.4rem]" style={{ opacity: 0, transform: "translateY(16px)" }}>
              Every buyer&hellip;
            </p>
            <p data-s5-d className="mt-5 font-serif text-[1.7rem] font-light italic leading-[1.2] text-white/50 md:text-[2.3rem] lg:text-[3rem]" style={{ opacity: 0, transform: "translateY(16px)" }}>
              &hellip;is left alone.
            </p>
          </div>
          {/* The turn */}
          <div data-s5-i className="absolute inset-0 flex items-center justify-center px-8 text-center" style={{ opacity: 0, transform: "translateY(18px)" }}>
            <p className="font-serif text-[2.1rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.8rem] lg:text-[3.8rem]">
              We decided to change that.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 6 — INDEPENDENT REPRESENTATION  (the flagship)
   From first thought to final signature — one quiet vertical spine.
   Not a process. Watching an independent advisor think.
   ════════════════════════════════════════════════════════════════ */
function Stage({
  kicker,
  heading,
  headingClass,
  children,
}: {
  kicker: string;
  heading: React.ReactNode;
  headingClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div data-stage className="relative pl-9 md:pl-14" style={{ opacity: 0.16, willChange: "opacity" }}>
      <span className="absolute left-0 top-[7px] flex h-3 w-3 items-center justify-center rounded-full border border-[#1a1a1a]/20 bg-[#F5F0E8]">
        <span
          data-dotcore
          className="h-[5px] w-[5px] rounded-full"
          style={{ background: "rgba(201,169,110,0.3)", transition: "all 0.45s ease" }}
        />
      </span>
      <p className="text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">{kicker}</p>
      <h3 className={headingClass ?? "mt-4 font-serif text-[1.7rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[2.2rem]"}>
        {heading}
      </h3>
      {children}
    </div>
  );
}

function IndependentRepresentation() {
  const { open } = useJourney();
  const { openConsult } = useConsultation();
  const rootRef = useRef<HTMLElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const advisor = ADVISORS[0];

  useEffect(() => {
    const root = rootRef.current;
    const spine = spineRef.current;
    const fill = fillRef.current;
    if (!root || !spine || !fill) return;
    const stages = Array.from(root.querySelectorAll<HTMLElement>("[data-stage]"));

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const sr = spine.getBoundingClientRect();
      const fillH = Math.max(0, Math.min(vh * 0.5 - sr.top, sr.height));
      fill.style.height = `${fillH}px`;
      const fillBottom = sr.top + fillH;
      const focus = vh * 0.4;

      stages.forEach((el) => {
        const r = el.getBoundingClientRect();
        const anchor = r.top + 14;
        const op =
          anchor >= focus
            ? Math.max(0.16, Math.min(1, 1 - (anchor - focus) / (vh * 0.5))) // upcoming, fading in
            : Math.max(0.42, Math.min(1, 1 - (focus - anchor) / (vh * 1.3))); // passed, stays visible
        el.style.opacity = op.toFixed(3);

        const core = el.querySelector<HTMLElement>("[data-dotcore]");
        if (core) {
          const active = fillBottom >= r.top + 13;
          core.style.background = active ? "#c9a96e" : "rgba(201,169,110,0.3)";
          core.style.transform = active ? "scale(1.3)" : "scale(1)";
        }
      });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const dna: [string, number][] = [
    ["Budget", 72],
    ["Timeline", 46],
    ["Risk Appetite", 58],
    ["Lifestyle", 80],
    ["Investment Goals", 64],
  ];

  return (
    <section ref={rootRef} className="bg-[#F5F0E8] px-6 pb-[14vh] pt-[14vh] text-[#1a1a1a] md:px-8 md:pb-[20vh] md:pt-[20vh]">
      {/* Header */}
      <div className="mx-auto max-w-2xl">
        <h2 className="font-serif text-[2.5rem] font-medium leading-[1.05] text-[#1a1a1a] md:text-[4rem] lg:text-[4.6rem]">
          Independent
          <br />
          Representation.
        </h2>
        <p className="mt-7 font-serif text-[1.25rem] font-light italic leading-snug text-[#1a1a1a]/60 md:text-[1.7rem]">
          From first thought to final signature.
        </p>
        <p className="mt-6 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/50 md:text-[1.05rem]">
          Every great property decision begins with understanding&mdash;not selling.
        </p>
      </div>

      {/* The spine */}
      <div ref={spineRef} className="relative mx-auto mt-[16vh] max-w-2xl md:mt-[20vh]">
        <div className="absolute bottom-1 left-[5.5px] top-1 w-px bg-[#1a1a1a]/12" />
        <div ref={fillRef} className="absolute left-[5.5px] top-1 w-px bg-[#c9a96e]" style={{ height: 0 }} />

        <div className="flex flex-col gap-[16vh] md:gap-[20vh]">
          <Stage kicker="Start" heading="Tell us what you're looking for.">
            <p className="mt-5 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.05rem]">
              Your goals, priorities and timeline become the starting point&mdash;not inventory.
            </p>
          </Stage>

          <Stage kicker="Understand" heading="Buyer DNA">
            <p className="mt-5 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.05rem]">
              We understand what matters most to you before recommending anything.
            </p>
            <div className="mt-8 max-w-md space-y-3.5">
              {dna.map(([label, w]) => (
                <div key={label} className="flex items-center gap-4">
                  <span className="w-32 shrink-0 text-[10px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/45">
                    {label}
                  </span>
                  <span className="relative h-px flex-1 bg-[#1a1a1a]/12">
                    <span className="absolute left-0 top-0 h-px bg-[#c9a96e]" style={{ width: `${w}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </Stage>

          <Stage kicker="Investigate" heading="Truth Intelligence">
            <p className="mt-6 font-serif text-[1.05rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.25rem]">
              Projects&nbsp;&middot;&nbsp;Developers&nbsp;&middot;&nbsp;Construction&nbsp;&middot;&nbsp;Legal&nbsp;&middot;&nbsp;Pricing&nbsp;&middot;&nbsp;Location
            </p>
            <p className="mt-6 font-serif text-[1.1rem] font-light italic text-[#1a1a1a]/75 md:text-[1.3rem]">
              Every recommendation begins with evidence.
            </p>
          </Stage>

          <Stage kicker="Challenge" heading="TruthGuide">
            <p className="mt-5 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.05rem]">
              Ask anything. Question every recommendation. Every answer is transparent and evidence-backed.
            </p>
            <div className="mt-8 max-w-md border-l border-[#c9a96e]/35 pl-6">
              <p className="font-serif text-[1.2rem] font-light italic leading-snug text-[#1a1a1a]/75 md:text-[1.4rem]">
                &ldquo;Should I buy DLF Arbour?&rdquo;
              </p>
              <div className="mt-5 flex flex-col gap-3 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[0.92rem]">
                <p>
                  <span className="mr-3 text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]">Evidence</span>
                  92% on-time delivery &middot; ~8% below comparable GCE towers
                </p>
                <p>
                  <span className="mr-3 text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]">Confidence</span>
                  High
                </p>
                <p>
                  <span className="mr-3 text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]">Sources</span>
                  Haryana RERA &middot; DLF delivery records
                </p>
              </div>
            </div>
          </Stage>

          <Stage kicker="Consult" heading="Independent Consultation">
            <p className="mt-5 max-w-md font-serif text-[1.05rem] font-light leading-relaxed text-[#1a1a1a]/60 md:text-[1.2rem]">
              Technology builds confidence.
              <br />
              Human judgement builds conviction.
            </p>
            <div className="mt-8 max-w-sm rounded-xl border border-[#1a1a1a]/12 bg-white/40 p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/50 bg-[#c9a96e]/10 font-serif text-[1rem] font-medium text-[#1a1a1a]/70">
                  {advisor.initials}
                </span>
                <div>
                  <p className="font-serif text-[1.2rem] font-medium text-[#1a1a1a]">{advisor.name}</p>
                  <p className="mt-0.5 text-[0.78rem] font-light text-[#1a1a1a]/50">{advisor.experience} of experience</p>
                </div>
              </div>
              <div className="mt-5 space-y-0.5 text-[0.85rem] font-light text-[#1a1a1a]/60">
                <p>Luxury Residential Specialist</p>
                <p className="text-[#1a1a1a]/40">Independent Advisor</p>
              </div>
              <button
                onClick={() => openConsult({ sourceKind: "homepage", intent: "advice" })}
                className="mt-6 w-full rounded-sm bg-[#1e6b45] px-6 py-3 text-[12px] font-medium tracking-[0.08em] text-white transition-colors duration-500 hover:bg-[#238c55]"
              >
                Book Consultation
              </button>
            </div>
          </Stage>

          {/* Climax */}
          <Stage
            kicker="Represent"
            heading="Independent Representation"
            headingClass="mt-4 font-serif text-[2.4rem] font-medium leading-[1.04] text-[#1a1a1a] md:text-[3.6rem]"
          >
            <p className="mt-6 font-serif text-[1.5rem] font-light leading-[1.4] text-[#1a1a1a]/70 md:text-[2.1rem]">
              Only if you choose.
              <br />
              We represent one side.{" "}
              <span className="italic text-[#1a1a1a]">Yours.</span>
            </p>
          </Stage>
        </div>
      </div>

      {/* Final */}
      <div
        data-stage
        className="mx-auto mt-[18vh] max-w-2xl text-center md:mt-[24vh]"
        style={{ opacity: 0.16, willChange: "opacity" }}
      >
        <h2 className="font-serif text-[2.2rem] font-medium leading-[1.14] text-[#1a1a1a] md:text-[3.6rem]">
          One confident decision.
          <br />
          <span className="font-light text-[#1a1a1a]/55">Backed by independent judgement.</span>
        </h2>
        <div className="mt-12 flex flex-col items-center gap-6 md:mt-14">
          <button
            onClick={() => open()}
            className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-colors duration-500 hover:bg-[#238c55]"
          >
            {PRIMARY_CTA}
          </button>
          <button
            onClick={() => open("research")}
            className="group inline-flex items-center gap-2 text-[12px] font-light tracking-[0.14em] text-[#1a1a1a]/55 transition-colors duration-300 hover:text-[#1a1a1a]"
          >
            Challenge TruthGuide
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 7 — EXPERIENCE THE INTELLIGENCE
   Two editorial cards: TruthGuide & Truth Intelligence.
   Not products. Two ways to experience independent thinking.
   ════════════════════════════════════════════════════════════════ */
function useCardReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const heading = root.querySelector<HTMLElement>("[data-ei-h]");
    const left = root.querySelector<HTMLElement>("[data-ei-l]");
    const right = root.querySelector<HTMLElement>("[data-ei-r]");
    const footer = root.querySelector<HTMLElement>("[data-ei-f]");
    const els = [heading, left, right, footer].filter(Boolean) as HTMLElement[];
    els.forEach((el) => {
      el.style.transition = "opacity 1.2s ease, transform 1.2s ease";
    });
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateX(0) translateY(0)";
            obs.unobserve(el);
          }
        }),
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ref]);
}

function ExperienceIntelligence() {
  const ref = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  useCardReveal(ref);

  return (
    <div ref={ref} className="bg-[#F5F0E8] px-6 pb-[14vh] pt-[14vh] md:px-8 md:pb-[18vh] md:pt-[18vh]">
      {/* Heading */}
      <div
        data-ei-h
        className="mx-auto max-w-3xl text-center"
        style={{ opacity: 0, transform: "translateY(24px)" }}
      >
        <h2 className="font-serif text-[2.2rem] font-medium leading-[1.08] text-[#1a1a1a] md:text-[3.6rem] lg:text-[4.2rem]">
          Experience the Intelligence.
        </h2>
        <p className="mx-auto mt-8 max-w-md font-serif text-[1.1rem] font-light leading-snug text-[#1a1a1a]/50 md:mt-10 md:text-[1.4rem]">
          The same independent thinking.
          <br />
          Choose the experience that fits you best.
        </p>
      </div>

      {/* Two editorial cards */}
      <div className="mx-auto mt-[10vh] grid max-w-4xl gap-8 md:mt-[14vh] md:grid-cols-2 md:gap-10">
        {/* Card 1 — TruthGuide */}
        <div
          data-ei-l
          className="group rounded-sm border border-[#1a1a1a]/8 bg-white/30 p-8 transition-shadow duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] md:p-10 lg:p-12"
          style={{ opacity: 0, transform: "translateX(-32px)" }}
        >
          <span className="text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/70">
            TruthGuide
          </span>
          <h3 className="mt-6 font-serif text-[1.6rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[1.9rem]">
            For buyers who prefer
            <br />
            conversations.
          </h3>
          <div className="mt-8 space-y-3 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/50 md:text-[0.95rem]">
            <p>Ask natural questions.</p>
            <p>Compare projects.</p>
            <p>Understand layouts.</p>
            <p>Challenge assumptions.</p>
          </div>
          <p className="mt-8 font-serif text-[0.85rem] font-light italic text-[#1a1a1a]/40 md:text-[0.92rem]">
            Every answer is backed by evidence.
          </p>

          {/* Preview */}
          <div className="mt-10 border-l border-[#c9a96e]/25 pl-5">
            <p className="font-serif text-[1.05rem] font-light italic text-[#1a1a1a]/55 md:text-[1.15rem]">
              &ldquo;Should I buy DLF Arbour?&rdquo;
            </p>
            <span
              className="mt-2 inline-block h-[1rem] w-px bg-[#c9a96e]/50"
              style={{ animation: "caret-blink 1.1s ease-in-out infinite" }}
            />
          </div>

          <div className="mt-10">
            <button
              onClick={() => open("research")}
              className="group/btn inline-flex items-center gap-2 text-[0.82rem] font-light tracking-[0.14em] text-[#1a1a1a]/65 transition-colors duration-400 hover:text-[#1a1a1a]"
            >
              Challenge TruthGuide
              <span className="inline-block transition-transform duration-300 group-hover/btn:translate-x-1">
                &rarr;
              </span>
            </button>
          </div>
        </div>

        {/* Card 2 — Truth Intelligence */}
        <div
          data-ei-r
          className="group rounded-sm border border-[#1a1a1a]/8 bg-white/30 p-8 transition-shadow duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] md:p-10 lg:p-12"
          style={{ opacity: 0, transform: "translateX(32px)" }}
        >
          <span className="text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/70">
            Truth Intelligence
          </span>
          <h3 className="mt-6 font-serif text-[1.6rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[1.9rem]">
            For buyers who prefer
            <br />
            independent research.
          </h3>
          <div className="mt-8 space-y-3 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/50 md:text-[0.95rem]">
            <p>Read comprehensive project intelligence.</p>
            <p>Developer intelligence.</p>
            <p>Compare opportunities.</p>
            <p>Understand risks before investing.</p>
          </div>
          <p className="mt-8 font-serif text-[0.85rem] font-light italic text-[#1a1a1a]/40 md:text-[0.92rem]">
            Independent. Evidence-backed. No sales pressure.
          </p>

          {/* Preview */}
          <div className="mt-10 flex items-center gap-5">
            <div className="flex flex-col">
              <span className="text-[9px] font-light uppercase tracking-[0.35em] text-[#1a1a1a]/35">
                Property Verdict
              </span>
              <span className="mt-2 font-serif text-[0.95rem] font-medium tracking-wide text-[#1e6b45] md:text-[1.05rem]">
                Proceed
              </span>
            </div>
            <div className="ml-auto flex flex-col items-end">
              <span className="font-serif text-[2.2rem] font-light leading-none text-[#1a1a1a]/75 md:text-[2.6rem]">
                97<span className="text-[1.1rem] text-[#1a1a1a]/35">%</span>
              </span>
            </div>
          </div>

          <div className="mt-10">
            <a
              href="/Truth-Estate/intelligence"
              className="group/btn inline-flex items-center gap-2 text-[0.82rem] font-light tracking-[0.14em] text-[#1a1a1a]/65 transition-colors duration-400 hover:text-[#1a1a1a]"
            >
              Explore Intelligence
              <span className="inline-block transition-transform duration-300 group-hover/btn:translate-x-1">
                &rarr;
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom editorial sentence */}
      <div
        data-ei-f
        className="mx-auto mt-[12vh] max-w-xl text-center md:mt-[16vh]"
        style={{ opacity: 0, transform: "translateY(16px)" }}
      >
        <p className="font-serif text-[0.92rem] font-light italic leading-[1.9] text-[#1a1a1a]/40 md:text-[1.15rem]">
          Some decisions need data.
          <br />
          Some need dialogue.
          <br />
          Both deserve independent thinking.
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 8 — DECISIONS WE'VE HELPED MAKE
   Editorial case studies. Not testimonials — consulting-firm style.
   ════════════════════════════════════════════════════════════════ */
const cases = [
  {
    num: "01",
    category: "Investment",
    value: "₹8.4 Cr",
    challenge: "The buyer preferred Tower A because everyone recommended it.",
    discovery:
      "Upcoming supply in Tower A was expected to impact future resale demand.",
    recommendation: "Choose Tower C instead.",
    outcomes: ["Better floor.", "Better view.", "Better exit potential."],
  },
  {
    num: "02",
    category: "Decision",
    value: "Walk Away",
    challenge: "The launch pricing looked attractive.",
    discovery:
      "Construction delays across previous phases suggested execution risk.",
    recommendation: "Do not invest.",
    outcomes: ["Capital preserved."],
  },
  {
    num: "03",
    category: "Decision",
    value: "Wait",
    challenge: "The buyer wanted to book immediately.",
    discovery:
      "Additional inventory was expected within the next 60 days.",
    recommendation: "Delay the decision.",
    outcomes: ["Better unit.", "Lower purchase price."],
  },
];

function DecisionsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  useReveal(ref, 0.12);

  return (
    <div
      ref={ref}
      className="bg-[#F5F0E8] px-6 pb-[14vh] pt-[14vh] md:px-8 md:pb-[20vh] md:pt-[20vh]"
    >
      {/* Heading */}
      <div className="mx-auto max-w-3xl">
        <h2
          data-r
          className="font-serif text-[2.2rem] font-medium leading-[1.08] text-[#1a1a1a] md:text-[3.6rem] lg:text-[4.2rem]"
          style={{ opacity: 0, transform: "translateY(24px)" }}
        >
          Decisions We&rsquo;ve
          <br />
          Helped Make.
        </h2>
        <p
          data-r
          className="mt-7 max-w-lg font-serif text-[1.1rem] font-light leading-snug text-[#1a1a1a]/50 md:mt-10 md:text-[1.4rem]"
          style={{ opacity: 0, transform: "translateY(16px)" }}
        >
          Independent thinking only matters
          <br />
          when it changes outcomes.
        </p>
      </div>

      {/* Cases */}
      <div className="mx-auto mt-[10vh] max-w-4xl md:mt-[14vh]">
        {cases.map((c, i) => {
          const flipped = i % 2 === 1;
          return (
            <div key={c.num}>
              {i > 0 && (
                <div className="mx-auto my-[8vh] h-px w-16 bg-[#1a1a1a]/10 md:my-[10vh] md:w-24" />
              )}
              <div
                data-r
                className={`flex flex-col gap-10 md:flex-row md:items-start md:gap-16 lg:gap-24 ${flipped ? "md:flex-row-reverse" : ""}`}
                style={{ opacity: 0, transform: "translateY(28px)" }}
              >
                {/* Left column — number, category, value */}
                <div className="shrink-0 md:w-[200px] lg:w-[240px]">
                  <span className="font-serif text-[3.5rem] font-light leading-none text-[#c9a96e]/25 md:text-[4.5rem]">
                    {c.num}
                  </span>
                  <div className="mt-5 flex items-baseline gap-4">
                    <span className="text-[9px] font-light uppercase tracking-[0.4em] text-[#1a1a1a]/35">
                      {c.category}
                    </span>
                  </div>
                  <p className="mt-3 font-serif text-[1.6rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[1.9rem]">
                    {c.value}
                  </p>
                </div>

                {/* Right column — narrative */}
                <div className="flex-1">
                  <div>
                    <span className="text-[9px] font-light uppercase tracking-[0.35em] text-[#1a1a1a]/35">
                      Challenge
                    </span>
                    <p className="mt-3 font-serif text-[1.1rem] font-light leading-relaxed text-[#1a1a1a]/70 md:text-[1.25rem]">
                      {c.challenge}
                    </p>
                  </div>

                  <div className="mt-8">
                    <span className="text-[9px] font-light uppercase tracking-[0.35em] text-[#c9a96e]/70">
                      What we discovered
                    </span>
                    <p className="mt-3 text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.02rem]">
                      {c.discovery}
                    </p>
                  </div>

                  <div className="mt-8">
                    <span className="text-[9px] font-light uppercase tracking-[0.35em] text-[#1a1a1a]/35">
                      Recommendation
                    </span>
                    <p className="mt-3 font-serif text-[1.15rem] font-medium leading-snug text-[#1a1a1a] md:text-[1.3rem]">
                      {c.recommendation}
                    </p>
                  </div>

                  <div className="mt-8 border-l border-[#c9a96e]/25 pl-5">
                    <span className="text-[9px] font-light uppercase tracking-[0.35em] text-[#1a1a1a]/35">
                      Outcome
                    </span>
                    <div className="mt-3 space-y-1.5">
                      {c.outcomes.map((o) => (
                        <p
                          key={o}
                          className="font-serif text-[1rem] font-light leading-relaxed text-[#1a1a1a]/65 md:text-[1.1rem]"
                        >
                          {o}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom editorial + CTAs */}
      <div className="mx-auto mt-[12vh] max-w-2xl text-center md:mt-[16vh]">
        <p
          data-r
          className="font-serif text-[0.92rem] font-light italic leading-[1.9] text-[#1a1a1a]/40 md:text-[1.15rem]"
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          Every recommendation changes a story.
        </p>

        <div
          data-r
          className="mt-12 flex flex-col items-center gap-6 md:mt-14"
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          <button
            onClick={() => open()}
            className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-colors duration-500 hover:bg-[#238c55]"
          >
            {PRIMARY_CTA}
          </button>
          <button
            onClick={() => open()}
            className="group inline-flex items-center gap-2 text-[12px] font-light tracking-[0.14em] text-[#1a1a1a]/55 transition-colors duration-300 hover:text-[#1a1a1a]"
          >
            Book a Consultation
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 9 — WHO WE WORK BEST WITH
   Typography-led audience self-identification.
   ════════════════════════════════════════════════════════════════ */
const audiences = [
  {
    title: "NRI Buyers",
    line: "Buying from another country shouldn’t mean buying with uncertainty.",
  },
  {
    title: "Founders & Entrepreneurs",
    line: "People who value independent thinking over sales pressure.",
  },
  {
    title: "CXOs & Professionals",
    line: "Busy decision-makers who value judgement over endless property visits.",
  },
  {
    title: "Long-Term Investors",
    line: "Capital deserves the same due diligence as conviction.",
  },
  {
    title: "Families Buying Their Forever Home",
    line: "Because some decisions stay with you for decades.",
  },
  {
    title: "Buyers Who Want Independent Advice",
    line: "If you don’t want to rely only on brokers, you’re in the right place.",
  },
];

function useFocusReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>("[data-aud]");
    items.forEach((el) => {
      el.style.transition = "opacity 0.6s ease";
    });

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const focus = vh * 0.45;
      let closest: HTMLElement | null = null;
      let closestDist = Infinity;

      items.forEach((el) => {
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height * 0.5;
        const dist = Math.abs(mid - focus);
        if (dist < closestDist) {
          closestDist = dist;
          closest = el;
        }
      });

      items.forEach((el) => {
        if (el === closest) {
          el.style.opacity = "1";
        } else {
          const r = el.getBoundingClientRect();
          const mid = r.top + r.height * 0.5;
          const dist = Math.abs(mid - focus);
          const op = Math.max(0.18, 1 - dist / (vh * 0.6));
          el.style.opacity = op.toFixed(2);
        }
      });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref]);
}

function AudienceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  useReveal(ref, 0.12);
  useFocusReveal(ref);

  return (
    <div
      ref={ref}
      className="bg-[#F5F0E8] px-6 pb-[14vh] pt-[14vh] md:px-8 md:pb-[20vh] md:pt-[20vh]"
    >
      {/* Heading */}
      <div className="mx-auto max-w-3xl">
        <h2
          data-r
          className="font-serif text-[2.2rem] font-medium leading-[1.08] text-[#1a1a1a] md:text-[3.6rem] lg:text-[4.2rem]"
          style={{ opacity: 0, transform: "translateY(24px)" }}
        >
          Who We Work
          <br />
          Best With.
        </h2>
        <p
          data-r
          className="mt-7 max-w-lg font-serif text-[1.1rem] font-light leading-snug text-[#1a1a1a]/50 md:mt-10 md:text-[1.4rem]"
          style={{ opacity: 0, transform: "translateY(16px)" }}
        >
          Independent advice is most valuable when
          <br />
          the decision is too important to get wrong.
        </p>
      </div>

      {/* Audience blocks */}
      <div className="mx-auto mt-[10vh] max-w-3xl md:mt-[14vh]">
        {audiences.map((a, i) => (
          <div key={a.title}>
            {i > 0 && (
              <div className="my-[6vh] h-px w-full bg-[#1a1a1a]/6 md:my-[7vh]" />
            )}
            <div data-aud style={{ opacity: 0.18 }}>
              <h3 className="font-serif text-[1.5rem] font-medium leading-[1.15] text-[#1a1a1a] md:text-[2rem] lg:text-[2.3rem]">
                {a.title}
              </h3>
              <p className="mt-4 max-w-lg text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/55 md:mt-5 md:text-[1.08rem]">
                {a.line}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom editorial + CTAs */}
      <div className="mx-auto mt-[12vh] max-w-2xl text-center md:mt-[16vh]">
        <h3
          data-r
          className="font-serif text-[1.7rem] font-medium leading-[1.2] text-[#1a1a1a] md:text-[2.6rem] lg:text-[3rem]"
          style={{ opacity: 0, transform: "translateY(18px)" }}
        >
          If you value independent judgement,
          <br />
          <span className="font-light italic text-[#1a1a1a]/55">
            we&rsquo;ll probably get along.
          </span>
        </h3>

        <div
          data-r
          className="mt-12 flex flex-col items-center gap-6 md:mt-14"
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          <button
            onClick={() => open()}
            className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-colors duration-500 hover:bg-[#238c55]"
          >
            {PRIMARY_CTA}
          </button>
          <button
            onClick={() => open()}
            className="group inline-flex items-center gap-2 text-[12px] font-light tracking-[0.14em] text-[#1a1a1a]/55 transition-colors duration-300 hover:text-[#1a1a1a]"
          >
            Book a Consultation
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 10 — QUESTIONS WORTH ASKING
   Premium accordion FAQ. Trust-building, not support.
   ════════════════════════════════════════════════════════════════ */
const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "How are you different from a broker?",
    a: (
      <>
        A broker represents inventory. Their job is to match you with a property
        they&rsquo;re authorised to sell, and they earn when a transaction
        closes&mdash;regardless of whether it was the right decision for you.
        <br /><br />
        Truth Estate represents the buyer. We begin with your goals, conduct
        independent research, and recommend only what survives our own due
        diligence. If no project meets our standard, we&rsquo;ll tell you to
        wait.
      </>
    ),
  },
  {
    q: "How do you make money?",
    a: (
      <>
        We earn through advisory and independent representation fees&mdash;paid
        by the buyer for working in their interest. We do not earn from pushing
        a specific project.
        <br /><br />
        If referral arrangements with developers ever exist, they are fully
        disclosed and do not influence our recommendations. Our advice stays
        independent regardless of commercial structure.
      </>
    ),
  },
  {
    q: "Can I use TruthGuide without becoming a client?",
    a: (
      <>
        Yes. TruthGuide is available to help buyers explore projects, compare
        options and understand risks&mdash;independently and on their own
        terms.
        <br /><br />
        Independent representation begins only if you choose to work with us.
        There is no obligation.
      </>
    ),
  },
  {
    q: "Will you recommend a project even if it isn't popular?",
    a: (
      <>
        Absolutely. Our recommendations are based on evidence&mdash;developer
        track record, construction progress, pricing analysis, legal
        standing&mdash;not on popularity or marketing spend.
        <br /><br />
        Some of our strongest recommendations have been projects most buyers
        hadn&rsquo;t considered.
      </>
    ),
  },
  {
    q: "Do you accept commissions from developers?",
    a: (
      <>
        Transparency matters more than positioning. Our primary revenue comes
        from advisory fees paid by buyers. Where any developer arrangement
        exists, it is disclosed before you make a decision.
        <br /><br />
        Our recommendation does not change based on who pays what. If it ever
        did, we would not be worth trusting.
      </>
    ),
  },
  {
    q: "Why should I trust your recommendations?",
    a: (
      <>
        Every recommendation combines three layers: structured intelligence
        from Truth Intelligence, transparent reasoning through TruthGuide, and
        human judgement from experienced advisors.
        <br /><br />
        You can question any recommendation, examine the evidence behind it,
        and challenge our thinking before making a decision. Trust is earned
        through transparency, not claimed through marketing.
      </>
    ),
  },
  {
    q: "What happens during the consultation?",
    a: (
      <>
        The consultation is a collaborative strategy discussion&mdash;not a
        sales call. We listen to your goals, share relevant intelligence, and
        help you think through the decision clearly.
        <br /><br />
        You leave with greater clarity about your options regardless of whether
        you become a client. There is no pressure and no obligation.
      </>
    ),
  },
];

function FaqItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof faqs)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(isOpen ? bodyRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div data-r style={{ opacity: 0, transform: "translateY(16px)" }}>
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-6 py-2 text-left"
      >
        <h3 className="font-serif text-[1.2rem] font-medium leading-[1.3] text-[#1a1a1a] md:text-[1.5rem] lg:text-[1.7rem]">
          {item.q}
        </h3>
        <span
          className="mt-1 shrink-0 text-[1.2rem] font-light text-[#c9a96e]/60 transition-transform duration-500 md:text-[1.4rem]"
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ height }}
      >
        <div ref={bodyRef} className="pb-2 pt-4">
          <p className="max-w-xl text-[0.88rem] font-light leading-[1.85] text-[#1a1a1a]/50 md:text-[0.98rem]">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

function QuestionsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  useReveal(ref, 0.1);

  return (
    <div
      ref={ref}
      className="bg-[#F5F0E8] px-6 pb-[14vh] pt-[14vh] md:px-8 md:pb-[20vh] md:pt-[20vh]"
    >
      {/* Heading */}
      <div className="mx-auto max-w-3xl">
        <h2
          data-r
          className="font-serif text-[2.2rem] font-medium leading-[1.08] text-[#1a1a1a] md:text-[3.6rem] lg:text-[4.2rem]"
          style={{ opacity: 0, transform: "translateY(24px)" }}
        >
          Questions
          <br />
          Worth Asking.
        </h2>
        <p
          data-r
          className="mt-7 max-w-lg text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/50 md:mt-10 md:text-[1.1rem]"
          style={{ opacity: 0, transform: "translateY(16px)" }}
        >
          You should understand exactly how we work before trusting us with
          one of life&rsquo;s biggest financial decisions.
        </p>
      </div>

      {/* Accordion */}
      <div className="mx-auto mt-[8vh] max-w-3xl md:mt-[12vh]">
        {faqs.map((item, i) => (
          <div key={item.q}>
            {i > 0 && (
              <div className="my-7 h-px w-full bg-[#1a1a1a]/6 md:my-9" />
            )}
            <FaqItem
              item={item}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          </div>
        ))}
      </div>

      {/* Bottom editorial + CTAs */}
      <div className="mx-auto mt-[12vh] max-w-2xl text-center md:mt-[16vh]">
        <p
          data-r
          className="font-serif text-[1.1rem] font-light italic leading-[1.8] text-[#1a1a1a]/40 md:text-[1.35rem]"
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          Good decisions begin with good questions.
        </p>

        <div
          data-r
          className="mt-12 flex flex-col items-center gap-6 md:mt-14"
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          <button
            onClick={() => open()}
            className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-colors duration-500 hover:bg-[#238c55]"
          >
            {PRIMARY_CTA}
          </button>
          <button
            onClick={() => open()}
            className="group inline-flex items-center gap-2 text-[12px] font-light tracking-[0.14em] text-[#1a1a1a]/55 transition-colors duration-300 hover:text-[#1a1a1a]"
          >
            Book a Consultation
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 11 — OUR PROMISE
   Brand manifesto. Emotional climax. Dark, centered, restrained.
   ════════════════════════════════════════════════════════════════ */
function PromiseSection() {
  const ref = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLSpanElement>(null);
  const { open } = useJourney();

  useReveal(ref, 0.15);

  useEffect(() => {
    const el = periodRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transition = "opacity 1.2s ease";
          el.style.opacity = "1";
          obs.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative flex min-h-svh items-center justify-center bg-[#0a0a0a] px-6 py-[16vh] md:px-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        {/* Label */}
        <span
          data-r
          className="block text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/40"
          style={{ opacity: 0, transform: "translateY(16px)" }}
        >
          Our Promise
        </span>

        {/* Manifesto */}
        <h2
          data-r
          className="mt-10 font-serif text-[2rem] font-medium leading-[1.3] text-white/90 md:mt-14 md:text-[3rem] lg:text-[3.6rem] lg:leading-[1.25]"
          style={{ opacity: 0, transform: "translateY(20px)" }}
        >
          If we wouldn&apos;t buy it ourselves,
          <br />
          we won&apos;t recommend it to you.
        </h2>

        {/* Period — delayed reveal */}
        <span
          ref={periodRef}
          className="mt-6 block font-serif text-[1.4rem] font-light italic text-[#c9a96e]/70 md:mt-8 md:text-[2rem]"
          style={{ opacity: 0 }}
        >
          Period.
        </span>

        {/* Second beat */}
        <p
          data-r
          className="mx-auto mt-14 max-w-md font-serif text-[0.95rem] font-light leading-[2] text-white/35 md:mt-20 md:text-[1.1rem]"
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          Our responsibility isn&apos;t to help you buy more property.
          <br className="hidden md:block" />
          It&apos;s to help you make one decision you&apos;ll be proud of
          years from now.
        </p>

        {/* Final line */}
        <p
          data-r
          className="mt-12 font-serif text-[1rem] font-medium leading-[1.7] text-white/60 md:mt-16 md:text-[1.25rem]"
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          Independent judgement.
          <br />
          <span className="font-light italic text-white/40">
            Before everything else.
          </span>
        </p>

        {/* CTAs */}
        <div
          data-r
          className="mt-16 flex flex-col items-center gap-6 md:mt-20"
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          <button
            onClick={() => open()}
            className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/20 transition-colors duration-500 hover:bg-[#238c55]"
          >
            {PRIMARY_CTA}
          </button>
          <button
            onClick={() => open()}
            className="text-[12px] font-light tracking-[0.14em] text-white/40 transition-colors duration-300 hover:text-white/65"
          >
            Book a Consultation &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION 12 — COVERAGE
   ════════════════════════════════════════════════════════════════ */
const metrics = [
  { value: 100, suffix: "+", label: "Projects Analysed" },
  { value: 80, suffix: "+", label: "Intelligence Signals" },
  { value: 15, suffix: "", label: "Developers Covered" },
  { value: 7, suffix: "", label: "Micro Markets" },
];

function CoverageSection() {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, 0.15);

  return (
    <div ref={ref} className="bg-[#0a0a0a] px-6 pb-[10vh] pt-[10vh] md:px-8 md:pb-[14vh] md:pt-[14vh]">
      <div className="mx-auto max-w-3xl text-center">
        <span data-r className="block text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/50" style={{ opacity: 0, transform: "translateY(16px)" }}>
          Our Focus
        </span>

        <h2 data-r className="mt-6 font-serif text-[2.2rem] font-medium leading-[1.1] text-white/90 md:mt-8 md:text-[3.4rem] lg:text-[4rem]" style={{ opacity: 0, transform: "translateY(20px)" }}>
          Built for Gurugram.
        </h2>
        <p data-r className="mt-4 font-serif text-[1.1rem] font-light leading-[1.6] text-white/40 md:mt-6 md:text-[1.7rem]" style={{ opacity: 0, transform: "translateY(14px)" }}>
          Because expertise is earned,
          <br />
          one market at a time.
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
   SECTION 13 — CLOSING INVITATION
   The final slide. Calm, confident, minimal.
   ════════════════════════════════════════════════════════════════ */
function ClosingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  useReveal(ref, 0.12);

  return (
    <div
      ref={ref}
      className="flex min-h-[90vh] items-center justify-center bg-[#0a0a0a] px-6 md:px-8"
    >
      <div className="mx-auto max-w-2xl py-[14vh] text-center md:py-[16vh]">
        <h2
          data-r
          className="font-serif text-[2.4rem] font-bold leading-[1.12] text-white/90 md:text-[3.8rem] lg:text-[4.6rem]"
          style={{ opacity: 0, transform: "translateY(24px)" }}
        >
          One confident decision.
        </h2>

        <div
          data-r
          className="mx-auto mt-10 max-w-md md:mt-14"
          style={{ opacity: 0, transform: "translateY(16px)" }}
        >
          <p className="font-serif text-[1rem] font-light leading-[2] text-white/40 md:text-[1.15rem]">
            The right property changes your portfolio.
            <br />
            The right decision changes your future.
          </p>
          <p className="mt-8 font-serif text-[1rem] font-light leading-[2] text-white/40 md:mt-10 md:text-[1.15rem]">
            When you&apos;re ready,
            <br />
            we&apos;ll help you make it independently.
          </p>
        </div>

        <div
          data-r
          className="mt-14 flex flex-col items-center gap-7 md:mt-20"
          style={{ opacity: 0, transform: "translateY(14px)" }}
        >
          <button
            onClick={() => open()}
            className="group inline-flex items-center gap-3 rounded-sm border border-[#c9a96e]/30 bg-transparent px-12 py-5 font-serif text-[14px] font-light tracking-[0.1em] text-[#c9a96e] transition-all duration-500 hover:border-[#c9a96e]/50 hover:px-14 hover:shadow-lg hover:shadow-[#c9a96e]/5"
          >
            {PRIMARY_CTA}
            <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">
              &rarr;
            </span>
          </button>

          <button
            onClick={() => open("research")}
            className="group relative text-[13px] font-light tracking-[0.1em] text-white/40 transition-colors duration-400 hover:text-white/70"
          >
            Challenge TruthGuide &rarr;
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-white/30 transition-all duration-500 group-hover:w-full" />
          </button>

          <button
            onClick={() => open()}
            className="group relative text-[13px] font-light tracking-[0.1em] text-white/40 transition-colors duration-400 hover:text-white/70"
          >
            Book a Consultation &rarr;
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-white/30 transition-all duration-500 group-hover:w-full" />
          </button>
        </div>

        <p
          data-r
          className="mt-14 text-[11px] font-light tracking-[0.12em] text-white/20 md:mt-18"
          style={{ opacity: 0 }}
        >
          No sales pressure. No obligations. Just independent advice.
        </p>
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
      <IndependentRepresentation />
      <ExperienceIntelligence />
      <DecisionsSection />
      <AudienceSection />
      <QuestionsSection />
      <div className="h-[20vh] bg-gradient-to-b from-[#F5F0E8] to-[#0a0a0a] md:h-[30vh]" />
      <PromiseSection />
      <ClosingSection />
      <CoverageSection />
    </section>
  );
}
