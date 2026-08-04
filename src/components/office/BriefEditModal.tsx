"use client";

/* ════════════════════════════════════════════════════════════════
   EDIT YOUR BRIEF — an in-place modal, not the onboarding journey.

   "Edit requirements" used to throw the buyer back into the full "start
   your journey" flow, which is disorienting once you already have a brief.
   This edits the SAME BuyData in place — purchase type, budget, markets,
   configuration, timeline, priorities — and hands the result back to the
   office's single writer (saveBrief), so every surface updates at once.
   ════════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  PURCHASE_TYPES,
  LOCATIONS,
  CONFIGS,
  TIMELINES,
  prioritiesFor,
  MAX_PRIORITIES,
  budgetLabel,
  emptyBuyData,
  type BuyData,
} from "@/lib/journey";

function Pill({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] font-light transition-colors ${
        on
          ? "border-[#1e6b45]/40 bg-[#1e6b45]/[0.08] font-medium text-[#1e6b45]"
          : disabled
            ? "cursor-not-allowed border-[#1a1a1a]/8 text-[#1a1a1a]/25"
            : "border-[#1a1a1a]/12 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#1a1a1a]/[0.06] py-5 first:border-t-0 first:pt-0">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#1a1a1a]/45">{label}</p>
      {children}
    </div>
  );
}

export default function BriefEditModal({
  initial,
  onClose,
  onSave,
}: {
  initial: BuyData;
  onClose: () => void;
  onSave: (buy: BuyData) => void;
}) {
  const [d, setD] = useState<BuyData>({ ...emptyBuyData, ...initial });

  const toggle = (key: "locations" | "configs", value: string) =>
    setD((s) => {
      const has = s[key].includes(value);
      return { ...s, [key]: has ? s[key].filter((x) => x !== value) : [...s[key], value] };
    });
  const togglePriority = (value: string) =>
    setD((s) => {
      const has = s.priorities.includes(value);
      if (has) return { ...s, priorities: s.priorities.filter((x) => x !== value) };
      if (s.priorities.length >= MAX_PRIORITIES) return s; // cap at 3
      return { ...s, priorities: [...s.priorities, value] };
    });

  const priorityPool = prioritiesFor(d.purchaseType);

  const body = (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#1a1a1a]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="my-8 w-full max-w-[560px] overflow-hidden rounded-2xl bg-[#F5F0E8] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#1a1a1a]/[0.08] bg-white px-6 py-5 md:px-8">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#c9a96e]">Your brief</p>
            <h2 className="mt-1.5 font-serif text-[1.5rem] font-medium leading-tight text-[#1a1a1a]">Edit your requirements</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-full p-1 text-[1.3rem] leading-none text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]">×</button>
        </div>

        {/* fields */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 md:px-8">
          <Field label="Buying as">
            <div className="flex flex-wrap gap-2">
              {PURCHASE_TYPES.map((t) => (
                <Pill key={t} on={d.purchaseType === t} onClick={() => setD((s) => ({ ...s, purchaseType: s.purchaseType === t ? null : t }))}>
                  {t}
                </Pill>
              ))}
            </div>
          </Field>

          <Field label="Budget">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={21}
                value={d.budgetCr}
                onChange={(e) => setD((s) => ({ ...s, budgetCr: Number(e.target.value) }))}
                className="h-1 flex-1 cursor-pointer accent-[#1e6b45]"
              />
              <span className="w-[5.5rem] shrink-0 text-right font-serif text-[1.15rem] font-medium text-[#1a1a1a]">{budgetLabel(d.budgetCr)}</span>
            </div>
          </Field>

          <Field label="Markets">
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((m) => (
                <Pill key={m} on={d.locations.includes(m)} onClick={() => toggle("locations", m)}>{m}</Pill>
              ))}
            </div>
          </Field>

          <Field label="Configuration">
            <div className="flex flex-wrap gap-2">
              {CONFIGS.map((c) => (
                <Pill key={c} on={d.configs.includes(c)} onClick={() => toggle("configs", c)}>{c}</Pill>
              ))}
            </div>
          </Field>

          <Field label="Timeline">
            <div className="flex flex-wrap gap-2">
              {TIMELINES.map((t) => (
                <Pill key={t} on={d.timeline === t} onClick={() => setD((s) => ({ ...s, timeline: s.timeline === t ? null : t }))}>{t}</Pill>
              ))}
            </div>
          </Field>

          <Field label={`Priorities · pick up to ${MAX_PRIORITIES}`}>
            <div className="flex flex-wrap gap-2">
              {priorityPool.map((p) => {
                const on = d.priorities.includes(p);
                return (
                  <Pill key={p} on={on} disabled={!on && d.priorities.length >= MAX_PRIORITIES} onClick={() => togglePriority(p)}>{p}</Pill>
                );
              })}
            </div>
          </Field>
        </div>

        {/* footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-[#1a1a1a]/[0.08] bg-white px-6 py-4 sm:flex-row sm:justify-end md:px-8">
          <button onClick={onClose} className="rounded-sm border border-[#1a1a1a]/15 px-6 py-3 text-[0.82rem] font-light text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]">
            Cancel
          </button>
          <button
            onClick={() => onSave(d)}
            className="rounded-sm bg-[#1e6b45] px-7 py-3 text-[0.82rem] font-medium tracking-[0.03em] text-white transition-colors hover:bg-[#238c55]"
          >
            Save requirements
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(body, document.body);
}
