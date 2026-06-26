"use client";

import { useEffect, useRef, useState } from "react";

interface Panel {
  num: string;
  title: string;
  product: string;
  intro: string;
  bullets: string[];
  more: string[];
  cta: string;
}

const panels: Panel[] = [
  {
    num: "01",
    title: "Research Independently",
    product: "Truth Intelligence",
    intro: "For buyers who enjoy doing their own research.",
    bullets: [
      "Read evidence-backed project reports.",
      "Compare opportunities.",
      "Understand risks before investing.",
    ],
    more: [
      "Full due-diligence reports.",
      "Developer track records.",
      "Independent risk scoring.",
      "No sales pressure.",
    ],
    cta: "Explore Reports",
  },
  {
    num: "02",
    title: "Ask Anything",
    product: "TruthGuide",
    intro:
      "For buyers who want clarity without spending hours researching.",
    bullets: [
      "Ask natural questions.",
      "Compare projects.",
      "Understand layouts.",
      "Get instant answers backed by proprietary intelligence.",
    ],
    more: [
      "Unlimited natural questions.",
      "Instant project comparisons.",
      "Evidence-backed answers.",
      "Available the moment you need it.",
    ],
    cta: "Ask TruthGuide",
  },
  {
    num: "03",
    title: "Delegate Everything",
    product: "Truth Private",
    intro: "For buyers who value their time more than the research.",
    bullets: [
      "Share your requirements once.",
      "We investigate.",
      "We shortlist.",
      "We negotiate.",
      "You make one confident decision.",
    ],
    more: [
      "Private buyer representation.",
      "Zero broker spam.",
      "One recommendation.",
      "Dedicated advisory team.",
    ],
    cta: "Start Private Office",
  },
];

const askPrompts = [
  "Should I buy DLF Arbour?",
  "Compare Arbour vs Puri Aravallis.",
  "Is this project overpriced?",
  "What's the biggest risk here?",
];

/* ── Smoothly expanding container (grid 0fr → 1fr trick) ── */
function Expand({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

/* ── Abstract, rotating "ask" preview for TruthGuide ── */
function PromptPreview() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setI((p) => (p + 1) % askPrompts.length);
        setShow(true);
      }, 420);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-8 flex items-center gap-3 border-b border-[#1a1a1a]/12 pb-3">
      <span
        className="font-serif text-[1rem] italic leading-snug text-[#1a1a1a]/55"
        style={{ opacity: show ? 1 : 0, transition: "opacity 0.42s ease" }}
      >
        {askPrompts[i]}
      </span>
      <span
        className="ml-auto h-[1.05rem] w-px bg-[#c9a96e]"
        style={{ animation: "caret-blink 1.1s ease-in-out infinite" }}
      />
    </div>
  );
}

/* ── Inner content shared by both layouts ── */
function PanelBody({
  p,
  idx,
  open,
}: {
  p: Panel;
  idx: number;
  open: boolean;
}) {
  return (
    <>
      <ul className="mt-6 space-y-2.5">
        {p.bullets.map((b) => (
          <li
            key={b}
            className="font-serif text-[1rem] font-light leading-relaxed text-[#1a1a1a]/70"
          >
            {b}
          </li>
        ))}
      </ul>

      <Expand open={open}>
        <div className="pt-7">
          <div className="h-px w-10 bg-[#c9a96e]/35" />
          <ul className="mt-6 space-y-2">
            {p.more.map((m) => (
              <li
                key={m}
                className="text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/55"
              >
                {m}
              </li>
            ))}
          </ul>
          {idx === 1 && <PromptPreview />}
        </div>
      </Expand>

      <div className="mt-9 inline-flex items-center gap-2 text-[0.85rem] font-light tracking-[0.14em] text-[#1a1a1a]/75 transition-colors duration-300 group-hover:text-[#1a1a1a]">
        {p.cta}
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
          &rarr;
        </span>
      </div>
    </>
  );
}

