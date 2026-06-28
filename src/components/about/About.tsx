"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { PRIMARY_CTA } from "@/lib/journey";

const basePath = "/Truth-Estate";

/* ── Beliefs data ── */
const BELIEFS: { principle: string; detail: string }[] = [
  {
    principle: "Evidence before opinion.",
    detail:
      "Every recommendation we make begins with verifiable evidence, not market sentiment or intuition.",
  },
  {
    principle: "Research before recommendations.",
    detail:
      "We complete our research before forming a view. The conclusion follows the evidence, not the other way around.",
  },
  {
    principle: "Questions before conclusions.",
    detail:
      "We interrogate assumptions — our own included — before presenting any recommendation to a buyer.",
  },
  {
    principle: "Technology strengthens judgement.",
    detail:
      "We use AI and data science to accelerate research, not to replace the independent thinking that makes research valuable.",
  },
  {
    principle: "Transparency creates trust.",
    detail:
      "We show our reasoning, not just our conclusions. Buyers deserve to understand how we arrived at every recommendation.",
  },
  {
    principle: "Long-term credibility matters more than short-term attention.",
    detail:
      "We measure success by whether buyers trust us enough to return, not by how many transactions we facilitate.",
  },
];

/* ── Process steps ── */
const PROCESS: { stage: string; detail: string }[] = [
  {
    stage: "Evidence",
    detail:
      "We begin by gathering verifiable data from regulatory filings, financial disclosures, legal records and market sources.",
  },
  {
    stage: "Research",
    detail:
      "Evidence is structured, cross-referenced and analysed to identify patterns, risks and opportunities that isolated data points cannot reveal.",
  },
  {
    stage: "Interpretation",
    detail:
      "Research findings are interpreted within context — market conditions, regulatory environment, developer history and buyer-specific requirements.",
  },
  {
    stage: "Human Judgement",
    detail:
      "AI accelerates research. It does not replace the independent thinking required to weigh competing considerations and arrive at a considered view.",
  },
  {
    stage: "Recommendation",
    detail:
      "Only after evidence, research, interpretation and judgement converge do we present a recommendation — with full reasoning attached.",
  },
];

/* ── Pillars ── */
const PILLARS: { name: string; detail: string }[] = [
  {
    name: "Truth Intelligence",
    detail:
      "Independent research for every project, developer and market we cover. Published with full reasoning so buyers can evaluate the evidence themselves.",
  },
  {
    name: "TruthGuide",
    detail:
      "An AI research assistant designed to explain rather than persuade. Ask it anything about a project, a market or a developer — it will show you the evidence behind every answer.",
  },
  {
    name: "Private Office",
    detail:
      "Independent buyer representation from discovery to decision. A dedicated advisory relationship for buyers making significant property commitments.",
  },
  {
    name: "Match Intelligence",
    detail:
      "Recommendations personalised to each buyer's priorities, constraints and risk tolerance — rather than one answer optimised for the widest audience.",
  },
];

/* ── Anti-commitments ── */
const NEVERS = [
  "We will never sell rankings.",
  "We will never publish sponsored recommendations.",
  "We will never recommend every project to every buyer.",
  "We will never optimise transactions at the cost of trust.",
  "We will never stop questioning our own conclusions.",
];

/* ── Traditional system roles ── */
const SYSTEM_ROLES: { role: string; represents: string }[] = [
  { role: "Developer", represents: "Represents the project." },
  { role: "Broker", represents: "Represents the transaction." },
  { role: "Portal", represents: "Represents listings." },
  { role: "Marketing", represents: "Represents the brand." },
];

