"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import { ADVISORS, PRIMARY_CTA } from "@/lib/journey";

const PILLARS = [
  { k: "Independent", v: "We take zero developer commissions. Our only incentive is your outcome." },
  { k: "Evidence-led", v: "Every view traces to delivery records, pricing data and legal filings — not marketing." },
  { k: "On the record", v: "RERA, title and financials, verified and documented. You keep the proof." },
  { k: "On your side", v: "One dedicated advisor, accountable to you from first question to final signature." },
];

export default function TrustClose() {
  const { open } = useJourney();
  return (
    <section id="advisory" className="relative overflow-hidden bg-[#0a0a0a] px-6 py-24 md:px-10 md:py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 55% 45% at 50% 100%, rgba(201,169,110,0.08) 0%, transparent 60%)" }}
      />
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Advisory */}
        <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#c9a96e]">The Human Layer</p>
        <h2 className="mt-6 max-w-3xl font-serif text-[2.3rem] font-medium leading-[1.1] tracking-[-0.015em] text-white md:text-[3.4rem]">
          Intelligence, then judgement.
        </h2>
        <p className="mt-6 max-w-xl text-[0.98rem] font-light leading-[1.8] text-white/45">
          Data narrows the field. A seasoned, independent advisor — who answers
          only to you — helps you make the call.
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/8 bg-white/8 sm:grid-cols-3">
          {ADVISORS.map((a) => (
            <div key={a.name} className="bg-[#0d0d0f] p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a96e]/30 font-serif text-[0.95rem] text-[#c9a96e]">{a.initials}</span>
                <div>
                  <p className="text-[0.95rem] text-white/90">{a.name}</p>
                  <p className="font-mono text-[0.66rem] tracking-[0.04em] text-white/35">{a.experience.toUpperCase()}</p>
                </div>
              </div>
              <p className="mt-5 text-[0.86rem] font-light leading-[1.6] text-white/55">{a.specialisation}</p>
              <p className="mt-3 text-[0.74rem] font-light text-white/30">{a.languages.join(" · ")}</p>
            </div>
          ))}
        </div>

        {/* Trust pillars */}
        <div className="mt-20 grid gap-x-10 gap-y-10 border-t border-white/8 pt-16 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.k}>
              <p className="font-serif text-[1.25rem] text-white/90">{p.k}</p>
              <p className="mt-3 text-[0.86rem] font-light leading-[1.7] text-white/45">{p.v}</p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-24 flex flex-col items-center text-center">
          <h2 className="max-w-3xl font-serif text-[2.6rem] font-medium leading-[1.08] tracking-[-0.02em] text-white md:text-[4rem]">
            Make the decision
            <br />
            <span className="text-[#c9a96e]">you won&apos;t second-guess.</span>
          </h2>
          <div className="mt-11 flex flex-wrap items-center justify-center gap-6">
            <button onClick={() => open()} className="rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.06em] text-white shadow-lg shadow-black/40 transition-all duration-300 hover:bg-[#238c55]">
              {PRIMARY_CTA}
            </button>
            <button onClick={() => open("research")} className="text-[13px] tracking-[0.04em] text-white/55 transition-colors hover:text-white/85">
              Ask TruthGuide first &rarr;
            </button>
          </div>
        </div>

        {/* Foot */}
        <div className="mt-24 flex flex-col items-center gap-5 border-t border-white/8 pt-12 text-center">
          <Logo className="h-8 w-auto opacity-60" />
          <p className="max-w-md text-[0.78rem] font-light leading-[1.7] text-white/30">
            Truth Estate is an independent real estate intelligence and advisory firm.
            We are not a broker, a portal, or a developer. We work for you.
          </p>
          <p className="font-mono text-[0.66rem] tracking-[0.1em] text-white/20">PROOF · NOT PROMISES</p>
        </div>
      </div>
    </section>
  );
}
