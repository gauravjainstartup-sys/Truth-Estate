"use client";

import OtpDigits from "@/components/auth/OtpDigits";

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
  PACKAGES, packageById, grantPackage, isSignedIn, saveLead,
  hasReadAccess, has3DAccess, isAllAccess, readStake, saveStake,
  type PackageId, type Stake,
} from "@/lib/journey";
import { normalisePhone, normaliseIntl, phoneKnown, prettyPhone, sendOtp, sendOtpIntl, verifyOtp, OTP_LENGTH } from "@/lib/phoneAuth";
import { fetchEntitlements } from "@/lib/entitlements";
import { payForPackage, prewarmCheckout } from "@/lib/checkout";

const DIAL = [
  { code: "+91", flag: "🇮🇳" }, { code: "+971", flag: "🇦🇪" }, { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" }, { code: "+65", flag: "🇸🇬" }, { code: "+61", flag: "🇦🇺" },
];
const OTP_LEN = OTP_LENGTH;
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

type Step = "register" | "stake" | "plans" | "owned" | "pay" | "done";

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
  /* undefined = not looked up yet; null = the lookup could not answer.
     Only `true` skips the name field — see the note on registerSubmit. */
  const [known, setKnown] = useState<boolean | null | undefined>(undefined);
  const [err, setErr] = useState("");
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [busy, setBusy] = useState(false);

  const isIndia = dial === "+91";
  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const otpComplete = otp.every((d) => d !== "");
  /* Show the number the SMS actually went to, not the raw keystrokes —
     typing the STD 0 out of habit rendered "+91 09958777312". */
  const normalised = isIndia ? normalisePhone(num) : null;
  const sentTo = normalised ? `${dial} ${prettyPhone(normalised)}` : `${dial} ${num.trim()}`;

  // ── upgrade economics: credit what's already paid on THIS project ──
  const credit = has3DAccess(slug) ? packageById("read3d").inr : hasReadAccess(slug) ? packageById("read").inr : 0;
  const owns = (id: PackageId) =>
    (id === "read" && hasReadAccess(slug)) || (id === "read3d" && has3DAccess(slug)) || (id === "all" && isAllAccess());
  const amountFor = (id: PackageId) => Math.max(packageById(id).inr - credit, 0);
  const isUpgrade = (id: PackageId) => credit > 0 && !owns(id);
  const cards = PLAN_CARDS.filter((c) => !owns(c.id));

  useEffect(() => {
    if (!open) return;
    /* An already-signed-in reader who owns every tier would land on a
       plans step with nothing on it — `cards` filters out what you own,
       and all-owned filters to empty. Send them to the receipt instead. */
    const entitled = isAllAccess() || (focus3D ? has3DAccess(slug) : hasReadAccess(slug));
    setStep(
      !isSignedIn() ? "register"
      : readStake(slug) == null ? "stake"
      : entitled ? "owned"
      : "plans",
    );
    setSel(focus3D ? "read3d" : "read");
    setExpanded(null);
    setSent(false); setKnown(undefined); setOtp(Array(OTP_LEN).fill("")); setErr(""); setPaying(false); setPayErr("");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, focus3D]);

  if (!open) return null;


  /* This step used to send nothing and accept anything: pressing "Send
     code" only flipped `sent`, and any four digits walked straight
     through to setSignedIn(). Someone could unlock and "pay" against a
     number that was never theirs. Both halves are real now — the code
     leaves MSG91 and the server confirms it before anyone is signed in. */
  async function registerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!sent) {
      if (!numValid) { setErr("Enter a valid mobile number."); return; }
      /* Indian numbers get the MSG91 SMS code; international numbers take
         the WhatsApp path, dummied until those templates are live. */
      const ten = isIndia ? normalisePhone(num) : normaliseIntl(dial, num);
      if (!ten) { setErr("That number doesn't look right — mind checking it?"); return; }

      setErr(""); setBusy(true);
      /* Both at once. The lookup only decides which fields the next step
         shows, so making the code wait behind it would add a round trip to
         every sign-in for a cosmetic answer. If the lookup loses, `known`
         is null and the name field appears — the same as a new visitor. */
      const [r, k] = await Promise.all([
        isIndia ? sendOtp(ten) : sendOtpIntl(ten),
        phoneKnown(ten, dial),
      ]);
      setBusy(false);
      if (!r.ok) { setErr(r.error); return; }
      setKnown(k);
      setSent(true);
      return;
    }

    /* A name is required of anyone we cannot positively recognise. Note
       this is `!== true`, not `=== false`: when the lookup could not
       answer we ask, because sending someone through without a name is
       how an account ends up unnamed for good. */
    if (known !== true && !name.trim()) { setErr("Please enter your name."); return; }
    if (!otpComplete) { setErr(`Enter the ${OTP_LEN}-digit code.`); return; }
    const ten = isIndia ? normalisePhone(num) : normaliseIntl(dial, num);
    if (!ten) { setErr("That number doesn't look right — go back and check it."); return; }

    setErr(""); setBusy(true);
    /* Signs in only on a server-confirmed code, and carries the name so
       the profile lands complete in one round trip. */
    const r = await verifyOtp(ten, otp.join(""), name.trim(), dial);
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }

    if (name.trim()) saveLead({ name: name.trim(), email: "", phone: `${dial} ${num}`.trim(), intent: "buyer-office", createdAt: Date.now() });
    setErr("");

    /* WHAT DO THEY ALREADY OWN? A returning buyer signing in on a new
       handset has entitlements on the server and nothing in this
       browser's storage, so without this they were shown the price of a
       report they had already paid for — and if they owned every tier the
       plans step rendered an empty list, because `cards` filters out what
       you own. Ask the server now that there is a session to ask about. */
    setBusy(true);
    await fetchEntitlements().catch(() => null);
    setBusy(false);
    afterVerified();
  }

  /* Where a verified reader goes next. The stake question comes BEFORE the
     entitlement branch, so it is asked of buyers and owners alike — an
     existing customer opening a second report is exactly the person whose
     answer we most want, and they would otherwise sail past it. Asked once
     per project and never again. */
  function afterVerified() {
    if (readStake(slug) == null) { setStep("stake"); return; }
    settle();
  }

  function settle() {
    if (isAllAccess() || (focus3D ? has3DAccess(slug) : hasReadAccess(slug))) {
      setStep("owned");
      setTimeout(() => { onUnlocked(focus3D ? "read3d" : "read"); onClose(); }, 1400);
      return;
    }
    setStep("plans");
  }

  function chooseStake(v: Stake) {
    saveStake(slug, v, projectName);
    settle();
  }

  function choose(id: PackageId) { setSel(id); setPayErr(""); prewarmCheckout(); setStep("pay"); }

  /* REAL MONEY, AND THE GRANT IS NOT OURS TO MAKE.

     What was here: a 900ms setTimeout standing in for the Razorpay round
     trip, then grantPackage() — a client-side write that unmasked the
     report. Free to anyone who waited out the fake spinner.

     Now: our function prices the package and opens a real order, Razorpay
     takes the money, and our function verifies the signature, confirms
     with Razorpay that the order is actually paid, and writes the grant
     against the service role. grantPackage() still runs, but only AFTER
     the server said yes, and only as the local cache of a decision made
     elsewhere — fetchEntitlements() is the authority and is re-read
     immediately so a refresh shows the same answer. */
  async function pay() {
    setPaying(true);
    setPayErr("");
    const res = await payForPackage(sel, slug, { name: name || null, /* Razorpay prefills the contact field; it wants the dialling code. */
      phone: num ? `${dial}${num.replace(/\D/g, "")}` : null });
    setPaying(false);

    if (!res.ok) {
      if (res.reason === "dismissed") return;                  // they closed it; say nothing
      if (res.reason === "unverified") { setStep("register"); setErr("Please confirm your number before paying."); return; }
      setPayErr(
        res.reason === "not_configured" ? "Card payments are briefly unavailable. Your advisor can complete this for you — we'll call."
        : res.reason === "verification" ? `Your payment went through${res.paymentId ? ` (${res.paymentId})` : ""} but we couldn't confirm it here. Nothing is lost — we'll unlock it within the hour.`
        : "That didn't go through. No money has left your account — please try again.",
      );
      return;
    }

    grantPackage(sel, slug);
    void fetchEntitlements();
    setStep("done");
    setTimeout(() => { onUnlocked(sel); onClose(); }, 1400);
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
              {/* THE NUMBER COMES FIRST. This asked everyone for their name
                  before it asked for anything else, so a buyer we already
                  knew typed it again on every unlock and we made no use of
                  knowing them. The number alone tells us which of two
                  people is at the sheet, and each gets the shorter form:
                  a returning buyer gets a greeting and the code, a new one
                  gets the name alongside it. */}
              {!sent ? (
                <>
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#9a7a2e]">Step 1 of 2 · Your number</p>
                  <h2 className="mt-2 font-serif text-[1.7rem] font-semibold leading-tight">Let&rsquo;s start with your mobile</h2>
                  <p className="mt-2 text-[0.88rem] leading-snug text-[#1a1a1a]/55">We&rsquo;ll see whether you already have a Buyer Office, and send you a code either way.</p>
                  <label className="mt-5 block">
                    <span className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/45">Mobile number</span>
                    <div className="mt-2 flex gap-2">
                      <select value={dial} onChange={(e) => setDial(e.target.value)} aria-label="Country code"
                        className="rounded-md border border-[#1a1a1a]/[0.16] bg-white px-3 py-3 text-[0.95rem] text-[#1a1a1a] outline-none focus:border-[#c9a96e]">
                        {DIAL.map((d) => <option key={d.code} value={d.code}>{d.flag} {d.code}</option>)}
                      </select>
                      <input value={num} onChange={(e) => setNum(e.target.value)} inputMode="numeric" placeholder="98xxxxxx21" autoComplete="tel-national" autoFocus className={`flex-1 ${FIELD}`} />
                    </div>
                  </label>
                </>
              ) : (
                <>
                  {/* The greeting is deliberately name-less. We know the name
                      by now, but the code has not been checked — printing it
                      here would tell anyone who typed a stranger's number
                      who owns it. It goes on screen after they verify. */}
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#9a7a2e]">
                    Step 1 of 2 · {known === true ? "Welcome back" : "Create your account"}
                  </p>
                  <h2 className="mt-2 font-serif text-[1.7rem] font-semibold leading-tight">
                    {known === true ? "Good to see you again" : "First, a quick sign-up"}
                  </h2>
                  <p className="mt-2 text-[0.88rem] leading-snug text-[#1a1a1a]/55">
                    {known === true
                      ? "Your Buyer Office is already here — enter the code and it opens where you left it."
                      : "We\u2019ll keep your reads and shortlist in your private Buyer Office."}
                  </p>

                  {known !== true && (
                    <label className="mt-5 block">
                      <span className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/45">Full name</span>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rohan Mehta" autoComplete="name" className={`mt-2 ${FIELD}`} />
                    </label>
                  )}

                  <div className="mt-5">
                    <p className="text-[0.85rem] text-[#1a1a1a]/55">Code sent to <span className="font-medium text-[#1a1a1a]">{sentTo}</span> via {isIndia ? "SMS" : "WhatsApp"}{" · "}<button type="button" onClick={() => { setSent(false); setKnown(undefined); setOtp(Array(OTP_LEN).fill("")); setErr(""); }} className="font-medium text-[#9a7a2e] hover:underline">Change</button></p>
                    <div className="mt-4">
                      <OtpDigits
                        value={otp} onChange={setOtp} len={OTP_LEN} autoFocus
                        boxClass="h-14 min-w-0 flex-1 rounded-lg border border-[#1a1a1a]/[0.18] bg-white text-center font-serif text-[1.4rem] text-[#1a1a1a] outline-none focus:border-[#c9a96e] focus:ring-4 focus:ring-[#c9a96e]/20"
                      />
                    </div>
                  </div>
                </>
              )}

              {err && <p className="mt-3 text-[0.8rem] text-[#b3402a]">{err}</p>}
              <button type="submit" disabled={busy} className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3 text-[0.9rem] font-medium text-white transition-colors hover:bg-[#238c55] disabled:opacity-60">
                {busy ? (sent ? "Verifying…" : "Checking…") : !sent ? "Continue →" : known === true ? "Verify & continue →" : "Create account & continue →"}
              </button>
              {/* Shown to the people it applies to: someone signing up now.
                  A returning buyer agreed at their own sign-up. */}
              {known !== true && (
                <p className="mt-3 text-[0.72rem] leading-relaxed text-[#1a1a1a]/40">By continuing you agree to our Terms &amp; Privacy Policy.</p>
              )}
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
                <p className="flex items-start gap-2 text-[0.76rem] leading-snug text-[#1a1a1a]/60"><span aria-hidden className="mt-[1px] text-[#9a7a2e]">◆</span><span>Every material claim is <b className="font-semibold text-[#1a1a1a]/80">source-tagged</b> (RERA · QPRs · registrations) — verify it yourself.</span></p>
                <p className="flex items-start gap-2 text-[0.76rem] leading-snug text-[#1a1a1a]/60"><span aria-hidden className="mt-[1px] text-[#9a7a2e]">↻</span><span>Re-audited <b className="font-semibold text-[#1a1a1a]/80">every month</b>, saved to your Buyer Office — <b className="font-semibold text-[#1a1a1a]/80">yours for life</b> with every update.</span></p>
                <p className="flex items-start gap-2 text-[0.76rem] leading-snug text-[#1a1a1a]/60"><span aria-hidden className="mt-[1px] text-[#9a7a2e]">⚖</span><span>Built to <b className="font-semibold text-[#1a1a1a]/80">negotiate</b>: buyers use the fair-price band + red flags as leverage with the developer.</span></p>
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
              {/* The three payment methods used to be rendered here as
                  static rows with the first one pre-selected — a picture of
                  a checkout. Razorpay's own sheet offers the real ones, so
                  listing them here would now be a second, fictional choice
                  in front of the real one. */}
              <div className="mt-4 space-y-2 text-[0.85rem] text-[#1a1a1a]/60">
                <p>UPI, credit &amp; debit cards, netbanking and wallets — all handled by Razorpay on the next screen.</p>
              </div>
              {payErr && (
                <p role="alert" className="mt-4 rounded-lg border border-[#b0503e]/30 bg-[#b0503e]/[0.06] px-4 py-3 text-[0.82rem] leading-snug text-[#8f3a2b]">{payErr}</p>
              )}
              <button onClick={pay} disabled={paying} className="mt-6 w-full rounded-md bg-[#1e6b45] px-4 py-3.5 text-[0.92rem] font-medium text-white transition-colors hover:bg-[#238c55] disabled:opacity-60">
                {paying ? "Opening secure checkout…" : `Pay ${inr(amountFor(sel))}`}
              </button>
              <p className="mt-3 text-center text-[0.72rem] text-[#1a1a1a]/40">🔒 Secured by Razorpay. Your card details never touch our servers.</p>
              <button onClick={() => setStep("plans")} className="mt-2 w-full text-center text-[0.76rem] text-[#1a1a1a]/45 hover:text-[#1a1a1a]/70">← Change package</button>
            </div>
          )}

          {/* ONE QUESTION, ASKED ONCE, AT THE ONLY MOMENT IT IS CHEAP.
              Everything else the site knows about a reader describes
              someone shopping — what they opened, shortlisted, compared —
              and an owner checking on money already committed leaves the
              same trail as a buyer weighing the same flat. This is the
              only thing that separates them, and it cannot be inferred.

              It sits after the code and before the price: they are as
              committed as they will get, nothing is being asked of them
              but a tap, and the answer arrives in time to change what
              they are shown. An owner's answer reframes the report to the
              audience it already has an "?as=owner" treatment for. */}
          {step === "stake" && (
            <div>
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#9a7a2e]">Step 2 of 2 · One quick thing</p>
              <h2 className="mt-2 font-serif text-[1.7rem] font-semibold leading-tight">Where do you stand on {projectName}?</h2>
              <p className="mt-2 text-[0.88rem] leading-snug text-[#1a1a1a]/55">It changes which parts of this report matter to you — and we only ask once.</p>
              <div className="mt-6 space-y-3">
                {([
                  { v: "considering" as Stake, t: "I'm looking to invest", s: "Weighing it up — I want the risks before I commit." },
                  { v: "invested" as Stake, t: "I've already invested here", s: "Booked or bought — I want to know what I'm holding." },
                ]).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => chooseStake(o.v)}
                    className="group flex w-full items-center gap-4 rounded-xl border border-[#1a1a1a]/12 bg-white/60 px-5 py-4 text-left transition-colors hover:border-[#1e6b45]/40 hover:bg-[#1e6b45]/[0.05]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-[1.08rem] font-medium text-[#1a1a1a]">{o.t}</span>
                      <span className="mt-0.5 block text-[0.82rem] font-light leading-snug text-[#1a1a1a]/55">{o.s}</span>
                    </span>
                    <span aria-hidden className="shrink-0 text-[#9a7a2e] transition-transform group-hover:translate-x-0.5">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Already paid for. Not a sale, not an error — a receipt. */}
          {step === "owned" && (
            <div className="py-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#1e6b45]/12 text-[#1e6b45]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <h2 className="mt-4 font-serif text-[1.6rem] font-semibold">You already have this one</h2>
              <p className="mt-2 text-[0.9rem] text-[#1a1a1a]/55">
                {isAllAccess() ? "Your All-Access covers every project." : `${projectName} is already in your Buyer Office.`} Opening it now…
              </p>
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
