"use client";

import Logo from "../Logo";
import { useConsultation } from "../consultation/ConsultationProvider";
import { CONSULT_FEE, CONSULT_FEE_NOTE, inr } from "@/lib/consultation";

const basePath = "/Truth-Estate";
const PRICE = CONSULT_FEE ?? 9999;

/* ── The eight offices ── */
type Pillar = { n: string; name: string; outcome: string; body: string; includes: string[]; quote?: string };

const PILLARS: Pillar[] = [
  {
    n: "01",
    name: "Buyer Intelligence",
    outcome: "Never waste weekends on the wrong projects.",
    body: "We understand your family's priorities, investment goals and lifestyle, then build a personalised buying strategy around them.",
    includes: ["Buyer profiling", "Data-led recommendations", "AI Match Score", "Investment vs end-use guidance", "Longlist & shortlist creation"],
  },
  {
    n: "02",
    name: "Unit Intelligence",
    outcome: "Don't just buy the right project. Buy the right apartment.",
    body: "Proprietary intelligence identifies the best tower, floor and unit for your specific requirements.",
    includes: ["Morning sunlight analysis", "Cross ventilation", "Vastu assessment", "View analysis", "Future obstruction prediction", "Heat gain", "Privacy & noise", "Resale potential", "Floor recommendations"],
  },
  {
    n: "03",
    name: "Ground Intelligence",
    outcome: "Experience the neighbourhood before you buy.",
    body: "We evaluate what Google Maps can't tell you — on the ground, in person.",
    includes: ["Site-visit planning", "Connectivity videos", "Traffic insights", "Surrounding ecosystem", "Livability assessment", "Future infrastructure", "School & hospital analysis"],
  },
  {
    n: "04",
    name: "Commercial Intelligence",
    outcome: "Know the market before you negotiate.",
    body: "We represent you — not the developer — with the full commercial picture in hand.",
    includes: ["Market quotations", "Offer comparison", "Price benchmarking", "Payment-plan comparison", "Negotiation support", "Best commercial structure"],
    quote: "We work for you. Not inventory.",
  },
  {
    n: "05",
    name: "Transaction Office",
    outcome: "From token to registration, we've got your back.",
    body: "A dedicated team manages the entire buying process, end to end.",
    includes: ["Booking assistance", "Documentation support", "Builder coordination", "Payment-milestone tracking", "Possession checklist"],
  },
  {
    n: "06",
    name: "Buyer Memory™",
    outcome: "Nothing important stays verbal.",
    body: "Every interaction becomes searchable forever — the memory wall for your entire decision.",
    includes: ["Meeting recordings", "AI summaries", "Builder commitments", "Commercial offers", "Negotiation history", "Decision timeline", "Document vault"],
    quote: "From your first thought to your final signature.",
  },
  {
    n: "07",
    name: "Ownership OS",
    outcome: "The relationship doesn't end after booking.",
    body: "Manage your home like an asset, long after possession.",
    includes: ["Portfolio dashboard", "Construction tracking", "Payment reminders", "Document repository", "Appreciation tracker", "Exit planning"],
  },
  {
    n: "08",
    name: "Expert Network",
    outcome: "One trusted team. Multiple specialists.",
    body: "Every specialist you'll need, on call whenever you need them.",
    includes: ["Home loans", "Legal review", "Interior design", "Property management", "Resale assistance", "Tax guidance"],
  },
];

/* ── The value stack ── */
const VALUE_STACK: [string, string][] = [
  ["Buyer Advisory", "₹15,000"],
  ["Unit Intelligence", "₹20,000"],
  ["Commercial Negotiation", "₹25,000"],
  ["Site Visits & Coordination", "₹10,000"],
  ["Documentation Support", "₹10,000"],
  ["Buyer Memory™", "Priceless"],
  ["Ownership OS", "₹20,000"],
  ["Expert Network Access", "₹25,000"],
];

function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p className={`text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e] ${center ? "text-center" : ""}`}>
      {children}
    </p>
  );
}

