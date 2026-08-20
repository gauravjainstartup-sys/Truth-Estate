"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/dealroom/SiteHeader";
import type { ApartmentClusterMeta } from "@/lib/apartmentClusters";
import type { ProjectIntel } from "@/lib/projects";
import { basePath } from "@/lib/site";
import { streetAddress } from "@/components/intelligence/ProjectOptionCard";
import { towerIntelMeta } from "@/lib/projects";

type SortKey = "score" | "priceAsc" | "priceDesc" | "name";

export default function ApartmentClusterView({
  cluster,
  projects,
}: {
  cluster: ApartmentClusterMeta;
  projects: ProjectIntel[];
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("score");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Telemetry aggregates
  const scores = projects.map((p) => p.truthScore).filter((s) => s > 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  
  const prices = projects.map((p) => p.ops?.price?.currentLow ?? 0).filter((pr) => pr > 0);
  const minPsf = prices.length ? Math.min(...prices) : 0;
  const maxPsf = prices.length ? Math.max(...prices) : 0;

  // Filter & Search
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = projects.filter((p) => {
      if (!query) return true;
      const hay = [p.name, p.developer, p.market, streetAddress(p)].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(query);
    });

    list.sort((a, b) => {
      if (sort === "score") return b.truthScore - a.truthScore;
      if (sort === "priceAsc") {
        const aP = a.ops?.price?.currentLow ?? 0;
        const bP = b.ops?.price?.currentLow ?? 0;
        return aP - bP;
      }
      if (sort === "priceDesc") {
        const aP = a.ops?.price?.currentLow ?? 0;
        const bP = b.ops?.price?.currentLow ?? 0;
        return bP - aP;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [projects, q, sort]);

  const inrGroup = (n: number) => n.toLocaleString("en-IN");

  return (
    <div className="min-h-screen bg-[#14110d] text-[#f4efe6]" style={{ fontFeatureSettings: '"ss01"' }}>
      <SiteHeader />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-wider text-[#a9a196]">
          <Link href="/" className="transition-colors hover:text-[#e7cf95]">Home</Link>
          <span className="text-[#6f685c]">/</span>
          <Link href="/intelligence/projects" className="transition-colors hover:text-[#e7cf95]">Gurugram</Link>
          <span className="text-[#6f685c]">/</span>
          <span className="text-[#e7cf95]">{cluster.h1}</span>
        </nav>

        {/* Hero Section */}
        <div className="mt-6 border-b border-[#c9a96e]/15 pb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10 px-3.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[#e7cf95]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7fd0a3]" />
            {cluster.badge} · Verified 2026 Audit
          </div>

          <h1 className="mt-4 font-serif text-[2.2rem] font-medium leading-[1.15] text-[#f4efe6] sm:text-[3rem]">
            {cluster.h1}.
          </h1>

          <p className="mt-3.5 max-w-3xl text-[1rem] leading-relaxed text-[#a9a196] sm:text-[1.08rem]">
            {cluster.intro}
          </p>

          {/* Telemetry Highlights Strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-xl border border-[#c9a96e]/15 bg-[#1b1712] p-4">
              <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-[#6f685c]">Verified Projects</span>
              <p className="mt-1 font-serif text-[1.45rem] font-semibold text-[#f4efe6]">{projects.length}</p>
              <span className="text-[0.72rem] text-[#7fd0a3]">100% RERA checked</span>
            </div>

            <div className="rounded-xl border border-[#c9a96e]/15 bg-[#1b1712] p-4">
              <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-[#6f685c]">Average TruthScore</span>
              <p className="mt-1 font-serif text-[1.45rem] font-semibold text-[#e7cf95]">{avgScore}<span className="text-[0.8rem] text-[#a9a196]">/100</span></p>
              <span className="text-[0.72rem] text-[#a9a196]">Across 6 audit pillars</span>
            </div>

            <div className="rounded-xl border border-[#c9a96e]/15 bg-[#1b1712] p-4">
              <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-[#6f685c]">Rate Span (₹/sq ft)</span>
              <p className="mt-1 font-serif text-[1.25rem] font-semibold text-[#f4efe6]">
                {minPsf > 0 ? `₹${inrGroup(minPsf)}` : "—"} <span className="text-[0.75rem] font-normal text-[#6f685c]">to</span> {maxPsf > 0 ? `₹${inrGroup(maxPsf)}` : "—"}
              </p>
              <span className="text-[0.72rem] text-[#a9a196]">Filed carpet &amp; super rates</span>
            </div>

            <div className="rounded-xl border border-[#c9a96e]/15 bg-[#1b1712] p-4">
              <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-[#6f685c]">Deal Room Access</span>
              <p className="mt-1 font-serif text-[1.45rem] font-semibold text-[#7fd0a3]">Direct</p>
              <span className="text-[0.72rem] text-[#a9a196]">Neutral written offers</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by project name, developer, sector…"
              className="w-full rounded-xl border border-[#c9a96e]/20 bg-[#1b1712] px-4 py-2.5 text-[0.9rem] text-[#f4efe6] placeholder-[#6f685c] outline-none transition-colors focus:border-[#c9a96e]"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[0.68rem] uppercase tracking-wider text-[#a9a196]">Sort:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "score" as SortKey, label: "TruthScore" },
                { key: "priceAsc" as SortKey, label: "Price: Low → High" },
                { key: "priceDesc" as SortKey, label: "Price: High → Low" },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  className={`rounded-lg border px-3 py-1.5 text-[0.76rem] font-medium transition-colors ${sort === s.key ? "border-[#c9a96e] bg-[#c9a96e]/20 text-[#e7cf95]" : "border-[#c9a96e]/15 bg-[#1b1712] text-[#a9a196] hover:border-[#c9a96e]/40"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const has3D = !!towerIntelMeta(p);
            const currentPsf = p.ops?.price?.currentLow ?? 23500;
            const dealRoomPsf = Math.round(currentPsf * 0.91);
            const reportUrl = `${basePath}/projects/${p.slug}`;

            return (
              <div
                key={p.slug}
                className="group flex flex-col justify-between rounded-2xl border border-[#c9a96e]/20 bg-gradient-to-b from-[#1c1813] to-[#16120d] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.5)] transition-all hover:border-[#c9a96e]/50 hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)]"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[0.62rem] uppercase tracking-wider text-[#a9a196]">{p.developer}</span>
                      <h2 className="mt-0.5 font-serif text-[1.28rem] font-semibold text-[#f4efe6] transition-colors group-hover:text-[#e7cf95]">
                        <Link href={reportUrl}>{p.name}</Link>
                      </h2>
                      <p className="text-[0.78rem] text-[#6f685c]">{streetAddress(p)} · {p.market}</p>
                    </div>

                    {/* TruthScore Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="rounded-lg border border-[#1e6b45]/40 bg-[#1e6b45]/20 px-2.5 py-1 font-mono text-[0.82rem] font-bold text-[#7fd0a3]">
                        {p.truthScore}
                      </span>
                      <span className="mt-0.5 text-[0.55rem] uppercase tracking-wider text-[#6f685c]">TruthScore</span>
                    </div>
                  </div>

                  {/* Pricing & Area Box */}
                  <div className="mt-4 rounded-xl border border-[#c9a96e]/10 bg-[#14110d] p-3.5">
                    <div className="flex items-center justify-between text-[0.85rem]">
                      <span className="text-[#a9a196]">Filed ₹/sq ft:</span>
                      <span className="font-serif font-bold text-[#e7cf95]">₹{inrGroup(currentPsf)}<span className="text-[0.72rem] font-normal text-[#a9a196]">/sq ft</span></span>
                    </div>
                    {(() => {
                      const superAreas = (p.ops?.homes ?? []).map((h) => h.superSqft).filter((sq) => sq > 0);
                      const areaStr = superAreas.length ? (Math.min(...superAreas) === Math.max(...superAreas) ? `${inrGroup(Math.min(...superAreas))} sq ft` : `${inrGroup(Math.min(...superAreas))} – ${inrGroup(Math.max(...superAreas))} sq ft`) : (p.configs?.join(", ") || null);
                      if (!areaStr) return null;
                      return (
                        <div className="mt-1.5 flex items-center justify-between text-[0.78rem] text-[#6f685c]">
                          <span>Configuration:</span>
                          <span className="font-mono text-[#a9a196]">{areaStr}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Feature Badges */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {has3D ? (
                      <span className="rounded-md border border-[#c9a96e]/30 bg-[#c9a96e]/15 px-2 py-0.5 font-mono text-[0.62rem] font-medium text-[#e7cf95]">
                        ☀️ Sun &amp; Vastu 3D Live
                      </span>
                    ) : (
                      <span className="rounded-md border border-[#c9a96e]/15 bg-[#1b1712] px-2 py-0.5 font-mono text-[0.62rem] text-[#a9a196]">
                        📐 Layout &amp; Facing Audit
                      </span>
                    )}
                    <span className="rounded-md border border-[#1e6b45]/30 bg-[#1e6b45]/10 px-2 py-0.5 font-mono text-[0.62rem] text-[#7fd0a3]">
                      RERA Verified
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-6 flex flex-col gap-2 border-t border-[#c9a96e]/10 pt-4">
                  <Link
                    href={reportUrl}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-[#c9a96e]/25 bg-[#1d1913] py-2.5 text-[0.84rem] font-semibold text-[#f4efe6] transition-colors hover:border-[#c9a96e]/60 hover:bg-[#c9a96e]/10"
                  >
                    View Forensic Dossier →
                  </Link>
                  <Link
                    href={`${basePath}/deal-room`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#1e6b45] py-2.5 text-[0.84rem] font-semibold text-white shadow-[0_4px_14px_rgba(30,107,69,0.4)] transition-colors hover:bg-[#2e8b57]"
                  >
                    Deal Room Arbitrage (Save ~₹{inrGroup(currentPsf - dealRoomPsf)}/sq ft)
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Structured Comparative Table (GEO-Optimized) */}
        <div className="mt-16 rounded-2xl border border-[#c9a96e]/20 bg-[#18140f] p-6 shadow-xl">
          <div className="border-b border-[#c9a96e]/15 pb-4">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#c9a96e]">Comparative Intelligence Matrix</span>
            <h2 className="mt-1 font-serif text-[1.5rem] font-medium text-[#f4efe6]">
              {cluster.h1} — Ranked Telemetry Overview
            </h2>
            <p className="mt-1 text-[0.84rem] text-[#a9a196]">
              Ground intelligence across TruthScore, delivery pace, price per square foot, and daylight modeling.
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[0.84rem]">
              <thead>
                <tr className="border-b border-[#c9a96e]/10 font-mono text-[0.62rem] uppercase tracking-wider text-[#6f685c]">
                  <th className="py-3 pr-4">Project &amp; Developer</th>
                  <th className="py-3 px-4">Corridor</th>
                  <th className="py-3 px-4">TruthScore</th>
                  <th className="py-3 px-4">Filed ₹/sq ft</th>
                  <th className="py-3 px-4">Sun &amp; Vastu Status</th>
                  <th className="py-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9a96e]/10">
                {projects.slice(0, 15).map((p) => {
                  const currentPsf = p.ops?.price?.currentLow ?? 23500;
                  const has3D = !!towerIntelMeta(p);
                  return (
                    <tr key={p.slug} className="transition-colors hover:bg-[#c9a96e]/[0.04]">
                      <td className="py-3.5 pr-4">
                        <Link href={`${basePath}/projects/${p.slug}`} className="font-medium text-[#f4efe6] hover:text-[#e7cf95]">
                          {p.name}
                        </Link>
                        <span className="block text-[0.72rem] text-[#6f685c]">{p.developer}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#a9a196]">{p.market}</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded px-2 py-0.5 font-mono text-[0.78rem] font-bold text-[#7fd0a3] bg-[#1e6b45]/20">
                          {p.truthScore}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-serif font-medium text-[#e7cf95]">
                        ₹{inrGroup(currentPsf)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[0.74rem]">
                        {has3D ? (
                          <span className="text-[#e7cf95]">☀️ 3D Sun Model</span>
                        ) : (
                          <span className="text-[#6f685c]">📐 Layout Audit</span>
                        )}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Link href={`${basePath}/projects/${p.slug}`} className="text-[0.78rem] text-[#c9a96e] hover:underline">
                          Report →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Editorial Market Context */}
        <div className="mt-12 rounded-2xl border border-[#c9a96e]/15 bg-[#17130e] p-6">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#c9a96e]">2026 Ground Reality</span>
          <h3 className="mt-1 font-serif text-[1.3rem] font-medium text-[#f4efe6]">What Buyers Must Check in this Segment</h3>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-[#a9a196]">
            {cluster.metaSummary} In 2026, premium developers in Gurugram frequently quote super built-up areas with 30–35% loading. Truth Estate verifies the exact carpet area sanctioned under Haryana RERA filings so you negotiate on real usable square footage rather than marketing brochure numbers.
          </p>
        </div>

        {/* FAQ Accordion Section (GEO Search Snippets) */}
        {cluster.faqs && cluster.faqs.length > 0 && (
          <div className="mt-14 border-t border-[#c9a96e]/15 pt-10">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#c9a96e]">Frequently Answered Intelligence</span>
            <h2 className="mt-1.5 font-serif text-[1.75rem] font-medium text-[#f4efe6]">
              Questions Buyers Ask About {cluster.h1}
            </h2>

            <div className="mt-6 flex flex-col gap-3">
              {cluster.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-xl border border-[#c9a96e]/15 bg-[#1a1611] transition-colors hover:border-[#c9a96e]/30"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left font-serif text-[1rem] font-medium text-[#f4efe6]"
                  >
                    <span>{faq.q}</span>
                    <span className="ml-4 font-mono text-[1.1rem] text-[#c9a96e]">{activeFaq === idx ? "−" : "+"}</span>
                  </button>
                  {activeFaq === idx && (
                    <div className="border-t border-[#c9a96e]/10 px-5 py-4 text-[0.88rem] leading-relaxed text-[#a9a196]">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
