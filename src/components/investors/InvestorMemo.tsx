"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import RenderVsReality from "../intelligence/RenderVsReality";

/* ════════════════════════════════════════════════════════════════
   INVESTOR MEMORANDUM — presented as a deck.
   One exhibit per frame: scroll-snap slides, arrow-key navigation,
   a dot rail and a slide counter. Still a Truth Estate file at
   heart — sources on every claim, a self-scored verdict at the
   close — and Cmd+P still produces a page-per-slide PDF.
   ════════════════════════════════════════════════════════════════ */

const basePath = "/Truth-Estate";
const DATA_ROOM = "mailto:gauravjainstartup@gmail.com?subject=Truth%20Estate%20%E2%80%94%20Data%20room%20request";

/* ── primitives ── */

function Eyebrow({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "cream" }) {
  return <p className={`font-mono text-[0.58rem] uppercase tracking-[0.24em] ${tone === "gold" ? "text-[#9a7a2e]" : "text-[#d8b978]"}`}>{children}</p>;
}

/* the exhibit card that fills a slide */
function Card({ label, title, sub, children, dark = false }: { label: string; title: string; sub?: React.ReactNode; children?: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`rounded-[18px] p-6 sm:p-8 md:p-9 ${dark ? "bg-[#0b1f1a] text-[#F7F3EA]" : "border border-[#1a1a1a]/10 bg-[#FBF8F2]"}`} style={{ breakInside: "avoid" }}>
      <Eyebrow tone={dark ? "cream" : "gold"}>{label}</Eyebrow>
      <h2 className="mt-2.5 font-serif text-[1.4rem] font-medium leading-[1.25] md:text-[1.8rem]">{title}</h2>
      {sub && <p className={`mt-2 max-w-[44rem] text-[0.88rem] font-light leading-[1.65] ${dark ? "text-[#F7F3EA]/60" : "text-[#1a1a1a]/60"}`}>{sub}</p>}
      {children}
    </div>
  );
}