export default function PremiumBuyerOffice() {
  const { openConsult } = useConsultation();
  const request = () => openConsult({ sourceKind: "homepage", intent: "advice" });

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-svh flex-col bg-[#0a0a0a]">
        <nav className="px-6 pt-10 md:px-12 md:pt-14">
          <a href={basePath} aria-label="Truth Estate — home">
            <Logo className="h-9 w-auto opacity-75 md:h-[3rem]" />
          </a>
        </nav>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <Eyebrow>Premium Buyer Office</Eyebrow>
          <h1 className="mt-9 max-w-4xl font-serif text-[2rem] font-bold leading-[1.16] tracking-[-0.01em] text-white md:text-[3.3rem] md:leading-[1.12]">
            Your independent representative.
            <br className="hidden md:block" /> From first thought to final signature.
          </h1>
          <p className="mt-9 max-w-xl text-[0.95rem] font-light leading-[1.85] text-white/40 md:text-[1.05rem]">
            A Buyer&rsquo;s Office for one of life&rsquo;s largest financial decisions — we represent you,
            never the developer, at every step from your first thought to your final signature.
          </p>
          <div className="mt-11 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
            <button
              onClick={request}
              className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-sm transition-all duration-500 hover:bg-[#238c55]"
            >
              Request Independent Advice
            </button>
            <a href="#included" className="text-[13px] tracking-[0.04em] text-white/45 transition-colors duration-500 hover:text-white/80">
              See what&rsquo;s included &darr;
            </a>
          </div>
        </div>

        <div className="pb-12 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto h-6 w-6 animate-bounce text-white/15">
            <path d="M12 5v14m0 0l-5-5m5 5l5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* Dark → Ivory */}
      <div className="h-[16vh] bg-gradient-to-b from-[#0a0a0a] to-[#F5F0E8] md:h-[20vh]" />

      <div className="bg-[#F5F0E8] text-[#1a1a1a]">
        {/* ── POSITIONING ── */}
        <section className="px-6 pb-[8vh] pt-[2vh] md:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow center>Peace of mind, by design</Eyebrow>
            <h2 className="mt-6 font-serif text-[1.7rem] font-semibold leading-[1.22] text-[#1a1a1a] md:text-[2.4rem]">
              You&rsquo;re not buying consultancy.
              <br className="hidden md:block" /> You&rsquo;re appointing a Buyer&rsquo;s Office.
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-[0.95rem] font-light leading-[1.9] text-[#1a1a1a]/50 md:text-[1.05rem]">
              A membership that should feel like hiring a family office for one of the biggest decisions
              your family will make. A broker&rsquo;s journey ends at your booking. Ours continues — through
              decision-making, negotiation, documentation, construction and ownership.
            </p>
          </div>
        </section>

        {/* ── THE EIGHT OFFICES ── */}
        <section id="included" className="scroll-mt-6 px-6 pb-[10vh] md:px-12 md:pb-[14vh]">
          <div className="mx-auto max-w-6xl">
            <Eyebrow center>One membership. Eight offices.</Eyebrow>
            <h2 className="mt-6 text-center font-serif text-[1.7rem] font-semibold leading-[1.22] text-[#1a1a1a] md:text-[2.4rem]">
              The entire buy-side, working only for you.
            </h2>

            <div className="mt-14 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-2">
              {PILLARS.map((p) => (
                <div key={p.n} className="flex flex-col rounded-sm border border-[#1a1a1a]/[0.08] bg-white p-7 lg:p-8">
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-[1.05rem] font-medium text-[#c9a96e]">{p.n}</span>
                    <h3 className="font-serif text-[1.2rem] font-semibold text-[#1a1a1a] md:text-[1.3rem]">{p.name}</h3>
                  </div>
                  <p className="mt-4 font-serif text-[1.15rem] font-medium leading-[1.35] text-[#1a1a1a]/85 md:text-[1.28rem]">
                    {p.outcome}
                  </p>
                  <p className="mt-3 text-[0.88rem] font-light leading-[1.7] text-[#1a1a1a]/50">{p.body}</p>

                  <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/25">Includes</p>
                  <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                    {p.includes.map((x) => (
                      <li key={x} className="flex gap-2.5 text-[0.84rem] font-light text-[#1a1a1a]/55">
                        <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-[#c9a96e]/50" />
                        {x}
                      </li>
                    ))}
                  </ul>

                  {p.quote && (
                    <p className="mt-6 border-t border-[#c9a96e]/15 pt-5 font-serif text-[1.02rem] font-medium italic text-[#1e6b45]">
                      {p.quote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── THE VALUE STACK ── */}
        <section className="px-6 pb-[10vh] md:px-12 md:pb-[14vh]">
          <div className="mx-auto max-w-3xl">
            <Eyebrow>What it&rsquo;s worth</Eyebrow>
            <h2 className="mt-6 font-serif text-[1.7rem] font-semibold leading-[1.22] text-[#1a1a1a] md:text-[2.4rem]">
              Included &mdash; worth {"₹"}1,25,000+.
            </h2>

            <div className="mt-12 overflow-hidden rounded-sm border border-[#1a1a1a]/[0.08] bg-white">
              {VALUE_STACK.map(([service, value]) => (
                <div key={service} className="flex items-baseline justify-between gap-4 border-b border-[#1a1a1a]/[0.06] px-6 py-4">
                  <span className="text-[0.92rem] font-light text-[#1a1a1a]/70">{service}</span>
                  <span className={`shrink-0 font-mono text-[0.9rem] ${value === "Priceless" ? "text-[#9a7a2e]" : "text-[#1a1a1a]/45"}`}>{value}</span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 bg-[#1a1a1a]/[0.03] px-6 py-5">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/45">Total value</span>
                <span className="font-serif text-[1.25rem] font-semibold text-[#1a1a1a]">Worth {"₹"}1,25,000+</span>
              </div>
            </div>

            {/* The reveal */}
            <div className="mt-14 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">{CONSULT_FEE != null ? "Yours for" : "First consultation"}</p>
              <p className="mt-3 font-serif text-[clamp(3.4rem,13vw,6rem)] font-semibold leading-none text-[#1a1a1a]">{CONSULT_FEE != null ? inr(PRICE) : "Free"}</p>
              <p className="mx-auto mt-6 flex max-w-md items-center justify-center gap-1.5 text-[0.85rem] font-light text-[#1a1a1a]/50">
                <span className="text-[#1e6b45]">&#10003;</span> {CONSULT_FEE_NOTE}
              </p>
              <p className="mx-auto mt-6 max-w-lg font-serif text-[1.2rem] font-medium italic leading-[1.4] text-[#1a1a1a]/70 md:text-[1.35rem]">
                You&rsquo;re not buying consultancy. You&rsquo;re appointing a Buyer&rsquo;s Office.
              </p>
            </div>
          </div>
        </section>

        {/* ── THE PROMISE ── */}
        <section className="bg-[#123a29] px-6 py-[13vh] md:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a96e]">Our promise</p>
            <p className="mt-7 font-serif text-[1.7rem] font-medium leading-[1.35] text-[#F5F0E8] md:text-[2.5rem]">
              &ldquo;We stay with you until you&rsquo;re confident&mdash;not just until you book.&rdquo;
            </p>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="px-6 py-[14vh] text-center md:px-12">
          <div className="mx-auto max-w-3xl">
            <Eyebrow center>Appoint your Buyer&rsquo;s Office</Eyebrow>
            <h2 className="mt-6 font-serif text-[1.8rem] font-semibold leading-[1.2] text-[#1a1a1a] md:text-[2.6rem]">
              Represented from your first thought
              <br className="hidden md:block" /> to your final signature.
            </h2>
            <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
              <button
                onClick={request}
                className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-sm transition-all duration-500 hover:bg-[#238c55]"
              >
                Request Independent Advice
              </button>
              <a href={`${basePath}/pricing`} className="text-[13px] tracking-[0.04em] text-[#1a1a1a]/45 transition-colors duration-500 hover:text-[#1a1a1a]/80">
                See all engagement models &rarr;
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