export default function About() {
  const { open } = useJourney();

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-svh flex-col bg-[#0a0a0a]">
        <nav className="px-6 pt-10 md:px-12 md:pt-14">
          <a href={basePath}>
            <Logo className="h-9 w-auto opacity-75 md:h-[3rem]" />
          </a>
        </nav>

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
            About Truth Estate
          </p>

          <h1 className="mt-10 max-w-3xl font-serif text-[2rem] font-bold leading-[1.2] text-white md:text-[3.2rem] md:leading-[1.15]">
            We didn&apos;t build another
            <br className="hidden md:block" /> property portal.
          </h1>

          <p className="mt-6 max-w-2xl font-serif text-[1.3rem] font-light leading-[1.5] text-white/50 md:text-[1.8rem] md:leading-[1.4]">
            We built the buyer&apos;s office
            <br className="hidden md:block" /> the industry never had.
          </p>
        </div>

        <div className="px-6 pb-12 md:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[0.92rem] font-light leading-[1.9] text-white/35 md:text-[1rem]">
              Every property transaction has someone representing the seller.
              <br />
              But who represents the buyer?
            </p>
          </div>
        </div>
      </section>

      {/* ─── Dark → Ivory transition ─── */}
      <div className="h-[16vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8] md:h-[20vh]" />

      {/* ═══ IVORY BODY ═══ */}
      <div className="bg-[#F5F0E8] text-[#1a1a1a]">
        {/* ─── SECTION 1 · THE PROBLEM ─── */}
        <section className="px-6 pb-[12vh] pt-[6vh] md:px-12 md:pb-[16vh] md:pt-[8vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              The Problem
            </p>

            <h2 className="mt-8 font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.4rem]">
              Buying property shouldn&apos;t require blind trust.
            </h2>

            <div className="mt-10 space-y-6 text-[0.95rem] font-light leading-[1.9] text-[#1a1a1a]/55 md:text-[1.05rem]">
              <p>
                Buying a home is one of the largest financial decisions most
                people will ever make. Yet buyers often navigate that decision
                using fragmented information, marketing material and conflicting
                opinions.
              </p>
              <p>
                The challenge isn&apos;t a lack of information.
                <br />
                It&apos;s a lack of independent judgement.
              </p>
              <p>This is the problem Truth Estate exists to solve.</p>
            </div>
          </div>
        </section>

        {/* ─── SECTION 2 · THE BROKEN SYSTEM ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              The Broken System
            </p>

            <h2 className="mt-8 font-serif text-[1.5rem] font-semibold leading-[1.25] text-[#1a1a1a]/30 md:text-[1.8rem]">
              Traditional Real Estate
            </h2>

            <div className="mt-12 space-y-0">
              {SYSTEM_ROLES.map((r, i) => (
                <div key={r.role} className="relative py-6">
                  {i < SYSTEM_ROLES.length - 1 && (
                    <div className="absolute bottom-0 left-0 right-0 border-b border-[#1a1a1a]/6" />
                  )}
                  <p className="font-serif text-[1.1rem] font-medium text-[#1a1a1a]/70 md:text-[1.2rem]">
                    {r.role}
                  </p>
                  <p className="mt-1 text-[0.88rem] font-light text-[#1a1a1a]/40">
                    {r.represents}
                  </p>
                </div>
              ))}
            </div>

            {/* The dramatic pause */}
            <div className="pb-[6vh] pt-[10vh] md:pb-[8vh] md:pt-[14vh]">
              <h2 className="font-serif text-[1.8rem] font-semibold leading-[1.2] text-[#1a1a1a] md:text-[2.6rem]">
                Who represents the buyer?
              </h2>
            </div>

            {/* The reveal */}
            <div className="border-t border-[#c9a96e]/20 pt-10">
              <p className="font-serif text-[1.5rem] font-semibold text-[#1a1a1a] md:text-[2rem]">
                Truth Estate.
              </p>
              <p className="mt-3 text-[0.95rem] font-light tracking-[0.02em] text-[#1a1a1a]/45 md:text-[1.05rem]">
                Independent Buyer Representation.
              </p>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3 · OUR BELIEFS ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-4xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              Our Beliefs
            </p>

            <h2 className="mt-8 font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.4rem]">
              Everything begins with first principles.
            </h2>

            <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-12 md:grid-cols-2">
              {BELIEFS.map((b) => (
                <div key={b.principle}>
                  <p className="font-serif text-[1.05rem] font-medium leading-[1.4] text-[#1a1a1a]/80 md:text-[1.1rem]">
                    {b.principle}
                  </p>
                  <p className="mt-3 text-[0.88rem] font-light leading-[1.8] text-[#1a1a1a]/40">
                    {b.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 4 · HOW WE THINK ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              How We Think
            </p>

            <h2 className="mt-8 font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.4rem]">
              Independent thinking follows a process.
            </h2>

            <div className="mt-14">
              {PROCESS.map((step, i) => (
                <div key={step.stage} className="relative flex gap-6 md:gap-8">
                  {/* Vertical connector */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/25 md:h-9 md:w-9">
                      <span className="text-[11px] font-medium text-[#c9a96e]">
                        {i + 1}
                      </span>
                    </div>
                    {i < PROCESS.length - 1 && (
                      <div className="w-px flex-1 bg-[#c9a96e]/12" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-12">
                    <p className="font-serif text-[1.1rem] font-medium text-[#1a1a1a]/80 md:text-[1.2rem]">
                      {step.stage}
                    </p>
                    <p className="mt-3 text-[0.88rem] font-light leading-[1.8] text-[#1a1a1a]/40">
                      {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 border-t border-[#1a1a1a]/6 pt-8 text-[0.92rem] font-light italic leading-[1.8] text-[#1a1a1a]/35">
              AI accelerates research. It does not replace the independent
              judgement required to weigh competing evidence and arrive at a
              considered recommendation.
            </p>
          </div>
        </section>

        {/* ─── SECTION 5 · WHAT WE BUILD ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-4xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              What We Build
            </p>

            <h2 className="mt-8 font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.4rem]">
              Independent intelligence for every property decision.
            </h2>

            <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-x-16 md:gap-y-14">
              {PILLARS.map((p) => (
                <div key={p.name}>
                  <h3 className="font-serif text-[1.1rem] font-semibold text-[#1a1a1a]/80 md:text-[1.2rem]">
                    {p.name}
                  </h3>
                  <p className="mt-4 text-[0.88rem] font-light leading-[1.8] text-[#1a1a1a]/40">
                    {p.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 6 · WHAT WE WILL NEVER BECOME ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              What We Will Never Become
            </p>

            <h2 className="mt-8 font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.4rem]">
              Trust is built by what you refuse to do.
            </h2>

            <div className="mt-14 space-y-0">
              {NEVERS.map((n, i) => (
                <div
                  key={i}
                  className="border-b border-[#1a1a1a]/6 py-6 last:border-b-0"
                >
                  <p className="font-serif text-[1rem] font-medium leading-[1.5] text-[#1a1a1a]/65 md:text-[1.1rem]">
                    {n}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16">
              <p className="font-serif text-[1.2rem] font-medium leading-[1.5] text-[#1a1a1a]/80 md:text-[1.4rem]">
                Independence is not a feature.
              </p>
              <p className="mt-2 font-serif text-[1.2rem] font-light leading-[1.5] text-[#1a1a1a]/45 md:text-[1.4rem]">
                It is our responsibility.
              </p>
            </div>
          </div>
        </section>

        {/* ─── SECTION 7 · THE FUTURE ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              The Future
            </p>

            <h2 className="mt-8 font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.4rem]">
              The future we&apos;re building.
            </h2>

            <div className="mt-10 space-y-6 text-[0.95rem] font-light leading-[1.9] text-[#1a1a1a]/55 md:text-[1.05rem]">
              <p>
                Imagine a future where every buyer has access to the same level
                of independent research that institutional investors expect before
                making major investment decisions.
              </p>
              <p>
                A future where confidence comes from evidence rather than
                persuasion.
              </p>
              <p>That&apos;s the future we&apos;re building.</p>
            </div>
          </div>
        </section>

        {/* ─── SECTION 8 · A LETTER TO BUYERS ─── */}
        <section className="px-6 pb-[12vh] md:px-12 md:pb-[16vh]">
          <div className="mx-auto max-w-2xl">
            <div className="border-t border-[#c9a96e]/20 pt-12">
              <div className="space-y-6 font-serif text-[1rem] font-light italic leading-[1.9] text-[#1a1a1a]/50 md:text-[1.1rem]">
                <p>
                  Thank you for considering Truth Estate for one of the most
                  important decisions of your life.
                </p>
                <p>
                  We understand the weight of what you&apos;re deciding. A home
                  is not just a transaction — it is where your life will unfold.
                  The school your children attend. The commute you make every
                  morning. The view you wake up to.
                </p>
                <p>
                  We promise that every recommendation we make will begin with
                  evidence, not opinion. That we will question our own
                  conclusions before presenting them to you. That your trust will
                  always matter more to us than any transaction.
                </p>
                <p>
                  This is the standard we hold ourselves to. Not because it is
                  good business — but because it is the right way to advise
                  someone about a decision this significant.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="px-6 pb-[14vh] md:px-12 md:pb-[18vh]">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.6rem]">
              Life&apos;s biggest decisions deserve
              <br className="hidden md:block" /> independent judgement.
            </h2>

            <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
              <button
                onClick={() => open()}
                className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-all duration-500 hover:bg-[#238c55]"
              >
                {PRIMARY_CTA}
              </button>
              <button
                onClick={() => open("research")}
                className="text-[13px] tracking-[0.04em] text-[#1a1a1a]/45 transition-colors duration-500 hover:text-[#1a1a1a]/80"
              >
                Challenge TruthGuide &rarr;
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