function ProductCard({ name, what, trust, only, href, className = "", children }: { name: string; what: string; trust: string; only?: boolean; href: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
        <p className="font-serif text-[1.1rem] font-medium">{name}</p>
        {only && <span className="rounded-full border border-[#9a7a2e]/40 bg-[#9a7a2e]/[0.07] px-2.5 py-1 font-mono text-[0.5rem] tracking-[0.12em] text-[#9a7a2e]">NOBODY ELSE SHIPS THIS</span>}
      </div>
      <p className="mt-1 text-[0.84rem] font-light text-[#1a1a1a]/60">{what}</p>
      <div className="mt-4">{children}</div>
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#1a1a1a]/[0.07] pt-3">
        <span className="min-w-0 font-mono text-[0.54rem] leading-[1.6] tracking-[0.1em] text-[#1e6b45]">TRUST BUILT: {trust.toUpperCase()}</span>
        <a href={href} className="shrink-0 text-[0.74rem] font-medium text-[#1e6b45] hover:underline">Live →</a>
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

/* ── slide contents ── */

function SlideCover() {
  return (
    <div className="w-full">
      <Eyebrow>Truth Estate · Investor Memorandum · Private &amp; Confidential · H2 2026</Eyebrow>
      <h1 className="mt-7 max-w-[17.5em] font-serif text-[clamp(1.9rem,4.8vw,3.6rem)] font-medium leading-[1.13] tracking-[-0.015em]">
        India&rsquo;s largest purchases are guided by advice the <em className="not-italic text-[#1e6b45]">seller</em> pays for.<br />
        We are the buyer&rsquo;s side.
      </h1>
      <p className="mt-6 max-w-[36rem] text-[0.98rem] font-light leading-[1.75] text-[#1a1a1a]/62">
        Independent intelligence and buyer-side advisory for premium Indian residential. A score no developer can buy; representation that answers only to the buyer.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-[#1e6b45]/35 bg-[#1e6b45]/[0.06] px-3.5 py-1.5 font-mono text-[0.6rem] tracking-[0.14em] text-[#1e6b45]">RAISING · CURRENTLY IN CONVERSATION</span>
        <span className="rounded-full border border-[#9a7a2e]/40 bg-[#9a7a2e]/[0.06] px-3.5 py-1.5 font-mono text-[0.6rem] tracking-[0.14em] text-[#9a7a2e]">GURUGRAM FIRST · NRI FOCUS</span>
      </div>
    </div>
  );
}

const SLIDES: { key: string; node: React.ReactNode }[] = [
  { key: "cover", node: <SlideCover /> },

  {
    key: "gap-scale",
    node: (
      <Card label="I · The four gaps — Exhibit 01 · Drawn to scale" title="What the buyer is shown — and what is actually standing."
        sub={<>Drag the line. Left: the brochure. Right: the same plot from orbit. ₹6-crore decisions are made on the left half alone.</>}>
        <div className="mt-5">
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
        <p className="mt-3 text-[0.76rem] font-light text-[#1a1a1a]/50">Live module from the product — the same slider ships on every project file today.</p>
      </Card>
    ),
  },

  {
    key: "gap-trust",
    node: (
      <Card label="I · The four gaps — Exhibit 02 · Trust" title="Who do you trust? Every claim we make carries its source."
        sub="Nothing ships without a source, a date and a review cycle — and every read can be challenged.">
        <div className="mt-5 overflow-x-auto rounded-xl border border-[#1a1a1a]/10">
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
        <div className="mt-4 rounded-r-xl border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.05] px-5 py-3 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70">
          <b className="font-medium text-[#1a1a1a]">Everything on record</b>{" "}is not a tagline — it is the product&rsquo;s constitution. A claim without a source cannot ship.
        </div>
      </Card>
    ),
  },

  {
    key: "gap-chair",
    node: (
      <Card label="I · The four gaps — Exhibit 03 · Representation" title="Every seat at the table is paid by the seller. Except one, which sat empty."
        sub={<>Four parties monetise the buyer&rsquo;s yes. Nobody is paid for the buyer&rsquo;s <i>no</i>. That empty chair is the company.</>}>
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
            The covenant: no developer money, ever. Advisory fees are refundable if our verdict is walk away.
          </p>
        </div>
      </Card>
    ),
  },

  {
    key: "gap-decision",
    node: (
      <Card label="I · The four gaps — Exhibit 04 · Data & decisions" title="The industry ships options. We ship decisions."
        sub={<>All the public facts under one roof — then AI that closes the decision instead of listing options.</>}>
        <div className="mt-6 grid gap-4 md:grid-cols-[1.15fr_1fr]">
          <div className="relative min-h-[200px] overflow-hidden rounded-[14px] border border-[#1a1a1a]/10 bg-white p-4">
            <div className="grid grid-cols-6 gap-2 opacity-75 blur-[0.6px]">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="h-11 rounded-md bg-gradient-to-b from-[#1a1a1a]/[0.05] to-[#1a1a1a]/[0.09]" />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/95" />
            <p className="absolute bottom-3.5 left-4 font-mono text-[0.6rem] tracking-[0.16em] text-[#1a1a1a]/50">ANY PORTAL · 40 OPTIONS, ZERO JUDGEMENT</p>
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
        <div className="mt-6 grid gap-4 md:grid-cols-3">
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
      </Card>
    ),
  },

  {
    key: "products-1",
    node: (
      <Card label="III · The products — Exhibit 06 · 1 of 3" title="Each product manufactures trust a different way."
        sub="Not mockups — every card links to the live surface.">
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ProductCard name="Truth Score" what="The score no developer can buy."
            trust="Published weights · re-scored quarterly · challengeable" only href={`${basePath}/intelligence/projects/dlf-arbour`}>
            <div className="rounded-xl border border-[#1a1a1a]/10 bg-[#F7F3EA] p-4">
              <p className="font-mono text-[0.52rem] tracking-[0.26em] text-[#1a1a1a]/40">TRUTH SCORE</p>
              <p className="mt-1.5 font-serif text-[2.4rem] font-medium leading-none text-[#1e6b45]">92<span className="ml-1.5 font-mono text-[0.7rem] text-[#1a1a1a]/35">/100</span></p>
              <p className="mt-2 flex items-center gap-2 text-[0.64rem] font-medium tracking-[0.08em] text-[#1e6b45]">EXCEPTIONAL <span className="rounded-full border border-[#1e6b45]/30 bg-[#1e6b45]/[0.08] px-2.5 py-0.5 font-normal">Strong Buy</span></p>
              <div className="mt-2.5 flex gap-[3px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className={`h-[7px] flex-1 rounded-[2px] ${i < 9 ? "bg-[#1e6b45]" : "bg-[#1a1a1a]/[0.12]"}`} />
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
                <div key={row} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-[#1a1a1a]/[0.06]" : ""}`}>
                  <span className="text-[0.78rem] font-light text-[#1a1a1a]/75"><span className="mr-2 text-[#1e6b45]">✓</span>{row}</span>
                  <span className="font-mono text-[0.54rem] tracking-[0.1em] text-[#1e6b45]">{stamp.toUpperCase()}</span>
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
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ProductCard name="Match Score" what="The project, judged against your brief — not the brochure."
            trust="Same evidence, personalised; never a lead-gen ranking" href={`${basePath}/intelligence/projects/dlf-arbour`}>
            <div className="flex items-center gap-5 rounded-xl border border-[#1a1a1a]/10 bg-white p-4">
              <p className="text-[2.4rem] font-normal leading-none tracking-[-0.02em] tabular-nums text-[#1e6b45]">87<span className="text-[1rem] text-[#1a1a1a]/35">%</span></p>
              <div>
                <p className="text-[0.8rem] font-normal">fit to your brief</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["₹5–7 Cr", "5-yr hold", "east-facing", "school ≤ 1 km"].map((c) => (
                    <span key={c} className="rounded-full border border-[#1a1a1a]/12 px-2 py-0.5 font-mono text-[0.54rem] text-[#1a1a1a]/50">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </ProductCard>
          <ProductCard name="Unit Intelligence" what="The decision, closed to the unit — tower, floor, stack."
            trust="Sun, air, privacy and price modelled per stack" only href={`${basePath}/intelligence/projects/dlf-arbour`}>
            <div className="flex items-center gap-5 rounded-xl border border-[#1a1a1a]/10 bg-white p-4">
              <div className="grid shrink-0 grid-cols-5 gap-[3px]">
                {Array.from({ length: 40 }).map((_, i) => (
                  <span key={i} className={`h-[9px] w-[13px] rounded-[2px] ${i === 22 ? "bg-[#1e6b45] ring-2 ring-[#1e6b45]/30" : "bg-[#1a1a1a]/[0.09]"}`} />
                ))}
              </div>
              <div>
                <p className="text-[0.8rem] font-normal">Tower B · 11th · east</p>
                <p className="mt-1 font-mono text-[0.56rem] tracking-[0.1em] text-[#9a7a2e]">WALK-AWAY PRICE INCLUDED</p>
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
        <div className="mt-6">
          <ProductCard name="TruthGuide" what="Every answer carries its source."
            trust="Grounded in the files; challenge any read" href={`${basePath}/intelligence`}>
            <div className="flex flex-col gap-2.5 rounded-xl border border-[#1a1a1a]/10 bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
              <p className="rounded-2xl rounded-bl-sm bg-[#1a1a1a]/[0.05] px-4 py-2.5 text-[0.8rem] font-light text-[#1a1a1a]/70">&ldquo;Is DLF financially sound?&rdquo;</p>
              <p className="rounded-2xl rounded-br-sm bg-[#0b1f1a] px-4 py-2.5 text-[0.8rem] font-light text-[#F7F3EA]/90">
                Net debt-to-equity <b className="font-normal text-[#9fe6bf]">−0.05×</b>, interest cover <b className="font-normal text-[#9fe6bf]">14.7×</b>
                <span className="ml-2 rounded-full border border-[#d8b978]/40 px-2 py-0.5 font-mono text-[0.52rem] tracking-[0.1em] text-[#d8b978]">AUDITED FY25 · ON FILE</span>
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
      <Card label="III · The engine — Exhibit 07" title="One flywheel: public records in, accountability out.">
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-4">
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
        <p className="mt-5 max-w-[46rem] text-[0.85rem] font-light leading-[1.7] text-[#1a1a1a]/60">
          The moat is the loop: an independence brand, a published method, and a corpus that compounds every quarter.
        </p>
      </Card>
    ),
  },

  {
    key: "market",
    node: (
      <Card label="IV · Market — Exhibit 08" title="One corridor is enough to build the category. India is the prize."
        sub="Directional model — every assumption is a chip an investor can challenge; the arithmetic lives in the data room.">
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["Project files", "₹1,499", "per project unlock", "Free in the MVP phase — deliberately: trust before revenue."],
            ["Buyer's Office", "₹11,000", "per buyer / yr", "Every file, match scoring, the office and TruthGuide."],
            ["Unit Intelligence", "Paid module", "tower · floor · stack", "The 3D decision layer between research and booking."],
            ["Buyer-side advisory", "Fee-based", "refundable by design", "The fee returns if our verdict is walk away."],
          ] as const).map(([t, price, unit, body]) => (
            <div key={t} className="rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 p-5">
              <p className="text-[0.8rem] font-normal">{t}</p>
              <p className="mt-2.5 text-[1.35rem] font-normal leading-none tracking-[-0.02em] tabular-nums text-[#1e6b45]">{price}</p>
              <p className="mt-1 font-mono text-[0.58rem] tracking-[0.12em] text-[#1a1a1a]/40">{unit.toUpperCase()}</p>
              <p className="mt-3 text-[0.74rem] font-light leading-[1.6] text-[#1a1a1a]/55">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-r-xl border-l-2 border-[#9a7a2e] bg-[#9a7a2e]/[0.06] px-5 py-3 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70">
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
        <div className="relative mt-6 h-[300px] rounded-[14px] border border-[#1a1a1a]/10 bg-white/60 sm:h-[330px]">
          <span className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-[#1a1a1a]/10" />
          <span className="absolute top-1/2 left-2 right-2 h-px -translate-y-1/2 bg-[#1a1a1a]/10" />
          <span className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[0.54rem] tracking-[0.14em] text-[#1a1a1a]/35">LISTINGS / OPTIONS</span>
          <span className="absolute left-1/2 bottom-3 -translate-x-1/2 font-mono text-[0.54rem] tracking-[0.14em] text-[#1a1a1a]/35">INTELLIGENCE / JUDGEMENT</span>
          <span className="absolute top-1/2 left-3 -translate-y-1/2 -rotate-90 font-mono text-[0.54rem] tracking-[0.14em] text-[#1a1a1a]/35">SELLER-PAID</span>
          <span className="absolute top-1/2 right-3 -translate-y-1/2 rotate-90 font-mono text-[0.54rem] tracking-[0.14em] text-[#9a7a2e]">BUYER-PAID</span>
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
        <div className="mt-5 rounded-r-xl border-l-2 border-[#1e6b45] bg-[#1e6b45]/[0.05] px-5 py-3 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70">
          <b className="font-medium text-[#1a1a1a]">The number that matters is the last one.</b>{" "}One in two readers finishes an 8,000-word file — that depth of attention is the leading indicator of willingness to pay.
        </div>
        <p className="mt-3.5 text-[0.76rem] font-light italic text-[#1a1a1a]/45">Buyer testimonials are being collected verbatim, with permission — available in the data room.</p>
      </Card>
    ),
  },

  {
    key: "ask",
    node: (
      <Card label="V · The ask — Exhibit 12" title="Raising — currently in conversation."
        sub="Terms in discussion with early partners — this memo states use of funds and milestones, not a number.">
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="font-mono text-[0.6rem] tracking-[0.16em] text-[#1a1a1a]/45">USE OF FUNDS</p>
            <div className="mt-4 flex flex-col gap-3">
              {([
                ["Data & field operations", 35],
                ["Engineering & AI", 30],
                ["Advisory bench", 20],
                ["Brand & distribution", 15],
              ] as const).map(([l, pct]) => (
                <div key={l}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.84rem] font-light text-[#1a1a1a]/70">{l}</span>
                    <span className="font-mono text-[0.7rem] tabular-nums text-[#1a1a1a]/50">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-[8px] overflow-hidden rounded bg-[#1a1a1a]/[0.06]">
                    <div className="h-full rounded" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#1e6b45,#238c55)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[0.6rem] tracking-[0.16em] text-[#1a1a1a]/45">MILESTONES THIS ROUND BUYS</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {[
                "100+ forensic files across every premium NCR corridor",
                "A paying advisory cohort with published outcomes",
                "Unit Intelligence as the category's decision standard",
                "Quarterly metrics in the data room — the record, kept on ourselves too",
              ].map((m) => (
                <li key={m} className="flex gap-3 text-[0.86rem] font-light leading-[1.55] text-[#1a1a1a]/70">
                  <span aria-hidden className="mt-0.5 text-[#1e6b45]">+</span>{m}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-[#1a1a1a]/[0.08] pt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${basePath}/images/founder-gaurav.webp`} alt="Gaurav Jain, founder of Truth Estate" className="h-12 w-12 rounded-full border-2 border-[#B29668]/60 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[1.02rem] font-medium">Gaurav Jain · Founder</p>
            <p className="text-[0.76rem] font-light text-[#1a1a1a]/55">Every file crosses the founder&rsquo;s desk before it ships. The same desk answers to investors.</p>
          </div>
        </div>
      </Card>
    ),
  },

  {
    key: "verdict",
    node: (
      <Card dark label="Exhibit — final · The Truth Estate file on Truth Estate" title="We rate real estate for a living. Here is our own file.">
        <div className="mt-5">
          {([
            ["Problem severity", 9.6, "Largest household purchase in India; the buyer's side is structurally unrepresented."],
            ["Timing", 9.3, "Public data matured; premium & NRI demand at highs; AI collapsed research cost."],
            ["Moat", 8.7, "Independence is a covenant — developers cannot pay us. Brand + method + data compound."],
            ["Early signal", 8.4, "50% read-through on forensic files, 40 days in, ₹0 spent."],
            ["Economics", 8.6, "Reports scale like software; advisory monetises like a fund."],
          ] as const).map(([name, score, why], i) => (
            <div key={name} className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-3 ${i > 0 ? "border-t border-[#F7F3EA]/[0.12]" : ""}`}>
              <span className="text-[0.9rem] font-light text-[#F7F3EA]/85">{name}</span>
              <span className="hidden h-[6px] w-[130px] overflow-hidden rounded bg-[#F7F3EA]/[0.14] sm:block">
                <span className="block h-full rounded" style={{ width: `${score * 10}%`, background: "linear-gradient(90deg,#1e6b45,#7fd6a4)" }} />
              </span>
              <span className="font-mono text-[1rem] tabular-nums text-[#7fd6a4]">{score.toFixed(1)}<span className="text-[0.64rem] text-[#F7F3EA]/40">/10</span></span>
              <span className="col-span-full -mt-0.5 pb-0.5 text-[0.7rem] font-light text-[#F7F3EA]/45">{why}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="rounded-full border border-[#7fd6a4]/45 bg-[#1e6b45]/35 px-5 py-2.5 text-[0.8rem] tracking-[0.06em] text-[#9fe6bf]">● STRONG BUY — our read, applied to ourselves</span>
          <a href={DATA_ROOM} className="ml-auto rounded-lg bg-[#1e6b45] px-6 py-3.5 text-[0.86rem] font-medium text-white transition-colors hover:bg-[#238c55] print:hidden">
            Request the data room →
          </a>
        </div>
        <p className="mt-4 max-w-[52rem] text-[0.68rem] font-light leading-[1.6] text-[#F7F3EA]/40">
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
  const total = SLIDES.length;

  const go = useCallback((i: number) => {
    const el = scrollerRef.current?.children[Math.max(0, Math.min(total - 1, i))] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth" });
  }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(idxRef.current + 1); }
      if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(idxRef.current - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // ref mirror so the key handler always sees the live index
  const idxRef = useRef(0);
  idxRef.current = idx;

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setIdx(Math.max(0, Math.min(total - 1, Math.round(el.scrollTop / el.clientHeight))));
  };

  return (
    <div className="relative h-svh bg-[#F1EBDF] text-[#1a1a1a]">
      {/* deck progress — stepped by slide */}
      <div className="fixed inset-x-0 top-0 z-50 h-[2px] bg-[#1a1a1a]/[0.07] print:hidden">
        <div className="h-full bg-[#9a7a2e] transition-[width] duration-300" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      {/* chrome */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 sm:px-8 print:hidden">
        <a href={basePath} aria-label="Truth Estate — Home" className="pointer-events-auto"><Logo color="#1a1a1a" className="h-6 w-auto sm:h-7" /></a>
        <span className="font-mono text-[0.52rem] uppercase tracking-[0.2em] text-[#1a1a1a]/40 sm:text-[0.56rem]">Private memorandum</span>
      </div>
      <span className="fixed bottom-4 left-5 z-40 font-mono text-[0.62rem] tabular-nums tracking-[0.18em] text-[#1a1a1a]/45 sm:left-8 print:hidden">
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
        {SLIDES.map((s) => (
          <section key={s.key}
            className="flex h-svh snap-start items-center justify-center overflow-hidden px-4 pb-12 pt-16 sm:px-8 print:h-auto print:overflow-visible print:py-10"
            style={{ breakAfter: "page" }}>
            <div className="max-h-full w-full max-w-[1080px] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {s.node}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
