"use client";

import OtpDigits from "@/components/auth/OtpDigits";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../Logo";
import {
  CONSULT_DAYPARTS,
  CONSULT_DAYS,
  CONSULT_DURATION,
  CONSULT_FEE,
  CONSULT_FEE_ORIGINAL,
  CONSULT_FEE_DISCOUNT_LABEL,
  CONSULT_FEE_NOTE,
  inr,
  CONSULT_FORMATS,
  CONSULT_OUTCOMES,
  CONSULT_PILLARS,
  CONSULT_TIMELINE,
  ConsultAdvisor,
  ConsultBooking,
  ConsultContext,
  ConsultProfileChip,
  advisorFor,
  consultPrepLine,
  emptyConsultBooking,
  saveConsultation,
} from "@/lib/consultation";
import {
  sendOtp,
  verifyOtp,
  loadVerified,
  saveVerified,
  maskContact,
  OTP_LENGTH,
  type Verified,
} from "@/lib/shortlistAuth";

const basePath = "/Truth-Estate";

type Step = "intro" | "payment" | "confirm" | "office";

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
  // DNA) — it lets us lead with "your advisor is ready" and pre-fill the brief.
  const warm = !!context.profile?.length;
  const paid = CONSULT_FEE != null;
  // The entry page now gates register → schedule → book on a single screen,
  // so the flow past it is just the (optional) payment step and confirmation.
  const FLOW: Step[] = paid ? ["intro", "payment"] : ["intro"];

  // Close on Escape — consistent with the journey modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const prepLine = consultPrepLine(context);

  const goTo = (s: Step) => {
    setStep(s);
    scrollRef.current?.scrollTo(0, 0);
  };

  const fi = FLOW.indexOf(step);
  const progress = fi < 0 ? null : (fi + 1) / (FLOW.length + 1); // confirm / office: hidden

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

  const back: Partial<Record<Step, Step>> = paid ? { payment: "intro" } : {};

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
        <AdviceEntry
          booking={booking}
          setBooking={setBooking}
          prepLine={prepLine}
          warm={warm}
          profile={context.profile}
          onBook={() => (paid ? goTo("payment") : reserve())}
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
   STEP 1 — ADVICE ENTRY  (gated: register → schedule → book)
   The single entry screen. Left column carries the pitch; the right-hand
   panel progressively gates — advisor + an open contact form to register
   (phone-OTP), and only once verified does it reveal the day/time
   scheduler + book. On mobile the order is headline → form → rest of pitch.
   ════════════════════════════════════════════════════════════════ */

/* Shared right-panel card shell + step badge. */
const CARD =
  "relative rounded-[20px] border border-[#1a1a1a]/[0.08] bg-white p-6 shadow-[0_26px_64px_-32px_rgba(26,26,26,0.3)] md:p-7";

function CardBadge({ children, tone }: { children: React.ReactNode; tone: "gold" | "green" }) {
  return (
    <span
      className={`absolute -top-3 left-6 rounded-md px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white ${
        tone === "green" ? "bg-[#1e6b45]" : "bg-[#9a7a2e]"
      }`}
    >
      {children}
    </span>
  );
}

function AdvisorRow({ advisor }: { advisor: ConsultAdvisor }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e6b45]/10 font-serif text-[1rem] font-medium text-[#1e6b45]">
        {advisor.initials}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-light uppercase tracking-[0.2em] text-[#1a1a1a]/35">Your advisor</p>
        <p className="font-serif text-[1.2rem] font-medium leading-tight text-[#1a1a1a]">{advisor.name}</p>
        <p className="text-[0.8rem] font-light text-[#1a1a1a]/50">{advisor.focus}</p>
      </div>
    </div>
  );
}

