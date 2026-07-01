"use client";

/* ════════════════════════════════════════════════════════════════
   THE NRI DESK
   A conversion-first landing page for NRIs & OCIs buying property in
   India from the UK, USA, Canada, UAE, Singapore, Australia and beyond.
   It names the real fears of buying from abroad, answers each one, and
   routes to an independent consultation. Classy, evidence-first, warm.
   Regulatory notes (FEMA / tax / PoA) are broadly accurate and always
   deferred to qualified specialists — not legal or tax advice.
   ════════════════════════════════════════════════════════════════ */

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { useConsultation } from "../consultation/ConsultationProvider";

const basePath = "/Truth-Estate";

const GEOS: { place: string; note: string }[] = [
  { place: "United Kingdom", note: "Your mornings are our evenings — we work to your clock. UK–India DTAA aware." },
  { place: "United States", note: "Across every US time zone. Your day opens with answers, not questions." },
  { place: "Canada", note: "Vancouver to Toronto — one accountable advisor, one thread, one deal." },
  { place: "UAE · Dubai & Abu Dhabi", note: "Same-week site visits and Gulf-hours communication — India is a short flight and a call away." },
  { place: "Singapore", note: "Two and a half hours ahead of IST — near real-time, all the way to handover." },
  { place: "Australia", note: "Your evening is our morning; a decision rarely has to wait a day." },
];

const CONCERNS: { fear: string; answer: string }[] = [
  {
    fear: "I can't see it. I'm trusting photos, a cousin, or a broker who earns more when I say yes.",
    answer:
      "We become your eyes and feet on the ground — accompanied and live-video site visits, honest build-quality checks, and an advocate whose recommendation no developer can buy.",
  },
  {
    fear: "Is the title even clean? From here, I can't tell a forged paper from a real one.",
    answer:
      "Forensic due diligence before a rupee moves — title chain, encumbrance, RERA, approvals and live litigation, read by independent lawyers who report only to you.",
  },
  {
    fear: "Am I paying the real price, or the ‘NRI price’ everyone assumes I'll accept?",
    answer:
      "We benchmark the true rate per sq ft against genuine comparables and negotiate for you — no inflated overseas quotes, no hidden broker margin riding on your distance.",
  },
  {
    fear: "The FEMA, tax and repatriation rules terrify me. One wrong step is expensive.",
    answer:
      "We structure the purchase to be FEMA-compliant end to end — NRE/NRO funding, TDS handled correctly, repatriation mapped out — alongside our vetted cross-border CAs.",
  },
  {
    fear: "A Power of Attorney feels dangerous. I've heard the horror stories.",
    answer:
      "We draft a narrow, purpose-bound, revocable PoA — attested correctly where you live and stamped in India — so nothing can be done in your name beyond this one deal.",
  },
  {
    fear: "Coordinating a builder, bank, lawyer and registrar from abroad is a second job I don't have time for.",
    answer:
      "One accountable advisor runs all of it on your clock — token, agreement, registration and handover — and brings you only the decisions that are genuinely yours to make.",
  },
];

const LIFECYCLE: string[] = [
  "Requirement & Buyer DNA",
  "Independent due diligence",
  "Accompanied & video site visits",
  "Price benchmarking & negotiation",
  "FEMA & Power-of-Attorney structuring",
  "Token & agreement review",
  "Registration & handover",
  "Ongoing custody & management",
];

