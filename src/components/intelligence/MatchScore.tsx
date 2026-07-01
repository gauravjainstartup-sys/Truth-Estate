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
type Draft = { budgetCr: number; configs: string[]; priorities: string[] };

export default function MatchScore({ project, initialBuy }: { project: ProjectIntel; initialBuy?: BuyData | null }) {
  const [buy, setBuy] = useState<BuyData | null>(initialBuy ?? null);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if (!initialBuy) {
      const saved = loadBuyData();
      if (saved) setBuy(saved);
    }
  }, [initialBuy]);

  const computed = buy && hasPreferences(buy);
  const pct = computed ? matchScoreFor(project, buy!) : null;
  const meta = pct != null ? matchLabel(pct) : null;

  function onSave(next: BuyData) {
    saveBuyData(next);
    setBuy(next);
    setSheet(false);
  }

  const seed: Draft = { budgetCr: buy?.budgetCr ?? 6, configs: buy?.configs ?? [], priorities: buy?.priorities ?? [] };

  return (
    <section id="match" className="mt-6 scroll-mt-24">
      {computed ? (
        /* Computed — the score, kept compact, with the fit read-out */
        <div className="overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60">
          <div className="grid gap-0 md:grid-cols-[minmax(0,260px)_1fr]">
            <div className="flex flex-col justify-center border-b border-[#1a1a1a]/8 bg-white/50 p-7 md:border-b-0 md:border-r">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#c9a96e]">Match Score</p>
              <p className={`mt-3 font-mono text-[3.2rem] font-light leading-none ${toneClass[meta!.tone]}`}>{pct}%</p>
              <p className={`mt-2 text-[0.86rem] font-medium ${toneClass[meta!.tone]}`}>{meta!.label} for you</p>
              <button onClick={() => setSheet(true)} className="mt-4 self-start text-[0.76rem] font-medium text-[#1a1a1a]/50 underline decoration-[#c9a96e]/40 underline-offset-2 hover:text-[#1a1a1a]/80">
                Edit preferences
              </button>
            </div>
            <div className="p-7">
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
          </div>
        </div>
      ) : (
        /* Cold — a mini teaser that opens the input sheet */
        <div className="overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white/60">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center md:gap-7 md:p-7">
            <div className="shrink-0"><Gauge /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#c9a96e]">Match Score</p>
              <p className="mt-2 font-serif text-[1.5rem] leading-[1.15] text-[#1a1a1a] md:text-[1.7rem]">How well does this fit you?</p>
              <p className="mt-2 text-[0.85rem] font-light leading-[1.6] text-[#1a1a1a]/50">
                Tell us what you&apos;re after — in 20 seconds we&apos;ll score this project against <span className="italic">your</span> needs, not the brochure.
              </p>
            </div>
            <button onClick={() => setSheet(true)} className="shrink-0 rounded-sm bg-[#1e6b45] px-6 py-3.5 text-[0.84rem] font-semibold tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]">
              Score my fit →
            </button>
          </div>
        </div>
      )}

      <MatchSheet open={sheet} project={project} seed={seed} computed={!!computed} onClose={() => setSheet(false)} onSave={onSave} existing={buy} />
    </section>
  );
}

