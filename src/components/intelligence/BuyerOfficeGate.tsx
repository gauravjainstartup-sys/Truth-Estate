"use client";

import { useEffect, useRef, useState } from "react";
import { saveLead, saveBuyData, loadBuyData, emptyBuyData } from "@/lib/journey";

/* The Buyer Office join — the gate to a project's unit intelligence. An
   optional icon-led "what's inside" intro, then the important requirements
   (which also power the Match Score) and a verified contact, mirroring the
   consultation flow's WhatsApp/SMS/Google/Email auth (front-end simulation).
   Ships in a light (ivory-native) theme by default; pass theme="dark" for the
   dark-luxe variant. */

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

type ThemeName = "light" | "dark";
type Tokens = {
  sheet: string; backdrop: string; hairline: string; glow: string;
  badge: string; eyebrow: string; stepOn: string; stepOff: string; close: string;
  h2: string; accent: string; body: string; bodyStrong: string;
  capIcon: string; capDivide: string; capTitle: string; capDesc: string;
  groupLabel: string; groupHint: string; chipOn: string; chipOff: string;
  field: string; tabWrap: string; tabOn: string; tabOff: string; otp: string; option: string;
  primary: string; orLine: string; orText: string; google: string; googleG: string;
  back: string; fine: string; err: string; demo: string;
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
    primary: "bg-[#1e6b45] text-white hover:bg-[#238c55]", orLine: "bg-black/[0.10]", orText: "text-black/30",
    google: "border-black/[0.14] bg-white text-[#1a1a1a]/90 hover:border-black/30 hover:bg-black/[0.02]", googleG: "text-[#9a7a2e]",
    back: "text-black/35 hover:text-black/65", fine: "text-black/35", err: "text-[#b3402a]", demo: "text-black/30",
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
    primary: "bg-[#1e6b45] text-white hover:bg-[#238c55]", orLine: "bg-white/10", orText: "text-white/25",
    google: "border-white/12 bg-white/[0.03] text-white/90 hover:border-white/25 hover:bg-white/[0.06]", googleG: "text-[#e0b667]",
    back: "text-white/35 hover:text-white/65", fine: "text-white/30", err: "text-[#e6a189]", demo: "text-white/25",
  },
};

export default function BuyerOfficeGate({ open, project, intro = false, theme = "light", onClose, onJoined }: { open: boolean; project: string; intro?: boolean; theme?: ThemeName; onClose: () => void; onJoined: () => void }) {
  const t = THEMES[theme];
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"intro" | "req" | "verify">(intro ? "intro" : "req");
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

  useEffect(() => {
    if (open) {
      setStep(intro ? "intro" : "req");
      setShow(false);
      const id = requestAnimationFrame(() => setShow(true));
      const saved = loadBuyData();
      if (saved) setDraft({ budgetCr: saved.budgetCr, configs: saved.configs, priorities: saved.priorities });
      return () => cancelAnimationFrame(id);
    }
    setSent(false);
    setOtp(["", "", "", "", "", ""]);
    setErr("");
  }, [open, intro]);

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
  const stepNo = step === "intro" ? 1 : step === "req" ? (intro ? 2 : 1) : intro ? 3 : 2;
  const stepTotal = intro ? 3 : 2;

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
    onJoined();
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

  const field = `rounded-md border px-4 py-3 text-[0.9rem] outline-none transition-colors ${t.field}`;

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
            <div className="mt-1.5 flex items-center gap-1.5">
              {Array.from({ length: stepTotal }).map((_, i) => (
                <span key={i} className={`h-[3px] rounded-full transition-all duration-300 ${i + 1 <= stepNo ? `w-6 ${t.stepOn}` : `w-3 ${t.stepOff}`}`} />
              ))}
            </div>
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
              <button onClick={() => setStep("req")} className={`mt-7 w-full rounded-md px-6 py-3.5 text-[0.88rem] font-medium tracking-[0.02em] transition-colors ${t.primary}`}>Request Unit Intelligence</button>
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
              <button onClick={() => setStep("verify")} className={`mt-6 w-full rounded-md px-6 py-3.5 text-[0.88rem] font-medium tracking-[0.02em] transition-colors ${t.primary}`}>Continue</button>
              {intro && <button onClick={() => setStep("intro")} className={`mt-3 w-full text-center text-[0.76rem] font-light ${t.back}`}>← Back</button>}
            </>
          ) : (
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
              <button className={`mt-5 w-full rounded-md px-6 py-3.5 text-[0.88rem] font-medium tracking-[0.02em] transition-colors ${t.primary}`}>{!sent ? "Send code" : "Open my Buyer Office"}</button>
              <div className={`my-3.5 flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.1em] ${t.orText}`}><span className={`h-px flex-1 ${t.orLine}`} />or<span className={`h-px flex-1 ${t.orLine}`} /></div>
              <button type="button" onClick={() => { if (!name.trim()) { setErr("Please enter your name."); return; } persistAndJoin(); }} className={`flex w-full items-center justify-center gap-2.5 rounded-md border px-6 py-3 text-[0.85rem] font-medium transition-colors ${t.google}`}>
                <span className={`font-serif text-[1rem] ${t.googleG}`}>G</span> Continue with Google
              </button>
              <button type="button" onClick={() => setStep("req")} className={`mt-3.5 w-full text-center text-[0.76rem] font-light ${t.back}`}>← Back</button>
              <p className={`mt-4 text-center text-[0.68rem] font-light leading-[1.5] ${t.fine}`}>Free — no payment. We never share or spam. Front-end demo; OTP is simulated.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
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

type IconName = "cube" | "sun" | "compass" | "light" | "wind" | "value";
function Icon({ name }: { name: IconName }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "cube": return <svg {...p}><path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></svg>;
    case "sun": return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></svg>;
    case "compass": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>;
    case "light": return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M4 12h16M20 3 4 21" /></svg>;
    case "wind": return <svg {...p}><path d="M3 8h11a3 3 0 1 0-3-3M3 16h14a3 3 0 1 1-3 3M3 12h9" /></svg>;
    case "value": return <svg {...p}><path d="M20.6 13.4 12 22l-8.6-8.6a3 3 0 0 1 0-4.2l4.8-4.8a3 3 0 0 1 2.1-.9H16a4 4 0 0 1 4 4v4.5a3 3 0 0 1-.9 2.1z" /><circle cx="15" cy="9" r="1.2" /></svg>;
  }
}
