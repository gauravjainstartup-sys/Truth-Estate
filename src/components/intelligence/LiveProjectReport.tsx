"use client";

import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import type { LiveBacklogFull } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════════
   LIVE PROJECT REPORT — the auto-generated file for pipeline
   projects, parsed against the pipeline's real payload shapes:
   · financial_subscores — five balance-sheet subscores, /100
   · legal_risks — four risk levels (LOW / MODERATE / HIGH)
   · rule_verdict — verdict headline, key signals, persona fit,
     seven pillar scores (/100) with bands
   · risk_intelligence — the rules engine: flags fired per domain
   · developer_track_record — avg_delay months, lapsed_pct
   · construction_pace — a single number: months vs schedule
   Fields the view doesn't carry yet render a quiet NA chip.
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
const numAt = (root: unknown, ...paths: string[]): number | null => {
  const v = pick(root, ...paths);
  const x = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(x) ? x : null;
};
const boolAt = (root: unknown, ...paths: string[]): boolean | null => {
  const v = pick(root, ...paths);
  return typeof v === "boolean" ? v : null;
};
const pickList = (root: unknown, ...paths: string[]): string[] | null => {
  const v = pick(root, ...paths);
  const a = arr(v);
  if (!a) return null;
  const out = a.map((x) => (typeof x === "string" ? x : pickText(x, "title", "text", "summary", "point", "name") ?? null)).filter((x): x is string => !!x);
  return out.length ? out : null;
};

/* tones — bands come from the rules engine as strong / good / weak … */
const levelTone = (lvl: string) =>
  /low|none|clear|minimal/i.test(lvl)
    ? "border-[#238c55]/30 bg-[#238c55]/[0.08] text-[#1c7a4c]"
    : /high|severe|critical|elevated/i.test(lvl)
      ? "border-[#9a4130]/30 bg-[#9a4130]/[0.07] text-[#9a4130]"
      : "border-[#9a7a2e]/35 bg-[#9a7a2e]/[0.08] text-[#8a6a1e]";
const bandLight = (b: string | null) =>
  b && /strong|exceptional|excellent/i.test(b) ? "text-[#1e6b45]"
    : b && /good/i.test(b) ? "text-[#238c55]"
      : b && /weak|watch|poor/i.test(b) ? "text-[#9a4130]"
        : "text-[#8a6a1e]";
const bandDark = (b: string | null) =>
  b && /strong|exceptional|excellent/i.test(b) ? "text-[#7fd6a4]"
    : b && /good/i.test(b) ? "text-[#b4e3c8]"
      : b && /weak|watch|poor/i.test(b) ? "text-[#e8a58e]"
        : "text-[#d8b978]";
const subTone = (v: number) => (v >= 70 ? "text-[#1c7a4c]" : v >= 40 ? "text-[#8a6a1e]" : "text-[#9a4130]");

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

/* rules-engine helpers */
function FlagCount({ root, domain }: { root: unknown; domain: string }) {
  const f = pickText(root, `${domain}.flags`);
  const m = pickText(root, `${domain}.max`);
  if (f == null) return <NA />;
  const hot = Number(f) > 0;
  return <span className={`font-mono tabular-nums ${hot ? "text-[#9a4130]" : "text-[#1c7a4c]"}`}>{f}{m != null ? ` / ${m}` : ""} fired</span>;
}
function YN({ v }: { v: boolean | null }) {
  if (v == null) return <NA />;
  return v ? <span className="font-medium text-[#9a4130]">Triggered</span> : <span className="font-medium text-[#1c7a4c]">Clear</span>;
}

const FIN_SUBS = [
  ["EBITDA margin", "ebitda_margin"],
  ["OCF → EBITDA conversion", "ocf_to_ebitda"],
  ["Net debt / equity", "net_debt_to_equity"],
  ["Interest coverage", "interest_coverage_ratio"],
  ["Inventory / sales years", "inventory_to_sales_years"],
] as const;

