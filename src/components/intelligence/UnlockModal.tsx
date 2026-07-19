"use client";

/* ────────────────────────────────────────────────────────────────────────
   UnlockModal — the conversion surface for a paid read.

   Flow: [register — only if not signed in] → pick a package (3-card value
   ladder) → dummy Razorpay checkout → grant entitlement → unmask.

   Packages (from journey.ts): read ₹999 · read+3D ₹1,499 · all-access ₹9,999.
   The plans step is a value ladder: each tier shows what's IN, what's NOT, a
   "know more" accordion, and its own CTA. Cross-tier promises (sources,
   living report, negotiation) sit in a trust strip. Owners see pay-the-
   difference upgrades and already-owned tiers drop away. Payment is a
   front-end simulation (Razorpay seam); grants are stored client-side.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import {
  PACKAGES, packageById, grantPackage, isSignedIn, setSignedIn, saveLead,
  hasReadAccess, has3DAccess, isAllAccess,
  type PackageId,
} from "@/lib/journey";

const DIAL = [
  { code: "+91", flag: "🇮🇳" }, { code: "+971", flag: "🇦🇪" }, { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" }, { code: "+65", flag: "🇸🇬" }, { code: "+61", flag: "🇦🇺" },
];
const OTP_LEN = 4;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* The value ladder. `lead` renders as the "builds on the tier below" line;
   features are ✓, limits are ✕, `more` is the know-more accordion body. */
type CardDef = { id: PackageId; scope: string; lead?: string; features: string[]; limits: string[]; more: string };
const PLAN_CARDS: CardDef[] = [
  {
    id: "read", scope: "this project",
    features: [
      "150+ signals audited — including the faint early-warning ones most brokers miss",
      "Price band · 5-year ROI model · the verdict for your budget",
      "Every material claim source-tagged — verify it yourself",
      "Ask TruthGuide anything · a free advisor call",
    ],
    limits: ["No Sun & Vastu 3D", "This project only"],
    more: "The complete forensic read: developer track record & financials, construction vs the RERA schedule, location & connectivity, legal / title / litigation, and USPs — 150+ signals, each material claim sourced so you can check it. Re-audited every month and saved to your Buyer Office for life. Buyers use the fair-price band and the red flags as leverage to negotiate with the developer.",
  },
  {
    id: "read3d", scope: "this project",
    lead: "Everything in Full Read, plus:",
    features: [
      "Sun & Vastu 3D — per-unit daylight hours, Vastu score + room-by-room reasons, cross-ventilation",
      "The best-value unit stacks, flagged",
      "Ask TruthGuide sun & Vastu, per unit",
    ],
    limits: ["This project only"],
    more: "The full read plus the interactive Sun & Vastu 3D advisor — walk every tower and unit, see exact daylight hours summer→winter, a Vastu score with room-by-room reasoning, and how air moves through each layout. If the 3D model isn't live for this project yet, we build yours free and deliver it in ~2 days.",
  },
  {
    id: "all", scope: "every project",
    features: [
      "Every read + every Sun & Vastu 3D, across all projects",
      "2 on-demand new reports & 3Ds (~2-day delivery)",
      "Priority advisor line",
    ],
    limits: [],
    more: "Everything, everywhere: every read and every Sun & Vastu 3D on the site, plus 2 on-demand project reports & 3Ds you can request anytime. Comparing 3+ projects? All-Access pays for itself.",
  },
];

type Step = "register" | "plans" | "pay" | "done";

