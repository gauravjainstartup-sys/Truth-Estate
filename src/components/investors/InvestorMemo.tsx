"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import RenderVsReality from "../intelligence/RenderVsReality";

/* ════════════════════════════════════════════════════════════════
   INVESTOR MEMORANDUM — presented as a deck, sized for the room.
   Eighteen scroll-snap frames. Desktop (lg+) runs the presentation
   scale: bigger frame, ~1.35× type, drawn set-pieces (the boardroom
   table, the timeline, the flywheel ring, the supply funnel) and
   slide-entry motion. Phones keep the reading scale. Cmd+P still
   yields a page-per-slide PDF.
   ════════════════════════════════════════════════════════════════ */

const basePath = "/Truth-Estate";
const DATA_ROOM = "mailto:gauravjainstartup@gmail.com?subject=Truth%20Estate%20%E2%80%94%20Data%20room%20request";

/* The premium buyer's eight-step lifecycle — [stage, name, NRI-sharpest?,
   today (alone), with Truth Estate]. Drawn from the NRI desk's own copy. */
const JOURNEY = [
  ["1", "Requirement", false, "A broker's list, sized to his stock", "Buyer DNA → an independent shortlist"],
  ["2", "Due diligence", true, "Title, RERA, litigation unchecked", "Forensic diligence before a rupee moves"],
  ["3", "Site visit", true, "A model flat and a sales pitch", "Accompanied & live-video visits"],
  ["4", "Price", true, "The quoted rate — the “NRI price”", "Benchmarked & negotiated for you"],
  ["5", "FEMA & PoA", true, "Funding guesswork; a broad PoA", "FEMA-compliant; a narrow, revocable PoA"],
  ["6", "Token & agreement", false, "Sign the builder's paper as-is", "Reviewed before you commit"],
  ["7", "Registration & handover", false, "Coordinate four parties yourself", "One advisor to registration & handover"],
  ["8", "Custody & management", false, "After booking, you're alone", "We stay on — dues, tenancy, exit read"],
] as const;

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

/* ── set-piece data: supply-side market sizing — the founder's sheet,
   rendered verbatim. TAM = 75% premium share of the trailing six years
   of Gurugram launches; SAM = the 25% eligible to transact; SOM = the
   capture ramp. Tickets ₹5 Cr avg, brokerage at 1%. ── */
const LAUNCHES: { fy: string; k: number; est?: boolean }[] = [
  { fy: "FY22", k: 33 }, { fy: "FY23", k: 42 }, { fy: "FY24", k: 34 }, { fy: "FY25", k: 52 }, { fy: "FY26", k: 36 },
  { fy: "FY27", k: 43, est: true }, { fy: "FY28", k: 40, est: true }, { fy: "FY29", k: 40, est: true }, { fy: "FY30", k: 40, est: true }, { fy: "FY31", k: 40, est: true },
];
const RAMP: { fy: string; pct: string; units: string; cr: number; crLabel: string }[] = [
  { fy: "FY27", pct: "0.05%", units: "23", cr: 1.125, crLabel: "1.1" },
  { fy: "FY28", pct: "0.5%", units: "232", cr: 11.578, crLabel: "11.6" },
  { fy: "FY29", pct: "1%", units: "459", cr: 22.969, crLabel: "23.0" },
  { fy: "FY30", pct: "2%", units: "941", cr: 47.063, crLabel: "47.1" },
  { fy: "FY31", pct: "4%", units: "1,793", cr: 89.625, crLabel: "89.6" },
];
const FUNNEL = [
  { tag: "TAM · THE PREMIUM STOCK IN PLAY · FY27", big: "1,80,000", unit: "units", fee: "₹9,000 Cr / yr", note: "75% of the trailing six years of launches · GMV ₹9,00,000 Cr", w: 100, us: false },
  { tag: "SAM · ELIGIBLE TO TRANSACT · 25%", big: "45,000", unit: "units", fee: "₹2,250 Cr / yr", note: "the slice actually trading in the year · GMV ₹2,25,000 Cr", w: 79, us: false },
  { tag: "SOM · OUR CAPTURE · FY27 → FY31", big: "23 → 1,793", unit: "keys", fee: "₹1.1 → ₹90 Cr / yr", note: "0.05% → 4% of the eligible units, year by year", w: 58, us: true },
] as const;

