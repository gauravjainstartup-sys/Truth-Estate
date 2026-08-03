"use client";

/* ────────────────────────────────────────────────────────────────────────
   Sign-in — the gate to the Private Office (also the registration entry).

   A logged-out visitor (including anyone who has just hard-refreshed, which
   wipes the simulated session) lands here instead of the office. Verifying
   sets membership (setMember) and reveals the office.

   Mobile-only auth, India-only for now: MSG91 sends the code by SMS
   against DLT-registered templates, which cover Indian numbers only.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import Logo from "../Logo";
import { useJourney } from "../journey/JourneyProvider";
import OtpDigits from "../auth/OtpDigits";
import { saveLead } from "@/lib/journey";
import { normalisePhone, normaliseIntl, prettyPhone, sendOtp, sendOtpIntl, verifyOtp, OTP_LENGTH } from "@/lib/phoneAuth";
import { basePath } from "@/lib/site";


const DIAL = [
  { code: "+91", flag: "🇮🇳" }, { code: "+971", flag: "🇦🇪" }, { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" }, { code: "+65", flag: "🇸🇬" }, { code: "+61", flag: "🇦🇺" },
];
const TICKS = [
  "Zero brokerage · fixed fee",
  "Independent, on-record advice",
  "Your negotiation, tracked end-to-end",
];
const OTP_LEN = OTP_LENGTH;

const FIELD =
  "w-full rounded-md border border-[#1a1a1a]/[0.16] bg-white px-4 py-3 text-[0.95rem] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/35 focus:border-[#c9a96e]";

export default function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const { open: openOnboarding } = useJourney(); // the brief journey doubles as onboarding
  const [step, setStep] = useState<"contact" | "otp">("contact");
  const [name, setName] = useState("");
  const [dial, setDial] = useState("+91");
  const [num, setNum] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [err, setErr] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);

  const isIndia = dial === "+91";
  const channel = isIndia ? "SMS" : "WhatsApp";
  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const otpComplete = otp.every((d) => d !== "");
  /* Show the number we ACTUALLY send to, not the raw keystrokes. Typing
     the STD 0 out of habit rendered "+91 09958777313" — the SMS went to
     the right handset, but this line is precisely where someone checks
     their number, so it has to match what was dialled. */
  const normalised = isIndia ? normalisePhone(num) : null;
  const sentTo = normalised ? `${dial} ${prettyPhone(normalised)}` : `${dial} ${num.trim()}`;

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  async function sendCode() {
    if (busy) return;
    if (!name.trim()) { setErr("Please enter your name."); return; }
    if (!numValid) { setErr("Enter a valid mobile number."); return; }
    /* MSG91's DLT templates reach Indian handsets only. An international
       number therefore takes the WhatsApp path, which is dummied until
       those templates are live — see lib/phoneAuth. */
    const ten = isIndia ? normalisePhone(num) : normaliseIntl(dial, num);
    if (!ten) { setErr("That number doesn't look right — mind checking it?"); return; }

    setErr(""); setBusy(true);
    const r = isIndia ? await sendOtp(ten) : await sendOtpIntl(ten);
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    setStep("otp"); setResendIn(24);
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    if (!otpComplete) { setErr(`Enter the ${OTP_LEN}-digit code.`); return; }
    const ten = isIndia ? normalisePhone(num) : normaliseIntl(dial, num);
    if (!ten) { setErr("That number doesn't look right — go back and check it."); return; }

    setErr(""); setBusy(true);
    /* This screen collects the name before the number, so it travels with
       the verification and the profile lands complete in one round trip.
       verifyOtp signs in only after the server has confirmed the code —
       it does not simply set a flag, which is what this screen used to do. */
    const r = await verifyOtp(ten, otp.join(""), name.trim(), dial);
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }

    saveLead({ name: name.trim(), email: "", phone: `${dial} ${num}`.trim(), intent: "buyer-office", createdAt: Date.now() });
    onSignedIn();          // reveal the office (dashboard) behind…
    openOnboarding();      // …the onboarding brief. For now everyone onboards
                           // after sign-in; closing it lands in the dashboard.
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

              <button type="submit" disabled={busy} className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3 text-[0.9rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55] disabled:opacity-60">
                {busy ? "Sending\u2026" : "Send code \u2192"}
              </button>
              <p className="mt-3 text-[0.75rem] leading-relaxed text-[#1a1a1a]/40">
                We&rsquo;ll send a {OTP_LEN}-digit code {isIndia ? "by SMS" : "on WhatsApp"}{" "}to confirm it&rsquo;s you.
              </p>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-[#1a1a1a]/40">
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
              <h1 className="mt-2.5 font-serif text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.01em] md:text-[2rem]">Enter the code</h1>
              <p className="mt-2 text-[0.85rem] text-[#1a1a1a]/55">
                Sent to <span className="font-medium text-[#1a1a1a]">{sentTo}</span> via {channel}{" · "}
                <button type="button" onClick={() => { setStep("contact"); setOtp(Array(OTP_LEN).fill("")); setErr(""); }} className="font-medium text-[#9a7a2e] hover:underline">Change</button>
              </p>

              <div className="mt-5">
                <OtpDigits value={otp} onChange={setOtp} len={OTP_LEN} autoFocus onComplete={verify} />
              </div>

              {err && <p className="mt-3 text-[0.8rem] text-[#b3402a]">{err}</p>}

              <button type="submit" disabled={busy} className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3 text-[0.9rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55] disabled:opacity-60">
                {busy ? "Verifying\u2026" : "Verify \u0026 enter \u2192"}
              </button>
              <p className="mt-3 text-[0.78rem] text-[#1a1a1a]/45">
                Didn&rsquo;t get it?{" "}
                {resendIn > 0
                  ? <span className="text-[#1a1a1a]/40">Resend in 0:{String(resendIn).padStart(2, "0")}</span>
                  : <button
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
                    >Resend code</button>}
              </p>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
