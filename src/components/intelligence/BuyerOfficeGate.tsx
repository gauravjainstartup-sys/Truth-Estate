"use client";

import { useEffect, useRef, useState } from "react";
import {
  saveLead, saveBuyData, loadBuyData, emptyBuyData,
  loadMemberCall, saveMemberCall, type MemberCall,
} from "@/lib/journey";
import { CONSULT_DAYS, CONSULT_DAYPARTS, CONSULT_FORMATS, advisorFor } from "@/lib/consultation";

/* THE BUYER OFFICE — the member surface for a project's unit intelligence.
   Cold visitors: an icon-led "what's inside" intro → requirements → verified
   contact (mirrors the consultation auth; front-end simulation) → a success
   screen. Members re-enter to a home that surfaces their unlocked intel and
   an advisor-call state (empty → schedule → booked). The call is
   complimentary — the 3D unlock is never pay-gated. Ships light by default;
   pass theme="dark" for the dark-luxe variant. */

const BUDGETS = [
  { label: "Under ₹3 Cr", cr: 2 },
  { label: "₹3–5 Cr", cr: 4 },
  { label: "₹5–8 Cr", cr: 6 },
  { label: "₹8–12 Cr", cr: 10 },
  { label: "₹12 Cr +", cr: 14 },
];
const CONFIG_CHIPS = ["2 BHK", "3 BHK", "4 BHK", "5 BHK", "Penthouse"];
const PRIORITY_CHIPS = ["Legal Safety", "On-Time Delivery", "Capital Appreciation", "Value Buying", "Luxury Lifestyle", "Location", "Layouts", "Rental Yield"];
const DIAL = [
  { code: "+91", flag: "🇮🇳" }, { code: "+971", flag: "🇦🇪" }, { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" }, { code: "+65", flag: "🇸🇬" }, { code: "+61", flag: "🇦🇺" },
];
const CAPS: { icon: IconName; t: string; d: string }[] = [
  { icon: "cube", t: "3D site & tower model", d: "Walk the whole complex to scale — every tower, floor and facing." },
  { icon: "sun", t: "Sun-path, per unit", d: "Exact daylight hours each home gets, summer through winter." },
  { icon: "compass", t: "Vastu score, with reasoning", d: "Graded on entrance, zones and facing — and why it scored that way." },
  { icon: "light", t: "Natural light & views", d: "What each home actually looks out on, floor by floor." },
  { icon: "wind", t: "Cross-ventilation", d: "How air moves through the layout — corner and through-units flagged." },
  { icon: "value", t: "Best-value stacks", d: "The units priced below what their position is really worth." },
];
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const advisor = advisorFor("advice"); // complimentary Buyer Office advisor

type Step = "intro" | "req" | "verify" | "done" | "schedule" | "booked" | "home";
type StartAt = "intro" | "req" | "home";

type ThemeName = "light" | "dark";
type Tokens = {
  sheet: string; backdrop: string; hairline: string; glow: string;
  badge: string; eyebrow: string; stepOn: string; stepOff: string; close: string;
  h2: string; accent: string; body: string; bodyStrong: string;
  capIcon: string; capDivide: string; capTitle: string; capDesc: string;
  groupLabel: string; groupHint: string; chipOn: string; chipOff: string;
  field: string; tabWrap: string; tabOn: string; tabOff: string; otp: string; option: string;
  primary: string; outline: string; orLine: string; orText: string; google: string; googleG: string;
  back: string; fine: string; err: string; demo: string;
  crest: string; good: string; card: string; dashed: string; callCard: string;
};
const THEMES: Record<ThemeName, Tokens> = {
  light: {
    sheet: "border-[#ece3d1] bg-white text-[#1a1a1a] shadow-[0_-30px_80px_-26px_rgba(60,42,10,0.30)]",
    backdrop: "bg-[#1a1206]/45",
    hairline: "linear-gradient(90deg, transparent, rgba(154,122,46,0.55), transparent)",
    glow: "radial-gradient(circle, rgba(201,169,110,0.22), transparent 70%)",
    badge: "border-[#c9a96e]/60 text-[#9a7a2e]", eyebrow: "text-[#9a7a2e]",
    stepOn: "bg-[#9a7a2e]", stepOff: "bg-black/[0.12]",
    close: "text-black/35 hover:bg-black/5 hover:text-black/70",
    h2: "text-[#1a1a1a]", accent: "text-[#9a7a2e]", body: "text-[#1a1a1a]/60", bodyStrong: "text-[#1a1a1a]/85",
    capIcon: "border-[#c9a96e]/45 bg-[#c9a96e]/[0.10] text-[#9a7a2e]", capDivide: "divide-[#1a1a1a]/[0.07]",
    capTitle: "text-[#1a1a1a]/90", capDesc: "text-[#1a1a1a]/55",
    groupLabel: "text-[#1a1a1a]/45", groupHint: "text-[#1a1a1a]/30",
    chipOn: "border-[#9a7a2e] bg-[#c9a96e]/15 text-[#7a5f1e]",
    chipOff: "border-black/[0.14] text-[#1a1a1a]/60 hover:border-black/30 hover:text-[#1a1a1a]/85",
    field: "border-black/[0.14] bg-[#faf7f1] text-[#1a1a1a] placeholder-black/30 focus:border-[#c9a96e]",
    tabWrap: "border-black/[0.10] bg-black/[0.02]", tabOn: "bg-white text-[#1a1a1a] shadow-sm", tabOff: "text-black/40 hover:text-black/70",
    otp: "border-black/[0.14] bg-[#faf7f1] text-[#1a1a1a] focus:border-[#c9a96e]", option: "bg-white text-[#1a1a1a]",
    primary: "bg-[#1e6b45] text-white hover:bg-[#238c55]", outline: "border-[#1e6b45]/40 text-[#1e6b45] hover:bg-[#1e6b45]/[0.06]",
    orLine: "bg-black/[0.10]", orText: "text-black/30",
    google: "border-black/[0.14] bg-white text-[#1a1a1a]/90 hover:border-black/30 hover:bg-black/[0.02]", googleG: "text-[#9a7a2e]",
    back: "text-black/35 hover:text-black/65", fine: "text-black/35", err: "text-[#b3402a]", demo: "text-black/30",
    crest: "border-[#1e6b45]/30 bg-[#1e6b45]/[0.08] text-[#1e6b45]", good: "text-[#1e6b45]",
    card: "border-black/[0.10] bg-[#faf7f1]", dashed: "border-[#1a1a1a]/20", callCard: "border-[#1e6b45]/25 bg-[#1e6b45]/[0.05]",
  },
  dark: {
    sheet: "border-white/10 bg-[#0c0c0e] text-white shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.85)]",
    backdrop: "bg-black/70",
    hairline: "linear-gradient(90deg, transparent, rgba(201,169,110,0.7), transparent)",
    glow: "radial-gradient(circle, rgba(201,169,110,0.14), transparent 70%)",
    badge: "border-[#c9a96e]/45 text-[#e0b667]", eyebrow: "text-[#c9a96e]",
    stepOn: "bg-[#c9a96e]", stepOff: "bg-white/15",
    close: "text-white/40 hover:bg-white/5 hover:text-white/80",
    h2: "text-white", accent: "text-[#e6cf9a]", body: "text-white/55", bodyStrong: "text-white/80",
    capIcon: "border-[#c9a96e]/25 bg-[#c9a96e]/[0.06] text-[#e0b667]", capDivide: "divide-white/[0.07]",
    capTitle: "text-white/90", capDesc: "text-white/50",
    groupLabel: "text-white/40", groupHint: "text-white/25",
    chipOn: "border-[#c9a96e] bg-[#c9a96e]/12 text-[#f2e2b8]",
    chipOff: "border-white/12 text-white/55 hover:border-white/30 hover:text-white/80",
    field: "border-white/12 bg-white/[0.04] text-white placeholder-white/30 focus:border-[#c9a96e]/70",
    tabWrap: "border-white/10 bg-white/[0.02]", tabOn: "bg-white/[0.08] text-white", tabOff: "text-white/40 hover:text-white/70",
    otp: "border-white/12 bg-white/[0.04] text-white focus:border-[#c9a96e]/70", option: "bg-[#0c0c0e] text-white",
    primary: "bg-[#1e6b45] text-white hover:bg-[#238c55]", outline: "border-[#2e8b57]/50 text-[#7fd0a3] hover:bg-[#1e6b45]/[0.14]",
    orLine: "bg-white/10", orText: "text-white/25",
    google: "border-white/12 bg-white/[0.03] text-white/90 hover:border-white/25 hover:bg-white/[0.06]", googleG: "text-[#e0b667]",
    back: "text-white/35 hover:text-white/65", fine: "text-white/30", err: "text-[#e6a189]", demo: "text-white/25",
    crest: "border-[#2e8b57]/40 bg-[#1e6b45]/[0.14] text-[#7fd0a3]", good: "text-[#7fd0a3]",
    card: "border-white/10 bg-white/[0.03]", dashed: "border-white/20", callCard: "border-[#2e8b57]/30 bg-[#1e6b45]/[0.10]",
  },
};

export default function BuyerOfficeGate({
  open, project, start = "intro", has3D = false, member = false, theme = "light", onClose, onJoined, onSeeUnitIntel,
}: {
  open: boolean; project: string; start?: StartAt; has3D?: boolean; member?: boolean; theme?: ThemeName;
  onClose: () => void; onJoined: () => void; onSeeUnitIntel: () => void;
}) {
  const t = THEMES[theme];
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<Step>(start);
  const [draft, setDraft] = useState<{ budgetCr: number; configs: string[]; priorities: string[] }>({ budgetCr: 6, configs: [], priorities: [] });
  const [name, setName] = useState("");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [dial, setDial] = useState("+91");
  const [num, setNum] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [err, setErr] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  // scheduling
  const [call, setCall] = useState<MemberCall | null>(null);
  const [schedFrom, setSchedFrom] = useState<Step>("home");
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(start);
      setShow(false);
      const id = requestAnimationFrame(() => setShow(true));
      const saved = loadBuyData();
      if (saved) setDraft({ budgetCr: saved.budgetCr, configs: saved.configs, priorities: saved.priorities });
      setCall(loadMemberCall());
      return () => cancelAnimationFrame(id);
    }
    setSent(false);
    setOtp(["", "", "", "", "", ""]);
    setErr("");
    setDay(null); setSlot(null); setFormat(null);
  }, [open, start]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  const isIndia = dial === "+91";
  const numValid = num.replace(/\D/g, "").length >= (isIndia ? 10 : 6);
  const otpComplete = otp.every((d) => d !== "");
  const channelName = isIndia ? (channel === "whatsapp" ? "WhatsApp" : "SMS") : "WhatsApp";
  const joinFlow = step === "intro" || step === "req" || step === "verify";
  const hasIntro = start === "intro";
  const stepTotal = hasIntro ? 3 : 2;
  const stepNo = step === "intro" ? 1 : step === "req" ? (hasIntro ? 2 : 1) : step === "verify" ? (hasIntro ? 3 : 2) : 0;

  const toggle = (k: "configs" | "priorities", v: string, max = 99) =>
    setDraft((d) => {
      const has = d[k].includes(v);
      let n = has ? d[k].filter((x) => x !== v) : [...d[k], v];
      if (!has && n.length > max) n = n.slice(n.length - max);
      return { ...d, [k]: n };
    });

  const setOtpDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setOtp((o) => { const n = [...o]; n[i] = digit; return n; });
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  function persistAndJoin() {
    const buy = { ...emptyBuyData, ...(loadBuyData() ?? {}), budgetCr: draft.budgetCr, configs: draft.configs, priorities: draft.priorities };
    saveBuyData(buy);
    saveLead({ name: name.trim() || "—", email: method === "email" ? email.trim() : "", phone: method === "phone" ? `${dial} ${num}`.trim() : undefined, project, intent: "buyer-office", buy, createdAt: Date.now() });
    onJoined();       // mark membership in the parent — the gate stays open on the success screen
    setStep("done");
  }

  function sendCode() {
    if (method === "phone" && !numValid) { setErr("Enter a valid mobile number."); return; }
    if (method === "email" && !emailOk(email)) { setErr("Enter a valid email."); return; }
    setErr(""); setSent(true);
  }

  function submitVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr("Please enter your name."); return; }
    if (!sent) { sendCode(); return; }
    if (!otpComplete) { setErr("Enter the 6-digit code."); return; }
    persistAndJoin();
  }

  const goSchedule = (from: Step) => { setSchedFrom(from); setStep("schedule"); };
  function confirmCall() {
    if (!day || !slot || !format) return;
    const c: MemberCall = { advisor: advisor.name, initials: advisor.initials, focus: advisor.focus, day, time: slot, format, project, createdAt: Date.now() };
    saveMemberCall(c);
    setCall(c);
    setStep("booked");
  }

  const field = `rounded-md border px-4 py-3 text-[0.9rem] outline-none transition-colors ${t.field}`;
  const primaryBtn = `w-full rounded-md px-6 py-3.5 text-[0.88rem] font-medium tracking-[0.02em] transition-colors ${t.primary}`;
  const outlineBtn = `w-full rounded-md border px-6 py-3.5 text-[0.86rem] font-medium tracking-[0.02em] transition-colors ${t.outline}`;
  const backLink = `w-full text-center text-[0.76rem] font-light ${t.back}`;

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center md:items-center md:p-6">
      <div className={`absolute inset-0 ${t.backdrop} backdrop-blur-md transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div data-bo-sheet className={`relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[20px] border transition-all duration-300 md:max-h-[90vh] md:max-w-[480px] md:rounded-[20px] ${t.sheet} ${show ? "translate-y-0 opacity-100 md:scale-100" : "translate-y-full opacity-0 md:translate-y-0 md:scale-[0.97]"}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: t.hairline }} />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full" style={{ background: t.glow, filter: "blur(30px)" }} />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 px-7 pt-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`flex h-6 w-6 items-center justify-center rounded-[5px] border text-[0.7rem] ${t.badge}`}>▦</span>
              <span className={`font-mono text-[0.62rem] font-medium uppercase tracking-[0.24em] ${t.eyebrow}`}>The Buyer Office</span>
            </div>
            {joinFlow && (
              <div className="mt-1.5 flex items-center gap-1.5">
                {Array.from({ length: stepTotal }).map((_, i) => (
                  <span key={i} className={`h-[3px] rounded-full transition-all duration-300 ${i + 1 <= stepNo ? `w-6 ${t.stepOn}` : `w-3 ${t.stepOff}`}`} />
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className={`-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${t.close}`}>✕</button>
        </div>

        <div className="relative overflow-y-auto px-7 pb-7 pt-4">
          {step === "intro" ? (
            <>
              <h2 className={`font-serif text-[1.7rem] font-medium leading-[1.1] ${t.h2}`}>The layer that decides <span className={`italic ${t.accent}`}>which</span> home.</h2>
              <p className={`mt-3 text-[0.88rem] font-light leading-[1.7] ${t.body}`}>A 3D model of {project} that grades every unit the way most buyers never can — free to open, yours to keep.</p>
              <div className={`mt-6 flex flex-col divide-y ${t.capDivide}`}>
                {CAPS.map((c) => (
                  <div key={c.t} className="flex items-start gap-4 py-3.5">
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${t.capIcon}`}><Icon name={c.icon} /></span>
                    <div className="min-w-0">
                      <p className={`text-[0.94rem] font-medium leading-snug ${t.capTitle}`}>{c.t}</p>
                      <p className={`mt-1 text-[0.8rem] font-light leading-[1.5] ${t.capDesc}`}>{c.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep("req")} className={`mt-7 ${primaryBtn}`}>Request Unit Intelligence</button>
            </>
          ) : step === "req" ? (
            <>
              <h2 className={`font-serif text-[1.7rem] font-medium leading-[1.1] ${t.h2}`}>Join the Buyer Office.</h2>
              <p className={`mt-2.5 text-[0.86rem] font-light leading-[1.6] ${t.body}`}>Tell us what you&apos;re after — we&apos;ll score every unit against <span className={t.bodyStrong}>your</span> brief. Takes 20 seconds.</p>
              <Group t={t} label="Your budget">
                {BUDGETS.map((b) => <Chip key={b.cr} t={t} on={draft.budgetCr === b.cr} onClick={() => setDraft((d) => ({ ...d, budgetCr: b.cr }))}>{b.label}</Chip>)}
              </Group>
              <Group t={t} label="Configuration">
                {CONFIG_CHIPS.map((c) => <Chip key={c} t={t} on={draft.configs.includes(c)} onClick={() => toggle("configs", c)}>{c}</Chip>)}
              </Group>
              <Group t={t} label="What matters most" hint="up to 3">
                {PRIORITY_CHIPS.map((p) => <Chip key={p} t={t} on={draft.priorities.includes(p)} onClick={() => toggle("priorities", p, 3)}>{p}</Chip>)}
              </Group>
              <button onClick={() => setStep("verify")} className={`mt-6 ${primaryBtn}`}>Continue</button>
              {hasIntro && <button onClick={() => setStep("intro")} className={`mt-3 ${backLink}`}>← Back</button>}
            </>
          ) : step === "verify" ? (
            <form onSubmit={submitVerify}>
              <h2 className={`font-serif text-[1.7rem] font-medium leading-[1.1] ${t.h2}`}>Open your file.</h2>
              <p className={`mt-2.5 text-[0.86rem] font-light leading-[1.6] ${t.body}`}>Verify once. Your Buyer Office, and everything we tell you, stays on the record — yours to keep.</p>
              <div className="mt-6 flex flex-col gap-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={`${field} w-full`} />
                <div className={`flex gap-1 rounded-md border p-1 ${t.tabWrap}`}>
                  <Tab t={t} on={method === "phone"} onClick={() => { setMethod("phone"); setSent(false); }}>Mobile</Tab>
                  <Tab t={t} on={method === "email"} onClick={() => { setMethod("email"); setSent(false); }}>Email</Tab>
                </div>
                {method === "phone" ? (
                  <div className="flex gap-2">
                    <select value={dial} onChange={(e) => setDial(e.target.value)} disabled={sent} className={`${field} w-[96px] shrink-0`}>
                      {DIAL.map((d) => <option key={d.code} value={d.code} className={t.option}>{d.flag} {d.code}</option>)}
                    </select>
                    <input value={num} onChange={(e) => setNum(e.target.value.replace(/[^\d\s]/g, ""))} disabled={sent} placeholder="Mobile number" inputMode="tel" className={`${field} min-w-0 flex-1`} />
                  </div>
                ) : (
                  <input value={email} onChange={(e) => setEmail(e.target.value)} disabled={sent} type="email" placeholder="you@email.com" className={`${field} w-full`} />
                )}
                {method === "phone" && isIndia && !sent && (
                  <div className="flex gap-2"><Chip t={t} on={channel === "whatsapp"} onClick={() => setChannel("whatsapp")}>WhatsApp</Chip><Chip t={t} on={channel === "sms"} onClick={() => setChannel("sms")}>SMS</Chip></div>
                )}
                {method === "phone" && !isIndia && !sent && <p className={`text-[0.74rem] font-light ${t.demo}`}>We&apos;ll verify your number on WhatsApp.</p>}
                {sent && (
                  <div>
                    <p className={`mb-2.5 text-[0.76rem] font-light ${t.body}`}>Enter the code sent {method === "email" ? "to your email" : `on ${channelName}`} <span className={t.demo}>· demo, any 6 digits</span></p>
                    <div className="flex gap-2">
                      {otp.map((d, i) => (
                        <input key={i} ref={(el) => { otpRefs.current[i] = el; }} value={d} onChange={(e) => setOtpDigit(i, e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
                          inputMode="numeric" maxLength={1} className={`h-12 w-full rounded-md border text-center text-[1.1rem] font-medium outline-none ${t.otp}`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {err && <p className={`mt-2.5 text-[0.78rem] ${t.err}`}>{err}</p>}
              <button className={`mt-5 ${primaryBtn}`}>{!sent ? "Send code" : "Open my Buyer Office"}</button>
              <div className={`my-3.5 flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.1em] ${t.orText}`}><span className={`h-px flex-1 ${t.orLine}`} />or<span className={`h-px flex-1 ${t.orLine}`} /></div>
              <button type="button" onClick={() => { if (!name.trim()) { setErr("Please enter your name."); return; } persistAndJoin(); }} className={`flex w-full items-center justify-center gap-2.5 rounded-md border px-6 py-3 text-[0.85rem] font-medium ${t.google}`}>
                <span className={`font-serif text-[1rem] ${t.googleG}`}>G</span> Continue with Google
              </button>
              <button type="button" onClick={() => setStep("req")} className={`mt-3.5 ${backLink}`}>← Back</button>
              <p className={`mt-4 text-center text-[0.68rem] font-light leading-[1.5] ${t.fine}`}>Free — no payment. We never share or spam. Front-end demo; OTP is simulated.</p>
            </form>
          ) : step === "done" ? (
            <div className="text-center">
              <Crest t={t}><Icon name="check" /></Crest>
              <p className={`mt-4 font-mono text-[0.62rem] font-medium uppercase tracking-[0.22em] ${t.good}`}>Request registered</p>
              <h2 className={`mt-2 font-serif text-[1.7rem] font-medium leading-[1.12] ${t.h2}`}>You&apos;re in — we&apos;re on it.</h2>
              <p className={`mx-auto mt-3 max-w-[360px] text-[0.88rem] font-light leading-[1.65] ${t.body}`}>
                Your brief is with our advisory desk. We&apos;ll come back with {project}&apos;s unit intelligence and an independent read — our opinion, never a builder&apos;s pitch.
              </p>
              <div className="mt-7 flex flex-col gap-3 text-left">
                {has3D && <button onClick={onSeeUnitIntel} className={primaryBtn}>See your unit intelligence →</button>}
                <button onClick={() => goSchedule("done")} className={has3D ? outlineBtn : primaryBtn}>Schedule a call with your advisor</button>
              </div>
              <button onClick={onClose} className={`mt-4 ${backLink}`}>Back to the report</button>
              <p className={`mt-4 text-[0.68rem] font-light ${t.fine}`}>Free — no payment, ever, to unlock your intelligence.</p>
            </div>
          ) : step === "home" ? (
            <div>
              <p className={`font-mono text-[0.62rem] font-medium uppercase tracking-[0.22em] ${t.eyebrow}`}>Welcome back</p>
              <h2 className={`mt-2 font-serif text-[1.7rem] font-medium leading-[1.12] ${t.h2}`}>Your Buyer Office.</h2>
              <p className={`mt-2.5 text-[0.86rem] font-light leading-[1.6] ${t.body}`}>Everything we&apos;re holding for you on {project} — your intelligence, and your advisor.</p>

              {/* Unit intelligence */}
              <div className={`mt-6 rounded-xl border p-5 ${t.card}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-[0.94rem] font-medium ${t.capTitle}`}>Tower &amp; Unit Intelligence</p>
                    <p className={`mt-1 text-[0.8rem] font-light leading-[1.5] ${t.capDesc}`}>
                      {has3D ? "Your 3D advisor is unlocked — open a tower for unit-level intel." : "In production — your advisor will walk you through it as it comes online."}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] ${t.crest}`}>Unlocked</span>
                </div>
                {has3D && <button onClick={onSeeUnitIntel} className={`mt-4 ${primaryBtn}`}>Open the live 3D →</button>}
              </div>

              {/* Advisor call */}
              <p className={`mt-7 mb-2.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.16em] ${t.groupLabel}`}>Your advisor call</p>
              {call ? (
                <>
                  <CallCard t={t} call={call} />
                  <button onClick={() => goSchedule("home")} className={`mt-3 ${backLink}`}>Reschedule this call</button>
                </>
              ) : (
                <div className={`rounded-xl border border-dashed p-5 text-center ${t.dashed}`}>
                  <p className={`text-[0.92rem] font-medium ${t.h2}`}>No call scheduled yet.</p>
                  <p className={`mx-auto mt-1.5 max-w-[320px] text-[0.8rem] font-light leading-[1.55] ${t.body}`}>
                    Book a complimentary 45-minute call — your advisor walks you through your unit intelligence and pressure-tests the decision. No pitch, no pressure.
                  </p>
                  <button onClick={() => goSchedule("home")} className={`mt-4 ${primaryBtn}`}>Schedule your advisor call →</button>
                </div>
              )}
              <button onClick={onClose} className={`mt-6 ${backLink}`}>Back to the report</button>
            </div>
          ) : step === "schedule" ? (
            <div>
              <button onClick={() => setStep(schedFrom)} className={`mb-3 text-left text-[0.76rem] font-light ${t.back}`}>← Back</button>
              <h2 className={`font-serif text-[1.7rem] font-medium leading-[1.12] ${t.h2}`}>{call ? "Reschedule your call." : "Schedule your advisor call."}</h2>
              <p className={`mt-2.5 text-[0.86rem] font-light leading-[1.6] ${t.body}`}>A complimentary 45 minutes on {project} — independent, and prepared before we speak.</p>
              <div className={`mt-5 flex items-center gap-3 rounded-xl border p-4 ${t.card}`}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border font-serif text-[0.95rem] font-medium ${t.crest}`}>{advisor.initials}</span>
                <div className="min-w-0">
                  <p className={`font-serif text-[1.05rem] font-medium ${t.h2}`}>{advisor.name}</p>
                  <p className={`text-[0.78rem] font-light ${t.body}`}>{advisor.focus}</p>
                </div>
              </div>
              <Group t={t} label="Pick a day">
                {CONSULT_DAYS.map((dv) => <Chip key={dv} t={t} on={day === dv} onClick={() => setDay(dv)}>{dv}</Chip>)}
              </Group>
              <div className="mt-5">
                <p className={`mb-2.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.16em] ${t.groupLabel}`}>Pick a time</p>
                <div className="flex flex-col gap-3">
                  {CONSULT_DAYPARTS.map((dp) => (
                    <div key={dp.part}>
                      <p className={`mb-1.5 text-[0.68rem] font-light ${t.demo}`}>{dp.part} <span className="opacity-70">· {dp.window}</span></p>
                      <div className="flex flex-wrap gap-2">
                        {dp.slots.map((s) => <Chip key={s} t={t} on={slot === s} onClick={() => setSlot(s)}>{s}</Chip>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Group t={t} label="Format">
                {CONSULT_FORMATS.map((f) => <Chip key={f} t={t} on={format === f} onClick={() => setFormat(f)}>{f}</Chip>)}
              </Group>
              <button onClick={confirmCall} disabled={!day || !slot || !format} className={`mt-6 ${primaryBtn} disabled:cursor-not-allowed disabled:opacity-30`}>Confirm my call</button>
              <p className={`mt-3 text-center text-[0.68rem] font-light ${t.fine}`}>Complimentary · 45 minutes · no payment.</p>
            </div>
          ) : (
            /* booked */
            <div className="text-center">
              <Crest t={t}><Icon name="calendar" /></Crest>
              <p className={`mt-4 font-mono text-[0.62rem] font-medium uppercase tracking-[0.22em] ${t.good}`}>You&apos;re booked</p>
              <h2 className={`mt-2 font-serif text-[1.7rem] font-medium leading-[1.12] ${t.h2}`}>Your call is set.</h2>
              <p className={`mx-auto mt-3 max-w-[340px] text-[0.86rem] font-light leading-[1.6] ${t.body}`}>We&apos;ll send a calendar invite and a reminder before it. Your advisor arrives prepared on {project}.</p>
              {call && <div className="mt-6 text-left"><CallCard t={t} call={call} /></div>}
              <div className="mt-6 flex flex-col gap-3 text-left">
                {has3D && <button onClick={onSeeUnitIntel} className={primaryBtn}>See your unit intelligence →</button>}
                <button onClick={onClose} className={has3D ? backLink : primaryBtn}>Back to the report</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CallCard({ t, call }: { t: Tokens; call: MemberCall }) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${t.callCard}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border font-serif text-[0.95rem] font-medium ${t.crest}`}>{call.initials}</span>
        <div className="min-w-0">
          <p className={`font-serif text-[1.05rem] font-medium ${t.h2}`}>{call.advisor}</p>
          <p className={`text-[0.76rem] font-light ${t.body}`}>{call.format} · 45 min</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-serif text-[1.02rem] font-medium ${t.good}`}>{call.day}</p>
        <p className={`text-[0.78rem] font-light ${t.body}`}>{call.time}</p>
      </div>
    </div>
  );
}

function Crest({ t, children }: { t: Tokens; children: React.ReactNode }) {
  return <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${t.crest}`}>{children}</span>;
}

function Group({ t, label, hint, children }: { t: Tokens; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className={`mb-2.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.16em] ${t.groupLabel}`}>{label}{hint && <span className={`ml-2 tracking-normal ${t.groupHint}`}>· {hint}</span>}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ t, on, onClick, children }: { t: Tokens; on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] font-light transition-all ${on ? t.chipOn : t.chipOff}`}>{children}</button>;
}

function Tab({ t, on, onClick, children }: { t: Tokens; on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex-1 rounded-[5px] px-3 py-2 text-[0.82rem] font-medium transition-colors ${on ? t.tabOn : t.tabOff}`}>{children}</button>;
}

type IconName = "cube" | "sun" | "compass" | "light" | "wind" | "value" | "check" | "calendar";
function Icon({ name }: { name: IconName }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const big = { ...p, width: 24, height: 24, strokeWidth: 1.7 };
  switch (name) {
    case "cube": return <svg {...p}><path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></svg>;
    case "sun": return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></svg>;
    case "compass": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>;
    case "light": return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M4 12h16M20 3 4 21" /></svg>;
    case "wind": return <svg {...p}><path d="M3 8h11a3 3 0 1 0-3-3M3 16h14a3 3 0 1 1-3 3M3 12h9" /></svg>;
    case "value": return <svg {...p}><path d="M20.6 13.4 12 22l-8.6-8.6a3 3 0 0 1 0-4.2l4.8-4.8a3 3 0 0 1 2.1-.9H16a4 4 0 0 1 4 4v4.5a3 3 0 0 1-.9 2.1z" /><circle cx="15" cy="9" r="1.2" /></svg>;
    case "check": return <svg {...big}><path d="M20 6 9 17l-5-5" /></svg>;
    case "calendar": return <svg {...big}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M9 15l2 2 4-4" /></svg>;
  }
}
