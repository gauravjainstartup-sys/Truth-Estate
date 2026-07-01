"use client";

/* ════════════════════════════════════════════════════════════════
   THE RECORD
   An SEO/GEO landing page built around Truth Estate's sharpest
   differentiator: every call, question, answer, recommendation and
   developer promise kept in one permanent, timestamped record.
   Written for NRIs abroad — it targets the fear they actually search
   ("builder didn't deliver what was promised", "how to prove it") and
   positions the record as the cure. Accountability runs both ways, so
   it also reinforces the independence brand. Not legal advice.
   ════════════════════════════════════════════════════════════════ */

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { useConsultation } from "../consultation/ConsultationProvider";

const basePath = "/Truth-Estate";

const PAINS: string[] = [
  "The call where the sales manager promised the park-facing unit — that no one can find in writing three months later.",
  "The spec sheet that quietly changed between booking and possession.",
  "The “assured” completion date that everyone later denies ever giving you.",
  "The WhatsApp thread that would have proved you right — on a phone you’ve since replaced.",
];

const RECORDED: { title: string; body: string }[] = [
  {
    title: "Every conversation",
    body: "Calls and consultations, recorded with consent and summarised — so a decision is never left to who remembers what.",
  },
  {
    title: "Every question & answer",
    body: "What you asked and exactly what we said, kept in context. Nothing important lives only in a WhatsApp you’ll lose.",
  },
  {
    title: "Every recommendation",
    body: "The advice we gave — and the evidence we based it on — written down and dated, so it can always be checked back.",
  },
  {
    title: "Every developer promise",
    body: "Floor, facing, amenities, inclusions, dates and price — each commitment pinned to its source the moment it’s made.",
  },
  {
    title: "Every document",
    body: "Agreement, brochure, approved plan, RERA disclosures, receipts — each version kept, so you can see precisely what changed.",
  },
  {
    title: "Every change",
    body: "What moved, when, and who moved it. Silent revisions between booking and handover become impossible to miss.",
  },
];

