"use client";

import Logo from "./Logo";
import { useJourney } from "./journey/JourneyProvider";
import { useConsultation } from "./consultation/ConsultationProvider";

/* ── Navigation columns ── */
const columns: { label: string; links: { t: string; h: string; action?: boolean }[] }[] = [
  {
    label: "Ways We Help",
    links: [
      { t: "Start Your Journey", h: "#", action: true },
      { t: "TruthGuide", h: "/truthguide" },
      { t: "Truth Intelligence", h: "/intelligence" },
      { t: "Request Independent Advice", h: "#", action: true },
    ],
  },
  {
    label: "Knowledge",
    links: [
      { t: "Project Intelligence", h: "/intelligence/projects" },
      { t: "Developer Intelligence", h: "/intelligence/developers" },
      { t: "Location Intelligence", h: "/intelligence/locations" },
      { t: "Price Intelligence", h: "/intelligence/pricing" },
      { t: "Investment Guides", h: "/guides" },
      { t: "Research", h: "/research" },
      { t: "Methodology", h: "/methodology" },
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
    ],
  },
  {
    label: "Developers",
    links: [
      { t: "DLF", h: "/developers/dlf" },
      { t: "Godrej", h: "/developers/godrej" },
      { t: "M3M", h: "/developers/m3m" },
      { t: "Puri", h: "/developers/puri" },
      { t: "Signature Global", h: "/developers/signature-global" },
      { t: "Smartworld", h: "/developers/smartworld" },
      { t: "Birla Estates", h: "/developers/birla-estates" },
      { t: "Emaar", h: "/developers/emaar" },
    ],
  },
  {
    label: "Company",
    links: [
      { t: "About", h: "/about" },
      { t: "FAQs", h: "/faqs" },
      { t: "Privacy", h: "/privacy" },
      { t: "Terms", h: "/terms" },
      { t: "Contact", h: "/contact" },
      { t: "LinkedIn", h: "#" },
    ],
  },
];

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Truth Estate",
  description:
    "Independent real estate representation for premium property decisions in Gurugram.",
  areaServed: [
    "Golf Course Road, Gurugram",
    "Golf Course Extension Road, Gurugram",
    "SPR, Gurugram",
    "Dwarka Expressway, Gurugram",
    "New Gurgaon",
    "Sohna",
  ],
  knowsAbout: [
    "Gurugram Real Estate",
    "Luxury Apartments",
    "Independent Buyer Representation",
    "Developer Intelligence",
    "Project Intelligence",
    "Price Discovery",
    "Legal Due Diligence",
    "Investment Analysis",
    "Real Estate AI",
  ],
};

export default function Footer() {
  const { open } = useJourney();
  const { openConsult } = useConsultation();

  return (
    <>
      <div className="h-[16vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8] md:h-[20vh]" />

      <footer className="bg-[#F5F0E8] text-[#1a1a1a]">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          {/* ── Brand ── */}
          <div className="pt-[6vh] md:pt-[8vh]">
            <Logo color="#1a1a1a" className="h-11 w-auto md:h-[3.4rem]" />
            <p className="mt-7 max-w-sm font-serif text-[1rem] font-light leading-relaxed text-[#1a1a1a]/50 md:text-[1.08rem]">
              Independent representation for
              <br />
              life&apos;s biggest real estate decisions.
            </p>
          </div>

          {/* ── Columns ── */}
          <nav
            aria-label="Footer"
            className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 md:mt-20 md:grid-cols-5 md:gap-x-8"
          >
            {columns.map((col) => (
              <div key={col.label}>
                <h3 className="text-[10px] font-light uppercase tracking-[0.3em] text-[#c9a96e]">
                  {col.label}
                </h3>
                <ul className="mt-5 space-y-3.5">
                  {col.links.map((l) => (
                    <li key={l.t}>
                      {l.action ? (
                        <button
                          onClick={() => (l.t === "Request Independent Advice" ? openConsult({ sourceKind: "homepage" }) : open())}
                          className="text-[0.9rem] font-light leading-snug text-[#1a1a1a]/60 transition-colors duration-300 hover:text-[#1a1a1a]"
                        >
                          {l.t}
                        </button>
                      ) : (
                        <a
                          href={l.h}
                          className="text-[0.9rem] font-light leading-snug text-[#1a1a1a]/60 transition-colors duration-300 hover:text-[#1a1a1a]"
                        >
                          {l.t}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* ── Colophon ── */}
          <div className="mt-[12vh] border-t border-[#1a1a1a]/10 pb-[6vh] pt-10 md:mt-[14vh]">
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <p className="text-[0.76rem] font-light leading-relaxed text-[#1a1a1a]/40">
                Designed in India. Built for independent property decisions.
              </p>
              <p className="text-[0.76rem] font-light tracking-[0.04em] text-[#1a1a1a]/40">
                &copy; Truth Estate
              </p>
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
