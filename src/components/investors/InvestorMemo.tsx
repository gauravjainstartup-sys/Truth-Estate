"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import RenderVsReality from "../intelligence/RenderVsReality";

/* ════════════════════════════════════════════════════════════════
   INVESTOR MEMORANDUM — presented as a deck, sized for the room.
   Sixteen scroll-snap frames. Desktop (lg+) runs the presentation
   scale: bigger frame, ~1.35× type, drawn set-pieces (the boardroom
   table, the timeline, the flywheel ring, the market rings) and
   slide-entry motion. Phones keep the reading scale. Cmd+P still
   yields a page-per-slide PDF.
   ════════════════════════════════════════════════════════════════ */

const basePath = "/Truth-Estate";
const DATA_ROOM = "mailto:gauravjainstartup@gmail.com?subject=Truth%20Estate%20%E2%80%94%20Data%20room%20request";

/* ── primitives ── */

function Eyebrow({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "cream" }) {
  return <p className={`font-mono text-[0.58rem] uppercase tracking-[0.24em] lg:text-[0.72rem] ${tone === "gold" ? "text-[#9a7a2e]" : "text-[#d8b978]"}`}>{children}</p>;
}

/* the exhibit card that fills a slide; `bare` drops the panel chrome
   for slides that sit on a full-bleed backdrop */
function Card({ label, title, sub, children, dark = false, bare = false }: { label: string; title: string; sub?: React.ReactNode; children?: React.ReactNode; dark?: boolean; bare?: boolean }) {
  return (
    <div className={`rounded-[18px] p-6 sm:p-8 md:p-9 lg:p-12 ${bare ? "" : dark ? "bg-[#0b1f1a]" : "border border-[#1a1a1a]/10 bg-[#FBF8F2]"} ${dark ? "text-[#F7F3EA]" : ""}`} style={{ breakInside: "avoid" }}>
      <Eyebrow tone={dark ? "cream" : "gold"}>{label}</Eyebrow>
      <h2 className="mt-2.5 font-serif text-[1.4rem] font-medium leading-[1.22] md:text-[1.8rem] lg:mt-4 lg:text-[2.6rem]">{title}</h2>
      {sub && <p className={`mt-2 max-w-[50rem] text-[0.88rem] font-light leading-[1.65] lg:mt-3.5 lg:text-[1.08rem] ${dark ? "text-[#F7F3EA]/60" : "text-[#1a1a1a]/60"}`}>{sub}</p>}
      {children}
    </div>
  );
}

function ProductCard({ name, what, trust, only, href, className = "", children }: { name: string; what: string; trust: string; only?: boolean; href: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5 lg:p-6 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
        <p className="font-serif text-[1.1rem] font-medium lg:text-[1.35rem]">{name}</p>
        {only && <span className="rounded-full border border-[#9a7a2e]/40 bg-[#9a7a2e]/[0.07] px-2.5 py-1 font-mono text-[0.5rem] tracking-[0.12em] text-[#9a7a2e] lg:text-[0.6rem]">NOBODY ELSE SHIPS THIS</span>}
      </div>
      <p className="mt-1 text-[0.84rem] font-light text-[#1a1a1a]/60 lg:text-[1rem]">{what}</p>
      <div className="mt-4 lg:mt-5">{children}</div>
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#1a1a1a]/[0.07] pt-3 lg:mt-5">
        <span className="min-w-0 font-mono text-[0.54rem] leading-[1.6] tracking-[0.1em] text-[#1e6b45] lg:text-[0.66rem]">TRUST BUILT: {trust.toUpperCase()}</span>
        <a href={href} className="shrink-0 text-[0.74rem] font-medium text-[#1e6b45] hover:underline lg:text-[0.86rem]">Live →</a>
      </div>
    </div>
  );
}

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

