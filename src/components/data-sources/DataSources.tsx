"use client";

import { useEffect, useState } from "react";
import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { useConsultation } from "../consultation/ConsultationProvider";

const basePath = "/Truth-Estate";

/* ── Table of contents ── */
const CONTENTS: [string, string][] = [
  ["provenance", "Why Provenance Matters"],
  ["ecosystem", "Research Ecosystem"],
  ["regulatory", "Regulatory Sources"],
  ["legal", "Legal Sources"],
  ["financial", "Financial Sources"],
  ["market", "Market Sources"],
  ["ground", "Ground Intelligence"],
  ["process", "Data to Intelligence"],
  ["exclusions", "What We Don’t Rely On"],
  ["commitment", "Our Commitment"],
];

/* ── Source category data ── */
const REGULATORY_SOURCES: {
  name: string;
  why: string;
  analyse: string[];
}[] = [
  {
    name: "HRERA",
    why: "Haryana’s real estate regulator. The primary source for project registration, quarterly disclosures and construction timelines in Gurugram.",
    analyse: [
      "Project registration status",
      "Quarterly progress updates",
      "Timeline commitments",
      "Approval conditions",
      "Promoter disclosures",
    ],
  },
  {
    name: "MahaRERA",
    why: "Maharashtra’s regulator. Provides comparable benchmarks for delivery standards and developer behaviour across markets.",
    analyse: [
      "Cross-market delivery patterns",
      "Complaint resolutions",
      "Developer compliance history",
    ],
  },
  {
    name: "UP RERA",
    why: "Uttar Pradesh’s regulator. Relevant for NCR projects falling within Noida and Greater Noida jurisdictions.",
    analyse: [
      "Project timelines",
      "Extension applications",
      "Regulatory actions",
    ],
  },
  {
    name: "Other State RERA Authorities",
    why: "State-level regulators across India. Referenced when evaluating a developer’s national delivery record.",
    analyse: [
      "Pan-India delivery consistency",
      "Regulatory compliance patterns",
    ],
  },
  {
    name: "DTCP",
    why: "Department of Town and Country Planning. The source for building plans, licences and layout approvals in Haryana.",
    analyse: [
      "Licence conditions",
      "Approved building plans",
      "FAR utilisation",
      "Compliance certificates",
    ],
  },
  {
    name: "Government Notifications",
    why: "Official notifications from state and central government on land use, master plans, infrastructure corridors and development policies.",
    analyse: [
      "Master plan amendments",
      "Development plans",
      "Land use classifications",
      "Infrastructure notifications",
    ],
  },
];

const LEGAL_SOURCES: { name: string; why: string }[] = [
  { name: "Supreme Court", why: "Final authority on real estate disputes with national precedent-setting relevance." },
  { name: "High Courts", why: "State-level judicial proceedings that affect developer obligations and buyer protections." },
  { name: "NCLT", why: "National Company Law Tribunal. Critical for developer insolvency and corporate restructuring proceedings." },
  { name: "Consumer Commissions", why: "Track record of buyer complaints, compensation orders and possession delays across forums." },
  { name: "RERA Orders", why: "Regulatory adjudication on delivery disputes, refund claims and compliance enforcement." },
  { name: "District Courts", why: "Local proceedings including title disputes, land acquisition challenges and encumbrance matters." },
];

const FINANCIAL_SOURCES: { name: string; note: string }[] = [
  { name: "Annual Reports", note: "Revenue, profitability, cash flow and strategic direction." },
  { name: "MCA Filings", note: "Corporate structure, directorships and charge registrations." },
  { name: "Stock Exchange Filings", note: "Quarterly results, investor disclosures and material events." },
  { name: "Credit Rating Reports", note: "Institutional assessment of creditworthiness and debt servicing." },
  { name: "Audited Financial Statements", note: "Independently verified accounts for debt, asset quality and liquidity." },
];

