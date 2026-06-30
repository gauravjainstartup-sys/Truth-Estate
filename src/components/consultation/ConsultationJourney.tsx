"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import {
  CONSULT_DAYPARTS,
  CONSULT_DAYS,
  CONSULT_DURATION,
  CONSULT_HEADLINE,
  CONSULT_FEE,
  CONSULT_FIELDS,
  CONSULT_FORMATS,
  CONSULT_OUTCOMES,
  CONSULT_PILLARS,
  CONSULT_REASONS,
  CONSULT_TIMELINE,
  ConsultBooking,
  ConsultContext,
  ConsultField,
  ConsultFormat,
  ConsultIntent,
  ConsultProfileChip,
  advisorFor,
  consultPrepLine,
  emptyConsultBooking,
  saveConsultation,
} from "@/lib/consultation";

type Step =
  | "intro"
  | "reason"
  | "situation"
  | "prep"
  | "schedule"
  | "account"
  | "confirm"
  | "office";

export default function ConsultationJourney({
  context = {},
  onClose,
}: {
  context?: ConsultContext;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [booking, setBooking] = useState<ConsultBooking>(() => emptyConsultBooking(context));
  const scrollRef = useRef<HTMLDivElement>(null);

  // A "warm" visitor already shared a requirements profile (e.g. their Buyer
  // DNA) — we skip the reason/situation steps and go straight to scheduling.
  const warm = !!context.profile?.length;
  const FLOW: Step[] = warm
    ? ["intro", "schedule", "account"]
    : ["intro", "reason", "situation", "prep", "schedule", "account"];

  // Close on Escape — consistent with the journey modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const prepLine = consultPrepLine(context);

  // If we already know the intent (e.g. from a journey), reason is preset.
  const goTo = (s: Step) => {
    setStep(s);
    scrollRef.current?.scrollTo(0, 0);
  };

  const fi = FLOW.indexOf(step);
  const progress = fi < 0 ? null : (fi + 1) / (FLOW.length + 1); // confirm / office: hidden

  const setField = (name: string, value: string | string[]) =>
    setBooking((b) => ({ ...b, details: { ...b.details, [name]: value } }));

  const reserve = () => {
    const finalised = { ...booking, createdAt: Date.now() };
    setBooking(finalised);
    saveConsultation(finalised);
    goTo("confirm");
  };

  /* ── outer frame ── */
  const frame = (inner: React.ReactNode) => (
    <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-label="Request Independent Advice">
      <div className="absolute inset-0 animate-journey-fade bg-[#0a0a0a]/45 backdrop-blur-xl" />
      <div className="absolute inset-0 animate-journey-in">{inner}</div>
    </div>
  );

  const back: Partial<Record<Step, Step>> = warm
    ? { schedule: "intro", account: "schedule" }
    : {
        reason: "intro",
        situation: "reason",
        prep: "situation",
        schedule: "prep",
        account: "schedule",
      };

  return frame(
    <Shell
      onClose={onClose}
      onBack={back[step] ? () => goTo(back[step]!) : undefined}
      progress={progress}
      eyebrow={step === "office" ? "Private Office" : "Independent Advice"}
      scrollRef={scrollRef}
      bare={step === "office"}
    >
      {step === "intro" && (
        <IntroStep
          prepLine={prepLine}
          warm={warm}
          profile={context.profile}
          onContinue={() => goTo(warm ? "schedule" : booking.reason ? "situation" : "reason")}
        />
      )}
      {step === "reason" && (
        <ReasonStep
          value={booking.reason}
          onPick={(r) => { setBooking((b) => ({ ...b, reason: r, details: {} })); goTo("situation"); }}
        />
      )}
      {step === "situation" && (
        <SituationStep
          intent={booking.reason ?? "advice"}
          details={booking.details}
          setField={setField}
          onContinue={() => goTo("prep")}
        />
      )}
      {step === "prep" && (
        <PrepStep
          value={booking.prep}
          source={context.source}
          onChange={(v) => setBooking((b) => ({ ...b, prep: v }))}
          onContinue={() => goTo("schedule")}
        />
      )}
      {step === "schedule" && (
        <ScheduleStep
          intent={booking.reason}
          day={booking.day}
          time={booking.time}
          format={booking.format}
          onSelect={(patch) => setBooking((b) => ({ ...b, ...patch }))}
          onContinue={() => goTo("account")}
        />
      )}
      {step === "account" && (
        <AccountStep
          booking={booking}
          onChange={(patch) => setBooking((b) => ({ ...b, ...patch }))}
          onReserve={reserve}
        />
      )}
      {step === "confirm" && (
        <ConfirmStep booking={booking} onOpenOffice={() => goTo("office")} />
      )}
      {step === "office" && (
        <PrivateOffice booking={booking} onClose={onClose} />
      )}
    </Shell>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHELL
   ════════════════════════════════════════════════════════════════ */
function Shell({
  onClose,
  onBack,
  progress,
  eyebrow,
  scrollRef,
  bare,
  children,
}: {
  onClose: () => void;
  onBack?: () => void;
  progress?: number | null;
  eyebrow?: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  bare?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-full w-full flex-col bg-[#F5F0E8] text-[#1a1a1a]">
      <div className="h-[2px] w-full bg-[#1a1a1a]/8">
        {progress != null && (
          <div
            className="h-full bg-[#1e6b45] transition-all duration-700 ease-out"
            style={{ width: `${Math.max(5, progress * 100)}%` }}
          />
        )}
      </div>
      {!bare && (
        <div className="flex shrink-0 items-center justify-between px-6 py-4 md:px-10 md:py-5">
          <div className="flex items-center gap-4">
            {onBack ? (
              <button
                onClick={onBack}
                className="text-[12px] font-light tracking-[0.1em] text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]"
              >
                ← Back
              </button>
            ) : (
              <Logo color="#1a1a1a" className="h-7 w-auto opacity-80" />
            )}
            {eyebrow && (
              <span className="hidden text-[9px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/35 sm:inline">
                {eyebrow}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[11px] font-light tracking-[0.15em] text-[#1a1a1a]/35 transition-colors hover:text-[#1a1a1a]/70"
          >
            CLOSE
          </button>
        </div>
      )}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

/* ── shared primitives ── */
function PrimaryButton({ children, onClick, disabled, full }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; full?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-sm bg-[#1e6b45] px-10 py-4 text-[13px] font-medium tracking-[0.08em] text-white shadow-lg shadow-black/10 transition-all duration-500 enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-30 ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

function PillarStrip() {
  return (
    <div className="mt-16 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-[#1a1a1a]/[0.06] pt-7">
      {CONSULT_PILLARS.map((p) => (
        <span key={p} className="flex items-center gap-2 text-[0.7rem] font-light tracking-[0.02em] text-[#1a1a1a]/25">
          <span className="text-[#c9a96e]/55">&#10003;</span>
          {p}
        </span>
      ))}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a96e]">{children}</p>;
}

/* ════════════════════════════════════════════════════════════════
   STEP 1 — INTRO
   ════════════════════════════════════════════════════════════════ */
function IntroStep({
  prepLine,
  warm,
  profile,
  onContinue,
}: {
  prepLine: string | null;
  warm: boolean;
  profile?: ConsultProfileChip[];
  onContinue: () => void;
}) {
  const ctaLabel = warm ? "Book your consultation →" : "Request your consultation →";

  return (
    <div className="animate-fade-up mx-auto max-w-[720px] px-6 py-6 md:px-10 md:py-12">
      <Eyebrow>Request Independent Advice</Eyebrow>
      <h1 className="font-serif text-[1.8rem] font-medium leading-[1.14] text-[#1a1a1a] md:text-[2.5rem]">
        {warm ? (
          <>Your advisor is ready<br className="hidden md:block" /> when you are.</>
        ) : (
          <>Every important property decision<br className="hidden md:block" /> deserves independent thinking.</>
        )}
      </h1>
      <p className="mt-4 max-w-[540px] text-[0.95rem] font-light leading-[1.7] text-[#1a1a1a]/55 md:text-[1.02rem]">
        {warm
          ? "No sales pressure, no developer bias — just one prepared conversation about your decision. Pick a time below."
          : "One recommendation, no agenda. No sales pressure, no developer bias, no broker incentives — just independent advice tailored to your situation."}
      </p>

      {/* Warm: a reminder of what we already hold */}
      {warm && (
        <div className="mt-6 rounded-xl border border-[#c9a96e]/30 bg-[#c9a96e]/[0.07] p-5">
          {prepLine && (
            <div className="flex items-start gap-3">
              <span className="mt-[2px] text-[#c9a96e]">◆</span>
              <p className="font-serif text-[0.96rem] font-light italic leading-relaxed text-[#1a1a1a]/70 md:text-[1.02rem]">
                {prepLine}
              </p>
            </div>
          )}
          {profile && profile.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${prepLine ? "mt-4 border-t border-[#c9a96e]/20 pt-4" : ""}`}>
              {profile.map((c) => (
                <span
                  key={c.label}
                  className="rounded-full border border-[#1a1a1a]/10 bg-white/70 px-3.5 py-1.5 text-[0.78rem] font-light text-[#1a1a1a]/65"
                >
                  <span className="text-[#1a1a1a]/40">{c.label}</span> {c.value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* The offer + primary CTA — deliberately kept within the first view */}
      <div className="mt-6 rounded-xl border border-[#1a1a1a]/[0.08] bg-white p-6 shadow-sm shadow-black/[0.02] md:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-[1.4rem] font-medium text-[#1a1a1a] md:text-[1.65rem]">{CONSULT_HEADLINE}</h2>
          {CONSULT_FEE != null && (
            <span className="rounded-full border border-[#1e6b45]/30 px-4 py-1.5 text-[0.72rem] font-light tracking-[0.04em] text-[#1e6b45]">
              ₹{CONSULT_FEE.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[0.82rem] font-light text-[#1a1a1a]/55">
          {["45 Minutes", "Video or Phone", "Prepared before the call", "100% Confidential"].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <span className="text-[#c9a96e]">&#10003;</span>
              {t}
            </span>
          ))}
        </div>
        <div className="mt-6">
          <PrimaryButton onClick={onContinue} full>{ctaLabel}</PrimaryButton>
        </div>
        <p className="mt-4 text-center text-[0.78rem] font-light text-[#1a1a1a]/45">
          {warm
            ? "Takes about a minute — your details are already in."
            : "Completely complimentary. We'll understand your situation before discussing whether we should work together."}
        </p>
      </div>

      {/* ── Supporting detail, below the fold ── */}
      <div className="mt-14">
        <p className="mb-6 text-[10px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/30">
          What happens during this consultation?
        </p>
        <ol className="relative ml-1">
          {CONSULT_TIMELINE.map((t, i) => (
            <li key={t} className="relative flex gap-5 pb-6 last:pb-0">
              {i < CONSULT_TIMELINE.length - 1 && (
                <span className="absolute left-[7px] top-5 h-full w-px bg-[#1a1a1a]/12" />
              )}
              <span className="relative z-10 mt-1 h-[15px] w-[15px] shrink-0 rounded-full border border-[#1e6b45] bg-[#F5F0E8]">
                <span className="absolute inset-[3px] rounded-full bg-[#1e6b45]" />
              </span>
              <span className="font-serif text-[1.05rem] font-light text-[#1a1a1a]/75 md:text-[1.2rem]">{t}</span>
            </li>
          ))}
        </ol>
        <p className="mt-7 max-w-[560px] text-[0.82rem] font-light leading-relaxed text-[#1a1a1a]/45">
          We won&apos;t always tell you to buy. Depending on the evidence, the right
          recommendation may be to{" "}
          {CONSULT_OUTCOMES.map((o, i) => (
            <span key={o}>
              <span className="text-[#1a1a1a]/70">{o}</span>
              {i < CONSULT_OUTCOMES.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </div>

      <div className="mt-10">
        <PrimaryButton onClick={onContinue}>{ctaLabel}</PrimaryButton>
      </div>

      <PillarStrip />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 2 — REASON
   ════════════════════════════════════════════════════════════════ */
function ReasonStep({ value, onPick }: { value: ConsultIntent | null; onPick: (r: ConsultIntent) => void }) {
  return (
    <div className="animate-fade-up mx-auto max-w-[760px] px-6 py-12 md:px-10 md:py-16">
      <Eyebrow>A little context</Eyebrow>
      <h1 className="font-serif text-[2rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[2.7rem]">
        What brings you here today?
      </h1>

      <div className="mt-10 grid gap-3.5 sm:grid-cols-2">
        {CONSULT_REASONS.map((r) => (
          <button
            key={r.key}
            onClick={() => onPick(r.key)}
            className={`group rounded-xl border p-6 text-left transition-all duration-300 ${
              value === r.key
                ? "border-[#1e6b45]/50 bg-[#1e6b45]/[0.05]"
                : "border-[#1a1a1a]/[0.08] bg-white hover:border-[#1a1a1a]/15 hover:shadow-lg hover:shadow-black/[0.03]"
            }`}
          >
            <h3 className="font-serif text-[1.3rem] font-medium text-[#1a1a1a] transition-colors group-hover:text-[#1e6b45]">{r.title}</h3>
            <p className="mt-1.5 text-[0.85rem] font-light leading-relaxed text-[#1a1a1a]/50">{r.line}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 3 — SITUATION (dynamic fields)
   ════════════════════════════════════════════════════════════════ */
function SituationStep({
  intent,
  details,
  setField,
  onContinue,
}: {
  intent: ConsultIntent;
  details: Record<string, string | string[]>;
  setField: (name: string, value: string | string[]) => void;
  onContinue: () => void;
}) {
  const fields = CONSULT_FIELDS[intent];
  return (
    <div className="animate-fade-up mx-auto max-w-[680px] px-6 py-12 md:px-10 md:py-16">
      <Eyebrow>Your situation</Eyebrow>
      <h1 className="font-serif text-[2rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[2.7rem]">
        Tell us a little about
        <br className="hidden md:block" /> your situation.
      </h1>
      <p className="mt-4 max-w-[460px] text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/45">
        Only what helps us prepare. Everything here stays confidential — and you can
        say more on the next step.
      </p>

      <div className="mt-10 flex flex-col gap-9">
        {fields.map((f) => (
          <FieldControl key={f.name} field={f} value={details[f.name]} onChange={(v) => setField(f.name, v)} />
        ))}
      </div>

      <div className="mt-12">
        <PrimaryButton onClick={onContinue}>Continue →</PrimaryButton>
      </div>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: ConsultField;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  if (field.type === "text") {
    return (
      <div>
        <label className="mb-3 block text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">{field.label}</label>
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full border-b border-[#1a1a1a]/15 bg-transparent py-3 font-serif text-[1.15rem] font-light text-[#1a1a1a] outline-none transition-colors duration-300 placeholder:text-[#1a1a1a]/25 focus:border-[#1e6b45]/50 md:text-[1.3rem]"
        />
      </div>
    );
  }

  const selected: string[] = Array.isArray(value) ? value : value ? [value as string] : [];
  const multi = field.type === "chips-multi";
  const toggle = (opt: string) => {
    if (multi) {
      onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
    } else {
      onChange(opt);
    }
  };

  return (
    <div>
      <label className="mb-3 block text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">{field.label}</label>
      <div className="flex flex-wrap gap-2.5">
        {field.options!.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`rounded-full border px-5 py-2.5 text-[0.84rem] font-light transition-all duration-300 ${
                on
                  ? "border-[#1e6b45] bg-[#1e6b45] text-white shadow-md shadow-black/10"
                  : "border-[#1a1a1a]/15 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 4 — PREP
   ════════════════════════════════════════════════════════════════ */
function PrepStep({
  value,
  source,
  onChange,
  onContinue,
}: {
  value: string;
  source?: string;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  const examples = source
    ? [`Compare ${source} with Puri The Aravallis`, "Help me shortlist projects", "Review construction quality", "Evaluate legal risks", "Should I wait six months?", "Explain Truth Score"]
    : ["Compare DLF Arbour with Puri The Aravallis", "Help me shortlist projects", "Review construction quality", "Evaluate legal risks", "Should I wait six months?", "Explain Truth Score"];

  return (
    <div className="animate-fade-up mx-auto max-w-[680px] px-6 py-12 md:px-10 md:py-16">
      <Eyebrow>Prepared advice</Eyebrow>
      <h1 className="font-serif text-[2rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[2.7rem]">
        Anything you&apos;d like us to
        <br className="hidden md:block" /> prepare before the call?
      </h1>
      <p className="mt-4 max-w-[460px] text-[0.9rem] font-light leading-relaxed text-[#1a1a1a]/45">
        The more specific, the more prepared we&apos;ll arrive. You won&apos;t have to
        repeat yourself.
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Tell us what's on your mind…"
        className="mt-9 w-full resize-none rounded-xl border border-[#1a1a1a]/12 bg-white p-5 font-serif text-[1.1rem] font-light leading-relaxed text-[#1a1a1a] outline-none transition-colors duration-300 placeholder:text-[#1a1a1a]/25 focus:border-[#c9a96e]/40 md:text-[1.2rem]"
      />

      <div className="mt-5">
        <p className="mb-3 text-[9px] font-light uppercase tracking-[0.25em] text-[#1a1a1a]/30">For example</p>
        <div className="flex flex-wrap gap-2.5">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => onChange(value ? `${value}\n${ex}` : ex)}
              className="rounded-full border border-[#1a1a1a]/[0.08] px-4 py-2 text-[0.8rem] font-light italic text-[#1a1a1a]/45 transition-all duration-300 hover:border-[#1a1a1a]/20 hover:text-[#1a1a1a]/70"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <PrimaryButton onClick={onContinue}>Continue →</PrimaryButton>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 5 — SCHEDULE
   ════════════════════════════════════════════════════════════════ */
function ScheduleStep({
  intent,
  day,
  time,
  format,
  onSelect,
  onContinue,
}: {
  intent: ConsultIntent | null;
  day: string | null;
  time: string | null;
  format: ConsultFormat | null;
  onSelect: (patch: Partial<ConsultBooking>) => void;
  onContinue: () => void;
}) {
  const advisor = advisorFor(intent);
  const ready = day && time && format;

  return (
    <div className="animate-fade-up mx-auto max-w-[760px] px-6 py-12 md:px-10 md:py-16">
      <Eyebrow>Scheduling</Eyebrow>
      <h1 className="font-serif text-[2rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[2.7rem]">
        Choose a convenient time.
      </h1>

      {/* Advisor */}
      <div className="mt-9 flex items-center gap-4 rounded-xl border border-[#1a1a1a]/[0.08] bg-white p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e6b45]/10 font-serif text-[1rem] font-medium text-[#1e6b45]">
          {advisor.initials}
        </div>
        <div className="flex-1">
          <p className="text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/35">Your advisor</p>
          <p className="font-serif text-[1.2rem] font-medium text-[#1a1a1a]">{advisor.name}</p>
          <p className="text-[0.8rem] font-light text-[#1a1a1a]/50">{advisor.focus}</p>
        </div>
      </div>

      {/* Day */}
      <div className="mt-10">
        <p className="mb-3 text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">Day</p>
        <div className="flex flex-wrap gap-2.5">
          {CONSULT_DAYS.map((d) => (
            <button
              key={d}
              onClick={() => onSelect({ day: d })}
              className={`rounded-full border px-5 py-2.5 text-[0.84rem] font-light transition-all duration-300 ${
                day === d ? "border-[#1e6b45] bg-[#1e6b45] text-white" : "border-[#1a1a1a]/15 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/35"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Dayparts */}
      <div className="mt-10 flex flex-col gap-7">
        {CONSULT_DAYPARTS.map((dp) => (
          <div key={dp.part}>
            <div className="mb-3 flex items-baseline gap-3">
              <p className="text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">{dp.part}</p>
              <p className="text-[0.74rem] font-light text-[#1a1a1a]/30">{dp.window}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {dp.slots.map((s) => (
                <button
                  key={s}
                  onClick={() => onSelect({ time: s })}
                  className={`rounded-full border px-5 py-2.5 text-[0.84rem] font-light transition-all duration-300 ${
                    time === s ? "border-[#1e6b45] bg-[#1e6b45] text-white shadow-md shadow-black/10" : "border-[#1e6b45]/30 text-[#1e6b45] hover:bg-[#1e6b45]/[0.06]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Format */}
      <div className="mt-10">
        <p className="mb-3 text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">Format</p>
        <div className="flex gap-2.5">
          {CONSULT_FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => onSelect({ format: f })}
              className={`rounded-full border px-6 py-2.5 text-[0.84rem] font-light transition-all duration-300 ${
                format === f ? "border-[#1e6b45] bg-[#1e6b45] text-white" : "border-[#1a1a1a]/15 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/35"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <PrimaryButton onClick={onContinue} disabled={!ready}>Continue →</PrimaryButton>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 6 — ACCOUNT (passwordless)
   ════════════════════════════════════════════════════════════════ */
function AccountStep({
  booking,
  onChange,
  onReserve,
}: {
  booking: ConsultBooking;
  onChange: (patch: Partial<ConsultBooking>) => void;
  onReserve: () => void;
}) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const mobileValid = booking.mobile.replace(/\D/g, "").length >= 10;
  const otpComplete = otp.every((d) => d !== "");
  const canReserve = booking.name.trim() && mobileValid && otpSent && otpComplete;

  const setOtpDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setOtp((o) => { const n = [...o]; n[i] = digit; return n; });
    if (digit && i < 3) otpRefs.current[i + 1]?.focus();
  };

  const perks = ["Continue conversations", "Review recommendations", "Upload documents", "Track shortlisted properties", "Collaborate with your advisor"];

  return (
    <div className="animate-fade-up mx-auto max-w-[640px] px-6 py-12 md:px-10 md:py-16">
      <Eyebrow>Almost done</Eyebrow>
      <h1 className="font-serif text-[2rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[2.7rem]">
        Reserve your consultation.
      </h1>
      <p className="mt-4 max-w-[480px] text-[0.92rem] font-light leading-relaxed text-[#1a1a1a]/50">
        Your account creates your secure Private Office — where every conversation,
        recommendation and document related to your decision will live.
      </p>

      <ul className="mt-7 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {perks.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-[0.86rem] font-light text-[#1a1a1a]/60">
            <span className="text-[#1e6b45]">&#10003;</span>{p}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col gap-7">
        <Field label="Name">
          <input
            type="text"
            value={booking.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Your full name"
            className="w-full border-b border-[#1a1a1a]/15 bg-transparent py-3 font-serif text-[1.2rem] font-light text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/25 focus:border-[#1e6b45]/50"
          />
        </Field>

        <Field label="Mobile">
          <div className="flex items-center gap-3">
            <input
              type="tel"
              value={booking.mobile}
              onChange={(e) => onChange({ mobile: e.target.value })}
              placeholder="+91 98xxx xxxxx"
              className="flex-1 border-b border-[#1a1a1a]/15 bg-transparent py-3 font-serif text-[1.2rem] font-light text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/25 focus:border-[#1e6b45]/50"
            />
            {!otpSent && (
              <button
                onClick={() => mobileValid && setOtpSent(true)}
                disabled={!mobileValid}
                className="shrink-0 rounded-full border border-[#1e6b45]/40 px-5 py-2 text-[0.8rem] font-light text-[#1e6b45] transition-all hover:bg-[#1e6b45] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Send code
              </button>
            )}
          </div>
        </Field>

        {otpSent && (
          <div className="animate-fade-up">
            <label className="mb-3 block text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">
              Enter the code we sent
            </label>
            <div className="flex gap-3">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  value={d}
                  onChange={(e) => setOtpDigit(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
                  inputMode="numeric"
                  maxLength={1}
                  className="h-14 w-12 rounded-lg border border-[#1a1a1a]/15 bg-white text-center font-serif text-[1.5rem] font-light text-[#1a1a1a] outline-none transition-colors focus:border-[#1e6b45]/50"
                />
              ))}
            </div>
            <p className="mt-3 text-[0.76rem] font-light italic text-[#1a1a1a]/35">
              Passwordless — no password to remember. Enter any code to continue this preview.
            </p>
          </div>
        )}

        <Field label="Email (optional)">
          <input
            type="email"
            value={booking.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="you@email.com"
            className="w-full border-b border-[#1a1a1a]/15 bg-transparent py-3 font-serif text-[1.2rem] font-light text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/25 focus:border-[#1e6b45]/50"
          />
        </Field>
      </div>

      <div className="mt-12">
        <PrimaryButton onClick={onReserve} disabled={!canReserve} full>
          Reserve Consultation
        </PrimaryButton>
      </div>
      <p className="mt-5 text-center text-[0.76rem] font-light italic text-[#1a1a1a]/35">
        Nothing shared. Your Private Office stays private to you.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">{label}</label>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 7 — CONFIRMATION
   ════════════════════════════════════════════════════════════════ */
function ConfirmStep({ booking, onOpenOffice }: { booking: ConsultBooking; onOpenOffice: () => void }) {
  const advisor = advisorFor(booking.reason);
  const rows: { l: string; v: string }[] = [
    { l: "Meeting Date", v: booking.day ?? "—" },
    { l: "Meeting Time", v: booking.time ?? "—" },
    { l: "Advisor Assigned", v: advisor.name },
    { l: "Meeting Format", v: booking.format ?? "—" },
  ];

  return (
    <div className="animate-fade-up mx-auto max-w-[640px] px-6 py-16 text-center md:px-10 md:py-24">
      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#1e6b45]/30 bg-[#1e6b45]/[0.06]">
        <span className="font-serif text-[1.8rem] text-[#1e6b45]">&#10003;</span>
      </div>
      <Eyebrow>Confirmed</Eyebrow>
      <h1 className="font-serif text-[2.3rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[3.2rem]">
        You&apos;re all set.
      </h1>
      <p className="mx-auto mt-6 max-w-[440px] text-[0.95rem] font-light leading-[1.85] text-[#1a1a1a]/55">
        Thank you. We&apos;ll review everything you&apos;ve shared before the
        consultation. You won&apos;t have to repeat yourself — your advisor will
        arrive fully prepared.
      </p>

      <div className="mt-10 overflow-hidden rounded-xl border border-[#1a1a1a]/[0.08] text-left">
        {rows.map((r, i) => (
          <div key={r.l} className={`flex items-center justify-between px-6 py-4 ${i % 2 === 0 ? "bg-white" : "bg-[#F5F0E8]"}`}>
            <span className="text-[10px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/40">{r.l}</span>
            <span className="font-serif text-[1.05rem] font-medium text-[#1a1a1a]">{r.v}</span>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-[420px] text-[0.82rem] font-light italic leading-relaxed text-[#1a1a1a]/40">
        This isn&apos;t a sales call. It&apos;s an independent advisory conversation
        focused entirely on your situation.
      </p>

      <div className="mt-10">
        <PrimaryButton onClick={onOpenOffice}>Enter Your Private Office →</PrimaryButton>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STEP 8 — PRIVATE OFFICE
   ════════════════════════════════════════════════════════════════ */
function PrivateOffice({ booking, onClose }: { booking: ConsultBooking; onClose: () => void }) {
  const advisor = advisorFor(booking.reason);
  const NAV = ["Home", "Consultation", "Questions", "Documents", "Shortlist", "TruthGuide", "Intelligence", "Recommendations", "Advisor Notes"];
  const [active, setActive] = useState("Home");

  return (
    <div className="flex h-full w-full flex-col bg-[#F5F0E8] text-[#1a1a1a] md:flex-row">
      {/* Sidebar */}
      <aside className="flex shrink-0 flex-col border-b border-[#1a1a1a]/8 bg-[#F5F0E8] px-5 py-5 md:w-60 md:border-b-0 md:border-r md:px-6 md:py-7">
        <div className="flex items-center justify-between md:block">
          <Logo color="#1a1a1a" className="h-7 w-auto opacity-80" />
          <button onClick={onClose} aria-label="Close" className="text-[11px] font-light tracking-[0.18em] text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a] md:hidden">
            CLOSE
          </button>
        </div>
        <nav className="mt-6 flex gap-1 overflow-x-auto md:mt-10 md:flex-col md:gap-0.5 md:overflow-visible">
          {NAV.map((item) => (
            <button
              key={item}
              onClick={() => setActive(item)}
              className={`whitespace-nowrap rounded-md px-3.5 py-2.5 text-left text-[0.86rem] font-light tracking-[0.01em] transition-colors duration-200 ${
                active === item ? "bg-[#1a1a1a]/[0.06] font-normal text-[#1a1a1a]" : "text-[#1a1a1a]/55 hover:bg-[#1a1a1a]/[0.04] hover:text-[#1a1a1a]/85"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden pt-8 md:block">
          <button onClick={onClose} className="text-[11px] font-light tracking-[0.16em] text-[#1a1a1a]/40 transition-colors hover:text-[#1a1a1a]">
            ← Back to site
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10 md:px-12 md:py-14">
          <p className="text-[10px] font-light uppercase tracking-[0.4em] text-[#c9a96e]">Welcome{booking.name ? `, ${booking.name.split(" ")[0]}` : ""}</p>
          <h1 className="mt-4 font-serif text-[2.1rem] font-medium leading-[1.1] text-[#1a1a1a] md:text-[3rem]">
            Welcome to Your Private Office.
          </h1>
          <p className="mt-5 max-w-[560px] text-[0.95rem] font-light leading-[1.8] text-[#1a1a1a]/55">
            This is where every conversation, recommendation and document related to
            your property journey will live.
          </p>

          {/* Upcoming consultation — the one real thing */}
          <section className="mt-12 border-t border-[#1a1a1a]/10 pt-8">
            <PanelTitle>Consultation · Upcoming</PanelTitle>
            <div className="flex flex-col gap-4 rounded-lg border border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1e6b45]/10 font-serif text-[0.95rem] font-medium text-[#1e6b45]">
                  {advisor.initials}
                </div>
                <div>
                  <p className="font-serif text-[1.2rem] font-medium text-[#1a1a1a]">{advisor.name}</p>
                  <p className="text-[0.8rem] font-light text-[#1a1a1a]/55">{advisor.focus}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-serif text-[1.05rem] font-medium text-[#1e6b45]">{booking.day} · {booking.time}</p>
                <p className="text-[0.78rem] font-light text-[#1a1a1a]/45">{booking.format} · {CONSULT_DURATION}</p>
              </div>
            </div>
          </section>

          {/* Placeholder sections */}
          <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
            <OfficeCard title="Questions for Advisor" body="The questions you asked us to prepare will appear here, with our answers after the consultation." note={booking.prep ? "1 prepared" : "Awaiting consultation"} />
            <OfficeCard title="Documents" body="Brochures, agreements and due-diligence you upload — reviewed and annotated by your advisor." note="Upload unlocks after your call" />
            <OfficeCard title="Shortlisted Projects" body="Properties you're weighing, tracked side by side with Truth Scores and our independent view." note="Nothing shortlisted yet" />
            <OfficeCard title="TruthGuide Conversations" body="Your full conversation history with TruthGuide, always in context of your situation." note="Continue any time" />
            <OfficeCard title="Truth Intelligence" body="The project, developer and market intelligence relevant to your decision, curated for you." note="Curated before your call" />
            <OfficeCard title="Recommendations" body="Your advisor's written recommendation — Proceed, Wait, Continue Research, Compare More, or Walk Away — lands here." note="Arrives after consultation" />
            <OfficeCard title="Advisor Notes" body="Notes your advisor shares before and after the call, so nothing gets lost between conversations." note="Your advisor will post here" />
          </div>

          <p className="mt-16 text-[0.75rem] font-light italic text-[#1a1a1a]/35">
            A live preview of your Private Office. Each section fills in as your journey continues — you&apos;ll never start from scratch again.
          </p>
        </div>
      </main>
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 text-[10px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/40">{children}</h2>;
}

function OfficeCard({ title, body, note }: { title: string; body: string; note: string }) {
  return (
    <div>
      <PanelTitle>{title}</PanelTitle>
      <div className="rounded-lg border border-[#1a1a1a]/12 bg-white p-5">
        <p className="text-[0.88rem] font-light leading-relaxed text-[#1a1a1a]/60">{body}</p>
        <div className="mt-4 flex items-center gap-2 border-t border-[#1a1a1a]/10 pt-4">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a96e]" />
          <span className="text-[0.78rem] font-light italic text-[#1a1a1a]/40">{note}</span>
        </div>
      </div>
    </div>
  );
}
