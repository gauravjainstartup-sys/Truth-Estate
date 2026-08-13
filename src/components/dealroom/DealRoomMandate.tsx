"use client";

import { useState } from "react";
import Logo from "../Logo";
import Footer from "../Footer";
import { basePath } from "@/lib/site";

/* ── Case Studies & Testimonials on Record ── */
const CASE_STUDIES = [
  {
    project: "DLF Privana South",
    location: "SPR Corridor · Sector 76–77",
    config: "4 BHK Executive Residence",
    benchmark: "₹9.80 Cr",
    winningBid: "₹9.48 Cr",
    saved: "₹32 Lakhs",
    teFee: "₹3.2 Lakhs",
    netBuyerSaved: "₹28.8 Lakhs",
    source: "Direct Resale Owner · NRI Fast Exit",
    quote: "Truth Estate sourced a clean, unencumbered resale unit from an overseas owner that never hit public portals. Saved us nearly ₹30 Lakhs without a single broker call.",
    buyer: "NRI Tech VP · Bay Area, USA",
  },
  {
    project: "M3M Capital",
    location: "Dwarka Expressway · Sector 113",
    config: "3 BHK Premium Tower",
    benchmark: "₹2.22 Cr",
    winningBid: "₹2.09 Cr",
    saved: "₹13 Lakhs",
    teFee: "₹1.3 Lakhs",
    netBuyerSaved: "₹11.7 Lakhs",
    source: "Channel Partner End-of-Quarter Subvention",
    quote: "I had a target price of ₹2.12 Cr in mind. The Deal Room brought back four written offers with full itemized cost sheets. Picked the subvention deal and paid zero upfront.",
    buyer: "Founder & CEO · Cyber City Gurugram",
  },
  {
    project: "Smart World One DXP",
    location: "Dwarka Expressway · Sector 113",
    config: "3.5 BHK High-Rise",
    benchmark: "₹3.60 Cr",
    winningBid: "₹3.42 Cr",
    saved: "₹18 Lakhs",
    teFee: "₹1.8 Lakhs",
    netBuyerSaved: "₹16.2 Lakhs",
    source: "Developer Unadvertised Allotment",
    quote: "The best part was zero spam. My phone number was never leaked to brokers. Truth Estate ran the clearinghouse, brought the bids, and handled the paperwork.",
    buyer: "Managing Director · Private Equity",
  },
];

/* ── How It Works Steps ── */
const STEPS = [
  {
    num: "01",
    title: "Name your asset",
    time: "2 minutes",
    desc: "Specify the project, BHK, target budget, and whether you prefer primary developer inventory, direct resale, or both.",
  },
  {
    num: "02",
    title: "We float it blindly",
    time: "Within 24 hours",
    desc: "Your mandate is taken to developers, owners, and top brokers as a represented buyer. Your name and phone number never leave our vault.",
  },
  {
    num: "03",
    title: "Written bids arrive",
    time: "2–4 days",
    desc: "Sellers and channel partners submit binding, written offers with complete itemized cost sheets (including PLC, GST, and parking).",
  },
  {
    num: "04",
    title: "You compare & pick",
    time: "You decide",
    desc: "Review offers side by side against our RERA market read. Pick the deal you want, sign the BBA/ATS, and keep 90% of what we save you.",
  },
];

