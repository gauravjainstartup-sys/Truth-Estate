"use client";

/* ════════════════════════════════════════════════════════════════
   OUR RESEARCH METHODOLOGY
   A public research-methodology page in the register of Morningstar,
   S&P Ratings and the Financial Times. Its only job is to earn trust:
   to show how Truth Estate thinks, not how the algorithms work.
   Calm, transparent, evidence-driven, editorial, institutional.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { useConsultation } from "../consultation/ConsultationProvider";

const basePath = "/Truth-Estate";

const CONTENTS: [string, string][] = [
  ["why-we-exist", "Why We Exist"],
  ["research-philosophy", "Research Philosophy"],
  ["what-we-analyse", "What We Analyse"],
  ["how-research-works", "How Research Works"],
  ["independence", "Independence"],
  ["truth-score", "Truth Score"],
  ["match-score", "Match Score"],
  ["living-intelligence", "Living Intelligence"],
  ["faq", "FAQ"],
];

const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "Evidence before opinion.",
    body: "We begin with official documents, verified data and observable evidence before forming any conclusion.",
  },
  {
    title: "Independent by design.",
    body: "Our recommendations are not influenced by developers, brokers or paid placements. No one can buy a better view.",
  },
  {
    title: "Context matters.",
    body: "A single data point rarely tells the full story. Every observation is read within the broader market context.",
  },
  {
    title: "Research is continuous.",
    body: "Projects evolve. Our intelligence evolves with them, rather than freezing at the moment a report was written.",
  },
  {
    title: "Transparency builds trust.",
    body: "We explain not only what we think, but why we think it — so you can judge the reasoning, not just the verdict.",
  },
];

const PILLARS: { name: string; note: string }[] = [
  { name: "Developer", note: "Track record, delivery history and standing." },
  { name: "Financial Health", note: "Balance-sheet strength and funding structure." },
  { name: "Construction Progress", note: "Physical progress against committed timelines." },
  { name: "Sales Momentum", note: "Absorption pace and inventory movement." },
  { name: "Legal Intelligence", note: "Approvals, title clarity and disputes." },
  { name: "Location Outlook", note: "Corridor maturity and connectivity." },
  { name: "Market Supply", note: "Pipeline and competing inventory." },
  { name: "Infrastructure", note: "Roads, transit and social amenities." },
  { name: "Pricing", note: "Entry basis against comparable stock." },
  { name: "Product Design", note: "Layout efficiency and build quality." },
  { name: "Demand", note: "End-user and investor appetite." },
  { name: "Future Liquidity", note: "Depth of the resale market." },
];

const PROCESS: { step: string; body: string }[] = [
  { step: "Collect", body: "We gather information from official records, regulatory filings, financial disclosures and direct market observation." },
  { step: "Verify", body: "We cross-reference each finding across multiple independent sources wherever possible, rather than trusting a single claim." },
  { step: "Interpret", body: "We analyse how each finding actually affects buyers, instead of simply reporting the facts." },
  { step: "Challenge", body: "Before publishing, we actively look for evidence that contradicts our own conclusions." },
  { step: "Recommend", body: "We present a balanced recommendation together with the supporting reasoning and the watchouts that matter." },
];

const NEVER: string[] = [
  "We do not publish paid rankings.",
  "We do not sell project rankings.",
  "We do not accept sponsored recommendations.",
  "We do not guarantee investment returns.",
  "We do not replace legal, financial or tax advisors.",
  "We do not believe one project is right for everyone.",
];

const TRIGGERS: string[] = [
  "New court orders",
  "Construction updates",
  "Financial disclosures",
  "Market changes",
  "Regulatory developments",
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Can developers influence Truth Scores?",
    a: "No. Truth Scores are produced independently from official records, verified data and our own analysis. A developer cannot pay for a higher score, sponsor a recommendation, or review our assessment before it is published.",
  },
  {
    q: "How often are projects reviewed?",
    a: "Active projects are monitored continuously and formally reviewed on a recurring schedule. Every project page shows when it was last reviewed and when the next review is due. A material development — a court order, a construction milestone, a financial disclosure — can trigger an earlier review.",
  },
  {
    q: "Can Truth Scores change?",
    a: "Yes. A Truth Score reflects what we know today. As construction progresses, disclosures are filed or market conditions shift, the score is updated to reflect the new evidence. It is a living assessment, not a permanent label.",
  },
  {
    q: "Why is my Match Score different?",
    a: "Because Match Score is personal to you. It weighs your objectives, budget, horizon, preferred locations and risk appetite against the project. Two buyers solving different problems will see different Match Scores for the same project — while the underlying Truth Score stays the same for both.",
  },
  {
    q: "Where does your data come from?",
    a: "From official and verifiable sources wherever possible: regulatory filings, registered records, financial disclosures, approved plans and direct market observation. Where sources disagree, we cross-reference before drawing a conclusion.",
  },
  {
    q: "Do you visit project sites?",
    a: "Yes. Site observation is part of our process. Physical progress, build quality and the immediate surroundings often reveal what documents alone cannot.",
  },
  {
    q: "What if new legal information becomes available?",
    a: "We treat legal information as decisive. If a new order, dispute or title issue emerges, we review the project promptly and update both our assessment and its watchouts. A single unresolved legal flag can outweigh an otherwise strong commercial case.",
  },
  {
    q: "Who should use Truth Estate?",
    a: "Anyone making a significant property decision who wants independent research alongside their own judgement — particularly buyers and NRI investors who cannot easily verify claims on the ground. We inform decisions; we do not replace your legal, financial or tax advisors.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Methodology() {
  const { open } = useJourney();
  const { openConsult } = useConsultation();
  const [active, setActive] = useState<string>("why-we-exist");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-28% 0px -64% 0px", threshold: 0 },
    );
    CONTENTS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="bg-[#F5F0E8] text-[#1a1a1a]">
      {/* ───────────── HEADER ───────────── */}
      <header className="sticky top-0 z-30 border-b border-[#1a1a1a]/[0.07] bg-[#F5F0E8]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-3.5 md:px-10">
          <a href={`${basePath}/`} aria-label="Truth Estate home">
            <Logo className="h-7 w-auto md:h-9" color="#1a1a1a" />
          </a>
          <div className="flex items-center gap-5 md:gap-7">
            <a
              href={`${basePath}/intelligence`}
              className="hidden text-[0.78rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/80 sm:inline"
            >
              Intelligence
            </a>
            <button
              onClick={() => open("research")}
              className="hidden text-[0.78rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/80 sm:inline"
            >
              TruthGuide
            </button>
            <button
              onClick={() => openConsult({ sourceKind: "homepage" })}
              className="whitespace-nowrap rounded-sm bg-[#1e6b45] px-4 py-2 text-[10px] font-medium tracking-[0.06em] text-white transition-all hover:bg-[#238c55] md:px-5 md:py-2.5 md:text-[11px] md:tracking-[0.08em]"
            >
              Request Independent Advice
            </button>
          </div>
        </div>
      </header>

      {/* ───────────── TITLE ───────────── */}
      <section className="mx-auto max-w-[1180px] px-5 pb-4 pt-16 md:px-10 md:pt-28">
        <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">Research Methodology</p>
        <h1 className="mt-5 max-w-[14ch] font-serif text-[2.7rem] font-medium leading-[1.04] text-[#1a1a1a] md:text-[4.6rem]">
          Our Research Methodology
        </h1>
        <div className="mt-7 max-w-[560px] space-y-1.5 font-serif text-[1.15rem] font-light leading-[1.6] text-[#1a1a1a]/55 md:text-[1.4rem]">
          <p>Every recommendation begins with evidence.</p>
          <p>Every conclusion follows a consistent research process.</p>
        </div>
      </section>

      {/* ───────────── BODY: contents + article ───────────── */}
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-0 px-5 md:px-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
        {/* Sticky contents */}
        <nav className="hidden lg:block" aria-label="On this page">
          <div className="sticky top-24 py-16">
            <p className="mb-4 text-[9px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/30">On This Page</p>
            <ul className="flex flex-col">
              {CONTENTS.map(([id, label], i) => {
                const on = active === id;
                return (
                  <li key={id}>
                    <button
                      onClick={() => jump(id)}
                      className={`flex w-full items-center gap-3 border-l-2 py-1.5 pl-3 text-left text-[0.8rem] font-light transition-all duration-300 ${
                        on
                          ? "border-[#c9a96e] text-[#1a1a1a]"
                          : "border-[#1a1a1a]/8 text-[#1a1a1a]/40 hover:border-[#1a1a1a]/25 hover:text-[#1a1a1a]/70"
                      }`}
                    >
                      <span className={`text-[0.6rem] tabular-nums ${on ? "text-[#c9a96e]" : "text-[#1a1a1a]/25"}`}>
                        0{i + 1}
                      </span>
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Article */}
        <article className="min-w-0 max-w-[760px] py-12 md:py-16">
          {/* ════ 1 — WHY WE EXIST ════ */}
          <section id="why-we-exist" className="scroll-mt-24">
            <SectionHead n="01" kicker="Why We Exist" />
            <p className="mt-7 font-serif text-[1.5rem] font-light leading-[1.5] text-[#1a1a1a] md:text-[2rem] md:leading-[1.45]">
              Every real estate transaction generates thousands of pages of information.
            </p>
            <div className="mt-7 space-y-5 text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/65 md:text-[1.08rem]">
              <p>
                Brochures highlight the positives. Brokers offer opinions. Official records hold the facts. Each is
                partial, and few buyers have the time — or the access — to reconcile them.
              </p>
              <p>
                Our work is to bring those facts together, evaluate them independently, and help buyers make more
                informed decisions. We do not sell property, and we are not paid to recommend it.
              </p>
            </div>
            <PullQuote>We are not trying to replace judgement. We are trying to improve it.</PullQuote>
          </section>

          {/* ════ 2 — RESEARCH PHILOSOPHY ════ */}
          <section id="research-philosophy" className="mt-20 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-16 md:mt-28">
            <SectionHead n="02" kicker="Research Philosophy" title="Five principles guide everything we publish." />
            <div className="mt-10 flex flex-col">
              {PRINCIPLES.map((pr, i) => (
                <div
                  key={pr.title}
                  className="flex flex-col gap-2 border-t border-[#1a1a1a]/8 py-7 first:border-t-0 first:pt-0 md:flex-row md:gap-10"
                >
                  <div className="flex items-baseline gap-4 md:w-[44%] md:shrink-0">
                    <span className="font-serif text-[0.9rem] text-[#c9a96e]">0{i + 1}</span>
                    <h3 className="font-serif text-[1.4rem] font-medium leading-tight text-[#1a1a1a] md:text-[1.6rem]">
                      {pr.title}
                    </h3>
                  </div>
                  <p className="text-[0.98rem] font-light leading-[1.8] text-[#1a1a1a]/60">{pr.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ════ 3 — WHAT WE ANALYSE ════ */}
          <section id="what-we-analyse" className="mt-20 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-16 md:mt-28">
            <SectionHead n="03" kicker="What We Analyse" title="No single metric defines a project." />
            <p className="mt-6 max-w-[560px] text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/65 md:text-[1.08rem]">
              Every recommendation combines intelligence from multiple research dimensions. We weigh them together —
              never in isolation.
            </p>
            <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#1a1a1a]/8 bg-[#1a1a1a]/[0.06] sm:grid-cols-2 lg:grid-cols-3">
              {PILLARS.map((pl) => (
                <div key={pl.name} className="bg-[#F5F0E8] p-5">
                  <p className="font-serif text-[1.05rem] font-medium text-[#1a1a1a]">{pl.name}</p>
                  <p className="mt-1.5 text-[0.8rem] font-light leading-relaxed text-[#1a1a1a]/45">{pl.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 text-[0.92rem] font-light leading-[1.8] text-[#1a1a1a]/45">
              Each project is evaluated using dozens of structured signals across these research areas. We are
              deliberately transparent about what we examine — and equally deliberate about not reducing our work to a
              single formula.
            </p>
          </section>

          {/* ════ 4 — HOW RESEARCH WORKS ════ */}
          <section id="how-research-works" className="mt-20 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-16 md:mt-28">
            <SectionHead n="04" kicker="How Research Works" title="One process, applied consistently." />
            <ol className="mt-10">
              {PROCESS.map((p, i) => (
                <li key={p.step} className="relative flex gap-6 pb-10 last:pb-0">
                  {i < PROCESS.length - 1 && (
                    <span className="absolute left-[11px] top-7 h-full w-px bg-[#1a1a1a]/12" />
                  )}
                  <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#1e6b45]/40 bg-[#F5F0E8] text-[0.7rem] font-medium text-[#1e6b45]">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-serif text-[1.5rem] font-medium leading-none text-[#1a1a1a]">{p.step}</h3>
                    <p className="mt-3 max-w-[520px] text-[0.98rem] font-light leading-[1.8] text-[#1a1a1a]/60">
                      {p.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ════ 5 — INDEPENDENCE ════ */}
          <section id="independence" className="mt-20 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-16 md:mt-28">
            <SectionHead n="05" kicker="Our Commitment to Independence" title="What we will never do." />
            <div className="mt-9 grid gap-px overflow-hidden rounded-xl border border-[#1a1a1a]/8 bg-[#1a1a1a]/[0.06] sm:grid-cols-2">
              {NEVER.map((n) => (
                <div key={n} className="flex items-start gap-3 bg-[#F5F0E8] p-6">
                  <span className="mt-0.5 text-[#c9a96e]">—</span>
                  <p className="font-serif text-[1.05rem] font-light leading-snug text-[#1a1a1a]/80">{n}</p>
                </div>
              ))}
            </div>
            <PullQuote>
              Our responsibility is not to tell buyers what they want to hear. It is to help them make better decisions.
            </PullQuote>
          </section>

          {/* ════ 6 — TRUTH SCORE ════ */}
          <section id="truth-score" className="mt-20 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-16 md:mt-28">
            <SectionHead n="06" kicker="Understanding Truth Score" title="How good is this project?" />
            <div className="mt-7 space-y-5 text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/65 md:text-[1.08rem]">
              <p>Truth Score measures our independent assessment of a project&apos;s overall quality.</p>
              <p>
                It is <span className="text-[#1a1a1a]">universal</span>. Every visitor sees the same Truth Score,
                because it evaluates the project itself — not the person reading about it.
              </p>
              <p>
                A Truth Score does not tell you whether to buy. It tells you how we assess the project, so you can weigh
                it against your own needs.
              </p>
            </div>
          </section>

          {/* ════ 7 — MATCH SCORE ════ */}
          <section id="match-score" className="mt-20 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-16 md:mt-28">
            <SectionHead n="07" kicker="Understanding Match Score" title="A good project isn't always the right project." />
            <div className="mt-7 space-y-5 text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/65 md:text-[1.08rem]">
              <p>
                Match Score is <span className="text-[#1a1a1a]">personalised</span>. It considers your objectives,
                investment horizon, budget, preferred locations, risk appetite and other relevant factors.
              </p>
              <p>
                Two buyers can receive different Match Scores for the same project, because they are solving different
                problems. That is intentional. We personalise the recommendation without ever changing the underlying
                Truth Score.
              </p>
            </div>

            {/* The two scores, side by side */}
            <div className="mt-9 grid gap-px overflow-hidden rounded-xl border border-[#1a1a1a]/8 bg-[#1a1a1a]/[0.06] md:grid-cols-2">
              <div className="bg-[#F5F0E8] p-7">
                <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#c9a96e]">Truth Score</p>
                <p className="mt-3 font-serif text-[1.25rem] font-medium text-[#1a1a1a]">How good is this project?</p>
                <p className="mt-2 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/55">
                  Universal. The same for everyone. A read on the asset.
                </p>
              </div>
              <div className="bg-[#F5F0E8] p-7">
                <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#c9a96e]">Match Score</p>
                <p className="mt-3 font-serif text-[1.25rem] font-medium text-[#1a1a1a]">How right is it for you?</p>
                <p className="mt-2 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/55">
                  Personal. Different for each buyer. A read on the fit.
                </p>
              </div>
            </div>
          </section>

          {/* ════ 8 — LIVING INTELLIGENCE ════ */}
          <section id="living-intelligence" className="mt-20 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-16 md:mt-28">
            <SectionHead n="08" kicker="Living Intelligence" title="Research that doesn't stand still." />
            <div className="mt-7 space-y-5 text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/65 md:text-[1.08rem]">
              <p>Truth Estate is not a static library of reports. Projects are continuously monitored.</p>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {TRIGGERS.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[#1a1a1a]/12 px-4 py-2 text-[0.82rem] font-light text-[#1a1a1a]/55"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-7 text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/65 md:text-[1.08rem]">
              When meaningful information changes, our intelligence changes with it. Every project page records its{" "}
              <span className="text-[#1a1a1a]">Last Reviewed</span> and{" "}
              <span className="text-[#1a1a1a]">Next Scheduled Review</span> dates — a public record of our commitment to
              continuous research.
            </p>
          </section>

          {/* ════ 9 — FAQ ════ */}
          <section id="faq" className="mt-20 scroll-mt-24 border-t border-[#1a1a1a]/8 pt-16 md:mt-28">
            <SectionHead n="09" kicker="Frequently Asked Questions" title="Questions worth asking." />
            <div className="mt-9 flex flex-col">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group border-t border-[#1a1a1a]/8 py-5 first:border-t-0 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                    <h3 className="font-serif text-[1.15rem] font-medium leading-snug text-[#1a1a1a] md:text-[1.3rem]">
                      {f.q}
                    </h3>
                    <span className="shrink-0 text-[1.3rem] font-light text-[#1a1a1a]/30 transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-[620px] text-[0.96rem] font-light leading-[1.85] text-[#1a1a1a]/60">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* ════ CLOSING ════ */}
          <section className="mt-20 border-t border-[#1a1a1a]/8 pt-16 text-center md:mt-28">
            <p className="mx-auto max-w-[620px] font-serif text-[1.7rem] font-light leading-[1.45] text-[#1a1a1a] md:text-[2.3rem]">
              Independent advice begins with independent research.
            </p>
            <p className="mx-auto mt-5 max-w-[460px] text-[0.95rem] font-light leading-[1.8] text-[#1a1a1a]/50">
              If you&apos;d like to understand how our research applies to your own property decision, we&apos;d be glad
              to help.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => openConsult({ sourceKind: "homepage" })}
                className="rounded-sm bg-[#1e6b45] px-9 py-4 text-[12px] font-medium tracking-[0.07em] text-white shadow-lg shadow-black/10 transition-all hover:bg-[#238c55]"
              >
                Request Independent Advice
              </button>
              <button
                onClick={() => open("research")}
                className="rounded-sm border border-[#1a1a1a]/15 px-8 py-4 text-[12px] font-light tracking-[0.05em] text-[#1a1a1a]/65 transition-all hover:border-[#1a1a1a]/30"
              >
                Challenge TruthGuide
              </button>
            </div>
          </section>
        </article>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </div>
  );
}

/* ── shared bits ── */
function SectionHead({ n, kicker, title }: { n: string; kicker: string; title?: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#c9a96e]">
        <span className="mr-3 text-[#1a1a1a]/25">{n}</span>
        {kicker}
      </p>
      {title && (
        <h2 className="mt-4 font-serif text-[2rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.7rem]">
          {title}
        </h2>
      )}
    </div>
  );
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="mt-10 border-l-2 border-[#c9a96e]/50 pl-6">
      <p className="font-serif text-[1.4rem] font-light italic leading-[1.5] text-[#1a1a1a]/80 md:text-[1.7rem]">
        {children}
      </p>
    </blockquote>
  );
}
