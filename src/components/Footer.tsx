"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";

/* ── Gentle eased counter ── */
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
          const dur = 2000;
          let t0: number | null = null;
          const step = (ts: number) => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(eased * end));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 }
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

/* ── Navigation data ── */
const columns: { label: string; links: { t: string; h: string }[] }[] = [
  {
    label: "Products",
    links: [
      { t: "Truth Private", h: "/truth-private" },
      { t: "TruthGuide", h: "/truthguide" },
      { t: "Truth Intelligence", h: "/intelligence" },
      { t: "Project Reports", h: "/reports" },
      { t: "Compare Projects", h: "/compare" },
      { t: "Developer Intelligence", h: "/developers" },
    ],
  },
  {
    label: "Markets",
    links: [
      { t: "Golf Course Road", h: "/markets/golf-course-road" },
      { t: "Golf Course Extension Road", h: "/markets/golf-course-extension-road" },
      { t: "SPR", h: "/markets/spr" },
      { t: "Dwarka Expressway", h: "/markets/dwarka-expressway" },
      { t: "New Gurgaon", h: "/markets/new-gurgaon" },
      { t: "Sohna", h: "/markets/sohna" },
      { t: "NH-8 Corridor", h: "/markets/nh-8-corridor" },
    ],
  },
  {
    label: "Developers",
    links: [
      { t: "DLF", h: "/developers/dlf" },
      { t: "Godrej", h: "/developers/godrej" },
      { t: "M3M", h: "/developers/m3m" },
      { t: "Signature Global", h: "/developers/signature-global" },
      { t: "Smartworld", h: "/developers/smartworld" },
      { t: "Puri", h: "/developers/puri" },
      { t: "Birla Estates", h: "/developers/birla-estates" },
      { t: "Emaar", h: "/developers/emaar" },
      { t: "Conscient", h: "/developers/conscient" },
      { t: "Adani Realty", h: "/developers/adani-realty" },
    ],
  },
  {
    label: "Resources",
    links: [
      { t: "About Truth Estate", h: "/about" },
      { t: "Methodology", h: "/methodology" },
      { t: "Research", h: "/research" },
      { t: "Blog", h: "/blog" },
      { t: "FAQs", h: "/faqs" },
      { t: "Contact", h: "/contact" },
      { t: "Privacy", h: "/privacy" },
      { t: "Terms", h: "/terms" },
    ],
  },
];

const coverage = [
  { value: 100, suffix: "+", label: "Under Construction Projects" },
  { value: 15, suffix: "+", label: "Leading Developers" },
  { value: 7, suffix: "", label: "Premium Micro Markets" },
  { value: 80, suffix: "+", label: "Intelligence Signals" },
];

const whatWeCover: { t: string; h: string }[] = [
  { t: "Luxury Apartments in Gurugram", h: "/luxury-apartments-gurugram" },
  { t: "Real Estate Intelligence", h: "/intelligence" },
  { t: "Project Reviews", h: "/reports" },
  { t: "Developer Track Records", h: "/developers" },
  { t: "Construction Monitoring", h: "/construction-monitoring" },
  { t: "Project Delays", h: "/project-delays" },
  { t: "Legal Due Diligence", h: "/legal-due-diligence" },
  { t: "Price Discovery", h: "/price-discovery" },
  { t: "Investment Analysis", h: "/investment-analysis" },
  { t: "Layout Intelligence", h: "/layout-intelligence" },
  { t: "Luxury Apartments", h: "/luxury-apartments" },
  { t: "Golf Course Road", h: "/markets/golf-course-road" },
  { t: "Golf Course Extension", h: "/markets/golf-course-extension-road" },
  { t: "SPR Corridor", h: "/markets/spr" },
  { t: "Dwarka Expressway", h: "/markets/dwarka-expressway" },
  { t: "New Gurgaon", h: "/markets/new-gurgaon" },
];

const socials = [
  { t: "LinkedIn", h: "#" },
  { t: "YouTube", h: "#" },
  { t: "X", h: "#" },
  { t: "Email", h: "/contact" },
];

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Truth Estate",
  description:
    "Independent real estate intelligence for premium property decisions in Gurugram.",
  areaServed: [
    "Golf Course Road, Gurugram",
    "Golf Course Extension Road, Gurugram",
    "SPR, Gurugram",
    "Dwarka Expressway, Gurugram",
    "New Gurgaon",
    "Sohna",
    "NH-8 Corridor, Gurugram",
  ],
  knowsAbout: [
    "Gurugram Real Estate",
    "Luxury Apartments",
    "Under Construction Projects",
    "Developer Intelligence",
    "Project Intelligence",
    "Construction Monitoring",
    "Price Discovery",
    "Legal Due Diligence",
    "Investment Analysis",
    "Layout Intelligence",
    "Real Estate AI",
  ],
};

