"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useJourney } from "./journey/JourneyProvider";
import { useConsultation } from "./consultation/ConsultationProvider";
import { PRIMARY_CTA } from "@/lib/journey";
import { basePath } from "@/lib/site";


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
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
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

/* Per-stage secondary CTA — a hairline outline that fills to ink on hover.
   Renders an <a> when href is given (e.g. Deal Room), else a <button>. Kept
   quieter than the green primary so the hierarchy holds. */
function StageCTA({ label, onClick, href }: { label: string; onClick?: () => void; href?: string }) {
  const cls =
    "group/cta mt-8 inline-flex items-center gap-3 rounded-sm border border-[#1a1a1a]/25 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#1a1a1a] transition-colors duration-300 hover:border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#F5F0E8]";
  const inner = (
    <>
      {label}
      <span className="inline-block text-[#c9a96e] transition-all duration-300 group-hover/cta:translate-x-1 group-hover/cta:text-[#F5F0E8]">
        &rarr;
      </span>
    </>
  );
  return href ? (
    <a href={href} className={cls}>{inner}</a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>{inner}</button>
  );
}

/* Stage 3 — the founder, image + name only. Shows a neutral silhouette by
   default and upgrades to the headshot ONLY once it successfully loads, so a
   missing/not-yet-committed photo never renders as a broken image. Drop the
   file at /images/founder-gaurav.jpg and it appears automatically. */
function FounderBadge() {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    const url = `${basePath}/images/founder-gaurav.webp`;
    const probe = new window.Image();
    probe.onload = () => setPhoto(url);
    probe.src = url;
  }, []);
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#B29668]/50 bg-[#c9a96e]/10">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Gaurav Jain — Founder, Truth Estate" width={56} height={56} className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth={1.3} className="h-7 w-7 opacity-50" aria-hidden>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
          </svg>
        )}
      </span>
      <div>
        <p className="font-serif text-[1.3rem] font-medium leading-tight text-[#1a1a1a]">Gaurav Jain</p>
        <p className="mt-0.5 text-[0.8rem] font-light text-[#1a1a1a]/45">Founder, Truth Estate</p>
      </div>
    </div>
  );
}

