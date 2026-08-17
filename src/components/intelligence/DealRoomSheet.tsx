"use client";

/* ════════════════════════════════════════════════════════════════
   THE DEAL ROOM — the flow, in one sheet.

   Every Deal Room CTA (band, rail, sticky) opens this. A mobile bottom
   sheet / desktop centred modal that runs the whole thing:

     details → name your target → verify (real OTP) → open.

   REAL, like /deal-room — not a mock:
     • sign-up is the same MSG91 → chat-signin path as the report unlock
       (via shortlistAuth.sendOtp/verifyOtp); an already-signed-in reader
       skips straight through.
     • on success it records a real contact_lead with intent "deal-room"
       and the target price in payload (saveLead), and fires the deployed
       deal_room_mandate_started / _submitted events, tagged source:"report"
       so the report entry is distinct from /deal-room.
     • figures are the project's OWN filed asking price and the 5–10% band
       our buyers typically settle under — no invented auction.

   Dark, to match the Deal Room brand.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { computeDeal, cr, save, potentialRange } from "./DealRoom";
import { track } from "@/lib/events";
import { saveLead, isSignedIn, loadAccount } from "@/lib/journey";
import { getSession } from "@/lib/phoneAuth";
import { sendOtp, verifyOtp, OTP_LENGTH } from "@/lib/shortlistAuth";
import OtpDigits from "@/components/auth/OtpDigits";

type Step = "details" | "target" | "verify" | "done";
const ORDER: Step[] = ["details", "target", "verify", "done"];

const DIAL = [
  { code: "+91", flag: "🇮🇳" }, { code: "+971", flag: "🇦🇪" }, { code: "+65", flag: "🇸🇬" },
  { code: "+44", flag: "🇬🇧" }, { code: "+1", flag: "🇺🇸" },
];

export default function DealRoomSheet({
  open, onClose, projectName, projectSlug, ticketCr,
}: {
  open: boolean;
  onClose: () => void;
  projectName: string;
  projectSlug?: string;
  ticketCr: number;
}) {
  const deal = computeDeal(ticketCr);
  const [step, setStep] = useState<Step>("details");
  const [targetCr, setTargetCr] = useState<number>(deal ? deal.targetHigh : 0);
  const [signedIn, setSignedIn] = useState(false);

  // auth (verify step)
  const [name, setName] = useState("");
  const [dial, setDial] = useState("+91");
  const [num, setNum] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("details");
    setErr(""); setOtpSent(false); setOtp(Array(OTP_LENGTH).fill(""));
    if (deal) setTargetCr(deal.targetHigh);
    const acct = loadAccount();
    setSignedIn(isSignedIn());
    if (acct?.name) setName(acct.name);
    track("deal_room_mandate_started", {
      ...(projectSlug ? { projectSlug } : {}), projectName,
      props: { source: "report" },
    });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const idx = ORDER.indexOf(step);
  const saveCr = deal ? Math.max(0, deal.market - targetCr) : 0;
  const isIndia = dial === "+91";
  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const otpComplete = otp.length === OTP_LENGTH && otp.every((x) => x !== "");

  const field = "w-full rounded-lg border border-white/15 bg-white/[0.06] px-3.5 py-3 text-[0.9rem] text-white placeholder-white/35 outline-none transition-colors focus:border-[#5fd39a]";
  const primary = "group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2f9a68] px-6 py-3.5 text-[0.92rem] font-semibold text-white transition-colors hover:bg-[#38b37c] disabled:opacity-50";

  /* Record the real lead + fire the submitted event, then land on done. */
  function recordAndFinish(via: "otp" | "account") {
    const acct = loadAccount();
    const s = getSession();
    saveLead({
      name: name.trim() || acct?.name || "—",
      email: s?.email ?? "",
      phone: via === "otp" ? `${dial} ${num}`.trim() : (s?.phone ?? ""),
      project: projectName || undefined,
      intent: "deal-room",
      message: `Deal Room (report) — ${projectName} · target ${cr(targetCr)} · ~${save(saveCr)} under ${deal ? cr(deal.market) : "asking"}`,
      payload: {
        kind: "deal-room-mandate",
        source: "report",
        project: projectName,
        filedPriceCr: deal?.market ?? null,
        targetPriceCr: Number(targetCr.toFixed(2)),
        savingCr: Number(saveCr.toFixed(2)),
        via,
      },
      createdAt: Date.now(),
    });
    track("deal_room_mandate_submitted", {
      ...(projectSlug ? { projectSlug } : {}), projectName,
      props: { via, source: "report", targetCr: Number(targetCr.toFixed(2)) },
    });
    setStep("done");
  }

  async function sendCode() {
    if (busy) return;
    if (!name.trim()) { setErr("Please add your name."); return; }
    if (!numValid) { setErr("Enter a valid mobile number."); return; }
    setErr(""); setBusy(true);
    const r = await sendOtp("mobile", num.replace(/\D/g, ""), dial);
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? "Couldn't send the code. Try again."); return; }
    setOtpSent(true);
  }

  async function verifySubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    if (!otpSent) { await sendCode(); return; }
    if (!otpComplete) { setErr(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    setErr(""); setBusy(true);
    const r = await verifyOtp("mobile", num.replace(/\D/g, ""), otp.join(""), name.trim(), dial);
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? "That code didn't match."); return; }
    recordAndFinish("otp");
  }

  return (
    <div className="fixed inset-0 z-[115]" role="dialog" aria-modal="true" aria-label="The Deal Room">
      <div className="absolute inset-0 animate-journey-fade bg-[#050a08]/70 backdrop-blur-xl" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex justify-center sm:inset-0 sm:items-center sm:p-6">
        <div className="animate-journey-in flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[26px] border border-white/10 bg-[#0B1F1A] text-white shadow-[0_-24px_70px_-20px_rgba(0,0,0,0.75)] sm:max-w-md sm:rounded-[24px]">
          <div aria-hidden className="h-px w-full shrink-0" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.6), transparent)" }} />

          {/* header */}
          <div className="flex items-center justify-between px-6 pt-5">
            <div className="flex items-center gap-2.5">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-[#c9a96e]">The Deal Room</span>
              {step !== "done" && (
                <span className="flex items-center gap-1">
                  {ORDER.slice(0, 3).map((s, i) => (
                    <span key={s} className={`h-1 w-4 rounded-full transition-colors ${i <= idx ? "bg-[#5fd39a]" : "bg-white/15"}`} />
                  ))}
                </span>
              )}
            </div>
            <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white/80">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
            {/* ── details ── */}
            {step === "details" && (
              <div>
                <h2 className="font-serif text-[1.7rem] font-medium leading-[1.15] text-white">Let the market compete for your price.</h2>
                {deal && (
                  <p className="mt-2.5 text-[0.9rem] font-light leading-relaxed text-white/60">
                    On {projectName}&rsquo;s <b className="font-medium text-white/80">{cr(deal.market)}</b> asking, our buyers typically settle{" "}
                    <b className="font-semibold text-[#e3c07f]">{potentialRange(deal.market)}</b> under.
                  </p>
                )}
                <ol className="mt-6 space-y-3">
                  {[
                    "Name your target price — anonymously.",
                    "Verified brokers, owners & developers send written offers in 2–4 days.",
                    "You pick the best. Walk away any time; ₹0 to start.",
                  ].map((t, i) => (
                    <li key={i} className="flex gap-3 text-[0.86rem] font-light leading-snug text-white/75">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-[0.68rem] font-bold text-[#5fd39a]">{i + 1}</span>
                      <span className="pt-0.5">{t}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[0.72rem] font-light leading-relaxed text-white/50">
                  A real advisor runs your mandate by hand — this is a concierge desk, not an automated marketplace. Neutral, on the record; we earn a share only of what we save you.
                </p>
              </div>
            )}

            {/* ── target ── */}
            {step === "target" && deal && (
              <div>
                <h2 className="font-serif text-[1.6rem] font-medium leading-[1.15] text-white">What&rsquo;s your target?</h2>
                <p className="mt-2 text-[0.86rem] font-light text-white/55">Set the price you&rsquo;d sign at for {projectName}. Sellers compete to meet it.</p>
                <div className="mt-7 text-center">
                  <p className="font-serif text-[3rem] font-semibold leading-none text-white">{cr(targetCr)}</p>
                  <p className="mt-2 text-[0.82rem] font-medium text-[#5fd39a]">{saveCr > 0 ? `${save(saveCr)} under the ${cr(deal.market)} asking` : "at the current asking price"}</p>
                </div>
                <input
                  type="range" min={deal.market * 0.85} max={deal.market} step={0.01} value={targetCr}
                  onChange={(e) => setTargetCr(parseFloat(e.target.value))}
                  className="mt-6 w-full accent-[#2f9a68]" aria-label="Target price"
                />
                <div className="mt-1 flex justify-between text-[0.62rem] font-mono text-white/35">
                  <span>{cr(deal.market * 0.85)}</span><span>{cr(deal.market)}</span>
                </div>
                <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[0.76rem] font-light leading-relaxed text-white/55">
                  Aim where you&rsquo;d truly sign — the desk advises what&rsquo;s realistic once offers land. Our buyers settle 5–10% under, on average.
                </p>
              </div>
            )}

            {/* ── verify ── */}
            {step === "verify" && (
              signedIn ? (
                <div>
                  <h2 className="font-serif text-[1.6rem] font-medium leading-[1.15] text-white">Open your Deal Room.</h2>
                  <p className="mt-2 text-[0.86rem] font-light text-white/55">You&rsquo;re verified{name.trim() ? ` as ${name.trim()}` : ""}. Sellers only compete for verified buyers — you stay anonymous to them.</p>
                  {deal && (
                    <div className="mt-6 flex items-baseline justify-between gap-2 rounded-xl border border-[#c9a96e]/25 bg-white/[0.04] px-4 py-3">
                      <span className="shrink-0 whitespace-nowrap text-[0.72rem] font-light text-white/55">Your target</span>
                      <span className="whitespace-nowrap text-right font-mono text-[0.9rem] font-semibold text-white">{cr(targetCr)} <span className="font-sans text-[0.7rem] font-medium text-[#5fd39a]">· save {save(saveCr)}</span></span>
                    </div>
                  )}
                  <p className="mt-4 text-[0.68rem] font-light leading-relaxed text-white/40">On the record · we earn a share only of what we save you. No spam — one text when the first offer lands.</p>
                </div>
              ) : (
                <form onSubmit={verifySubmit}>
                  <h2 className="font-serif text-[1.6rem] font-medium leading-[1.15] text-white">Verify it&rsquo;s really you.</h2>
                  <p className="mt-2 text-[0.86rem] font-light text-white/55">Sellers only compete for verified buyers — it&rsquo;s why offers come in writing. No payment now; you stay anonymous.</p>
                  <div className="mt-6 space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field} />
                    <div className="flex gap-2.5">
                      <div className="w-[104px] shrink-0">
                        <select value={dial} onChange={(e) => setDial(e.target.value)} disabled={otpSent} className={`${field} appearance-none`}>
                          {DIAL.map((x) => <option key={x.code} value={x.code} className="bg-[#0B1F1A]">{x.flag} {x.code}</option>)}
                        </select>
                      </div>
                      <input value={num} onChange={(e) => setNum(e.target.value.replace(/[^\d\s]/g, ""))} disabled={otpSent} type="tel" inputMode="tel" placeholder="Phone / WhatsApp" className={`${field} min-w-0 flex-1`} />
                    </div>
                    {otpSent && (
                      <div>
                        <p className="mb-2.5 text-[0.78rem] text-white/55">Enter the {OTP_LENGTH}-digit code sent to {dial} {num}{" · "}
                          <button type="button" onClick={() => { setOtpSent(false); setOtp(Array(OTP_LENGTH).fill("")); setErr(""); }} className="text-[#5fd39a] hover:underline">change</button>
                        </p>
                        <OtpDigits value={otp} onChange={setOtp} len={OTP_LENGTH} autoFocus onComplete={verifySubmit}
                          boxClass="h-13 w-full rounded-lg border border-white/15 bg-white/[0.06] py-3 text-center font-serif text-[1.2rem] text-white outline-none focus:border-[#5fd39a]" />
                      </div>
                    )}
                  </div>
                  {deal && (
                    <div className="mt-5 flex items-baseline justify-between gap-2 rounded-xl border border-[#c9a96e]/25 bg-white/[0.04] px-4 py-3">
                      <span className="shrink-0 whitespace-nowrap text-[0.72rem] font-light text-white/55">Your target</span>
                      <span className="whitespace-nowrap text-right font-mono text-[0.9rem] font-semibold text-white">{cr(targetCr)} <span className="font-sans text-[0.7rem] font-medium text-[#5fd39a]">· save {save(saveCr)}</span></span>
                    </div>
                  )}
                  {err && <p className="mt-3 text-[0.82rem] text-[#e6a189]">{err}</p>}
                  <p className="mt-4 text-[0.68rem] font-light leading-relaxed text-white/40">Neutral · on the record · we earn a share only of what we save you. No spam — one text when the first offer lands.</p>
                </form>
              )
            )}

            {/* ── done ── */}
            {step === "done" && (
              <div className="py-3 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#2f9a68]/20 text-[#5fd39a]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <h2 className="mt-5 font-serif text-[1.7rem] font-medium leading-[1.15] text-white">Your Deal Room is open.</h2>
                <p className="mt-3 text-[0.9rem] font-light leading-relaxed text-white/60">
                  An advisor calls you <b className="font-medium text-white/85">within 24 hours</b> to confirm your mandate for {projectName} at a target of <b className="font-medium text-white/85">{cr(targetCr)}</b>. Then we float it to verified sellers — written offers land in <b className="font-medium text-white/85">2–4 days</b>, and we text you the moment the first arrives.
                </p>
                <p className="mx-auto mt-5 max-w-sm border-l-2 border-[#c9a96e]/25 pl-4 text-left text-[0.72rem] font-light leading-relaxed text-white/45">
                  Nothing to join. When you&rsquo;re ready to meet a seller, a fully refundable ₹11,000 holds your seat — back in 60 days if nothing closes. After that we earn only a share of what we actually save you versus the market — never a rupee from the sellers.
                </p>
              </div>
            )}
          </div>

          {/* footer CTA */}
          <div className="shrink-0 border-t border-white/10 px-6 py-4">
            {step === "details" && <button onClick={() => setStep("target")} className={primary} disabled={!deal}>Name your target <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></button>}
            {step === "target" && (
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("details")} className="shrink-0 rounded-lg border border-white/15 px-4 py-3.5 text-[0.86rem] font-medium text-white/70 transition-colors hover:bg-white/5">Back</button>
                <button onClick={() => setStep("verify")} className={primary}>Continue <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></button>
              </div>
            )}
            {step === "verify" && (
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("target")} className="shrink-0 rounded-lg border border-white/15 px-4 py-3.5 text-[0.86rem] font-medium text-white/70 transition-colors hover:bg-white/5">Back</button>
                {signedIn
                  ? <button onClick={() => recordAndFinish("account")} className={primary}>Open my Deal Room <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></button>
                  : <button onClick={() => verifySubmit()} disabled={busy || !name.trim() || !numValid} className={primary}>{busy ? (otpSent ? "Verifying…" : "Sending…") : otpSent ? "Verify & open" : "Send code"} <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></button>}
              </div>
            )}
            {step === "done" && <button onClick={onClose} className={primary}>Done</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