/* The input sheet — bottom sheet on mobile, centred dialog on desktop. */
function MatchSheet({ open, project, seed, computed, existing, onClose, onSave }: {
  open: boolean; project: ProjectIntel; seed: Draft; computed: boolean; existing: BuyData | null;
  onClose: () => void; onSave: (b: BuyData) => void;
}) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState<Draft>(seed);

  useEffect(() => {
    if (!open) return;
    setDraft(seed);
    setShow(false);
    const id = requestAnimationFrame(() => setShow(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { cancelAnimationFrame(id); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const toggle = (key: "configs" | "priorities", v: string, max = 99) =>
    setDraft((d) => {
      const has = d[key].includes(v);
      let next = has ? d[key].filter((x) => x !== v) : [...d[key], v];
      if (!has && next.length > max) next = next.slice(next.length - max);
      return { ...d, [key]: next };
    });

  const preview: BuyData = { ...emptyBuyData, ...(existing ?? {}), budgetCr: draft.budgetCr, configs: draft.configs, priorities: draft.priorities };
  const live = hasPreferences(preview) ? matchScoreFor(project, preview) : null;
  const liveMeta = live != null ? matchLabel(live) : null;

  function save() {
    onSave({ ...emptyBuyData, ...(existing ?? {}), budgetCr: draft.budgetCr, configs: draft.configs, priorities: draft.priorities });
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center md:items-center md:p-6">
      <div className={`absolute inset-0 bg-[#1a1206]/45 backdrop-blur-md transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div data-ms-sheet className={`relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[20px] border border-[#ece3d1] bg-white text-[#1a1a1a] shadow-[0_-30px_80px_-26px_rgba(60,42,10,0.30)] transition-all duration-300 md:max-h-[90vh] md:max-w-[480px] md:rounded-[20px] ${show ? "translate-y-0 opacity-100 md:scale-100" : "translate-y-full opacity-0 md:translate-y-0 md:scale-[0.97]"}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(154,122,46,0.55), transparent)" }} />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 px-7 pt-6">
          <div className="min-w-0">
            <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.24em] text-[#9a7a2e]">Match Score</p>
            <h2 className="mt-1.5 font-serif text-[1.5rem] font-medium leading-[1.12] text-[#1a1a1a]">How well does {project.name} fit you?</h2>
          </div>
          {live != null && liveMeta ? (
            <div className="shrink-0 text-right">
              <p className={`font-mono text-[1.7rem] font-light leading-none ${toneClass[liveMeta.tone]}`}>{live}%</p>
              <p className={`mt-0.5 text-[0.62rem] font-medium ${toneClass[liveMeta.tone]}`}>{liveMeta.label}</p>
            </div>
          ) : (
            <button onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/35 transition-colors hover:bg-black/5 hover:text-black/70">✕</button>
          )}
        </div>

        <div className="relative overflow-y-auto px-7 pb-7 pt-5">
          <Block label="Your budget">
            {BUDGETS.map((b) => <Chip key={b.cr} on={draft.budgetCr === b.cr} onClick={() => setDraft((d) => ({ ...d, budgetCr: b.cr }))}>{b.label}</Chip>)}
          </Block>
          <Block label="Configuration">
            {CONFIG_CHIPS.map((c) => <Chip key={c} on={draft.configs.includes(c)} onClick={() => toggle("configs", c)}>{c}</Chip>)}
          </Block>
          <Block label="What matters most" hint="up to 3">
            {PRIORITY_CHIPS.map((p) => <Chip key={p} on={draft.priorities.includes(p)} onClick={() => toggle("priorities", p, 3)}>{p}</Chip>)}
          </Block>
          <button onClick={save} className="mt-6 w-full rounded-md bg-[#1e6b45] px-6 py-3.5 text-[0.88rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]">
            {computed ? "Update my fit" : "See my fit"}
          </button>
          <p className="mt-3 text-center text-[0.68rem] font-light text-black/35">Private to you · scores against your brief, never the brochure.</p>
        </div>
      </div>
    </div>
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

function Block({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="mb-2.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">
        {label}{hint && <span className="ml-2 tracking-normal text-[#1a1a1a]/30">· {hint}</span>}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] font-light transition-all ${on ? "border-[#1e6b45] bg-[#1e6b45]/10 text-[#1e6b45]" : "border-black/[0.14] text-[#1a1a1a]/60 hover:border-black/30 hover:text-[#1a1a1a]/85"}`}
    >
      {children}
    </button>
  );
}

/* A small dial glyph for the cold teaser. */
function Gauge() {
  return (
    <div className="relative grid h-20 w-20 place-items-center rounded-xl border border-[#c9a96e]/30 bg-[#c9a96e]/[0.07]">
      <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden>
        <circle cx="24" cy="24" r="17" stroke="#1a1a1a" strokeOpacity="0.10" strokeWidth="4" />
        <path d="M24 7a17 17 0 0 1 14.7 25.5" stroke="#1e6b45" strokeWidth="4" strokeLinecap="round" />
        <circle cx="24" cy="24" r="3" fill="#9a7a2e" />
        <path d="M24 24l8-5" stroke="#9a7a2e" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
