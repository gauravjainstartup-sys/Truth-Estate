"use client";

/* ────────────────────────────────────────────────────────────────────────
   Sign-in — the gate to the Private Office (also the registration entry).

   Rules & Workflows:
   1. Step 1 asks for Mobile Number ONLY (Indian +91 or International).
      No Name field upfront for returning users.
   2. Auto-detects visitor country on load to prefill country dial code (+91, +1, +971, etc.).
   3. Indian numbers (+91): MSG91 sends 4-digit SMS OTP.
      - Checks if returning user (phoneKnown). Shows Welcome Back screen.
      - 4-digit OTP verification -> Sign in -> Open Private Office.
   4. International numbers (Non-+91): Google SSO (Verified Email) primary.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import OtpDigits from "../auth/OtpDigits";
import { saveLead } from "@/lib/journey";
import {
  normalisePhone,
  normaliseIntl,
  prettyPhone,
  sendOtp,
  sendOtpIntl,
  sendTwilioOtp,
  verifyOtp,
  verifyTwilioOtp,
  signInWithGoogle,
  phoneKnown,
  OTP_LENGTH,
} from "@/lib/phoneAuth";
import { detectUserCountry } from "@/lib/geo";
import { basePath } from "@/lib/site";

const DIAL = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
];

const TICKS = [
  "Zero brokerage · fixed fee",
  "Independent, on-record advice",
  "Your negotiation, tracked end-to-end",
];

const OTP_LEN = OTP_LENGTH; // 4 digits

const FIELD =
  "w-full rounded-md border border-[#1a1a1a]/[0.16] bg-white px-4 py-3 text-[0.95rem] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/35 focus:border-[#c9a96e]";

export default function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const { open: openOnboarding } = useJourney();
  const [step, setStep] = useState<"contact" | "otp">("contact");
  const [dial, setDial] = useState("+91");
  const [num, setNum] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [err, setErr] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  const isIndia = dial === "+91";
  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const otpComplete = otp.every((d) => d !== "");
  const normalised = isIndia ? normalisePhone(num) : null;
  const sentTo = normalised ? `${dial} ${prettyPhone(normalised)}` : `${dial} ${num.trim()}`;

  // Auto-detect country code on mount
  useEffect(() => {
    detectUserCountry().then((geo) => {
      if (geo.dialCode && DIAL.some((d) => d.code === geo.dialCode)) {
        setDial(geo.dialCode);
      }
    });
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  async function handleMobileSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;

    const ten = isIndia ? normalisePhone(num) : normaliseIntl(dial, num);
    if (!ten) {
      setErr(isIndia ? "Please enter a valid 10-digit Indian mobile number." : "Please enter a valid mobile number.");
      return;
    }

    setErr("");
    setBusy(true);

    if (isIndia) {
      const known = await phoneKnown(ten, dial);
      setIsReturning(known === true);

      const r = await sendOtp(ten);
      setBusy(false);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setStep("otp");
      setResendIn(24);
    } else {
      // International 4-digit SMS OTP via Twilio
      const known = await phoneKnown(ten, dial);
      setIsReturning(known === true);

      const r = await sendTwilioOtp(dial, num);
      setBusy(false);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setStep("otp");
      setResendIn(24);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    if (!otpComplete) {
      setErr(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    const ten = isIndia ? normalisePhone(num) : normaliseIntl(dial, num);
    if (!ten) {
      setErr("That number doesn't look right — go back and check it.");
      return;
    }

    setErr("");
    setBusy(true);

    // Verify 4-digit OTP
    const r = await verifyOtp(ten, otp.join(""), undefined, dial);
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }

    saveLead({
      name: "",
      email: "",
      phone: `${dial} ${num}`.trim(),
      intent: "buyer-office",
      createdAt: Date.now(),
    });

    onSignedIn();
    if (!isReturning) {
      openOnboarding(); // New users get the onboarding brief
    }
  }

  const brand = (
    <>
      <a href={`${basePath}/`} aria-label="Truth Estate — home" className="inline-block">
        <Logo color="#f6f1e8" className="h-8 w-auto" />
      </a>
      <div className="mt-8 md:mt-auto">
        <h2 className="font-serif text-[1.9rem] font-medium leading-[1.1] text-[#f6f1e8] md:text-[2.4rem]">
          Your private<br className="hidden md:block" /> office.
        </h2>
        <p className="mt-3 max-w-sm text-[0.9rem] leading-relaxed text-[#b3aa9e] md:text-[0.95rem]">
          Your brief, shortlist, deal room and advisor — in one place, and only ever on your side.
        </p>
        <ul className="mt-6 hidden space-y-2.5 md:block">
          {TICKS.map((t) => (
            <li key={t} className="flex items-center gap-2.5 text-[0.82rem] text-[#d8cfbf]">
              <svg className="h-[15px] w-[15px] shrink-0 text-[#c9a96e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <div className="flex min-h-svh w-full flex-col bg-[#F5F0E8] text-[#1a1a1a] md:flex-row">
      {/* Brand panel */}
      <div
        className="flex flex-col px-6 py-8 md:w-[40%] md:justify-between md:px-10 md:py-12 lg:px-14"
        style={{ background: "radial-gradient(120% 120% at 20% 15%, #241d12, #14110d 62%)" }}
      >
        {brand}
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-10 md:px-12">
        <div className="w-full max-w-[400px]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[#9a7a2e]">The Private Office</p>

          {step === "contact" ? (
            <form onSubmit={handleMobileSubmit}>
              <h1 className="mt-2.5 font-serif text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.01em] md:text-[2rem]">
                Sign in
              </h1>
              <p className="mt-2 text-[0.9rem] leading-snug text-[#1a1a1a]/55">
                {isIndia
                  ? "Enter your mobile number to receive a 4-digit SMS code."
                  : "International Visitors: Sign in securely with Google."}
              </p>

              <label className="mt-6 block">
                <span className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/45">Mobile number</span>
                <div className="mt-2 flex gap-2">
                  <select
                    value={dial}
                    onChange={(e) => setDial(e.target.value)}
                    aria-label="Country code"
                    className="rounded-md border border-[#1a1a1a]/[0.16] bg-white px-3 py-3 text-[0.95rem] text-[#1a1a1a] outline-none transition-colors focus:border-[#c9a96e]"
                  >
                    {DIAL.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.flag} {d.code} ({d.name})
                      </option>
                    ))}
                  </select>
                  <input
                    value={num}
                    onChange={(e) => setNum(e.target.value)}
                    inputMode="numeric"
                    placeholder="98xxxxxx21"
                    autoComplete="tel-national"
                    className={`flex-1 ${FIELD}`}
                  />
                </div>
              </label>

              {err && <p className="mt-3 text-[0.8rem] text-[#b3402a]">{err}</p>}

              {isIndia ? (
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3 text-[0.9rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55] disabled:opacity-60"
                >
                  {busy ? "Sending code\u2026" : "Send code \u2192"}
                </button>
              ) : (
                <div className="mt-6">
                  <div className="mb-3 rounded-md bg-[#c9a96e]/15 border border-[#c9a96e]/30 p-3 text-[0.8rem] leading-relaxed text-[#7a5f1e]">
                    ✨ <strong>International Visitors</strong>: Google SSO provides instant, verified access without SMS delays.
                  </div>
                </div>
              )}

              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1a1a1a]/10"></div></div>
                <span className="relative bg-[#F5F0E8] px-3 text-[0.72rem] font-medium uppercase tracking-wider text-[#1a1a1a]/40">or</span>
              </div>

              {/* Google SSO Button */}
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setErr("");
                  const r = await signInWithGoogle();
                  if (!r.ok) { setBusy(false); setErr(r.error); }
                }}
                className={`flex w-full items-center justify-center gap-3 rounded-md border ${
                  !isIndia
                    ? "border-[#1e6b45] bg-[#1e6b45] text-white hover:bg-[#238c55]"
                    : "border-[#1a1a1a]/20 bg-white text-[#1a1a1a] hover:bg-white/80"
                } px-4 py-3 text-[0.9rem] font-medium shadow-sm transition-all disabled:opacity-60`}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.25 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.42l4-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Continue with Google
              </button>

              <p className="mt-4 text-[0.72rem] leading-relaxed text-[#1a1a1a]/40">
                By continuing you agree to our{" "}
                <a href={`${basePath}/terms`} className="underline decoration-[#1a1a1a]/25 underline-offset-2 hover:text-[#1a1a1a]/70">Terms</a>{" "}and{" "}
                <a href={`${basePath}/privacy`} className="underline decoration-[#1a1a1a]/25 underline-offset-2 hover:text-[#1a1a1a]/70">Privacy Policy</a>.
              </p>

              <p className="mt-6 border-t border-[#1a1a1a]/10 pt-4 text-[0.8rem] text-[#1a1a1a]/50">
                New to Truth Estate? <button type="button" onClick={() => openOnboarding()} className="font-medium text-[#1e6b45] hover:underline">Start your brief &rarr;</button>
              </p>
            </form>
          ) : (
            <form onSubmit={verify}>
              <h1 className="mt-2.5 font-serif text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.01em] md:text-[2rem]">
                {isReturning ? "Welcome back" : "Enter the code"}
              </h1>
              <p className="mt-2 text-[0.85rem] text-[#1a1a1a]/55">
                Sent to <span className="font-medium text-[#1a1a1a]">{sentTo}</span> via SMS{" · "}
                <button
                  type="button"
                  onClick={() => { setStep("contact"); setOtp(Array(OTP_LEN).fill("")); setErr(""); }}
                  className="font-medium text-[#9a7a2e] hover:underline"
                >
                  Change
                </button>
              </p>

              <div className="mt-5">
                <OtpDigits value={otp} onChange={setOtp} len={OTP_LEN} autoFocus onComplete={verify} />
              </div>

              {err && <p className="mt-3 text-[0.8rem] text-[#b3402a]">{err}</p>}

              <button
                type="submit"
                disabled={busy}
                className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3 text-[0.9rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55] disabled:opacity-60"
              >
                {busy ? "Verifying\u2026" : "Verify \u0026 enter \u2192"}
              </button>

              <p className="mt-3 text-[0.78rem] text-[#1a1a1a]/45">
                Didn&rsquo;t get it?{" "}
                {resendIn > 0 ? (
                  <span className="text-[#1a1a1a]/40">Resend in 0:{String(resendIn).padStart(2, "0")}</span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (busy) return;
                      const ten = isIndia ? normalisePhone(num) : normaliseIntl(dial, num);
                      if (!ten) { setErr("That number doesn't look right."); return; }
                      setErr(""); setBusy(true);
                      const r = isIndia ? await sendOtp(ten) : await sendOtpIntl(ten);
                      setBusy(false);
                      if (r.ok) setResendIn(24); else setErr(r.error);
                    }}
                    className="font-medium text-[#9a7a2e] hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