const MARKET_SOURCES: { name: string; note: string }[] = [
  { name: "Circle Rates", note: "Government-mandated minimum land valuations." },
  { name: "Registration Data", note: "Actual transaction volumes, prices and buyer profiles." },
  { name: "Supply Pipeline", note: "Upcoming and under-construction inventory across corridors." },
  { name: "Infrastructure Announcements", note: "Roads, metro, transit and social infrastructure timelines." },
  { name: "Government Projects", note: "Public investment that shapes market trajectory." },
  { name: "Planning Authorities", note: "Zoning changes, FAR revisions and land use decisions." },
  { name: "Pricing Trends", note: "Historical and current asking and transacted prices." },
];

const GROUND_SOURCES: string[] = [
  "Construction observations",
  "Site visits",
  "Neighbourhood evolution",
  "Infrastructure progress",
  "Developer communication",
  "Visual verification",
  "Satellite imagery where applicable",
];

const PROCESS_STEPS: { step: string; body: string }[] = [
  { step: "Collect", body: "Gather information from multiple independent sources." },
  { step: "Verify", body: "Confirm facts wherever possible." },
  { step: "Cross-reference", body: "Compare observations across unrelated datasets." },
  { step: "Interpret", body: "Focus on what the information means for buyers." },
  { step: "Challenge", body: "Look for evidence that contradicts our own conclusions." },
  { step: "Publish", body: "Present balanced, evidence-based intelligence." },
];

const EXCLUSIONS: { label: string; note: string }[] = [
  { label: "Marketing brochures alone", note: "Aspirational documents, not verified commitments." },
  { label: "Broker opinions alone", note: "Valuable context, but never the sole basis for a conclusion." },
  { label: "Unverified social media claims", note: "Signal is drowned by noise without independent verification." },
  { label: "Rumours", note: "Unattributed claims do not enter our research process." },
  { label: "Anonymous WhatsApp forwards", note: "No provenance, no accountability, no place in research." },
  { label: "Single-source conclusions", note: "One source is a starting point, not an answer." },
];

const ECOSYSTEM_FLOW: string[] = [
  "Government & Regulatory Sources",
  "Legal Sources",
  "Financial Sources",
  "Market Sources",
  "Ground Intelligence",
  "Truth Estate Research",
  "Truth Intelligence",
  "Truth Score",
  "Match Score",
];

/* ── Reusable components ── */
function SectionHead({
  kicker,
  title,
  id,
}: {
  kicker: string;
  title: string;
  id: string;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">
        {kicker}
      </p>
      <h2 className="mt-4 max-w-[22ch] font-serif text-[1.9rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.6rem]">
        {title}
      </h2>
    </div>
  );
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-12 border-l-2 border-[#c9a96e] pl-6 font-serif text-[1.15rem] font-light italic leading-relaxed text-[#1a1a1a]/55 md:my-16 md:pl-8 md:text-[1.3rem]">
      {children}
    </blockquote>
  );
}