export default function UnlockModal({
  open, slug, projectName, focus3D = false, has3DModel = true, onClose, onUnlocked,
}: {
  open: boolean;
  slug: string;
  projectName: string;
  focus3D?: boolean;
  has3DModel?: boolean;
  onClose: () => void;
  onUnlocked: (pkg: PackageId) => void;
}) {
  const [step, setStep] = useState<Step>("plans");
  const [sel, setSel] = useState<PackageId>(focus3D ? "read3d" : "read");
  const [expanded, setExpanded] = useState<PackageId | null>(null);
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

  // ── upgrade economics: credit what's already paid on THIS project ──
  const credit = has3DAccess(slug) ? packageById("read3d").inr : hasReadAccess(slug) ? packageById("read").inr : 0;
  const owns = (id: PackageId) =>
    (id === "read" && hasReadAccess(slug)) || (id === "read3d" && has3DAccess(slug)) || (id === "all" && isAllAccess());
  const amountFor = (id: PackageId) => Math.max(packageById(id).inr - credit, 0);
  const isUpgrade = (id: PackageId) => credit > 0 && !owns(id);
  const cards = PLAN_CARDS.filter((c) => !owns(c.id));

  useEffect(() => {
    if (!open) return;
    setStep(isSignedIn() ? "plans" : "register");
    setSel(focus3D ? "read3d" : "read");
    setExpanded(null);
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

  function choose(id: PackageId) { setSel(id); setStep("pay"); }

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
  const ctaLabel = (id: PackageId) =>
    id === "all" ? "Go All-Access" : id === "read3d" ? (isUpgrade("read3d") ? "Add Sun & Vastu 3D" : "Get read + 3D") : "Get the read";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1a1206]/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        className={`relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#F5F0E8] text-[#1a1a1a] shadow-[0_-20px_60px_rgba(0,0,0,0.35)] sm:rounded-2xl ${step === "plans" && cards.length > 1 ? "max-w-[560px] lg:max-w-[1000px]" : "max-w-[560px]"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-[#F5F0E8]/80 text-[#1a1a1a]/40 backdrop-blur transition-colors hover:bg-[#1a1a1a]/5 hover:text-[#1a1a1a]/70">✕</button>

        <div className="overflow-y-auto px-6 py-8 md:px-9">
          {step === "register" && (
            <form onSubmit={registerSubmit}>
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#9a7a2e]">Step 1 of 2 · Create your account</p>
              <h2 className="mt-2 font-serif text-[1.7rem] font-semibold leading-tight">First, a quick sign-up</h2>
              <p className="mt-2 text-[0.88rem] leading-snug text-[#1a1a1a]/55">We&rsquo;ll keep your reads and shortlist in your private Buyer Office.</p>

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
                  <p className="text-[0.85rem] text-[#1a1a1a]/55">Code sent to <span className="font-medium text-[#1a1a1a]">{dial} {num}</span> via {isIndia ? "SMS" : "WhatsApp"}{" · "}<button type="button" onClick={() => { setSent(false); setOtp(Array(OTP_LEN).fill("")); }} className="font-medium text-[#9a7a2e] hover:underline">Change</button></p>
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
              <p className="mt-2 text-[0.86rem] leading-snug text-[#1a1a1a]/55">
                {credit > 0 ? <>You&rsquo;ve already paid {inr(credit)} on this project — upgrades below are the difference only.</> : <>Choose your access. One-time, no subscription.</>}
              </p>

              {/* the value ladder — stacked on mobile, side-by-side on desktop
                 for at-a-glance comparison (columns match the card count) */}
              <div className={`mt-5 grid items-stretch gap-3 ${cards.length >= 3 ? "lg:grid-cols-3" : cards.length === 2 ? "lg:grid-cols-2" : ""}`}>
                {cards.map((c) => {
                  const recommended = c.id === "read3d";
                  const amount = amountFor(c.id);
                  const build3d = c.id === "read3d" && !has3DModel;
                  return (
                    <div key={c.id} className={`flex h-full flex-col rounded-2xl border bg-white/70 p-4 ${recommended ? "border-[#1e6b45] ring-1 ring-[#1e6b45]/25" : "border-[#1a1a1a]/12"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif text-[1.12rem] font-semibold leading-tight">{packageById(c.id).label}</span>
                            {recommended && <span className="rounded-full bg-[#1e6b45] px-2 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.12em] text-white">★ Recommended</span>}
                            {c.id === "all" && <span className="rounded-full border border-[#c9a96e]/50 bg-[#c9a96e]/[0.12] px-2 py-0.5 text-[0.54rem] font-bold uppercase tracking-[0.12em] text-[#9a7a2e]">Best value</span>}
                          </div>
                          <p className="mt-0.5 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/40">{c.scope}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-serif text-[1.35rem] font-semibold leading-none text-[#1e6b45]">{inr(amount)}</p>
                          {isUpgrade(c.id) && <p className="mt-1 text-[0.58rem] font-medium uppercase tracking-[0.08em] text-[#9a7a2e]">upgrade · {inr(credit)} credited</p>}
                        </div>
                      </div>

                      {c.lead && <p className="mt-3 text-[0.78rem] font-semibold text-[#1a1a1a]/70">{c.lead}</p>}
                      <ul className="mt-2 space-y-1.5">
                        {c.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-[0.8rem] leading-snug text-[#1a1a1a]/75">
                            <span aria-hidden className="mt-[3px] shrink-0 text-[#1e6b45]"><Check /></span>{f}
                          </li>
                        ))}
                        {build3d && (
                          <li className="flex items-start gap-2 text-[0.8rem] font-medium leading-snug text-[#9a7a2e]">
                            <span aria-hidden className="mt-[2px] shrink-0">✦</span>3D not live for this project yet? We build yours free — delivered in ~2 days.
                          </li>
                        )}
                        {c.limits.map((l) => (
                          <li key={l} className="flex items-start gap-2 text-[0.78rem] leading-snug text-[#1a1a1a]/40">
                            <span aria-hidden className="mt-[2px] shrink-0">✕</span>{l}
                          </li>
                        ))}
                      </ul>

                      {/* CTA pinned to the card bottom so prices/buttons line up
                         across columns; the accordion opens below it */}
                      <div className="mt-auto pt-4">
                        <button onClick={() => choose(c.id)}
                          className={`w-full rounded-lg px-4 py-3 text-[0.85rem] font-semibold transition-colors ${recommended ? "bg-[#1e6b45] text-white hover:bg-[#238c55]" : "border border-[#1e6b45]/40 text-[#1e6b45] hover:bg-[#1e6b45]/[0.06]"}`}>
                          {ctaLabel(c.id)} — {inr(amount)} →
                        </button>
                        <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                          className="mt-2 w-full text-center text-[0.74rem] font-medium text-[#1a1a1a]/45 underline decoration-[#1a1a1a]/20 underline-offset-2 transition-colors hover:text-[#1a1a1a]/75">
                          {expanded === c.id ? "Less" : "Know more"}
                        </button>
                        {expanded === c.id && (
                          <p className="mt-3 rounded-lg bg-[#1a1a1a]/[0.03] px-3.5 py-3 text-[0.76rem] leading-relaxed text-[#1a1a1a]/60">{c.more}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <p className="rounded-xl border border-[#1e6b45]/25 bg-[#1e6b45]/[0.06] px-4 py-3 text-[0.85rem] font-medium text-[#1e6b45]">You have All-Access — every read and 3D is already yours.</p>
                )}
              </div>

              {/* cross-tier trust strip */}
              <div className="mt-5 space-y-1.5 rounded-xl border border-[#1a1a1a]/8 bg-white/40 px-4 py-3.5">
                <p className="flex items-start gap-2 text-[0.76rem] leading-snug text-[#1a1a1a]/60"><span aria-hidden className="mt-[1px] text-[#9a7a2e]">◆</span>Every material claim is <b className="font-semibold text-[#1a1a1a]/80">source-tagged</b> (RERA · QPRs · registrations) — verify it yourself.</p>
                <p className="flex items-start gap-2 text-[0.76rem] leading-snug text-[#1a1a1a]/60"><span aria-hidden className="mt-[1px] text-[#9a7a2e]">↻</span><span>Re-audited <b className="font-semibold text-[#1a1a1a]/80">every month</b>, saved to your Buyer Office — <b className="font-semibold text-[#1a1a1a]/80">yours for life</b> with every update.</span></p>
                <p className="flex items-start gap-2 text-[0.76rem] leading-snug text-[#1a1a1a]/60"><span aria-hidden className="mt-[1px] text-[#9a7a2e]">⚖</span>Built to <b className="font-semibold text-[#1a1a1a]/80">negotiate</b>: buyers use the fair-price band + red flags as leverage with the developer.</p>
              </div>
              <p className="mt-3 text-center text-[0.72rem] leading-relaxed text-[#1a1a1a]/45">
                Compare any projects — free. Need something custom? Shaped on your <span className="font-medium text-[#1a1a1a]/70">first free advisor call</span>.
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
                <span className="text-[0.8rem] text-[#1a1a1a]/55">{packageById(sel).label}{isUpgrade(sel) ? " · upgrade" : ""}</span>
                <span className="font-serif text-[1.5rem] font-semibold">{inr(amountFor(sel))}</span>
              </div>
              {isUpgrade(sel) && <p className="mt-1 text-[0.72rem] text-[#1a1a1a]/45">{inr(packageById(sel).inr)} tier · {inr(credit)} already paid credited.</p>}
              <div className="mt-4 space-y-2">
                {["UPI — GPay / PhonePe / Paytm", "Credit / Debit card", "Netbanking"].map((m, i) => (
                  <div key={m} className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-[0.85rem] ${i === 0 ? "border-[#1e6b45]/40 bg-[#1e6b45]/[0.05]" : "border-[#1a1a1a]/12 bg-white/60"}`}>
                    <span className={`grid h-4 w-4 place-items-center rounded-full border ${i === 0 ? "border-[#1e6b45]" : "border-[#1a1a1a]/25"}`}>{i === 0 && <span className="h-2 w-2 rounded-full bg-[#1e6b45]" />}</span>
                    {m}
                  </div>
                ))}
              </div>
              <button onClick={pay} disabled={paying} className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3.5 text-[0.92rem] font-medium text-white transition-colors hover:bg-[#238c55] disabled:opacity-60">
                {paying ? "Processing…" : `Pay ${inr(amountFor(sel))}`}
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

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M20 6 9 17l-5-5" /></svg>
  );
}
