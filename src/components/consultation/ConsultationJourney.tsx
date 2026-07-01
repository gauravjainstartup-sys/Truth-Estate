"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../Logo";
import FocusOffRamp from "../FocusOffRamp";
import { POSSESSION_OPTIONS, type InterestKind } from "@/lib/journey";
import {
  CONSULT_DAYPARTS,
  CONSULT_DAYS,
  CONSULT_DURATION,
  CONSULT_HEADLINE,
  CONSULT_FEE,
  CONSULT_FEE_ORIGINAL,
  CONSULT_FEE_DISCOUNT_LABEL,
  CONSULT_FEE_REFUND_NOTE,
  inr,
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
  | "payment"
  | "confirm"
  | "office"
  | "offramp-rtm"
  | "offramp-commercial";

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
  const router = useRouter();

  // A "warm" visitor already shared a requirements profile (e.g. their Buyer
  // DNA) — we skip the reason/situation steps and go straight to scheduling.
  const warm = !!context.profile?.length;
  const paid = CONSULT_FEE != null;
  const FLOW: Step[] = [
    ...(warm
      ? (["intro", "schedule", "account"] as Step[])
      : (["intro", "reason", "situation", "prep", "schedule", "account"] as Step[])),
    ...(paid ? (["payment"] as Step[]) : []),
  ];

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

  const back: Partial<Record<Step, Step>> = {
    ...(warm
      ? { schedule: "intro", account: "schedule" }
      : {
          reason: "intro",
          situation: "reason",
          prep: "situation",
          schedule: "prep",
          account: "schedule",
        }),
    ...(paid ? { payment: "account" as Step } : {}),
    "offramp-rtm": "situation",
    "offramp-commercial": "situation",
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
          onOfframp={(kind) => goTo(kind === "commercial" ? "offramp-commercial" : "offramp-rtm")}
        />
      )}
      {step === "offramp-rtm" && (
        <div className="animate-fade-up mx-auto max-w-[680px] px-6 py-14 md:px-10 md:py-20">
          <FocusOffRamp kind="ready-to-move" onExplore={() => { onClose(); router.push("/methodology"); }} />
        </div>
      )}
      {step === "offramp-commercial" && (
        <div className="animate-fade-up mx-auto max-w-[680px] px-6 py-14 md:px-10 md:py-20">
          <FocusOffRamp kind="commercial" />
        </div>
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
          onReserve={() => (paid ? goTo("payment") : reserve())}
          ctaLabel={paid ? "Continue to Payment" : "Reserve Consultation"}
        />
      )}
      {step === "payment" && (
        <PaymentStep booking={booking} onPaid={reserve} />
      )}
      {step === "confirm" && (
        <ConfirmStep booking={booking} onOpenOffice={() => { onClose(); router.push("/office"); }} />
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
          ? "No sales pressure and no agenda — just one prepared, independent conversation about your decision. Pick a time below."
          : "One clear recommendation, no agenda — independent advice tailored to your situation, and we'll tell you to walk away if that's the honest call."}
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
            <div className="flex items-center gap-2.5">
              {CONSULT_FEE_ORIGINAL != null && CONSULT_FEE_ORIGINAL > CONSULT_FEE && (
                <span className="text-[0.82rem] font-light text-[#1a1a1a]/35 line-through">{inr(CONSULT_FEE_ORIGINAL)}</span>
              )}
              <span className="font-serif text-[1.25rem] font-medium text-[#1a1a1a]">{inr(CONSULT_FEE)}</span>
              {CONSULT_FEE_ORIGINAL != null && CONSULT_FEE_ORIGINAL > CONSULT_FEE && (
                <span className="rounded-full bg-[#1e6b45]/[0.08] px-2.5 py-1 text-[0.66rem] font-medium tracking-[0.02em] text-[#1e6b45]">
                  {CONSULT_FEE_DISCOUNT_LABEL}
                </span>
              )}
            </div>
          )}
        </div>
        {CONSULT_FEE != null && (
          <p className="mt-2 flex items-center gap-1.5 text-[0.78rem] font-light text-[#1a1a1a]/45">
            <span className="text-[#1e6b45]">&#10003;</span> {CONSULT_FEE_REFUND_NOTE}
          </p>
        )}
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
            : "We'll understand your situation and give you our honest read before we ever discuss working together."}
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
  onOfframp,
}: {
  intent: ConsultIntent;
  details: Record<string, string | string[]>;
  setField: (name: string, value: string | string[]) => void;
  onContinue: () => void;
  onOfframp: (kind: InterestKind) => void;
}) {
  const fields = CONSULT_FIELDS[intent];
  const isBuy = intent === "buy";
  const possession = details["possession"] as string | undefined;
  const canContinue = !isBuy || !!possession;

  const proceed = () => {
    if (possession === "ready-to-move") onOfframp("ready-to-move");
    else onContinue();
  };

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
        {isBuy && (
          <div>
            <label className="mb-3 block text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">
              Under construction or ready to move?
            </label>
            <div className="flex flex-wrap gap-2.5">
              {POSSESSION_OPTIONS.map((o) => {
                const on = possession === o.key;
                return (
                  <button
                    key={o.key}
                    onClick={() => setField("possession", o.key)}
                    className={`rounded-full border px-5 py-2.5 text-[0.84rem] font-light transition-all duration-300 ${
                      on
                        ? "border-[#1e6b45] bg-[#1e6b45] text-white shadow-md shadow-black/10"
                        : "border-[#1a1a1a]/15 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/35 hover:text-[#1a1a1a]"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onOfframp("commercial")}
              className="mt-3.5 text-[0.78rem] font-light text-[#1a1a1a]/45 underline decoration-[#1a1a1a]/15 underline-offset-4 transition-colors hover:text-[#1a1a1a]/80"
            >
              Looking for commercial space instead?
            </button>
          </div>
        )}

        {fields.map((f) => (
          <FieldControl key={f.name} field={f} value={details[f.name]} onChange={(v) => setField(f.name, v)} />
        ))}
      </div>

      <div className="mt-12">
        <PrimaryButton onClick={proceed} disabled={!canContinue}>Continue →</PrimaryButton>
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
/* Dial codes for the audience — India first, then the main NRI hubs. */
const DIAL_CODES: { iso: string; flag: string; code: string; name: string }[] = [
  { iso: "IN", flag: "🇮🇳", code: "+91", name: "India" },
  { iso: "GB", flag: "🇬🇧", code: "+44", name: "United Kingdom" },
  { iso: "US", flag: "🇺🇸", code: "+1", name: "USA / Canada" },
  { iso: "AE", flag: "🇦🇪", code: "+971", name: "United Arab Emirates" },
  { iso: "SG", flag: "🇸🇬", code: "+65", name: "Singapore" },
  { iso: "AU", flag: "🇦🇺", code: "+61", name: "Australia" },
  { iso: "SA", flag: "🇸🇦", code: "+966", name: "Saudi Arabia" },
  { iso: "QA", flag: "🇶🇦", code: "+974", name: "Qatar" },
  { iso: "OM", flag: "🇴🇲", code: "+968", name: "Oman" },
  { iso: "DE", flag: "🇩🇪", code: "+49", name: "Germany" },
  { iso: "HK", flag: "🇭🇰", code: "+852", name: "Hong Kong" },
  { iso: "NZ", flag: "🇳🇿", code: "+64", name: "New Zealand" },
];

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2m0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.23 8.23m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function ChannelPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.78rem] font-light transition-all ${
        active ? "border-[#1e6b45] bg-[#1e6b45]/[0.08] text-[#1e6b45]" : "border-[#1a1a1a]/15 text-[#1a1a1a]/55 hover:border-[#1a1a1a]/35"
      }`}
    >
      {children}
    </button>
  );
}

function AccountStep({
  booking,
  onChange,
  onReserve,
  ctaLabel = "Reserve Consultation",
}: {
  booking: ConsultBooking;
  onChange: (patch: Partial<ConsultBooking>) => void;
  onReserve: () => void;
  ctaLabel?: string;
}) {
  const [dialCode, setDialCode] = useState("+91");
  const [num, setNum] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [emailMode, setEmailMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [googleDone, setGoogleDone] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isIndia = dialCode === "+91";
  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const emailValid = /\S+@\S+\.\S+/.test(booking.email);
  const otpComplete = otp.every((d) => d !== "");
  const verified = googleDone || (otpSent && otpComplete);
  const canReserve = booking.name.trim() && verified;
  const channelName = isIndia ? (channel === "whatsapp" ? "WhatsApp" : "SMS") : "WhatsApp";

  const syncMobile = (dc: string, n: string) => onChange({ mobile: n ? `${dc} ${n}` : "" });
  const onNum = (v: string) => { const n = v.replace(/[^\d\s]/g, ""); setNum(n); syncMobile(dialCode, n); };
  const onDial = (v: string) => { setDialCode(v); if (v !== "+91") setChannel("whatsapp"); syncMobile(v, num); };
  const setOtpDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setOtp((o) => { const n = [...o]; n[i] = digit; return n; });
    if (digit && i < otp.length - 1) otpRefs.current[i + 1]?.focus();
  };

  const perks = ["Continue conversations", "Review recommendations", "Upload documents", "Track shortlisted properties", "Collaborate with your advisor"];

  const otpBlock = otpSent ? (
    <div className="animate-fade-up">
      <label className="mb-3 block text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">
        {method === "email" ? "Enter the code sent to your email" : `Enter the code sent on ${channelName}`}
      </label>
      <div className="flex gap-2.5">
        {otp.map((d, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            value={d}
            onChange={(e) => setOtpDigit(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
            inputMode="numeric"
            maxLength={1}
            className="h-14 w-11 rounded-lg border border-[#1a1a1a]/15 bg-white text-center font-serif text-[1.5rem] font-light text-[#1a1a1a] outline-none transition-colors focus:border-[#1e6b45]/50"
          />
        ))}
      </div>
      <p className="mt-3 text-[0.76rem] font-light italic text-[#1a1a1a]/35">
        Passwordless — no password to remember. Enter any 6 digits to continue this preview.
      </p>
    </div>
  ) : null;

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

        {googleDone ? (
          <div className="animate-fade-up flex items-center justify-between gap-3 rounded-xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.05] px-5 py-4">
            <span className="flex items-center gap-2.5 text-[0.9rem] font-light text-[#1a1a1a]/75">
              <GoogleIcon /> Signed in with Google — your identity is verified.
            </span>
            <button onClick={() => setGoogleDone(false)} className="shrink-0 text-[0.78rem] font-light text-[#1a1a1a]/45 transition-colors hover:text-[#1a1a1a]">
              Change
            </button>
          </div>
        ) : (
          <>
            {/* Phone — country code + number, verified on WhatsApp (or SMS in India) */}
            <div>
              <label className="mb-1 block text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">Mobile</label>
              <div className="flex items-center gap-3">
                <select
                  value={dialCode}
                  onChange={(e) => onDial(e.target.value)}
                  disabled={otpSent && method === "phone"}
                  aria-label="Country dialling code"
                  className="shrink-0 border-b border-[#1a1a1a]/15 bg-transparent py-3 font-serif text-[1.05rem] font-light text-[#1a1a1a] outline-none focus:border-[#1e6b45]/50 disabled:opacity-50"
                >
                  {DIAL_CODES.map((c) => (
                    <option key={c.iso} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={num}
                  onChange={(e) => onNum(e.target.value)}
                  disabled={otpSent && method === "phone"}
                  placeholder={isIndia ? "98xxx xxxxx" : "phone number"}
                  className="min-w-0 flex-1 border-b border-[#1a1a1a]/15 bg-transparent py-3 font-serif text-[1.2rem] font-light text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/25 focus:border-[#1e6b45]/50 disabled:opacity-50"
                />
                {!(otpSent && method === "phone") && (
                  <button
                    onClick={() => numValid && (setMethod("phone"), setOtpSent(true))}
                    disabled={!numValid}
                    className="shrink-0 rounded-full border border-[#1e6b45]/40 px-5 py-2 text-[0.8rem] font-light text-[#1e6b45] transition-all hover:bg-[#1e6b45] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Send code
                  </button>
                )}
              </div>

              {!(otpSent && method === "phone") &&
                (isIndia ? (
                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <ChannelPill active={channel === "whatsapp"} onClick={() => setChannel("whatsapp")}>
                      <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                    </ChannelPill>
                    <ChannelPill active={channel === "sms"} onClick={() => setChannel("sms")}>SMS</ChannelPill>
                    <span className="text-[0.74rem] font-light text-[#1a1a1a]/35">— how should we send your code?</span>
                  </div>
                ) : (
                  <p className="mt-3.5 flex items-center gap-2 text-[0.8rem] font-light text-[#1e6b45]">
                    <WhatsAppIcon className="h-3.5 w-3.5" /> We&apos;ll verify your number on WhatsApp.
                  </p>
                ))}
            </div>

            {method === "phone" && otpBlock}

            <div className="flex items-center gap-4">
              <span className="h-px flex-1 bg-[#1a1a1a]/10" />
              <span className="text-[0.72rem] font-light uppercase tracking-[0.18em] text-[#1a1a1a]/35">or continue with</span>
              <span className="h-px flex-1 bg-[#1a1a1a]/10" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => { setGoogleDone(true); setOtpSent(false); }}
                className="flex flex-1 items-center justify-center gap-2.5 rounded-full border border-[#1a1a1a]/15 bg-white px-5 py-3 text-[0.86rem] font-light text-[#1a1a1a]/80 transition-all hover:border-[#1a1a1a]/35"
              >
                <GoogleIcon /> Continue with Google
              </button>
              <button
                onClick={() => setEmailMode((v) => !v)}
                className={`flex flex-1 items-center justify-center gap-2.5 rounded-full border px-5 py-3 text-[0.86rem] font-light transition-all ${
                  emailMode ? "border-[#1e6b45]/50 text-[#1e6b45]" : "border-[#1a1a1a]/15 text-[#1a1a1a]/80 hover:border-[#1a1a1a]/35"
                }`}
              >
                <span aria-hidden>&#9993;</span> Continue with Email
              </button>
            </div>

            {emailMode && (
              <div className="animate-fade-up">
                <label className="mb-1 block text-[10px] font-light uppercase tracking-[0.22em] text-[#1a1a1a]/40">Email</label>
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    value={booking.email}
                    onChange={(e) => onChange({ email: e.target.value })}
                    disabled={otpSent && method === "email"}
                    placeholder="you@email.com"
                    className="min-w-0 flex-1 border-b border-[#1a1a1a]/15 bg-transparent py-3 font-serif text-[1.2rem] font-light text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/25 focus:border-[#1e6b45]/50 disabled:opacity-50"
                  />
                  {!(otpSent && method === "email") && (
                    <button
                      onClick={() => emailValid && (setMethod("email"), setOtpSent(true))}
                      disabled={!emailValid}
                      className="shrink-0 rounded-full border border-[#1e6b45]/40 px-5 py-2 text-[0.8rem] font-light text-[#1e6b45] transition-all hover:bg-[#1e6b45] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Send code
                    </button>
                  )}
                </div>
                {method === "email" && <div className="mt-6">{otpBlock}</div>}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-12">
        <PrimaryButton onClick={onReserve} disabled={!canReserve} full>
          {ctaLabel}
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
   STEP 6.5 — PAYMENT (Stripe gateway mock)
   A simulated Stripe Checkout. No real card is processed; everything is
   front-end only, built to swap onto Stripe Checkout / Payment Element.
   ════════════════════════════════════════════════════════════════ */
function CardBrands() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Visa */}
      <span className="flex h-5 w-8 items-center justify-center rounded-[3px] bg-white ring-1 ring-[#1a1a1a]/10">
        <span className="font-serif text-[9px] font-bold italic tracking-tight text-[#1a3a8f]">VISA</span>
      </span>
      {/* Mastercard */}
      <span className="flex h-5 w-8 items-center justify-center gap-[-3px] rounded-[3px] bg-white ring-1 ring-[#1a1a1a]/10">
        <span className="h-3 w-3 rounded-full bg-[#eb001b]" />
        <span className="-ml-1 h-3 w-3 rounded-full bg-[#f79e1b]/90 mix-blend-multiply" />
      </span>
      {/* Amex */}
      <span className="flex h-5 w-8 items-center justify-center rounded-[3px] bg-[#2e77bc]">
        <span className="text-[7px] font-bold tracking-tight text-white">AMEX</span>
      </span>
    </div>
  );
}

function StripeFooter() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5 text-[0.72rem] font-light text-[#1a1a1a]/40">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <rect x="5" y="11" width="14" height="9" rx="1.5" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
        </svg>
        <span>Payments are secure and encrypted</span>
      </div>
      <div className="flex items-center gap-3 text-[0.72rem] font-light text-[#1a1a1a]/35">
        <span className="flex items-center gap-1">
          Powered by{" "}
          <span className="font-sans text-[0.8rem] font-bold tracking-tight text-[#635bff]">stripe</span>
        </span>
        <span className="text-[#1a1a1a]/15">|</span>
        <button className="underline decoration-[#1a1a1a]/15 underline-offset-2 hover:text-[#1a1a1a]/60">Terms</button>
        <button className="underline decoration-[#1a1a1a]/15 underline-offset-2 hover:text-[#1a1a1a]/60">Privacy</button>
      </div>
    </div>
  );
}

const PAY_COUNTRIES = ["India", "United Kingdom", "United States", "Canada", "United Arab Emirates", "Singapore", "Australia", "Saudi Arabia", "Qatar", "Germany", "Hong Kong", "New Zealand"];

function PaymentStep({ booking, onPaid }: { booking: ConsultBooking; onPaid: () => void }) {
  const [email, setEmail] = useState(booking.email);
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState(booking.name);
  const [country, setCountry] = useState("India");
  const [zip, setZip] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const advisor = advisorFor(booking.reason);
  const hasDiscount = CONSULT_FEE_ORIGINAL != null && CONSULT_FEE != null && CONSULT_FEE_ORIGINAL > CONSULT_FEE;
  const fee = CONSULT_FEE ?? 0;

  const onCard = (v: string) => setCard(v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim());
  const onExp = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    setExp(d.length >= 3 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d);
  };
  const onCvc = (v: string) => setCvc(v.replace(/\D/g, "").slice(0, 4));
  const fillTestCard = () => { setCard("4242 4242 4242 4242"); setExp("12 / 34"); setCvc("123"); if (!zip) setZip("122002"); };

  const emailOk = /\S+@\S+\.\S+/.test(email);
  const cardOk = card.replace(/\s/g, "").length >= 15;
  const expOk = exp.replace(/\D/g, "").length === 4;
  const cvcOk = cvc.length >= 3;
  const canPay = emailOk && cardOk && expOk && cvcOk && cardName.trim().length > 1 && !processing;

  const pay = () => {
    if (!canPay) return;
    setProcessing(true);
    setTimeout(() => { setDone(true); setTimeout(onPaid, 850); }, 1700);
  };

  const inputCls =
    "w-full rounded-lg border border-[#1a1a1a]/15 bg-white px-3.5 py-3 text-[0.95rem] font-light text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/30 focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff]/30";

  return (
    <div className="animate-fade-up mx-auto max-w-[440px] px-6 py-10 md:py-14">
      <Eyebrow>Secure Checkout</Eyebrow>
      <h1 className="font-serif text-[1.9rem] font-medium leading-[1.12] text-[#1a1a1a] md:text-[2.3rem]">
        Confirm &amp; pay.
      </h1>

      {/* ── Order summary ── */}
      <div className="mt-7 rounded-2xl border border-[#1a1a1a]/[0.08] bg-white p-5 shadow-sm shadow-black/[0.02]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.92rem] font-medium text-[#1a1a1a]">45-Minute Independent Consultation</p>
            <p className="mt-1 text-[0.8rem] font-light text-[#1a1a1a]/50">
              With {advisor.name}
              {booking.day && booking.time ? ` · ${booking.day}, ${booking.time}` : ""}
              {booking.format ? ` · ${booking.format}` : ""}
            </p>
          </div>
          {hasDiscount && (
            <span className="shrink-0 rounded-full bg-[#1e6b45]/[0.08] px-2.5 py-1 text-[0.66rem] font-medium tracking-[0.02em] text-[#1e6b45]">
              {CONSULT_FEE_DISCOUNT_LABEL}
            </span>
          )}
        </div>

        <div className="mt-4 space-y-2 border-t border-[#1a1a1a]/[0.06] pt-4 text-[0.84rem] font-light">
          {hasDiscount && (
            <>
              <div className="flex justify-between text-[#1a1a1a]/50">
                <span>Consultation fee</span>
                <span>{inr(CONSULT_FEE_ORIGINAL!)}</span>
              </div>
              <div className="flex justify-between text-[#1e6b45]">
                <span>Inaugural discount (50%)</span>
                <span>−{inr(CONSULT_FEE_ORIGINAL! - fee)}</span>
              </div>
            </>
          )}
          <div className="flex items-baseline justify-between border-t border-[#1a1a1a]/[0.06] pt-2.5">
            <span className="text-[0.8rem] font-medium uppercase tracking-[0.08em] text-[#1a1a1a]/45">Total due today</span>
            <span className="font-serif text-[1.5rem] font-medium text-[#1a1a1a]">{inr(fee)}</span>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-2 text-[0.76rem] font-light leading-relaxed text-[#1a1a1a]/45">
          <span className="mt-[0.15em] text-[#1e6b45]">&#10003;</span>
          {CONSULT_FEE_REFUND_NOTE}
        </p>
      </div>

      {/* ── Card form ── */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-[0.8rem] font-medium text-[#1a1a1a]/70">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={inputCls} />
        </div>

        <div>
          <label className="mb-1.5 block text-[0.8rem] font-medium text-[#1a1a1a]/70">Card information</label>
          {/* Grouped card block, Stripe Payment Element style */}
          <div className="overflow-hidden rounded-lg border border-[#1a1a1a]/15 bg-white focus-within:border-[#635bff] focus-within:ring-1 focus-within:ring-[#635bff]/30">
            <div className="relative flex items-center">
              <input
                inputMode="numeric"
                value={card}
                onChange={(e) => onCard(e.target.value)}
                placeholder="1234 1234 1234 1234"
                className="w-full bg-transparent px-3.5 py-3 text-[0.95rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30"
              />
              <div className="absolute right-3.5"><CardBrands /></div>
            </div>
            <div className="flex border-t border-[#1a1a1a]/10">
              <input
                inputMode="numeric"
                value={exp}
                onChange={(e) => onExp(e.target.value)}
                placeholder="MM / YY"
                className="w-1/2 border-r border-[#1a1a1a]/10 bg-transparent px-3.5 py-3 text-[0.95rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30"
              />
              <input
                inputMode="numeric"
                value={cvc}
                onChange={(e) => onCvc(e.target.value)}
                placeholder="CVC"
                className="w-1/2 bg-transparent px-3.5 py-3 text-[0.95rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30"
              />
            </div>
          </div>
          <button onClick={fillTestCard} className="mt-2 text-[0.72rem] font-light text-[#635bff] transition-opacity hover:opacity-70">
            Test mode — autofill a demo card
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-[0.8rem] font-medium text-[#1a1a1a]/70">Name on card</label>
          <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Full name" className={inputCls} />
        </div>

        <div>
          <label className="mb-1.5 block text-[0.8rem] font-medium text-[#1a1a1a]/70">Country &amp; PIN / ZIP</label>
          <div className="overflow-hidden rounded-lg border border-[#1a1a1a]/15 bg-white focus-within:border-[#635bff] focus-within:ring-1 focus-within:ring-[#635bff]/30">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border-b border-[#1a1a1a]/10 bg-transparent px-3 py-3 text-[0.95rem] font-light text-[#1a1a1a] outline-none"
            >
              {PAY_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="PIN / ZIP code"
              className="w-full bg-transparent px-3.5 py-3 text-[0.95rem] font-light text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30"
            />
          </div>
        </div>
      </div>

      <button
        onClick={pay}
        disabled={!canPay}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e6b45] px-7 py-4 text-[0.9rem] font-medium tracking-[0.03em] text-white shadow-sm transition-all duration-300 enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {done ? (
          <><span>&#10003;</span> Payment confirmed</>
        ) : processing ? (
          <><Spinner /> Processing…</>
        ) : (
          <>Pay {inr(fee)}</>
        )}
      </button>

      <StripeFooter />
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
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
