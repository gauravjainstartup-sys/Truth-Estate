"use client";

import { useState } from "react";
import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { useConsultation } from "../consultation/ConsultationProvider";
import { PRIMARY_CTA } from "@/lib/journey";

const basePath = "/Truth-Estate";

/* ── Engagement models ── */
const MODELS: {
  name: string;
  recommended?: boolean;
  who: string;
  features: string[];
  cta: string;
  action: "intelligence" | "journey" | "consult";
}[] = [
  {
    name: "Truth Intelligence",
    who: "You’re researching projects and want independent intelligence before speaking to anyone.",
    features: [
      "Project Intelligence",
      "Developer Intelligence",
      "Location Intelligence",
      "Compare Intelligence",
      "TruthGuide",
      "Executive Summaries",
      "Universal Truth Score",
    ],
    cta: "Explore Intelligence",
    action: "intelligence",
  },
  {
    name: "Private Office",
    recommended: true,
    who: "You’re actively evaluating properties and want a dedicated decision workspace.",
    features: [
      "Personal Match Score",
      "Multiple Buyer Briefs",
      "Project Shortlists",
      "TruthGuide with context",
      "Research Workspace",
      "Documents",
      "Advisor Collaboration",
      "Complimentary First Consultation",
    ],
    cta: PRIMARY_CTA,
    action: "journey",
  },
  {
    name: "Independent Representation",
    who: "You want an independent advisor representing your interests throughout the buying journey.",
    features: [
      "Property Strategy",
      "Project Shortlisting",
      "Independent Evaluation",
      "Legal Coordination",
      "Negotiation Support",
      "Documentation Guidance",
      "Decision Workshops",
      "Personal Advisory",
    ],
    cta: "Request Independent Advice",
    action: "consult",
  },
];

/* ── Buyer journey flow ── */
const FLOW = [
  { step: "Discover", detail: "Browse independent project and market intelligence." },
  { step: "Research", detail: "Explore detailed analysis, Truth Scores, and TruthGuide." },
  { step: "Compare", detail: "Evaluate projects side by side against your priorities." },
  { step: "Create Private Office", detail: "Build your personal decision workspace." },
  { step: "Complimentary Consultation", detail: "One independent conversation to discuss your goals." },
  { step: "Independent Representation", detail: "Dedicated advisory from discovery to decision, if you choose." },
];

/* ── FAQs ── */
const FAQS = [
  {
    q: "Can developers influence Truth Estate’s recommendations?",
    a: "No. Truth Estate operates independently. We are not affiliated with, sponsored by, or compensated by any developer, broker, or financial institution. Our recommendations are based entirely on independent research and evidence.",
  },
  {
    q: "How does the complimentary consultation work?",
    a: "Your first consultation is a focused conversation about your property goals, timeline, and priorities. We’ll review any opportunities you’re considering and share our independent perspective. There is no sales pressure and no obligation to continue.",
  },
  {
    q: "Do I need a Private Office?",
    a: "Not necessarily. Many buyers find that Truth Intelligence provides everything they need to research independently. Private Office is designed for buyers actively evaluating multiple properties who want a structured workspace to organise their research, comparisons, and decisions.",
  },
  {
    q: "Can I create multiple Buyer Briefs?",
    a: "Yes. Private Office supports multiple Buyer Briefs, each with different priorities, budgets, and location preferences. This is particularly useful for buyers evaluating properties for different purposes — such as a primary residence and an investment property.",
  },
  {
    q: "Can I upgrade later?",
    a: "Absolutely. Most buyers begin with Truth Intelligence, explore the research, and then decide whether Private Office or Independent Representation would add value. There is no pressure to upgrade at any point.",
  },
  {
    q: "Who is Independent Representation for?",
    a: "Independent Representation is for buyers who want a dedicated advisor throughout their entire property journey. It is particularly valuable for NRI buyers, first-time luxury buyers, or anyone making a significant property commitment who wants independent counsel at every stage.",
  },
  {
    q: "How are recommendations personalised?",
    a: "Every recommendation begins with your Buyer Brief — your priorities, constraints, timeline, and risk tolerance. Our Match Score evaluates every project against your specific profile rather than providing a generic rating. No two buyers receive the same shortlist.",
  },
];

/* ── Anti-statements ── */
const NOT_PAYING = [
  "You are not paying for advertisements.",
  "You are not paying for sponsored rankings.",
  "You are not paying for broker commissions.",
];

