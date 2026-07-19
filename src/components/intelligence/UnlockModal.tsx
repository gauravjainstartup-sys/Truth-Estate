"use client";

/* ────────────────────────────────────────────────────────────────────────
   UnlockModal — the conversion surface for a paid read.

   Flow: [register — only if not signed in] → pick a package → dummy Razorpay
   checkout → grant entitlement → unmask. "First register, then pay."

   Packages (from journey.ts): read ₹999 · read+3D ₹1,499 · all-access ₹9,999.
   Payment is a front-end simulation (Razorpay integration seam); grants are
   stored client-side for the demo.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import {
  PACKAGES, packageById, grantPackage, isSignedIn, setSignedIn, saveLead,
  type PackageId,
} from "@/lib/journey";

const DIAL = [
  { code: "+91", flag: "🇮🇳" }, { code: "+971", flag: "🇦🇪" }, { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" }, { code: "+65", flag: "🇸🇬" }, { code: "+61", flag: "🇦🇺" },
];
const OTP_LEN = 4;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type Step = "register" | "plans" | "pay" | "done";

export default function UnlockModal({
  open, slug, projectName, focus3D = false, onClose, onUnlocked,
}: {
  open: boolean;
  slug: string;
  projectName: string;
  focus3D?: boolean;
  onClose: () => void;
  onUnlocked: (pkg: PackageId) => void;
}) {
  const [step, setStep] = useState<Step>("plans");
  const [sel, setSel] = useState<PackageId>(focus3D ? "read3d" : "read");
  // register state
  const [name, setName] = useState("");
  const [dial, setDial] = useState("+91");
  const [num, setNum] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [paying, setPaying] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isIndia = dial === "+91";
  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const otpComplete = otp.every((d) => d !== "");
  const pkg = packageById(sel);

  useEffect(() => {
    if (!open) return;
    setStep(isSignedIn() ? "plans" : "register");
    setSel(focus3D ? "read3d" : "read");
    setSent(false); setOtp(Array(OTP_LEN).fill("")); setErr(""); setPaying(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, focus3D]);

  if (!open) return null;

  const setOtpDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtp((o) => { const n = [...o]; n[i] = d; return n; });
    if (d && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
  };

  function registerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sent) {
      if (!name.trim()) { setErr("Please enter your name."); return; }
      if (!numValid) { setErr("Enter a valid mobile number."); return; }
      setErr(""); setSent(true);
      requestAnimationFrame(() => otpRefs.current[0]?.focus());
      return;
    }
    if (!otpComplete) { setErr(`Enter the ${OTP_LEN}-digit code.`); return; }
    saveLead({ name: name.trim(), email: "", phone: `${dial} ${num}`.trim(), intent: "buyer-office", createdAt: Date.now() });
    setSignedIn();
    setErr("");
    setStep("plans");
  }

  function pay() {
    setPaying(true);
    // simulate the Razorpay round-trip, then grant
    setTimeout(() => {
      grantPackage(sel, slug);
      setPaying(false);
      setStep("done");
      setTimeout(() => { onUnlocked(sel); onClose(); }, 1400);
    }, 900);
  }

  const FIELD = "w-full rounded-md border border-[#1a1a1a]/[0.16] bg-white px-4 py-3 text-[0.95rem] text-[#1a1a1a] outline-none transition-colors placeholder:text-[#1a1a1a]/35 focus:border-[#c9a96e]";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1a1206]/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="relative flex max-h-[92svh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl bg-[#F5F0E8] text-[#1a1a1a] shadow-[0_-20px_60px_rgba(0,0,0,0.35)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full text-[#1a1a1a]/40 transition-colors hover:bg-[#1a1a1a]/5 hover:text-[#1a1a1a]/70">✕</button>

        <div className="overflow-y-auto px-6 py-8 md:px-9">
          {step === "register" && (
            <form onSubmit={registerSubmit}>
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#9a7a2e]">Step 1 of 2 · Create your account</p>
              <h2 className="mt-2 font-serif text-[1.7rem] font-semibold leading-tight">First, a quick sign-up</h2>
              <p className="mt-2 text-[0.88rem] leading-snug text-[#1a1a1a]/55">We&rsquo;ll keep your reads and shortlist in your private office.</p>

              {!sent ? (
                <>
                  <label className="mt-5 block">
                    <span className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/45">Full name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rohan Mehta" autoComplete="name" className={`mt-2 ${FIELD}`} />
                  </label>
                  <label className="mt-4 block">
                    <span className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/45">Mobile number</span>
                    <div className="mt-2 flex gap-2">
                      <select value={dial} onChange={(e) => setDial(e.target.value)} aria-label="Country code"
                        className="rounded-md border border-[#1a1a1a]/[0.16] bg-white px-3 py-3 text-[0.95rem] text-[#1a1a1a] outline-none focus:border-[#c9a96e]">
                        {DIAL.map((d) => <option key={d.code} value={d.code}>{d.flag} {d.code}</option>)}
                      </select>
                      <input value={num} onChange={(e) => setNum(e.target.value)} inputMode="numeric" placeholder="98xxxxxx21" autoComplete="tel-national" className={`flex-1 ${FIELD}`} />
                    </div>
                  </label>
                </>
              ) : (
                <div className="mt-5">
                  <p className="text-[0.85rem] text-[#1a1a1a]/55">Code sent to <span className="font-medium text-[#1a1a1a]">{dial} {num}</span> via {isIndia ? "SMS" : "WhatsApp"} · <button type="button" onClick={() => { setSent(false); setOtp(Array(OTP_LEN).fill("")); }} className="font-medium text-[#9a7a2e] hover:underline">Change</button></p>
                  <div className="mt-4 flex gap-3">
                    {otp.map((d, i) => (
                      <input key={i} ref={(el) => { otpRefs.current[i] = el; }} value={d}
                        onChange={(e) => setOtpDigit(i, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
                        inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
                        className="h-14 min-w-0 flex-1 rounded-lg border border-[#1a1a1a]/[0.18] bg-white text-center font-serif text-[1.4rem] text-[#1a1a1a] outline-none focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/20" />
                    ))}
                  </div>
                  <p className="mt-3 text-[0.72rem] text-[#1a1a1a]/35">Demo: any {OTP_LEN}-digit code works.</p>
                </div>
              )}

              {err && <p className="mt-3 text-[0.8rem] text-[#b3402a]">{err}</p>}
              <button type="submit" className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3 text-[0.9rem] font-medium text-white transition-colors hover:bg-[#238c55]">
                {sent ? "Verify & continue →" : "Send code →"}
              </button>
              <p className="mt-3 text-[0.72rem] leading-relaxed text-[#1a1a1a]/40">By continuing you agree to our Terms &amp; Privacy Policy.</p>
            </form>
          )}

          {step === "plans" && (
            <div>
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#9a7a2e]">Unlock the full read</p>
              <h2 className="mt-2 font-serif text-[1.7rem] font-semibold leading-tight">{projectName}</h2>
              <p className="mt-2 text-[0.88rem] leading-snug text-[#1a1a1a]/55">Choose your access. One-time, no subscription.</p>

              <div className="mt-5 space-y-3">
                {PACKAGES.map((p) => {
                  const on = sel === p.id;
                  return (
                    <button key={p.id} onClick={() => setSel(p.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${on ? "border-[#1e6b45] bg-[#1e6b45]/[0.05] ring-1 ring-[#1e6b45]/30" : "border-[#1a1a1a]/12 bg-white/60 hover:border-[#1a1a1a]/25"}`}>
                      <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${on ? "border-[#1e6b45]" : "border-[#1a1a1a]/30"}`}>
                        {on && <span className="h-2 w-2 rounded-full bg-[#1e6b45]" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-medium text-[#1a1a1a]">{p.label}</span>
                          <span className="shrink-0 font-serif text-[1.15rem] font-medium text-[#1e6b45]">{inr(p.inr)}</span>
                        </span>
                        <span className="mt-1 block text-[0.78rem] leading-snug text-[#1a1a1a]/55">{p.blurb}</span>
                        {p.id === "all" && <span className="mt-1.5 inline-block rounded-full border border-[#c9a96e]/50 bg-[#c9a96e]/[0.12] px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-[#9a7a2e]">Best value</span>}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button onClick={() => setStep("pay")} className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3.5 text-[0.92rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]">
                Pay {inr(pkg.inr)} →
              </button>
              <p className="mt-3 text-center text-[0.72rem] leading-relaxed text-[#1a1a1a]/45">
                Need something else? Custom packages are shaped on your <span className="font-medium text-[#1a1a1a]/70">first free advisor call</span>.
              </p>
            </div>
          )}

          {step === "pay" && (
            <div>
              {/* dummy Razorpay checkout */}
              <div className="-mx-6 -mt-8 mb-5 flex items-center justify-between bg-[#0b2b4a] px-6 py-4 text-white md:-mx-9 md:px-9">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded bg-[#3395ff] font-bold">R</span>
                  <span className="font-semibold tracking-tight">Razorpay</span>
                </div>
                <span className="text-[0.78rem] text-white/70">Truth Estate</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[0.8rem] text-[#1a1a1a]/55">{pkg.label}</span>
                <span className="font-serif text-[1.5rem] font-semibold">{inr(pkg.inr)}</span>
              </div>
              <div className="mt-4 space-y-2">
                {["UPI — GPay / PhonePe / Paytm", "Credit / Debit card", "Netbanking"].map((m, i) => (
                  <div key={m} className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-[0.85rem] ${i === 0 ? "border-[#1e6b45]/40 bg-[#1e6b45]/[0.05]" : "border-[#1a1a1a]/12 bg-white/60"}`}>
                    <span className={`grid h-4 w-4 place-items-center rounded-full border ${i === 0 ? "border-[#1e6b45]" : "border-[#1a1a1a]/25"}`}>{i === 0 && <span className="h-2 w-2 rounded-full bg-[#1e6b45]" />}</span>
                    {m}
                  </div>
                ))}
              </div>
              <button onClick={pay} disabled={paying} className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3.5 text-[0.92rem] font-medium text-white transition-colors hover:bg-[#238c55] disabled:opacity-60">
                {paying ? "Processing…" : `Pay ${inr(pkg.inr)}`}
              </button>
              <p className="mt-3 text-center text-[0.72rem] text-[#1a1a1a]/40">🔒 Test mode — no real charge. Razorpay integration is a demo.</p>
              <button onClick={() => setStep("plans")} className="mt-2 w-full text-center text-[0.76rem] text-[#1a1a1a]/45 hover:text-[#1a1a1a]/70">← Change package</button>
            </div>
          )}

          {step === "done" && (
            <div className="py-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#1e6b45]/12 text-[#1e6b45]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <h2 className="mt-4 font-serif text-[1.6rem] font-semibold">You&rsquo;re unlocked</h2>
              <p className="mt-2 text-[0.9rem] text-[#1a1a1a]/55">Opening your full read for {projectName}…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