function IndependentRepresentation() {
  const { open } = useJourney();
  const { openConsult } = useConsultation();
  const rootRef = useRef<HTMLElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

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

  // Desktop only: the thesis opens centred, then slides centre → left and
  // docks (frozen) as the timeline scrolls in on the right. Gated to lg via
  // matchMedia, so mobile/tablet keep the natural stacked layout untouched.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const col = root.querySelector<HTMLElement>("[data-leftcol]");
      const thesis = root.querySelector<HTMLElement>("[data-thesis]");
      if (!col || !thesis) return;
      // Offset that centres the thesis block in the viewport (measured from the
      // untransformed left column + block width, so it's transform-independent).
      const centreX = () => {
        const cr = col.getBoundingClientRect();
        return Math.max(0, window.innerWidth / 2 - (cr.left + thesis.offsetWidth / 2));
      };
      const tw = gsap.fromTo(
        thesis,
        { x: centreX },
        {
          x: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "+=78%",
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        }
      );
      return () => {
        tw.scrollTrigger?.kill();
        tw.kill();
      };
    });
    return () => mm.revert();
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
      {/* Desktop: frozen thesis (left) + scrolling timeline (right). Mobile/tablet: natural stack. */}
      <div className="mx-auto max-w-2xl lg:grid lg:max-w-6xl lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-x-12">
        {/* Left — thesis. Sticky + vertically centred on desktop; slides centre → left on scroll. */}
        <div data-leftcol className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center">
          <div data-thesis className="lg:max-w-[30rem] lg:will-change-transform">
            <h2 className="font-serif text-[2.5rem] font-medium leading-[1.05] text-[#1a1a1a] md:text-[4rem] lg:text-[3.7rem]">
              Independent
              <br />
              Representation.
            </h2>
            <p className="mt-7 font-serif text-[1.25rem] font-light italic leading-snug text-[#1a1a1a]/60 md:text-[1.7rem]">
              From first thought to final signature &mdash; and beyond.
            </p>
            <p className="mt-6 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/50 md:text-[1.05rem]">
              Every great property decision begins with understanding&mdash;not selling.
            </p>
          </div>
        </div>

        {/* Right — the spine timeline (natural scroll). Desktop top-pad so the first stage enters after the intro. */}
        <div className="mt-[16vh] md:mt-[20vh] lg:mt-0 lg:pt-[86vh]">
          <div ref={spineRef} className="relative">
        <div className="absolute bottom-1 left-[5.5px] top-1 w-px bg-[#1a1a1a]/12" />
        <div ref={fillRef} className="absolute left-[5.5px] top-1 w-px bg-[#c9a96e]" style={{ height: 0 }} />

        <div className="flex flex-col gap-[16vh] md:gap-[20vh]">
          <Stage kicker="Start" heading="It starts with you — not inventory.">
            <p className="mt-5 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.05rem]">
              Your goals, priorities and timeline are the brief. We translate them into your Buyer DNA&mdash;what genuinely matters to you&mdash;before recommending a single property.
            </p>
            <div className="mt-8 max-w-md rounded-xl border border-[#1a1a1a]/12 bg-white p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]/80">Your Buyer DNA</p>
              <div className="mt-5 space-y-3.5">
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
            </div>
            <StageCTA label="Share your Requirements" onClick={() => open()} />
          </Stage>

          <Stage kicker="Clarity" heading="See clearly. Ask freely.">
            <p className="mt-5 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.05rem]">
              We know every project down to the unit&mdash;so you never have to guess. Ask anything, and we&rsquo;ll tell you straight.
            </p>
            <p className="mt-7 font-serif text-[1.05rem] font-light leading-relaxed text-[#1a1a1a]/60 md:text-[1.2rem]">
              Developer&nbsp;&middot; Location&nbsp;&middot; Project&nbsp;&middot; Tower&nbsp;&middot; Unit&nbsp;&middot; Legal&nbsp;&middot; Pricing
            </p>
            <div className="mt-8 max-w-md rounded-xl border border-[#1a1a1a]/12 bg-white p-6">
              <p className="font-serif text-[1.2rem] font-light italic leading-snug text-[#1a1a1a]/75 md:text-[1.4rem]">
                &ldquo;Which unit in DLF Arbour is best for natural light and vastu?&rdquo;
              </p>
              <div className="mt-5 flex flex-col gap-3 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[0.92rem]">
                <p>
                  <span className="mr-3 text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/45">Pick</span>
                  Tower C &middot; higher floors &middot; east-facing
                </p>
                <p>
                  <span className="mr-3 text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/45">Light</span>
                  Open morning sun; no tower planned to the east
                </p>
                <p>
                  <span className="mr-3 text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/45">Vastu</span>
                  North-east entry, master suite to the south-west
                </p>
                <p>
                  <span className="mr-3 whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/45">Worth knowing</span>
                  A small premium over the west-facing stacks
                </p>
              </div>
            </div>
            <StageCTA label="Ask your first question" onClick={() => open("research")} />
          </Stage>

          {/* Represent — human + the commitment */}
          <Stage
            kicker="Represent"
            heading={<>We represent one side. <span className="italic">Yours.</span></>}
          >
            <p className="mt-5 max-w-md font-serif text-[1.05rem] font-light leading-relaxed text-[#1a1a1a]/60 md:text-[1.2rem]">
              Technology builds confidence; human judgement builds conviction. When you choose to go further, a dedicated advisor sits on your side of the table&mdash;and no one else&rsquo;s.
            </p>
            <div className="mt-8 max-w-md rounded-xl border border-[#1a1a1a]/12 bg-white p-6">
              <FounderBadge />
              <button
                onClick={() => openConsult({ sourceKind: "homepage", intent: "advice" })}
                className="mt-6 w-full rounded-sm bg-[#1e6b45] px-6 py-3 text-[12px] font-medium tracking-[0.08em] text-white transition-colors duration-500 hover:bg-[#238c55]"
              >
                Request Independent Advice
              </button>
            </div>
          </Stage>

          <Stage kicker="Close" heading="The best offer comes to you.">
            <p className="mt-5 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.05rem]">
              No calling ten brokers. No haggling. No wondering if you left money on the table. Our trusted network brings you the best terms available&mdash;and we secure them on your side.
            </p>
            <div className="mt-8 max-w-md rounded-xl border border-[#1a1a1a]/12 bg-white p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]/80">The same unit, three offers</p>
              <div className="mt-4 flex flex-col gap-1">
                <div className="flex items-center justify-between px-3 py-2.5 text-[0.9rem] font-light text-[#1a1a1a]/55">
                  <span>Developer&rsquo;s discounted price</span>
                  <span className="font-mono text-[#1a1a1a]/70">&#8377;4.5 Cr</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 text-[0.9rem] font-light text-[#1a1a1a]/55">
                  <span>Execution partner</span>
                  <span className="font-mono text-[#1a1a1a]/70">&#8377;4.8 Cr</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#1e6b45]/[0.07] px-3 py-2.5 text-[0.95rem] font-medium text-[#1e6b45]">
                  <span className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1e6b45] text-[9px] leading-none text-white">&#10003;</span>
                    Truth Estate
                  </span>
                  <span className="font-mono">&#8377;4.2 Cr</span>
                </div>
              </div>
            </div>
            <StageCTA label="See how we get your price" href={`${basePath}/deal-room`} />
          </Stage>

          {/* Climax — the relationship that doesn't end */}
          <Stage kicker="Stay" heading="Ownership Intelligence">
            <p className="mt-5 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.05rem]">
              Closing isn&rsquo;t the end of the relationship&mdash;it&rsquo;s the start of the next chapter. Your private portfolio terminal stays open for as long as you own.
            </p>
            <div className="mt-8 max-w-md rounded-xl border border-[#1a1a1a]/12 bg-white p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]/80">Portfolio Terminal</p>
              <div className="mt-5 flex flex-col gap-4 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/60 md:text-[0.92rem]">
                <p>
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/45">Documents</span>
                  Upload your BBA, allotment and developer letters; we flag any anomalies
                </p>
                <p>
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/45">Resale value</span>
                  Track your home&rsquo;s price on the dashboard, live
                </p>
                <p>
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/45">Resale, handled</span>
                  When you choose to sell, our team runs it end to end
                </p>
              </div>
            </div>
            <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-dashed border-[#1a1a1a]/25 px-4 py-2 text-[11px] font-normal uppercase tracking-[0.22em] text-[#1a1a1a]/45">
              <span className="h-[5px] w-[5px] rounded-full bg-[#c9a96e]" />
              Coming Soon
            </span>
          </Stage>
          </div>
          </div>
        </div>
      </div>

      {/* Final */}
      <div
        data-stage
        className="mx-auto mt-[18vh] max-w-2xl text-center md:mt-[24vh] lg:mt-[26vh]"
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
    const own = root.querySelector<HTMLElement>("[data-ei-o]");
    const footer = root.querySelector<HTMLElement>("[data-ei-f]");
    const els = [heading, left, right, own, footer].filter(Boolean) as HTMLElement[];
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
    <div ref={ref} className="overflow-x-hidden bg-[#F5F0E8] px-6 pb-[14vh] pt-[14vh] md:px-8 md:pb-[18vh] md:pt-[18vh]">
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
      <div className="mx-auto mt-[10vh] grid max-w-6xl gap-8 md:mt-[14vh] md:grid-cols-2 md:gap-10 lg:grid-cols-3">
        {/* Card 1 — TruthGuide */}
        <div
          data-ei-l
          className="group rounded-sm border border-[#1a1a1a]/8 bg-white p-8 transition-shadow duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] md:p-10 lg:p-12"
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
          className="group rounded-sm border border-[#1a1a1a]/8 bg-white p-8 transition-shadow duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] md:p-10 lg:p-12"
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
              href={`${basePath}/intelligence`}
              className="group/btn inline-flex items-center gap-2 text-[0.82rem] font-light tracking-[0.14em] text-[#1a1a1a]/65 transition-colors duration-400 hover:text-[#1a1a1a]"
            >
              Explore Intelligence
              <span className="inline-block transition-transform duration-300 group-hover/btn:translate-x-1">
                &rarr;
              </span>
            </a>
          </div>
        </div>

        {/* Card 3 — Spatial Intelligence (Sun & Vastu 3D, Beta) */}
        <div
          data-ei-o
          className="group rounded-sm border border-[#1a1a1a]/8 bg-white p-8 transition-shadow duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] md:p-10 lg:p-12"
          style={{ opacity: 0, transform: "translateY(28px)" }}
        >
          <span className="flex items-center gap-2.5">
            <span className="text-[10px] font-light uppercase tracking-[0.5em] text-[#c9a96e]/70">
              Spatial Intelligence
            </span>
            <span className="rounded-full border border-[#a2782a]/40 px-2 py-[2px] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#a2782a]">
              Beta
            </span>
          </span>
          <h3 className="mt-6 font-serif text-[1.6rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[1.9rem]">
            For buyers who value
            <br />
            light &amp; vastu.
          </h3>
          <div className="mt-8 space-y-3 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/50 md:text-[0.95rem]">
            <p>See the sun on every floor.</p>
            <p>Read daylight, heat &amp; shade.</p>
            <p>Check vastu, room by room.</p>
            <p>Compare units before you buy.</p>
          </div>
          <p className="mt-8 font-serif text-[0.85rem] font-light italic text-[#1a1a1a]/40 md:text-[0.92rem]">
            See the home before you sign.
          </p>

          {/* Preview — sun/vastu read-out */}
          <div className="mt-10 flex items-center gap-5">
            <div className="flex flex-col">
              <span className="text-[9px] font-light uppercase tracking-[0.35em] text-[#1a1a1a]/35">
                Facing
              </span>
              <span className="mt-2 font-serif text-[0.95rem] font-medium tracking-wide text-[#1e6b45] md:text-[1.05rem]">
                North-East
              </span>
              <span className="mt-1.5 text-[0.78rem] font-light text-[#1a1a1a]/55">
                Brahmasthan clear <span className="font-medium text-[#1e6b45]">&#10003;</span>
              </span>
            </div>
            <span className="ml-auto" aria-hidden="true">
              <svg width="50" height="50" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="22" stroke="#1a1a1a" strokeOpacity="0.1" strokeWidth="1" />
                <path d="M26 26 L37 15" stroke="#1e6b45" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M26 26 L18 34" stroke="#1a1a1a" strokeOpacity="0.15" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="26" cy="26" r="2" fill="#1e6b45" />
                <text x="26" y="10.5" textAnchor="middle" fontSize="7" fill="#1a1a1a" fillOpacity="0.5">N</text>
                <text x="43.5" y="28.5" textAnchor="middle" fontSize="7" fill="#1a1a1a" fillOpacity="0.4">E</text>
              </svg>
            </span>
          </div>

          <div className="mt-10">
            <a
              href={`${basePath}/sun-vastu`}
              className="group/btn inline-flex items-center gap-2 text-[0.82rem] font-light tracking-[0.14em] text-[#1a1a1a]/65 transition-colors duration-400 hover:text-[#1a1a1a]"
            >
              Explore Sun &amp; Vastu 3D
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
  const spineRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  const { openConsult } = useConsultation();
  useReveal(ref, 0.12);

  // A sibling of Independent Representation's spine: the gold line fills as you
  // scroll, dots light up as it passes, and each case brightens as it reaches
  // the middle of the screen. Self-contained so the flagship section upstream
  // stays untouched.
  useEffect(() => {
    const root = ref.current;
    const spine = spineRef.current;
    const fill = fillRef.current;
    if (!root || !spine || !fill) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-node]"));

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const sr = spine.getBoundingClientRect();
      const fillH = Math.max(0, Math.min(vh * 0.5 - sr.top, sr.height));
      fill.style.height = `${fillH}px`;
      const fillBottom = sr.top + fillH;
      const focus = vh * 0.4;

      nodes.forEach((el) => {
        const r = el.getBoundingClientRect();
        const anchor = r.top + 14;
        const op =
          anchor >= focus
            ? Math.max(0.16, Math.min(1, 1 - (anchor - focus) / (vh * 0.5)))
            : Math.max(0.42, Math.min(1, 1 - (focus - anchor) / (vh * 1.3)));
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

  return (
    <div
      ref={ref}
      className="bg-[#F5F0E8] px-6 pb-[14vh] pt-[14vh] md:px-8 md:pb-[20vh] md:pt-[20vh]"
    >
      {/* Desktop: sticky thesis (left) + scrolling spine (right). Mobile/tablet: natural stack. */}
      <div className="mx-auto max-w-2xl lg:grid lg:max-w-6xl lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-x-12">
        {/* Left — thesis. Simply sticky + vertically centred on desktop (no dock slide). */}
        <div className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center">
          <div className="lg:max-w-[30rem]">
            <h2
              data-r
              className="font-serif text-[2.5rem] font-medium leading-[1.05] text-[#1a1a1a] md:text-[4rem] lg:text-[3.7rem]"
              style={{ opacity: 0, transform: "translateY(24px)" }}
            >
              Decisions We&rsquo;ve
              <br />
              Helped Make.
            </h2>
            <p
              data-r
              className="mt-7 font-serif text-[1.25rem] font-light italic leading-snug text-[#1a1a1a]/60 md:text-[1.7rem]"
              style={{ opacity: 0, transform: "translateY(16px)" }}
            >
              Independent thinking only matters when it changes outcomes.
            </p>
            <p
              data-r
              className="mt-6 max-w-md text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/50 md:text-[1.05rem]"
              style={{ opacity: 0, transform: "translateY(16px)" }}
            >
              Not testimonials &mdash; a short record of moments where the evidence pointed somewhere the crowd didn&rsquo;t.
            </p>
          </div>
        </div>

        {/* Right — the spine timeline (natural scroll). Desktop top-pad so the first case enters after the intro. */}
        <div className="mt-[16vh] md:mt-[20vh] lg:mt-0 lg:pt-[64vh]">
          <div ref={spineRef} className="relative">
            <div className="absolute bottom-1 left-[5.5px] top-1 w-px bg-[#1a1a1a]/12" />
            <div ref={fillRef} className="absolute left-[5.5px] top-1 w-px bg-[#c9a96e]" style={{ height: 0 }} />

            <div className="flex flex-col gap-[16vh] md:gap-[20vh]">
              {cases.map((c) => {
                const money = c.value.startsWith("₹");
                return (
                  <div
                    key={c.num}
                    data-node
                    className="relative pl-9 md:pl-14"
                    style={{ opacity: 0.16, willChange: "opacity" }}
                  >
                    <span className="absolute left-0 top-[9px] flex h-3 w-3 items-center justify-center rounded-full border border-[#1a1a1a]/20 bg-[#F5F0E8]">
                      <span
                        data-dotcore
                        className="h-[5px] w-[5px] rounded-full"
                        style={{ background: "rgba(201,169,110,0.3)", transition: "all 0.45s ease" }}
                      />
                    </span>

                    <span className="font-serif text-[3.25rem] font-light leading-none text-[#c9a96e]/25 md:text-[4.5rem]">
                      {c.num}
                    </span>
                    <p className="mt-4 text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">
                      {c.category}
                    </p>
                    <h3 className="mt-3 font-serif text-[1.7rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.05rem]">
                      {c.recommendation}
                    </h3>
                    <p className="mt-4 max-w-md font-serif text-[1.05rem] font-light leading-relaxed text-[#1a1a1a]/60 md:text-[1.2rem]">
                      {c.challenge}
                    </p>

                    {/* the reasoning card — discovered → the call → outcome */}
                    <div className="mt-8 max-w-md rounded-xl border border-[#1a1a1a]/12 bg-white p-6">
                      <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]/80">What we discovered</p>
                      <p className="mt-3 text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/60 md:text-[0.98rem]">
                        {c.discovery}
                      </p>

                      <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-dotted border-[#1a1a1a]/15 pt-4">
                        <span className="text-[10px] font-light uppercase tracking-[0.24em] text-[#1a1a1a]/40">
                          {money ? "Investment" : "Our call"}
                        </span>
                        <span
                          className={
                            money
                              ? "font-mono text-[1.35rem] font-medium tracking-tight text-[#1a1a1a]"
                              : "font-serif text-[1.25rem] font-medium text-[#1a1a1a]/80"
                          }
                        >
                          {c.value}
                        </span>
                      </div>

                      <div className="mt-5">
                        <p className="text-[10px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/40">Outcome</p>
                        <div className="mt-3 flex flex-col gap-2.5">
                          {c.outcomes.map((o) => (
                            <p
                              key={o}
                              className="flex items-center gap-3 font-serif text-[1rem] font-light leading-relaxed text-[#1a1a1a]/70 md:text-[1.05rem]"
                            >
                              <span className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-[#1e6b45] text-[9px] leading-none text-white">
                                &#10003;
                              </span>
                              {o}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom editorial + CTAs */}
      <div className="mx-auto mt-[16vh] max-w-2xl text-center md:mt-[22vh]">
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
            onClick={() => openConsult({ sourceKind: "homepage" })}
            className="group inline-flex items-center gap-2 text-[12px] font-light tracking-[0.14em] text-[#1a1a1a]/55 transition-colors duration-300 hover:text-[#1a1a1a]"
          >
            Request Independent Advice
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

function AudienceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const { open } = useJourney();
  const { openConsult } = useConsultation();
  useReveal(ref, 0.12);

  // Cinematic focus stage: one persona owns the screen at a time and cross-fades
  // to the next as you scroll (a sibling of the opening "…is left alone" beat).
  // A persistent eyebrow, an NN/06 counter and the bottom rail keep your place.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const fps = Array.from(track.querySelectorAll<HTMLElement>("[data-fp]"));
    const cur = curRef.current;
    const fill = fillRef.current;
    const N = fps.length;
    if (!N) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const scrollable = track.offsetHeight - vh;
      const p = scrollable > 0 ? Math.max(0, Math.min(1, -track.getBoundingClientRect().top / scrollable)) : 0;
      const af = p * (N - 1); // active-float: which persona holds the screen
      fps.forEach((el, i) => {
        const op = Math.max(0, 1 - Math.abs(i - af) * 1.7);
        el.style.opacity = op.toFixed(3);
        el.style.transform = `translateY(calc(-50% + ${((i - af) * 38).toFixed(1)}px))`;
        el.style.pointerEvents = op > 0.5 ? "auto" : "none";
      });
      if (cur) cur.textContent = `0${Math.min(N, Math.max(1, Math.round(af) + 1))}`.slice(-2);
      if (fill) fill.style.width = `${(p * 100).toFixed(2)}%`;
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

  return (
    <div ref={ref} className="bg-[#F5F0E8]">
      {/* One persona owns the screen; scroll cross-fades to the next. */}
      <div ref={trackRef} className="relative h-[600vh]">
        <div className="sticky top-0 flex h-svh flex-col overflow-hidden px-6 py-[9vh] md:px-10 md:py-[11vh] lg:px-[6vw]">
          {/* persistent context — the section thesis stays as the personas change */}
          <div className="flex flex-none items-start justify-between gap-6">
            <div>
              <p className="text-[11px] font-light uppercase tracking-[0.34em] text-[#c9a96e]">Who We Work Best With</p>
              <p className="mt-3 max-w-[30ch] font-serif text-[0.95rem] font-light italic leading-snug text-[#1a1a1a]/50 md:text-[1.25rem]">
                Independent advice is most valuable when the decision is too important to get wrong.
              </p>
            </div>
            <p className="shrink-0 whitespace-nowrap font-serif text-[1rem] tabular-nums text-[#1a1a1a]/30 md:text-[1.25rem]">
              <span ref={curRef} className="font-semibold text-[#1a1a1a]">01</span> / 06
            </p>
          </div>

          {/* the focus area — six personas stacked; only ~one visible at a time */}
          <div className="relative flex-1">
            {audiences.map((a, i) => (
              <div
                key={a.title}
                data-fp
                className="absolute inset-x-0 top-1/2"
                style={{ opacity: i === 0 ? 1 : 0, transform: "translateY(-50%)", willChange: "opacity, transform" }}
              >
                <div className="font-serif text-[1.3rem] leading-none text-[#c9a96e] md:text-[1.8rem]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-4 max-w-[15ch] font-serif text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.015em] text-[#1a1a1a] md:text-[4.2rem] lg:text-[5.2rem]">
                  {a.title}
                </h3>
                <p className="mt-6 max-w-[34ch] text-[1.02rem] font-light leading-relaxed text-[#1a1a1a]/55 md:max-w-[40ch] md:text-[1.35rem]">
                  {a.line}
                </p>
              </div>
            ))}
          </div>

          {/* progress rail */}
          <div className="relative h-0.5 flex-none bg-[#1a1a1a]/10">
            <div ref={fillRef} className="absolute left-0 top-0 h-full w-0 bg-[#c9a96e]" />
          </div>
        </div>
      </div>

      {/* Bottom editorial + CTAs */}
      <div className="px-6 pb-[14vh] pt-[6vh] md:px-8 md:pb-[20vh]">
        <div className="mx-auto max-w-2xl text-center">
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
              onClick={() => openConsult({ sourceKind: "homepage" })}
              className="group inline-flex items-center gap-2 text-[12px] font-light tracking-[0.14em] text-[#1a1a1a]/55 transition-colors duration-300 hover:text-[#1a1a1a]"
            >
              Request Independent Advice
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </button>
          </div>
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
        One way only: a flat fee, paid by you&mdash;the buyer&mdash;to
        represent your interest. After a free first consultation we send a
        quotation tailored to your case, and we begin only once you&rsquo;ve
        agreed to it.
        <br /><br />
        We take no brokerage, referral or promotion money from any developer or
        seller, ever. Our fee doesn&rsquo;t move with the price you pay, so we
        gain only from the right decision for you.
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
    q: "Do you take any money from developers?",
    a: (
      <>
        No&mdash;never. Not a commission, not a referral, not promotion money.
        Our entire revenue is the flat fee you agree to pay us to represent you.
        <br /><br />
        That single line is what lets us sit on your side of the table without a
        conflict. Our recommendation never changes based on who pays what&mdash;because
        only you ever do. If it were otherwise, we would not be worth trusting.
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
  n,
  item,
  isOpen,
  onToggle,
}: {
  n: number;
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
    <div data-r className="border-t border-[#1a1a1a]/10" style={{ opacity: 0, transform: "translateY(16px)" }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-5 py-7 text-left md:gap-8 md:py-8"
      >
        {/* quiet index — turns gold on open (the numbered motif, echoing Decisions/Audience) */}
        <span
          className="font-serif text-[0.85rem] leading-none tabular-nums transition-[color,transform] duration-500 md:text-[1rem]"
          style={{
            color: isOpen ? "#c9a96e" : "rgba(201,169,110,0.5)",
            transform: isOpen ? "scale(1.08)" : "scale(1)",
            transformOrigin: "left center",
          }}
        >
          {String(n).padStart(2, "0")}
        </span>
        <h3
          className="font-serif text-[1.2rem] font-medium leading-[1.3] text-[#1a1a1a] transition-transform duration-500 md:text-[1.5rem] lg:text-[1.7rem]"
          style={{ transform: isOpen ? "translateX(6px)" : "translateX(0)" }}
        >
          {item.q}
        </h3>
        <span
          className="self-center text-[1.3rem] font-light text-[#c9a96e]/60 transition-transform duration-500 md:text-[1.5rem]"
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ height }}
      >
        {/* answer aligns under the question (invisible number-width spacer) with a
           gold left-rule that fades in on open */}
        <div ref={bodyRef} className="grid grid-cols-[auto_1fr] gap-5 pb-8 md:gap-8">
          <span aria-hidden className="invisible font-serif text-[0.85rem] leading-none tabular-nums md:text-[1rem]">00</span>
          <p
            className="max-w-xl border-l-2 pl-5 text-[0.88rem] font-light leading-[1.85] text-[#1a1a1a]/55 transition-colors duration-500 md:text-[0.98rem]"
            style={{ borderColor: isOpen ? "rgba(201,169,110,0.4)" : "transparent" }}
          >
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
  const { openConsult } = useConsultation();
  // Open "How do you make money?" by default — transparency-forward, and it
  // shows the open-state (gold rule, ×) without a click. Found by lookup so it
  // survives reordering; falls back to all-closed.
  const [openIdx, setOpenIdx] = useState<number | null>(() => {
    const i = faqs.findIndex((f) => /how do you make money/i.test(f.q));
    return i >= 0 ? i : null;
  });
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

      {/* Accordion — a numbered register enclosed in hairlines; one open at a time */}
      <div className="mx-auto mt-[8vh] max-w-3xl border-b border-[#1a1a1a]/10 md:mt-[12vh]">
        {faqs.map((item, i) => (
          <FaqItem
            key={item.q}
            n={i + 1}
            item={item}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
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
            onClick={() => openConsult({ sourceKind: "homepage" })}
            className="group inline-flex items-center gap-2 text-[12px] font-light tracking-[0.14em] text-[#1a1a1a]/55 transition-colors duration-300 hover:text-[#1a1a1a]"
          >
            Request Independent Advice
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
  const { openConsult } = useConsultation();

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
            onClick={() => openConsult({ sourceKind: "homepage" })}
            className="text-[12px] font-light tracking-[0.14em] text-white/40 transition-colors duration-300 hover:text-white/65"
          >
            Request Independent Advice &rarr;
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

        {/* Gurugram, in outline — the district silhouette, with the markets we track */}
        <div data-r className="mx-auto mt-10 flex items-center justify-center md:mt-16" style={{ opacity: 0 }}>
          <svg width="170" height="170" viewBox="0 0 200 200" fill="none" className="text-[#c9a96e] md:h-[212px] md:w-[212px]">
            {/* faint echo for depth */}
            <path
              d="M62 24 L86 20 L104 28 L118 10 L146 6 L150 16 L163 30 L158 40 L176 52 L199 74 L196 96 L198 122 L183 130 L168 128 L162 138 L165 150 L186 160 L197 174 L160 176 L143 175 L126 165 L110 162 L104 172 L92 188 L68 188 L46 199 L27 180 L16 156 L7 138 L25 119 L28 90 L18 75 L27 54 L28 36 L44 30 Z"
              stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.12" strokeDasharray="3 6"
              transform="translate(100 100) scale(1.08) translate(-100 -100)"
            />
            {/* the boundary */}
            <path
              d="M62 24 L86 20 L104 28 L118 10 L146 6 L150 16 L163 30 L158 40 L176 52 L199 74 L196 96 L198 122 L183 130 L168 128 L162 138 L165 150 L186 160 L197 174 L160 176 L143 175 L126 165 L110 162 L104 172 L92 188 L68 188 L46 199 L27 180 L16 156 L7 138 L25 119 L28 90 L18 75 L27 54 L28 36 L44 30 Z"
              stroke="currentColor" strokeWidth="1" strokeOpacity="0.55" strokeLinejoin="round"
              fill="currentColor" fillOpacity="0.05"
            />
            {/* the micro-markets we track */}
            <circle cx="150" cy="78" r="1.7" fill="currentColor" opacity="0.5" />
            <circle cx="152" cy="118" r="1.7" fill="currentColor" opacity="0.45" />
            <circle cx="120" cy="150" r="1.7" fill="currentColor" opacity="0.4" />
            <circle cx="118" cy="48" r="1.7" fill="currentColor" opacity="0.4" />
            <circle cx="58" cy="108" r="1.7" fill="currentColor" opacity="0.4" />
            <circle cx="150" cy="166" r="1.7" fill="currentColor" opacity="0.35" />
            {/* the core */}
            <circle cx="104" cy="92" r="2.6" fill="currentColor" opacity="0.85" />
            <circle cx="104" cy="92" r="6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
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
      <CoverageSection />
    </section>
  );
}
