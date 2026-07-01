"use client";

import Logo from "./Logo";
import { useJourney } from "./journey/JourneyProvider";
import { useConsultation } from "./consultation/ConsultationProvider";

const basePath = "/Truth-Estate";

/* ── Column definitions ── */
const columns: {
  label: string;
  featured?: boolean;
  links: { t: string; h: string; action?: "journey" | "consult" | "research" }[];
}[] = [
  {
    label: "Start Here",
    links: [
      { t: "Start Your Journey", h: "#", action: "journey" },
      { t: "The NRI Desk", h: "/nri" },
      { t: "The Record", h: "/the-record" },
      { t: "Truth Intelligence", h: "/intelligence" },
      { t: "Request Independent Advice", h: "#", action: "consult" },
      { t: "Pricing", h: "/pricing" },
    ],
  },
  {
    label: "Research",
    featured: true,
    links: [
      { t: "Our Research Methodology", h: "/methodology" },
      { t: "Data Sources", h: "/data-sources" },
      { t: "Truth Score", h: "/methodology#truth-score" },
      { t: "Match Score", h: "/methodology#match-score" },
      { t: "Research Principles", h: "/methodology#principles" },
      { t: "Editorial Standards", h: "/methodology#editorial" },
      { t: "Coverage", h: "/methodology#coverage" },
    ],
  },
  {
    label: "Intelligence",
    links: [
      { t: "Project Intelligence", h: "/intelligence" },
      { t: "Developer Intelligence", h: "/intelligence" },
      { t: "Location Intelligence", h: "/intelligence" },
      { t: "Compare Intelligence", h: "/intelligence" },
      { t: "Market Intelligence", h: "/intelligence" },
      { t: "Legal Intelligence", h: "/intelligence" },
    ],
  },
  {
    label: "Company",
    links: [
      { t: "About Truth Estate", h: "/about" },
      { t: "Our Mission", h: "/about" },
      { t: "FAQs", h: "/methodology#faq" },
      { t: "Contact", h: "/contact" },
    ],
  },
  {
    label: "Legal",
    links: [
      { t: "Privacy Policy", h: "/privacy" },
      { t: "Terms of Use", h: "/terms" },
      { t: "Disclaimer", h: "/disclaimer" },
    ],
  },
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

/* ── Social icons ── */
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
    </svg>
  );
}

const linkBase =
  "text-left text-[0.82rem] font-light leading-snug transition-all duration-300";
const linkDefault = `${linkBase} text-[#1a1a1a]/45 hover:text-[#1a1a1a] hover:translate-x-px`;
const linkFeatured = `${linkBase} text-[#1a1a1a]/55 hover:text-[#1a1a1a] hover:translate-x-px`;

export default function Footer({
  precededByDark = true,
}: {
  /** When the page ends on a dark section, fade dark→ivory into the footer.
   *  When it ends on ivory (legal, about, pricing…), just breathe with ivory. */
  precededByDark?: boolean;
}) {
  const { open } = useJourney();
  const { openConsult } = useConsultation();

  return (
    <>
      {precededByDark ? (
        <div className="h-[16vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8] md:h-[20vh]" />
      ) : (
        <div className="h-[12vh] bg-[#F5F0E8] md:h-[16vh]" />
      )}

      <footer className="bg-[#F5F0E8] text-[#1a1a1a]">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 pt-[8vh] md:grid-cols-12 md:gap-x-6 md:pt-[10vh]">
            {/* ── Brand column ── */}
            <div className="md:col-span-4 lg:col-span-3">
              <Logo color="#1a1a1a" className="h-11 w-auto md:h-[3.2rem]" />

              <p className="mt-8 font-serif text-[0.95rem] font-light leading-relaxed text-[#1a1a1a]/50 md:text-[1rem]">
                Independent intelligence for
                <br />
                life&apos;s biggest real estate decisions.
              </p>

              <p className="mt-6 max-w-[280px] text-[0.82rem] font-light leading-[1.8] text-[#1a1a1a]/35">
                Truth Estate combines research, technology and independent
                judgement to help buyers make confident property decisions.
              </p>

              {/* Social */}
              <div className="mt-10 flex items-center gap-5">
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="text-[#1a1a1a]/30 transition-colors duration-300 hover:text-[#1a1a1a]/70"
                >
                  <LinkedInIcon />
                </a>
                <a
                  href="#"
                  aria-label="X (Twitter)"
                  className="text-[#1a1a1a]/30 transition-colors duration-300 hover:text-[#1a1a1a]/70"
                >
                  <XIcon />
                </a>
                <span
                  className="flex items-center gap-2 text-[#1a1a1a]/15"
                  aria-label="YouTube — Coming Soon"
                >
                  <YouTubeIcon />
                  <span className="text-[10px] font-light tracking-[0.1em] text-[#1a1a1a]/25">
                    Coming Soon
                  </span>
                </span>
              </div>
            </div>

            {/* ── Nav columns ── */}
            <div className="md:col-span-8 lg:col-span-9">
              <div className="grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-8">
                {columns.map((col) => {
                  const cls = col.featured ? linkFeatured : linkDefault;
                  return (
                    <div key={col.label}>
                      <h3 className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">
                        {col.label}
                      </h3>
                      {col.featured && (
                        <div className="mt-2.5 h-[1.5px] w-5 bg-[#c9a96e]/40" />
                      )}
                      <ul
                        className={`${col.featured ? "mt-4" : "mt-6"} space-y-3.5`}
                      >
                        {col.links.map((l) => (
                          <li key={l.t}>
                            {l.action ? (
                              <button
                                onClick={() => {
                                  if (l.action === "consult")
                                    openConsult({ sourceKind: "homepage" });
                                  else if (l.action === "research")
                                    open("research");
                                  else open();
                                }}
                                className={cls}
                              >
                                {l.t}
                              </button>
                            ) : (
                              <a
                                href={
                                  l.h.startsWith("/")
                                    ? `${basePath}${l.h}`
                                    : l.h
                                }
                                className={`inline-block ${cls}`}
                              >
                                {l.t}
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="mt-[14vh] border-t border-[#1a1a1a]/8 md:mt-[16vh]" />

          {/* ── Bottom bar ── */}
          <div className="flex flex-col items-center gap-4 pb-[6vh] pt-8 md:flex-row md:justify-between">
            <p className="text-[0.72rem] font-light tracking-[0.04em] text-[#1a1a1a]/30">
              &copy; Truth Estate
            </p>
            <p className="text-[0.72rem] font-light tracking-[0.04em] text-[#1a1a1a]/30">
              Designed in India. Built for independent property decisions.
            </p>
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
