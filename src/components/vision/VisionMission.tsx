"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { useConsultation } from "../consultation/ConsultationProvider";
import { PRIMARY_CTA } from "@/lib/journey";
import { basePath, homeHref } from "@/lib/site";

/* ── 7 Immutable Truths (The Manifesto) ── */
const MANIFESTO_TRUTHS: { roman: string; truth: string; rationale: string }[] = [
  {
    roman: "I",
    truth: "Brochures are marketing; filings and balance sheets are truth.",
    rationale:
      "Renderings show what a project hopes to be. Statutory RERA disclosures, quarterly progress audits, and audited annual balance sheets show what a project actually is.",
  },
  {
    roman: "II",
    truth: "A delayed home is an expensive tax on a family's future.",
    rationale:
      "Construction slippage is not an administrative inconvenience; it erodes capital, compounds double-rent burdens, and steals years of life. Predicting execution risk is a moral duty.",
  },
  {
    roman: "III",
    truth: "Independence cannot be bought, sponsored, or negotiated.",
    rationale:
      "The moment an advisory platform accepts listing fees, ad revenue, or developer commissions, its loyalty fractures. Our independence is our sovereign asset.",
  },
  {
    roman: "IV",
    truth: "Information asymmetry is the single greatest wealth destroyer in Indian real estate.",
    rationale:
      "When developers hold 100% of the facts and buyers hold marketing gloss, capital is misallocated. Radical transparency levels the table.",
  },
  {
    roman: "V",
    truth: "Technology should clarify complexity, never manufacture illusion.",
    rationale:
      "We build algorithms, data pipelines, and AI to expose ground facts and verify legal health—not to generate superficial engagement or funnel leads.",
  },
  {
    roman: "VI",
    truth: "The homebuyer is our client, never the product.",
    rationale:
      "We do not sell user data, broker leads, or buyer shortlists to builders. Every line of code and research memo is engineered solely to protect the buyer's balance sheet.",
  },
  {
    roman: "VII",
    truth: "Trust is built over decades and tested in every single report.",
    rationale:
      "A reputation for fearless truth takes years of discipline to forge and a single compromised verdict to lose. We will always tell the unvarnished truth, even when it costs us transactions.",
  },
];

/* ── The 5 Mission Pillars ── */
const MISSION_PILLARS: { number: string; title: string; subtitle: string; description: string }[] = [
  {
    number: "01",
    title: "Forensic Ground Intelligence",
    subtitle: "Evidence over hearsay",
    description:
      "We track civil construction pacing, contractor appointments, structural slab velocity, and statutory filings across every single under-construction project. Every claim is cross-verified against municipal and regulatory archives.",
  },
  {
    number: "02",
    title: "Uncompromising Fiduciary Duty",
    subtitle: "Sitting on one side of the table",
    description:
      "Traditional brokers represent the transaction; portals represent listings. Truth Estate acts as an institutional buyer's office—providing independent representation with zero conflict of interest.",
  },
  {
    number: "03",
    title: "Quantitative Risk & Pricing Models",
    subtitle: "Math over emotion",
    description:
      "We replace sales rhetoric with deterministic metrics: the composite Truth Score, execution-adjusted ROI, and corridor-level fair value bands drawn from actual transaction records.",
  },
  {
    number: "04",
    title: "Democratized Institutional Research",
    subtitle: "Bloomberg-grade data for every family",
    description:
      "Institutional private equity funds never buy property without 100-page forensic audits. We believe a family committing their life savings deserves access to that exact same depth of intelligence.",
  },
  {
    number: "05",
    title: "Permanent Accountability Archive",
    subtitle: "Holding the ecosystem to its word",
    description:
      "We maintain an unalterable historical record of developer delivery commitments, litigation records, and financial health—ensuring past execution track records can never be erased by glossy rebranding.",
  },
];

/* ── 10-Year Horizon Milestones ── */
const HORIZON_MILESTONES: { era: string; focus: string; outcome: string }[] = [
  {
    era: "Phase I · The Intelligence Layer",
    focus: "Establishing Ground Truth",
    outcome:
      "Building India's deepest repository of verified project timelines, legal title audits, developer balance sheets, and real-time construction monitoring across prime growth corridors.",
  },
  {
    era: "Phase II · The Fiduciary Office",
    focus: "Full-Spectrum Buyer Protection",
    outcome:
      "Empowering domestic buyers, HNI families, and global NRIs with dedicated private buyer offices that manage everything from unbiased shortlisting to strict contract negotiation and legal conveyance.",
  },
  {
    era: "Phase III · The Institutional Standard",
    focus: "Market-Wide Transparency Transformation",
    outcome:
      "Transforming Indian real estate into a transparent, liquid, and analytically rigorous asset class where capital flows exclusively to developers with proven execution integrity.",
  },
];