const THREE_WAYS: { who: string; body: string }[] = [
  {
    who: "The developer",
    body: "Every commitment is pinned to its source, so terms can’t quietly drift between the showroom and the handover. What was promised stays promised.",
  },
  {
    who: "Truth Estate",
    body: "Our advice is on the record too. We can’t tell you one thing today and spin it tomorrow — you can audit us as easily as the builder. It’s what makes “our advice isn’t for sale” verifiable, not a slogan.",
  },
  {
    who: "You",
    body: "If it ever reaches RERA or a courtroom, you arrive with a clean, timestamped evidence trail — not a memory and a shoebox of PDFs a decade and an ocean later.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What happens if a builder in India doesn’t deliver what they promised?",
    a: "Your remedy usually depends on what you can prove. RERA gives home-buyers a real forum for delays and deviations from the sanctioned plan or the agreement — but it works best when the promise is documented: the sale agreement, the brochure, the approved plan and any written commitment. Verbal assurances from a sales team are the hardest to enforce. That is exactly why we pin every commitment to its source and keep it on your record from day one — so if a builder deviates, you are arguing from evidence, not memory. This is general information, not legal advice.",
  },
  {
    q: "How can an NRI prove what a developer promised?",
    a: "By keeping the promise in a form that survives — the written agreement and brochure, the approved layout, email and message confirmations, and a dated summary of what was said on each call. Truth Estate does this for you: after every meaningful conversation we confirm the key points back in writing and file them under your account, so “what they told me” becomes “what is documented” — timestamped and retrievable from anywhere in the world.",
  },
  {
    q: "Why do verbal promises from builders rarely hold up later?",
    a: "Because a RERA bench or a court decides on the record, not on recollection — and a sales pitch over a call leaves none. Floor, facing, amenities, timelines and inclusions are routinely promised verbally and then contested. The fix isn’t suspicion; it’s documentation. We convert every material verbal promise into a written, dated record while it is still fresh.",
  },
  {
    q: "Is it legal to record calls with a builder or broker in India?",
    a: "India has no single statute that bars a participant from recording a conversation they are part of, and such recordings have been admitted as evidence — but privacy law is evolving and sharing recordings can raise separate issues. We keep it clean: recording is done with notice and consent, and in every case we also confirm the substance of the call back to you and the other side in writing, which is both courteous and far easier to rely on. We are not a law firm and coordinate with qualified lawyers on anything contentious.",
  },
  {
    q: "What should I keep a record of when buying property in India from abroad?",
    a: "At minimum: the sale agreement and every annexure, the brochure and approved plan, the RERA registration and disclosures, all payment receipts, the TDS paperwork, and a dated note of every promise made about price, floor, facing, amenities, inclusions and dates. Because you can’t walk into the office to clarify later, the completeness of this record matters far more for an overseas buyer. Truth Estate assembles and maintains all of it under one login.",
  },
  {
    q: "How does keeping everything on the record keep Truth Estate honest too?",
    a: "Because our advice sits on the record alongside everything else. Every recommendation we make — and the evidence behind it — is written down and timestamped under your account. We can’t tell you one thing today and quietly revise the story later; you can audit us as easily as you can audit the developer. For an independent advisor, that is the point: accountability that runs both ways is what makes independence provable.",
  },
  {
    q: "Does the record help if there’s a RERA complaint or dispute later?",
    a: "Yes — evidence is decisive in these forums. A complete, timestamped file of the agreement, approved plan, disclosures, payments and documented promises lets your lawyer act quickly and argue from fact, not reconstruct events years later. We organise everything so that, if it’s ever needed, it’s already there.",
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

export default function TheRecord() {
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
              href={`${basePath}/nri`}
              className="hidden text-[0.78rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]/80 sm:inline"
            >
              NRI Desk
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
            The Record · For Buyers Who Can&apos;t Be In The Room
          </p>
          <h1 className="mt-6 max-w-[15ch] font-serif text-[2.7rem] font-medium leading-[1.03] text-[#1a1a1a] md:text-[4.7rem]">
            Every promise, on the record.
          </h1>
          <p className="mt-7 max-w-[620px] text-[1.05rem] font-light leading-[1.85] text-[#1a1a1a]/60 md:text-[1.2rem]">
            When you&apos;re buying in India from seven time zones away, memory fades and WhatsApp
            gets deleted. Truth Estate keeps every call, every answer, every recommendation and every
            developer promise in one permanent, timestamped record — so a verbal assurance becomes
            documented proof if a builder ever deviates. Yours to keep, forever.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={consult}
              className="rounded-sm bg-[#1e6b45] px-8 py-4 text-[12px] font-medium tracking-[0.07em] text-white transition-all hover:bg-[#238c55]"
            >
              Request Independent Advice
            </button>
            <a
              href={`${basePath}/nri`}
              className="text-[0.9rem] font-light text-[#1e6b45] underline decoration-[#1e6b45]/25 underline-offset-4 transition-colors hover:text-[#238c55] sm:ml-2"
            >
              How the NRI Desk works &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ───────────── 01 · THE FEAR ───────────── */}
      <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24">
        <SectionHead n="01" kicker="Why This Exists" title="From 7,000 miles away, the truth has a way of changing." />
        <p className="mt-6 max-w-[640px] text-[1rem] font-light leading-[1.85] text-[#1a1a1a]/60 md:text-[1.08rem]">
          Almost every NRI has a version of the same story — a promise made warmly on a call, and
          quietly gone by possession. Not because you were careless, but because nothing was written
          down while it was still true.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#1a1a1a]/10 bg-[#1a1a1a]/10 sm:grid-cols-2">
          {PAINS.map((p) => (
            <div key={p} className="bg-[#F5F0E8] p-7 md:p-8">
              <p className="text-[0.98rem] font-light italic leading-[1.8] text-[#1a1a1a]/70">&ldquo;{p}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── 02 · WHAT GOES ON RECORD ───────────── */}
      <section className="border-y border-[#1a1a1a]/[0.07] bg-[#efe8dc]">
        <div className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24">
          <SectionHead n="02" kicker="What Goes On Record" title="Everything that shapes your decision — captured." />
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {RECORDED.map((r) => (
              <div key={r.title} className="rounded-xl border border-[#1a1a1a]/10 bg-white p-7 md:p-8">
                <p className="font-serif text-[1.3rem] font-medium leading-tight text-[#1a1a1a]">{r.title}</p>
                <p className="mt-3 text-[0.95rem] font-light leading-[1.8] text-[#1a1a1a]/60">{r.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[0.88rem] font-light tracking-[0.02em] text-[#1a1a1a]/45">
            One account · Timestamped · Permanent · Retrievable from anywhere in the world.
          </p>
        </div>
      </section>

      {/* ───────────── 03 · WHY IT MATTERS FROM ABROAD ───────────── */}
      <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24">
        <SectionHead n="03" kicker="Why It Matters More From Abroad" title="You can&apos;t be in the room. Your record can." />
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-14">
          <p className="text-[1rem] font-light leading-[1.9] text-[#1a1a1a]/65 md:text-[1.08rem]">
            A resident buyer can drop by the site, walk into the sales office and clarify a doubt the
            same afternoon. You can&apos;t. You&apos;re relying on a cousin, a broker or a sales manager
            — and on your own memory of calls taken late at night after a full day&apos;s work.
          </p>
          <p className="text-[1rem] font-light leading-[1.9] text-[#1a1a1a]/65 md:text-[1.08rem]">
            When something goes wrong, RERA and the courts turn on evidence, not recollection. A clean,
            timestamped trail is the difference between &ldquo;he said, they said&rdquo; and proof. For
            a buyer who is 7,000 miles and several years removed from the sales pitch, that trail
            isn&apos;t a nicety — it&apos;s your protection.
          </p>
        </div>
      </section>

      {/* ───────────── 04 · ACCOUNTABILITY BOTH WAYS ───────────── */}
      <section className="border-y border-[#1a1a1a]/[0.07] bg-[#efe8dc]">
        <div className="mx-auto max-w-[1180px] px-5 py-16 md:px-10 md:py-24">
          <SectionHead n="04" kicker="Accountability, Both Ways" title="A record keeps everyone honest — including us." />
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {THREE_WAYS.map((t) => (
              <div key={t.who} className="rounded-xl border border-[#1a1a1a]/10 bg-white p-7 md:p-8">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#c9a96e]">Keeps honest</p>
                <p className="mt-3 font-serif text-[1.4rem] font-medium leading-tight text-[#1a1a1a]">{t.who}</p>
                <p className="mt-3 text-[0.95rem] font-light leading-[1.8] text-[#1a1a1a]/60">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 05 · FAQ ───────────── */}
      <section className="border-t border-[#1a1a1a]/[0.07]">
        <div className="mx-auto max-w-[860px] px-5 py-16 md:px-10 md:py-24">
          <SectionHead n="05" kicker="Frequently Asked Questions" title="Proof, promises and your protection." />
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
          <h2 className="mx-auto mt-5 max-w-[20ch] font-serif text-[2rem] font-medium leading-[1.15] md:text-[3rem]">
            Buy on evidence, not assurances — and keep the receipts.
          </h2>
          <p className="mx-auto mt-5 max-w-[540px] text-[0.98rem] font-light leading-[1.8] text-white/55">
            Begin with one honest, independent conversation. Everything from that point — every answer,
            every recommendation, every promise — goes on your record, and stays yours.
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
            Everything recorded · Timestamped · Yours to keep
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
        <h2 className="mt-4 max-w-[22ch] font-serif text-[2rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[2.7rem]">
          {title}
        </h2>
      )}
    </div>
  );
}
