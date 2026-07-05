"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import type { LiveBacklogFull } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════════
   LIVE PROJECT REPORT — the auto-generated file for pipeline
   projects. Renders the ten-module mapping from the scoring
   pipeline; any field the pipeline hasn't extracted yet shows NA,
   so the template is complete even while the data catches up.
   The eight hand-built flagship files keep their own richer page.
   ════════════════════════════════════════════════════════════════ */

const basePath = "/Truth-Estate";

/* NA discipline: every missing value renders the same quiet chip */
function NA() {
  return <span className="rounded border border-[#1a1a1a]/15 px-1.5 py-0.5 font-mono text-[0.58rem] tracking-[0.08em] text-[#1a1a1a]/35">NA</span>;
}
const has = (v: unknown): boolean => v !== null && v !== undefined && `${v}`.trim() !== "";
function V({ v, mono = false, className = "" }: { v: unknown; mono?: boolean; className?: string }) {
  if (!has(v)) return <NA />;
  return <span className={`${mono ? "font-mono tabular-nums" : ""} ${className}`}>{String(v)}</span>;
}

/* defensive readers over pipeline-owned JSON shapes */
const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
const arr = (v: unknown): unknown[] | null => (Array.isArray(v) && v.length ? v : null);
function pick(root: unknown, ...paths: string[]): unknown {
  for (const path of paths) {
    let cur: unknown = root;
    for (const key of path.split(".")) {
      const o = obj(cur);
      if (!o || !(key in o)) { cur = undefined; break; }
      cur = o[key];
    }
    if (has(cur) && (typeof cur !== "object" || arr(cur))) return cur;
    if (cur && typeof cur === "object" && !Array.isArray(cur)) return cur;
  }
  return undefined;
}
const pickText = (root: unknown, ...paths: string[]): string | null => {
  const v = pick(root, ...paths);
  return typeof v === "string" || typeof v === "number" ? String(v) : null;
};
const pickList = (root: unknown, ...paths: string[]): string[] | null => {
  const v = pick(root, ...paths);
  const a = arr(v);
  if (!a) return null;
  const out = a.map((x) => (typeof x === "string" ? x : pickText(x, "title", "text", "summary", "point", "name") ?? null)).filter((x): x is string => !!x);
  return out.length ? out : null;
};

