"use client";

/* ════════════════════════════════════════════════════════════════
   THE DEAL ROOM — buyer-side negotiation, on the record.
   A calm, evidence-first marketing page. The one idea it must land:
   Truth Estate is the only party on the buyer's side of the table.
   Flat-fee, independent, never developer-paid. Voice: understated,
   precise, "less promises, more proof." Every claim hedged & evidenced.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import { useConsultation } from "../consultation/ConsultationProvider";
import { basePath } from "@/lib/site";
import { track } from "@/lib/events";


/* subtle scroll reveal — a restrained fade-up, honours reduced-motion */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, cls: shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4" };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, cls } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`transition-all duration-[900ms] ease-out ${cls} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const STEPS: { n: string; h: string; b: string }[] = [
  { n: "01", h: "You share the mandate", b: "The project, tower, unit and budget you want — or the shortlist you're weighing. Nothing more than what you'd tell your own advisor." },
  { n: "02", h: "We take it to the market", b: "Your mandate goes to our network of brokers and sellers — primary and resale — as a serious, represented buyer. The market competes for your deal." },
  { n: "03", h: "Offers come back, in full", b: "Every offer arrives with a transparent cost break-up and a cashflow comparison — the cheapest sticker is rarely the best deal, and you see why." },
  { n: "04", h: "You review, side by side", b: "All offers on one table, in writing. No pressure, no partial numbers. You decide which one is genuinely yours to take." },
  { n: "05", h: "We help you close", b: "We hold your side through to written confirmation of the final terms — represented by you, accountable to you, the whole way." },
];

const COLUMNS: { role: string; paidBy: string; wants: string; tone: "muted" | "muted" | "us" }[] = [
  { role: "The traditional broker", paidBy: "Paid by the deal", wants: "Wants a closure — any closure. The bigger and faster the deal, the bigger the cut.", tone: "muted" },
  { role: "The property portal", paidBy: "Paid by developers", wants: "Shows what its advertisers pay to promote. The listings are inventory to move, not counsel.", tone: "muted" },
  { role: "The Deal Room", paidBy: "Paid by you — a flat fee", wants: "Optimises one thing: your outcome. No brokerage, no developer bias, no inventory to push.", tone: "us" },
];

const FAQS: { q: string; a: string }[] = [
  { q: "How are you different from a broker?", a: "A broker is paid out of the deal, so a larger, faster purchase pays them more — their incentive sits opposite yours. We charge a flat fee and represent only you, so our only job is to improve your outcome, not to close any deal." },
  { q: "Who pays you?", a: "You do — a flat fee, agreed up front. Not a percentage of the price, not a cut of the deal. That is the whole point: our fee doesn't move with what you pay, so we have no reason to want you to pay more." },
  { q: "Do you take money from developers?", a: "No. We take no brokerage and no promotion money from any developer or seller — ever. It's the line that lets us sit on your side of the table without a conflict." },
  { q: "What kind of savings are realistic?", a: "The room is built to surface offers meaningfully better than a solo buyer typically sees — often in the region of 10–15% versus negotiating alone. That's a capability, not a promise: outcomes depend on the project, the market and timing." },
  { q: "What if the project I want isn't covered?", a: "Tell us anyway. Our network spans primary and resale across most tracked corridors; where we can't yet source a competitive offer, we'll say so plainly rather than pretend otherwise." },
  { q: "Is my information kept private?", a: "Yes. What you share is used only to run your negotiation. We don't sell it, and we don't hand it to developers or brokers beyond the mandate you approve." },
  { q: "What happens after I enter the room?", a: "We confirm your mandate, take it to the market, and bring back offers with full cost break-ups for you to compare. You're never committed to transacting — you decide, in writing, if and when an offer is worth taking." },
];