/* ── Main component ── */
export default function DataSources() {
  const { open } = useJourney();
  const { openConsult } = useConsultation();
  const [active, setActive] = useState<string>("provenance");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-28% 0px -64% 0px", threshold: 0 },
    );
    CONTENTS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const jump = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="bg-[#F5F0E8] text-[#1a1a1a]">
      {/* ───────── HEADER ───────── */}
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

      {/* ───────── TITLE ───────── */}
      <section className="mx-auto max-w-[1180px] px-5 pb-4 pt-16 md:px-10 md:pt-28">
        <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">
          Research Transparency
        </p>
        <h1 className="mt-5 max-w-[14ch] font-serif text-[2.7rem] font-medium leading-[1.04] text-[#1a1a1a] md:text-[4.6rem]">
          Data Sources
        </h1>
        <div className="mt-7 max-w-[560px] space-y-4 font-serif text-[1.15rem] font-light leading-[1.6] text-[#1a1a1a]/55 md:text-[1.4rem]">
          <p>Independent intelligence begins with reliable evidence.</p>
        </div>
      </section>

      {/* ───────── BODY: sidebar + content ───────── */}
      <div className="mx-auto flex max-w-[1180px] gap-12 px-5 pb-32 pt-10 md:px-10 md:pt-16">
        {/* Sticky sidebar */}
        <aside className="hidden w-[200px] shrink-0 md:block">
          <nav className="sticky top-20">
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#1a1a1a]/30">
              On this page
            </p>
            <ul className="mt-4 space-y-2.5 border-l border-[#1a1a1a]/[0.08]">
              {CONTENTS.map(([id, label]) => (
                <li key={id}>
                  <button
                    onClick={() => jump(id)}
                    className={`block w-full border-l-2 py-0.5 pl-4 text-left text-[0.78rem] font-light leading-snug transition-all ${
                      active === id
                        ? "border-[#c9a96e] text-[#1a1a1a]"
                        : "border-transparent text-[#1a1a1a]/35 hover:text-[#1a1a1a]/60"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content */}
        <article className="min-w-0 flex-1 space-y-28 md:space-y-36">
          {/* ── Supporting copy ── */}
          <div className="max-w-[620px] space-y-5 text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/60 md:text-[1.08rem]">
            <p>
              Every recommendation published by Truth Estate is supported by
              information gathered from carefully selected public, regulatory,
              financial and market sources.
            </p>
            <p>No single source tells the complete story.</p>
            <p>
              Our role is to bring these sources together, verify them
              independently and explain what they mean for buyers.
            </p>
          </div>

          {/* ── SECTION 1: Why provenance matters ── */}
          <section>
            <SectionHead
              kicker="Section 01"
              title="Why Data Provenance Matters"
              id="provenance"
            />
            <div className="mt-10 max-w-[620px] space-y-5 text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/60 md:text-[1.08rem]">
              <p>Most buyers rely on one source.</p>
              <p>
                A brochure. A broker. A portal. A YouTube review.
              </p>
              <p>Real estate decisions deserve broader evidence.</p>
              <p>
                Truth Estate combines information from multiple independent
                sources because every source has strengths, limitations and
                blind spots.
              </p>
            </div>
            <PullQuote>
              Good research starts by understanding where information comes
              from — and what it cannot tell you.
            </PullQuote>
          </section>

          {/* ── SECTION 2: Research ecosystem ── */}
          <section>
            <SectionHead
              kicker="Section 02"
              title="Our Research Ecosystem"
              id="ecosystem"
            />
            <p className="mt-8 max-w-[520px] text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/60 md:text-[1.08rem]">
              Information flows through a structured chain — from raw public
              records to actionable intelligence.
            </p>

            {/* Flow diagram */}
            <div className="mt-14 flex flex-col items-start">
              {ECOSYSTEM_FLOW.map((label, i) => {
                const isTE = label === "Truth Estate Research";
                const isOutput =
                  label === "Truth Intelligence" ||
                  label === "Truth Score" ||
                  label === "Match Score";
                return (
                  <div key={label} className="flex flex-col items-start">
                    <div
                      className={`rounded-sm border px-6 py-3.5 text-[0.88rem] font-light transition-colors md:px-8 md:text-[0.95rem] ${
                        isTE
                          ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.07] text-[#1a1a1a]"
                          : isOutput
                            ? "border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] text-[#1a1a1a]"
                            : "border-[#1a1a1a]/10 bg-white text-[#1a1a1a]/70"
                      }`}
                    >
                      {label}
                    </div>
                    {i < ECOSYSTEM_FLOW.length - 1 && (
                      <div className="ml-8 flex h-8 items-center">
                        <div className="h-full w-px bg-[#1a1a1a]/10" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── SECTION 3: Regulatory sources ── */}
          <section>
            <SectionHead
              kicker="Section 03"
              title="Government & Regulatory Records"
              id="regulatory"
            />
            <p className="mt-8 max-w-[520px] text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/60 md:text-[1.08rem]">
              These records provide the legal and regulatory foundation of
              every project.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {REGULATORY_SOURCES.map((s) => (
                <div
                  key={s.name}
                  className="rounded-sm border border-[#1a1a1a]/[0.07] bg-white p-6 md:p-8"
                >
                  <h4 className="font-serif text-[1.15rem] font-medium text-[#1a1a1a]">
                    {s.name}
                  </h4>
                  <p className="mt-3 text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/50">
                    {s.why}
                  </p>
                  <div className="mt-5 border-t border-[#1a1a1a]/[0.06] pt-4">
                    <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">
                      What we analyse
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {s.analyse.map((a) => (
                        <li
                          key={a}
                          className="text-[0.82rem] font-light text-[#1a1a1a]/55"
                        >
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            <PullQuote>
              Government records are authoritative but represent only one part
              of the complete picture.
            </PullQuote>
          </section>

          {/* ── SECTION 4: Legal sources ── */}
          <section>
            <SectionHead
              kicker="Section 04"
              title="Courts & Tribunals"
              id="legal"
            />
            <p className="mt-8 max-w-[520px] text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/60 md:text-[1.08rem]">
              Legal proceedings often provide important context that brochures
              cannot.
            </p>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {LEGAL_SOURCES.map((s) => (
                <div
                  key={s.name}
                  className="rounded-sm border border-[#1a1a1a]/[0.07] bg-white p-6"
                >
                  <h4 className="font-serif text-[1.05rem] font-medium text-[#1a1a1a]">
                    {s.name}
                  </h4>
                  <p className="mt-3 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/50">
                    {s.why}
                  </p>
                </div>
              ))}
            </div>
            <PullQuote>
              The existence of litigation does not automatically indicate risk.
              Every legal matter requires context.
            </PullQuote>
          </section>

          {/* ── SECTION 5: Financial sources ── */}
          <section>
            <SectionHead
              kicker="Section 05"
              title="Financial Disclosures"
              id="financial"
            />
            <p className="mt-8 max-w-[520px] text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/60 md:text-[1.08rem]">
              Developer financial strength — debt, cash flow, profitability,
              institutional ownership, funding capacity — directly influences
              execution capability.
            </p>
            <div className="mt-12 space-y-4">
              {FINANCIAL_SOURCES.map((s) => (
                <div
                  key={s.name}
                  className="flex flex-col gap-2 rounded-sm border border-[#1a1a1a]/[0.07] bg-white px-6 py-5 md:flex-row md:items-baseline md:gap-6 md:px-8"
                >
                  <h4 className="shrink-0 font-serif text-[1rem] font-medium text-[#1a1a1a] md:w-[220px]">
                    {s.name}
                  </h4>
                  <p className="text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/50">
                    {s.note}
                  </p>
                </div>
              ))}
            </div>
            <PullQuote>
              Financial strength influences execution capability but should
              always be interpreted alongside construction and legal progress.
            </PullQuote>
          </section>

          {/* ── SECTION 6: Market sources ── */}
          <section>
            <SectionHead
              kicker="Section 06"
              title="Market Intelligence"
              id="market"
            />
            <p className="mt-8 max-w-[520px] text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/60 md:text-[1.08rem]">
              Markets evolve continuously. Understanding context is as
              important as understanding projects.
            </p>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {MARKET_SOURCES.map((s) => (
                <div
                  key={s.name}
                  className="rounded-sm border border-[#1a1a1a]/[0.07] bg-white p-6"
                >
                  <h4 className="font-serif text-[1.05rem] font-medium text-[#1a1a1a]">
                    {s.name}
                  </h4>
                  <p className="mt-3 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/50">
                    {s.note}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 7: Ground intelligence ── */}
          <section>
            <SectionHead
              kicker="Section 07"
              title="Ground Reality"
              id="ground"
            />
            <p className="mt-8 max-w-[520px] text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/60 md:text-[1.08rem]">
              Not every meaningful insight exists in a document.
            </p>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {GROUND_SOURCES.map((g) => (
                <div
                  key={g}
                  className="flex items-center gap-4 rounded-sm border border-[#1a1a1a]/[0.07] bg-white px-6 py-4"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a96e]" />
                  <span className="text-[0.9rem] font-light text-[#1a1a1a]/60">
                    {g}
                  </span>
                </div>
              ))}
            </div>
            <PullQuote>
              Ground observations complement documentary evidence but never
              replace official records.
            </PullQuote>
          </section>

          {/* ── SECTION 8: Data to intelligence process ── */}
          <section>
            <SectionHead
              kicker="Section 08"
              title="How We Turn Data into Intelligence"
              id="process"
            />
            <div className="mt-14 flex flex-col items-start">
              {PROCESS_STEPS.map((p, i) => (
                <div key={p.step} className="flex flex-col items-start">
                  <div className="flex items-start gap-5 md:gap-8">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/30 text-[0.8rem] font-medium text-[#c9a96e]">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="pt-1">
                      <h4 className="font-serif text-[1.1rem] font-medium text-[#1a1a1a] md:text-[1.2rem]">
                        {p.step}
                      </h4>
                      <p className="mt-2 max-w-[440px] text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/50">
                        {p.body}
                      </p>
                    </div>
                  </div>
                  {i < PROCESS_STEPS.length - 1 && (
                    <div className="ml-5 flex h-10 items-center">
                      <div className="h-full w-px bg-[#c9a96e]/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 9: What we don't rely on ── */}
          <section>
            <SectionHead
              kicker="Section 09"
              title="What We Don&rsquo;t Rely On"
              id="exclusions"
            />
            <p className="mt-8 max-w-[520px] text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/60 md:text-[1.08rem]">
              Research also means knowing what not to trust.
            </p>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {EXCLUSIONS.map((e) => (
                <div
                  key={e.label}
                  className="rounded-sm border border-[#1a1a1a]/[0.07] bg-white p-6"
                >
                  <h4 className="font-serif text-[1rem] font-medium text-[#1a1a1a]">
                    {e.label}
                  </h4>
                  <p className="mt-3 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/50">
                    {e.note}
                  </p>
                </div>
              ))}
            </div>
            <PullQuote>
              Every source has limitations. That&rsquo;s why independent
              research requires corroboration.
            </PullQuote>
          </section>

          {/* ── SECTION 10: Our commitment ── */}
          <section>
            <SectionHead
              kicker="Section 10"
              title="Our Commitment"
              id="commitment"
            />
            <div className="mt-10 max-w-[620px] space-y-5 text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/60 md:text-[1.08rem]">
              <p>Truth Estate does not promise certainty.</p>
              <p>Markets change. Projects evolve. Information improves.</p>
              <p>Our commitment is simpler.</p>
              <p>
                To continuously improve our understanding as new evidence
                becomes available — and to help buyers make decisions based on
                facts rather than marketing.
              </p>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="border-t border-[#1a1a1a]/[0.08] pt-16 md:pt-20">
            <h2 className="max-w-[24ch] font-serif text-[1.9rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[2.6rem]">
              Evidence builds confidence.
              <br />
              Judgement builds decisions.
            </h2>
            <p className="mt-6 max-w-[480px] text-[1rem] font-light leading-[1.7] text-[#1a1a1a]/55 md:text-[1.08rem]">
              Explore how our research applies to real projects or discuss your
              own decision with an independent advisor.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-5">
              <a
                href={`${basePath}/intelligence`}
                className="inline-flex items-center justify-center rounded-sm bg-[#1a1a1a] px-7 py-3 text-[11px] font-medium tracking-[0.08em] text-white transition-colors hover:bg-[#333]"
              >
                Explore Truth Intelligence
              </a>
              <button
                onClick={() => openConsult({ sourceKind: "homepage" })}
                className="inline-flex items-center justify-center rounded-sm border border-[#1a1a1a]/15 px-7 py-3 text-[11px] font-medium tracking-[0.08em] text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"
              >
                Request Independent Advice
              </button>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
