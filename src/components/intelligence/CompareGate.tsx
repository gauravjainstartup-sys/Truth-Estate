"use client";

/* ── CompareGate — the free-unlock lead gate on project↔project compares ──────
   The compare page is otherwise fully open (and its data was always public), so
   this is a CONVERSION device, not DRM: the decisive rows (ROI, pillars,
   watch-outs) dissolve gracefully behind a free phone/Google sign-in that
   captures the lead. One unlock reveals every gated block at once — the reveal
   is driven purely by AUTH_EVENT, so nothing here needs a success callback.
   Reused nowhere else; developer/market compares never mount it. */

import { useEffect, useRef, useState } from "react";
import { isSignedIn, AUTH_EVENT, setPendingLead } from "@/lib/journey";
import { normalisePhone, prettyPhone, sendOtp, verifyOtp, signInWithGoogle, OTP_LENGTH } from "@/lib/phoneAuth";
import { track } from "@/lib/events";

const GRID = "grid grid-cols-[0.78fr_1fr_1fr] items-start gap-3 md:gap-5";
const UNLOCK_ID = "compare-unlock";

/* True once the reader is signed in; re-checks on every auth change so the
   whole page reveals the instant OTP verify (or the Google round-trip) lands. */
export function useUnlocked(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(isSignedIn());
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);
  return on;
}

/* A single locked row — the label stays (so the reader knows WHAT they're
   missing), the two values become a soft brushed bar. Matches Row's grid. */
export function LockRow({ label }: { label: string }) {
  const bar = (
    <div className="min-w-0 py-1">
      <div className="h-[15px] w-[52%] rounded bg-gradient-to-r from-[#1a1a1a]/[0.05] via-[#1a1a1a]/[0.12] to-[#1a1a1a]/[0.05]" />
    </div>
  );
  return (
    <div className={`${GRID} border-t border-[#1a1a1a]/8 py-4`}>
      <p className="text-[0.66rem] font-medium uppercase tracking-[0.1em] text-[#1a1a1a]/40 md:text-[0.7rem]">{label}</p>
      {bar}
      {bar}
    </div>
  );
}

/* The gate wrapper for row-based sections. Signed in → tease + full, plainly.
   Locked → the tease row stays crisp, the locked rows dissolve beneath a mask,
   and the invitation rises into the fade. */