export default function DealRoom() {
  const { openConsult } = useConsultation();
  const enter = () => openConsult({ sourceKind: "homepage" });

  useEffect(() => { track("deal_room_page_viewed"); }, []);

  return (
    <div className="min-h-screen bg-[#14110d] text-[#f4efe6]" style={{ fontFeatureSettings: '"ss01"' }}>
      {/* ── nav ── */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-10">
        <a href={`${basePath}/`} aria-label="Truth Estate — home"><Logo className="h-9 w-auto opacity-80 md:h-10" /></a>
        <div className="flex items-center gap-6 text-[12px] font-medium tracking-[0.12em] text-[#a9a196]">
          <a href={`${basePath}/intelligence`} className="hidden transition-colors hover:text-[#f4efe6] sm:inline">Truth Intelligence</a>
          <button onClick={enter} className="rounded-full border border-[#a07d2c]/45 bg-[#a07d2c]/[0.12] px-4 py-1.5 text-[#e7cf95] transition-all hover:border-[#c9a24b]/80 hover:bg-[#a07d2c]/25">Get in touch</button>
        </div>
      </nav>

      {/* ═══ 1 · HERO ═══ */}
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 18% 0%, rgba(201,162,75,0.06) 0%, transparent 60%)" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-10 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:pb-32 md:pt-16">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#c9a24b]">The Deal Room · buyer-side negotiation</p>
            <h1 className="mt-7 font-serif text-[2.9rem] font-semibold leading-[1.08] tracking-[-0.01em] text-[#f4efe6] md:text-[4.1rem]">
              You no longer<br />negotiate alone.
            </h1>
            <p className="mt-7 max-w-md font-serif text-[19px] italic leading-[1.6] text-[#cbc2b4] md:text-[21px]">
              One party on your side of the table — independent, flat-fee, and never paid by a developer. We make the market compete for your deal, in writing.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <button onClick={enter} className="rounded-sm bg-[#2f6b4f] px-8 py-4 text-[13px] font-medium tracking-[0.06em] text-[#f4efe6] shadow-lg shadow-black/30 transition-colors hover:bg-[#37805e]">
                Enter the Deal Room
              </button>
              <span className="text-[12.5px] tracking-[0.04em] text-[#a9a196]">No brokerage · no developer money</span>
            </div>
          </Reveal>

          {/* document-card motif */}
          <Reveal delay={150} className="hidden md:block">
            <CertificateCard compact />
          </Reveal>
        </div>
      </header>

      {/* ═══ 2 · VALUE / SAVINGS ═══ */}
      <section className="border-t border-[#f4efe6]/[0.07] bg-[#161309]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a07d2c]">What it’s worth</p>
            <h2 className="mt-6 max-w-3xl font-serif text-[2.1rem] font-medium leading-[1.2] text-[#f4efe6] md:text-[2.9rem]">
              Built to surface offers a solo buyer rarely sees.
            </h2>
            <p className="mt-6 max-w-2xl text-[16px] leading-[1.75] text-[#a9a196]">
              When the market knows it is competing for a serious, represented buyer, the numbers move. The Deal Room is designed to surface offers in the region of{" "}
              <span className="text-[#f4efe6]">10–15% better</span> than what a buyer negotiating alone is typically shown. It’s a capability, not a guarantee — outcomes depend on the project, the market and the timing, and we’ll always tell you which.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              { k: "Potential saving", v: "10–15%", note: "versus a solo buyer, typically" },
              { k: "Our fee", v: "Flat", note: "never a % of your deal" },
              { k: "Developer money taken", v: "₹0", note: "no brokerage, no promotion" },
            ].map((s) => (
              <div key={s.k} className="rounded-md border border-[#f4efe6]/[0.08] bg-[#f4efe6]/[0.02] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a9a196]">{s.k}</p>
                <p className="mt-3 font-serif text-[2.4rem] font-semibold leading-none text-[#c9a24b]">{s.v}</p>
                <p className="mt-2 text-[12.5px] text-[#a9a196]">{s.note}</p>
              </div>
            ))}
          </Reveal>

          {/* placeholder slot — real verified figure & proof to be added later */}
          <Reveal delay={200} className="mt-4">
            <div className="flex flex-col gap-2 rounded-md border border-dashed border-[#a07d2c]/35 bg-[#a07d2c]/[0.05] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] italic text-[#cbc2b4]">Average verified saving across closed rooms — published here once the sample is large enough to stand on the record.</p>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a07d2c]">Proof · coming soon</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ 3 · HOW IT WORKS ═══ */}
      <section className="border-t border-[#f4efe6]/[0.07]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a07d2c]">How the room works</p>
            <h2 className="mt-6 max-w-2xl font-serif text-[2.1rem] font-medium leading-[1.2] text-[#f4efe6] md:text-[2.9rem]">
              The market competes. You decide. Everything in writing.
            </h2>
          </Reveal>
          <div className="mt-14 flex flex-col">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 60}>
                <div className={`grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 py-7 md:grid-cols-[5rem_1fr] ${i < STEPS.length - 1 ? "border-b border-[#f4efe6]/[0.07]" : ""}`}>
                  <span className="font-serif text-[1.4rem] text-[#a07d2c]">{s.n}</span>
                  <div>
                    <h3 className="font-serif text-[1.5rem] font-medium text-[#f4efe6] md:text-[1.7rem]">{s.h}</h3>
                    <p className="mt-2 max-w-xl text-[15px] leading-[1.7] text-[#a9a196]">{s.b}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120} className="mt-10">
            <p className="max-w-2xl text-[14px] italic leading-[1.7] text-[#cbc2b4]">
              Through all of it, Truth Estate represents you — not the seller, not the developer, not the deal. No hidden costs, no numbers we won’t show you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ 4 · WHY IT'S DIFFERENT ═══ */}
      <section className="border-t border-[#f4efe6]/[0.07] bg-[#161309]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a07d2c]">Whose side they’re on</p>
            <h2 className="mt-6 max-w-2xl font-serif text-[2.1rem] font-medium leading-[1.2] text-[#f4efe6] md:text-[2.9rem]">
              Follow the incentive. It tells you everything.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {COLUMNS.map((c, i) => (
              <Reveal key={c.role} delay={i * 90}>
                <div className={`flex h-full flex-col rounded-md border p-7 ${c.tone === "us" ? "border-[#2f6b4f]/50 bg-[#2f6b4f]/[0.08]" : "border-[#f4efe6]/[0.08] bg-[#f4efe6]/[0.02]"}`}>
                  <h3 className="font-serif text-[1.5rem] font-medium text-[#f4efe6]">{c.role}</h3>
                  <p className={`mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${c.tone === "us" ? "text-[#7fc4a1]" : "text-[#a07d2c]"}`}>{c.paidBy}</p>
                  <p className="mt-4 text-[14.5px] leading-[1.7] text-[#a9a196]">{c.wants}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={160} className="mt-10 flex flex-wrap gap-x-10 gap-y-3">
            {["No brokerage", "No developer bias", "No inventory to push"].map((p) => (
              <span key={p} className="flex items-center gap-2 text-[13px] tracking-[0.03em] text-[#cbc2b4]">
                <span className="text-[#c9a24b]">—</span> {p}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ═══ 5 · PRICING ═══ */}
      <section className="border-t border-[#f4efe6]/[0.07]">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center md:px-10 md:py-28">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a07d2c]">What it costs</p>
            <h2 className="mx-auto mt-6 max-w-2xl font-serif text-[2.1rem] font-medium leading-[1.2] text-[#f4efe6] md:text-[3rem]">
              One flat fee. No brokerage. No cut of your deal.
            </h2>
            <p className="mx-auto mt-7 max-w-xl text-[16px] leading-[1.75] text-[#a9a196]">
              We charge a flat fee, agreed before we begin — never a percentage of the price you pay. That single choice is why we can be trusted on your side of the table: our fee doesn’t rise when your price does, so we have nothing to gain from a bigger number.
            </p>
            <div className="mt-10">
              <button onClick={enter} className="rounded-sm bg-[#2f6b4f] px-8 py-4 text-[13px] font-medium tracking-[0.06em] text-[#f4efe6] shadow-lg shadow-black/30 transition-colors hover:bg-[#37805e]">
                Get in touch to know more
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ 6 · PROOF ARTIFACT ═══ */}
      <section className="border-t border-[#f4efe6]/[0.07] bg-[#161309]">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 md:grid-cols-[0.95fr_1.05fr] md:px-10 md:py-28">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a07d2c]">What you walk away with</p>
            <h2 className="mt-6 font-serif text-[2.1rem] font-medium leading-[1.2] text-[#f4efe6] md:text-[2.9rem]">
              A closure certificate — the whole deal, on the record.
            </h2>
            <p className="mt-6 max-w-lg text-[16px] leading-[1.75] text-[#a9a196]">
              Every room ends the same way: a single document with the final terms, a transparent cost break-up, and the written confirmations behind each number. Nothing agreed on a call, nothing left to memory.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <CertificateCard />
          </Reveal>
        </div>
      </section>

      {/* ═══ 7 · FAQ ═══ */}
      <section className="border-t border-[#f4efe6]/[0.07]">
        <div className="mx-auto max-w-3xl px-6 py-24 md:px-10 md:py-28">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a07d2c]">Straight answers</p>
            <h2 className="mt-6 font-serif text-[2.1rem] font-medium leading-[1.2] text-[#f4efe6] md:text-[2.9rem]">Questions worth asking.</h2>
          </Reveal>
          <div className="mt-12">
            {FAQS.map((f, i) => <Faq key={i} q={f.q} a={f.a} last={i === FAQS.length - 1} />)}
          </div>
        </div>
      </section>

      {/* ═══ 8 · CLOSING CTA ═══ */}
      <section className="relative overflow-hidden border-t border-[#f4efe6]/[0.07] bg-[#161309]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 55% 60% at 50% 100%, rgba(47,107,79,0.10) 0%, transparent 65%)" }} />
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center md:px-10 md:py-36">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-serif text-[2.4rem] font-semibold leading-[1.12] text-[#f4efe6] md:text-[3.4rem]">
              The market has always had representation.<br className="hidden md:block" /> Now you do too.
            </h2>
            <p className="mx-auto mt-7 max-w-lg font-serif text-[19px] italic leading-[1.6] text-[#cbc2b4]">
              Independent. Flat-fee. On your side of the table — in writing.
            </p>
            <div className="mt-10">
              <button onClick={enter} className="rounded-sm bg-[#2f6b4f] px-9 py-4 text-[13px] font-medium tracking-[0.06em] text-[#f4efe6] shadow-lg shadow-black/30 transition-colors hover:bg-[#37805e]">
                Enter the Deal Room
              </button>
            </div>
            <p className="mt-14 font-serif text-[15px] italic text-[#8f887c]">Less promises. More proof.</p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* ── the cream document motif — a mock Closure Certificate ── */
function CertificateCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-md rounded-[3px] bg-[#f4efe6] px-8 py-9 text-[#2a2620] shadow-[0_30px_80px_rgba(0,0,0,0.5)] md:px-10 md:py-11" style={{ transform: "rotate(-0.6deg)" }}>
      <div className="pointer-events-none absolute right-6 top-6 opacity-25">
        <svg viewBox="0 0 34 34" width="26" height="26" fill="none" stroke="#a07d2c" strokeWidth="1.4"><rect x="2" y="2" width="30" height="30" rx="1" /><line x1="17" y1="2" x2="17" y2="32" /><line x1="2" y1="17" x2="32" y2="17" /></svg>
      </div>
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.28em] text-[#a07d2c]">Closure Certificate</p>
      <div className="mt-3 h-px w-14 bg-[#a07d2c]/40" />
      <p className="mt-6 font-serif text-[1.9rem] font-semibold leading-none text-[#26221b]">Meridian Gardens</p>
      <p className="mt-1.5 font-serif text-[1.05rem] italic text-[#8a7f68]">Tower B · Unit 1204 · 3 BHK</p>

      <div className="mt-7 space-y-2.5 text-[13px]">
        {[
          ["Quoted price", "₹4.20 Cr", false],
          ["Final negotiated price", "₹3.61 Cr", true],
          ["All-in cost (registry, GST, charges)", "₹4.02 Cr", false],
          ["Written confirmations", "6 of 6", false],
        ].map(([k, v, hi]) => (
          <div key={k as string} className="flex items-baseline justify-between gap-4 border-b border-[#2a2620]/[0.08] pb-2.5">
            <span className="text-[#6f6656]">{k}</span>
            <span className={`font-mono ${hi ? "text-[15px] font-bold text-[#2f6b4f]" : "font-medium text-[#2a2620]"}`}>{v}</span>
          </div>
        ))}
      </div>

      {!compact && (
        <p className="mt-6 text-[11px] leading-[1.6] text-[#8a7f68]">
          Every figure above is backed by a written confirmation on file. Represented, throughout, by the buyer.
        </p>
      )}

      <div className="mt-7 flex items-end justify-between">
        <div>
          <p className="text-[8.5px] uppercase tracking-[0.2em] text-[#a99e88]">Prepared by</p>
          <p className="mt-1 font-serif text-[15px] text-[#5a5344]">Truth Estate</p>
        </div>
        <p className="text-[10px] italic text-[#a99e88]">Illustrative — not a real transaction</p>
      </div>
    </div>
  );
}

function Faq({ q, a, last }: { q: string; a: string; last: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={last ? "" : "border-b border-[#f4efe6]/[0.09]"}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-6 py-5 text-left">
        <span className="font-serif text-[1.15rem] text-[#f4efe6] md:text-[1.3rem]">{q}</span>
        <span className={`shrink-0 text-[#a07d2c] transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="max-w-2xl text-[15px] leading-[1.75] text-[#a9a196]">{a}</p>
        </div>
      </div>
    </div>
  );
}