export default function DealRoomMandate() {
  const [budgetCr, setBudgetCr] = useState<number>(5.0);
  const [activeTab, setActiveTab] = useState<"all" | "primary" | "resale">("all");

  // Form State
  const [projectName, setProjectName] = useState("");
  const [unitConfig, setUnitConfig] = useState("3 BHK");
  const [targetBudget, setTargetBudget] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Dynamic Math
  const estimatedSavingsLakhs = Math.round(budgetCr * 100 * 0.03); // ~3% benchmark savings
  const feeLakhs = +(estimatedSavingsLakhs * 0.1).toFixed(1);
  const netSavedLakhs = +(estimatedSavingsLakhs - feeLakhs).toFixed(1);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#14110d] text-[#f4efe6] selection:bg-[#c9a96e] selection:text-[#14110d]" style={{ fontFeatureSettings: '"ss01"' }}>
      {/* ── Top Navigation ── */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <a href={`${basePath}/`} aria-label="Truth Estate — home">
          <Logo className="h-9 w-auto opacity-85 hover:opacity-100 transition-opacity" />
        </a>

        <div className="flex items-center gap-6">
          <a
            href={`${basePath}/deal-room`}
            className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[#a9a196] transition-colors hover:text-[#f4efe6]"
          >
            About the Deal Room
          </a>
          <a
            href="#mandate"
            className="rounded-full border border-[#c9a96e]/40 bg-[#c9a96e]/10 px-5 py-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#e7cf95] transition-all hover:bg-[#c9a96e]/20 hover:border-[#c9a96e]/60"
          >
            Start Mandate
          </a>
        </div>
      </nav>

      {/* ═══ 1. HERO: APPLE-STYLE MINIMALIST IMPACT ═══ */}
      <header className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 65% 50% at 50% 0%, rgba(201,169,110,0.07) 0%, transparent 70%)" }} />

        <div className="relative mx-auto max-w-4xl px-6 text-center md:px-10">
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">
            The Deal Room · Buyer Mandate
          </p>

          <h1 className="mt-6 font-serif text-[clamp(2.8rem,6vw,4.8rem)] font-normal leading-[1.05] tracking-[-0.015em] text-[#f4efe6]">
            You pick the home. <br />
            <span className="italic text-[#e7cf95]">We make the price submit.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl font-serif text-[1.18rem] italic leading-[1.65] text-[#cbc2b4] md:text-[1.32rem]">
            Stop calling ten brokers. Name the unit you want. The market bids in writing. You keep 90% of what we save you.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5">
            <a
              href="#mandate"
              className="w-full sm:w-auto rounded-full bg-[#1e6b45] px-9 py-4 font-mono text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_16px_36px_-12px_rgba(30,107,69,.7)] transition-all hover:bg-[#288356] hover:scale-[1.01]"
            >
              Start your mandate →
            </a>
            <span className="text-[0.82rem] tracking-[0.04em] text-[#a9a196]">
              100% Confidential · Zero Upfront Cost
            </span>
          </div>

          {/* Privacy Guarantee Pill */}
          <div className="mt-12 inline-flex items-center gap-3 rounded-full border border-[#c9a96e]/20 bg-[#1c1813] px-5 py-2.5 text-xs text-[#a9a196]">
            <span className="h-2 w-2 rounded-full bg-[#1e6b45]" />
            <span><strong className="text-[#f4efe6] font-medium">Blind Vault Shield:</strong> Your phone number and name are NEVER shared with brokers or sellers.</span>
          </div>
        </div>
      </header>

      {/* ═══ 2. THE PHILOSOPHY: QUIETLY COMPETITIVE ═══ */}
      <section className="border-t border-[#f4efe6]/[0.08] bg-[#1a1611]">
        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">
                The Mandate Advantage
              </p>
              <h2 className="mt-5 font-serif text-[2.2rem] font-medium leading-[1.15] text-[#f4efe6] md:text-[2.8rem]">
                Quietly competitive. <br />
                <span className="italic text-[#e7cf95]">Blindly fair.</span>
              </h2>
              <p className="mt-6 text-[1.02rem] leading-[1.8] text-[#a9a196]">
                When you buy a ₹5 Cr+ home alone, five brokers call you with five different verbal numbers. Each one is incentivized to close fast at the highest possible price.
              </p>
              <p className="mt-4 text-[1.02rem] leading-[1.8] text-[#a9a196]">
                The Deal Room turns the table. We act as your private clearinghouse, floating your mandate blindly to developers, primary channel partners, and direct resale owners. Sellers submit binding written offers to win your business.
              </p>
            </div>

            {/* Quiet Contrast Card */}
            <div className="rounded-2xl border border-[#c9a96e]/20 bg-[#14110d] p-8 space-y-6">
              <div className="border-b border-[#f4efe6]/10 pb-5">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#6f685c]">Traditional Brokerage</p>
                <p className="mt-1 font-serif text-[1.1rem] text-[#b8a4a4]">Paid by the deal · Higher price = Bigger commission</p>
              </div>

              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#c9a96e]">The Deal Room</p>
                <p className="mt-1 font-serif text-[1.1rem] text-[#e7cf95]">Paid strictly by you · Lower price = Higher savings for you</p>
              </div>

              <div className="border-t border-[#f4efe6]/10 pt-5 text-xs text-[#a9a196] leading-relaxed">
                Zero developer brokerage. Zero listing promotion fees. We stand exclusively on your side of the table.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. THE 10% SAVINGS MATH ═══ */}
      <section className="border-t border-[#f4efe6]/[0.08] bg-[#14110d]">
        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-28 text-center">
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">
            Transparent Economics
          </p>

          <h2 className="mt-5 font-serif text-[2.2rem] font-medium leading-[1.15] text-[#f4efe6] md:text-[2.9rem]">
            Zero upfront. 10% of savings. <br />
            <span className="italic text-[#e7cf95]">90% stays in your bank.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-[1.02rem] leading-relaxed text-[#a9a196]">
            If we don't beat your target or market benchmark, you pay ₹0. Our fee is payable only after your Builder-Buyer Agreement (BBA) or Agreement to Sell (ATS) is signed.
          </p>

          {/* Minimalist Savings Interactive Display */}
          <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-[#c9a96e]/20 bg-[#1c1813] p-8 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f4efe6]/10 pb-6">
              <label className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[#a9a196]">
                Target Property Budget: <span className="text-[#f4efe6] font-bold text-[1.05rem]">₹{budgetCr.toFixed(1)} Cr</span>
              </label>
              <input
                type="range"
                min="2.0"
                max="20.0"
                step="0.5"
                value={budgetCr}
                onChange={(e) => setBudgetCr(parseFloat(e.target.value))}
                aria-label="Property budget in Crores"
                className="h-1.5 w-full sm:w-64 cursor-pointer appearance-none rounded-lg bg-[#2e261e] accent-[#c9a96e]"
              />
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#6f685c]">Est. Savings (~3%)</p>
                <p className="mt-2 font-serif text-[2rem] font-semibold text-[#f4efe6]">₹{estimatedSavingsLakhs} Lakhs</p>
                <p className="mt-1 text-[0.75rem] text-[#6f685c]">Below market benchmark</p>
              </div>

              <div>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#c9a96e]">Truth Estate Fee (10%)</p>
                <p className="mt-2 font-serif text-[2rem] font-semibold text-[#e7cf95]">₹{feeLakhs} Lakhs</p>
                <p className="mt-1 text-[0.75rem] text-[#a9a196]">Paid post-BBA signing</p>
              </div>

              <div>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#1e6b45]">Your Net Savings (90%)</p>
                <p className="mt-2 font-serif text-[2rem] font-semibold text-[#7fd0a3]">₹{netSavedLakhs} Lakhs</p>
                <p className="mt-1 text-[0.75rem] text-[#7fd0a3]">Stays in your account</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. TESTIMONIALS & CASE RECORDS ═══ */}
      <section className="border-t border-[#f4efe6]/[0.08] bg-[#1a1611]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#f4efe6]/10 pb-8">
            <div>
              <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">
                Verified Records
              </p>
              <h2 className="mt-3 font-serif text-[2.2rem] font-normal text-[#f4efe6] md:text-[2.8rem]">
                Real mandates. Verified savings.
              </h2>
            </div>

            {/* Scope Filter Tabs */}
            <div className="flex items-center gap-2 rounded-full border border-[#c9a96e]/20 bg-[#14110d] p-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em]">
              {(["all", "primary", "resale"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`rounded-full px-4 py-1.5 transition-all ${
                    activeTab === t ? "bg-[#c9a96e] text-[#14110d] font-bold" : "text-[#a9a196] hover:text-white"
                  }`}
                >
                  {t === "all" ? "All Mandates" : t === "primary" ? "Primary Clearance" : "Resale Exits"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {CASE_STUDIES.filter((c) => {
              if (activeTab === "primary") return c.source.includes("Primary") || c.source.includes("Channel");
              if (activeTab === "resale") return c.source.includes("Resale") || c.source.includes("NRI");
              return true;
            }).map((c, i) => (
              <div key={i} className="flex flex-col justify-between rounded-2xl border border-[#c9a96e]/15 bg-[#14110d] p-7 transition-all hover:border-[#c9a96e]/40">
                <div>
                  <div className="flex items-center justify-between border-b border-[#f4efe6]/10 pb-4">
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#c9a96e]">{c.source}</span>
                    <span className="font-serif text-[0.95rem] text-[#7fd0a3] font-medium">Saved {c.saved}</span>
                  </div>

                  <h3 className="mt-5 font-serif text-[1.3rem] text-[#f4efe6]">{c.project}</h3>
                  <p className="font-mono text-[0.68rem] text-[#a9a196]">{c.location} · {c.config}</p>

                  <blockquote className="mt-5 font-serif text-[0.95rem] italic leading-relaxed text-[#cbc2b4]">
                    “{c.quote}”
                  </blockquote>
                </div>

                <div className="mt-8 border-t border-[#f4efe6]/10 pt-4 font-mono text-[0.68rem] text-[#6f685c]">
                  Mandate executed by <span className="text-[#a9a196]">{c.buyer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 5. HOW IT WORKS: 4 CLEAN STEPS ═══ */}
      <section className="border-t border-[#f4efe6]/[0.08] bg-[#14110d]">
        <div className="mx-auto max-w-5xl px-6 py-24 md:px-10 md:py-28">
          <div className="text-center">
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">
              The Concierge Process
            </p>
            <h2 className="mt-3 font-serif text-[2.2rem] font-normal text-[#f4efe6] md:text-[2.8rem]">
              Four steps. Zero phone calls to brokers.
            </h2>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.num} className="rounded-2xl border border-[#c9a96e]/15 bg-[#1c1813] p-6">
                <span className="font-mono text-[1.4rem] font-light text-[#c9a96e]">{s.num}</span>
                <h3 className="mt-4 font-serif text-[1.15rem] font-medium text-[#f4efe6]">{s.title}</h3>
                <p className="mt-2 text-[0.85rem] leading-relaxed text-[#a9a196]">{s.desc}</p>
                <div className="mt-4 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#6f685c]">{s.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 6. IN-PAGE MANDATE FORM (ELEGANT & RESTRAINED) ═══ */}
      <section id="mandate" className="border-t border-[#f4efe6]/[0.08] bg-[#1a1611] py-24">
        <div className="mx-auto max-w-3xl px-6 md:px-10">
          <div className="text-center">
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#c9a96e]">
              Start Your Mandate
            </p>
            <h2 className="mt-3 font-serif text-[2.4rem] font-normal text-[#f4efe6]">
              Name your asset.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[0.98rem] text-[#a9a196]">
              Takes 2 minutes. We confirm your mandate within 24 hours.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-[#c9a96e]/20 bg-[#14110d] p-8 md:p-10">
            {!submitted ? (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label className="block font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[#a9a196]">
                    Project Name / Sector
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DLF The Arbour, Privana North, M3M Capital"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#f4efe6]/15 bg-[#1c1813] px-4 py-3.5 text-sm text-[#f4efe6] placeholder-[#6f685c] focus:border-[#c9a96e] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[#a9a196]">
                      Unit Configuration
                    </label>
                    <select
                      value={unitConfig}
                      onChange={(e) => setUnitConfig(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-[#f4efe6]/15 bg-[#1c1813] px-4 py-3.5 text-sm text-[#f4efe6] focus:border-[#c9a96e] focus:outline-none"
                    >
                      <option>3 BHK Luxury</option>
                      <option>3.5 BHK</option>
                      <option>4 BHK Luxury</option>
                      <option>Penthouse / Villa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[#a9a196]">
                      Target Budget (Cr)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ₹5.2 Cr"
                      value={targetBudget}
                      onChange={(e) => setTargetBudget(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-[#f4efe6]/15 bg-[#1c1813] px-4 py-3.5 text-sm text-[#f4efe6] placeholder-[#6f685c] focus:border-[#c9a96e] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[#a9a196]">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-[#f4efe6]/15 bg-[#1c1813] px-4 py-3.5 text-sm text-[#f4efe6] placeholder-[#6f685c] focus:border-[#c9a96e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[#a9a196]">
                      Phone Number (For 24-hr Callback)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-[#f4efe6]/15 bg-[#1c1813] px-4 py-3.5 text-sm text-[#f4efe6] placeholder-[#6f685c] focus:border-[#c9a96e] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 text-xs text-[#a9a196] leading-relaxed">
                  🔒 <strong>Blind Vault Guarantee:</strong> Your phone number is strictly held by Truth Estate's advisory desk. It is never shared with brokers, developers, or sellers.
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#1e6b45] py-4 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white shadow-lg transition-all hover:bg-[#288356]"
                >
                  Submit Mandate &rarr;
                </button>
              </form>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1e6b45] text-xl text-white">
                  ✓
                </div>
                <h3 className="mt-5 font-serif text-2xl text-[#f4efe6]">Mandate Received.</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-[#a9a196]">
                  A senior Truth Estate advisor will contact you within 24 hours to lock your target price and launch your blind market float.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-[#c9a96e] underline underline-offset-4"
                >
                  Submit another mandate
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer precededByDark />
    </div>
  );
}