export function Gate({
  open, tease, full, locked, invite,
}: {
  open: boolean;
  tease: React.ReactNode;
  full: React.ReactNode;
  locked: React.ReactNode;
  invite: React.ReactNode;
}) {
  if (open) return <>{tease}{full}</>;
  return (
    <>
      {tease}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none select-none [-webkit-mask-image:linear-gradient(180deg,#000_0,#000_28%,transparent_92%)] [mask-image:linear-gradient(180deg,#000_0,#000_28%,transparent_92%)]"
        >
          {locked}
        </div>
        <div className="relative z-10 -mt-16 flex justify-center px-2">{invite}</div>
      </div>
    </>
  );
}

const GoogleG = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M23.7 12.3c0-.7-.1-1.4-.2-2.1H12v4.5h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3h3.9c2.3-2.1 3.6-5.2 3.6-9.1z"/>
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.8-2.1-6.7-4.9H1.3v3.1C3.3 21.3 7.3 24 12 24z"/>
    <path fill="#FBBC05" d="M5.3 14.3c-.3-.7-.4-1.5-.4-2.3s.1-1.5.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z"/>
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z"/>
  </svg>
);

/* The primary invitation — an elegant frosted card with an inline phone→OTP
   sign-in (the same free flow the TruthGuide chat uses) plus Google. On verify,
   phoneAuth fires AUTH_EVENT and the whole page reveals; this card unmounts. */
export function CompareUnlock() {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState(""); // e164 once sent
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { track("sign_up_form_opened", { props: { source: "compare-gate" } }); }, []);

  async function toCode(raw: string) {
    const e164 = normalisePhone(raw);
    if (!e164) { setErr("Enter a valid mobile number — 10 digits, or with country code."); return; }
    setErr(""); setBusy(true);
    // Declare the intent BEFORE auth so the sign-in records a compare-unlock
    // contact_lead (not just a user_profile). Survives the Google redirect too.
    setPendingLead({ intent: "compare-unlock" });
    const r = await sendOtp(e164);
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? "Couldn't send the code — try again."); return; }
    setPhone(e164); setStep("code"); setVal("");
    setTimeout(() => ref.current?.focus(), 60);
  }

  async function verify(code: string) {
    setErr(""); setBusy(true);
    const r = await verifyOtp(phone, code);
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? "That code didn't match — try again."); setVal(""); return; }
    /* success → setSignedIn() inside verifyOtp → AUTH_EVENT → page reveals.
       The funnel's signed_in / lead_captured events fire inside the auth flow. */
  }

  async function google() {
    if (busy) return;
    setBusy(true);
    setPendingLead({ intent: "compare-unlock" }); // consumed in /auth/callback after the redirect
    const r = await signInWithGoogle();
    if (!r.ok) { setBusy(false); setErr(r.error ?? "Google sign-in didn't start — try the number."); }
  }

  return (
    <div
      id={UNLOCK_ID}
      className="w-full max-w-[452px] rounded-[1.6rem] border border-[#9a7a2e]/40 bg-[#fffdf9]/85 p-7 text-center shadow-[0_30px_80px_-34px_rgba(26,26,26,0.42)] backdrop-blur-md"
    >
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#9a7a2e]/40 bg-[#9a7a2e]/[0.05] text-[#9a7a2e]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>
      </span>
      <p className="mt-4 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9a7a2e]">Free · no card</p>
      <h3 className="mt-2.5 font-serif text-[1.4rem] font-medium leading-tight text-[#1a1a1a]">
        {step === "phone" ? "See which one is the better buy" : "Enter the code we just sent"}
      </h3>
      <p className="mx-auto mt-2.5 max-w-[34ch] text-[0.84rem] font-light leading-relaxed text-[#1a1a1a]/60">
        {step === "phone"
          ? "Unlock the ROI head-to-head, all five pillars, and every watch-out — with a number."
          : `Sent to ${prettyPhone(phone)}.`}
      </p>

      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); if (busy) return; step === "phone" ? toCode(val) : verify(val); }}
      >
        <input
          ref={ref}
          value={val}
          onChange={(e) => {
            const v = e.target.value; setVal(v);
            if (step === "code" && !busy && v.replace(/\D/g, "").length >= OTP_LENGTH) verify(v);
          }}
          inputMode="numeric"
          autoComplete={step === "code" ? "one-time-code" : "tel"}
          placeholder={step === "phone" ? "Your mobile number" : `${OTP_LENGTH}-digit code`}
          aria-label={step === "phone" ? "Mobile number" : "Verification code"}
          disabled={busy}
          className="min-w-0 flex-1 rounded-xl border border-[#1a1a1a]/15 bg-white/90 px-4 py-3 text-[0.9rem] text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/30 focus:border-[#1e6b45] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !val.trim()}
          className="shrink-0 rounded-xl bg-[#1e6b45] px-5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-[#238c55] disabled:opacity-40"
        >
          {busy ? "…" : step === "phone" ? "Unlock →" : "Verify"}
        </button>
      </form>

      {err && <p className="mt-2.5 text-[0.74rem] font-medium text-[#a8452f]">{err}</p>}

      {step === "phone" ? (
        <>
          <div className="mx-auto mt-3.5 flex max-w-[300px] items-center gap-3 text-[0.68rem] text-[#1a1a1a]/30"><span className="h-px flex-1 bg-[#1a1a1a]/12" />or<span className="h-px flex-1 bg-[#1a1a1a]/12" /></div>
          <button onClick={google} disabled={busy} type="button" className="mt-3.5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#1a1a1a]/15 bg-white/90 py-3 text-[0.85rem] font-semibold text-[#1a1a1a] transition-colors hover:bg-white disabled:opacity-40">
            <GoogleG /> Continue with Google
          </button>
          <p className="mt-3.5 text-[0.68rem] font-light leading-snug text-[#1a1a1a]/35"><b className="font-semibold text-[#1a1a1a]/45">Buyer-side only</b> — no broker calls, no spam. The project reads stay open to you.</p>
        </>
      ) : (
        <button type="button" onClick={() => { setStep("phone"); setVal(""); setErr(""); }} className="mt-3 text-[0.72rem] font-medium text-[#1a1a1a]/45 underline underline-offset-2 hover:text-[#1a1a1a]/70">
          Wrong number?
        </button>
      )}
    </div>
  );
}

/* Slim invitation for the secondary gated blocks (pillars, watch-outs). One
   unlock already opens them, so tapping just brings the reader to the card. */
export function LockPill({ label }: { label: string }) {
  const toCard = () => {
    if (typeof document === "undefined") return;
    document.getElementById(UNLOCK_ID)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <button
      type="button"
      onClick={toCard}
      className="inline-flex items-center gap-2.5 rounded-full border border-[#9a7a2e]/45 bg-[#fffdf9]/85 px-5 py-2.5 text-[0.8rem] text-[#1a1a1a] shadow-[0_18px_50px_-30px_rgba(26,26,26,0.4)] backdrop-blur-md transition-colors hover:border-[#9a7a2e]/70"
    >
      <span className="text-[#9a7a2e]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>
      </span>
      {label} — <span className="font-semibold text-[#1e6b45]">unlock free</span>
    </button>
  );
}

/* Faded placeholder lines standing in for the REST of a gated block once its
   real tease is shown — e.g. the remaining watch-outs after the first red flag
   on each side stays visible. Dissolves under the pill. */
export function LockLines() {
  const line = (w: string) => <div className={`h-3 ${w} rounded bg-gradient-to-r from-[#1a1a1a]/[0.05] via-[#1a1a1a]/[0.11] to-[#1a1a1a]/[0.05]`} />;
  return (
    <div className="mt-2 grid gap-5 md:grid-cols-2">
      {[0, 1].map((c) => (
        <div key={c} className="space-y-2.5 rounded-2xl border border-[#1a1a1a]/8 bg-white/40 p-6">
          {line("w-[82%]")}{line("w-[68%]")}{line("w-[74%]")}
        </div>
      ))}
    </div>
  );
}