function AdviceEntry({
  booking,
  setBooking,
  prepLine,
  warm,
  profile,
  onBook,
}: {
  booking: ConsultBooking;
  setBooking: React.Dispatch<React.SetStateAction<ConsultBooking>>;
  prepLine: string | null;
  warm: boolean;
  profile?: ConsultProfileChip[];
  onBook: () => void;
}) {
  const advisor = advisorFor(booking.reason);
  const [phase, setPhase] = useState<"register" | "schedule">("register");
  const [verified, setVerified] = useState<Verified | null>(null);

  // A prior shortlist verification carries over — skip the second OTP and
  // open straight on the scheduler. We start unverified so the first client
  // render matches the static server render, then hydrate from storage.
  useEffect(() => {
    const v = loadVerified();
    if (!v) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVerified(v);
    setBooking((b) => ({
      ...b,
      name: b.name || v.name || "",
      mobile: b.mobile || (v.channel === "mobile" ? `${v.cc ?? ""} ${v.contact}`.trim() : b.mobile),
      email: b.email || v.email || (v.channel === "email" ? v.contact : ""),
    }));
    setPhase("schedule");
  }, [setBooking]);

  const handleVerified = (v: Verified) => {
    saveVerified(v);
    setVerified(v);
    setBooking((b) => ({
      ...b,
      name: v.name?.trim() || b.name,
      mobile: v.channel === "mobile" ? `${v.cc ?? ""} ${v.contact}`.trim() : b.mobile,
      email: v.email?.trim() || b.email,
    }));
    setPhase("schedule");
  };

  return (
    <div className="animate-fade-up mx-auto max-w-[1200px] px-6 py-6 md:px-10 md:py-10">
      {/* Mobile: flex column in DOM order (headline → form → rest of pitch).
          Desktop: pitch left, gated panel right, spanning both rows. */}
      <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1fr)_27rem] md:items-start md:gap-x-12 md:gap-y-9">
        {/* headline — leads on mobile */}
        <div className="md:col-start-1 md:row-start-1">
          <Eyebrow>Request Independent Advice</Eyebrow>
          <h1 className="font-serif text-[2rem] font-medium leading-[1.05] tracking-[-0.015em] text-[#1a1a1a] md:text-[3rem]">
            {warm ? "Your advisor is ready when you are." : "Every important property decision deserves independent thinking."}
          </h1>
          <p className="mt-5 max-w-[480px] text-[0.98rem] font-light leading-[1.6] text-[#1a1a1a]/55 md:text-[1.08rem]">
            {warm
              ? "No sales pressure and no agenda — just one prepared, independent conversation about your decision."
              : "One clear recommendation, no agenda — independent advice tailored to your situation, and we'll tell you to walk away if that's the honest call."}
          </p>
        </div>

        {/* the gated action panel */}
        <div className="md:col-start-2 md:row-start-1 md:row-span-2 md:self-start">
          {phase === "register" ? (
            <RegisterCard advisor={advisor} initialName={booking.name} onVerified={handleVerified} />
          ) : (
            <ScheduleCard advisor={advisor} verified={verified} booking={booking} setBooking={setBooking} onBook={onBook} />
          )}
        </div>

        {/* rest of the pitch — sits below the form on mobile */}
        <div className="md:col-start-1 md:row-start-2">
          <PitchRest prepLine={prepLine} profile={profile} />
        </div>
      </div>
    </div>
  );
}