/* growth bar that sweeps in when its slide becomes active */
function Bar({ w, bg, children, h = "h-[34px] lg:h-[52px]" }: { w: number; bg: string; children?: React.ReactNode; h?: string }) {
  return (
    <div className={`${h} overflow-hidden rounded-lg bg-[#1a1a1a]/[0.05]`}>
      <div
        className={`flex h-full origin-left items-center rounded-lg pl-3.5 text-[0.86rem] tabular-nums text-white transition-transform duration-700 ease-out lg:scale-x-0 lg:text-[1.05rem] lg:group-data-[active=true]:scale-x-100 motion-reduce:scale-x-100 print:scale-x-100`}
        style={{ width: `${w}%`, background: bg, minWidth: "3.2rem" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── set-piece: the boardroom table (Exhibit 03, lg+) ── */
function BoardTable() {
  const chair = (left: string, top: string, label: string, pay: string, us = false) => (
    <div key={label} className="absolute flex -translate-x-1/2 flex-col items-center gap-1.5 text-center" style={{ left, top }}>
      <span className={`h-11 w-11 rounded-full border-2 lg:h-14 lg:w-14 ${us ? "border-[#1e6b45] bg-[#1e6b45]/[0.14]" : "border-[#9a7a2e]/60 bg-[#9a7a2e]/[0.13]"}`} />
      <span className={`text-[0.66rem] font-normal leading-tight lg:text-[0.8rem] ${us ? "text-[#1e6b45]" : ""}`}>{label}</span>
      <span className={`max-w-[130px] font-mono text-[0.5rem] leading-snug tracking-[0.08em] lg:text-[0.58rem] ${us ? "text-[#1e6b45]" : "text-[#9a7a2e]"}`}>{pay}</span>
    </div>
  );
  return (
    <div className="relative mx-auto mt-2 h-[330px] w-full max-w-[880px] lg:h-[400px]">
      <div className="absolute left-1/2 top-[47%] h-[38%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#b9a67d]/50 bg-gradient-to-b from-[#f0e7d3] to-[#e2d5ba] shadow-[inset_0_10px_30px_rgba(26,26,26,0.07)]">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[0.54rem] tracking-[0.22em] text-[#1a1a1a]/30 lg:text-[0.64rem]">THE PRIMARY TRANSACTION</span>
      </div>
      {chair("13%", "4%", "Developer", "SELLS")}
      {chair("37%", "0%", "Broker", "PAID BY SELLER · 2–4%")}
      {chair("62%", "0%", "Channel partner", "PAID BY SELLER")}
      {chair("86%", "4%", "Marketer", "PAID BY SELLER")}
      {chair("50%", "72%", "Truth Estate", "FEE FROM THE BUYER ONLY — THE SEAT THAT SAT EMPTY", true)}
    </div>
  );
}

/* ── set-piece: why-now timeline (lg+) ── */
function Timeline() {
  const node = (left: string, year: string, title: string, body: string) => (
    <div key={year} className="absolute w-[240px] -translate-x-1/2" style={{ left }}>
      <div className="mx-auto h-3.5 w-3.5 rounded-full border-2 border-[#9a7a2e] bg-[#F7F3EA]" />
      <p className="mt-3 text-center font-mono text-[0.72rem] tracking-[0.14em] text-[#9a7a2e]">{year}</p>
      <p className="mt-1.5 text-center font-serif text-[1.15rem] font-medium leading-snug">{title}</p>
      <p className="mt-1.5 text-center text-[0.82rem] font-light leading-[1.6] text-[#1a1a1a]/55">{body}</p>
    </div>
  );
  return (
    <div className="relative mt-4 hidden h-[290px] lg:block">
      <div className="absolute left-[4%] right-[4%] top-[6px] h-px bg-gradient-to-r from-[#9a7a2e]/20 via-[#9a7a2e]/60 to-[#1e6b45]" />
      {node("16%", "2017", "The evidence went public", "RERA pushed progress, approvals and litigation into the open — a decade of exhaust few have industrialised.")}
      {node("44%", "2021", "The buyer went premium", "Premium and NRI demand re-rated Gurugram: bigger tickets, research-first buyers, nobody on their side.")}
      {node("72%", "2023", "The analysis went to zero", "AI collapsed the cost of forensic synthesis — a week of analysis now takes a day, and compounds.")}
      <div className="absolute right-[1%] top-[-7px] flex -translate-y-0 flex-col items-center">
        <span className="h-7 w-px bg-[#1e6b45]" />
        <span className="mt-2 rounded-full border border-[#1e6b45]/45 bg-[#1e6b45]/[0.08] px-3.5 py-1.5 font-mono text-[0.62rem] tracking-[0.14em] text-[#1e6b45]">2026 · THE WINDOW OPENS</span>
      </div>
    </div>
  );
}

/* ── set-piece: the flywheel ring (lg+) ── */
function FlywheelRing() {
  const NODES: { x: number; y: number; label: string }[] = [
    { x: 500, y: 70, label: "Public records + field & satellite data" },
    { x: 861, y: 174, label: "Forensic files & Truth Scores" },
    { x: 723, y: 341, label: "Buyer trust & readership" },
    { x: 277, y: 341, label: "Advisory demand · unit-level data" },
    { x: 139, y: 174, label: "Accountability pressure on developers" },
  ];
  const ARROWS: { x: number; y: number; a: number }[] = [
    { x: 723, y: 99, a: 16 },
    { x: 861, y: 266, a: 130 },
    { x: 500, y: 370, a: 180 },
    { x: 139, y: 266, a: 230 },
    { x: 277, y: 99, a: -16 },
  ];
  return (
    <div className="relative mt-2 hidden h-[440px] lg:block">
      <svg viewBox="0 0 1000 440" className="absolute inset-0 h-full w-full" aria-hidden>
        <ellipse cx="500" cy="220" rx="380" ry="150" fill="none" stroke="#9a7a2e" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="3 8" />
        {ARROWS.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.a})`}>
            <path d="M-7,-5 L9,0 L-7,5 Z" fill="#9a7a2e" />
          </g>
        ))}
      </svg>
      <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[#0b1f1a] shadow-[0_24px_60px_-20px_rgba(11,31,26,0.55)]">
        <span className="font-mono text-[0.78rem] tracking-[0.3em] text-[#d8b978]">TRUST</span>
        <span className="mt-1 px-3 text-center text-[0.56rem] font-light leading-snug text-[#F7F3EA]/50">the compounding asset</span>
      </div>
      {NODES.map((n) => (
        <div key={n.label} className="absolute w-[220px] -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.x / 10}%`, top: `${(n.y / 440) * 100}%` }}>
          <p className="rounded-full border border-[#1a1a1a]/12 bg-white/80 px-4 py-2.5 text-center text-[0.82rem] font-light leading-snug text-[#1a1a1a]/75 backdrop-blur-[2px]">{n.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── set-piece: market rings (lg+) ── */
function MarketRings() {
  return (
    <svg viewBox="0 0 420 420" className="h-full w-full" role="img" aria-label="Concentric markets: Gurugram premium inside NCR inside India's top seven cities">
      <circle cx="210" cy="210" r="188" fill="rgba(255,255,255,0.35)" stroke="#1a1a1a" strokeOpacity="0.16" strokeWidth="1" strokeDasharray="2 6" />
      <circle cx="210" cy="210" r="128" fill="rgba(154,122,46,0.06)" stroke="#9a7a2e" strokeOpacity="0.4" strokeWidth="1" />
      <circle cx="210" cy="210" r="70" fill="rgba(30,107,69,0.12)" stroke="#1e6b45" strokeOpacity="0.6" strokeWidth="1.5" />
      <text x="210" y="38" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace" fontSize="11" letterSpacing="2" fill="rgba(26,26,26,0.4)">TOP-7 INDIA</text>
      <text x="210" y="98" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace" fontSize="11" letterSpacing="2" fill="#9a7a2e">NCR</text>
      <text x="210" y="196" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace" fontSize="10.5" letterSpacing="1.5" fill="#1e6b45">GURUGRAM PREMIUM</text>
      <text x="210" y="222" textAnchor="middle" fontFamily="inherit" fontSize="21" fontWeight="500" fill="#1e6b45">₹250–1,000 Cr</text>
      <text x="210" y="242" textAnchor="middle" fontFamily="inherit" fontSize="11" fontWeight="300" fill="rgba(26,26,26,0.5)">revenue pool / yr</text>
    </svg>
  );
}

/* ── slide contents ── */

function SlideCover() {
  return (
    <div className="w-full">
      <Eyebrow>Truth Estate · Investor Memorandum · Private &amp; Confidential · H2 2026</Eyebrow>
      <h1 className="mt-7 max-w-[16em] font-serif text-[clamp(1.9rem,5vw,4.4rem)] font-medium leading-[1.12] tracking-[-0.015em]">
        India&rsquo;s largest purchases are guided by advice the <em className="not-italic text-[#1e6b45]">seller</em> pays for.<br />
        We are the buyer&rsquo;s side.
      </h1>
      <p className="mt-6 max-w-[40rem] text-[0.98rem] font-light leading-[1.75] text-[#1a1a1a]/62 lg:mt-8 lg:text-[1.2rem]">
        Independent intelligence and buyer-side advisory for premium Indian residential. A score no developer can buy; representation that answers only to the buyer.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-3 lg:mt-12">
        <span className="rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-3.5 py-1.5 font-mono text-[0.6rem] tracking-[0.14em] text-[#1e6b45] lg:px-4 lg:py-2 lg:text-[0.72rem]">RAISING · CURRENTLY IN CONVERSATION</span>
        <span className="rounded-full border border-[#9a7a2e]/40 bg-[#9a7a2e]/[0.06] px-3.5 py-1.5 font-mono text-[0.6rem] tracking-[0.14em] text-[#9a7a2e] lg:px-4 lg:py-2 lg:text-[0.72rem]">GURUGRAM FIRST · NRI FOCUS</span>
      </div>
    </div>
  );
}

type Slide = { key: string; node: React.ReactNode; backdrop?: "cream" | "emerald" };

const SLIDES: Slide[] = [
  { key: "cover", node: <SlideCover />, backdrop: "cream" },

  {
    key: "gap-scale",
    node: (
      <Card label="I · The four gaps — Exhibit 01 · Drawn to scale" title="What the buyer is shown — and what is actually standing."
        sub={<>Drag the line. Left: the brochure. Right: the same plot from orbit. ₹6-crore decisions are made on the left half alone.</>}>
        <div className="mt-5 lg:mt-7">
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
        <p className="mt-3 text-[0.76rem] font-light text-[#1a1a1a]/50 lg:text-[0.9rem]">Live module from the product — the same slider ships on every project file today.</p>
      </Card>
    ),
  },

  {
    key: "gap-trust",
    node: (
      <Card label="I · The four gaps — Exhibit 02 · Trust" title="Who do you trust? Every claim we make carries its source."
        sub="Nothing ships without a source, a date and a review cycle — and every read can be challenged.">
        <div className="mt-5 overflow-x-auto rounded-xl border border-[#1a1a1a]/10 lg:mt-7">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[1.5fr_1.1fr_150px_150px] gap-4 bg-[#1a1a1a]/[0.03] px-5 py-3 lg:px-6 lg:py-3.5">
              {["The claim", "The record", "As of", "Status"].map((h) => (
                <span key={h} className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-[#1a1a1a]/40 lg:text-[0.66rem]">{h}</span>
              ))}
            </div>
            {([
              ["57% built vs 47% RERA-due", "HRERA Quarterly Progress Report", "Q1 2026", "VERIFIED", false],
              ["Supreme-Court possession-delay loss on record", "e-Courts · public litigation repositories", "Jul 2026", "ON FILE", false],
              ["Site progress, seen from orbit", "Satellite capture, dated on the image", "3 Jul 2026", "VERIFIED", false],
              ["Truth Score 92 · Strong Buy", "Five-pillar model · weights published", "Re-scored qtrly", "CHALLENGEABLE", true],
            ] as const).map(([claim, rec, asOf, status, warn]) => (
              <div key={claim} className="grid grid-cols-[1.5fr_1.1fr_150px_150px] items-center gap-4 border-t border-[#1a1a1a]/[0.06] bg-white px-5 py-3.5 text-[0.82rem] lg:px-6 lg:py-4 lg:text-[1rem]">
                <span className="font-normal">{claim}</span>
                <span className="font-light text-[#1a1a1a]/55">{rec}</span>
                <span className="font-mono text-[0.68rem] text-[#1a1a1a]/45 lg:text-[0.8rem]">{asOf}</span>
                <span className={`font-mono text-[0.6rem] tracking-[0.1em] lg:text-[0.72rem] ${warn ? "text-[#9a7a2e]" : "text-[#1e6b45]"}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-r-xl border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.05] px-5 py-3 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70 lg:mt-6 lg:px-6 lg:py-4 lg:text-[1.05rem]">
          <b className="font-medium text-[#1a1a1a]">Everything on record</b>{" "}is not a tagline — it is the product&rsquo;s constitution. A claim without a source cannot ship.
        </div>
      </Card>
    ),
  },

  {
    key: "gap-chair",
    node: (
      <Card label="I · The four gaps — Exhibit 03 · Representation" title="Every seat at the table is paid by the seller. Except one, which sat empty."
        sub={<>Four parties monetise the buyer&rsquo;s yes. Nobody is paid for the buyer&rsquo;s <i>no</i>.</>}>
        {/* phones: the seat tiles · desktop: the table, drawn from above */}
        <div className="mt-6 lg:hidden">
          <div className="rounded-[14px] border border-[#1a1a1a]/[0.08] bg-gradient-to-b from-[#f7f2e7] to-[#efe8d8] p-6">
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
          </div>
        </div>
        <div className="hidden lg:block"><BoardTable /></div>
        <p className="mt-4 text-[0.8rem] font-light leading-[1.6] text-[#1a1a1a]/50 lg:mt-2 lg:text-[0.95rem]">
          The covenant: no developer money, ever. Advisory fees are refundable if our verdict is walk away.
        </p>
      </Card>
    ),
  },

  {
    key: "gap-decision",
    node: (
      <Card label="I · The four gaps — Exhibit 04 · Data & decisions" title="The industry ships options. We ship decisions."
        sub={<>All the public facts under one roof — then AI that closes the decision instead of listing options.</>}>
        <div className="mt-6 grid gap-4 md:grid-cols-[1.15fr_1fr] lg:mt-8 lg:gap-6">
          <div className="relative min-h-[200px] overflow-hidden rounded-[14px] border border-[#1a1a1a]/10 bg-white p-4 lg:min-h-[280px]">
            <div className="grid grid-cols-6 gap-2 opacity-75 blur-[0.6px] lg:gap-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="h-11 rounded-md bg-gradient-to-b from-[#1a1a1a]/[0.05] to-[#1a1a1a]/[0.09] lg:h-14" />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/95" />
            <p className="absolute bottom-3.5 left-4 font-mono text-[0.6rem] tracking-[0.16em] text-[#1a1a1a]/50 lg:text-[0.7rem]">ANY PORTAL · 40 OPTIONS, ZERO JUDGEMENT</p>
          </div>
          <div className="flex flex-col rounded-[14px] bg-[#0b1f1a] p-5 text-[#F7F3EA] sm:p-6 lg:p-7">
            <p className="font-mono text-[0.58rem] tracking-[0.18em] text-[#d8b978] lg:text-[0.68rem]">TRUTH ESTATE · THE SAME BUYER&rsquo;S ANSWER</p>
            <p className="mt-2.5 font-serif text-[1.5rem] font-medium leading-tight lg:text-[2rem]">One decision, on the record.</p>
            <p className="mt-1 text-[0.8rem] font-light text-[#F7F3EA]/60 lg:text-[0.95rem]">92/100 · Strong Buy · 87% fit to your brief</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["MATCH SCORE", "PROJECT FILE", "UNIT INTELLIGENCE", "TRUTHGUIDE"].map((c) => (
                <span key={c} className="rounded-full border border-[#7fd6a4]/40 px-2.5 py-1.5 font-mono text-[0.56rem] tracking-[0.1em] text-[#9fe6bf] lg:text-[0.66rem]">{c}</span>
              ))}
            </div>
            <p className="mt-auto pt-4 text-[0.82rem] font-light text-[#F7F3EA]/75 lg:text-[0.98rem]">
              Down to the unit: <b className="font-normal text-[#9fe6bf]">Tower B · mid-stack · east</b>{" "}— and the price at which we&rsquo;d walk away.
            </p>
          </div>
        </div>
      </Card>
    ),
  },

  {
    key: "why-now",
    node: (
      <Card label="II · Why now — Exhibit 05" title="The evidence became public. The buyers became premium. The analysis became cheap.">
        {/* phones: cards · desktop: the timeline */}
        <div className="mt-6 grid gap-4 md:grid-cols-3 lg:hidden">
          {([
            ["2017 →", "The evidence went public", "RERA pushed progress, approvals and litigation into the open — a decade of exhaust few have industrialised."],
            ["2021 →", "The buyer went premium", "Premium and NRI demand re-rated Gurugram: bigger tickets, research-first buyers, nobody on their side."],
            ["2023 →", "The analysis went to zero", "AI collapsed the cost of forensic synthesis — a week of analysis now takes a day, and compounds."],
          ] as const).map(([when, t, body]) => (
            <div key={t} className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5">
              <p className="font-mono text-[0.62rem] tracking-[0.14em] text-[#9a7a2e]">{when}</p>
              <p className="mt-2 font-serif text-[1.05rem] font-medium leading-snug">{t}</p>
              <p className="mt-2 text-[0.8rem] font-light leading-[1.65] text-[#1a1a1a]/55">{body}</p>
            </div>
          ))}
        </div>
        <Timeline />
      </Card>
    ),
  },

  {
    key: "products-1",
    node: (
      <Card label="III · The products — Exhibit 06 · 1 of 3" title="Each product manufactures trust a different way."
        sub="Not mockups — every card links to the live surface.">
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:mt-8 lg:gap-6">
          <ProductCard name="Truth Score" what="The score no developer can buy."
            trust="Published weights · re-scored quarterly · challengeable" only href={`${basePath}/intelligence/projects/dlf-arbour`}>
            <div className="rounded-xl border border-[#1a1a1a]/10 bg-[#F7F3EA] p-4 lg:p-6">
              <p className="font-mono text-[0.52rem] tracking-[0.26em] text-[#1a1a1a]/40 lg:text-[0.64rem]">TRUTH SCORE</p>
              <p className="mt-1.5 font-serif text-[2.4rem] font-medium leading-none text-[#1e6b45] lg:text-[4rem]">92<span className="ml-1.5 font-mono text-[0.7rem] text-[#1a1a1a]/35 lg:text-[0.95rem]">/100</span></p>
              <p className="mt-2 flex items-center gap-2 text-[0.64rem] font-medium tracking-[0.08em] text-[#1e6b45] lg:mt-3 lg:text-[0.8rem]">EXCEPTIONAL <span className="rounded-full border border-[#1e6b45]/30 bg-[#1e6b45]/[0.08] px-2.5 py-0.5 font-normal">Strong Buy</span></p>
              <div className="mt-2.5 flex gap-[3px] lg:mt-4 lg:gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className={`h-[7px] flex-1 rounded-[2px] lg:h-[10px] ${i < 9 ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/[0.12]"}`} />
                ))}
              </div>
            </div>
          </ProductCard>
          <ProductCard name="Project Intelligence" what="8,000-word forensic files — everything on record."
            trust="Every claim carries its source and its date" only href={`${basePath}/intelligence/projects/dlf-arbour`}>
            <div className="overflow-hidden rounded-xl border border-[#1a1a1a]/10 bg-white">
              {([
                ["Construction vs RERA-due", "QPR-verified"],
                ["Developer litigation record", "e-Courts"],
                ["Site, seen from orbit", "Satellite · dated"],
                ["Price journey since launch", "Tracked"],
              ] as const).map(([row, stamp], i) => (
                <div key={row} className={`flex items-center justify-between gap-3 px-4 py-2.5 lg:px-5 lg:py-4 ${i > 0 ? "border-t border-[#1a1a1a]/[0.06]" : ""}`}>
                  <span className="text-[0.78rem] font-light text-[#1a1a1a]/75 lg:text-[0.98rem]"><span className="mr-2 text-[#1e6b45]">✓</span>{row}</span>
                  <span className="font-mono text-[0.54rem] tracking-[0.1em] text-[#1e6b45] lg:text-[0.66rem]">{stamp.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </ProductCard>
        </div>
      </Card>
    ),
  },

  {
    key: "products-2",
    node: (
      <Card label="III · The products — Exhibit 06 · 2 of 3" title="From a brief to a unit: judgement, personalised.">
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:mt-8 lg:gap-6">
          <ProductCard name="Match Score" what="The project, judged against your brief — not the brochure."
            trust="Same evidence, personalised; never a lead-gen ranking" href={`${basePath}/intelligence/projects/dlf-arbour`}>
            <div className="flex items-center gap-5 rounded-xl border border-[#1a1a1a]/10 bg-white p-4 lg:gap-7 lg:p-6">
              <p className="text-[2.4rem] font-normal leading-none tracking-[-0.02em] tabular-nums text-[#1e6b45] lg:text-[3.6rem]">87<span className="text-[1rem] text-[#1a1a1a]/35 lg:text-[1.4rem]">%</span></p>
              <div>
                <p className="text-[0.8rem] font-normal lg:text-[1rem]">fit to your brief</p>
                <div className="mt-2 flex flex-wrap gap-1.5 lg:mt-3 lg:gap-2">
                  {["₹5–7 Cr", "5-yr hold", "east-facing", "school ≤ 1 km"].map((c) => (
                    <span key={c} className="rounded-full border border-[#1a1a1a]/12 px-2 py-0.5 font-mono text-[0.54rem] text-[#1a1a1a]/50 lg:px-2.5 lg:py-1 lg:text-[0.66rem]">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </ProductCard>
          <ProductCard name="Unit Intelligence" what="The decision, closed to the unit — tower, floor, stack."
            trust="Sun, air, privacy and price modelled per stack" only href={`${basePath}/intelligence/projects/dlf-arbour`}>
            <div className="flex items-center gap-5 rounded-xl border border-[#1a1a1a]/10 bg-white p-4 lg:gap-7 lg:p-6">
              <div className="grid shrink-0 grid-cols-5 gap-[3px] lg:gap-1">
                {Array.from({ length: 40 }).map((_, i) => (
                  <span key={i} className={`h-[9px] w-[13px] rounded-[2px] lg:h-[12px] lg:w-[18px] ${i === 22 ? "bg-[#1e6b45] ring-2 ring-[#1e6b45]/30" : "bg-[#1a1a1a]/[0.09]"}`} />
                ))}
              </div>
              <div>
                <p className="text-[0.8rem] font-normal lg:text-[1rem]">Tower B · 11th · east</p>
                <p className="mt-1 font-mono text-[0.56rem] tracking-[0.1em] text-[#9a7a2e] lg:mt-2 lg:text-[0.66rem]">WALK-AWAY PRICE INCLUDED</p>
              </div>
            </div>
          </ProductCard>
        </div>
      </Card>
    ),
  },

  {
    key: "products-3",
    node: (
      <Card label="III · The products — Exhibit 06 · 3 of 3" title="AI you can argue with."
        sub="Grounded in the files, not the internet — challenge any read.">
        <div className="mt-6 lg:mt-8">
          <ProductCard name="TruthGuide" what="Every answer carries its source."
            trust="Grounded in the files; challenge any read" href={`${basePath}/intelligence`}>
            <div className="flex flex-col gap-2.5 rounded-xl border border-[#1a1a1a]/10 bg-white p-4 sm:flex-row sm:items-center sm:gap-4 lg:p-6">
              <p className="rounded-2xl rounded-bl-sm bg-[#1a1a1a]/[0.05] px-4 py-2.5 text-[0.8rem] font-light text-[#1a1a1a]/70 lg:px-5 lg:py-3.5 lg:text-[1.02rem]">&ldquo;Is DLF financially sound?&rdquo;</p>
              <p className="rounded-2xl rounded-br-sm bg-[#0b1f1a] px-4 py-2.5 text-[0.8rem] font-light text-[#F7F3EA]/90 lg:px-5 lg:py-3.5 lg:text-[1.02rem]">
                Net debt-to-equity <b className="font-normal text-[#9fe6bf]">−0.05×</b>, interest cover <b className="font-normal text-[#9fe6bf]">14.7×</b>
                <span className="ml-2 rounded-full border border-[#d8b978]/40 px-2 py-0.5 font-mono text-[0.52rem] tracking-[0.1em] text-[#d8b978] lg:text-[0.62rem]">AUDITED FY25 · ON FILE</span>
              </p>
            </div>
          </ProductCard>
        </div>
      </Card>
    ),
  },

  {
    key: "engine",
    node: (
      <Card label="III · The engine — Exhibit 07" title="One flywheel: public records in, accountability out."
        sub="The moat is the loop: an independence brand, a published method, and a corpus that compounds every quarter.">
        {/* phones: the chain · desktop: the ring */}
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-4 lg:hidden">
          {["Public records + field & satellite data", "Forensic files & Truth Scores", "Buyer trust & readership", "Advisory demand · unit-level data", "Accountability pressure on developers"].map((n, i, arr) => (
            <span key={n} className="flex items-center gap-3">
              <span className="rounded-full border border-[#1a1a1a]/12 bg-white/70 px-4 py-2.5 text-[0.8rem] font-light text-[#1a1a1a]/75">{n}</span>
              {i < arr.length - 1 && <span aria-hidden className="text-[#9a7a2e]">→</span>}
            </span>
          ))}
          <span className="flex items-center gap-3">
            <span aria-hidden className="text-[#9a7a2e]">↺</span>
            <span className="font-mono text-[0.62rem] tracking-[0.12em] text-[#1a1a1a]/45">THE LOOP CLOSES</span>
          </span>
        </div>
        <FlywheelRing />
      </Card>
    ),
  },

  {
    key: "market",
    node: (
      <Card label="IV · Market — Exhibit 08" title="One corridor is enough to build the category. India is the prize."
        sub="Directional model — every assumption is a chip an investor can challenge; the arithmetic lives in the data room.">
        {/* phones: tiles · desktop: rings + the maths beside them */}
        <div className="mt-6 grid gap-4 lg:hidden">
          <div className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5">
            <p className="font-mono text-[0.6rem] tracking-[0.14em] text-[#9a7a2e]">THE BEACHHEAD · GURUGRAM PREMIUM</p>
            <p className="mt-3 text-[1.5rem] font-normal leading-none tracking-[-0.02em] tabular-nums">₹50–100k Cr<span className="text-[0.8rem] font-light text-[#1a1a1a]/40"> primary GMV / yr</span></p>
          </div>
          <div className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5">
            <p className="font-mono text-[0.6rem] tracking-[0.14em] text-[#9a7a2e]">THE REVENUE POOL WE ADDRESS</p>
            <p className="mt-3 text-[1.5rem] font-normal leading-none tracking-[-0.02em] tabular-nums text-[#1e6b45]">₹250–1,000 Cr<span className="text-[0.8rem] font-light text-[#1a1a1a]/40"> / yr, one city</span></p>
          </div>
        </div>
        <div className="mt-2 hidden lg:grid lg:grid-cols-[420px_1fr] lg:items-center lg:gap-12">
          <div className="h-[420px]"><MarketRings /></div>
          <div>
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-[#9a7a2e]">THE ASSUMPTIONS — CHALLENGE ANY CHIP</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {["~15–20k premium units absorbed / yr", "₹3.5–5 Cr average ticket", "0.5–1% buyer-side advisory", "files · memberships · unit intel"].map((c) => (
                <span key={c} className="rounded-full border border-[#1a1a1a]/12 bg-white px-4 py-2 text-[0.88rem] font-light text-[#1a1a1a]/65">{c}</span>
              ))}
            </div>
            <p className="mt-8 text-[2.2rem] font-normal leading-none tracking-[-0.02em] tabular-nums">₹50–100k Cr<span className="text-[1rem] font-light text-[#1a1a1a]/40"> Gurugram primary GMV / yr</span></p>
            <p className="mt-5 max-w-[34rem] text-[1rem] font-light leading-[1.7] text-[#1a1a1a]/60">
              Corridor-shaped playbook: NCR next, then the top-7 — the same RERA spine exists in every state. Gurugram&rsquo;s seller-paid brokerage alone runs <span className="tabular-nums">₹1,500–4,000 Cr/yr</span>.
            </p>
          </div>
        </div>
      </Card>
    ),
  },

  {
    key: "model",
    node: (
      <Card label="IV · Business model — Exhibit 09" title="Reports scale like software. Advisory monetises like a fund.">
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:grid-cols-4 lg:gap-5">
          {([
            ["Project files", "₹1,499", "per project unlock", "Free in the MVP phase — deliberately: trust before revenue."],
            ["Buyer's Office", "₹11,000", "per buyer / yr", "Every file, match scoring, the office and TruthGuide."],
            ["Unit Intelligence", "Paid module", "tower · floor · stack", "The 3D decision layer between research and booking."],
            ["Buyer-side advisory", "Fee-based", "refundable by design", "The fee returns if our verdict is walk away."],
          ] as const).map(([t, price, unit, body]) => (
            <div key={t} className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5 lg:p-6">
              <p className="text-[0.8rem] font-normal lg:text-[0.95rem]">{t}</p>
              <p className="mt-2.5 text-[1.35rem] font-normal leading-none tracking-[-0.02em] tabular-nums text-[#1e6b45] lg:mt-4 lg:text-[1.9rem]">{price}</p>
              <p className="mt-1 font-mono text-[0.58rem] tracking-[0.12em] text-[#1a1a1a]/40 lg:mt-2 lg:text-[0.66rem]">{unit.toUpperCase()}</p>
              <p className="mt-3 text-[0.74rem] font-light leading-[1.6] text-[#1a1a1a]/55 lg:mt-4 lg:text-[0.88rem]">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-r-xl border-l-2 border-[#9a7a2e] bg-[#9a7a2e]/[0.06] px-5 py-3 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70 lg:mt-6 lg:px-6 lg:py-4 lg:text-[1.05rem]">
          <b className="font-medium text-[#1a1a1a]">The governance covenant:</b>{" "}no developer money, ever. Independence is the asset every revenue line depends on.
        </div>
      </Card>
    ),
  },

  {
    key: "competition",
    node: (
      <Card label="IV · Competition — Exhibit 10" title="Everyone else is paid to make you say yes."
        sub="Two structural axes: who pays, and whether the output is inventory or judgement.">
        <div className="relative mt-6 h-[300px] rounded-[14px] border border-[#1a1a1a]/10 bg-white/60 sm:h-[330px] lg:mt-8 lg:h-[430px]">
          <div className="absolute inset-y-2 right-2 w-[48%] rounded-r-[12px] bg-gradient-to-r from-transparent to-[#1e6b45]/[0.05]" />
          <span className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-[#1a1a1a]/10" />
          <span className="absolute top-1/2 left-2 right-2 h-px -translate-y-1/2 bg-[#1a1a1a]/10" />
          <span className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[0.54rem] tracking-[0.14em] text-[#1a1a1a]/35 lg:top-4 lg:text-[0.66rem]">LISTINGS / OPTIONS</span>
          <span className="absolute left-1/2 bottom-3 -translate-x-1/2 font-mono text-[0.54rem] tracking-[0.14em] text-[#1a1a1a]/35 lg:bottom-4 lg:text-[0.66rem]">INTELLIGENCE / JUDGEMENT</span>
          <span className="absolute top-1/2 left-3 -translate-y-1/2 -rotate-90 font-mono text-[0.54rem] tracking-[0.14em] text-[#1a1a1a]/35 lg:left-4 lg:text-[0.66rem]">SELLER-PAID</span>
          <span className="absolute top-1/2 right-3 -translate-y-1/2 rotate-90 font-mono text-[0.54rem] tracking-[0.14em] text-[#9a7a2e] lg:right-4 lg:text-[0.66rem]">BUYER-PAID</span>
          {([
            ["Listing portals", "27%", "20%"],
            ["Broker & CP networks", "25%", "56%"],
            ["Content & video reviewers", "68%", "26%"],
          ] as const).map(([n, left, top]) => (
            <span key={n} className="absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-[#1a1a1a]/15 bg-[#F5F0E8] px-3 py-1.5 text-[0.66rem] font-light text-[#1a1a1a]/55 sm:text-[0.7rem] lg:px-4 lg:py-2 lg:text-[0.88rem]" style={{ left, top }}>{n}</span>
          ))}
          <span className="absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-[#1e6b45]/50 bg-[#1e6b45]/[0.08] px-3.5 py-2 text-[0.68rem] font-medium text-[#1e6b45] sm:text-[0.74rem] lg:px-5 lg:py-2.5 lg:text-[0.95rem]" style={{ left: "66%", top: "72%" }}>Truth Estate — alone here</span>
        </div>
        <p className="mt-4 max-w-[52rem] text-[0.85rem] font-light leading-[1.7] text-[#1a1a1a]/60 lg:text-[1rem]">
          None of them can enter the buyer-paid quadrant without burning their revenue — the incumbent&rsquo;s dilemma, working for us.
        </p>
      </Card>
    ),
  },

  {
    key: "traction",
    node: (
      <Card label="V · Traction — Exhibit 11 · First 40 days" title="Half the people who open a forensic file finish it."
        sub="Reports free by design — the phase is trust and search presence, not revenue. Zero paid marketing.">
        <div className="mt-6 flex flex-col gap-3.5 lg:mt-8 lg:gap-5">
          {([
            ["Visited the site", 100, "500", "linear-gradient(90deg,#9a7a2e,#c9a96e)", "100%"],
            ["Opened a project file", 25, "125", "linear-gradient(90deg,#1e6b45,#238c55)", "25% of visitors"],
            ["Read it to the end", 12.5, "62", "linear-gradient(90deg,#0b1f1a,#1e6b45)", "50% of readers"],
          ] as const).map(([label, w, n, bg, note]) => (
            <div key={label} className="grid grid-cols-[130px_1fr_86px] items-center gap-3 sm:grid-cols-[190px_1fr_130px] sm:gap-4 lg:grid-cols-[230px_1fr_170px]">
              <span className="text-[0.78rem] font-light text-[#1a1a1a]/65 sm:text-[0.84rem] lg:text-[1.05rem]">{label}</span>
              <Bar w={w} bg={bg}>{n}</Bar>
              <span className="text-right font-mono text-[0.62rem] leading-snug text-[#1e6b45] sm:text-[0.7rem] lg:text-[0.82rem]">{note}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-r-xl border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.05] px-5 py-3 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70 lg:mt-7 lg:px-6 lg:py-4 lg:text-[1.05rem]">
          <b className="font-medium text-[#1a1a1a]">The number that matters is the last one.</b>{" "}One in two readers finishes an 8,000-word file — that depth of attention is the leading indicator of willingness to pay.
        </div>
        <p className="mt-3.5 text-[0.76rem] font-light italic text-[#1a1a1a]/45 lg:text-[0.88rem]">Buyer testimonials are being collected verbatim, with permission — available in the data room.</p>
      </Card>
    ),
  },

  {
    key: "ask",
    node: (
      <Card label="V · The ask — Exhibit 12" title="Raising — currently in conversation."
        sub="Terms in discussion with early partners — this memo states use of funds and milestones, not a number.">
        <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div>
            <p className="font-mono text-[0.6rem] tracking-[0.16em] text-[#1a1a1a]/45 lg:text-[0.7rem]">USE OF FUNDS</p>
            <div className="mt-4 flex flex-col gap-3 lg:mt-5 lg:gap-4">
              {([
                ["Data & field operations", 35],
                ["Engineering & AI", 30],
                ["Advisory bench", 20],
                ["Brand & distribution", 15],
              ] as const).map(([l, pct]) => (
                <div key={l}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.84rem] font-light text-[#1a1a1a]/70 lg:text-[1.02rem]">{l}</span>
                    <span className="font-mono text-[0.7rem] tabular-nums text-[#1a1a1a]/50 lg:text-[0.82rem]">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-[8px] overflow-hidden rounded bg-[#1a1a1a]/[0.06] lg:h-[11px]">
                    <div className="h-full origin-left rounded transition-transform duration-700 ease-out lg:scale-x-0 lg:group-data-[active=true]:scale-x-100 motion-reduce:scale-x-100 print:scale-x-100" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#1e6b45,#238c55)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[0.6rem] tracking-[0.16em] text-[#1a1a1a]/45 lg:text-[0.7rem]">MILESTONES THIS ROUND BUYS</p>
            <ul className="mt-4 flex flex-col gap-2.5 lg:mt-5 lg:gap-3.5">
              {[
                "100+ forensic files across every premium NCR corridor",
                "A paying advisory cohort with published outcomes",
                "Unit Intelligence as the category's decision standard",
                "Quarterly metrics in the data room — the record, kept on ourselves too",
              ].map((m) => (
                <li key={m} className="flex gap-3 text-[0.86rem] font-light leading-[1.55] text-[#1a1a1a]/70 lg:text-[1.02rem]">
                  <span aria-hidden className="mt-0.5 text-[#1e6b45]">+</span>{m}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-[#1a1a1a]/[0.08] pt-5 lg:mt-9 lg:gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${basePath}/images/founder-gaurav.webp`} alt="Gaurav Jain, founder of Truth Estate" className="h-12 w-12 rounded-full border-2 border-[#B29668]/60 object-cover lg:h-16 lg:w-16" />
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[1.02rem] font-medium lg:text-[1.25rem]">Gaurav Jain · Founder</p>
            <p className="text-[0.76rem] font-light text-[#1a1a1a]/55 lg:text-[0.92rem]">Every file crosses the founder&rsquo;s desk before it ships. The same desk answers to investors.</p>
          </div>
        </div>
      </Card>
    ),
  },

  {
    key: "verdict",
    backdrop: "emerald",
    node: (
      <Card dark bare label="Exhibit — final · The Truth Estate file on Truth Estate" title="We rate real estate for a living. Here is our own file.">
        <div className="mt-5 lg:mt-8">
          {([
            ["Problem severity", 9.6, "Largest household purchase in India; the buyer's side is structurally unrepresented."],
            ["Timing", 9.3, "Public data matured; premium & NRI demand at highs; AI collapsed research cost."],
            ["Moat", 8.7, "Independence is a covenant — developers cannot pay us. Brand + method + data compound."],
            ["Early signal", 8.4, "50% read-through on forensic files, 40 days in, ₹0 spent."],
            ["Economics", 8.6, "Reports scale like software; advisory monetises like a fund."],
          ] as const).map(([name, score, why], i) => (
            <div key={name} className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-3 lg:py-4 ${i > 0 ? "border-t border-[#F7F3EA]/[0.12]" : ""}`}>
              <span className="text-[0.9rem] font-light text-[#F7F3EA]/85 lg:text-[1.15rem]">{name}</span>
              <span className="hidden h-[6px] w-[130px] overflow-hidden rounded bg-[#F7F3EA]/[0.14] sm:block lg:h-[8px] lg:w-[220px]">
                <span className="block h-full origin-left rounded transition-transform duration-700 ease-out lg:scale-x-0 lg:group-data-[active=true]:scale-x-100 motion-reduce:scale-x-100 print:scale-x-100" style={{ width: `${score * 10}%`, background: "linear-gradient(90deg,#1e6b45,#7fd6a4)" }} />
              </span>
              <span className="font-mono text-[1rem] tabular-nums text-[#7fd6a4] lg:text-[1.3rem]">{score.toFixed(1)}<span className="text-[0.64rem] text-[#F7F3EA]/40 lg:text-[0.78rem]">/10</span></span>
              <span className="col-span-full -mt-0.5 pb-0.5 text-[0.7rem] font-light text-[#F7F3EA]/45 lg:text-[0.85rem]">{why}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4 lg:mt-8">
          <span className="rounded-full border border-[#7fd6a4]/45 bg-[#1e6b45]/35 px-5 py-2.5 text-[0.8rem] tracking-[0.06em] text-[#9fe6bf] lg:px-6 lg:py-3 lg:text-[0.95rem]">● STRONG BUY — our read, applied to ourselves</span>
          <a href={DATA_ROOM} className="ml-auto rounded-lg bg-[#1e6b45] px-6 py-3.5 text-[0.86rem] font-medium text-white transition-colors hover:bg-[#238c55] lg:px-8 lg:py-4 lg:text-[1rem] print:hidden">
            Request the data room →
          </a>
        </div>
        <p className="mt-4 max-w-[56rem] text-[0.68rem] font-light leading-[1.6] text-[#F7F3EA]/40 lg:mt-6 lg:text-[0.8rem]">
          Scores are our own, produced with the discipline we apply to any asset — and just as open to challenge. Private &amp; confidential; figures marked directional are modelled, with sources in the data room.
        </p>
      </Card>
    ),
  },
];

/* ── the deck shell ── */

export default function InvestorMemo() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [fs, setFs] = useState(false);
  const total = SLIDES.length;

  // target accumulates so rapid keypresses advance multiple slides mid-animation
  const targetRef = useRef(0);

  const go = useCallback((i: number) => {
    const t = Math.max(0, Math.min(total - 1, i));
    targetRef.current = t;
    const el = scrollerRef.current?.children[t] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth" });
  }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(targetRef.current + 1); }
      if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(targetRef.current - 1); }
    };
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", onFs); };
  }, [go]);

  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const settleT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const near = Math.round(el.scrollTop / el.clientHeight);
    setIdx(Math.max(0, Math.min(total - 1, near)));
    // sync the keyboard target only once scrolling has actually settled,
    // so pass-through frames can't clobber an accumulated target
    if (settleT.current) clearTimeout(settleT.current);
    settleT.current = setTimeout(() => {
      const p = el.scrollTop / el.clientHeight;
      targetRef.current = Math.max(0, Math.min(total - 1, Math.round(p)));
    }, 180);
  };

  // the finale sits on an emerald backdrop — the fixed chrome flips to cream there
  const onDark = SLIDES[idx]?.backdrop === "emerald";

  return (
    <div className="relative h-svh bg-[#F1EBDF] text-[#1a1a1a]">
      {/* deck progress — stepped by slide */}
      <div className={`fixed inset-x-0 top-0 z-50 h-[2px] print:hidden ${onDark ? "bg-[#F7F3EA]/[0.12]" : "bg-[#1a1a1a]/[0.07]"}`}>
        <div className="h-full bg-[#9a7a2e] transition-[width] duration-300" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      {/* chrome */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 sm:px-8 print:hidden">
        <a href={basePath} aria-label="Truth Estate — Home" className="pointer-events-auto"><Logo color={onDark ? "#F7F3EA" : "#1a1a1a"} className="h-6 w-auto sm:h-7" /></a>
        <span className="flex items-center gap-4">
          <span className={`font-mono text-[0.52rem] uppercase tracking-[0.2em] sm:text-[0.56rem] lg:text-[0.64rem] ${onDark ? "text-[#F7F3EA]/50" : "text-[#1a1a1a]/40"}`}>Private memorandum</span>
          <button onClick={toggleFs} aria-label={fs ? "Exit fullscreen" : "Present fullscreen"}
            className={`pointer-events-auto hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[0.56rem] tracking-[0.14em] transition-colors lg:flex ${onDark ? "border-[#F7F3EA]/25 text-[#F7F3EA]/60 hover:border-[#F7F3EA]/50 hover:text-[#F7F3EA]/90" : "border-[#1a1a1a]/15 text-[#1a1a1a]/50 hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]/80"}`}>
            {fs ? "EXIT" : "PRESENT"} <span aria-hidden className="text-[0.8rem] leading-none">{fs ? "⤡" : "⤢"}</span>
          </button>
        </span>
      </div>
      <span className={`fixed bottom-4 left-5 z-40 font-mono text-[0.62rem] tabular-nums tracking-[0.18em] sm:left-8 lg:text-[0.72rem] print:hidden ${onDark ? "text-[#F7F3EA]/50" : "text-[#1a1a1a]/45"}`}>
        {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      {idx === 0 && (
        <span aria-hidden className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 animate-bounce text-[#9a7a2e] print:hidden">↓</span>
      )}
      {/* dot rail */}
      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex print:hidden">
        {SLIDES.map((s, i) => (
          <button key={s.key} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${i === idx ? "h-5 w-[7px] bg-[#9a7a2e]" : "h-[7px] w-[7px] bg-[#1a1a1a]/20 hover:bg-[#1a1a1a]/40"}`} />
        ))}
      </div>

      {/* slides */}
      <div ref={scrollerRef} onScroll={onScroll}
        className="h-svh snap-y snap-mandatory overflow-y-auto print:h-auto print:snap-none print:overflow-visible">
        {SLIDES.map((s, i) => (
          <section key={s.key} data-active={i === idx}
            className="group relative flex h-svh snap-start items-center justify-center overflow-hidden px-4 pb-12 pt-16 sm:px-8 print:h-auto print:overflow-visible print:py-10"
            style={{ breakAfter: "page" }}>
            {/* full-bleed backdrops for the bookend slides */}
            {s.backdrop && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${basePath}/images/aerial-dlf-arbour.webp`} alt="" aria-hidden
                  className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0" style={{
                  background: s.backdrop === "cream"
                    ? "linear-gradient(180deg, rgba(241,235,223,0.93) 0%, rgba(241,235,223,0.88) 55%, rgba(241,235,223,0.95) 100%)"
                    : "linear-gradient(180deg, rgba(11,31,26,0.94) 0%, rgba(11,31,26,0.9) 55%, rgba(11,31,26,0.96) 100%)",
                }} />
              </>
            )}
            <div className="relative z-10 max-h-full w-full max-w-[1080px] overflow-y-auto transition-[opacity,transform] duration-500 ease-out [-ms-overflow-style:none] [scrollbar-width:none] lg:max-w-[1240px] lg:translate-y-4 lg:opacity-0 lg:group-data-[active=true]:translate-y-0 lg:group-data-[active=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 print:translate-y-0 print:opacity-100 [&::-webkit-scrollbar]:hidden">
              {s.node}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
