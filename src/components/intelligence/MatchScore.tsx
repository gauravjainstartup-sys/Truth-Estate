"use client";

import { useEffect, useState } from "react";
import {
  loadBuyData,
  saveBuyData,
  hasPreferences,
  matchScoreFor,
  matchLabel,
  emptyBuyData,
  type BuyData,
} from "@/lib/journey";
import type { ProjectIntel } from "@/lib/projects";

const BUDGETS = [
  { label: "Under ₹3 Cr", cr: 2 },
  { label: "₹3–5 Cr", cr: 4 },
  { label: "₹5–8 Cr", cr: 6 },
  { label: "₹8–12 Cr", cr: 10 },
  { label: "₹12 Cr +", cr: 14 },
];
const CONFIG_CHIPS = ["2 BHK", "3 BHK", "4 BHK", "5 BHK", "Penthouse"];
const PRIORITY_CHIPS = ["Legal Safety", "On-Time Delivery", "Capital Appreciation", "Value Buying", "Luxury Lifestyle", "Location", "Layouts", "Rental Yield"];

const toneClass = { good: "text-[#1e6b45]", fair: "text-[#9a7a2e]", low: "text-[#b0503e]" } as const;

export default function MatchScore({ project, initialBuy }: { project: ProjectIntel; initialBuy?: BuyData | null }) {
  const [buy, setBuy] = useState<BuyData | null>(initialBuy ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ budgetCr: number; configs: string[]; priorities: string[] }>({
    budgetCr: initialBuy?.budgetCr ?? 6,
    configs: initialBuy?.configs ?? [],
    priorities: initialBuy?.priorities ?? [],
  });

  useEffect(() => {
    if (!initialBuy) {
      const saved = loadBuyData();
      if (saved) {
        setBuy(saved);
        setDraft({ budgetCr: saved.budgetCr, configs: saved.configs, priorities: saved.priorities });
      }
    }
  }, [initialBuy]);

  const computed = buy && hasPreferences(buy);
  const pct = computed ? matchScoreFor(project, buy!) : null;
  const meta = pct != null ? matchLabel(pct) : null;

  const toggle = (key: "configs" | "priorities", v: string, max = 99) =>
    setDraft((d) => {
      const has = d[key].includes(v);
      let next = has ? d[key].filter((x) => x !== v) : [...d[key], v];
      if (!has && next.length > max) next = next.slice(next.length - max);
      return { ...d, [key]: next };
    });

  function save() {
    const next: BuyData = { ...emptyBuyData, ...(buy ?? {}), budgetCr: draft.budgetCr, configs: draft.configs, priorities: draft.priorities };
    saveBuyData(next);
    setBuy(next);
    setEditing(false);
  }

  const showForm = editing || !computed;

  return (
    <section id="match" className="mt-6 scroll-mt-24 overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60">
      <div className="grid gap-0 md:grid-cols-[minmax(0,260px)_1fr]">
        {/* Score face */}
        <div className="flex flex-col justify-center border-b border-[#1a1a1a]/8 bg-white/50 p-7 md:border-b-0 md:border-r">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#c9a96e]">Match Score</p>
          {computed ? (
            <>
              <p className={`mt-3 font-mono text-[3.2rem] font-light leading-none ${toneClass[meta!.tone]}`}>{pct}%</p>
              <p className={`mt-2 text-[0.86rem] font-medium ${toneClass[meta!.tone]}`}>{meta!.label} for you</p>
              <button onClick={() => setEditing((e) => !e)} className="mt-4 self-start text-[0.76rem] font-medium text-[#1a1a1a]/50 underline decoration-[#c9a96e]/40 underline-offset-2 hover:text-[#1a1a1a]/80">
                {editing ? "Close" : "Edit preferences"}
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 font-serif text-[1.4rem] leading-[1.2] text-[#1a1a1a]">How well does this fit you?</p>
              <p className="mt-2 text-[0.82rem] font-light leading-[1.6] text-[#1a1a1a]/50">Tell us what you&apos;re after — we&apos;ll score this project against your needs, not the brochure.</p>
            </>
          )}
        </div>

        {/* Body: read-out or capture form */}
        <div className="p-7">
          {!showForm && computed ? (
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">How we read your fit</p>
              <ul className="mt-4 space-y-2.5">
                <FitRow ok={project.budget[0] - 1 <= buy!.budgetCr && buy!.budgetCr <= project.budget[1] + 2} label={`Budget · ₹${project.budget[0]}–${project.budget[1]} Cr ticket`} />
                <FitRow ok={buy!.configs.length === 0 || project.configs.some((c) => buy!.configs.includes(c))} label={`Configuration · ${project.configs.join(", ")}`} />
                <FitRow ok={buy!.priorities.some((t) => project.tags.includes(t))} label={`Priorities · ${buy!.priorities.length ? buy!.priorities.join(", ") : "none set"}`} />
              </ul>
              <p className="mt-5 text-[0.78rem] font-light leading-[1.6] text-[#1a1a1a]/45">
                Want this scored against your full brief and shortlisted alongside better-fit options? An advisor does that with you.
              </p>
            </div>
          ) : (
            <div>
              <FormBlock label="Your budget">
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <Chip key={b.cr} on={draft.budgetCr === b.cr} onClick={() => setDraft((d) => ({ ...d, budgetCr: b.cr }))}>{b.label}</Chip>
                  ))}
                </div>
              </FormBlock>
              <FormBlock label="Configuration">
                <div className="flex flex-wrap gap-2">
                  {CONFIG_CHIPS.map((c) => (
                    <Chip key={c} on={draft.configs.includes(c)} onClick={() => toggle("configs", c)}>{c}</Chip>
                  ))}
                </div>
              </FormBlock>
              <FormBlock label="What matters most" hint="pick up to 3">
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_CHIPS.map((p) => (
                    <Chip key={p} on={draft.priorities.includes(p)} onClick={() => toggle("priorities", p, 3)}>{p}</Chip>
                  ))}
                </div>
              </FormBlock>
              <button onClick={save} className="mt-5 rounded-sm bg-[#1e6b45] px-6 py-3 text-[0.82rem] font-medium tracking-[0.03em] text-white transition-colors hover:bg-[#238c55]">
                {computed ? "Update my fit" : "See my fit"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FitRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[0.88rem] font-light leading-[1.5] text-[#1a1a1a]/70">
      <span className={`mt-0.5 text-[0.9rem] ${ok ? "text-[#1e6b45]" : "text-[#b0503e]"}`}>{ok ? "✓" : "—"}</span>
      {label}
    </li>
  );
}

function FormBlock({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[0.66rem] font-medium uppercase tracking-[0.14em] text-[#1a1a1a]/40">
        {label}{hint && <span className="ml-2 font-light normal-case tracking-normal text-[#1a1a1a]/30">{hint}</span>}
      </p>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[0.78rem] font-light transition-colors ${on ? "border-[#1e6b45] bg-[#1e6b45]/8 text-[#1e6b45]" : "border-[#1a1a1a]/15 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/35"}`}
    >
      {children}
    </button>
  );
}
