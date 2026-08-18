"use client";

import { useState, useMemo } from "react";
import type { ProjectWireItem } from "@/lib/supabase";

const CATEGORY_LABELS: Record<string, { label: string; icon: string; badgeClass: string }> = {
  ALL: { label: "All Dispatches", icon: "📡", badgeClass: "bg-[#14110d] text-[#f6f1e8]" },
  CONSTRUCTION: { label: "Construction", icon: "🏗️", badgeClass: "bg-sky-500/10 text-sky-700 border-sky-500/20" },
  REGULATORY: { label: "Regulatory & RERA", icon: "⚖️", badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  INFRASTRUCTURE: { label: "Corridor Infra", icon: "🚇", badgeClass: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  CORPORATE_JV: { label: "Institutional JV", icon: "🏢", badgeClass: "bg-purple-500/10 text-purple-700 border-purple-500/20" },
  PRICING: { label: "Pricing & Sales", icon: "💹", badgeClass: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
  LEGAL: { label: "Legal & Litigation", icon: "📜", badgeClass: "bg-red-500/10 text-red-700 border-red-500/20" },
};

const IMPACT_STYLES: Record<string, { label: string; icon: string; border: string; bg: string; text: string }> = {
  POSITIVE: {
    label: "Positive Catalyst",
    icon: "🟢",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/5",
    text: "text-emerald-900",
  },
  NEUTRAL: {
    label: "Neutral / Statutory",
    icon: "⚪",
    border: "border-slate-500/25",
    bg: "bg-slate-500/5",
    text: "text-slate-900",
  },
  CAUTION: {
    label: "Forensic Caution",
    icon: "🟡",
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    text: "text-amber-950",
  },
  RISK: {
    label: "Execution / Legal Risk",
    icon: "🔴",
    border: "border-red-500/30",
    bg: "bg-red-500/8",
    text: "text-red-950",
  },
};

function formatDate(dStr: string) {
  try {
    const d = new Date(dStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dStr;
  }
}

export default function ProjectIntelligenceWire({
  items,
  projectName,
}: {
  items?: ProjectWireItem[] | null;
  projectName: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [subscribed, setSubscribed] = useState(false);
  const [contactInput, setContactInput] = useState("");

  const wireList = useMemo(() => items ?? [], [items]);

  const categoriesPresent = useMemo(() => {
    const set = new Set<string>();
    wireList.forEach((it) => set.add(it.category));
    return ["ALL", ...Array.from(set)];
  }, [wireList]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "ALL") return wireList;
    return wireList.filter((it) => it.category === activeCategory);
  }, [wireList, activeCategory]);

  if (!wireList.length) return null;

  return (
    <section aria-labelledby="wire-heading" className="mt-12 space-y-6">
      
      {/* ── 1. Section Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1a1a1a]/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              Live Forensic Wire
            </span>
            <span className="text-[0.72rem] text-[#1a1a1a]/50">
              {wireList.length} Verified Dispatches
            </span>
          </div>

          <h2 id="wire-heading" className="mt-2 font-serif text-[1.65rem] font-medium leading-tight text-[#1a1a1a] md:text-[2rem]">
            Project Intelligence Wire
          </h2>
          <p className="mt-1 text-[0.84rem] text-[#1a1a1a]/65">
            Chronological regulatory filings, EPC construction milestones, institutional JVs, and corridor infrastructure ground updates.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categoriesPresent.map((catKey) => {
            const meta = CATEGORY_LABELS[catKey] || { label: catKey, icon: "📌", badgeClass: "" };
            const isActive = activeCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setActiveCategory(catKey)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.74rem] font-medium transition-all ${
                  isActive
                    ? "bg-[#14110d] text-[#f6f1e8] shadow-sm"
                    : "border border-[#1a1a1a]/10 bg-white text-[#1a1a1a]/70 hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                {catKey === "ALL" && (
                  <span className="ml-0.5 text-[0.68rem] opacity-70">({wireList.length})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. The Chronostream ── */}
      <div className="relative space-y-6 before:absolute before:bottom-3 before:left-[1.15rem] before:top-3 before:w-[2px] before:bg-gradient-to-b before:from-[#c9a96e]/50 before:via-[#1a1a1a]/15 before:to-transparent">
        {filteredItems.map((item, idx) => {
          const catMeta = CATEGORY_LABELS[item.category] || { label: item.category, icon: "📌", badgeClass: "bg-slate-100 text-slate-700" };
          const impact = IMPACT_STYLES[item.forensicImpactType] || IMPACT_STYLES.NEUTRAL;

          return (
            <article
              key={item.id || idx}
              className={`relative ml-9 rounded-2xl border bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] md:p-8 ${
                item.isPinned ? "border-[#c9a96e]/60 ring-1 ring-[#c9a96e]/30" : "border-[#1a1a1a]/10"
              }`}
            >
              {/* Timeline Marker Node */}
              <div
                aria-hidden="true"
                className={`absolute -left-[2.85rem] top-7 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-[0.72rem] shadow-sm ${
                  item.isPinned ? "border-[#c9a96e] text-[#9a7a2e]" : "border-[#1a1a1a]/20 text-[#1a1a1a]"
                }`}
              >
                {idx + 1}
              </div>

              {/* Event Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a1a1a]/8 pb-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[0.75rem] font-semibold text-[#1a1a1a]/70">
                    {formatDate(item.eventDate)}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.68rem] font-medium ${catMeta.badgeClass}`}>
                    <span>{catMeta.icon}</span>
                    <span>{catMeta.label}</span>
                  </span>
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#c9a96e]/40 bg-[#c9a96e]/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#9a7a2e]">
                      📌 Landmark Catalyst
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[0.7rem] text-[#1a1a1a]/50">
                  <span>Source:</span>
                  <span className="font-medium text-[#1a1a1a]/80">{item.sourceName}</span>
                </div>
              </div>

              {/* Headline */}
              <h3 className="mt-4 font-serif text-[1.2rem] font-medium leading-snug text-[#1a1a1a] md:text-[1.38rem]">
                {item.headline}
              </h3>

              {/* Verified Facts */}
              <div className="mt-3.5 space-y-1.5 text-[0.85rem] leading-relaxed text-[#1a1a1a]/80">
                {item.verifiedFacts.split("\n").map((line, lIdx) => {
                  const cleanLine = line.trim();
                  if (!cleanLine) return null;
                  return (
                    <p key={lIdx} className="flex items-start gap-2">
                      <span className="text-[#9a7a2e]">•</span>
                      <span>{cleanLine.replace(/^[•\-*]\s*/, "")}</span>
                    </p>
                  );
                })}
              </div>

              {/* Forensic Impact Analysis Box */}
              <div className={`mt-5 rounded-xl border p-4 ${impact.border} ${impact.bg}`}>
                <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#9a7a2e]">
                  <span>{impact.icon}</span>
                  <span>Truth Estate Forensic Impact Read</span>
                </div>
                <p className={`mt-1.5 text-[0.82rem] leading-relaxed ${impact.text}`}>
                  {item.forensicImpactSummary}
                </p>
              </div>

              {/* Source Verification Footer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#1a1a1a]/6 pt-3 text-[0.72rem] text-[#1a1a1a]/55">
                {item.sourceDocumentRef && (
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-[#1a1a1a]/40">Docket / Ref:</span>
                    <span className="text-[#1a1a1a]/80">{item.sourceDocumentRef}</span>
                  </div>
                )}

                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#9a7a2e] underline-offset-4 hover:underline"
                  >
                    <span>Verify Primary Filing</span>
                    <span>↗</span>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ── 3. Wire Alert Subscription Lead Magnet ── */}
      <div className="rounded-2xl border border-[#c9a96e]/35 bg-[#14110d] p-6 text-[#f6f1e8] shadow-[0_16px_40px_rgba(0,0,0,0.18)] md:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#c9a96e]">
              Discrete Ground Intelligence
            </span>
            <h4 className="mt-1.5 font-serif text-[1.3rem] font-normal leading-tight text-white md:text-[1.5rem]">
              Track Ground Shifts on {projectName}
            </h4>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-[#f6f1e8]/65">
              Receive unvarnished WhatsApp / Email notifications for new court filings, RERA progress slippage, or major corridor infrastructure changes. Zero broker spam. Ever.
            </p>
          </div>

          <div className="shrink-0 lg:w-80">
            {subscribed ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-center text-[0.82rem] font-medium text-emerald-400">
                ✓ Tracking active. You will receive verified alerts for {projectName}.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (contactInput.trim()) setSubscribed(true);
                }}
                className="space-y-2.5"
              >
                <input
                  type="text"
                  required
                  placeholder="Enter Phone or Email (US/UK/UAE)"
                  value={contactInput}
                  onChange={(e) => setContactInput(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-[0.82rem] text-white placeholder-white/40 backdrop-blur-md transition-colors focus:border-[#c9a96e] focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#e4cca0] to-[#c9a96e] px-4 py-2.5 text-[0.78rem] font-bold uppercase tracking-wider text-[#14110d] shadow-[0_4px_16px_rgba(201,169,110,0.25)] transition-all hover:from-[#f0dbb2] hover:to-[#d8b978]"
                >
                  Enable Project Alerts 🔔
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

    </section>
  );
}
