"use client";

import { useEffect, useState } from "react";
import Logo from "../Logo";
import RenderVsReality from "../intelligence/RenderVsReality";

/* ════════════════════════════════════════════════════════════════
   INVESTOR MEMORANDUM — the deck is the demo.
   A Truth Estate intelligence file, written about Truth Estate:
   exhibits with takeaway titles, sources on every claim, and a
   self-scored verdict at the close. Twelve exhibits, ~7 minutes.
   ════════════════════════════════════════════════════════════════ */

const basePath = "/Truth-Estate";
const DATA_ROOM = "mailto:gauravjainstartup@gmail.com?subject=Truth%20Estate%20%E2%80%94%20Data%20room%20request";

/* ── shared primitives ── */

function Eyebrow({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "cream" }) {
  return <p className={`font-mono text-[0.6rem] uppercase tracking-[0.24em] ${tone === "gold" ? "text-[#9a7a2e]" : "text-[#d8b978]"}`}>{children}</p>;
}

function Exhibit({ label, title, sub, children, className = "" }: { label: string; title: string; sub?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <section className={`mt-6 rounded-[18px] border border-[#1a1a1a]/10 bg-[#FBF8F2] p-6 sm:p-8 md:p-9 ${className}`} style={{ breakInside: "avoid" }}>
      <Eyebrow>{label}</Eyebrow>
      <h2 className="mt-2.5 font-serif text-[1.45rem] font-medium leading-[1.25] md:text-[1.9rem]">{title}</h2>
      {sub && <p className="mt-2 max-w-[44rem] text-[0.9rem] font-light leading-[1.7] text-[#1a1a1a]/60">{sub}</p>}
      {children}
    </section>
  );
}

function Chapter({ n, title }: { n: string; title: string }) {
  return (
    <div className="mx-auto mt-20 flex max-w-[1060px] items-center gap-4 px-6">
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#1a1a1a]/45">{n} · {title}</span>
      <span className="h-px flex-1 bg-[#1a1a1a]/[0.14]" />
    </div>
  );
}

/* the brochure half of Exhibit 01 — a golden-hour render, drawn in CSS */
function BrochureStandin() {
  const tower = (left: string, width: string, height: string): React.CSSProperties => ({
    position: "absolute", bottom: "8%", left, width, height,
    borderRadius: "4px 4px 0 0",
    background:
      "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 5px, rgba(96,118,126,0.25) 5px 8px)," +
      "repeating-linear-gradient(180deg, rgba(255,255,255,0.12) 0 12px, rgba(70,90,98,0.10) 12px 15px)," +
      "linear-gradient(180deg, #eef0ec 0%, #c4cfc9 100%)",
    boxShadow: "inset -12px 0 20px rgba(26,26,26,0.14), 0 0 0 1px rgba(255,255,255,0.4)",
  });
  return (
    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#f4e6c4 0%,#eee4c9 30%,#d8e0cf 58%,#a9c5ac 100%)" }}>
      <div style={{ position: "absolute", left: "10%", top: "10%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,246,220,0.95) 0%, rgba(244,230,196,0) 65%)" }} />
      <div style={tower("12%", "11%", "72%")} />
      <div style={tower("27%", "9%", "58%")} />
      <div style={tower("40%", "12%", "80%")} />
      <div style={tower("57%", "9%", "64%")} />
      <div style={tower("70%", "11%", "74%")} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "14%", background: "linear-gradient(180deg,#8fb894 0%,#6f9e77 100%)", boxShadow: "inset 0 6px 14px rgba(26,26,26,0.08)" }} />
    </div>
  );
}

/* ── the memo ── */