/* ── demand-side revenue projection — the founder's model, verbatim.
   Values are annual revenue in rupees per stream, FY27–31; the display
   strings mirror the sheet's crore figures exactly. Five streams sum to
   the Total Gross Platform Revenue row. ── */
const REV_YEARS = ["FY27", "FY28", "FY29", "FY30", "FY31"] as const;
const REV_TOTALS = [15500000, 170500000, 377100000, 640915000, 1183077500]; // ₹ per year
const REV_TOTAL_LABELS = ["₹1.55 Cr", "₹17.05 Cr", "₹37.71 Cr", "₹64.09 Cr", "₹118.31 Cr"];
const REV_MAX = 1183077500; // FY31 total → full bar height
const REV_STREAMS: { name: string; tag: string; color: string; fy: number[]; fy31: string; share: string }[] = [
  { name: "Closed Mandates", tag: "buyer-side brokerage on the deal", color: "#1e6b45", fy: [10000000, 110000000, 242000000, 399300000, 732050000], fy31: "₹73.21 Cr", share: "62%" },
  { name: "Marketplace Services", tag: "home loan · legal · interiors", color: "#238c55", fy: [2500000, 27500000, 60500000, 99825000, 183012500], fy31: "₹18.30 Cr", share: "15%" },
  { name: "Advisory Retainers", tag: "fee-based, refundable", color: "#7fd6a4", fy: [2000000, 22000000, 48400000, 79860000, 146410000], fy31: "₹14.64 Cr", share: "12%" },
  { name: "Unit Intelligence", tag: "per-project 3D decision layer", color: "#9a7a2e", fy: [1000000, 11000000, 24200000, 39930000, 73205000], fy31: "₹7.32 Cr", share: "6%" },
  { name: "Ownership OS", tag: "post-purchase subscription", color: "#d8b978", fy: [0, 0, 2000000, 22000000, 48400000], fy31: "₹4.84 Cr", share: "4%" },
];

/* ── cost estimates — the founder's Cost Breakup, verbatim. Total
   operating cost per year, the margin it leaves, the FY31 composition
   (eleven heads rolled into four buckets) and the team it staffs. ── */
