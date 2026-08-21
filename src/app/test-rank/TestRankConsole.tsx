"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  rankCore,
  corridorKey,
  weightsFor,
  mustHaveConfigsFrom,
  PERSONA_BRIEF,
  PURCHASE_TYPES,
  LOCATIONS,
  CONFIGS,
  TIMELINES,
  POSSESSION_OPTIONS,
  MAX_PRIORITIES,
  prioritiesFor,
  type BuyData,
  type Possession,
  type RankAxis,
  type RankFit,
} from "@/lib/journey";
import { useMatchCatalog, MOCK_INTEL } from "@/lib/useMatchCatalog";
import type { ProjectIntel } from "@/lib/projects";

/* ════════════════════════════════════════════════════════════════
   RANK CONSOLE — internal QA harness for the buyer matching engine.
   Left: a full buyer brief + RUN, with the active persona's weights and the
   exact per-axis scoring rules stated inline. Right: the ranked catalog with
   the per-axis breakdown behind every score (new honest 0–100 AND what the
   site shows today), above a data-completeness audit of the matchable
   universe. Same rankCore + live catalog the shortlist uses.
   ════════════════════════════════════════════════════════════════ */

type Ranked = ProjectIntel & { matchPct: number; _score: number; _fit: RankFit };

const AXES: RankAxis[] = ["budget", "config", "location", "priority", "trust", "invest"];
const AXIS_LABEL: Record<RankAxis, string> = {
  budget: "Budget",
  config: "Config",
  location: "Corridor",
  priority: "Priorities",
  trust: "Trust",
  invest: "Investor",
};

const KNOWN_CORRIDORS = new Set(LOCATIONS.map(corridorKey));

/* what the live site displays today — the 72–99 relative band, reconstructed
   from the honest raw so both numbers can always be shown side by side. */
const sitePctOf = (score: number, max: number) =>
  Math.min(99, Math.max(72, Math.round(86 + (score / (max || 1)) * 12)));
const honestPctOf = (score: number) => Math.min(99, Math.round(score));

type AxisPresence = { truth: boolean; budget: boolean; config: boolean; corridor: boolean; tags: boolean };
function presenceOf(p: ProjectIntel): AxisPresence {
  return {
    truth: (p.truthScore ?? 0) > 0,
    budget: (p.budget?.[0] ?? 0) > 0 || (p.budget?.[1] ?? 0) > 0,
    config: (p.configs ?? []).some((c) => c && c.toUpperCase() !== "NA"),
    corridor: KNOWN_CORRIDORS.has(corridorKey(p.market ?? "")),
    tags: (p.tags ?? []).length > 0,
  };
}
function verdictOf(a: AxisPresence): "Complete" | "Partial" | "Thin" {
  const n = [a.truth, a.budget, a.config, a.corridor, a.tags].filter(Boolean).length;
  if (!a.truth || !a.budget) return "Thin";
  return n === 5 ? "Complete" : "Partial";
}
const missingAxes = (a: AxisPresence): string[] =>
  (Object.entries(a) as [string, boolean][]).filter(([, v]) => !v).map(([k]) => k);

type Preset = { label: string; d: Partial<BuyData> };
const PRESETS: Preset[] = [
  { label: "First Home · 6Cr · SPR · 3BHK", d: { purchaseType: "First Home", budgetCr: 6, locations: ["SPR"], configs: ["3 BHK"], priorities: ["On-Time Delivery", "Legal Safety"], notes: "" } },
  { label: "Investor · 4Cr · Dwarka", d: { purchaseType: "Investment", budgetCr: 4, locations: ["Dwarka Expressway"], configs: [], priorities: ["Capital Appreciation", "Rental Yield"], notes: "" } },
  { label: "Upgrade · 10Cr · duplex must", d: { purchaseType: "Upgrade", budgetCr: 10, locations: ["Golf Course Extension"], configs: ["4 BHK"], priorities: ["Luxury Lifestyle"], notes: "A duplex is a must for us." } },
  { label: "Holiday · 8Cr · flexible", d: { purchaseType: "Holiday Home", budgetCr: 8, locations: [], configs: [], priorities: ["Low-Density / Green"], notes: "" } },
];

