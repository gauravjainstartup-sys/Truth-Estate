"use client";

/* ────────────────────────────────────────────────────────────────────────
   Sign-in — the gate to the Private Office (also the registration entry).

   A logged-out visitor (including anyone who has just hard-refreshed, which
   wipes the simulated session) lands here instead of the office. Verifying
   sets membership (setMember) and reveals the office.

   Mobile-only auth: Indian numbers (+91) get an SMS code, international
   numbers a WhatsApp code — the copy reflects the channel. The OTP is a
   working dummy today (any 4 digits), with the MSG91 seam wired for real
   SMS/WhatsApp later.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import { saveLead, setMember } from "@/lib/journey";

const basePath = "/Truth-Estate";

const DIAL = [
  { code: "+91", flag: "🇮🇳" }, { code: "+971", flag: "🇦🇪" }, { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" }, { code: "+65", flag: "🇸🇬" }, { code: "+61", flag: "🇦🇺" },
];
const TICKS = [
  "Zero brokerage · fixed fee",
  "Independent, on-record advice",
  "Your negotiation, tracked end-to-end",
];
const OTP_LEN = 4;

const FIELD =
  "w-full rounded-md border border-[#1a1a1a]/[0.16] bg-white px-4 py-3 text-[0.95rem] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/35 focus:border-[#c9a96e]";

export default function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [step, setStep] = useState<"contact" | "otp">("contact");
  const [name, setName] = useState("");
  const [dial, setDial] = useState("+91");
  const [num, setNum] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [err, setErr] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isIndia = dial === "+91";
  const channel = isIndia ? "SMS" : "WhatsApp";
  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const otpComplete = otp.every((d) => d !== "");
  const sentTo = `${dial} ${num.trim()}`;

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  function sendCode() {
    if (!name.trim()) { setErr("Please enter your name."); return; }
    if (!numValid) { setErr("Enter a valid mobile number."); return; }
    setErr(""); setStep("otp"); setResendIn(24);
    requestAnimationFrame(() => otpRefs.current[0]?.focus());
  }

  const setOtpDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setOtp((o) => { const n = [...o]; n[i] = digit; return n; });
    if (digit && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
  };
  const onOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!otpComplete) { setErr(`Enter the ${OTP_LEN}-digit code.`); return; }
    saveLead({ name: name.trim(), email: "", phone: `${dial} ${num}`.trim(), intent: "buyer-office", createdAt: Date.now() });
    setMember();
    onSignedIn();
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
      {/* brand panel — a quiet dark identity beside the form (a top strip on mobile) */}
      <div
        className="flex flex-col px-6 py-8 md:w-[40%] md:justify-between md:px-10 md:py-12 lg:px-14"
        style={{ background: "radial-gradient(120% 120% at 20% 15%, #241d12, #14110d 62%)" }}
      >
        {brand}
      </div>

      {/* form */}
      <div className="flex flex-1 items-center justify-center px-6 py-10 md:px-12">
        <div className="w-full max-w-[400px]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[#9a7a2e]">The Private Office</p>

          {step === "contact" ? (
            <form onSubmit={(e) => { e.preventDefault(); sendCode(); }}>
              <h1 className="mt-2.5 font-serif text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.01em] md:text-[2rem]">Sign in</h1>
              <p className="mt-2 text-[0.9rem] leading-snug text-[#1a1a1a]/55">Enter your details to open your office.</p>

              <label className="mt-6 block">
                <span className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/45">Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rohan Mehta" autoComplete="name" className={`mt-2 ${FIELD}`} />
              </label>

              <label className="mt-4 block">
                <span className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/45">Mobile number</span>
                <div className="mt-2 flex gap-2">
                  <select value={dial} onChange={(e) => setDial(e.target.value)} aria-label="Country code"
                    className="rounded-md border border-[#1a1a1a]/[0.16] bg-white px-3 py-3 text-[0.95rem] text-[#1a1a1a] outline-none transition-colors focus:border-[#c9a96e]">
                    {DIAL.map((d) => <option key={d.code} value={d.code}>{d.flag} {d.code}</option>)}
                  </select>
                  <input value={num} onChange={(e) => setNum(e.target.value)} inputMode="numeric" placeholder="98xxxxxx21" autoComplete="tel-national" className={`flex-1 ${FIELD}`} />
                </div>
              </label>

              {err && <p className="mt-3 text-[0.8rem] text-[#b3402a]">{err}</p>}

              <button type="submit" className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3 text-[0.9rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]">
                Send code &rarr;
              </button>
              <p className="mt-3 text-[0.75rem] leading-relaxed text-[#1a1a1a]/40">
                We&rsquo;ll send a {OTP_LEN}-digit code {isIndia ? "by SMS" : "on WhatsApp"} to confirm it&rsquo;s you.
              </p>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-[#1a1a1a]/40">
                By continuing you agree to our{" "}
                <a href={`${basePath}/terms`} className="underline decoration-[#1a1a1a]/25 underline-offset-2 hover:text-[#1a1a1a]/70">Terms</a>{" "}and{" "}
                <a href={`${basePath}/privacy`} className="underline decoration-[#1a1a1a]/25 underline-offset-2 hover:text-[#1a1a1a]/70">Privacy Policy</a>.
              </p>

              <p className="mt-6 border-t border-[#1a1a1a]/10 pt-4 text-[0.8rem] text-[#1a1a1a]/50">
                New to Truth Estate? <a href={`${basePath}/`} className="font-medium text-[#1e6b45] hover:underline">Start your brief &rarr;</a>
              </p>
            </form>
          ) : (
            <form onSubmit={verify}>
              <h1 className="mt-2.5 font-serif text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.01em] md:text-[2rem]">Enter the code</h1>
              <p className="mt-2 text-[0.85rem] text-[#1a1a1a]/55">
                Sent to <span className="font-medium text-[#1a1a1a]">{sentTo}</span> via {channel}{" · "}
                <button type="button" onClick={() => { setStep("contact"); setOtp(Array(OTP_LEN).fill("")); setErr(""); }} className="font-medium text-[#9a7a2e] hover:underline">Change</button>
              </p>

              <div className="mt-5 flex gap-3">
                {otp.map((d, i) => (
                  <input key={i} ref={(el) => { otpRefs.current[i] = el; }} value={d}
                    onChange={(e) => setOtpDigit(i, e.target.value)} onKeyDown={(e) => onOtpKey(i, e)}
                    inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
                    className="h-14 w-14 rounded-lg border border-[#1a1a1a]/[0.18] bg-white text-center font-serif text-[1.5rem] text-[#1a1a1a] outline-none transition-colors focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/20" />
                ))}
              </div>

              {err && <p className="mt-3 text-[0.8rem] text-[#b3402a]">{err}</p>}

              <button type="submit" className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3 text-[0.9rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]">
                Verify &amp; enter &rarr;
              </button>
              <p className="mt-3 text-[0.78rem] text-[#1a1a1a]/45">
                Didn&rsquo;t get it?{" "}
                {resendIn > 0
                  ? <span className="text-[#1a1a1a]/40">Resend in 0:{String(resendIn).padStart(2, "0")}</span>
                  : <button type="button" onClick={() => setResendIn(24)} className="font-medium text-[#9a7a2e] hover:underline">Resend code</button>}
              </p>
              <p className="mt-4 text-[0.72rem] text-[#1a1a1a]/35">Demo: any {OTP_LEN}-digit code opens the office.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