const COST_YEARS = ["FY27", "FY28", "FY29", "FY30", "FY31"] as const;
const COST_TOTALS = [8250000, 59983333, 122491667, 193647500, 308339583]; // ₹ per year
const COST_TOTAL_LABELS = ["₹0.83 Cr", "₹6.0 Cr", "₹12.2 Cr", "₹19.4 Cr", "₹30.8 Cr"];
const COST_GM = ["46.77%", "64.82%", "67.52%", "69.79%", "73.94%"];
const COST_MAX = 308339583;
const COST_BUCKETS: { name: string; tag: string; cr: string; w: number; pct: string; color: string }[] = [
  { name: "People", tag: "salaries + founders", cr: "₹17.40 Cr", w: 56.4, pct: "56%", color: "#1e6b45" },
  { name: "Acquisition", tag: "performance · content · PR", cr: "₹12.45 Cr", w: 40.4, pct: "40%", color: "#238c55" },
  { name: "Technology", tag: "AI · cloud · APIs", cr: "₹0.50 Cr", w: 1.6, pct: "2%", color: "#9a7a2e" },
  { name: "Operations", tag: "office · legal · finance · travel", cr: "₹0.48 Cr", w: 1.6, pct: "2%", color: "#d8b978" },
];
const TEAM: { name: string; a: number; b: number; hi?: boolean }[] = [
  { name: "Buyer Advisors", a: 2, b: 25, hi: true },
  { name: "AI / Data", a: 0, b: 8 },
  { name: "Product & Engineering", a: 1, b: 6 },
  { name: "Marketing", a: 1, b: 6 },
  { name: "Architect", a: 1, b: 5 },
  { name: "Finance, HR & Admin", a: 1, b: 4 },
  { name: "Founders", a: 1, b: 2 },
];

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
    key: "gap-representation",
    node: (
      <Card label="I · The four gaps — Exhibit 03 · Representation" title="Everyone else is paid to make you say yes."
        sub="Two structural axes: who pays, and whether the output is inventory or judgement. Every incumbent sits on the seller-paid side; the buyer&rsquo;s seat sat empty.">
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
          None of them can enter the buyer-paid quadrant without burning their revenue — the incumbent&rsquo;s dilemma, working for us. The covenant: no developer money, ever.
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
    key: "journey",
    node: (
      <Card label="I · The four gaps, made real" title="Every buyer walks this alone. We make it one relationship."
        sub={<>The premium buyer&rsquo;s eight-step lifecycle — fragmented and seller-paid today, and the NRI feels every gap most. We turn it into one represented relationship.</>}>
        {/* desktop: the two-world ladder — disconnected today vs. one continuous spine */}
        <div className="mt-6 hidden md:block lg:mt-7">
          <div className="grid grid-cols-[210px_1fr_1fr] pb-2.5">
            <span />
            <span className="pl-7 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#9a7a2e] lg:text-[0.7rem]">Today — alone</span>
            <span className="pl-7 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#1e6b45] lg:text-[0.7rem]">With Truth Estate</span>
          </div>
          {JOURNEY.map(([n, name, nri, today, te]) => (
            <div key={n} className="grid grid-cols-[210px_1fr_1fr] items-stretch border-t border-[#1a1a1a]/10">
              <div className="flex items-center gap-2 py-3 pr-3">
                <span className="font-mono text-[0.7rem] font-bold text-[#9a7a2e]">{n}</span>
                <span className="font-serif text-[0.98rem] font-medium leading-tight lg:text-[1.05rem]">{name}</span>
                {nri && <span className="rounded-[5px] bg-[#9a7a2e] px-1.5 py-0.5 font-mono text-[0.5rem] font-bold tracking-[0.08em] text-white">NRI</span>}
              </div>
              <div className="relative flex items-center py-3 pl-7 pr-4 text-[0.86rem] font-light leading-snug text-[#1a1a1a]/45 lg:text-[0.98rem]">
                <span className="absolute left-2 top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-[2px] bg-[#c9a96e]/80" />
                {today}
              </div>
              <div className="relative flex items-center border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.035] py-3 pl-7 pr-4 text-[0.86rem] leading-snug text-[#1a1a1a] lg:text-[0.98rem]">
                <span className="absolute -left-[6px] top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full border-2 border-[#FBF8F2] bg-[#1e6b45]" />
                {te}
              </div>
            </div>
          ))}
        </div>
        {/* phones: compact stacked stages */}
        <div className="mt-5 md:hidden">
          {JOURNEY.map(([n, name, nri, today, te]) => (
            <div key={n} className="border-t border-[#1a1a1a]/10 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.62rem] font-bold text-[#9a7a2e]">{n}</span>
                <span className="font-serif text-[0.92rem] font-medium">{name}</span>
                {nri && <span className="rounded-[4px] bg-[#9a7a2e] px-1.5 py-0.5 font-mono text-[0.46rem] font-bold tracking-[0.08em] text-white">NRI</span>}
              </div>
              <p className="mt-1 flex gap-2 text-[0.78rem] font-light leading-snug text-[#1a1a1a]/45">
                <span className="mt-[1px] w-[54px] shrink-0 font-mono text-[0.5rem] font-bold uppercase tracking-[0.06em] text-[#9a7a2e]">Today</span>
                <span>{today}</span>
              </p>
              <p className="mt-0.5 flex gap-2 text-[0.78rem] leading-snug text-[#1a1a1a]/85">
                <span className="mt-[1px] w-[54px] shrink-0 font-mono text-[0.5rem] font-bold uppercase tracking-[0.06em] text-[#1e6b45]">Truth Est.</span>
                <span>{te}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-r-xl border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.06] px-5 py-3 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/75 lg:mt-6 lg:px-6 lg:py-4 lg:text-[1.05rem]">
          <b className="font-medium text-[#1a1a1a]">Today:</b> seller-paid, and it ends at your booking.{" "}
          <b className="font-medium text-[#1a1a1a]">Ours:</b> buyer-paid, all eight steps — one relationship, not one transaction.
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
    key: "buyer-office",
    node: (
      <Card label="III · The flagship — The Premium Buyer Office" title="The buyer appoints an office — not a broker."
        sub={<>Eight offices under one membership — worth ₹1,25,000, priced at ₹9,999. The fee is the wedge; the trailing representation and referral are the revenue.</>}>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:mt-8 lg:gap-3">
          {([
            ["01", "Buyer Intelligence", "The right shortlist"],
            ["02", "Unit Intelligence", "The right apartment"],
            ["03", "Ground Intelligence", "The neighbourhood, verified"],
            ["04", "Commercial Intelligence", "Represented in the deal"],
            ["05", "Transaction Office", "Token to registration"],
            ["06", "Buyer Memory™", "Nothing stays verbal"],
            ["07", "Ownership OS", "Past possession"],
            ["08", "Expert Network", "Every specialist on call"],
          ] as const).map(([n, name, tag]) => (
            <div key={n} className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-3 lg:p-4">
              <span className="font-mono text-[0.58rem] tracking-[0.12em] text-[#9a7a2e] lg:text-[0.7rem]">{n}</span>
              <p className="mt-1 font-serif text-[0.9rem] font-medium leading-tight lg:text-[1.12rem]">{name}</p>
              {/* tag is teaser detail — hidden on phones so the CTA below never clips */}
              <p className="mt-1 hidden text-[0.7rem] font-light leading-[1.4] text-[#1a1a1a]/50 sm:block lg:text-[0.8rem]">{tag}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:mt-7">
          <p className="max-w-[34rem] font-serif text-[0.98rem] font-medium italic leading-[1.4] text-[#1e6b45] lg:text-[1.18rem]">&ldquo;We stay with you until you&rsquo;re confident&mdash;not just until you book.&rdquo;</p>
          <a href={`${basePath}/premiumbuyeroffice`} className="shrink-0 self-start rounded-sm border border-[#1e6b45]/40 bg-[#1e6b45]/[0.06] px-5 py-2.5 text-[0.8rem] font-medium text-[#1e6b45] transition-colors hover:bg-[#1e6b45] hover:text-white sm:self-auto lg:text-[0.92rem]">See the full Premium Buyer Office &rarr;</a>
        </div>
      </Card>
    ),
  },

  {
    key: "model",
    node: (
      <Card label="IV · Business model — Exhibit 08" title="Reports scale like software. Advisory monetises like a fund.">
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:grid-cols-4 lg:gap-5">
          {([
            ["Project files", "₹999", "per project unlock", "Free in the MVP phase — deliberately: trust before revenue."],
            ["Buyer's Office", "₹9,999", "per buyer / yr", "Every file, match scoring, the office and TruthGuide."],
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
    key: "market",
    node: (
      <Card label="IV · Market — Exhibit 09 · Supply-side sizing" title="Sized from the supply side: a ₹9,000-crore-a-year fee pool."
        sub={<>Bottom-up from launch filings, not analyst decks — the trailing six years of Gurugram launches, 75% premium share, ₹5 Cr average ticket, brokerage at 1%. Challenge any cell; the full sheet lives in the data room.</>}>
        {/* phones: the funnel as tiles + the ramp as a ledger */}
        <div className="mt-6 grid gap-3.5 lg:hidden">
          {FUNNEL.map((f) => (
            <div key={f.tag} className={`rounded-xl border p-5 ${f.us ? "border-[#1e6b45]/30 bg-[#1e6b45]/[0.05]" : "border-[#1a1a1a]/[0.08] bg-white/60"}`}>
              <p className={`font-mono text-[0.6rem] tracking-[0.14em] ${f.us ? "text-[#1e6b45]" : "text-[#9a7a2e]"}`}>{f.tag}</p>
              <p className={`mt-2.5 text-[1.4rem] font-normal leading-none tracking-[-0.02em] tabular-nums ${f.us ? "text-[#1e6b45]" : ""}`}>
                {f.big}<span className="text-[0.78rem] font-light text-[#1a1a1a]/40"> {f.unit} · fees {f.fee}</span>
              </p>
              <p className="mt-2 text-[0.72rem] font-light leading-[1.5] text-[#1a1a1a]/50">{f.note}</p>
            </div>
          ))}
          <div className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5">
            <p className="font-mono text-[0.6rem] tracking-[0.14em] text-[#9a7a2e]">THE CAPTURE RAMP · BROKERAGE / YR</p>
            <div className="mt-3 flex flex-col gap-2">
              {RAMP.map((r) => (
                <div key={r.fy} className="flex items-baseline justify-between gap-2 font-mono text-[0.7rem] tabular-nums text-[#1a1a1a]/70">
                  <span>{r.fy}</span><span className="text-[#1a1a1a]/45">{r.pct}</span><span className="text-[#1a1a1a]/45">{r.units} keys</span><span className="font-medium text-[#1e6b45]">₹{r.crLabel} Cr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* desktop: the funnel, the ramp, and the evidence row */}
        <div className="mt-7 hidden lg:block">
          <div className="grid grid-cols-[1.12fr_1fr] gap-12">
            <div className="flex flex-col justify-center gap-3.5">
              {FUNNEL.map((f) => (
                <div key={f.tag} className={`rounded-xl border px-6 py-4 ${f.us ? "border-[#1e6b45]/35 bg-[#1e6b45]/[0.06]" : "border-[#1a1a1a]/10 bg-white/60"}`} style={{ width: `${f.w}%` }}>
                  <p className={`font-mono text-[0.62rem] tracking-[0.16em] ${f.us ? "text-[#1e6b45]" : "text-[#9a7a2e]"}`}>{f.tag}</p>
                  <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className={`text-[1.7rem] font-normal leading-none tracking-[-0.02em] tabular-nums ${f.us ? "text-[#1e6b45]" : ""}`}>{f.big}</span>
                    <span className="text-[0.8rem] font-light text-[#1a1a1a]/40">{f.unit}</span>
                    <span className={`ml-auto font-mono text-[0.84rem] tabular-nums ${f.us ? "text-[#1e6b45]" : "text-[#1a1a1a]/70"}`}>fees {f.fee}</span>
                  </p>
                  <p className="mt-1.5 text-[0.78rem] font-light text-[#1a1a1a]/48">{f.note}</p>
                </div>
              ))}
              <p className="mt-1 font-mono text-[0.58rem] tracking-[0.14em] text-[#1a1a1a]/35">GURUGRAM ONLY — THE SAME RERA SPINE REPEATS ACROSS NCR &amp; THE TOP-7</p>
            </div>
            <div className="flex flex-col">
              <p className="font-mono text-[0.68rem] tracking-[0.16em] text-[#9a7a2e]">THE CAPTURE RAMP · BROKERAGE / YR</p>
              <div className="mt-5 flex flex-1 items-end gap-5">
                {RAMP.map((r, i) => (
                  <div key={r.fy} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className={`font-mono text-[0.78rem] tabular-nums ${i === RAMP.length - 1 ? "font-medium text-[#1e6b45]" : "text-[#1a1a1a]/65"}`}>₹{r.crLabel} Cr</span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={`w-full origin-bottom rounded-t-[7px] transition-transform duration-700 ease-out lg:scale-y-0 lg:group-data-[active=true]:scale-y-100 motion-reduce:scale-y-100 print:scale-y-100 ${i === RAMP.length - 1 ? "bg-[#1e6b45]" : "bg-[#238c55]/50"}`}
                        style={{ height: `${Math.max(2.5, (r.cr / 89.625) * 100)}%`, transitionDelay: `${i * 110}ms` }}
                      />
                    </div>
                    <span className="font-mono text-[0.68rem] tracking-[0.1em] text-[#1a1a1a]/50">{r.fy}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.58rem] tabular-nums ${i === RAMP.length - 1 ? "border-[#1e6b45]/40 bg-[#1e6b45]/[0.07] text-[#1e6b45]" : "border-[#9a7a2e]/35 text-[#9a7a2e]"}`}>{r.pct}</span>
                    <span className="text-[0.66rem] font-light tabular-nums text-[#1a1a1a]/45">{r.units} keys</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-7 rounded-xl border border-[#1a1a1a]/[0.08] bg-white/50 px-6 pb-3.5 pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-mono text-[0.6rem] tracking-[0.16em] text-[#9a7a2e]">THE EVIDENCE ROW · UNITS LAUNCHED, GURUGRAM · ×1,000</p>
              <p className="font-mono text-[0.56rem] tracking-[0.14em] text-[#1a1a1a]/35">FY22–26 FROM FILINGS · FY27–31 MODELLED · AVG TICKET ₹5 CR · FEES @1%</p>
            </div>
            <div className="mt-3 flex items-end gap-2.5">
              {LAUNCHES.map((l, i) => (
                <Fragment key={l.fy}>
                  {i === 5 && <div aria-hidden className="mx-1 h-[74px] self-end border-l border-dashed border-[#1a1a1a]/25" />}
                  <div className="flex flex-1 flex-col items-center gap-1">
                    <span className={`font-mono text-[0.62rem] tabular-nums ${l.est ? "text-[#9a7a2e]" : "text-[#1a1a1a]/60"}`}>{l.k}</span>
                    <div className="flex h-[56px] w-full items-end">
                      <div className={`w-full rounded-t-[4px] ${l.est ? "bg-[#9a7a2e]/35" : "bg-[#1a1a1a]/45"}`} style={{ height: `${(l.k / 52) * 100}%` }} />
                    </div>
                    <span className="font-mono text-[0.56rem] tracking-[0.08em] text-[#1a1a1a]/40">{l.fy}</span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </Card>
    ),
  },

  {
    key: "revenue",
    node: (
      <Card label="IV · Revenue model — Exhibit 10 · Demand side" title="Five streams compound into ₹118 crore by FY31."
        sub={<>The demand side of the same market: paid and organic buyers convert across four products and a post-purchase subscription. Brokerage on closed mandates leads; every other stream deepens the account. Bottom-up from the funnel — ≈76× over four years.</>}>
        {/* phones: the stream ledger + the trajectory */}
        <div className="mt-6 lg:hidden">
          <div className="flex items-end justify-between gap-2 rounded-xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] px-4 py-3.5">
            <div><p className="font-mono text-[0.56rem] tracking-[0.14em] text-[#1a1a1a]/45">FY27</p><p className="text-[1.15rem] font-normal tabular-nums">₹1.55 Cr</p></div>
            <span className="mb-1 text-[#9a7a2e]">→</span>
            <div className="text-right"><p className="font-mono text-[0.56rem] tracking-[0.14em] text-[#1e6b45]">FY31 GROSS</p><p className="text-[1.35rem] font-normal tabular-nums text-[#1e6b45]">₹118.31 Cr</p></div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {REV_STREAMS.map((s) => (
              <div key={s.name} className="flex items-baseline gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 translate-y-0.5 rounded-[2px]" style={{ background: s.color }} />
                <span className="text-[0.82rem] font-light text-[#1a1a1a]/75">{s.name}</span>
                <span className="ml-auto font-mono text-[0.74rem] tabular-nums text-[#1a1a1a]/60">{s.fy31}</span>
                <span className="w-10 text-right font-mono text-[0.64rem] tabular-nums text-[#1a1a1a]/35">{s.share}</span>
              </div>
            ))}
          </div>
        </div>
        {/* desktop: the stacked revenue chart + the stream legend */}
        <div className="mt-7 hidden lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div className="flex flex-col">
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-[#9a7a2e]">GROSS PLATFORM REVENUE / YR</p>
            <div className="mt-5 flex h-[330px] items-end gap-6">
              {REV_YEARS.map((y, i) => {
                const totalPct = (REV_TOTALS[i] / REV_MAX) * 100;
                return (
                  <div key={y} className="flex h-full flex-1 flex-col items-center justify-end gap-2.5">
                    <div className="relative w-full flex-1">
                      <span className="absolute inset-x-0 text-center font-mono text-[0.72rem] tabular-nums text-[#1a1a1a]/70" style={{ bottom: `calc(${totalPct}% + 6px)` }}>{REV_TOTAL_LABELS[i]}</span>
                      <div
                        className="absolute inset-x-0 bottom-0 flex origin-bottom flex-col-reverse overflow-hidden rounded-t-[6px] transition-transform duration-700 ease-out lg:scale-y-0 lg:group-data-[active=true]:scale-y-100 motion-reduce:scale-y-100 print:scale-y-100"
                        style={{ height: `max(3px, ${totalPct}%)`, transitionDelay: `${i * 110}ms` }}
                      >
                        {REV_STREAMS.map((s) => (
                          <div key={s.name} style={{ height: `${(s.fy[i] / REV_TOTALS[i]) * 100}%`, background: s.color }} />
                        ))}
                      </div>
                    </div>
                    <span className="font-mono text-[0.7rem] tracking-[0.1em] text-[#1a1a1a]/50">{y}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-[#9a7a2e]">THE FIVE STREAMS · FY31</p>
            <div className="mt-4 flex flex-col">
              {REV_STREAMS.map((s, i) => (
                <div key={s.name} className={`flex items-baseline gap-3 py-2.5 ${i > 0 ? "border-t border-[#1a1a1a]/[0.07]" : ""}`}>
                  <span className="h-3 w-3 shrink-0 translate-y-0.5 rounded-[3px]" style={{ background: s.color }} />
                  <div className="min-w-0">
                    <p className="text-[0.98rem] font-normal leading-tight">{s.name}</p>
                    <p className="mt-0.5 text-[0.74rem] font-light text-[#1a1a1a]/45">{s.tag}</p>
                  </div>
                  <span className="ml-auto whitespace-nowrap font-mono text-[0.98rem] tabular-nums text-[#1e6b45]">{s.fy31}</span>
                  <span className="w-9 text-right font-mono text-[0.72rem] tabular-nums text-[#1a1a1a]/40">{s.share}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {["FY31 funnel · 5,00,000 visitors → 1,83,013 registered", "₹10.98 Cr ad spend → 10.8× on gross revenue"].map((c) => (
                <span key={c} className="rounded-full border border-[#1a1a1a]/12 bg-white px-3.5 py-1.5 font-mono text-[0.62rem] tracking-[0.06em] text-[#1a1a1a]/55">{c}</span>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-6 font-mono text-[0.58rem] tracking-[0.14em] text-[#1a1a1a]/35">FY27–31 MODELLED · CONVERSION &amp; RETENTION ASSUMPTIONS IN THE DATA ROOM · REPORTS FREE IN THE MVP PHASE, BY DESIGN</p>
      </Card>
    ),
  },

  {
    key: "cost",
    node: (
      <Card label="V · Operating plan — Exhibit 11 · Cost & team" title="Costs scale with discipline — margin widens from 47% to 74%."
        sub={<>Total operating cost rises from ₹0.83 Cr to ₹30.8 Cr as revenue compounds faster. A people-and-acquisition business: two-thirds of every rupee goes to the advisory bench and to reaching buyers, staffed to 56 by FY31.</>}>
        {/* phones: margin + cost trajectory tiles, composition, team */}
        <div className="mt-6 lg:hidden">
          <div className="flex items-end justify-between gap-2 rounded-xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] px-4 py-3.5">
            <div><p className="font-mono text-[0.56rem] tracking-[0.14em] text-[#1a1a1a]/45">FY27 MARGIN</p><p className="text-[1.15rem] font-normal tabular-nums">46.77%</p></div>
            <span className="mb-1 text-[#9a7a2e]">→</span>
            <div className="text-right"><p className="font-mono text-[0.56rem] tracking-[0.14em] text-[#1e6b45]">FY31 MARGIN</p><p className="text-[1.35rem] font-normal tabular-nums text-[#1e6b45]">73.94%</p></div>
          </div>
          <p className="mt-2 text-[0.74rem] font-light text-[#1a1a1a]/50">Operating cost ₹0.83 Cr → ₹30.8 Cr · team 7 → 56</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {COST_BUCKETS.map((b) => (
              <div key={b.name} className="flex items-baseline gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 translate-y-0.5 rounded-[2px]" style={{ background: b.color }} />
                <span className="text-[0.82rem] font-light text-[#1a1a1a]/75">{b.name}</span>
                <span className="ml-auto font-mono text-[0.74rem] tabular-nums text-[#1a1a1a]/60">{b.cr}</span>
                <span className="w-9 text-right font-mono text-[0.64rem] tabular-nums text-[#1a1a1a]/35">{b.pct}</span>
              </div>
            ))}
          </div>
        </div>
        {/* desktop: cost + margin bars · composition · team */}
        <div className="mt-7 hidden lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="flex flex-col">
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-[#9a7a2e]">OPERATING COST / YR · MARGIN BELOW</p>
            <div className="mt-5 flex h-[300px] items-end gap-6">
              {COST_YEARS.map((y, i) => {
                const pct = (COST_TOTALS[i] / COST_MAX) * 100;
                return (
                  <div key={y} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div className="relative w-full flex-1">
                      <span className="absolute inset-x-0 text-center font-mono text-[0.7rem] tabular-nums text-[#1a1a1a]/70" style={{ bottom: `calc(${pct}% + 6px)` }}>{COST_TOTAL_LABELS[i]}</span>
                      <div
                        className="absolute inset-x-0 bottom-0 origin-bottom rounded-t-[6px] transition-transform duration-700 ease-out lg:scale-y-0 lg:group-data-[active=true]:scale-y-100 motion-reduce:scale-y-100 print:scale-y-100"
                        style={{ height: `max(3px, ${pct}%)`, background: "linear-gradient(180deg,#238c55,#1e6b45)", transitionDelay: `${i * 110}ms` }}
                      />
                    </div>
                    <span className="font-mono text-[0.7rem] tracking-[0.1em] text-[#1a1a1a]/50">{y}</span>
                    <span className="rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.07] px-2 py-0.5 font-mono text-[0.6rem] tabular-nums text-[#1e6b45]">{COST_GM[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-7">
            <div>
              <p className="font-mono text-[0.68rem] tracking-[0.16em] text-[#9a7a2e]">FY31 COST COMPOSITION · ₹30.8 Cr</p>
              <div className="mt-3 flex h-[15px] overflow-hidden rounded-full border border-[#1a1a1a]/10">
                {COST_BUCKETS.map((b) => (
                  <div key={b.name} style={{ width: `${b.w}%`, background: b.color }} />
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {COST_BUCKETS.map((b) => (
                  <div key={b.name} className="flex items-baseline gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 translate-y-0.5 rounded-[2px]" style={{ background: b.color }} />
                    <span className="text-[0.9rem] font-normal">{b.name}</span>
                    <span className="text-[0.72rem] font-light text-[#1a1a1a]/45">{b.tag}</span>
                    <span className="ml-auto font-mono text-[0.88rem] tabular-nums text-[#1a1a1a]/70">{b.cr}</span>
                    <span className="w-8 text-right font-mono text-[0.72rem] tabular-nums text-[#1a1a1a]/40">{b.pct}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[0.68rem] tracking-[0.16em] text-[#9a7a2e]">TEAM · 7 → 56 BY FY31</p>
              <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1.5">
                {TEAM.map((t) => (
                  <div key={t.name} className="flex items-center gap-2.5">
                    <span className={`min-w-0 flex-1 truncate text-[0.82rem] ${t.hi ? "font-medium text-[#1e6b45]" : "font-light text-[#1a1a1a]/70"}`}>{t.name}</span>
                    <span className="h-1.5 w-14 overflow-hidden rounded-full bg-[#1a1a1a]/[0.06]">
                      <span className="block h-full rounded-full" style={{ width: `${(t.b / 25) * 100}%`, background: t.hi ? "#1e6b45" : "#9a7a2e" }} />
                    </span>
                    <span className="w-12 text-right font-mono text-[0.68rem] tabular-nums text-[#1a1a1a]/50">{t.a} → {t.b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-6 font-mono text-[0.58rem] tracking-[0.14em] text-[#1a1a1a]/35">FY27–31 MODELLED · MARGIN = GROSS PLATFORM REVENUE LESS TOTAL OPERATING COST · FULL COST BREAKUP IN THE DATA ROOM</p>
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

  {
    key: "thanks",
    backdrop: "emerald",
    node: (
      <div className="flex flex-col items-center text-center text-[#F7F3EA]">
        <div className="flex justify-center" style={{ textAlign: "left" }}>
          <Logo color="#F7F3EA" className="h-8 w-auto lg:h-11" />
        </div>
        <p className="mt-10 font-mono text-[0.6rem] uppercase tracking-[0.26em] text-[#d8b978] lg:mt-14 lg:text-[0.72rem]">Less promises. More proof.</p>
        <h2 className="mt-5 font-serif text-[3rem] font-medium leading-[1.02] tracking-[-0.01em] lg:text-[5.4rem]">Thank you.</h2>
        <p className="mt-6 max-w-[38rem] text-[0.98rem] font-light leading-[1.7] text-[#F7F3EA]/65 lg:mt-8 lg:text-[1.2rem]">
          We&rsquo;d welcome the chance to walk you through the method, the data room, and the files behind every score.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 lg:mt-12">
          <a href={DATA_ROOM} className="font-mono text-[0.82rem] tracking-[0.04em] text-[#9fe6bf] underline decoration-[#7fd6a4]/40 underline-offset-4 transition-colors hover:text-[#bff3d5] lg:text-[0.95rem]">gauravjainstartup@gmail.com</a>
          <span aria-hidden className="text-[#F7F3EA]/25">·</span>
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[#F7F3EA]/45 lg:text-[0.8rem]">Gurugram · Delhi NCR</span>
        </div>
      </div>
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