const LEGAL_LEVELS = [
  ["Title risk", "title_risk"],
  ["Developer risk", "developer_risk"],
  ["Litigation risk", "litigation_risk"],
  ["Regulatory risk", "regulatory_risk"],
] as const;

const PILLARS = [
  ["ROI", "roi"],
  ["Legal", "legal"],
  ["Truth", "truth"],
  ["Location", "location"],
  ["Developer", "developer"],
  ["Connectivity", "connectivity"],
  ["Fundamentals", "fundamentals"],
] as const;

export default function LiveProjectReport({ p }: { p: LiveBacklogFull }) {
  const { open } = useJourney();

  const track = p.modTrackRecord;
  const legal = p.modLegal;
  const fin = p.modFinancial;
  const ruleV = p.modRuleVerdict;
  const riskV = p.modRiskVerdict;
  const riskI = p.modRiskIntel;

  const verdictHeadline =
    pickText(ruleV, "verdict", "headline", "summary") ??
    pickText(riskV, "headline", "verdict") ??
    p.insight;

  const riskTone = p.delayRisk && /low/i.test(p.delayRisk)
    ? "border-[#238c55]/30 bg-[#238c55]/[0.08] text-[#1c7a4c]"
    : p.delayRisk && /high/i.test(p.delayRisk)
      ? "border-[#9a4130]/30 bg-[#9a4130]/[0.07] text-[#9a4130]"
      : "border-[#9a7a2e]/35 bg-[#9a7a2e]/[0.08] text-[#8a6a1e]";
  const chanceTone = p.delayChancePct == null
    ? ""
    : p.delayChancePct >= 50
      ? "border-[#9a4130]/30 bg-[#9a4130]/[0.07] text-[#9a4130]"
      : p.delayChancePct >= 25
        ? "border-[#9a7a2e]/35 bg-[#9a7a2e]/[0.08] text-[#8a6a1e]"
        : "border-[#238c55]/30 bg-[#238c55]/[0.08] text-[#1c7a4c]";

  /* derived reads from the flat row — the pipeline packs signal into
     its caption strings, so we parse rather than leave NA */
  const um = p.insight?.match(/(\d+)\s*\/\s*(\d+)\s*units sold/i) ?? null;
  const unitsSold = um ? `${Number(um[1]).toLocaleString("en-IN")} / ${Number(um[2]).toLocaleString("en-IN")}` : null;
  const absorption = um && Number(um[2]) > 0 ? `${Math.round((Number(um[1]) / Number(um[2])) * 100)}%` : null;
  const progress = p.delayDelta && /complete/i.test(p.delayDelta)
    ? p.delayDelta.match(/(\d+(?:\.\d+)?)\s*%/)?.[1] ?? null
    : null;
  const pace = p.constructionPaceNum;
  const paceStr = pace != null ? `${pace > 0 ? "+" : ""}${pace} mo` : null;
  const paceCls = pace == null ? "" : pace < 0 ? "text-[#9a4130]" : "text-[#1c7a4c]";

  /* developer track record — {avg_delay, lapsed_pct} */
  const avgDelay = pickText(track, "avg_delay", "median_delay_months");
  const lapsedPct = pickText(track, "lapsed_pct");
  const trackRead =
    pickText(track, "verdict", "summary", "final_summary.headline") ??
    (avgDelay != null
      ? `Across its RERA portfolio, this developer averages ${avgDelay} months of delay${lapsedPct != null ? `; ${lapsedPct}% of its past projects have lapsed` : ""}.`
      : null);

  /* legal — four levels, plus the rules engine's legal domain */
  const legalLevels = LEGAL_LEVELS
    .map(([label, key]) => ({ label: label as string, level: pickText(legal, key) }))
    .filter((x): x is { label: string; level: string } => x.level != null);
  let legalRead = pickText(legal, "what_this_means", "quick_summary.what_this_means", "summary");
  if (!legalRead && legalLevels.length) {
    const groups = new Map<string, string[]>();
    for (const { label, level } of legalLevels) {
      const k = level.toUpperCase();
      groups.set(k, [...(groups.get(k) ?? []), label.replace(/ risk$/i, "").toLowerCase()]);
    }
    const parts = [...groups].map(([lvl, ls]) => `${ls.join(", ")} ${ls.length > 1 ? "risks read" : "risk reads"} ${lvl}`);
    const sentence = `${parts.join("; ")}.`;
    legalRead = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }
  const legalTrig = pickList(riskI, "legal.triggered");
  const legalFlags = pickText(riskI, "legal.flags");
  const legalMax = pickText(riskI, "legal.max");

  /* rules engine digest — flags fired per domain */
  const totalFlags = pickText(riskI, "total_flags");
  const flagDomains = ([["Legal", "legal"], ["Financial", "financials"], ["Track record", "track_record"], ["Pace", "construction_pace"]] as const)
    .map(([label, key]) => ({ label, f: pickText(riskI, `${key}.flags`), m: pickText(riskI, `${key}.max`) }))
    .filter((d) => d.f != null);

  /* pillar scoreboard — all scores /100; bands drive the tones */
  const pillars = PILLARS
    .map(([label, key]) => ({ label, score: pickText(ruleV, `pillar_scores.${key}_score`), band: pickText(ruleV, `pillar_bands.${key}`) }))
    .filter((x) => x.score != null || x.band != null);

  const stat: { k: string; v: unknown; hero?: boolean; cls?: string }[] = [
    { k: "Truth Score", v: p.truthScore != null ? `${p.truthScore}/100` : null, hero: true },
    { k: "Match Score", v: p.matchScore != null && p.matchScore > 0 ? `${p.matchScore}/100` : null },
    { k: "Expected CAGR", v: p.cagr ?? (p.expectedCagrNum != null ? `${p.expectedCagrNum}%` : null) },
    { k: "Adjusted ROI", v: p.adjustedRoi != null ? `${p.adjustedRoi}%` : null },
    { k: "Red flags", v: p.redFlags, cls: p.redFlags != null && p.redFlags > 0 ? "text-[#9a4130]" : "" },
    {
      k: "Delay chance",
      v: p.delayChancePct != null ? `${p.delayChancePct}%` : null,
      cls: p.delayChancePct == null ? "" : p.delayChancePct >= 50 ? "text-[#9a4130]" : p.delayChancePct >= 25 ? "text-[#8a6a1e]" : "text-[#1c7a4c]",
    },
  ];

  const personaFit =
    pickText(ruleV, "persona_fit", "investorFit", "investor_fit") ??
    pickText(riskV, "investorFit", "investor_fit", "best_suited_for");
  const primaryRisk = pickText(ruleV, "one_liner_inputs.risk");
  const legalPillar = numAt(ruleV, "pillar_scores.legal_score");
  const devPillar = numAt(ruleV, "pillar_scores.developer_score");
  const locPillar = numAt(ruleV, "pillar_scores.location_score");
  const conPillar = numAt(ruleV, "pillar_scores.connectivity_score");
  const locBand = pickText(ruleV, "pillar_bands.location");
  const conBand = pickText(ruleV, "pillar_bands.connectivity");

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
            {p.delayChancePct != null && <span className={`rounded-full border px-3 py-1 text-[0.62rem] font-medium ${chanceTone}`}>{p.delayChancePct}% delay chance</span>}
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
              <Field k="Land parcel"><NA /></Field>
              <Field k="Open area %"><NA /></Field>
              <Field k="Total apartments"><V v={um ? Number(um[2]).toLocaleString("en-IN") : null} mono /></Field>
              <Field k="Total towers"><NA /></Field>
              <Field k="Density (apt/acre)"><NA /></Field>
            </Panel>
          </div>
        </Section>

        {/* 03 · scores */}
        <Section n="03" title="Scores & headline metrics">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {stat.map(({ k, v, hero, cls }) => (
              <div key={k} className={`rounded-xl border px-4 py-3.5 ${hero ? "border-[#1e6b45]/25 bg-[#1e6b45]/[0.05]" : "border-[#1a1a1a]/[0.08] bg-white/60"}`}>
                <p className="font-mono text-[0.54rem] uppercase tracking-[0.14em] text-[#1a1a1a]/40">{k}</p>
                <p className={`mt-1.5 text-[1.15rem] font-normal tabular-nums ${hero ? "text-[#1e6b45]" : cls ?? ""}`}><V v={v} mono /></p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1.5 text-[0.68rem] font-medium ${riskTone}`}>Delay risk · {p.delayRisk ?? "NA"}</span>
            <span className="rounded-full border border-[#1a1a1a]/12 px-3 py-1.5 text-[0.68rem] font-light text-[#1a1a1a]/45">Impact tag · NA</span>
          </div>
          {(totalFlags != null || flagDomains.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[#1a1a1a]/[0.08] bg-white/60 px-4 py-3">
              <span className="font-mono text-[0.54rem] uppercase tracking-[0.16em] text-[#1a1a1a]/40">Rules engine</span>
              {totalFlags != null && (
                <span className={`text-[0.78rem] font-medium tabular-nums ${Number(totalFlags) > 0 ? "text-[#9a4130]" : "text-[#1c7a4c]"}`}>
                  {totalFlags} flag{Number(totalFlags) === 1 ? "" : "s"} fired
                </span>
              )}
              {flagDomains.map((d) => (
                <span key={d.label} className="font-mono text-[0.62rem] tabular-nums text-[#1a1a1a]/55">
                  {d.label} <span className={Number(d.f) > 0 ? "text-[#9a4130]" : "text-[#1c7a4c]"}>{d.f}{d.m != null ? `/${d.m}` : ""}</span>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* 04 · timelines */}
        <Section n="04" title="Dates & construction timeline">
          <Panel>
            <Field k="Launch date"><NA /></Field>
            <Field k="RERA-promised delivery"><V v={p.promised} mono /></Field>
            <Field k="Pipeline-predicted delivery"><V v={p.predicted} mono /></Field>
            <Field k="Delivery horizon"><V v={p.deliveryYear} mono /></Field>
            <Field k="Construction progress"><V v={progress != null ? `${progress}% complete` : p.delayDelta} mono /></Field>
            <Field k="Pace vs schedule"><V v={paceStr} mono className={paceCls} /></Field>
          </Panel>
        </Section>

        {/* 05 · developer track record */}
        <Section n="05" title="Developer track record & health">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <Field k="Developer pillar score">
                {devPillar != null ? <span className={`font-mono tabular-nums ${subTone(devPillar)}`}>{devPillar}<span className="text-[#1a1a1a]/30"> /100</span></span> : <NA />}
              </Field>
              <Field k="Average portfolio delay"><V v={avgDelay != null ? `${avgDelay} months` : null} mono /></Field>
              <Field k="Projects lapsed"><V v={lapsedPct != null ? `${lapsedPct}%` : null} mono /></Field>
              <Field k="Delay rule"><YN v={boolAt(riskI, "track_record.delay_triggered")} /></Field>
              <Field k="Lapse rule"><YN v={boolAt(riskI, "track_record.lapsed_triggered")} /></Field>
              <Field k="On-time delivery %"><NA /></Field>
            </Panel>
            <div className="rounded-2xl border-l-2 border-[#1e6b45]/40 bg-white/50 p-5">
              <p className="font-mono text-[0.56rem] tracking-[0.16em] text-[#9a7a2e]">PIPELINE READ · DEVELOPER</p>
              <p className="mt-2 font-serif text-[1rem] font-light leading-[1.55] text-[#1a1a1a]/80">
                {trackRead ?? "Qualitative developer read pending extraction."}
              </p>
              {pickList(track, "strengths", "points", "final_summary.points") && (
                <div className="mt-3"><Bullets items={pickList(track, "strengths", "points", "final_summary.points")} /></div>
              )}
            </div>
          </div>
        </Section>

        {/* 06 · construction & sales momentum */}
        <Section n="06" title="Construction momentum & sales velocity">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <Field k="Actual progress"><V v={progress != null ? `${progress}%` : null} mono /></Field>
              <Field k="Expected progress"><NA /></Field>
              <Field k="Pace vs schedule"><V v={paceStr} mono className={paceCls} /></Field>
              <Field k="Pace rule"><FlagCount root={riskI} domain="construction_pace" /></Field>
              <Field k="Last QPR filed"><NA /></Field>
            </Panel>
            <Panel>
              <Field k="Units sold"><V v={unitsSold} mono /></Field>
              <Field k="Absorption"><V v={absorption} mono className={absorption === "100%" ? "text-[#1c7a4c]" : ""} /></Field>
              <Field k="Demand score"><NA /></Field>
              <Field k="Momentum read"><V v={p.delayDelta} /></Field>
            </Panel>
          </div>
        </Section>

        {/* 07 · legal */}
        <Section n="07" title="Legal health & litigation">
          <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
            <Panel>
              <Field k="Legal pillar score">
                {legalPillar != null ? <span className={`font-mono tabular-nums ${subTone(legalPillar)}`}>{legalPillar}<span className="text-[#1a1a1a]/30"> /100</span></span> : <NA />}
              </Field>
              {LEGAL_LEVELS.map(([label, key]) => {
                const lvl = pickText(legal, key);
                return (
                  <Field key={key} k={label}>
                    {lvl ? <span className={`rounded-full border px-2.5 py-0.5 text-[0.64rem] font-medium ${levelTone(lvl)}`}>{lvl}</span> : <NA />}
                  </Field>
                );
              })}
              <Field k="Cases on record"><NA /></Field>
            </Panel>
            <div className="rounded-2xl border-l-2 border-[#9a7a2e]/50 bg-white/50 p-5">
              <p className="font-mono text-[0.56rem] tracking-[0.16em] text-[#9a7a2e]">WHAT THIS MEANS</p>
              <p className="mt-2 font-serif text-[1rem] font-light leading-[1.55] text-[#1a1a1a]/80">
                {legalRead ?? "Plain-language legal read pending extraction."}
              </p>
              <p className="mt-4 font-mono text-[0.56rem] tracking-[0.16em] text-[#9a7a2e]">RULES ENGINE · LEGAL FLAGS</p>
              <div className="mt-2">
                {legalTrig ? (
                  <Bullets items={legalTrig} />
                ) : legalFlags != null && Number(legalFlags) === 0 ? (
                  <p className="text-[0.86rem] font-light text-[#1c7a4c]">No legal flags — 0 of {legalMax ?? "—"} rules fired.</p>
                ) : (
                  <Bullets items={null} />
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* 08 · financial */}
        <Section n="08" title="Financial audit & cost allocation">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              {FIN_SUBS.map(([label, key]) => {
                const v = numAt(fin, key);
                return (
                  <Field key={key} k={label}>
                    {v != null ? <span className={`font-mono tabular-nums ${subTone(v)}`}>{v}<span className="text-[#1a1a1a]/30"> /100</span></span> : <NA />}
                  </Field>
                );
              })}
            </Panel>
            <Panel>
              <Field k="Financial flags"><FlagCount root={riskI} domain="financials" /></Field>
              <Field k="Screening threshold"><V v={pickText(riskI, "financials.score_threshold")} mono /></Field>
              <Field k="Total project cost"><NA /></Field>
              <Field k="Land / construction split"><NA /></Field>
              <Field k="Infrastructure & regulatory cost"><NA /></Field>
            </Panel>
          </div>
          <p className="mt-3 text-[0.7rem] font-light text-[#1a1a1a]/40">
            Balance-sheet subscores are the pipeline&rsquo;s 0–100 reads of the developer&rsquo;s filings — higher is healthier. Flags fire when a subscore drops below the screening threshold.
          </p>
        </Section>

        {/* 09 · location */}
        <Section n="09" title="Location intelligence & infrastructure">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <Field k="Location pillar score">
                {locPillar != null ? <span className={`font-mono tabular-nums ${bandLight(locBand)}`}>{locPillar}<span className="text-[#1a1a1a]/30"> /100</span></span> : <NA />}
              </Field>
              <Field k="Connectivity score">
                {conPillar != null ? <span className={`font-mono tabular-nums ${bandLight(conBand)}`}>{conPillar}<span className="text-[#1a1a1a]/30"> /100</span></span> : <NA />}
              </Field>
              <Field k="Micro-market"><V v={p.microMarket} /></Field>
              <Field k="Schools / offices / hospitals"><NA /></Field>
              <Field k="Connectivity matrix"><NA /></Field>
            </Panel>
            <div className="rounded-2xl border-l-2 border-[#238c55]/45 bg-white/50 p-5">
              <p className="font-mono text-[0.56rem] tracking-[0.16em] text-[#9a7a2e]">GROWTH DRIVERS & GAPS</p>
              <div className="mt-2"><Bullets items={pickList(riskI, "growth_drivers", "micro_market.analysis.growthDrivers")} /></div>
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
            {pillars.length > 0 && (
              <>
                <p className="mt-6 font-mono text-[0.54rem] tracking-[0.16em] text-[#F7F3EA]/40">SEVEN PILLARS · RULES ENGINE · /100</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
                  {pillars.map(({ label, score, band }) => (
                    <div key={label} className="rounded-xl border border-[#F7F3EA]/12 bg-[#F7F3EA]/[0.04] px-3 py-3">
                      <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-[#F7F3EA]/40">{label}</p>
                      <p className={`mt-1 font-serif text-[1.3rem] font-medium leading-none tabular-nums ${bandDark(band)}`}>{score ?? "—"}</p>
                      {band && <p className={`mt-1.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] ${bandDark(band)}`}>{band}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p className="font-mono text-[0.54rem] tracking-[0.16em] text-[#F7F3EA]/40">KEY SIGNALS</p>
                <div className="mt-2 text-[#F7F3EA]/80">
                  {pickList(ruleV, "key_signals", "bullets", "takeaways", "points") ? (
                    <ul className="flex flex-col gap-2">
                      {pickList(ruleV, "key_signals", "bullets", "takeaways", "points")!.slice(0, 4).map((t, i) => (
                        <li key={i} className="flex gap-2.5 text-[0.86rem] font-light leading-[1.6]"><span aria-hidden className="mt-0.5 text-[#7fd6a4]">+</span>{t}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[0.82rem] font-light text-[#F7F3EA]/45">Pending extraction · <span className="rounded border border-[#F7F3EA]/20 px-1.5 py-0.5 font-mono text-[0.58rem] text-[#F7F3EA]/40">NA</span></p>
                  )}
                </div>
              </div>
              <div>
                <p className="font-mono text-[0.54rem] tracking-[0.16em] text-[#F7F3EA]/40">INVESTOR FIT</p>
                <p className="mt-2 text-[0.86rem] font-light leading-[1.6] text-[#F7F3EA]/70">
                  {personaFit ?? "Fit analysis pending extraction."}
                </p>
                {primaryRisk && (
                  <p className="mt-3 text-[0.8rem] font-light leading-[1.6] text-[#e8a58e]">
                    <span className="font-mono text-[0.54rem] uppercase tracking-[0.16em]">Primary risk · </span>{primaryRisk}
                  </p>
                )}
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
