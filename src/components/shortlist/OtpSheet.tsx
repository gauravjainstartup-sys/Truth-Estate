"use client";

import { useEffect, useRef, useState } from "react";
import { sendOtp, verifyOtp, type Verified } from "@/lib/shortlistAuth";
import OtpDigits from "../auth/OtpDigits";

/* Bottom-sheet OTP for the #1-match unlock. Mobile-only verification — the
   SAME flow as the office Sign-in: a 4-digit code by SMS (India) or WhatsApp
   (international), entered in the shared <OtpDigits> boxes. Name/email are
   captured (optional) at the code step. Transport is the dummy in
   shortlistAuth (MSG91 seam); this component only drives the flow. */

const OTP_LEN = 4;

const CCS = [
  { cc: "+91", flag: "🇮🇳", name: "India" },
  { cc: "+971", flag: "🇦🇪", name: "UAE" },
  { cc: "+1", flag: "🇺🇸", name: "USA / Canada" },
  { cc: "+44", flag: "🇬🇧", name: "UK" },
  { cc: "+65", flag: "🇸🇬", name: "Singapore" },
  { cc: "+61", flag: "🇦🇺", name: "Australia" },
];

export default function OtpSheet({
  open,
  onClose,
  onVerified,
}: {
  open: boolean;
  onClose: () => void;
  onVerified: (v: Verified) => void;
}) {
  const [cc, setCc] = useState("+91");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"contact" | "code">("contact");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [name, setName] = useState("");
  const [altEmail, setAltEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isIndia = cc === "+91";
  const channelLabel = isIndia ? "SMS" : "WhatsApp";

  // reset each time the sheet opens
  useEffect(() => {
    if (open) {
      setStep("contact"); setOtp(Array(OTP_LEN).fill("")); setErr(null); setBusy(false);
    }
  }, [open]);

  // resend countdown
  useEffect(() => {
    if (step === "code") {
      setSecs(30);
      timer.current = setInterval(() => setSecs((s) => (s <= 1 ? (clearInterval(timer.current!), 0) : s - 1)), 1000);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [step]);

  // lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const contact = phone.replace(/\s/g, "");
  const contactValid = /^\d{7,12}$/.test(contact);
  const code = otp.join("");
  const otpComplete = otp.every((d) => d !== "");

  async function requestCode() {
    if (!contactValid || busy) return;
    setBusy(true); setErr(null);
    const r = await sendOtp("mobile", contact);
    setBusy(false);
    if (r.ok) setStep("code");
    else setErr(r.error ?? "Couldn't send the code. Try again.");
  }

  async function confirm() {
    if (busy || !otpComplete) return;
    setBusy(true); setErr(null);
    const r = await verifyOtp("mobile", contact, code);
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? "That code didn't match."); return; }
    onVerified({
      channel: "mobile",
      contact,
      cc,
      name: name.trim() || undefined,
      email: altEmail.trim() || undefined,
      at: Date.now(),
    });
  }

  return (
    <div className={`fixed inset-0 z-[130] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      {/* scrim */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[#0b1f1a]/55 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      {/* sheet */}
      <div
        role="dialog"
        aria-label="Verify to unlock your #1 match"
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-[460px] rounded-t-[24px] bg-[#F5F0E8] px-6 pb-8 pt-3 shadow-[0_-20px_50px_-20px_rgba(11,31,26,0.5)] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[#1a1a1a]/15" />

        <h2 className="font-serif text-[1.5rem] font-medium leading-tight">Unlock your #1 match</h2>
        <p className="mt-1.5 text-[0.82rem] font-light leading-relaxed text-[#1a1a1a]/55">
          Verify once — your shortlist stays saved, and your top match is revealed instantly.
        </p>

        {step === "contact" ? (
          <>
            <div className="mt-5 flex gap-2">
              <div className="relative">
                <select
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="h-full appearance-none rounded-xl border border-[#1a1a1a]/12 bg-[#FBF8F2] pl-3 pr-7 text-[0.9rem] font-semibold outline-none focus:border-[#1e6b45]"
                  aria-label="Country code"
                >
                  {CCS.map((c) => <option key={c.cc} value={c.cc}>{c.flag} {c.cc}</option>)}
                </select>
                <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.6rem] text-[#1a1a1a]/40">▾</span>
              </div>
              <input
                inputMode="numeric" autoFocus value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && requestCode()}
                placeholder="98765 43210"
                className="min-w-0 flex-1 rounded-xl border border-[#1a1a1a]/12 bg-[#FBF8F2] px-4 py-3.5 text-[1rem] tracking-[0.04em] outline-none focus:border-[#1e6b45]"
              />
            </div>

            <button
              onClick={requestCode}
              disabled={!contactValid || busy}
              className="mt-3.5 w-full rounded-xl bg-[#1e6b45] py-4 text-[0.9rem] font-semibold text-white transition-colors hover:bg-[#238c55] disabled:opacity-40"
            >
              {busy ? "Sending…" : "Send code →"}
            </button>
            {err && <p className="mt-2.5 text-center text-[0.72rem] text-[#9a4130]">{err}</p>}
            <p className="mt-3 text-center font-mono text-[0.62rem] leading-relaxed tracking-[0.02em] text-[#1a1a1a]/40">
              We&rsquo;ll send a {OTP_LEN}-digit code by {channelLabel} · never shared with a developer.
            </p>
          </>
        ) : (
          <>
            <p className="mt-5 text-[0.8rem] font-light text-[#1a1a1a]/55">
              Sent to <b className="font-medium text-[#1a1a1a]">{cc} {phone}</b> via {channelLabel}{" "}
              <button onClick={() => { setStep("contact"); setOtp(Array(OTP_LEN).fill("")); setErr(null); }} className="text-[#9a7a2e] underline underline-offset-2">change</button>
            </p>

            <div className="mt-4">
              <OtpDigits value={otp} onChange={setOtp} len={OTP_LEN} autoFocus onComplete={confirm} />
            </div>

            <div className="mt-4 flex gap-2.5">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)"
                className="min-w-0 flex-1 rounded-lg border border-[#1a1a1a]/10 bg-[#FBF8F2] px-3 py-2.5 text-[0.82rem] outline-none focus:border-[#1e6b45]" />
              <input value={altEmail} onChange={(e) => setAltEmail(e.target.value)} placeholder="Email (optional)"
                className="min-w-0 flex-1 rounded-lg border border-[#1a1a1a]/10 bg-[#FBF8F2] px-3 py-2.5 text-[0.82rem] outline-none focus:border-[#1e6b45]" />
            </div>

            <button
              onClick={confirm} disabled={busy || !otpComplete}
              className="mt-4 w-full rounded-xl bg-[#1e6b45] py-4 text-[0.9rem] font-semibold text-white transition-colors hover:bg-[#238c55] disabled:opacity-40"
            >
              {busy ? "Verifying…" : "Verify & unlock →"}
            </button>
            {err && <p className="mt-2.5 text-center text-[0.72rem] text-[#9a4130]">{err}</p>}
            <p className="mt-3 text-center font-mono text-[0.64rem] tracking-[0.04em] text-[#1a1a1a]/40">
              {secs > 0 ? `Resend code in 0:${String(secs).padStart(2, "0")}` : <button onClick={requestCode} className="text-[#9a7a2e]">Resend code</button>}
            </p>
            <p className="mt-1.5 text-center font-mono text-[0.58rem] tracking-[0.06em] text-[#9a7a2e]">Demo — any {OTP_LEN} digits work · MSG91 wires in later</p>
          </>
        )}
      </div>
    </div>
  );
}