const MANDATES: { title: string; body: string }[] = [
  {
    title: "A home for your parents",
    body: "Buying for family who will actually live there. We weigh livability, safety, the society and the neighbourhood — and handle the handover so they never chase a builder.",
  },
  {
    title: "Your anchor for the return",
    body: "A home to come back to one day. We protect long-term value — delivery certainty, the right micro-market, and a developer who will still be standing at possession.",
  },
  {
    title: "Yield, then repatriation",
    body: "An investment underwritten on real rental and a real exit — structured from the start so the proceeds can travel back to you cleanly when you choose to sell.",
  },
  {
    title: "Steward what you already own",
    body: "Already bought, or inherited a property in India? We audit the title, repair the paperwork, tenant it, manage the dues and give you an honest read on whether to hold or exit.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "As an NRI or OCI, can I even buy property in India?",
    a: "Yes. NRIs and OCIs can freely buy residential and commercial property in India under the general permission granted by the RBI. The main restriction is that you cannot buy agricultural land, a farmhouse or a plantation — though you may hold these if they are inherited or gifted. We confirm the asset class is one you are permitted to own before you commit a rupee.",
  },
  {
    q: "How am I allowed to pay for it?",
    a: "Only through normal banking channels — funds from your NRE, NRO or FCNR account, or an inward remittance. Payment in foreign currency notes or from an overseas account directly to a seller is not permitted. Home loans are available to NRIs and OCIs from Indian banks and housing-finance companies, repaid through your NRE/NRO account. We map the cleanest, fully-compliant funding route for your situation.",
  },
  {
    q: "Do I have to fly to India to complete the purchase?",
    a: "No. A properly drafted Power of Attorney lets us and your appointed representative act for you through booking, agreement, registration and handover. We keep the PoA narrow, purpose-bound and revocable — scoped to this one transaction — and have it notarised and apostilled (or attested at the Indian mission) where you live, then adjudicated and stamped in India. Its tight scope is exactly what protects you from misuse.",
  },
  {
    q: "What is TDS, and why does it matter more when buying from an NRI seller?",
    a: "Tax Deducted at Source is tax the buyer must withhold and deposit. When you buy from a resident seller for ₹50 lakh or more, you deduct 1% (Section 194-IA). But when you buy from an NRI seller, TDS is deducted under Section 195 at a much higher rate on the capital gain (plus surcharge and cess) — a step that is routinely missed and can create a large liability for the buyer later. We identify the seller's residency up front and get the TDS mechanics right on both sides.",
  },
  {
    q: "Can I take my money back out of India (repatriation)?",
    a: "In most cases, yes, within limits. Sale proceeds of up to two residential properties are repatriable subject to conditions, and funds held in an NRO account are repatriable up to USD 1 million per financial year — supported by Forms 15CA and 15CB certified by a chartered accountant. We plan repatriation before you buy, not after, and coordinate the paperwork with your CA so nothing is stranded.",
  },
  {
    q: "How will my rental income and capital gains be taxed?",
    a: "Rental income and capital gains arising in India are taxable in India, and long-term gains apply to property held beyond 24 months. Crucially, the Double Taxation Avoidance Agreement (DTAA) between India and your country of residence — the UK, US, Canada, UAE, Singapore, Australia and others — generally ensures you are not taxed twice on the same income. Rules and rates do change, so we introduce you to cross-border tax specialists who plan around your specific residency.",
  },
  {
    q: "How does Truth Estate stay independent — and what does it cost me?",
    a: "Our advice isn't for sale — no developer can buy a recommendation or a better Truth Score, and we will tell you to walk away when that is the right call. We are transparent about how we are compensated: we charge for the consultation itself, so our only job in that conversation is to tell you the truth rather than sell you a deal — and if you go on to close with us, that fee is refunded from the developer's referral on a primary sale, or set openly with both sides on a resale. You are never pushed to transact; you go ahead with us only if you see the value, and you will always know exactly how we are paid, in writing, before anything begins.",
  },
  {
    q: "Is this legal, tax or investment advice?",
    a: "No. Everything here is general information to help you ask better questions. The specifics depend on your residency, your status and rules that evolve. We coordinate with qualified chartered accountants and property lawyers, and we inform your decision — we never replace your own legal, tax and financial advisors.",
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

export default function NRIDesk() {
  const { open } = useJourney();
  const { openConsult } = useConsultation();
  const consult = () => openConsult({ sourceKind: "homepage" });

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
              href={`${basePath}/the-record`}
              className="hidden text-[0.78rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/80 sm:inline"
            >
              The Record
            </a>
            <a
              href={`${basePath}/intelligence`}
              className="hidden text-[0.78rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/80 sm:inline"
            >
              Intelligence
            </a>
            <button
              onClick={consult}
              className="whitespace-nowrap rounded-sm bg-[#1e6b45] px-4 py-2 text-[10px] font-medium tracking-[0.06em] text-white transition-all hover:bg-[#238c55] md:px-5 md:py-2.5 md:text-[11px] md:tracking-[0.08em]"
            >
              Request Independent Advice
            </button>
          </div>
        </div>
      </header>

      {/* ───────────── HERO ───────────── */}
      <section className="border-b border-[#1a1a1a]/[0.07]">
        <div className="mx-auto max-w-[1180px] px-5 pb-14 pt-16 md:px-10 md:pb-20 md:pt-28">
          <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-[#c9a96e]">
            The NRI Desk · For NRIs &amp; OCIs
          </p>
          <h1 className="mt-6 max-w-[16ch] font-serif text-[2.7rem] font-medium leading-[1.03] text-[#1a1a1a] md:text-[4.7rem]">
            Buy in India as if you were standing right there.
          </h1>
          <p className="mt-7 max-w-[600px] text-[1.05rem] font-light leading-[1.85] text-[#1a1a1a]/60 md:text-[1.2rem]">
            Buying from abroad shouldn&apos;t feel like a leap of faith. Truth Estate becomes your eyes, your advocate
            and your protection on the ground in India — forensic, and independent where it counts: our advice
            isn&apos;t for sale, and no developer can buy our recommendation.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={consult}
              className="rounded-sm bg-[#1e6b45] px-9 py-4 text-[12px] font-medium tracking-[0.07em] text-white shadow-lg shadow-black/10 transition-all hover:bg-[#238c55]"
            >
              Request Independent Advice
            </button>
            <button
              onClick={() => open()}
              className="rounded-sm border border-[#1a1a1a]/15 px-8 py-4 text-[12px] font-light tracking-[0.05em] text-[#1a1a1a]/65 transition-all hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]"
            >
              Start with your requirements
            </button>
          </div>

          {/* Trust strip */}
          <div className="mt-12 border-t border-[#1a1a1a]/[0.08] pt-7">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#1a1a1a]/40">
              <span>United Kingdom</span><span className="text-[#c9a96e]/50">·</span>
              <span>United States</span><span className="text-[#c9a96e]/50">·</span>
              <span>Canada</span><span className="text-[#c9a96e]/50">·</span>
              <span>UAE</span><span className="text-[#c9a96e]/50">·</span>
              <span>Singapore</span><span className="text-[#c9a96e]/50">·</span>
              <span>Australia</span>
            </div>
            <p className="mt-4 text-[0.9rem] font-light text-[#1a1a1a]/50">
              Our advice isn&apos;t for sale · Full fee transparency · You proceed only if you see the value.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── THE REALITY (concerns → answers) ───────────── */}
      <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24">
        <SectionHead
          n="01"
          kicker="The Reality of Buying From Abroad"
          title="Seven thousand miles is a long way to trust a stranger."
        />
        <p className="mt-6 max-w-[620px] text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/60 md:text-[1.08rem]">
          Every NRI we meet carries some version of the same worries. They are not paranoia — they are the honest maths
          of distance, incentive and information. Here is each one, and exactly how we take it off your shoulders.
        </p>

        <div className="mt-11 flex flex-col">
          {CONCERNS.map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-4 border-t border-[#1a1a1a]/8 py-8 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-12"
            >
              <div className="flex gap-4">
                <span className="mt-1 font-serif text-[0.9rem] text-[#c9a96e]">0{i + 1}</span>
                <p className="font-serif text-[1.3rem] font-light italic leading-[1.5] text-[#1a1a1a]/85 md:text-[1.5rem]">
                  &ldquo;{c.fear}&rdquo;
                </p>
              </div>
              <div className="md:pt-1">
                <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#1e6b45]">How we remove it</p>
                <p className="mt-2.5 text-[1rem] font-light leading-[1.8] text-[#1a1a1a]/70">{c.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── ONE PRINCIPAL ON THE GROUND ───────────── */}
      <section className="border-y border-[#1a1a1a]/[0.07] bg-[#efe8dc]">
        <div className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24">
          <SectionHead n="02" kicker="How We Stand In For You" title="One principal on the ground — working only for you." />
          <p className="mt-6 max-w-[640px] text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/65 md:text-[1.08rem]">
            Most NRIs are handed to a broker whose loyalty is split and whose fee grows with the price you pay. We work
            the opposite way. You appoint one independent advisor who represents only you — and who is with the deal from
            the first question to long after the keys are handed over.
          </p>

          <div className="mt-10">
            <p className="mb-4 text-[9px] font-light uppercase tracking-[0.28em] text-[#1a1a1a]/35">What we handle, end to end</p>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#1a1a1a]/8 bg-[#1a1a1a]/[0.06] sm:grid-cols-2 lg:grid-cols-4">
              {LIFECYCLE.map((s, i) => (
                <div key={s} className="flex items-start gap-3 bg-[#F5F0E8] p-5">
                  <span className="font-mono text-[0.7rem] text-[#c9a96e]">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-[0.95rem] font-light leading-snug text-[#1a1a1a]/80">{s}</p>
                </div>
              ))}
            </div>
          </div>

          <PullQuote>
            We charge for the consultation so we owe you only the truth — nothing else. Go ahead with us and that fee is
            refunded. Our recommendation was never for sale to begin with.
          </PullQuote>
        </div>
      </section>

      {/* ───────────── BUILT FOR WHERE YOU LIVE ───────────── */}
      <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24">
        <SectionHead n="03" kicker="Built For Where You Live" title="Wherever you are, we work to your clock." />
        <p className="mt-6 max-w-[600px] text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/60 md:text-[1.08rem]">
          Distance and time zones are logistics, not obstacles. We shape the entire engagement around the city you
          actually live in — the hours you are awake, the currency you think in, and the tax treaty that applies to you.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#1a1a1a]/8 bg-[#1a1a1a]/[0.06] sm:grid-cols-2 lg:grid-cols-3">
          {GEOS.map((g) => (
            <div key={g.place} className="bg-[#F5F0E8] p-6">
              <p className="font-serif text-[1.2rem] font-medium text-[#1a1a1a]">{g.place}</p>
              <p className="mt-2.5 text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/55">{g.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[0.9rem] font-light text-[#1a1a1a]/45">
          Living somewhere else? Germany, Kenya, Hong Kong, Saudi Arabia — the desk is open to Indians everywhere.
        </p>
      </section>

      {/* ───────────── THE RULES, HANDLED ───────────── */}
      <section className="border-y border-[#1a1a1a]/[0.07] bg-[#1a1a1a] text-white">
        <div className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#c9a96e]">
            <span className="mr-3 text-white/30">04</span>FEMA, Tax &amp; the Fine Print
          </p>
          <h2 className="mt-4 max-w-[18ch] font-serif text-[2rem] font-medium leading-[1.1] md:text-[2.7rem]">
            The regulations that scare most buyers — navigated for you.
          </h2>
          <p className="mt-6 max-w-[640px] text-[1rem] font-light leading-[1.85] text-white/55 md:text-[1.08rem]">
            FEMA, TDS, repatriation, Power of Attorney, DTAA. It is a maze designed to intimidate — and the place where
            NRIs most often lose money to a small, avoidable mistake. We walk it with you, alongside vetted cross-border
            chartered accountants and property lawyers.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { h: "What you can own", b: "Residential and commercial — freely. Not agricultural land or farmhouses, unless inherited." },
              { h: "How you fund it", b: "NRE / NRO / FCNR and inward remittance, through banking channels — never foreign cash." },
              { h: "TDS, done right", b: "1% from a resident seller; the higher Section 195 rate when the seller is an NRI. We flag both." },
              { h: "Repatriation, planned", b: "Up to USD 1M a year from NRO, with 15CA/15CB — mapped before you buy, not after." },
            ].map((x) => (
              <div key={x.h} className="bg-[#171717] p-6">
                <p className="font-serif text-[1.1rem] font-medium text-white">{x.h}</p>
                <p className="mt-2.5 text-[0.86rem] font-light leading-relaxed text-white/50">{x.b}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[0.85rem] font-light italic text-white/40">
            The full detail — with the exact rules — is in the FAQs below. General information, not legal or tax advice.
          </p>
        </div>
      </section>

      {/* ───────────── CUSTOM MANDATES ───────────── */}
      <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24">
        <SectionHead n="05" kicker="Tailored To Your Reason" title="No two NRIs are buying for the same reason." />
        <p className="mt-6 max-w-[600px] text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/60 md:text-[1.08rem]">
          A home for ageing parents is not an investment flat, and neither is the anchor you plan to retire into. We
          shape the mandate — and what we protect hardest — around why you are really buying.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {MANDATES.map((m) => (
            <div key={m.title} className="rounded-xl border border-[#1a1a1a]/10 bg-white p-7 md:p-8">
              <p className="font-serif text-[1.4rem] font-medium leading-tight text-[#1a1a1a]">{m.title}</p>
              <p className="mt-3 text-[0.98rem] font-light leading-[1.8] text-[#1a1a1a]/60">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="border-t border-[#1a1a1a]/[0.07] bg-[#efe8dc]">
        <div className="mx-auto max-w-[860px] px-5 py-16 md:px-10 md:py-24">
          <SectionHead n="06" kicker="Frequently Asked Questions" title="The questions every NRI should ask." />
          <div className="mt-9 flex flex-col">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group border-t border-[#1a1a1a]/10 py-5 first:border-t-0 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                  <h3 className="font-serif text-[1.15rem] font-medium leading-snug text-[#1a1a1a] md:text-[1.3rem]">
                    {f.q}
                  </h3>
                  <span className="shrink-0 text-[1.3rem] font-light text-[#1a1a1a]/30 transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-[0.96rem] font-light leading-[1.9] text-[#1a1a1a]/65">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CLOSING CTA ───────────── */}
      <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24">
        <div className="overflow-hidden rounded-2xl bg-[#1a1a1a] px-7 py-14 text-center text-white md:px-10 md:py-20">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#c9a96e]">Start Here</p>
          <h2 className="mx-auto mt-5 max-w-[18ch] font-serif text-[2rem] font-medium leading-[1.15] md:text-[3rem]">
            Make this the decision you&apos;re proud of — not the one you worry about.
          </h2>
          <p className="mx-auto mt-5 max-w-[520px] text-[0.98rem] font-light leading-[1.8] text-white/55">
            Begin with one honest, independent conversation. No sales pressure, no obligation — just a clear read on
            your decision and whether we&apos;re the right people to stand beside you.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={consult}
              className="rounded-sm bg-[#1e6b45] px-9 py-4 text-[12px] font-medium tracking-[0.07em] text-white transition-all hover:bg-[#238c55]"
            >
              Request Independent Advice
            </button>
            <button
              onClick={() => open()}
              className="rounded-sm border border-white/20 px-8 py-4 text-[12px] font-light tracking-[0.05em] text-white/75 transition-all hover:border-white/45 hover:text-white"
            >
              Start with your requirements
            </button>
          </div>
          <p className="mt-8 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-white/35">
            Advice that isn&apos;t for sale · Consultation fee refunded if you proceed · No pressure, ever
          </p>
        </div>
      </section>

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
        <h2 className="mt-4 max-w-[20ch] font-serif text-[2rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.7rem]">
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