/* ════════ DESKTOP — three side by side, one active at a time ════════ */
function DesktopPanels() {
  const [active, setActive] = useState(1);

  return (
    <div className="mx-auto mt-[13vh] hidden max-w-6xl items-start justify-center gap-10 px-4 md:flex lg:gap-16">
      {panels.map((p, idx) => {
        const isActive = idx === active;
        return (
          <div
            key={p.num}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            onClick={() => setActive(idx)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActive(idx);
              }
            }}
            className={`group flex-1 cursor-pointer text-left outline-none transition-opacity duration-700 ${
              isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
            }`}
            style={{
              maxWidth: "22rem",
              transform: isActive ? "scale(1.04)" : "scale(1)",
              transformOrigin: "top center",
              transition:
                "transform 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.7s ease",
            }}
          >
            <span className="block text-[11px] font-light tracking-[0.5em] text-[#c9a96e]/70">
              {p.num}
            </span>
            <h3 className="mt-5 font-serif text-[1.9rem] font-medium leading-[1.15] text-[#1a1a1a] lg:text-[2.2rem]">
              {p.title}
            </h3>
            <span className="mt-4 block text-[10px] font-light uppercase tracking-[0.42em] text-[#1a1a1a]/40">
              {p.product}
            </span>
            <p className="mt-6 text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/60">
              {p.intro}
            </p>
            <PanelBody p={p} idx={idx} open={isActive} />
          </div>
        );
      })}
    </div>
  );
}

/* ════════ MOBILE — stacked, each expands independently ════════ */
function MobilePanels() {
  const [open, setOpen] = useState<Record<number, boolean>>({ 1: true });

  return (
    <div className="mt-[9vh] flex flex-col gap-[9vh] md:hidden">
      {panels.map((p, idx) => {
        const isOpen = !!open[idx];
        return (
          <div key={p.num} className="group">
            <button
              onClick={() => setOpen((o) => ({ ...o, [idx]: !o[idx] }))}
              className="w-full text-left outline-none"
              aria-expanded={isOpen}
            >
              <span className="block text-[11px] font-light tracking-[0.5em] text-[#c9a96e]/70">
                {p.num}
              </span>
              <h3 className="mt-4 font-serif text-[2rem] font-medium leading-[1.12] text-[#1a1a1a]">
                {p.title}
              </h3>
              <span className="mt-3 block text-[10px] font-light uppercase tracking-[0.42em] text-[#1a1a1a]/40">
                {p.product}
              </span>
              <p className="mt-5 text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/60">
                {p.intro}
              </p>
            </button>
            <PanelBody p={p} idx={idx} open={isOpen} />
          </div>
        );
      })}
    </div>
  );
}

export default function ExperienceSection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );

    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      el.style.transition = "opacity 1.1s ease, transform 1.1s ease";
      obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref}>
      {/* Cinematic transition — dark verdict → warm off-white */}
      <div className="h-[45vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8]" />

      {/* Content */}
      <div
        id="experience"
        className="bg-[#F5F0E8] px-6 pb-[16vh] pt-[9vh] md:px-8 md:pb-[14vh]"
      >
        {/* Title */}
        <div
          data-reveal
          className="mx-auto max-w-3xl text-center"
          style={{ opacity: 0, transform: "translateY(24px)" }}
        >
          <h2 className="font-serif text-[2.8rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[3.6rem] lg:text-[4.2rem]">
            Every Buyer Thinks Differently.
          </h2>
          <p className="mt-7 text-[1.05rem] font-light leading-relaxed tracking-wide text-[#1a1a1a]/50 md:mt-8 md:text-[1.25rem]">
            The same independent intelligence.
            <br />
            Three different ways to experience it.
          </p>
        </div>

        <div data-reveal style={{ opacity: 0, transform: "translateY(24px)" }}>
          <DesktopPanels />
          <MobilePanels />
        </div>
      </div>
    </section>
  );
}
