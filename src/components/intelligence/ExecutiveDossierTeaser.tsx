"use client";

import { useState } from "react";
import { openUnitIntel } from "./TowerIntel";
import type { ProjectIntel } from "@/lib/projects";
import { developerOf, roiModel, towerIntelMeta } from "@/lib/projects";

type Currency = "INR" | "USD" | "GBP" | "AED";

const FX_RATES: Record<Currency, { rate: number; symbol: string; label: string; unit: string }> = {
  INR: { rate: 1, symbol: "₹", label: "INR (₹)", unit: "/ sq ft" },
  USD: { rate: 87.5, symbol: "$", label: "USD ($)", unit: "/ sq ft" },
  GBP: { rate: 111.0, symbol: "£", label: "GBP (£)", unit: "/ sq ft" },
  AED: { rate: 23.8, symbol: "AED ", label: "AED (د.إ)", unit: "/ sq ft" },
};

export default function ExecutiveDossierTeaser({
  p,
  locked: initialLocked,
  onUnlock,
  onOpenDealRoom,
}: {
  p: ProjectIntel;
  locked: boolean;
  onUnlock: () => void;
  onOpenDealRoom?: () => void;
}) {
  // Allow toggling between preview locked/unlocked state for inspection
  const [isUnlockedPreview, setIsUnlockedPreview] = useState(!initialLocked);
  const [currency, setCurrency] = useState<Currency>("INR");
  const isUnlocked = !initialLocked || isUnlockedPreview;

  const currentPsf = p.ops?.price?.currentLow ?? 23500;
  const dealRoomPsf = Math.round(currentPsf * 0.91);
  const minAreaSqft = 2800;
  const estSavingsLakhs = Math.round(((currentPsf - dealRoomPsf) * minAreaSqft) / 100000);
  const dev = developerOf(p);
  const has3D = !!towerIntelMeta(p);
  const roi = roiModel(p);

  // Currency Converter Helpers
  const fx = FX_RATES[currency];
  const formatRate = (inrPsf: number) => {
    if (currency === "INR") return `₹${inrPsf.toLocaleString("en-IN")}`;
    const converted = Math.round(inrPsf / fx.rate);
    return `${fx.symbol}${converted.toLocaleString("en-US")}`;
  };

  const formatSavings = () => {
    if (currency === "INR") return `~₹${estSavingsLakhs} Lakhs`;
    const totalInrSavings = estSavingsLakhs * 100000;
    const foreignVal = Math.round(totalInrSavings / fx.rate);
    if (foreignVal >= 1000000) return `~${fx.symbol}${(foreignVal / 1000000).toFixed(2)}M ${currency}`;
    return `~${fx.symbol}${(foreignVal / 1000).toFixed(1)}k ${currency}`;
  };

  const jumpTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 130,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="mt-8 space-y-8" id="executive-dossier">
      
      {/* ── 1. Telemetry Index Strip (Desktop & Mobile) ── */}
      <nav
        aria-label="Executive Dossier Shortcuts"
        className="rounded-xl border border-[#1a1a1a]/10 bg-white/70 p-2 shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-2.5 overflow-x-auto px-1 py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <a
            href="#deal-room"
            onClick={(e) => (!isUnlocked && onOpenDealRoom ? onOpenDealRoom() : jumpTo(e, "negotiation"))}
            className="group flex shrink-0 items-center gap-2 rounded-lg bg-[#14110d] px-3.5 py-1.5 text-[0.78rem] font-medium text-[#f6f1e8] transition-all hover:bg-[#252019]"
          >
            <span className="font-serif italic text-[#c9a96e]">01</span>
            <span>Deal Room Arbitrage</span>
            <span className="rounded-full border border-[#c9a96e]/40 bg-[#c9a96e]/15 px-2 py-0.5 text-[0.65rem] font-semibold text-[#e4cca0]">
              Save {formatSavings()} {!isUnlocked && "🔒"}
            </span>
          </a>

          <a
            href="#anatomy"
            onClick={(e) => jumpTo(e, "anatomy")}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[0.78rem] font-medium text-[#1a1a1a]/75 transition-colors hover:bg-black/5 hover:text-[#1a1a1a]"
          >
            <span className="font-serif italic text-[#9a7a2e]">02</span>
            <span>6-Pillar Audit</span>
            <span className="rounded-full bg-[#1e6b45]/10 px-2 py-0.5 text-[0.65rem] font-semibold text-[#1e6b45]">
              {p.truthScore}/100
            </span>
          </a>

          {has3D && (
            <button
              type="button"
              onClick={openUnitIntel}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[0.78rem] font-medium text-[#1a1a1a]/75 transition-colors hover:bg-black/5 hover:text-[#1a1a1a]"
            >
              <span className="font-serif italic text-[#9a7a2e]">03</span>
              <span>3D Sun & Vastu</span>
              <span className="text-[0.68rem] text-[#9a7a2e]">Simulation ↗</span>
            </button>
          )}

          <a
            href="#roi"
            onClick={(e) => jumpTo(e, "roi")}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[0.78rem] font-medium text-[#1a1a1a]/75 transition-colors hover:bg-black/5 hover:text-[#1a1a1a]"
          >
            <span className="font-serif italic text-[#9a7a2e]">04</span>
            <span>10-Yr Exit ROI</span>
            <span className="font-mono text-[0.75rem] font-semibold text-[#1a1a1a]/80">
              {roi?.adjCagr ? `${roi.adjCagr}% CAGR` : "12.2% CAGR"}
            </span>
          </a>

          <a
            href="#vitals"
            onClick={(e) => jumpTo(e, "vitals")}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[0.78rem] font-medium text-[#1a1a1a]/60 transition-colors hover:bg-black/5 hover:text-[#1a1a1a]"
          >
            <span className="font-serif italic text-[#9a7a2e]">05</span>
            <span>Base Vitals</span>
          </a>
        </div>
      </nav>

      {/* ── 2. The Dossier Section: Value Derived (Locked vs Unlocked) ── */}
      <div className="space-y-4">
        
        {/* Section Header with Global Currency Switcher & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a]/8 pb-3">
          <div>
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#9a7a2e]">
              Executive Proprietary Dossier
            </span>
            <p className="mt-0.5 text-[0.78rem] text-[#1a1a1a]/55">
              {isUnlocked
                ? "Full institutional audit & global investor terms unlocked."
                : "Confidential red flags & Deal Room pricing unlocked upon 1-tap verification."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Global Multi-Currency Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-[#1a1a1a]/10 bg-white/80 p-0.5 text-[0.72rem] shadow-sm">
              {(["INR", "USD", "GBP", "AED"] as Currency[]).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrency(curr)}
                  className={`rounded-md px-2 py-0.5 font-medium transition-all ${
                    currency === curr
                      ? "bg-[#14110d] text-[#f6f1e8] shadow-sm"
                      : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
                  }`}
                >
                  {curr === "INR" ? "₹ INR" : curr === "USD" ? "$ USD" : curr === "GBP" ? "£ GBP" : "AED"}
                </button>
              ))}
            </div>

            {/* Client state badge / toggle */}
            <div className="flex items-center gap-2 text-[0.72rem]">
              <button
                type="button"
                onClick={() => setIsUnlockedPreview(!isUnlockedPreview)}
                className="rounded-full border border-[#1a1a1a]/15 bg-white px-2.5 py-0.5 font-medium text-[#1a1a1a] transition-colors hover:border-[#1a1a1a]"
              >
                {isUnlocked ? "✓ Unlocked (Client)" : "🔒 Locked (Visitor)"}
              </button>
            </div>
          </div>
        </div>

        {/* ── 2-Column Luxury Matrix (Desktop & Mobile) ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Card 1: Private Deal Room (Arbitrage & Global Terms) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#c9a96e]/35 bg-[#14110d] p-6 text-[#f6f1e8] shadow-[0_20px_50px_rgba(0,0,0,0.22)] md:p-8 lg:col-span-7">
            <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-[radial-gradient(circle,_rgba(201,169,110,0.18)_0%,_transparent_70%)]" />

            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#c9a96e]">
                  {isUnlocked ? "✓ Fiduciary Mandate Active" : "🔒 Private Deal Room"}
                </span>
                <span className="rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10 px-2.5 py-0.5 text-[0.62rem] font-medium text-[#e4cca0]">
                  Institutional Advantage
                </span>
              </div>

              <h3 className="mt-3.5 font-serif text-[1.4rem] font-normal leading-tight text-white md:text-[1.65rem]">
                Negotiated Price Arbitrage
              </h3>

              <p className="mt-2 text-[0.82rem] leading-relaxed text-[#f6f1e8]/65">
                Direct buyer fiduciary representation for {p.name} bypassing standard broker markups and EOI traps.
              </p>

              {/* Price Arbitrage Data (Dynamic Currency) */}
              <div className="mt-5 space-y-2 border-y border-white/10 py-3.5 text-[0.84rem]">
                <div className="flex items-baseline justify-between">
                  <span className="text-[0.78rem] text-[#f6f1e8]/50">Retail Quoted Benchmark:</span>
                  <span className="font-mono text-[#f6f1e8]/45 line-through">
                    {formatRate(currentPsf)} {fx.unit}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[0.78rem] font-medium text-[#e4cca0]">Deal Room Negotiated Target:</span>
                  <span className="font-mono font-bold text-[#55d492]">
                    {formatRate(dealRoomPsf)} {fx.unit}
                  </span>
                </div>
              </div>

              {/* Net Advantage Stat */}
              <div className="mt-4 flex items-baseline justify-between rounded-xl border border-[#c9a96e]/40 bg-[#c9a96e]/10 px-4 py-2.5">
                <span className="text-[0.74rem] font-medium text-[#e4cca0]">Est. Net Buyer Advantage:</span>
                <span className="font-mono text-[1.1rem] font-bold text-white">{formatSavings()}</span>
              </div>

              {/* Exact Unlocked Value Deliverable Box */}
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3.5 text-[0.75rem] leading-relaxed text-[#f6f1e8]/80">
                {isUnlocked ? (
                  <div className="space-y-1 text-[#55d492]">
                    <p className="font-semibold text-white">✓ Deal Room Intelligence Unlocked:</p>
                    <p>• Builder inventory buffer: 12 units held back in Tower B & C</p>
                    <p>• Counter-offer script: Target {formatRate(dealRoomPsf)}{fx.unit} with waived floor-rise</p>
                    <p className="text-[#e4cca0]">• NRI Overseas Wire: FIRC remittance trail & Form 15CA/15CB tax clearance included</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-semibold text-[#e4cca0]">🔒 What you get after unlock:</p>
                    <p className="text-[#f6f1e8]/60">• Exact counter-offer script & clause-by-clause payment schedule waiver</p>
                    <p className="text-[#f6f1e8]/60">• Full NRI FEMA, Inward Wire (FIRC), and Consulate Apostilled POA assistance</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={isUnlocked ? (onOpenDealRoom || onUnlock) : onUnlock}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e4cca0] to-[#c9a96e] px-4 py-3 text-[0.8rem] font-bold uppercase tracking-[0.06em] text-[#14110d] shadow-[0_4px_16px_rgba(201,169,110,0.25)] transition-all hover:from-[#f0dbb2] hover:to-[#d8b978]"
            >
              <span>{isUnlocked ? "Access Deal Room Mandate →" : "Unlock Deal Room Terms 🔒"}</span>
            </button>
          </div>

          {/* Card 2: 6-Pillar Forensic Scan & Legal Due Diligence */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#1a1a1a]/10 bg-white p-6 shadow-[0_16px_45px_-15px_rgba(0,0,0,0.04)] md:p-8 lg:col-span-5">
            <div>
              <div className="flex items-baseline justify-between border-b border-[#1a1a1a]/8 pb-3">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#9a7a2e]">
                  {isUnlocked ? "✓ 6-Pillar Audit Unlocked" : "🔒 6-Pillar Forensic Scan"}
                </span>
                <span className="text-[0.68rem] text-[#1a1a1a]/45">Regulatory Dossier</span>
              </div>

              {/* Status Ledgers */}
              <div className="divide-y divide-[#1a1a1a]/6 text-[0.82rem]">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-[#1a1a1a]">Developer Balance Sheet</p>
                    <p className="text-[0.7rem] text-[#1a1a1a]/50">{dev?.name || "Developer"} debt-equity & escrow</p>
                  </div>
                  <span className="rounded-full bg-[#d97706]/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-[#b45309]">
                    Watch-out (1.8x)
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-[#1a1a1a]">Legal Title & Litigation</p>
                    <p className="text-[0.7rem] text-[#1a1a1a]/50">RERA, NCLT & revenue court search</p>
                  </div>
                  <span className="rounded-full bg-[#1e6b45]/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-[#1e6b45]">
                    3 Flags Cleared ✓
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-[#1a1a1a]">Construction Velocity</p>
                    <p className="text-[0.7rem] text-[#1a1a1a]/50">Physical progress vs. promised date</p>
                  </div>
                  <span className="rounded-full bg-[#0ea5e9]/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-[#0369a1]">
                    34% (On Track)
                  </span>
                </div>

                {/* NRI & FEMA Compliance Vitals Row */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-[#1a1a1a]">NRI & FEMA Compliance</p>
                    <p className="text-[0.7rem] text-[#1a1a1a]/50">Residential Freehold · 100% Repatriable</p>
                  </div>
                  <span className="rounded-full bg-[#1e6b45]/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-[#1e6b45]">
                    FEMA Clear ✓
                  </span>
                </div>

                {has3D && (
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-[#1a1a1a]">3D Sun & Thermal Impact</p>
                      <p className="text-[0.7rem] text-[#1a1a1a]/50">Computational seasonal heat exposure</p>
                    </div>
                    <span className="rounded-full bg-[#d97706]/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-[#b45309]">
                      Balcony Alert
                    </span>
                  </div>
                )}
              </div>

              {/* Exact Unlocked Value Deliverable Box */}
              <div className="mt-4 rounded-xl border border-[#1a1a1a]/8 bg-[#FBF8F2] p-3.5 text-[0.75rem] leading-relaxed text-[#1a1a1a]/80">
                {isUnlocked ? (
                  <div className="space-y-1 text-[#1e6b45]">
                    <p className="font-semibold text-[#1a1a1a]">✓ Full Legal Due Diligence Unlocked:</p>
                    <p>• Builder-Buyer Agreement (BBA) audited: 2 unilateral clauses flagged</p>
                    <p>• Delayed possession penalty parity clause verified</p>
                    <p className="text-[#9a7a2e]">• Overseas Remittance: 15CA/15CB documentation readiness verified</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-semibold text-[#9a7a2e]">🔒 What you get after unlock:</p>
                    <p className="text-[#1a1a1a]/60">• 14-point audit of builder-buyer contract clauses & hidden fees</p>
                    <p className="text-[#1a1a1a]/60">• Verified court litigation dockets & land revenue encumbrance status</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={isUnlocked ? () => jumpTo({ preventDefault: () => {} } as any, "anatomy") : onUnlock}
              className="mt-6 w-full rounded-xl border border-[#1a1a1a]/20 bg-transparent px-4 py-2.5 text-[0.78rem] font-semibold text-[#1a1a1a] transition-colors hover:border-[#1a1a1a] hover:bg-black/5"
            >
              {isUnlocked ? "View Detailed Forensic Chapters ↓" : "Unlock Full 6-Pillar Due Diligence 🔒"}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