export default function VisionMission() {
  const { open } = useJourney();
  const { openConsult } = useConsultation();

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-svh flex-col bg-[#0a0a0a]">
        <nav className="mx-auto max-w-7xl px-6 pt-10 md:px-10 md:pt-14">
          <a href={homeHref}>
            <Logo className="h-9 w-auto opacity-75 md:h-[3rem]" />
          </a>
        </nav>

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
            Vision &amp; Mission · Truth Estate
          </p>

          <h1 className="mt-10 max-w-4xl font-serif text-[2.2rem] font-bold leading-[1.18] text-white md:text-[3.6rem] md:leading-[1.12]">
            To make truth the default currency
            <br className="hidden md:block" /> of Indian real estate.
          </h1>

          <p className="mt-6 max-w-2xl font-serif text-[1.25rem] font-light leading-[1.5] text-white/50 md:text-[1.7rem] md:leading-[1.4]">
            A home is a family&apos;s largest financial commitment and greatest emotional anchor.
            <br className="hidden md:block" /> We exist to ensure it is never negotiated in the dark.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-[0.24em] text-[#c9a96e]/80 md:gap-6">
            <span>Evidence Over Sentiment</span>
            <span className="text-white/20">•</span>
            <span>Fiduciary Over Commission</span>
            <span className="text-white/20">•</span>
            <span>Permanence Over Hype</span>
          </div>
        </div>

        <div className="px-6 pb-12 md:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[0.92rem] font-light leading-[1.9] text-white/35 md:text-[1rem]">
              In a $300-billion industry built on sales brochures and asymmetric information,
              <br />
              we built the sovereign intelligence and fiduciary office for the buyer.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Dark → Ivory transition ─── */}
      <div className="h-[16vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8] md:h-[20vh]" />

      {/* ═══ IVORY BODY ═══ */}
      <div className="bg-[#F5F0E8] text-[#1a1a1a]">
        {/* ─── SECTION 1 · THE MACRO VISION ─── */}
        <section className="px-6 pb-[12vh] pt-[6vh] md:px-12 md:pb-[16vh] md:pt-[8vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              The Macro Vision
            </p>

            <h2 className="mt-8 font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.4rem]">
              From an opaque bazaar to an institutional, evidence-grade asset class.
            </h2>

            <div className="mt-10 space-y-6 text-[0.95rem] font-light leading-[1.9] text-[#1a1a1a]/60 md:text-[1.05rem]">
              <p>
                For over three decades, purchasing property in India has required extraordinary courage.
                Buyers have had to navigate high-stakes commitments using fragmented marketing claims,
                opaque broker incentives, and unverified promises of handover timelines.
              </p>
              <p>
                In equities, debt markets, and venture capital, no institutional allocator invests a single rupee
                without audited balance sheets, forensic due diligence, and legal title certitude.
                Yet Indian families routinely commit their entire life savings with less analytical rigor than they
                apply when purchasing a car.
              </p>
              <p className="font-serif text-[1.15rem] font-normal text-[#1a1a1a]/85">
                Our vision is to fundamentally re-architect this reality.
              </p>
              <p>
                We envision an Indian real estate ecosystem where transparency is statutory, where every development is
                scored on empirical evidence, and where every buyer has institutional-grade intelligence sitting on their
                side of the table before a single cheque is written.
              </p>
            </div>
          </div>
        </section>

        {/* ─── SECTION 2 · THE MISSION ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-4xl">
            <div className="border-t border-[#c9a96e]/25 pt-12 md:pt-16">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
                Our Mission
              </p>

              <h2 className="mt-8 font-serif text-[1.8rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.6rem]">
                Protecting life savings with uncompromising, evidence-first intelligence.
              </h2>

              <p className="mt-6 text-[1.05rem] font-light leading-[1.8] text-[#1a1a1a]/55 md:text-[1.15rem]">
                We exist to provide uncompromising truth, forensic due diligence, and dedicated fiduciary buyer
                representation—empowering individuals, families, and global NRIs to make life&apos;s most consequential property
                decisions with absolute clarity and zero regret.
              </p>

              {/* 5 Mission Pillars Grid */}
              <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-14 md:gap-y-12">
                {MISSION_PILLARS.map((p) => (
                  <div key={p.number} className="relative rounded-sm border border-[#1a1a1a]/8 bg-white/40 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-[#c9a96e]/40 hover:bg-white/70">
                    <span className="font-mono text-[12px] font-semibold text-[#c9a96e]">
                      {p.number}
                    </span>
                    <h3 className="mt-4 font-serif text-[1.2rem] font-semibold text-[#1a1a1a]/85">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-[0.82rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40">
                      {p.subtitle}
                    </p>
                    <p className="mt-4 text-[0.88rem] font-light leading-[1.8] text-[#1a1a1a]/50">
                      {p.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3 · THE 7 IMMUTABLE TRUTHS (THE MANIFESTO) ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              The Manifesto
            </p>

            <h2 className="mt-8 font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.4rem]">
              The 7 Immutable Truths we live by.
            </h2>

            <p className="mt-4 text-[0.92rem] font-light leading-[1.8] text-[#1a1a1a]/45">
              These principles are non-negotiable. They guide every line of code we ship, every audit we publish, and every conversation we have with a buyer.
            </p>

            <div className="mt-14 space-y-0">
              {MANIFESTO_TRUTHS.map((m, i) => (
                <div
                  key={m.roman}
                  className="relative border-b border-[#1a1a1a]/8 py-8 first:border-t"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[14px] font-bold text-[#c9a96e]">
                      {m.roman}.
                    </span>
                    <h3 className="font-serif text-[1.1rem] font-medium leading-[1.4] text-[#1a1a1a]/85 md:text-[1.25rem]">
                      {m.truth}
                    </h3>
                  </div>
                  <p className="mt-3 pl-8 text-[0.88rem] font-light leading-[1.8] text-[#1a1a1a]/50">
                    {m.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 4 · THE 10-YEAR HORIZON ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              The Roadmap
            </p>

            <h2 className="mt-8 font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.4rem]">
              The 10-Year Horizon: Building the Sovereign Infrastructure.
            </h2>

            <div className="mt-14 space-y-8">
              {HORIZON_MILESTONES.map((h, i) => (
                <div key={h.era} className="rounded-sm border border-[#1a1a1a]/8 bg-white/30 p-8">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c9a96e]">
                    {h.era}
                  </p>
                  <h3 className="mt-2 font-serif text-[1.25rem] font-semibold text-[#1a1a1a]/85">
                    {h.focus}
                  </h3>
                  <p className="mt-3 text-[0.9rem] font-light leading-[1.8] text-[#1a1a1a]/55">
                    {h.outcome}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 5 · FOUNDER'S LETTER / CLOSING PLEDGE ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-2xl">
            <div className="border-t border-[#c9a96e]/25 pt-12 md:pt-16">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
                The Commitment
              </p>

              <div className="mt-8 space-y-6 font-serif text-[1.02rem] font-light italic leading-[1.9] text-[#1a1a1a]/60 md:text-[1.12rem]">
                <p>
                  &ldquo;A house is made of brick and mortar, but a home is where children grow up, where parents find peace,
                  and where multiple generations anchor their life&apos;s savings.
                </p>
                <p>
                  When you buy property in India, you are not just investing money—you are investing your future peace of mind.
                  You deserve an advisor who will protect that investment with absolute fidelity, who will tell you when
                  a hyped launch is dangerously overpriced, when an escrow account is underfunded, or when a delivery deadline is a statistical impossibility.
                </p>
                <p>
                  Truth Estate was founded on the conviction that independence is not a marketing positioning—it is a sacred fiduciary duty.
                  We will never compromise our independence, we will never sell our rankings, and we will never stop standing beside the buyer.&rdquo;
                </p>
              </div>

              <div className="mt-8 pt-4">
                <p className="font-serif text-[1.1rem] font-semibold text-[#1a1a1a]">
                  Truth Estate Advisory &amp; Intelligence Desk
                </p>
                <p className="text-[0.82rem] font-light text-[#1a1a1a]/40">
                  Gurugram, Haryana, India
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 6 · FINAL CALL TO ACTION ─── */}
        <section className="px-6 pb-[14vh] md:px-12 md:pb-[18vh]">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-[1.8rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.6rem]">
              Experience property advisory
              <br className="hidden md:block" /> built purely on evidence.
            </h2>

            <p className="mt-4 text-[0.95rem] font-light text-[#1a1a1a]/50">
              Browse our independent project audits or request dedicated fiduciary representation.
            </p>

            <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
              <button
                onClick={() => open()}
                className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-all duration-500 hover:bg-[#238c55]"
              >
                {PRIMARY_CTA}
              </button>
              <button
                onClick={() => openConsult()}
                className="text-[13px] tracking-[0.04em] text-[#1a1a1a]/45 transition-colors duration-500 hover:text-[#1a1a1a]/80"
              >
                Request Private Advisory &rarr;
              </button>
            </div>

            {/* Cross link to About Us */}
            <div className="mt-14 border-t border-[#1a1a1a]/8 pt-8">
              <a
                href={`${basePath}/about`}
                className="text-[0.85rem] font-light text-[#1a1a1a]/45 underline underline-offset-4 transition-colors hover:text-[#1a1a1a]"
              >
                Want to learn about our founding thesis and team? Read About Truth Estate &rarr;
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