function Section({ n: num, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[0.6rem] tracking-[0.18em] text-[#9a7a2e]">{num}</span>
        <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/70">{title}</span>
        <span className="h-px flex-1 bg-[#1a1a1a]/10" />
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-[#1a1a1a]/[0.06] py-2.5 first:border-t-0">
      <span className="text-[0.74rem] font-light text-[#1a1a1a]/45">{k}</span>
      <span className="text-right text-[0.82rem]">{children}</span>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[#1a1a1a]/10 bg-[#FBF8F2] px-5 py-3 ${className}`}>{children}</div>;
}

function Bullets({ items }: { items: string[] | null }) {
  if (!items) return <p className="text-[0.82rem] font-light text-[#1a1a1a]/45">Pending extraction · <NA /></p>;
  return (
    <ul className="flex flex-col gap-2">
      {items.slice(0, 6).map((t, i) => (
        <li key={i} className="flex gap-2.5 text-[0.86rem] font-light leading-[1.6] text-[#1a1a1a]/70">
          <span aria-hidden className="mt-0.5 text-[#1e6b45]">+</span>{t}
        </li>
      ))}
    </ul>
  );
}

export default function LiveProjectReport({ p }: { p: LiveBacklogFull }) {
  const { open } = useJourney();

  const con = p.modConstruction;
  const track = p.modTrackRecord;
  const legal = p.modLegal;
  const fin = p.modFinancial;
  const ruleV = p.modRuleVerdict;
  const riskV = p.modRiskVerdict;
  const riskI = p.modRiskIntel;

  const verdictHeadline =
    pickText(ruleV, "headline", "verdict.headline", "summary") ??
    pickText(riskV, "headline", "verdict") ??
    p.insight;

  const riskTone = p.delayRisk && /low/i.test(p.delayRisk)
    ? "border-[#238c55]/30 bg-[#238c55]/[0.08] text-[#1c7a4c]"
    : p.delayRisk && /high/i.test(p.delayRisk)
      ? "border-[#9a4130]/30 bg-[#9a4130]/[0.07] text-[#9a4130]"
      : "border-[#9a7a2e]/35 bg-[#9a7a2e]/[0.08] text-[#8a6a1e]";

  return (
    <div className="min-h-svh bg-[#F5F0E8] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a]/6 bg-[#F5F0E8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4 md:px-10">
          <a href={basePath} aria-label="Home"><Logo color="#1a1a1a" className="h-7 w-auto" /></a>
          <button onClick={() => open()} className="ml-auto rounded-sm bg-[#1e6b45] px-4 py-2.5 text-[0.74rem] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#238c55] md:px-5">
            Request Independent Advice
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-[14vh] pt-8 md:px-10">
        <div className="flex items-center gap-2 text-[0.74rem] font-light text-[#1a1a1a]/35">
          <a href={`${basePath}/intelligence/projects`} className="transition-colors hover:text-[#1a1a1a]/70">Projects</a>
          <span className="text-[#1a1a1a]/20">/</span><span className="text-[#1a1a1a]/55">{p.name}</span>
        </div>

        {/* ── hero ── */}
        <div className="mt-6 rounded-[20px] bg-[#0b1f1a] p-7 text-[#F7F3EA] md:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#d8b978]/40 bg-[#d8b978]/[0.08] px-3 py-1 font-mono text-[0.56rem] tracking-[0.16em] text-[#d8b978]">PIPELINE FILE · AUTO-GENERATED</span>
            {p.delayRisk && <span className={`rounded-full border px-3 py-1 text-[0.62rem] font-medium ${riskTone}`}>Delay risk · {p.delayRisk}</span>}
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <div className="min-w-0 max-w-2xl">
              <h1 className="font-serif text-[2rem] font-medium leading-[1.08] tracking-[-0.01em] md:text-[2.8rem]">{p.name}</h1>
              <p className="mt-2.5 text-[0.9rem] font-light text-[#F7F3EA]/60">
                {[p.developer, p.microMarket ?? p.location].filter(Boolean).join(" · ") || "Developer NA"}
              </p>
              <p className="mt-1 text-[0.78rem] font-light text-[#F7F3EA]/40">{p.location ?? "Location NA"}</p>
            </div>
            <div className="rounded-2xl border border-[#F7F3EA]/15 bg-[#F7F3EA]/[0.05] px-6 py-4">
              <p className="font-mono text-[0.52rem] tracking-[0.26em] text-[#F7F3EA]/45">TRUTH SCORE · PIPELINE</p>
              <p className="mt-1 font-serif text-[2.6rem] font-medium leading-none text-[#7fd6a4]">
                {p.truthScore ?? "—"}<span className="ml-1.5 font-mono text-[0.7rem] text-[#F7F3EA]/35">/100</span>
              </p>
            </div>
          </div>
          {verdictHeadline && (
            <p className="mt-6 max-w-3xl border-t border-[#F7F3EA]/10 pt-5 font-serif text-[1.1rem] font-light leading-[1.5] text-[#F7F3EA]/85 md:text-[1.25rem]">
              {verdictHeadline}
            </p>
          )}
        </div>

        <p className="mt-4 text-[0.72rem] font-light leading-[1.6] text-[#1a1a1a]/45">
          Generated from RERA filings and public records by the Truth Estate pipeline · fields marked <NA /> are pending extraction · a hand-reviewed deep file follows as this project clears review.
        </p>

        {/* 01 · identification */}
        <Section n="01" title="Identification & general specs">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <Field k="Project"><V v={p.name} /></Field>
              <Field k="Developer"><V v={p.developer} /></Field>
              <Field k="Location"><V v={p.location} /></Field>
              <Field k="Sector"><NA /></Field>
              <Field k="Micro-market"><V v={p.microMarket} /></Field>
            </Panel>
            <Panel>
              <Field k="Status"><NA /></Field>
              <Field k="RERA ID"><NA /></Field>
              <Field k="RERA filing URL"><NA /></Field>
              <Field k="Registration date"><V v={p.registrationDate} mono /></Field>
              <Field k="Last updated"><NA /></Field>
            </Panel>
          </div>
        </Section>

        {/* 02 · configurations & size */}
        <Section n="02" title="Configurations & size">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <Field k="Budget band"><V v={p.budget} mono /></Field>
              <Field k="Entry price"><V v={p.minPriceCr != null ? `₹${p.minPriceCr} Cr` : null} mono /></Field>
              <Field k="Configurations"><V v={p.config} /></Field>
              <Field k="Min BHK"><V v={p.minBhk} mono /></Field>
              <Field k="Max BHK"><NA /></Field>
              <Field k="Carpet area range"><NA /></Field>
            </Panel>
            <Panel>
              <Field k="Land parcel"><V v={pickText(con, "land_area.acres")} mono /></Field>
              <Field k="Open area %"><NA /></Field>
              <Field k="Total apartments"><V v={pickText(con, "apartments_summary.total_apartments", "total_apartments")} mono /></Field>
              <Field k="Total towers"><V v={pickText(con, "apartments_summary.total_towers", "total_towers")} mono /></Field>
              <Field k="Density (apt/acre)"><NA /></Field>
            </Panel>
          </div>
        </Section>

        {/* 03 · scores */}
        <Section n="03" title="Scores & headline metrics">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {([
              ["Truth Score", p.truthScore != null ? `${p.truthScore}/100` : null, true],
              ["Match Score", null, false],
              ["Expected CAGR", p.cagr ?? (p.expectedCagrNum != null ? `${p.expectedCagrNum}%` : null), false],
              ["Adjusted ROI", p.adjustedRoi != null ? `${p.adjustedRoi}%` : null, false],
              ["Red flags", p.redFlags, false],
            ] as const).map(([k, v, hero]) => (
              <div key={k as string} className={`rounded-xl border px-4 py-3.5 ${hero ? "border-[#1e6b45]/25 bg-[#1e6b45]/[0.05]" : "border-[#1a1a1a]/[0.08] bg-white/60"}`}>
                <p className="font-mono text-[0.54rem] uppercase tracking-[0.14em] text-[#1a1a1a]/40">{k}</p>
                <p className={`mt-1.5 text-[1.15rem] font-normal tabular-nums ${hero ? "text-[#1e6b45]" : ""}`}><V v={v} mono /></p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1.5 text-[0.68rem] font-medium ${riskTone}`}>Delay risk · {p.delayRisk ?? "NA"}</span>
            <span className="rounded-full border border-[#1a1a1a]/12 px-3 py-1.5 text-[0.68rem] font-light text-[#1a1a1a]/45">Impact tag · NA</span>
          </div>
        </Section>

        {/* 04 · timelines */}
        <Section n="04" title="Dates & construction timeline">
          <Panel>
            <Field k="Launch date"><NA /></Field>
            <Field k="RERA-promised delivery"><V v={p.promised} mono /></Field>
            <Field k="Pipeline-predicted delivery"><V v={p.predicted} mono /></Field>
            <Field k="Predicted variance vs RERA"><V v={p.delayDelta} mono className={p.delayDelta && p.delayDelta.includes("+") ? "text-[#9a4130]" : "text-[#1e6b45]"} /></Field>
            <Field k="Delivery year"><V v={p.deliveryYear} mono /></Field>
            <Field k="Completion target"><NA /></Field>
          </Panel>
        </Section>

        {/* 05 · developer track record */}
        <Section n="05" title="Developer track record & health">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <Field k="Developer score"><V v={pickText(track, "score", "developer_health.score")} mono /></Field>
              <Field k="On-time delivery"><V v={pickText(track, "on_time_delivery_pct", "past_performance.on_time_delivery_pct", "onTime")} mono /></Field>
              <Field k="Launched"><V v={pickText(track, "launched")} mono /></Field>
              <Field k="Delivered"><V v={pickText(track, "delivered")} mono /></Field>
              <Field k="Ongoing"><V v={pickText(track, "ongoing")} mono /></Field>
              <Field k="Lapsed"><V v={pickText(track, "lapsed")} mono /></Field>
              <Field k="Median delay"><V v={pickText(track, "median_delay_months", "medianDelay", "avg_developer_delay")} mono /></Field>
            </Panel>
            <div className="rounded-2xl border-l-2 border-[#1e6b45]/40 bg-white/50 p-5">
              <p className="font-mono text-[0.56rem] tracking-[0.16em] text-[#9a7a2e]">PIPELINE READ · DEVELOPER</p>
              <p className="mt-2 font-serif text-[1rem] font-light leading-[1.55] text-[#1a1a1a]/80">
                {pickText(track, "verdict", "summary", "final_summary.headline", "marketing.final_summary.headline") ?? "Qualitative developer read pending extraction."}
              </p>
              <div className="mt-3"><Bullets items={pickList(track, "strengths", "points", "final_summary.points")} /></div>
            </div>
          </div>
        </Section>

        {/* 06 · construction & sales momentum */}
        <Section n="06" title="Construction momentum & sales velocity">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <Field k="Actual progress"><V v={pickText(con, "actual_progress", "actualProgress")} mono /></Field>
              <Field k="Expected progress"><V v={pickText(con, "expected_progress", "expectedProgress")} mono /></Field>
              <Field k="Pace vs schedule"><V v={pickText(con, "pace_vs_schedule_months")} mono /></Field>
              <Field k="Last QPR filed"><V v={pickText(con, "last_qpr_date")} mono /></Field>
              <Field k="QPR compliance"><V v={pickText(con, "noQprAvailable") ? "NOT FILING" : null} /></Field>
            </Panel>
            <Panel>
              <Field k="Units sold"><V v={pickText(con, "sales_velocity.sold", "sold", "soldUnits")} mono /></Field>
              <Field k="Absorption"><V v={pickText(con, "sales_velocity.units_sold_pct", "units_sold_pct", "absorptionRate")} mono /></Field>
              <Field k="Demand score"><V v={pickText(con, "demandScore")} mono /></Field>
              <Field k="Construction score"><V v={pickText(con, "constructionScore")} mono /></Field>
              <Field k="Momentum read"><V v={pickText(con, "statusHeadline", "status_headline")} /></Field>
            </Panel>
          </div>
        </Section>

        {/* 07 · legal */}
        <Section n="07" title="Legal health & litigation">
          <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
            <Panel>
              <Field k="Legal risk score"><V v={pickText(legal, "score.legal_risk_score", "legal_risk_score", "score")} mono /></Field>
              <Field k="Risk level"><V v={pickText(legal, "score.risk_level", "risk_level")} /></Field>
              <Field k="Project-level cases"><V v={arr(pick(legal, "cases.project_level"))?.length ?? null} mono /></Field>
              <Field k="Developer-level cases"><V v={arr(pick(legal, "cases.developer_level"))?.length ?? null} mono /></Field>
              <Field k="Sources on file"><V v={arr(pick(legal, "sources"))?.length ?? null} mono /></Field>
            </Panel>
            <div className="rounded-2xl border-l-2 border-[#9a7a2e]/50 bg-white/50 p-5">
              <p className="font-mono text-[0.56rem] tracking-[0.16em] text-[#9a7a2e]">WHAT THIS MEANS</p>
              <p className="mt-2 font-serif text-[1rem] font-light leading-[1.55] text-[#1a1a1a]/80">
                {pickText(legal, "what_this_means", "quick_summary.what_this_means", "summary") ?? "Plain-language legal read pending extraction."}
              </p>
              <p className="mt-4 font-mono text-[0.56rem] tracking-[0.16em] text-[#9a7a2e]">KEY FLAGS & BUYER CHECKS</p>
              <div className="mt-2"><Bullets items={pickList(legal, "key_flags", "quick_summary.key_flags", "top_risks", "buyer_checks")} /></div>
            </div>
          </div>
        </Section>

        {/* 08 · financial */}
        <Section n="08" title="Financial audit & cost allocation">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <Field k="Financial score"><V v={pickText(fin, "score", "financial_health.score")} mono /></Field>
              <Field k="Total project cost"><V v={pickText(fin, "total_project_cost_cr", "estimated_cost.total", "total")} mono /></Field>
              <Field k="Land cost"><V v={pickText(fin, "cost_of_land_cr", "rawFinancials.cost_of_land_cr")} mono /></Field>
              <Field k="Construction cost"><V v={pickText(fin, "construction_cost_cr", "rawFinancials.construction_cost_cr")} mono /></Field>
              <Field k="Infrastructure cost"><V v={pickText(fin, "infrastructure_cost_cr", "rawFinancials.infrastructure_cost_cr")} mono /></Field>
              <Field k="Regulatory cost"><V v={pickText(fin, "regulatory_cost_cr", "rawFinancials.regulatory_cost_cr")} mono /></Field>
            </Panel>
            <Panel>
              <Field k="Debt / equity"><V v={pickText(fin, "debtToEquity", "debt_to_equity")} mono /></Field>
              <Field k="Interest coverage"><V v={pickText(fin, "interestCoverage", "interest_coverage")} mono /></Field>
              <Field k="OCF / EBITDA"><V v={pickText(fin, "ocfToEbitda", "ocf_to_ebitda")} mono /></Field>
              <Field k="Inventory / sales"><V v={pickText(fin, "inventoryToSales", "inventory_to_sales")} mono /></Field>
              <Field k="Fiscal verdict"><V v={pickText(fin, "verdict", "summary")} /></Field>
            </Panel>
          </div>
        </Section>

        {/* 09 · location */}
        <Section n="09" title="Location intelligence & infrastructure">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <Field k="Location score"><NA /></Field>
              <Field k="Schools / offices / hospitals"><NA /></Field>
              <Field k="Connectivity matrix"><NA /></Field>
              <Field k="Micro-market insight"><V v={pickText(riskI, "micro_market.insight", "location.insight")} /></Field>
            </Panel>
            <div className="rounded-2xl border-l-2 border-[#238c55]/45 bg-white/50 p-5">
              <p className="font-mono text-[0.56rem] tracking-[0.16em] text-[#9a7a2e]">GROWTH DRIVERS & GAPS</p>
              <div className="mt-2"><Bullets items={pickList(riskI, "growth_drivers", "micro_market.analysis.growthDrivers", "strengths")} /></div>
            </div>
          </div>
        </Section>

        {/* 10 · verdict */}
        <Section n="10" title="The pipeline verdict">
          <div className="rounded-2xl bg-[#0b1f1a] p-7 text-[#F7F3EA] md:p-8">
            <p className="font-mono text-[0.56rem] tracking-[0.2em] text-[#d8b978]">AUTO-GENERATED VERDICT · OPEN TO CHALLENGE</p>
            <p className="mt-3 font-serif text-[1.3rem] font-medium leading-[1.35] md:text-[1.6rem]">
              {verdictHeadline ?? "Verdict pending — the pipeline has scored this project; the written verdict extracts on the next pass."}
            </p>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <p className="font-mono text-[0.54rem] tracking-[0.16em] text-[#F7F3EA]/40">KEY TAKEAWAYS</p>
                <div className="mt-2 text-[#F7F3EA]/80">
                  {pickList(ruleV, "bullets", "takeaways", "points") ? (
                    <ul className="flex flex-col gap-2">
                      {pickList(ruleV, "bullets", "takeaways", "points")!.slice(0, 4).map((t, i) => (
                        <li key={i} className="flex gap-2.5 text-[0.86rem] font-light leading-[1.6]"><span aria-hidden className="mt-0.5 text-[#7fd6a4]">+</span>{t}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[0.82rem] font-light text-[#F7F3EA]/45">Pending extraction · <span className="rounded border border-[#F7F3EA]/20 px-1.5 py-0.5 font-mono text-[0.58rem] text-[#F7F3EA]/40">NA</span></p>
                  )}
                </div>
              </div>
              <div>
                <p className="font-mono text-[0.54rem] tracking-[0.16em] text-[#F7F3EA]/40">INVESTOR FIT · X-FACTORS</p>
                <p className="mt-2 text-[0.86rem] font-light leading-[1.6] text-[#F7F3EA]/70">
                  {pickText(riskV, "investorFit", "investor_fit", "best_suited_for") ?? pickText(ruleV, "investorFit", "investor_fit") ?? "Fit analysis pending extraction."}
                </p>
              </div>
            </div>
            <button onClick={() => open()} className="mt-7 rounded-lg bg-[#1e6b45] px-6 py-3.5 text-[0.84rem] font-semibold text-white transition-colors hover:bg-[#238c55]">
              Get the human read on this project →
            </button>
          </div>
        </Section>

        <p className="mt-10 text-[0.7rem] font-light leading-[1.7] text-[#1a1a1a]/35">
          Auto-generated from RERA filings, court records and public data by the Truth Estate pipeline. Fields marked NA are pending extraction and populate automatically as the pipeline completes its passes. Not investment advice; verify specifics independently.
        </p>
      </div>
    </div>
  );
}
