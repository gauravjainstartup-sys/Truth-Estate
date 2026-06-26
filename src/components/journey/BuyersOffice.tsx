"use client";

import { useMemo, useState } from "react";
import Logo from "../Logo";
import { BuyData, deriveDNA, rankProjects } from "@/lib/journey";

const NAV = [
  "Home",
  "TruthGuide",
  "Recommended Projects",
  "Shortlists",
  "Documents",
  "Meetings",
  "Messages",
  "Settings",
];

export default function BuyersOffice({ buy, onClose }: { buy: BuyData; onClose: () => void }) {
  const dna = useMemo(() => deriveDNA(buy), [buy]);
  const recs = useMemo(() => rankProjects(buy).slice(0, 3), [buy]);
  const [active, setActive] = useState("Home");

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#F4F1EA] text-[#1a1a1a] md:flex-row">
      {/* ── Sidebar ── */}
      <aside className="flex shrink-0 flex-col border-b border-[#1a1a1a]/8 bg-[#EFEAE0] px-5 py-5 md:w-64 md:border-b-0 md:border-r md:px-6 md:py-7">
        <div className="flex items-center justify-between md:block">
          <Logo color="#1a1a1a" className="h-7 w-auto opacity-80" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[11px] font-light tracking-[0.18em] text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a] md:hidden"
          >
            CLOSE
          </button>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto md:mt-10 md:flex-col md:gap-0.5 md:overflow-visible">
          {NAV.map((item) => (
            <button
              key={item}
              onClick={() => setActive(item)}
              className={`whitespace-nowrap rounded-md px-3.5 py-2.5 text-left text-[0.86rem] font-light tracking-[0.01em] transition-colors duration-200 ${
                active === item
                  ? "bg-[#1a1a1a]/[0.06] font-normal text-[#1a1a1a]"
                  : "text-[#1a1a1a]/55 hover:bg-[#1a1a1a]/[0.04] hover:text-[#1a1a1a]/85"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="mt-auto hidden pt-8 md:block">
          <button
            onClick={onClose}
            className="text-[11px] font-light tracking-[0.16em] text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]"
          >
            ← Back to site
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10 md:px-12 md:py-14">
          {/* Greeting */}
          <p className="text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">Welcome</p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h1 className="font-serif text-[2.1rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[3.1rem]">
              This is
              <br />
              Your Buyer&apos;s Office.
            </h1>
            <span className="self-start rounded-full border border-[#c9a96e]/50 px-4 py-1.5 text-[0.78rem] font-light tracking-[0.06em] text-[#1a1a1a]/70 md:self-auto">
              {dna.archetype}
            </span>
          </div>

          {/* Today's Update */}
          <Panel title="Today's Update">
            <p className="font-serif text-[1.15rem] font-light leading-relaxed text-[#1a1a1a]/80 md:text-[1.3rem]">
              We&apos;ve shortlisted{" "}
              <span className="font-medium text-[#1e6b45]">3 projects</span> worth investigating for a{" "}
              {dna.budgetRange} {dna.archetype.toLowerCase()} focused on{" "}
              {dna.topPriorities.slice(0, 2).join(" and ").toLowerCase()}.
            </p>
            <p className="mt-3 text-[0.85rem] font-light text-[#1a1a1a]/45">
              Your advisor will reach out to walk you through the full investigation.
            </p>
          </Panel>

          {/* Recommended Projects */}
          <Panel title="Recommended Projects">
            <div className="flex flex-col gap-3">
              {recs.map((r, i) => (
                <div
                  key={r.name}
                  className="flex items-center gap-5 rounded-lg border border-[#1a1a1a]/10 bg-white/50 px-5 py-4"
                >
                  <span className="font-serif text-[1rem] text-[#1a1a1a]/25">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <p className="font-serif text-[1.1rem] font-medium text-[#1a1a1a] md:text-[1.25rem]">{r.name}</p>
                    <p className="mt-0.5 text-[0.78rem] font-light tracking-[0.03em] text-[#1a1a1a]/45">
                      {r.developer} · {r.market}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-[1.15rem] font-medium leading-none text-[#1e6b45]">{r.matchPct}%</p>
                    <p className="mt-1 text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">Match</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="font-serif text-[1.15rem] font-medium leading-none text-[#1a1a1a]">{r.truthScore}</p>
                    <p className="mt-1 text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">Truth</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Two-up: Tasks + TruthGuide */}
          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
              <PanelTitle>Upcoming Tasks</PanelTitle>
              <ul className="flex flex-col gap-3.5">
                {[
                  "Review your 3 recommendations",
                  "Book an advisor introduction",
                  "Add a project to your shortlist",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[0.9rem] font-light text-[#1a1a1a]/70">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-[#1a1a1a]/25" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <PanelTitle>TruthGuide</PanelTitle>
              <div className="rounded-lg border border-[#1a1a1a]/12 bg-white/50 p-5">
                <p className="text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/60">
                  Ask anything about your shortlist — pricing, delivery risk, resale, or how two projects compare.
                </p>
                <div className="mt-4 flex items-center gap-2 border-t border-[#1a1a1a]/10 pt-4">
                  <span className="text-[#c9a96e]">›</span>
                  <span className="text-[0.85rem] font-light italic text-[#1a1a1a]/35">
                    Ask TruthGuide…
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-16 text-[0.75rem] font-light italic text-[#1a1a1a]/35">
            A live preview of your workspace. Pricing, documents and your advisor unlock as your journey continues.
          </p>
        </div>
      </main>
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 text-[10px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/40">{children}</h2>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-[#1a1a1a]/10 pt-8 md:mt-12">
      <PanelTitle>{title}</PanelTitle>
      {children}
    </section>
  );
}