export default function InvestorMemo() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-svh bg-[#F1EBDF] text-[#1a1a1a]">
      {/* reading progress — the 7-minute promise, kept visibly */}
      <div className="fixed inset-x-0 top-0 z-50 h-[2px] bg-[#1a1a1a]/[0.07] print:hidden">
        <div className="h-full bg-[#9a7a2e] transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <header className="border-b border-[#1a1a1a]/[0.07]">
        <div className="mx-auto flex max-w-[1060px] items-center justify-between px-6 py-5">
          <a href={basePath} aria-label="Truth Estate — Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          <span className="font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#1a1a1a]/40">Private memorandum · not for circulation</span>
        </div>
      </header>

      {/* ═══ COVER ═══ */}
      <section className="mx-auto flex min-h-[86vh] max-w-[1060px] flex-col justify-center px-6 py-20">
        <Eyebrow>Truth Estate · Investor Memorandum · Private &amp; Confidential · H2 2026</Eyebrow>
        <h1 className="mt-8 max-w-[17.5em] font-serif text-[clamp(2.1rem,5.4vw,4rem)] font-medium leading-[1.13] tracking-[-0.015em]">
          India&rsquo;s largest purchases are guided by advice the <em className="not-italic text-[#1e6b45]">seller</em> pays for.<br />
          We are the buyer&rsquo;s side.
        </h1>
        <p className="mt-7 max-w-[36rem] text-[1rem] font-light leading-[1.75] text-[#1a1a1a]/62">
          Truth Estate is independent real-estate intelligence and buyer-side advisory for premium Indian residential — forensic project files, a score no developer can buy, and representation that answers only to the buyer.
        </p>
        <div className="mt-12 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-3.5 py-1.5 font-mono text-[0.6rem] tracking-[0.14em] text-[#1e6b45]">RAISING · CURRENTLY IN CONVERSATION</span>
          <span className="rounded-full border border-[#9a7a2e]/40 bg-[#9a7a2e]/[0.06] px-3.5 py-1.5 font-mono text-[0.6rem] tracking-[0.14em] text-[#9a7a2e]">GURUGRAM FIRST · NRI FOCUS</span>
          <span className="ml-auto font-mono text-[0.6rem] tracking-[0.14em] text-[#1a1a1a]/35">7-MINUTE READ · 12 EXHIBITS</span>
        </div>
      </section>

      {/* ═══ I · THE FOUR GAPS ═══ */}
      <Chapter n="I" title="The four gaps" />
      <div className="mx-auto max-w-[1060px] px-6">

        <Exhibit
          label="Exhibit 01 · The gap, drawn to scale"
          title="What the buyer is shown — and what is actually standing."
          sub={<>Drag the line. Left is the brochure. Right is the same plot from orbit, the day we reviewed it. A ₹6-crore decision is routinely made on the left half alone — guided by a broker the developer pays 2–4%.</>}
        >
          <div className="mt-6">
            <RenderVsReality
              left={<BrochureStandin />}
              right={
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${basePath}/images/aerial-dlf-arbour.webp`} alt="Satellite view of a project site under construction" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "center 42%" }} draggable={false} />
              }
              leftChip="The pitch · artist's impression"
              rightChip="The plot · satellite · Jul 2026"
            />
          </div>
          <p className="mt-3.5 text-[0.78rem] font-light text-[#1a1a1a]/50">Live module from the product — the same slider ships on every project file today.</p>
        </Exhibit>

        <Exhibit
          label="Exhibit 02 · Gap I — Trust · “Everything on record”"
          title="Who do you trust? Every claim we make carries its source."
          sub="The market runs on unrecorded promises from intermediaries with no accountability. Our answer is a mantra the interface itself enforces: nothing ships in a Truth Estate file without a source, a date and a review cycle — and every read can be publicly challenged."
        >
          <div className="mt-6 overflow-x-auto rounded-xl border border-[#1a1a1a]/10">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[1.5fr_1.1fr_130px_130px] gap-4 bg-[#1a1a1a]/[0.03] px-5 py-3">
                {["The claim", "The record", "As of", "Status"].map((h) => (
                  <span key={h} className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-[#1a1a1a]/40">{h}</span>
                ))}
              </div>
              {([
                ["57% built vs 47% RERA-due", "HRERA Quarterly Progress Report", "Q1 2026", "VERIFIED", false],
                ["Supreme-Court possession-delay loss on record", "e-Courts · public litigation repositories", "Jul 2026", "ON FILE", false],
                ["Site progress, seen from orbit", "Satellite capture, dated on the image", "3 Jul 2026", "VERIFIED", false],
                ["Truth Score 92 · Strong Buy", "Five-pillar model · weights published", "Re-scored qtrly", "CHALLENGEABLE", true],
              ] as const).map(([claim, rec, asOf, status, warn]) => (
                <div key={claim} className="grid grid-cols-[1.5fr_1.1fr_130px_130px] items-center gap-4 border-t border-[#1a1a1a]/[0.06] bg-white px-5 py-3.5 text-[0.82rem]">
                  <span className="font-normal">{claim}</span>
                  <span className="font-light text-[#1a1a1a]/55">{rec}</span>
                  <span className="font-mono text-[0.68rem] text-[#1a1a1a]/45">{asOf}</span>
                  <span className={`font-mono text-[0.6rem] tracking-[0.1em] ${warn ? "text-[#9a7a2e]" : "text-[#1e6b45]"}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-r-xl border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.05] px-5 py-3.5 text-[0.88rem] font-light leading-[1.65] text-[#1a1a1a]/70">
            <b className="font-medium text-[#1a1a1a]">Everything on record</b> is not a tagline — it is the product&rsquo;s constitution. A claim without a source cannot ship.
          </div>
        </Exhibit>

        <Exhibit
          label="Exhibit 03 · Gap II — Representation · The empty chair"
          title="Every seat at the table is paid by the seller. Except one, which sat empty."
          sub={<>In an Indian primary transaction the developer, the broker, the channel partner and the marketer all monetise the same event: the buyer saying yes. Nobody is compensated for the buyer saying <i>no</i>. That empty chair is the company.</>}
        >
          <div className="mt-6 rounded-[14px] border border-[#1a1a1a]/[0.08] bg-gradient-to-b from-[#f7f2e7] to-[#efe8d8] p-6 sm:p-7">
            <div className="flex flex-wrap items-stretch gap-3">
              {([
                ["Developer", "SELLS"],
                ["Broker", "PAID BY SELLER · 2–4%"],
                ["Channel partner", "PAID BY SELLER"],
                ["Marketer", "PAID BY SELLER"],
              ] as const).map(([who, pay]) => (
                <div key={who} className="min-w-[128px] flex-1 rounded-xl border border-[#9a7a2e]/35 bg-[#9a7a2e]/[0.09] px-3.5 py-3.5">
                  <p className="text-[0.82rem] font-normal">{who}</p>
                  <p className="mt-1.5 font-mono text-[0.56rem] tracking-[0.1em] text-[#9a7a2e]">{pay}</p>
                </div>
              ))}
              <div className="min-w-[128px] flex-1 rounded-xl border border-[#1e6b45]/45 bg-[#1e6b45]/[0.09] px-3.5 py-3.5">
                <p className="text-[0.82rem] font-normal text-[#1e6b45]">Truth Estate</p>
                <p className="mt-1.5 font-mono text-[0.56rem] tracking-[0.1em] text-[#1e6b45]">FEE FROM THE BUYER ONLY</p>
              </div>
            </div>
            <p className="mt-4 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/50">
              The covenant that makes the seat defensible: no developer can pay us — not for a score, not for placement, not for leads. Advisory fees are refundable if we tell you to walk away.
            </p>
          </div>
        </Exhibit>

        <Exhibit
          label="Exhibit 04 · Gaps III & IV — From scattered data to a closed decision"
          title="The industry ships options. We ship decisions."
          sub={<>Every public fact a buyer needs already exists — scattered across RERA filings, court records, registries and satellite imagery. We bring it under one roof, then take the step nobody else does: AI that closes the decision. Match Score reads <i>your</i> brief, the project file renders a verdict, Unit Intelligence picks tower, floor and stack, and TruthGuide answers what remains.</>}
        >
          <div className="mt-6 grid gap-4 md:grid-cols-[1.15fr_1fr]">
            <div className="relative min-h-[220px] overflow-hidden rounded-[14px] border border-[#1a1a1a]/10 bg-white p-4">
              <div className="grid grid-cols-6 gap-2 opacity-75 blur-[0.6px]">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-md bg-gradient-to-b from-[#1a1a1a]/[0.05] to-[#1a1a1a]/[0.09]" />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/95" />
              <p className="absolute bottom-3.5 left-4 font-mono text-[0.6rem] tracking-[0.16em] text-[#1a1a1a]/50">ANY PORTAL · 40 OPTIONS, ZERO JUDGEMENT · SELLER-SPONSORED ORDER</p>
            </div>
            <div className="flex flex-col rounded-[14px] bg-[#0b1f1a] p-5 text-[#F7F3EA] sm:p-6">
              <p className="font-mono text-[0.58rem] tracking-[0.18em] text-[#d8b978]">TRUTH ESTATE · THE SAME BUYER&rsquo;S ANSWER</p>
              <p className="mt-2.5 font-serif text-[1.5rem] font-medium leading-tight">One decision, on the record.</p>
              <p className="mt-1 text-[0.8rem] font-light text-[#F7F3EA]/60">92/100 · Strong Buy · 87% fit to your brief</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["MATCH SCORE", "PROJECT FILE", "UNIT INTELLIGENCE", "TRUTHGUIDE"].map((c) => (
                  <span key={c} className="rounded-full border border-[#7fd6a4]/40 px-2.5 py-1.5 font-mono text-[0.56rem] tracking-[0.1em] text-[#9fe6bf]">{c}</span>
                ))}
              </div>
              <p className="mt-auto pt-4 text-[0.82rem] font-light text-[#F7F3EA]/75">
                Down to the unit: <b className="font-normal text-[#9fe6bf]">Tower B · mid-stack · east</b> — and the price at which we&rsquo;d walk away.
              </p>
            </div>
          </div>
          <p className="mt-3.5 text-[0.78rem] font-light text-[#1a1a1a]/50">All four surfaces ship today — this panel is assembled from the live product, not a roadmap.</p>
        </Exhibit>
      </div>

      {/* ═══ II · WHY NOW ═══ */}
      <Chapter n="II" title="Why now" />
      <div className="mx-auto max-w-[1060px] px-6">
        <Exhibit
          label="Exhibit 05 · Three forces, one window"
          title="The evidence became public. The buyers became premium. The analysis became cheap."
        >
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {([
              ["2017 →", "The evidence went public", "RERA forced quarterly progress reports, approvals and litigation into the open. A decade later, that exhaust is deep enough to score any project — few have industrialised reading it."],
              ["2021 →", "The buyer went premium", "Post-COVID, premium and NRI demand re-rated Gurugram: bigger tickets, longer horizons, buyers who research the way they invest — and who feel the absence of anyone on their side."],
              ["2023 →", "The analysis went to zero", "AI collapsed the cost of forensic synthesis. A file that took an analyst a week now takes a day — and improves with every file. The corpus compounds; the cost curve doesn't."],
            ] as const).map(([when, t, body]) => (
              <div key={t} className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5">
                <p className="font-mono text-[0.62rem] tracking-[0.14em] text-[#9a7a2e]">{when}</p>
                <p className="mt-2 font-serif text-[1.05rem] font-medium leading-snug">{t}</p>
                <p className="mt-2 text-[0.8rem] font-light leading-[1.65] text-[#1a1a1a]/55">{body}</p>
              </div>
            ))}
          </div>
        </Exhibit>
      </div>

      {/* ═══ III · THE PRODUCT & THE ENGINE ═══ */}
      <Chapter n="III" title="The product, live" />
      <div className="mx-auto max-w-[1060px] px-6">
        <Exhibit
          label="Exhibit 06 · No screenshots — the real thing"
          title="Everything in this memo links to the shipping product."
          sub="Open them in the next tab. The craft is the argument."
        >
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {([
              ["A forensic project file", "Truth Score anatomy, satellite-verified build, floor-plan forensics, price journey, ROI with real cash flows.", `${basePath}/intelligence/projects/dlf-arbour`, "Open the DLF Arbour file"],
              ["A side-by-side comparison", "Two projects on one tape — money, build, homes and the five trust pillars, each row marking its leader.", `${basePath}/intelligence/compare/birla-navya-vs-dlf-arbour`, "Open a live comparison"],
              ["The research desk", "Universal search over projects, developers and corridors; TruthGuide briefs that end in a real report, not a lead form.", `${basePath}/intelligence`, "Open the intelligence desk"],
            ] as const).map(([t, body, href, cta]) => (
              <a key={t} href={href} className="group flex flex-col rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5 transition-colors hover:border-[#1e6b45]/40">
                <p className="font-serif text-[1.05rem] font-medium leading-snug">{t}</p>
                <p className="mt-2 text-[0.8rem] font-light leading-[1.65] text-[#1a1a1a]/55">{body}</p>
                <span className="mt-4 pt-1 text-[0.78rem] font-medium text-[#1e6b45]">{cta} <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span></span>
              </a>
            ))}
          </div>
        </Exhibit>

        <Exhibit
          label="Exhibit 07 · The engine"
          title="One flywheel: public records in, accountability out."
        >
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-4">
            {["Public records + field & satellite data", "Forensic files & Truth Scores", "Buyer trust & readership", "Advisory demand · unit-level data", "Accountability pressure on developers"].map((n, i, arr) => (
              <span key={n} className="flex items-center gap-3">
                <span className="rounded-full border border-[#1a1a1a]/12 bg-white/70 px-4 py-2.5 text-[0.8rem] font-light text-[#1a1a1a]/75">{n}</span>
                {i < arr.length - 1 && <span aria-hidden className="text-[#9a7a2e]">→</span>}
              </span>
            ))}
            <span className="flex items-center gap-3">
              <span aria-hidden className="text-[#9a7a2e]">↺</span>
              <span className="font-mono text-[0.62rem] tracking-[0.12em] text-[#1a1a1a]/45">BETTER RECORDS, RICHER FILES — THE LOOP CLOSES</span>
            </span>
          </div>
          <p className="mt-5 max-w-[46rem] text-[0.85rem] font-light leading-[1.7] text-[#1a1a1a]/60">
            The moat is the loop, not any single node: an independence brand developers cannot buy into, a published method that invites challenge, and a data corpus — files, scores, buyer briefs, unit-level demand — that gets harder to replicate with every quarter it compounds.
          </p>
        </Exhibit>
      </div>

      {/* ═══ IV · MARKET & MODEL ═══ */}
      <Chapter n="IV" title="Market & model" />
      <div className="mx-auto max-w-[1060px] px-6">
        <Exhibit
          label="Exhibit 08 · The wedge, sized honestly"
          title="One corridor is enough to build the category. India is the prize."
          sub="Directional model — every assumption below is a chip an investor can challenge; the full arithmetic lives in the data room."
        >
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5">
              <p className="font-mono text-[0.6rem] tracking-[0.14em] text-[#9a7a2e]">THE BEACHHEAD · GURUGRAM PREMIUM</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["~15–20k premium units absorbed / yr", "₹3.5–5 Cr average ticket"].map((c) => (
                  <span key={c} className="rounded-full border border-[#1a1a1a]/12 bg-white px-3 py-1.5 text-[0.7rem] font-light text-[#1a1a1a]/60">{c}</span>
                ))}
              </div>
              <p className="mt-4 text-[1.5rem] font-normal leading-none tracking-[-0.02em] tabular-nums">₹50–100k Cr<span className="text-[0.8rem] font-light text-[#1a1a1a]/40"> primary GMV / yr</span></p>
            </div>
            <div className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5">
              <p className="font-mono text-[0.6rem] tracking-[0.14em] text-[#9a7a2e]">THE REVENUE POOL WE ADDRESS</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["0.5–1% buyer-side advisory", "files · memberships · unit intel"].map((c) => (
                  <span key={c} className="rounded-full border border-[#1a1a1a]/12 bg-white px-3 py-1.5 text-[0.7rem] font-light text-[#1a1a1a]/60">{c}</span>
                ))}
              </div>
              <p className="mt-4 text-[1.5rem] font-normal leading-none tracking-[-0.02em] tabular-nums text-[#1e6b45]">₹250–1,000 Cr<span className="text-[0.8rem] font-light text-[#1a1a1a]/40"> / yr, one city</span></p>
            </div>
            <div className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5">
              <p className="font-mono text-[0.6rem] tracking-[0.14em] text-[#9a7a2e]">THE EXPANSION PATH</p>
              <p className="mt-3 text-[0.85rem] font-light leading-[1.7] text-[#1a1a1a]/60">
                The playbook is corridor-shaped, not city-shaped: NCR&rsquo;s remaining corridors next, then the top-7 premium markets — the same public-records spine exists in every RERA state. Seller-paid brokerage alone exceeds <span className="tabular-nums">₹1,500–4,000 Cr/yr</span> in Gurugram; we re-route a fraction of that trust to the buyer&rsquo;s side.
              </p>
            </div>
          </div>
        </Exhibit>

        <Exhibit
          label="Exhibit 09 · Business model"
          title="Reports scale like software. Advisory monetises like a fund. One trust asset feeds both."
        >
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Project files", "₹1,499", "per project unlock", "Free in the MVP phase — deliberately: trust and search presence before revenue."],
              ["Buyer's Office membership", "₹11,000", "per buyer / yr", "Every file, match scoring, the office dashboard and TruthGuide."],
              ["Unit Intelligence", "Paid module", "tower · floor · stack", "The 3D decision layer — the step between research and booking."],
              ["Buyer-side advisory", "Fee-based", "refundable by design", "Representation through negotiation and paperwork. The fee returns if our verdict is walk away."],
            ] as const).map(([t, price, unit, body]) => (
              <div key={t} className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5">
                <p className="text-[0.8rem] font-normal">{t}</p>
                <p className="mt-2.5 text-[1.35rem] font-normal leading-none tracking-[-0.02em] tabular-nums text-[#1e6b45]">{price}</p>
                <p className="mt-1 font-mono text-[0.58rem] tracking-[0.12em] text-[#1a1a1a]/40">{unit.toUpperCase()}</p>
                <p className="mt-3 text-[0.74rem] font-light leading-[1.6] text-[#1a1a1a]/55">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-r-xl border-l-2 border-[#9a7a2e] bg-[#9a7a2e]/[0.06] px-5 py-3.5 text-[0.88rem] font-light leading-[1.65] text-[#1a1a1a]/70">
            <b className="font-medium text-[#1a1a1a]">The governance covenant:</b> no developer money, ever — not for scores, not for placement, not for leads. Independence is the balance-sheet asset every revenue line depends on.
          </div>
        </Exhibit>

        <Exhibit
          label="Exhibit 10 · Competition"
          title="Everyone else is paid to make you say yes."
          sub="Both axes are structural, not cosmetic: who pays, and whether the output is inventory or judgement."
        >
          <div className="relative mt-8 h-[340px] rounded-[14px] border border-[#1a1a1a]/10 bg-white/60">
            {/* axes */}
            <span className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-[#1a1a1a]/10" />
            <span className="absolute top-1/2 left-2 right-2 h-px -translate-y-1/2 bg-[#1a1a1a]/10" />
            <span className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[0.54rem] tracking-[0.14em] text-[#1a1a1a]/35">LISTINGS / OPTIONS</span>
            <span className="absolute left-1/2 bottom-3 -translate-x-1/2 font-mono text-[0.54rem] tracking-[0.14em] text-[#1a1a1a]/35">INTELLIGENCE / JUDGEMENT</span>
            <span className="absolute top-1/2 left-3 -translate-y-1/2 -rotate-90 font-mono text-[0.54rem] tracking-[0.14em] text-[#1a1a1a]/35">SELLER-PAID</span>
            <span className="absolute top-1/2 right-3 -translate-y-1/2 rotate-90 font-mono text-[0.54rem] tracking-[0.14em] text-[#9a7a2e]">BUYER-PAID</span>
            {/* clusters */}
            {([
              ["Listing portals", "27%", "20%"],
              ["Broker & CP networks", "25%", "56%"],
              ["Content & video reviewers", "68%", "26%"],
            ] as const).map(([n, left, top]) => (
              <span key={n} className="absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-[#1a1a1a]/15 bg-[#F5F0E8] px-3 py-1.5 text-[0.66rem] font-light text-[#1a1a1a]/55 sm:text-[0.7rem]" style={{ left, top }}>{n}</span>
            ))}
            <span className="absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-[#1e6b45]/50 bg-[#1e6b45]/[0.08] px-3.5 py-2 text-[0.68rem] font-medium text-[#1e6b45] sm:text-[0.74rem]" style={{ left: "66%", top: "72%" }}>Truth Estate — alone here</span>
          </div>
          <p className="mt-4 max-w-[46rem] text-[0.85rem] font-light leading-[1.7] text-[#1a1a1a]/60">
            Portals monetise developer marketing budgets; broker networks monetise closings; reviewers monetise attention. None can move into the buyer-paid-judgement quadrant without burning their existing revenue — the classic incumbent&rsquo;s dilemma, working for us.
          </p>
        </Exhibit>
      </div>

      {/* ═══ V · PROOF & PLAN ═══ */}
      <Chapter n="V" title="Proof & plan" />
      <div className="mx-auto max-w-[1060px] px-6">
        <Exhibit
          label="Exhibit 11 · Traction, first 40 days"
          title="Half the people who open a forensic file finish it."
          sub="First 40 days of the MVP. Reports free by design — the phase is trust and search presence, not revenue. Zero paid marketing."
        >
          <div className="mt-6 flex flex-col gap-3.5">
            {([
              ["Visited the site", 100, "500", "linear-gradient(90deg,#9a7a2e,#c9a96e)", "100%"],
              ["Opened a project file", 25, "125", "linear-gradient(90deg,#1e6b45,#238c55)", "25% of visitors"],
              ["Read it to the end", 12.5, "62", "linear-gradient(90deg,#0b1f1a,#1e6b45)", "50% of readers"],
            ] as const).map(([label, w, n, bg, note]) => (
              <div key={label} className="grid grid-cols-[130px_1fr_86px] items-center gap-3 sm:grid-cols-[190px_1fr_130px] sm:gap-4">
                <span className="text-[0.78rem] font-light text-[#1a1a1a]/65 sm:text-[0.84rem]">{label}</span>
                <div className="h-[34px] overflow-hidden rounded-lg bg-[#1a1a1a]/[0.05]">
                  <div className="flex h-full items-center rounded-lg pl-3.5 text-[0.86rem] tabular-nums text-white" style={{ width: `${w}%`, background: bg, minWidth: "3.2rem" }}>{n}</div>
                </div>
                <span className="text-right font-mono text-[0.62rem] leading-snug text-[#1e6b45] sm:text-[0.7rem]">{note}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-r-xl border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.05] px-5 py-3.5 text-[0.88rem] font-light leading-[1.65] text-[#1a1a1a]/70">
            <b className="font-medium text-[#1a1a1a]">The number that matters is the last one.</b> These are 8,000-word forensic documents, and one in two people who start them reach the final section. Attention of that depth, this early, is the leading indicator of willingness to pay for judgement.
          </div>
          <p className="mt-4 text-[0.78rem] font-light italic text-[#1a1a1a]/45">Buyer testimonials are being collected verbatim, with permission — available in the data room.</p>
        </Exhibit>

        <Exhibit
          label="Exhibit 12 · The ask"
          title="Raising — currently in conversation."
          sub="Terms are being discussed with early partners; the memo states use of funds and milestones rather than a number."
        >
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="font-mono text-[0.6rem] tracking-[0.16em] text-[#1a1a1a]/45">USE OF FUNDS</p>
              <div className="mt-4 flex flex-col gap-3.5">
                {([
                  ["Data & field operations", 35, "site visits, satellite cadence, corpus to 100+ files"],
                  ["Engineering & AI", 30, "unit intelligence depth, TruthGuide, the scoring engine"],
                  ["Advisory bench", 20, "buyer-side advisors — the human layer trust converts into"],
                  ["Brand & distribution", 15, "SEO moat, NRI channels, the record made public"],
                ] as const).map(([l, pct, note]) => (
                  <div key={l}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[0.84rem] font-light text-[#1a1a1a]/70">{l}</span>
                      <span className="font-mono text-[0.7rem] tabular-nums text-[#1a1a1a]/50">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-[8px] overflow-hidden rounded bg-[#1a1a1a]/[0.06]">
                      <div className="h-full rounded" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#1e6b45,#238c55)" }} />
                    </div>
                    <p className="mt-1 text-[0.68rem] font-light text-[#1a1a1a]/40">{note}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[0.6rem] tracking-[0.16em] text-[#1a1a1a]/45">MILESTONES THIS ROUND BUYS</p>
              <ul className="mt-4 flex flex-col gap-3">
                {[
                  "The corpus: 100+ forensic files covering every premium NCR corridor",
                  "A paying advisory cohort with published, auditable outcomes",
                  "Unit Intelligence as the category's decision standard",
                  "Quarterly metrics in the data room — the record, kept on ourselves too",
                ].map((m) => (
                  <li key={m} className="flex gap-3 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70">
                    <span aria-hidden className="mt-0.5 text-[#1e6b45]">+</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Exhibit>

        {/* the founder */}
        <section className="mt-6 rounded-[18px] border border-[#1a1a1a]/10 bg-[#FBF8F2] p-6 sm:p-8" style={{ breakInside: "avoid" }}>
          <div className="flex flex-wrap items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${basePath}/images/founder-gaurav.webp`} alt="Gaurav Jain, founder of Truth Estate" className="h-16 w-16 rounded-full border-2 border-[#B29668]/60 object-cover" />
            <div className="min-w-0 flex-1">
              <Eyebrow>The Independent Desk</Eyebrow>
              <p className="mt-1 font-serif text-[1.25rem] font-medium">Gaurav Jain · Founder</p>
              <p className="mt-1 max-w-[38rem] text-[0.85rem] font-light leading-[1.65] text-[#1a1a1a]/60">
                Every file crosses the founder&rsquo;s desk before it ships. Independent — no inventory, no builder commission. The same desk answers to investors: ask anything, challenge any read.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ THE VERDICT ═══ */}
        <section className="mt-6 rounded-[18px] bg-[#0b1f1a] p-7 text-[#F7F3EA] sm:p-9 md:p-10" style={{ breakInside: "avoid" }}>
          <Eyebrow tone="cream">Exhibit — final · The Truth Estate file on Truth Estate</Eyebrow>
          <h2 className="mt-3 font-serif text-[1.5rem] font-medium leading-tight md:text-[2rem]">We rate real estate for a living. Here is our own file.</h2>
          <div className="mt-7">
            {([
              ["Problem severity", 9.6, "Largest household purchase in India; the buyer's side is structurally unrepresented."],
              ["Timing", 9.3, "RERA's public data exhaust matured; premium & NRI demand at decade highs; AI collapsed research cost."],
              ["Moat", 8.7, "Independence is a covenant, not a claim — developers cannot pay us. Brand + method + data compound."],
              ["Early signal", 8.4, "50% read-through on forensic files, 40 days in, ₹0 spent."],
              ["Economics", 8.6, "Reports scale like software; advisory monetises like a fund — one trust asset feeds both."],
            ] as const).map(([name, score, why], i) => (
              <div key={name} className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-3.5 ${i > 0 ? "border-t border-[#F7F3EA]/[0.12]" : ""}`}>
                <span className="text-[0.92rem] font-light text-[#F7F3EA]/85">{name}</span>
                <span className="hidden h-[6px] w-[130px] overflow-hidden rounded bg-[#F7F3EA]/[0.14] sm:block">
                  <span className="block h-full rounded" style={{ width: `${score * 10}%`, background: "linear-gradient(90deg,#1e6b45,#7fd6a4)" }} />
                </span>
                <span className="font-mono text-[1.05rem] tabular-nums text-[#7fd6a4]">{score.toFixed(1)}<span className="text-[0.66rem] text-[#F7F3EA]/40">/10</span></span>
                <span className="col-span-full -mt-0.5 pb-1 text-[0.72rem] font-light text-[#F7F3EA]/45">{why}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <span className="rounded-full border border-[#7fd6a4]/45 bg-[#1e6b45]/35 px-5 py-2.5 text-[0.8rem] tracking-[0.06em] text-[#9fe6bf]">● STRONG BUY — our read, applied to ourselves</span>
            <a href={DATA_ROOM} className="ml-auto rounded-lg bg-[#1e6b45] px-6 py-3.5 text-[0.86rem] font-medium text-white transition-colors hover:bg-[#238c55] print:hidden">
              Request the data room →
            </a>
          </div>
          <p className="mt-5 max-w-[52rem] text-[0.7rem] font-light leading-[1.65] text-[#F7F3EA]/40">
            Scores are our own, produced with the same discipline we apply to any asset — and just as open to challenge. The data room carries the model, the method and the numbers behind every exhibit.
          </p>
        </section>

        <footer className="py-14 text-center text-[0.72rem] font-light leading-[1.8] text-[#1a1a1a]/40">
          Private &amp; confidential — prepared for conversations in progress; please don&rsquo;t circulate. Figures marked directional are modelled, with sources and arithmetic in the data room.
          <br />Truth Estate · Gurugram · <a href={DATA_ROOM} className="underline decoration-[#9a7a2e]/40 underline-offset-2 hover:text-[#1a1a1a]/70">Request the data room</a>
        </footer>
      </div>
    </div>
  );
}