function PitchRest({ prepLine, profile }: { prepLine: string | null; profile?: ConsultProfileChip[] }) {
  return (
    <div>
      {/* The founder is the seal — the desk this conversation runs through. */}
      <div className="flex items-center gap-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${basePath}/images/founder-gaurav.webp`} alt="Gaurav Jain — Founder, Truth Estate" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[#c9a96e]/50" />
        <div className="min-w-0">
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[#9a7a2e]">The Independent Desk</p>
          <p className="mt-0.5 text-[0.92rem] font-semibold leading-tight text-[#1a1a1a]">Gaurav Jain</p>
          <p className="text-[0.74rem] font-light text-[#1a1a1a]/50">Founder, Truth Estate — every file crosses this desk.</p>
        </div>
      </div>

      {/* Context we already hold — the source we'll prep for and, when warm,
          the visitor's brief. */}
      {(prepLine || (profile && profile.length > 0)) && (
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

      {/* What happens during the consultation */}
      <p className="mt-8 text-[10px] font-light uppercase tracking-[0.3em] text-[#1a1a1a]/30">
        What happens during this consultation?
      </p>
      <ol className="relative ml-1 mt-5">
        {CONSULT_TIMELINE.map((t, i) => (
          <li key={t} className="relative flex gap-5 pb-5 last:pb-0">
            {i < CONSULT_TIMELINE.length - 1 && (
              <span className="absolute left-[7px] top-5 h-full w-px bg-[#1a1a1a]/12" />
            )}
            <span className="relative z-10 mt-1 h-[15px] w-[15px] shrink-0 rounded-full border border-[#1e6b45] bg-[#F5F0E8]">
              <span className="absolute inset-[3px] rounded-full bg-[#1e6b45]" />
            </span>
            <span className="font-serif text-[1.02rem] font-light text-[#1a1a1a]/75 md:text-[1.12rem]">{t}</span>
          </li>
        ))}
      </ol>
      <p className="mt-6 max-w-[520px] text-[0.82rem] font-light leading-relaxed text-[#1a1a1a]/45">
        We won&apos;t always tell you to buy. Depending on the evidence, the right
        recommendation may be to{" "}
        {CONSULT_OUTCOMES.map((o, i) => (
          <span key={o}>
            <span className="text-[#1a1a1a]/70">{o}</span>
            {i < CONSULT_OUTCOMES.length - 1 ? ", " : "."}
          </span>
        ))}
      </p>

      <PillarStrip />
    </div>
  );
}

/* ── Right panel, phase 1: advisor + contact form (phone-OTP) ── */
function RegisterCard({
  advisor,
  initialName,
  onVerified,
}: {
  advisor: ConsultAdvisor;
  initialName: string;
  onVerified: (v: Verified) => void;
}) {
  const [name, setName] = useState(initialName);
  const [dialCode, setDialCode] = useState("+91");
  const [num, setNum] = useState("");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  /* Six boxes could never be filled: MSG91's DLT template sends four
     digits, so the Verify button stayed disabled forever once the code
     was real. Driven off OTP_LENGTH now, not a literal. */
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isIndia = dialCode === "+91";
  const digits = num.replace(/\D/g, "");
  const numValid = digits.length >= (isIndia ? 10 : 6);
  const nameValid = name.trim().length > 1;
  const otpComplete = otp.every((d) => d !== "");
  const hasDiscount = CONSULT_FEE_ORIGINAL != null && CONSULT_FEE != null && CONSULT_FEE_ORIGINAL > CONSULT_FEE;

  const send = async () => {
    if (!numValid || sending) return;
    setErr(null);
    setSending(true);
    const r = await sendOtp("mobile", digits, dialCode);
    setSending(false);
    if (r.ok) {
      setOtpSent(true);
    } else setErr(r.error ?? "We couldn't send the code. Please try again.");
  };

  const verify = async () => {
    if (!nameValid || !otpComplete || verifying) return;
    setErr(null);
    setVerifying(true);
    const r = await verifyOtp("mobile", digits, otp.join(""), name.trim(), dialCode);
    setVerifying(false);
    if (r.ok) {
      onVerified({ channel: "mobile", contact: digits, cc: dialCode, name: name.trim(), email: email.trim() || undefined, at: Date.now() });
    } else setErr(r.error ?? "That code didn't match. Please try again.");
  };


  const inputCls =
    "w-full rounded-xl border border-[#1a1a1a]/15 bg-[#FBF8F2] px-3.5 py-3 text-[0.95rem] font-light text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/35 focus:border-[#1e6b45]/50 disabled:opacity-60";

  return (
    <div className={CARD}>
      <CardBadge tone="gold">Step 1 · Register</CardBadge>
      <AdvisorRow advisor={advisor} />

      {CONSULT_FEE != null && (
        <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
          {hasDiscount && <span className="text-[0.85rem] font-light text-[#1a1a1a]/35 line-through">{inr(CONSULT_FEE_ORIGINAL!)}</span>}
          <span className="font-serif text-[1.4rem] font-medium text-[#1a1a1a]">{inr(CONSULT_FEE)}</span>
          {hasDiscount && (
            <span className="rounded-full bg-[#1e6b45]/[0.09] px-2.5 py-1 text-[0.66rem] font-medium text-[#1e6b45]">{CONSULT_FEE_DISCOUNT_LABEL}</span>
          )}
        </div>
      )}

      <div className="my-5 h-px bg-[#1a1a1a]/[0.08]" />

      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#1a1a1a]/40">Create your account to continue</p>

      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        className={`mb-2.5 ${inputCls}`}
      />

      {/* Phone + Send OTP */}
      <div className="flex gap-2">
        <select
          value={dialCode}
          onChange={(e) => setDialCode(e.target.value)}
          disabled={otpSent}
          aria-label="Country dialling code"
          className="shrink-0 rounded-xl border border-[#1a1a1a]/15 bg-[#FBF8F2] px-2.5 text-[0.9rem] font-medium text-[#1a1a1a] outline-none focus:border-[#1e6b45]/50 disabled:opacity-60"
        >
          {DIAL_CODES.map((c) => (
            <option key={c.iso} value={c.code}>{c.flag} {c.code}</option>
          ))}
        </select>
        <input
          type="tel"
          value={num}
          onChange={(e) => setNum(e.target.value.replace(/[^\d\s]/g, ""))}
          disabled={otpSent}
          placeholder={isIndia ? "98765 43210" : "phone number"}
          className={`min-w-0 flex-1 ${inputCls}`}
        />
        {!otpSent && (
          <button
            onClick={send}
            disabled={!numValid || sending}
            className="shrink-0 rounded-xl border border-[#1e6b45]/35 bg-[#1e6b45]/[0.05] px-3.5 text-[0.8rem] font-semibold text-[#1e6b45] transition-all enabled:hover:bg-[#1e6b45] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Sending…" : "Send OTP"}
          </button>
        )}
      </div>

      {/* OTP digits */}
      {otpSent && (
        <div className="animate-fade-up mt-3.5">
          <div className="flex items-center justify-between">
            <label className="text-[0.72rem] font-light uppercase tracking-[0.18em] text-[#1a1a1a]/40">Enter the {OTP_LENGTH}-digit code</label>
            <button onClick={send} disabled={sending} className="text-[0.72rem] font-light text-[#1e6b45] transition-opacity hover:opacity-70 disabled:opacity-40">
              {sending ? "Sending…" : "Resend"}
            </button>
          </div>
          <div className="mt-2">
            <OtpDigits
              value={otp} onChange={setOtp} len={otp.length} autoFocus
              boxClass="h-12 w-full rounded-lg border border-[#1a1a1a]/15 bg-white text-center font-serif text-[1.25rem] font-light text-[#1a1a1a] outline-none transition-colors focus:border-[#1e6b45]/50"
            />
          </div>
        </div>
      )}

      {/* Email — optional contact, not a verification channel */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
        className={`mt-2.5 ${inputCls}`}
      />

      {err && <p className="mt-3 text-[0.78rem] font-light text-[#b23b3b]">{err}</p>}

      <button
        onClick={verify}
        disabled={!nameValid || !otpSent || !otpComplete || verifying}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#1e6b45] px-6 py-3.5 text-[0.92rem] font-semibold tracking-[0.02em] text-white shadow-lg shadow-[#1e6b45]/20 transition-all enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {verifying ? <><Spinner /> Verifying…</> : "Verify & continue →"}
      </button>
      <p className="mt-3 text-center text-[0.74rem] font-light text-[#1a1a1a]/40">One quick verification — then you pick your time.</p>

      {/* Locked scheduler — unlocks on verify */}
      <div className="mt-4 flex items-center gap-2.5 rounded-[13px] border border-dashed border-[#1a1a1a]/20 px-4 py-3.5 text-[0.82rem] font-light text-[#1a1a1a]/40">
        <span className="text-[0.95rem]">🔒</span>
        Day &amp; time — unlocks the moment you&apos;re verified.
      </div>
    </div>
  );
}

/* ── Right panel, phase 2: verified — the scheduler is revealed ── */
function ScheduleCard({
  advisor,
  verified,
  booking,
  setBooking,
  onBook,
}: {
  advisor: ConsultAdvisor;
  verified: Verified | null;
  booking: ConsultBooking;
  setBooking: React.Dispatch<React.SetStateAction<ConsultBooking>>;
  onBook: () => void;
}) {
  // Default the format so the booking summary reads cleanly; the toggle changes it.
  useEffect(() => {
    if (!booking.format) setBooking((b) => ({ ...b, format: "Video" }));
  }, [booking.format, setBooking]);

  const set = (patch: Partial<ConsultBooking>) => setBooking((b) => ({ ...b, ...patch }));
  const ready = !!(booking.day && booking.time && booking.format);
  const firstName = (verified?.name || booking.name || "").trim().split(" ")[0];

  const pill = (on: boolean, accent: "day" | "slot") =>
    `rounded-full border px-4 py-2 text-[0.82rem] font-light transition-all ${
      on
        ? "border-[#1e6b45] bg-[#1e6b45] font-medium text-white"
        : accent === "slot"
          ? "border-[#1e6b45]/30 text-[#1e6b45] hover:bg-[#1e6b45]/[0.06]"
          : "border-[#1a1a1a]/15 text-[#1a1a1a]/70 hover:border-[#1a1a1a]/35"
    }`;

  return (
    <div className={CARD}>
      <CardBadge tone="green">Step 2 · Schedule</CardBadge>
      <AdvisorRow advisor={advisor} />

      {/* Verified chip */}
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#1e6b45]/30 bg-[#1e6b45]/[0.06] px-3.5 py-2.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#1e6b45]" />
        <span className="text-[0.8rem] font-light text-[#1a1a1a]/75">
          Verified — <b className="font-semibold text-[#1e6b45]">{verified ? maskContact(verified) : booking.mobile}</b>
        </span>
        {firstName && <span className="ml-auto text-[0.72rem] font-light text-[#1a1a1a]/40">welcome, {firstName}</span>}
      </div>

      <div className="my-5 h-px bg-[#1a1a1a]/[0.08]" />

      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#1a1a1a]/40">Pick a day &amp; time</p>

      {/* Days */}
      <div className="flex flex-wrap gap-2">
        {CONSULT_DAYS.map((d) => (
          <button key={d} onClick={() => set({ day: d })} className={pill(booking.day === d, "day")}>{d}</button>
        ))}
      </div>

      {/* Dayparts */}
      <div className="mt-4 flex flex-col gap-4">
        {CONSULT_DAYPARTS.map((dp) => (
          <div key={dp.part}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">
              {dp.part} <span className="ml-1 font-light text-[#1a1a1a]/30">{dp.window}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {dp.slots.map((s) => (
                <button key={s} onClick={() => set({ time: s })} className={pill(booking.time === s, "slot")}>{s}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Format */}
      <div className="mt-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]/40">Format</p>
        <div className="flex gap-2">
          {CONSULT_FORMATS.map((f) => (
            <button key={f} onClick={() => set({ format: f })} className={pill(booking.format === f, "day")}>{f}</button>
          ))}
        </div>
      </div>

      {/* Booking summary */}
      {booking.day && booking.time && (
        <div className="mt-5 flex items-center gap-2.5 text-[0.85rem] font-light text-[#1a1a1a]">
          <span className="text-[#9a7a2e]">◷</span>
          <span>
            Booking <b className="font-semibold">{booking.day} · {booking.time}</b>
            {booking.format ? ` · ${booking.format} call` : ""}
          </span>
        </div>
      )}

      <button
        onClick={onBook}
        disabled={!ready}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#1e6b45] px-6 py-3.5 text-[0.92rem] font-semibold tracking-[0.02em] text-white shadow-lg shadow-[#1e6b45]/20 transition-all enabled:hover:bg-[#238c55] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {CONSULT_FEE != null ? `Book your consultation · ${inr(CONSULT_FEE)} →` : "Book your consultation →"}
      </button>
      <p className="mt-3 text-center text-[0.74rem] font-light text-[#1a1a1a]/45">{CONSULT_FEE_NOTE}</p>
    </div>
  );
}

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
          {CONSULT_FEE_NOTE}
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
