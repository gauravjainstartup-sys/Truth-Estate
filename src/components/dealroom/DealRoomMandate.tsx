"use client";

/* ════════════════════════════════════════════════════════════════
   THE DEAL ROOM — MANDATE (Stage-1 demand experiment)

   An indexable landing + a three-step mandate the buyer commissions:
     The asset   → city + project (+ optional unit)
     The terms   → readiness, target price, timeline, funding
     The buyer   → verify (OTP or Google)

   Everything behind "submit" is concierge-run this month. The mandate is
   saved as a contact_lead with intent "deal-room" and the structured brief
   in `payload`. No auction engine, no seller portal — this only measures
   whether serious buyers will hand us a real mandate.

   Honest by design: no fabricated testimonials, and the market read is a
   promise to ground the target (against filed rates + recent closings on
   the call), never an invented number — that would contradict the whole
   "we tell you the truth" brand.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import DealRoomLanding from "./DealRoomLanding";
import OtpDigits from "@/components/auth/OtpDigits";
import { basePath } from "@/lib/site";
import { track } from "@/lib/events";
import { saveLead, isSignedIn, loadAccount } from "@/lib/journey";
import { getSession, signInWithGoogle } from "@/lib/phoneAuth";
import { sendOtp, verifyOtp, OTP_LENGTH } from "@/lib/shortlistAuth";
import { saveMandate } from "@/lib/dealRoomMandate";
import { fetchResalePrice } from "@/lib/resalePrice";

/* Cohort capacity is real — keep SEATS_CLAIMED truthful and bump it by hand as
   mandates land (concierge-maintained). Scarcity must never be faked. */
const SEATS_TOTAL = 10;
const SEATS_CLAIMED = 0;
const COHORT = "August cohort";

const CITIES = ["Gurugram", "Delhi", "Noida", "Greater Noida", "Faridabad", "GIFT City (Gandhinagar)", "Other — NCR"];
const DIAL = [
  { code: "+91", flag: "🇮🇳" }, { code: "+971", flag: "🇦🇪" }, { code: "+65", flag: "🇸🇬" },
  { code: "+44", flag: "🇬🇧" }, { code: "+1", flag: "🇺🇸" },
];
const STAGES = ["Still exploring", "Comparing a few", "Finalised it"] as const;
const TIMELINES = ["Within 30 days", "Within 60 days", "Within 90 days", "Flexible"];
const FUNDING = ["Self-funded", "Home loan approved", "Home loan in process", "Not sure yet"];

const DRAFT_KEY = "truthEstate.dealRoomDraft";
const PHASES = ["The asset", "The terms", "The buyer"];

type Draft = {
  city: string; project: string; unit: string; stage: string;
  target: string; timeline: string; funding: string; offer: string;
};
const emptyDraft: Draft = {
  city: CITIES[0], project: "", unit: "", stage: "Finalised it",
  target: "", timeline: TIMELINES[0], funding: FUNDING[0], offer: "",
};