const CARD = "rounded-lg border border-[#1a1a1a14] bg-white";
const CHIP_ON = "border-[#9a7a2e] bg-[#9a7a2e] text-white";
const CHIP_OFF = "border-[#1a1a1a26] bg-white text-[#1a1a1a99] hover:border-[#9a7a2e80]";
const chip = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-[0.8rem] font-medium transition-colors ${on ? CHIP_ON : CHIP_OFF}`;

const budgetLabel = (cr: number) => (cr >= 21 ? "₹20 Cr+" : `₹${cr} Cr`);

export default function TestRankConsole() {
  const catalog = useMatchCatalog();
  const isLive = catalog != null && catalog !== MOCK_INTEL;

  const [purchaseType, setPurchaseType] = useState<string>("First Home");
  const [budgetCr, setBudgetCr] = useState(6);
  const [possession, setPossession] = useState<Possession | null>("under-construction");
  const [locations, setLocations] = useState<string[]>(["SPR"]);
  const [configs, setConfigs] = useState<string[]>(["3 BHK"]);
  const [timeline, setTimeline] = useState<string | null>("Within 3 Months");
  const [priorities, setPriorities] = useState<string[]>(["On-Time Delivery", "Legal Safety"]);
  const [notes, setNotes] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showThin, setShowThin] = useState(true);
  const [ran, setRan] = useState<{ results: Ranked[]; musts: string[] } | null>(null);

  const W = weightsFor(purchaseType);
  const personaPriorities = prioritiesFor(purchaseType);
  const musts = mustHaveConfigsFrom(notes);

  const toggle = (list: string[], v: string, cap = Infinity) =>
    list.includes(v) ? list.filter((x) => x !== v) : list.length >= cap ? list : [...list, v];

  /* persona change also swaps the priority vocabulary — drop selections the
     new persona doesn't offer (mirrors the onboarding journey). */
  const pickPersona = (t: string) => {
    setPurchaseType(t);
    setPriorities((s) => s.filter((x) => prioritiesFor(t).includes(x)));
  };

  const applyPreset = (p: Preset) => {
    const t = p.d.purchaseType ?? "First Home";
    setPurchaseType(t);
    setBudgetCr(p.d.budgetCr ?? 6);
    setLocations(p.d.locations ?? []);
    setConfigs(p.d.configs ?? []);
    setPriorities((p.d.priorities ?? []).filter((x) => prioritiesFor(t).includes(x)));
    setNotes(p.d.notes ?? "");
  };

  /* corridor chips: the 8 Gurugram corridors + Noida, PLUS any corridor the
     live catalog files that isn't in that vocabulary yet — so the page always
     shows what the backend really has. */
  const corridorChips = useMemo(() => {
    const seen = new Map<string, { label: string; fromCatalog: boolean }>();
    for (const l of LOCATIONS) seen.set(corridorKey(l), { label: l, fromCatalog: false });
    for (const p of catalog ?? []) {
      const m = (p.market ?? "").trim();
      if (!m) continue;
      const k = corridorKey(m);
      if (!seen.has(k)) seen.set(k, { label: m, fromCatalog: true });
    }
    return [...seen.values()];
  }, [catalog]);

  const run = () => {
    if (!catalog) return;
    const buy: BuyData = { possession, purchaseType, budgetCr, locations, configs, timeline, priorities, notes };
    const results = rankCore(catalog, buy) as Ranked[];
    setRan({ results, musts: mustHaveConfigsFrom(notes) });
  };

  const audit = useMemo(() => {
    if (!catalog) return null;
    const rows = catalog.map((p) => ({ p, a: presenceOf(p), v: verdictOf(presenceOf(p)) }));
    const counts = { Complete: 0, Partial: 0, Thin: 0 } as Record<string, number>;
    rows.forEach((r) => (counts[r.v] += 1));
    return { rows, counts, total: catalog.length };
  }, [catalog]);

  const maxScore = ran ? Math.max(...ran.results.map((r) => r._score), 1) : 1;
  const shown = ran ? (showAll ? ran.results : ran.results.slice(0, 20)) : [];

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-8 text-[#1a1a1a] sm:px-8">
      <header className="mx-auto mb-6 max-w-[1320px]">
        <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#9a7a2e]">Internal · not indexed</p>
        <h1 className="mt-1 font-serif text-2xl font-medium sm:text-[1.8rem]">Rank Console</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-[#1a1a1a99]">
          The live matching engine, exposed for testing. Same <code className="text-[#9a7a2e]">rankCore</code> and live
          catalog the shortlist uses — the scoring rule for every input is written next to it.
        </p>
      </header>

      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
        {/* ─────────── LEFT · the brief ─────────── */}
        <aside className={`${CARD} h-max p-5 lg:sticky lg:top-6`}>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p)} className="rounded-md border border-[#1a1a1a1f] bg-[#faf7f1] px-2.5 py-1 text-[0.72rem] font-medium text-[#1a1a1a99] hover:border-[#9a7a2e80] hover:text-[#1a1a1a]">
                {p.label}
              </button>
            ))}
          </div>

          <Field label="Purchase type — sets the persona">
            <div className="flex flex-wrap gap-1.5">
              {PURCHASE_TYPES.map((t) => (
                <button key={t} onClick={() => pickPersona(t)} className={chip(purchaseType === t)}>{t}</button>
              ))}
            </div>
            {/* the persona's defaults, in the open: brief + live weight table */}
            <div className="mt-3 rounded-md border border-[#9a7a2e2e] bg-[#9a7a2e08] p-3">
              <p className="text-[0.78rem] italic text-[#1a1a1a99]">{PERSONA_BRIEF[purchaseType]}</p>
              <div className="mt-2.5 grid grid-cols-3 gap-x-3 gap-y-1.5">
                {AXES.filter((ax) => W[ax] > 0).map((ax) => (
                  <div key={ax}>
                    <div className="flex justify-between font-mono text-[0.6rem] text-[#1a1a1a80]">
                      <span>{AXIS_LABEL[ax]}</span>
                      <span className="tabular-nums font-semibold text-[#9a7a2e]">{W[ax]}</span>
                    </div>
                    <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-[#1a1a1a0f]">
                      <div className="h-full rounded-full bg-[#9a7a2e]" style={{ width: `${(W[ax] / 28) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 font-mono text-[0.6rem] text-[#1a1a1a66]">weights sum to 100 → score is /100 · Investor axis = appreciation + liquidity signals</p>
            </div>
          </Field>

          <Field label={`Budget · ${budgetLabel(budgetCr)}`} hint="inside a project's band = full · project cheaper = 90% · entry above you = fades to 0 over ₹2.5 Cr (hard cut at +₹2 Cr)">
            <input type="range" min={1} max={21} step={1} value={budgetCr} onChange={(e) => setBudgetCr(+e.target.value)} className="w-full accent-[#9a7a2e]" />
            <div className="mt-1 flex justify-between font-mono text-[0.62rem] text-[#1a1a1a66]"><span>₹1 Cr</span><span>₹20 Cr+</span></div>
          </Field>

          <Field label="Possession" hint="qualifier only — ready-to-move routes to the off-ramp; not scored">
            <div className="flex flex-wrap gap-1.5">
              {POSSESSION_OPTIONS.map((o) => (
                <button key={o.key} onClick={() => setPossession(o.key)} className={chip(possession === o.key)}>{o.label}</button>
              ))}
            </div>
          </Field>

          <Field label="Corridors — multi-select" hint="ANY selected corridor matching the project = full corridor score; none matching = 25% credit. Corridors don't bleed into each other (Sohna Road ≠ Sohna).">
            <div className="flex flex-wrap gap-1.5">
              {corridorChips.map(({ label, fromCatalog }) => (
                <button key={label} onClick={() => setLocations((s) => toggle(s, label))} className={chip(locations.includes(label))}>
                  {label}{fromCatalog && <span className="ml-1 font-mono text-[0.55rem] opacity-70">live</span>}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Configurations — multi-select" hint="best chip counts: exact match = 100% · one BHK off = 45% · project data blank = 50% · known miss = 20%. A project offering NONE of your chips is filtered out (unless nothing would remain).">
            <div className="flex flex-wrap gap-1.5">
              {CONFIGS.map((c) => (
                <button key={c} onClick={() => setConfigs((s) => toggle(s, c))} className={chip(configs.includes(c))}>{c}</button>
              ))}
            </div>
          </Field>

          <Field label="Timeline" hint="context for your advisor + urgency — NOT scored today">
            <div className="flex flex-wrap gap-1.5">
              {TIMELINES.map((t) => (
                <button key={t} onClick={() => setTimeline(t)} className={chip(timeline === t)}>{t}</button>
              ))}
            </div>
          </Field>

          <Field label={`Priorities — this persona's list · up to ${MAX_PRIORITIES}`} hint="score = share of your picks the project's evidence tags serve (2 of 3 = 67%)">
            <div className="flex flex-wrap gap-1.5">
              {personaPriorities.map((p) => (
                <button key={p} onClick={() => setPriorities((s) => toggle(s, p, MAX_PRIORITIES))} className={chip(priorities.includes(p))} disabled={!priorities.includes(p) && priorities.length >= MAX_PRIORITIES}>{p}</button>
              ))}
            </div>
          </Field>

          <Field label="In your own words" hint="“duplex is a must” / “must be 4 BHK” becomes a HARD filter — projects not offering it are dropped, even if that leaves zero. Everything else guides the AI re-rank.">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. A duplex is a must for us." className="w-full rounded-md border border-[#1a1a1a26] bg-white px-3 py-2 text-[0.82rem] outline-none focus:border-[#9a7a2e]" />
            {musts.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-[#b4432f]">Hard filter:</span>
                {musts.map((m) => (
                  <span key={m} className="rounded-full border border-[#b4432f59] bg-[#b4432f0d] px-2 py-0.5 text-[0.7rem] font-semibold text-[#b4432f]">{m} — must have</span>
                ))}
              </div>
            )}
          </Field>

          <button
            onClick={run}
            disabled={!catalog}
            className="mt-5 w-full rounded-md bg-[#1a1a1a] py-3 text-[0.9rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {catalog ? "RUN" : "Loading catalog…"}
          </button>
        </aside>

        {/* ─────────── RIGHT · audit + results ─────────── */}
        <section className="min-w-0">
          {/* data-completeness audit */}
          <div className={`${CARD} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-lg font-medium">Data completeness</h2>
              <span className="font-mono text-[0.7rem] text-[#1a1a1a80]">
                {catalog ? `${audit?.total ?? 0} in catalog · ${isLive ? "LIVE" : "mock fallback"}` : "loading…"}
              </span>
            </div>
            <p className="mt-1 text-[0.82rem] text-[#1a1a1a99]">
              Matching needs five fields per project: Truth Score, budget, configs, a resolvable corridor, and evidence
              tags. A project can carry a Truth Score and still be un-rankable if the rest are blank.
            </p>
            {audit && (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Stat n={audit.counts.Complete} label="Complete" tone="green" />
                  <Stat n={audit.counts.Partial} label="Partial" tone="gold" />
                  <Stat n={audit.counts.Thin} label="Thin" tone="red" />
                </div>
                {(audit.counts.Thin > 0 || audit.counts.Partial > 0) && (
                  <div className="mt-3">
                    <button onClick={() => setShowThin((v) => !v)} className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-[#9a7a2e]">
                      {showThin ? "▾" : "▸"} Projects needing data ({audit.counts.Thin + audit.counts.Partial})
                    </button>
                    {showThin && (
                      <ul className="mt-2 divide-y divide-[#1a1a1a0f] text-[0.82rem]">
                        {audit.rows
                          .filter((r) => r.v !== "Complete")
                          .sort((a) => (a.v === "Thin" ? -1 : 1))
                          .map((r) => (
                            <li key={r.p.slug || r.p.name} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5">
                              <VerdictPill v={r.v} />
                              <span className="font-medium">{r.p.name}</span>
                              <span className="text-[#1a1a1a80]">missing: {missingAxes(r.a).join(", ") || "—"}</span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* the two numbers, explained once */}
          <div className={`${CARD} mt-6 p-4`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-[#1e6b45]">Match /100 (big number)</p>
                <p className="mt-1 text-[0.8rem] text-[#1a1a1a99]">
                  The real score out of 100 — weights × fit, nothing else. 92 means genuinely excellent; 55 means a real
                  compromise. Capped at 99: we never claim perfect.
                </p>
              </div>
              <div>
                <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-[#1a1a1a80]">“Site shows today” (small number)</p>
                <p className="mt-1 text-[0.8rem] text-[#1a1a1a99]">
                  What /shortlist currently displays: everything squeezed into a 72–99 band relative to the top pick, so
                  even weak fits look like ~90%. Shown here side-by-side so we can decide when to switch the site to the
                  real number.
                </p>
              </div>
            </div>
          </div>

          {/* ranked results */}
          <div className="mt-6">
            {!ran ? (
              <div className={`${CARD} p-10 text-center text-[0.9rem] text-[#1a1a1a80]`}>
                Set a brief and hit <b>RUN</b> to rank the catalog.
              </div>
            ) : ran.results.length === 0 ? (
              <div className={`${CARD} p-10 text-center text-[0.9rem] text-[#1a1a1a80]`}>
                <p className="font-serif text-lg text-[#1a1a1a]">No project clears this brief.</p>
                <p className="mt-2">
                  {ran.musts.length > 0
                    ? `Your must-have (${ran.musts.join(", ")}) filtered out every project — none in the catalog has it in its config data. That's the honest answer; if a project should qualify, its configuration data needs backfilling.`
                    : "The affordability gate left nothing to rank."}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-serif text-lg font-medium">
                    Ranked · {ran.results.length} match{ran.results.length === 1 ? "" : "es"}
                    {ran.musts.length > 0 && (
                      <span className="ml-2 font-mono text-[0.68rem] font-normal text-[#b4432f]">after “{ran.musts.join(", ")}” hard filter</span>
                    )}
                  </h2>
                  {ran.results.length > 20 && (
                    <button onClick={() => setShowAll((v) => !v)} className="font-mono text-[0.72rem] font-semibold text-[#9a7a2e]">
                      {showAll ? "show top 20" : `show all ${ran.results.length}`}
                    </button>
                  )}
                </div>
                <ol className="space-y-3">
                  {shown.map((r, i) => (
                    <RankRow key={r.slug || r.name} r={r} rank={i + 1} sitePct={sitePctOf(r._score, maxScore)} />
                  ))}
                </ol>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-1.5 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a80]">{label}</p>
      {children}
      {hint && <p className="mt-1.5 text-[0.7rem] leading-relaxed text-[#1a1a1a66]">{hint}</p>}
    </div>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone: "green" | "gold" | "red" }) {
  const c = tone === "green" ? "#1e6b45" : tone === "gold" ? "#9a7a2e" : "#b4432f";
  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: `${c}33`, background: `${c}0d` }}>
      <span className="font-serif text-xl font-medium tabular-nums" style={{ color: c }}>{n}</span>
      <span className="ml-1.5 text-[0.75rem] text-[#1a1a1a99]">{label}</span>
    </div>
  );
}

function VerdictPill({ v }: { v: "Complete" | "Partial" | "Thin" }) {
  const c = v === "Complete" ? "#1e6b45" : v === "Partial" ? "#9a7a2e" : "#b4432f";
  return (
    <span className="rounded-full px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider" style={{ color: c, background: `${c}14` }}>{v}</span>
  );
}

function RankRow({ r, rank, sitePct }: { r: Ranked; rank: number; sitePct: number }) {
  return (
    <li className={`${CARD} p-4`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-7 shrink-0 text-center font-mono text-[0.8rem] font-semibold text-[#1a1a1a59]">{rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 className="font-serif text-[1.05rem] font-medium">{r.name}</h3>
            <div className="flex items-baseline gap-2.5">
              <span className="font-serif text-xl font-medium tabular-nums text-[#1e6b45]">{honestPctOf(r._score)}<small className="text-[0.7em] text-[#1a1a1a59]">/100</small></span>
              <span className="font-mono text-[0.64rem] text-[#1a1a1a59]">site shows today {sitePct}%</span>
            </div>
          </div>
          <p className="mt-0.5 font-mono text-[0.68rem] text-[#1a1a1a80]">
            {r.market || "—"} · ₹{r.budget?.[0] ?? 0}-{r.budget?.[1] ?? 0} Cr · {(r.configs ?? []).join("/") || "NA"} · truth {r.truthScore ?? 0}
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {AXES.filter((ax) => r._fit.weight[ax] > 0).map((ax) => {
              const w = r._fit.weight[ax];
              const c = r._fit.contribution[ax];
              const pct = w ? Math.round((c / w) * 100) : 0;
              return (
                <div key={ax}>
                  <div className="flex justify-between font-mono text-[0.6rem] text-[#1a1a1a80]">
                    <span>{AXIS_LABEL[ax]}</span>
                    <span className="tabular-nums">{c.toFixed(1)}/{w}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[#1a1a1a0f]">
                    <div className="h-full rounded-full bg-[#9a7a2e]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </li>
  );
}
