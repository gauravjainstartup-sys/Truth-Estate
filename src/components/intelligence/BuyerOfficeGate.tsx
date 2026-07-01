"use client";

import { useEffect, useRef, useState } from "react";
import { saveLead, saveBuyData, loadBuyData, emptyBuyData } from "@/lib/journey";

/* The Buyer Office join — the gate to a project's unit intelligence. An
   optional icon-led "what's inside" intro, then the important requirements
   (which also power the Match Score) and a verified contact, mirroring the
   consultation flow's WhatsApp/SMS/Google/Email auth (front-end simulation). */

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
const CAPS: { icon: IconName; t: string }[] = [
  { icon: "cube", t: "3D site & tower model" },
  { icon: "sun", t: "Sun-path per unit" },
  { icon: "compass", t: "Vastu score, with reasoning" },
  { icon: "light", t: "Natural light & views" },
  { icon: "wind", t: "Cross-ventilation" },
  { icon: "value", t: "Best-value stacks" },
];
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export default function BuyerOfficeGate({ open, project, intro = false, onClose, onJoined }: { open: boolean; project: string; intro?: boolean; onClose: () => void; onJoined: () => void }) {
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

  const field = "rounded-md border border-white/12 bg-white/[0.04] px-4 py-3 text-[0.9rem] text-white placeholder-white/30 outline-none transition-colors focus:border-[#c9a96e]/70";

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center md:items-center md:p-6">
      <div className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[20px] border border-white/10 bg-[#0c0c0e] text-white shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.85)] transition-all duration-300 md:max-h-[90vh] md:max-w-[480px] md:rounded-[20px] ${show ? "translate-y-0 opacity-100 md:scale-100" : "translate-y-full opacity-0 md:translate-y-0 md:scale-[0.97]"}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.7), transparent)" }} />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(201,169,110,0.14), transparent 70%)", filter: "blur(30px)" }} />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 px-7 pt-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-[5px] border border-[#c9a96e]/45 text-[0.7rem] text-[#e0b667]">▦</span>
              <span className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.24em] text-[#c9a96e]">The Buyer Office</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              {Array.from({ length: stepTotal }).map((_, i) => (
                <span key={i} className={`h-[3px] rounded-full transition-all duration-300 ${i + 1 <= stepNo ? "w-6 bg-[#c9a96e]" : "w-3 bg-white/15"}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white/80">✕</button>
        </div>

        <div className="relative overflow-y-auto px-7 pb-7 pt-4">
          {step === "intro" ? (
            <>
              <h2 className="font-serif text-[1.7rem] font-medium leading-[1.1]">The layer that decides <span className="italic text-[#e6cf9a]">which</span> home.</h2>
              <p className="mt-3 text-[0.88rem] font-light leading-[1.7] text-white/55">A 3D model of {project} that grades every unit the way most buyers never can. Open your Buyer Office to see it — free.</p>
              <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4">
                {CAPS.map((c) => (
                  <div key={c.t} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#c9a96e]/25 bg-[#c9a96e]/[0.06] text-[#e0b667]"><Icon name={c.icon} /></span>
                    <span className="text-[0.82rem] font-light leading-[1.3] text-white/80">{c.t}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep("req")} className="mt-7 w-full rounded-md bg-[#1e6b45] px-6 py-3.5 text-[0.88rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]">Continue</button>
            </>
          ) : step === "req" ? (
            <>
              <h2 className="font-serif text-[1.7rem] font-medium leading-[1.1]">Tell us what you&apos;re after.</h2>
              <p className="mt-2.5 text-[0.86rem] font-light leading-[1.6] text-white/55">We&apos;ll score every unit against <span className="text-white/80">your</span> brief — it takes 20 seconds.</p>
              <Group label="Your budget">
                {BUDGETS.map((b) => <Chip key={b.cr} on={draft.budgetCr === b.cr} onClick={() => setDraft((d) => ({ ...d, budgetCr: b.cr }))}>{b.label}</Chip>)}
              </Group>
              <Group label="Configuration">
                {CONFIG_CHIPS.map((c) => <Chip key={c} on={draft.configs.includes(c)} onClick={() => toggle("configs", c)}>{c}</Chip>)}
              </Group>
              <Group label="What matters most" hint="up to 3">
                {PRIORITY_CHIPS.map((p) => <Chip key={p} on={draft.priorities.includes(p)} onClick={() => toggle("priorities", p, 3)}>{p}</Chip>)}
              </Group>
              <button onClick={() => setStep("verify")} className="mt-6 w-full rounded-md bg-[#1e6b45] px-6 py-3.5 text-[0.88rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]">Continue</button>
              {intro && <button onClick={() => setStep("intro")} className="mt-3 w-full text-center text-[0.76rem] font-light text-white/35 hover:text-white/65">← Back</button>}
            </>
          ) : (
            <form onSubmit={submitVerify}>
              <h2 className="font-serif text-[1.7rem] font-medium leading-[1.1]">Open your file.</h2>
              <p className="mt-2.5 text-[0.86rem] font-light leading-[1.6] text-white/55">Verify once. Your Buyer Office, and everything we tell you, stays on the record — yours to keep.</p>
              <div className="mt-6 flex flex-col gap-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={`${field} w-full`} />
                <div className="flex gap-1 rounded-md border border-white/10 bg-white/[0.02] p-1">
                  <Tab on={method === "phone"} onClick={() => { setMethod("phone"); setSent(false); }}>Mobile</Tab>
                  <Tab on={method === "email"} onClick={() => { setMethod("email"); setSent(false); }}>Email</Tab>
                </div>
                {method === "phone" ? (
                  <div className="flex gap-2">
                    <select value={dial} onChange={(e) => setDial(e.target.value)} disabled={sent} className={`${field} w-[96px] shrink-0`}>
                      {DIAL.map((d) => <option key={d.code} value={d.code} className="bg-[#0c0c0e]">{d.flag} {d.code}</option>)}
                    </select>
                    <input value={num} onChange={(e) => setNum(e.target.value.replace(/[^\d\s]/g, ""))} disabled={sent} placeholder="Mobile number" inputMode="tel" className={`${field} min-w-0 flex-1`} />
                  </div>
                ) : (
                  <input value={email} onChange={(e) => setEmail(e.target.value)} disabled={sent} type="email" placeholder="you@email.com" className={`${field} w-full`} />
                )}
                {method === "phone" && isIndia && !sent && (
                  <div className="flex gap-2"><Chip on={channel === "whatsapp"} onClick={() => setChannel("whatsapp")}>WhatsApp</Chip><Chip on={channel === "sms"} onClick={() => setChannel("sms")}>SMS</Chip></div>
                )}
                {method === "phone" && !isIndia && !sent && <p className="text-[0.74rem] font-light text-white/40">We&apos;ll verify your number on WhatsApp.</p>}
                {sent && (
                  <div>
                    <p className="mb-2.5 text-[0.76rem] font-light text-white/50">Enter the code sent {method === "email" ? "to your email" : `on ${channelName}`} <span className="text-white/25">· demo, any 6 digits</span></p>
                    <div className="flex gap-2">
                      {otp.map((d, i) => (
                        <input key={i} ref={(el) => { otpRefs.current[i] = el; }} value={d} onChange={(e) => setOtpDigit(i, e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
                          inputMode="numeric" maxLength={1} className="h-12 w-full rounded-md border border-white/12 bg-white/[0.04] text-center text-[1.1rem] font-medium text-white outline-none focus:border-[#c9a96e]/70" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {err && <p className="mt-2.5 text-[0.78rem] text-[#e6a189]">{err}</p>}
              <button className="mt-5 w-full rounded-md bg-[#1e6b45] px-6 py-3.5 text-[0.88rem] font-medium tracking-[0.02em] text-white transition-colors hover:bg-[#238c55]">{!sent ? "Send code" : "Open my Buyer Office"}</button>
              <div className="my-3.5 flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.1em] text-white/25"><span className="h-px flex-1 bg-white/8" />or<span className="h-px flex-1 bg-white/8" /></div>
              <button type="button" onClick={() => { if (!name.trim()) { setErr("Please enter your name."); return; } persistAndJoin(); }} className="flex w-full items-center justify-center gap-2.5 rounded-md border border-white/12 bg-white/[0.03] px-6 py-3 text-[0.85rem] font-medium text-white/90 transition-colors hover:border-white/25 hover:bg-white/[0.06]">
                <span className="font-serif text-[1rem] text-[#e0b667]">G</span> Continue with Google
              </button>
              <button type="button" onClick={() => setStep("req")} className="mt-3.5 w-full text-center text-[0.76rem] font-light text-white/35 hover:text-white/65">← Back</button>
              <p className="mt-4 text-center text-[0.68rem] font-light leading-[1.5] text-white/30">Free — no payment. We never share or spam. Front-end demo; OTP is simulated.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.16em] text-white/40">{label}{hint && <span className="ml-2 tracking-normal text-white/25">· {hint}</span>}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] font-light transition-all ${on ? "border-[#c9a96e] bg-[#c9a96e]/12 text-[#f2e2b8]" : "border-white/12 text-white/55 hover:border-white/30 hover:text-white/80"}`}>{children}</button>;
}

function Tab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex-1 rounded-[5px] px-3 py-2 text-[0.82rem] font-medium transition-colors ${on ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70"}`}>{children}</button>;
}

type IconName = "cube" | "sun" | "compass" | "light" | "wind" | "value";
function Icon({ name }: { name: IconName }) {
  const p = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "cube": return <svg {...p}><path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></svg>;
    case "sun": return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></svg>;
    case "compass": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>;
    case "light": return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M4 12h16M20 3 4 21" /></svg>;
    case "wind": return <svg {...p}><path d="M3 8h11a3 3 0 1 0-3-3M3 16h14a3 3 0 1 1-3 3M3 12h9" /></svg>;
    case "value": return <svg {...p}><path d="M20.6 13.4 12 22l-8.6-8.6a3 3 0 0 1 0-4.2l4.8-4.8a3 3 0 0 1 2.1-.9H16a4 4 0 0 1 4 4v4.5a3 3 0 0 1-.9 2.1z" /><circle cx="15" cy="9" r="1.2" /></svg>;
  }
}