export default function DealRoomMandate() {
  const [screen, setScreen] = useState<"landing" | "wizard" | "done">("landing");
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(emptyDraft);
  const [projectNames, setProjectNames] = useState<string[]>([]); // type-ahead suggestions (free text still allowed)
  // Current resale price for the chosen project (live, via Gemini). null = not
  // resolved, "" = checked but nothing reliable found, "₹…" = a real figure.
  const [resale, setResale] = useState<string | null>(null);
  const [resaleLoading, setResaleLoading] = useState(false);
  const resaleFetchedFor = useRef("");

  // auth (buyer step)
  const [dial, setDial] = useState("+91");
  const [num, setNum] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const resumed = useRef(false);

  const set = (k: keyof Draft, v: string) => setD((p) => ({ ...p, [k]: v }));
  const isIndia = dial === "+91";
  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const otpComplete = otp.length === OTP_LENGTH && otp.every((x) => x !== "");

  /* Reach the surface + resume a Google round-trip. When signInWithGoogle
     redirects out, the draft is stashed; on return the reader is signed in,
     so we submit the stashed mandate and land on the confirmation. */
  useEffect(() => {
    track("deal_room_page_viewed", { props: { source: "mandate" } });
    if (resumed.current) return;
    resumed.current = true;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw && isSignedIn()) {
        const draft = JSON.parse(raw) as Draft;
        submitMandate(draft, "google");
      }
    } catch { /* a bad draft must never break the page */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* On step 2, pull the project's current resale price once per project+city.
     Fired here (not on submit) so it resolves in the background while the buyer
     reads and types their target. Grounded server-side; "" means show nothing. */
  useEffect(() => {
    if (step !== 1) return;
    const proj = d.project.trim();
    if (!proj) return;
    const key = `${proj}|${d.city}`;
    if (resaleFetchedFor.current === key) return;
    resaleFetchedFor.current = key;
    setResale(null);
    setResaleLoading(true);
    let alive = true;
    fetchResalePrice(proj, d.city).then((price) => {
      if (!alive) return;
      setResale(price);
      setResaleLoading(false);
    });
    return () => { alive = false; };
  }, [step, d.project, d.city]);

  function openWizard() {
    setScreen("wizard"); setStep(0); setErr("");
    track("deal_room_mandate_started", {});
    window.scrollTo(0, 0);
    // Load tracked-project names for the step-1 type-ahead (free text still works).
    if (projectNames.length === 0) {
      fetch(`${basePath}/compare-index.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((idx: Record<string, { name?: string }> | null) => {
          if (!idx) return;
          const names = Array.from(new Set(Object.values(idx).map((p) => p?.name).filter((n): n is string => !!n))).sort();
          setProjectNames(names);
        })
        .catch(() => { /* type-ahead is a nicety; free text always works */ });
    }
  }
  function go(n: number) { setStep(n); setErr(""); window.scrollTo(0, 0); }

  function stashDraft() {
    try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ }
  }

  function submitMandate(draft: Draft, how: "otp" | "google") {
    const acct = loadAccount();
    const s = getSession();
    saveLead({
      name: (name.trim() || acct?.name || "—"),
      email: s?.email ?? "",
      phone: how === "otp" ? `${dial} ${num}`.trim() : (s?.phone ?? ""),
      project: draft.project.trim() || undefined,
      intent: "deal-room",
      message: `Deal Room mandate — ${draft.city} · target ${draft.target || "—"} · ${draft.timeline}`,
      payload: {
        kind: "deal-room-mandate",
        cohort: COHORT,
        city: draft.city,
        project: draft.project.trim(),
        unit: draft.unit.trim() || null,
        stage: draft.stage,
        targetPrice: draft.target.trim() || null,
        timeline: draft.timeline,
        funding: draft.funding,
        offerInHand: draft.offer.trim() || null,
        via: how,
      },
      createdAt: Date.now(),
    });
    /* Mirror the mandate locally so /deal-room/track can show the buyer where
       it stands. Convenience only — the contact_lead above is the record. */
    saveMandate({
      city: draft.city,
      project: draft.project.trim(),
      unit: draft.unit.trim(),
      stage: draft.stage,
      target: draft.target.trim(),
      timeline: draft.timeline,
      funding: draft.funding,
      offer: draft.offer.trim(),
      name: name.trim() || acct?.name || "",
      phone: how === "otp" ? `${dial} ${num}`.trim() : (s?.phone ?? ""),
      via: how,
      submittedAt: Date.now(),
    });
    track("deal_room_mandate_submitted", {
      projectName: draft.project.trim() || undefined,
      props: { via: how, stage: draft.stage, city: draft.city },
    });
    try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setScreen("done");
    window.scrollTo(0, 0);
  }

  async function sendCode() {
    if (busy) return;
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
    if (!name.trim()) { setErr("Please add your name."); return; }
    if (!otpSent) { await sendCode(); return; }
    if (!otpComplete) { setErr(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    setErr(""); setBusy(true);
    const r = await verifyOtp("mobile", num.replace(/\D/g, ""), otp.join(""), name.trim(), dial);
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? "That code didn't match."); return; }
    submitMandate(d, "otp");
  }

  async function googleContinue() {
    if (busy) return;
    setBusy(true); setErr("");
    stashDraft(); // survive the OAuth redirect; the mount effect submits on return
    const r = await signInWithGoogle();
    if (!r.ok) { setBusy(false); setErr(r.error ?? "Google sign-in didn't start — try the number instead."); }
  }

  // ── shared class strings (dark "on the record" palette) ──
  const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e6b45] px-6 py-3.5 text-[0.92rem] font-semibold text-white shadow-[0_14px_34px_-14px_rgba(30,107,69,.8)] transition-colors hover:bg-[#2e8b57] disabled:opacity-50";
  const btnGhost = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#c9a96e]/25 px-6 py-3.5 text-[0.9rem] font-medium text-[#f4efe6] transition-colors hover:border-[#c9a96e]/60 hover:bg-[#c9a96e]/[0.08]";
  const label = "block font-mono text-[0.64rem] uppercase tracking-[0.14em] text-[#a9a196] mb-3";
  const field = "w-full rounded-xl border border-[#c9a96e]/20 bg-[#191510] px-4 py-3.5 text-[1rem] text-[#f4efe6] placeholder-[#6f685c] outline-none transition-colors focus:border-[#c9a96e]";
  const eyebrow = "font-mono text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]";

  // The landing is the founder-frozen dark creative; it opens the flow in-page.
  if (screen === "landing") return <DealRoomLanding onEnter={openWizard} />;

  return (
    <div className="min-h-screen bg-[#14110d] text-[#f4efe6]" style={{ fontFeatureSettings: '"ss01"' }}>
      {/* nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <a href={`${basePath}/`} aria-label="Truth Estate — home"><Logo className="h-9 w-auto opacity-85" /></a>
        <button onClick={() => { setScreen("landing"); window.scrollTo(0, 0); }} className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[#a9a196] transition-colors hover:text-[#f4efe6]">← The Deal Room</button>
      </nav>

      {screen === "wizard" && (
        <div className="mx-auto flex min-h-[calc(100dvh-96px)] max-w-5xl items-start px-6 pb-16 pt-6 md:items-center md:px-10">
          <div className="grid w-full gap-10 md:grid-cols-[200px_1fr] md:gap-14">
            {/* spine */}
            <aside className="md:sticky md:top-6 md:self-start">
              <div className="flex gap-2 overflow-x-auto md:flex-col md:gap-0">
                {PHASES.map((p, i) => (
                  <div key={p} className={`flex items-start gap-3 py-2.5 transition-opacity ${i === step ? "opacity-100" : "opacity-45"}`}>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-[0.72rem] transition-colors ${i < step ? "border-[#1e6b45] bg-[#1e6b45] text-white" : i === step ? "border-[#c9a96e] bg-[#c9a96e]/[0.12] text-[#e7cf95]" : "border-[#c9a96e]/25 text-[#a9a196]"}`}>{i < step ? "✓" : i + 1}</span>
                    <span className={`hidden pt-1 text-[0.85rem] md:block ${i === step ? "text-[#f4efe6]" : "text-[#a9a196]"}`}>{p}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 hidden rounded-lg border border-[#c9a96e]/20 px-3 py-2.5 font-mono text-[0.6rem] uppercase leading-relaxed tracking-[0.1em] text-[#d99a4e] md:block">{COHORT}<br />{SEATS_TOTAL - SEATS_CLAIMED} seats left</div>
            </aside>

            {/* panels */}
            <div>
              {step === 0 && (
                <div>
                  <span className={eyebrow}>Step 1 of 3 · The asset</span>
                  <h2 className="mt-2 font-serif text-[1.85rem] font-medium leading-tight">Which home are you buying?</h2>
                  <p className="mt-3 max-w-[50ch] text-[0.96rem] leading-relaxed text-[#a9a196]">Just the city and the project — we&apos;ll pin the exact unit together on the call.</p>
                  <div className="mt-8 flex flex-col gap-7">
                    <div><span className={label}>City</span>
                      <select value={d.city} onChange={(e) => set("city", e.target.value)} className={`${field} appearance-none`}>
                        {CITIES.map((c) => <option key={c} value={c} className="bg-[#191510]">{c}</option>)}
                      </select>
                    </div>
                    <div><span className={label}>Project name</span>
                      <input value={d.project} onChange={(e) => set("project", e.target.value)} list="dr-projects" autoComplete="off" placeholder="Start typing — pick a tracked project, or type any name" className={field} />
                      <datalist id="dr-projects">{projectNames.map((n) => <option key={n} value={n} />)}</datalist>
                      {projectNames.length > 0 && <p className="mt-2 text-[0.72rem] text-[#6f685c]">{projectNames.length}+ tracked projects to pick from — or type any name.</p>}
                    </div>
                    <div><span className={label}>Unit details <span className="ml-1 text-[#6f685c]">optional</span></span>
                      <input value={d.unit} onChange={(e) => set("unit", e.target.value)} placeholder="Tower / floor / configuration, if you know it" className={field} />
                    </div>
                  </div>
                  <div className="mt-9 flex justify-between">
                    <button onClick={() => setScreen("landing")} className="text-[0.85rem] text-[#a9a196] hover:text-[#f4efe6]">← Back</button>
                    <button onClick={() => go(1)} disabled={!d.project.trim()} className={btnPrimary}>Continue →</button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <span className={eyebrow}>Step 2 of 3 · The terms</span>
                  <h2 className="mt-2 font-serif text-[1.85rem] font-medium leading-tight">What would a win look like?</h2>
                  <p className="mt-3 max-w-[52ch] text-[0.96rem] leading-relaxed text-[#a9a196]">Name the number you&apos;d be thrilled to close at. On the call we ground it against the real market before we float — so you negotiate from the truth.</p>

                  {/* the number, big — the hero of this step */}
                  <div className="mt-8">
                    <span className={label}>Your target closing price</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-serif text-[1.9rem] leading-none text-[#6f685c]">₹</span>
                      <input value={d.target} onChange={(e) => set("target", e.target.value)} inputMode="numeric" placeholder="2,10,00,000"
                        className="w-full rounded-2xl border border-[#c9a96e]/25 bg-[#191510] py-5 pl-12 pr-5 font-serif text-[1.9rem] leading-none text-[#f4efe6] placeholder-[#4a453d] outline-none transition-colors focus:border-[#c9a96e]" />
                    </div>
                    {/* simple helper text (replaces the old two-line write-up) */}
                    <p className="mt-3 text-[0.78rem] text-[#6f685c]">The number you&apos;d be thrilled to close at — we ground it against the market before we float.</p>

                    {/* Why we're superior: the project's CURRENT resale price, pulled live
                        (Gemini top model + Google Search grounding) so the target reads as
                        the number we drive the market BELOW. Hidden unless a real figure comes back. */}
                    {resaleLoading && (
                      <p className="mt-4 flex items-center gap-2 text-[0.82rem] text-[#a9a196]">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#c9a96e]/30 border-t-[#c9a96e]" aria-hidden />
                        Reading the live market for {d.project.trim() || "this project"}…
                      </p>
                    )}
                    {!resaleLoading && resale ? (
                      <div className="mt-4 overflow-hidden rounded-xl border border-[#c9a96e]/20 bg-gradient-to-b from-[#221c13] to-[#1d1811] p-5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[#c9a96e]">Current market resale</span>
                          <span className="rounded-full border border-[#c9a96e]/30 px-2.5 py-1 font-mono text-[0.56rem] uppercase tracking-[0.06em] text-[#a9a196]">live · indicative</span>
                        </div>
                        <p className="mt-2.5 font-serif text-[1.5rem] leading-none text-[#e7cf95]">{resale}</p>
                        <p className="mt-2.5 text-[0.8rem] leading-relaxed text-[#6f685c]">Typical asking price for <span className="text-[#a9a196]">{d.project.trim() || "this project"}</span> in today&apos;s resale market. Your target is the number we push the market below — that gap is the win.</p>
                      </div>
                    ) : null}
                  </div>

                  {/* the context, secondary */}
                  <div className="mt-8 flex flex-col gap-7">
                    <div><span className={label}>How set are you on this home?</span>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {STAGES.map((s) => (
                          <button key={s} type="button" onClick={() => set("stage", s)} aria-pressed={d.stage === s}
                            className={`rounded-xl border px-3 py-3.5 text-[0.86rem] transition-colors ${d.stage === s ? "border-[#c9a96e] bg-[#c9a96e]/[0.12] text-[#e7cf95]" : "border-[#c9a96e]/20 bg-[#191510] text-[#a9a196] hover:border-[#c9a96e]/50 hover:text-[#f4efe6]"}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div><span className={label}>Already been quoted a price? <span className="ml-1 text-[#6f685c]">optional</span></span>
                      <textarea value={d.offer} onChange={(e) => set("offer", e.target.value)} placeholder="Paste what a broker or owner quoted — base, floor rise, charges. It sharpens our benchmark." className={`${field} min-h-[76px] resize-y text-[0.92rem]`} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><span className={label}>Timeline to close</span>
                        <select value={d.timeline} onChange={(e) => set("timeline", e.target.value)} className={`${field} appearance-none`}>{TIMELINES.map((t) => <option key={t} className="bg-[#191510]">{t}</option>)}</select>
                      </div>
                      <div><span className={label}>How are you funding it?</span>
                        <select value={d.funding} onChange={(e) => set("funding", e.target.value)} className={`${field} appearance-none`}>{FUNDING.map((f) => <option key={f} className="bg-[#191510]">{f}</option>)}</select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-9 flex justify-between">
                    <button onClick={() => go(0)} className="text-[0.85rem] text-[#a9a196] hover:text-[#f4efe6]">← Back</button>
                    <button onClick={() => go(2)} className={btnPrimary}>Continue →</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={verifySubmit}>
                  <span className={eyebrow}>Step 3 of 3 · The buyer</span>
                  <h2 className="mt-2 font-serif text-[1.85rem] font-medium leading-tight">Verify it&apos;s really you.</h2>
                  <p className="mt-3 max-w-[50ch] text-[0.96rem] leading-relaxed text-[#a9a196]">Sellers only compete for verified buyers — it&apos;s why offers come in writing. No payment now.</p>
                  <div className="mt-8 flex flex-col gap-5">
                    <div><span className={label}>Full name</span>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field} />
                    </div>
                    <div><span className={label}>Mobile number</span>
                      <div className="flex gap-3">
                        {/* fixed-width wrapper so the dial select can't balloon over the number field */}
                        <div className="w-[116px] shrink-0">
                          <select value={dial} onChange={(e) => setDial(e.target.value)} disabled={otpSent} className={`${field} appearance-none`}>
                            {DIAL.map((x) => <option key={x.code} value={x.code} className="bg-[#191510]">{x.flag} {x.code}</option>)}
                          </select>
                        </div>
                        <input value={num} onChange={(e) => setNum(e.target.value.replace(/[^\d\s]/g, ""))} disabled={otpSent} inputMode="tel" placeholder="98xxxxxx21" className={`${field} min-w-0 flex-1`} />
                      </div>
                    </div>
                    {otpSent && (
                      <div>
                        <p className="mb-3 text-[0.8rem] text-[#a9a196]">Enter the {OTP_LENGTH}-digit code sent to {dial} {num}{" · "}
                          <button type="button" onClick={() => { setOtpSent(false); setOtp(Array(OTP_LENGTH).fill("")); setErr(""); }} className="text-[#c9a96e] hover:underline">change</button>
                        </p>
                        <OtpDigits value={otp} onChange={setOtp} len={OTP_LENGTH} autoFocus onComplete={verifySubmit}
                          boxClass="h-14 w-full rounded-lg border border-[#c9a96e]/20 bg-[#191510] text-center font-serif text-[1.3rem] text-[#f4efe6] outline-none focus:border-[#c9a96e]" />
                      </div>
                    )}
                  </div>
                  {err && <p className="mt-3 text-[0.82rem] text-[#e6a189]">{err}</p>}
                  <button type="submit" disabled={busy} className={`mt-6 w-full ${btnPrimary}`}>
                    {busy ? (otpSent ? "Verifying…" : "Sending…") : otpSent ? "Verify & submit my mandate →" : "Send code →"}
                  </button>
                  {!otpSent && (
                    <>
                      <div className="my-5 flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#6f685c]"><span className="h-px flex-1 bg-[#c9a96e]/10" />or<span className="h-px flex-1 bg-[#c9a96e]/10" /></div>
                      <button type="button" onClick={googleContinue} disabled={busy} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-6 py-3.5 text-[0.92rem] font-semibold text-[#1a1a1a] transition-opacity hover:opacity-90 disabled:opacity-50">
                        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.7 12.3c0-.7-.1-1.4-.2-2.1H12v4.5h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3h3.9c2.3-2.1 3.6-5.2 3.6-9.1z" /><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.8-2.1-6.7-4.9H1.3v3.1C3.3 21.3 7.3 24 12 24z" /><path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z" /><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z" /></svg>
                        Continue with Google
                      </button>
                    </>
                  )}
                  <div className="mt-6"><button type="button" onClick={() => go(1)} className="text-[0.85rem] text-[#a9a196] hover:text-[#f4efe6]">← Back</button></div>
                  <p className="mt-4 text-[0.76rem] text-[#6f685c]">No upfront cost, ever, to join the cohort. We&apos;ll verify your ID on the advisor call.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {screen === "done" && (
        <div className="mx-auto max-w-xl px-6 py-20 text-center md:px-10">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-[#2e8b57] bg-[#1e6b45]/[0.14] text-[#7fd0a3]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <span className={eyebrow}>{COHORT} · you&apos;re in</span>
          <h2 className="mt-3 font-serif text-[2rem] font-medium leading-tight">The market goes to work for you.</h2>
          <p className="mx-auto mt-4 max-w-[42ch] text-[0.96rem] text-[#a9a196]">Your mandate is logged. From here, a real advisor owns it — you&apos;ll never chase a broker again.</p>
          <div className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-[#c9a96e]/25 bg-[#1d1811] px-5 py-3 text-[0.9rem]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e7cf95" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <span>An advisor calls you <b className="text-[#e7cf95]">within 24 hours</b> to finalise your mandate.</span>
          </div>
          <div className="mx-auto mt-9 max-w-md rounded-2xl border border-[#c9a96e]/12 bg-[#1d1811] text-left">
            <p className="px-6 pt-5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#6f685c]">What happens next</p>
            <ol className="px-6 pb-4">
              {["The lock-in call (within 24h). We confirm your mandate and ground your target against the real market.",
                "We float it (day 1). Your mandate goes to verified brokers, owners and developers — you stay anonymous.",
                "Offers land (2–4 days). Written, all-in, posted to your account as they come.",
                "You compare & we connect. Like an offer? We set up the call and keep every promise on the record."].map((t, i) => (
                <li key={i} className="flex gap-3.5 border-b border-[#c9a96e]/10 py-3 text-[0.88rem] text-[#a9a196] last:border-none"><span className="font-mono text-[0.7rem] text-[#c9a96e]">{i + 1}</span><span>{t}</span></li>
              ))}
            </ol>
          </div>
          <p className="mx-auto mt-5 max-w-md border-l-2 border-[#c9a96e]/25 pl-4 text-left text-[0.78rem] leading-relaxed text-[#6f685c]">
            <b className="text-[#a9a196]">How we&apos;re paid — plainly.</b> Nothing to join. When you&apos;re confident enough to meet a seller, a fully refundable <b className="text-[#a9a196]">₹11,000</b> holds your seat — back in 60 days if nothing closes, no questions. After that we earn only a share of what we actually save you versus the market — never a rupee from the sellers, and nothing if we don&apos;t beat it. All figures are on the property price only, <b className="text-[#a9a196]">excluding GST, stamp duty &amp; registration.</b>
          </p>
          <div className="mt-9 flex justify-center gap-4">
            <a href={`${basePath}/deal-room/track`} className={btnPrimary}>Track my mandate →</a>
            <button onClick={() => { setScreen("landing"); window.scrollTo(0, 0); }} className={btnGhost}>Back to the Deal Room</button>
          </div>
        </div>
      )}
    </div>
  );
}