export default function Footer() {
  return (
    <>
      {/* Transition out of the dark closing into the warm footer */}
      <div className="h-[16vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8] md:h-[20vh]" />

      <footer className="bg-[#F5F0E8] text-[#1a1a1a]">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          {/* ── Brand ── */}
          <div className="pt-[6vh] md:pt-[8vh]">
            <Logo color="#1a1a1a" className="h-11 w-auto md:h-[3.4rem]" />
            <p className="mt-7 max-w-xs font-serif text-[1rem] font-light leading-relaxed text-[#1a1a1a]/55 md:text-[1.08rem]">
              Independent Real Estate Intelligence
              <br />
              for Premium Property Decisions.
            </p>
          </div>

          {/* ── Columns ── */}
          <nav
            aria-label="Footer"
            className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 md:mt-20 md:grid-cols-4 md:gap-x-10"
          >
            {columns.map((col) => (
              <div key={col.label}>
                <h3 className="text-[10px] font-light uppercase tracking-[0.3em] text-[#c9a96e]">
                  {col.label}
                </h3>
                <ul className="mt-5 space-y-3.5">
                  {col.links.map((l) => (
                    <li key={l.t}>
                      <a
                        href={l.h}
                        className="text-[0.9rem] font-light leading-snug text-[#1a1a1a]/60 transition-colors duration-300 hover:text-[#1a1a1a]"
                      >
                        {l.t}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* ── Coverage strip ── */}
          <section aria-label="Coverage" className="mt-[12vh] md:mt-[14vh]">
            <div className="h-px w-full bg-[#1a1a1a]/10" />

            <p className="mt-10 text-center text-[10px] font-light uppercase tracking-[0.45em] text-[#1a1a1a]/40">
              Currently Covering
            </p>

            <div className="mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
              {coverage.map((c) => (
                <div key={c.label} className="text-center">
                  <div className="font-serif text-[2.3rem] font-light leading-none text-[#1a1a1a] md:text-[2.7rem]">
                    <Counter end={c.value} suffix={c.suffix} />
                  </div>
                  <div className="mx-auto mt-3 max-w-[8rem] text-[10px] font-light uppercase tracking-[0.18em] leading-relaxed text-[#1a1a1a]/45">
                    {c.label}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-11 text-center font-serif text-[1.15rem] font-light leading-relaxed text-[#1a1a1a]/60 md:text-[1.25rem]">
              Built for Gurugram.{" "}
              <span className="italic text-[#1a1a1a]/45">Expanding thoughtfully.</span>
            </p>

            <div className="mt-10 h-px w-full bg-[#1a1a1a]/10" />
          </section>

          {/* ── What We Cover (editorial authority) ── */}
          <section aria-label="What we cover" className="mt-[12vh] text-center md:mt-[14vh]">
            <h2 className="font-serif text-[1.5rem] font-medium text-[#1a1a1a] md:text-[1.9rem]">
              What We Cover
            </h2>
            <div className="mx-auto mt-9 flex max-w-2xl flex-wrap items-center justify-center gap-x-3.5 gap-y-3.5">
              {whatWeCover.map((l, i) => (
                <span key={l.t} className="flex items-center gap-x-3.5">
                  {i > 0 && <span className="text-[#c9a96e]/40">&middot;</span>}
                  <a
                    href={l.h}
                    className="text-[0.85rem] font-light text-[#1a1a1a]/50 transition-colors duration-300 hover:text-[#1a1a1a]"
                  >
                    {l.t}
                  </a>
                </span>
              ))}
            </div>
          </section>

          {/* ── Socials + colophon ── */}
          <div className="mt-[12vh] border-t border-[#1a1a1a]/10 pb-[6vh] pt-10 md:mt-[14vh]">
            <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-7">
                {socials.map((s) => (
                  <a
                    key={s.t}
                    href={s.h}
                    className="text-[0.78rem] font-light tracking-[0.1em] text-[#1a1a1a]/55 transition-colors duration-300 hover:text-[#1a1a1a]"
                  >
                    {s.t}
                  </a>
                ))}
              </div>

              <div className="text-center md:text-right">
                <p className="text-[0.76rem] font-light leading-relaxed text-[#1a1a1a]/40">
                  Built in India. Designed for independent property decisions.
                </p>
                <p className="mt-1 text-[0.76rem] font-light tracking-[0.04em] text-[#1a1a1a]/55">
                  &copy; Truth Estate
                </p>
              </div>
            </div>
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </footer>
    </>
  );
}