export default function Pricing() {
  const { open } = useJourney();
  const { openConsult } = useConsultation();
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  const toggleFaq = (i: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleAction = (action: "intelligence" | "journey" | "consult") => {
    if (action === "intelligence") window.location.href = `${basePath}/intelligence`;
    else if (action === "journey") open();
    else openConsult({ sourceKind: "homepage" });
  };

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
            How We Work Together
          </p>

          <h1 className="mt-10 max-w-3xl font-serif text-[1.9rem] font-bold leading-[1.2] text-white md:text-[3rem] md:leading-[1.15]">
            Choose how you&apos;d like Truth Estate
            <br className="hidden md:block" /> to support your decision.
          </h1>

          <div className="mt-10 max-w-xl space-y-3 text-[0.92rem] font-light leading-[1.85] text-white/35 md:text-[1rem]">
            <p>Every buyer&apos;s journey is different.</p>
            <p>
              Some need independent intelligence. Some need a structured
              decision workspace. Some want an independent advisor beside them
              from discovery to decision.
            </p>
            <p>Truth Estate supports all three.</p>
          </div>
        </div>

        <div className="pb-12 text-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="mx-auto h-6 w-6 animate-bounce text-white/15"
          >
            <path d="M12 5v14m0 0l-5-5m5 5l5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* Dark → Ivory */}
      <div className="h-[16vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8] md:h-[20vh]" />

      {/* ═══ IVORY BODY ═══ */}
      <div className="bg-[#F5F0E8] text-[#1a1a1a]">
        {/* ── SECTION 1 · ENGAGEMENT MODELS ── */}
        <section className="px-6 pb-[10vh] pt-[4vh] md:px-12 md:pb-[14vh] md:pt-[6vh]">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              Choose Your Level of Support
            </p>
            <h2 className="mt-6 text-center font-serif text-[1.6rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.2rem]">
              Three ways to work with Truth Estate.
            </h2>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
              {MODELS.map((m) => (
                <div
                  key={m.name}
                  className={`flex flex-col rounded-sm p-8 md:p-7 lg:p-9 ${
                    m.recommended
                      ? "border border-[#c9a96e]/20 bg-white shadow-sm"
                      : "border border-[#1a1a1a]/6 bg-[#F5F0E8]"
                  }`}
                >
                  {m.recommended && (
                    <span className="mb-4 self-start text-[10px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">
                      Recommended
                    </span>
                  )}
                  <h3 className="font-serif text-[1.3rem] font-semibold text-[#1a1a1a] md:text-[1.4rem]">
                    {m.name}
                  </h3>

                  <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/25">
                    Who it&apos;s for
                  </p>
                  <p className="mt-2 text-[0.88rem] font-light leading-[1.7] text-[#1a1a1a]/50">
                    {m.who}
                  </p>

                  <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/25">
                    What you&apos;ll experience
                  </p>
                  <ul className="mt-3 flex-1 space-y-2">
                    {m.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-[0.84rem] font-light text-[#1a1a1a]/50">
                        <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-[#c9a96e]/40" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleAction(m.action)}
                    className={`mt-8 w-full rounded-sm py-3.5 text-[13px] font-medium tracking-[0.06em] transition-all duration-500 ${
                      m.recommended
                        ? "bg-[#1e6b45] text-white shadow-sm hover:bg-[#238c55]"
                        : "border border-[#1a1a1a]/10 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/20 hover:text-[#1a1a1a]/80"
                    }`}
                  >
                    {m.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 2 · BUYER JOURNEY FLOW ── */}
        <section className="px-6 pb-[10vh] md:px-12 md:pb-[14vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              How Buyers Typically Work With Us
            </p>
            <h2 className="mt-6 font-serif text-[1.6rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.2rem]">
              A natural progression, not a sales funnel.
            </h2>
            <p className="mt-5 text-[0.92rem] font-light leading-[1.8] text-[#1a1a1a]/40">
              Most buyers move through these stages at their own pace. Not
              everyone needs every stage, and there is no pressure to progress
              beyond the level of support that feels right.
            </p>

            <div className="mt-14">
              {FLOW.map((f, i) => (
                <div key={f.step} className="relative flex gap-6 md:gap-8">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/25 md:h-9 md:w-9">
                      <span className="text-[11px] font-medium text-[#c9a96e]">
                        {i + 1}
                      </span>
                    </div>
                    {i < FLOW.length - 1 && (
                      <div className="w-px flex-1 bg-[#c9a96e]/12" />
                    )}
                  </div>
                  <div className="pb-10">
                    <p className="font-serif text-[1.05rem] font-medium text-[#1a1a1a]/75 md:text-[1.15rem]">
                      {f.step}
                    </p>
                    <p className="mt-2 text-[0.85rem] font-light leading-[1.7] text-[#1a1a1a]/35">
                      {f.detail}
                    </p>
                    {i === FLOW.length - 1 && (
                      <p className="mt-2 text-[0.78rem] font-light italic text-[#1a1a1a]/25">
                        Optional — only if you decide additional support would
                        add value.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 3 · WHAT MAKES PRIVATE OFFICE DIFFERENT ── */}
        <section className="px-6 pb-[10vh] md:px-12 md:pb-[14vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              What Makes Private Office Different
            </p>
            <h2 className="mt-6 font-serif text-[1.6rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.2rem]">
              Buying property isn&apos;t one decision.
            </h2>

            <div className="mt-8 space-y-5 text-[0.92rem] font-light leading-[1.85] text-[#1a1a1a]/50 md:text-[1rem]">
              <p>
                It&apos;s dozens of connected decisions over weeks or months.
                Which locations. Which developers. Which floor plans. What
                price is fair. What risks matter. What the legal position
                looks like. How one project compares to another.
              </p>
              <p>
                Private Office becomes the place where every comparison,
                question, document and recommendation lives — a single
                decision workspace designed around you.
              </p>
            </div>

            <div className="mt-12 border-t border-[#c9a96e]/15 pt-10">
              <p className="font-serif text-[1.3rem] font-semibold text-[#1a1a1a]/80 md:text-[1.5rem]">
                Your Buyer&apos;s Office.
              </p>
              <p className="mt-2 text-[0.92rem] font-light text-[#1a1a1a]/35">
                Not another dashboard.
              </p>

              <button
                onClick={() => open()}
                className="mt-8 rounded-sm bg-[#1e6b45] px-10 py-3.5 text-[13px] font-medium tracking-[0.06em] text-white shadow-sm transition-all duration-500 hover:bg-[#238c55]"
              >
                {PRIMARY_CTA}
              </button>
            </div>
          </div>
        </section>

        {/* ── SECTION 4 · COMPLIMENTARY CONSULTATION ── */}
        <section className="px-6 pb-[10vh] md:px-12 md:pb-[14vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              Our First Conversation Is on Us
            </p>
            <h2 className="mt-6 font-serif text-[1.6rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.2rem]">
              Every important decision deserves
              <br className="hidden md:block" /> one independent conversation.
            </h2>

            <div className="mt-8 space-y-5 text-[0.92rem] font-light leading-[1.85] text-[#1a1a1a]/50 md:text-[1rem]">
              <p>Your first consultation is complimentary.</p>
              <p>
                We&apos;ll understand your goals. Review your shortlisted
                opportunities. Answer your questions. Help you decide whether
                additional support would genuinely add value.
              </p>
              <p>No sales pressure. No obligations.</p>
            </div>

            <button
              onClick={() => openConsult({ sourceKind: "homepage" })}
              className="mt-10 rounded-sm bg-[#1e6b45] px-10 py-3.5 text-[13px] font-medium tracking-[0.06em] text-white shadow-sm transition-all duration-500 hover:bg-[#238c55]"
            >
              Request My Complimentary Consultation
            </button>
          </div>
        </section>

        {/* ── SECTION 5 · PRICING ── */}
        <section className="px-6 pb-[10vh] md:px-12 md:pb-[14vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              Pricing
            </p>
            <h2 className="mt-6 font-serif text-[1.6rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.2rem]">
              Transparent engagement, transparent pricing.
            </h2>

            <div className="mt-12 space-y-0">
              {/* Truth Intelligence */}
              <div className="border-b border-[#1a1a1a]/6 py-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <h3 className="font-serif text-[1.1rem] font-semibold text-[#1a1a1a]/75">
                      Truth Intelligence
                    </h3>
                    <p className="mt-2 text-[0.85rem] font-light text-[#1a1a1a]/35">
                      Published research and TruthGuide are accessible to
                      every buyer. Premium intelligence features require a
                      subscription.
                    </p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <p className="font-serif text-[1.1rem] font-medium text-[#1a1a1a]/60">
                      Free to explore
                    </p>
                    <p className="mt-1 text-[0.78rem] font-light text-[#1a1a1a]/25">
                      Premium features coming soon
                    </p>
                  </div>
                </div>
              </div>

              {/* Private Office */}
              <div className="border-b border-[#1a1a1a]/6 py-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <h3 className="font-serif text-[1.1rem] font-semibold text-[#1a1a1a]/75">
                      Private Office
                    </h3>
                    <p className="mt-2 text-[0.85rem] font-light text-[#1a1a1a]/35">
                      A dedicated decision workspace with personal Match
                      Scores, Buyer Briefs, and advisor collaboration.
                      Includes complimentary first consultation.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-sm border border-[#c9a96e]/15 bg-[#c9a96e]/5 px-4 py-2 sm:text-right">
                    <p className="text-[0.78rem] font-light text-[#c9a96e]/60">
                      Pricing to be announced
                    </p>
                  </div>
                </div>
              </div>

              {/* Independent Representation */}
              <div className="py-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <h3 className="font-serif text-[1.1rem] font-semibold text-[#1a1a1a]/75">
                      Independent Representation
                    </h3>
                    <p className="mt-2 text-[0.85rem] font-light text-[#1a1a1a]/35">
                      Custom advisory engagement scoped to your property
                      journey. Pricing is determined after understanding
                      your requirements.
                    </p>
                  </div>
                  <button
                    onClick={() => openConsult({ sourceKind: "homepage" })}
                    className="shrink-0 self-start text-[0.85rem] font-light text-[#1a1a1a]/50 underline decoration-[#1a1a1a]/15 underline-offset-4 transition-colors hover:text-[#1a1a1a]/80 sm:self-auto"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 6 · WHAT YOU ARE PAYING FOR ── */}
        <section className="px-6 pb-[10vh] md:px-12 md:pb-[14vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              What You Are Paying For
            </p>
            <h2 className="mt-6 font-serif text-[1.6rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.2rem]">
              Independence has a cost.
              <br />
              So does the alternative.
            </h2>

            <div className="mt-14 space-y-0">
              {NOT_PAYING.map((s) => (
                <div
                  key={s}
                  className="border-b border-[#1a1a1a]/6 py-5"
                >
                  <p className="font-serif text-[1rem] font-medium leading-[1.5] text-[#1a1a1a]/40 md:text-[1.1rem]">
                    {s}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <p className="font-serif text-[1.3rem] font-semibold leading-[1.4] text-[#1a1a1a]/80 md:text-[1.5rem]">
                You are paying for independent judgement.
              </p>
              <p className="mt-4 text-[0.92rem] font-light leading-[1.85] text-[#1a1a1a]/40">
                Research that begins with evidence. Analysis free from
                conflicts of interest. Recommendations personalised to your
                priorities, not optimised for someone else&apos;s sales
                targets.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 7 · FAQs ── */}
        <section className="px-6 pb-[10vh] md:px-12 md:pb-[14vh]">
          <div className="mx-auto max-w-3xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              Frequently Asked Questions
            </p>
            <h2 className="mt-6 font-serif text-[1.6rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.2rem]">
              Common questions about working with us.
            </h2>

            <div className="mt-12">
              {FAQS.map((faq, i) => {
                const isOpen = openFaqs.has(i);
                return (
                  <div key={i} className="border-b border-[#1a1a1a]/6">
                    <button
                      onClick={() => toggleFaq(i)}
                      className="flex w-full items-start justify-between gap-6 py-6 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="font-serif text-[0.98rem] font-medium leading-[1.4] text-[#1a1a1a]/70 md:text-[1.05rem]">
                        {faq.q}
                      </span>
                      <span
                        className={`mt-1 shrink-0 text-[0.85rem] text-[#1a1a1a]/20 transition-transform duration-300 ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      >
                        +
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-60 pb-6" : "max-h-0"
                      }`}
                    >
                      <p className="text-[0.88rem] font-light leading-[1.85] text-[#1a1a1a]/40">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="px-6 pb-[14vh] md:px-12 md:pb-[18vh]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[0.92rem] font-light text-[#1a1a1a]/35">
              Still unsure?
            </p>
            <h2 className="mt-4 font-serif text-[1.7rem] font-semibold leading-[1.25] text-[#1a1a1a] md:text-[2.4rem]">
              Let&apos;s think through it together.
            </h2>

            <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
              <button
                onClick={() => openConsult({ sourceKind: "homepage" })}
                className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-sm transition-all duration-500 hover:bg-[#238c55]"
              >
                Request Independent Advice
              </button>
              <a
                href={`${basePath}/intelligence`}
                className="text-[13px] tracking-[0.04em] text-[#1a1a1a]/45 transition-colors duration-500 hover:text-[#1a1a1a]/80"
              >
                Explore Truth Intelligence &rarr;
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Ivory → Dark for footer */}
      <div className="h-[8vh] bg-gradient-to-b from-[#F5F0E8] to-[#0a0a0a]" />
    </div>
  );
}
