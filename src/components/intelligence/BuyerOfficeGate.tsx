"use client";

import { useEffect, useRef, useState } from "react";
import { saveLead, saveBuyData, loadBuyData, emptyBuyData } from "@/lib/journey";

/* The Buyer Office join — the gate to a project's unit intelligence. Captures
   the important requirements (which also power the Match Score) and a verified
   contact, mirroring the consultation flow's WhatsApp/SMS/Google/Email auth
   (front-end simulation, same as the rest of the site). */

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
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+1", flag: "🇺🇸", name: "US / Canada" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
];
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export default function BuyerOfficeGate({ open, project, onClose, onJoined }: { open: boolean; project: string; onClose: () => void; onJoined: () => void }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"req" | "verify">("req");
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
      setShow(false);
      const id = requestAnimationFrame(() => setShow(true));
      const saved = loadBuyData();
      if (saved) setDraft({ budgetCr: saved.budgetCr, configs: saved.configs, priorities: saved.priorities });
      return () => cancelAnimationFrame(id);
    }
    setStep("req");
    setSent(false);
    setOtp(["", "", "", "", "", ""]);
    setErr("");
  }, [open]);

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
    saveLead({
      name: name.trim() || "—",
      email: method === "email" ? email.trim() : "",
      phone: method === "phone" ? `${dial} ${num}`.trim() : undefined,
      project,
      intent: "buyer-office",
      buy,
      createdAt: Date.now(),
    });
    onJoined();
  }

  function sendCode() {
    if (method === "phone" && !numValid) { setErr("Enter a valid mobile number."); return; }
    if (method === "email" && !emailOk(email)) { setErr("Enter a valid email."); return; }
    setErr("");
    setSent(true);
  }

  function submitVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr("Please enter your name."); return; }
    if (!sent) { sendCode(); return; }
    if (!otpComplete) { setErr("Enter the 6-digit code."); return; }
    persistAndJoin();
  }

  const inputCls = "rounded-sm border border-white/15 bg-white/5 px-4 py-2.5 text-[0.86rem] text-white placeholder-white/35 outline-none focus:border-[#e0b667]";

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center md:items-center md:p-6">
      <div className={`absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#1f3a4d]/50 bg-[#0a0f17] text-white shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.7)] transition-all duration-300 md:max-h-[88vh] md:max-w-md md:rounded-2xl ${show ? "translate-y-0 opacity-100 md:scale-100" : "translate-y-full opacity-0 md:translate-y-0 md:scale-95"}`}>
        <div className="flex items-start justify-between gap-3 border-b border-white/8 px-6 pb-4 pt-5">
          <div>
            <p className="flex items-center gap-2 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[#e0b667]">▦ The Buyer Office</p>
            <p className="mt-1.5 font-serif text-[1.3rem] leading-tight">{step === "req" ? `See ${project}'s unit intelligence` : "Verify to open your file"}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/70 hover:border-white/40">✕</button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {step === "req" ? (
            <>
              <p className="text-[0.84rem] font-light leading-[1.6] text-white/55">Tell us what you&apos;re after — we&apos;ll open your Buyer Office and score every unit against <span className="text-white/80">your</span> needs. Takes 20 seconds.</p>
              <Block label="Your budget">
                {BUDGETS.map((b) => <Chip key={b.cr} on={draft.budgetCr === b.cr} onClick={() => setDraft((d) => ({ ...d, budgetCr: b.cr }))}>{b.label}</Chip>)}
              </Block>
              <Block label="Configuration">
                {CONFIG_CHIPS.map((c) => <Chip key={c} on={draft.configs.includes(c)} onClick={() => toggle("configs", c)}>{c}</Chip>)}
              </Block>
              <Block label="What matters most" hint="up to 3">
                {PRIORITY_CHIPS.map((p) => <Chip key={p} on={draft.priorities.includes(p)} onClick={() => toggle("priorities", p, 3)}>{p}</Chip>)}
              </Block>
              <button onClick={() => setStep("verify")} className="mt-5 w-full rounded-sm bg-[#e0b667] px-6 py-3.5 text-[0.86rem] font-semibold text-[#1a1206] transition-colors hover:bg-[#f0cd85]">Continue →</button>
            </>
          ) : (
            <form onSubmit={submitVerify}>
              <div className="flex flex-col gap-2.5">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} />
                <div className="flex gap-1.5 rounded-sm border border-white/10 p-1">
                  <MethodTab on={method === "phone"} onClick={() => { setMethod("phone"); setSent(false); }}>Mobile</MethodTab>
                  <MethodTab on={method === "email"} onClick={() => { setMethod("email"); setSent(false); }}>Email</MethodTab>
                </div>
                {method === "phone" ? (
                  <div className="flex gap-2">
                    <select value={dial} onChange={(e) => setDial(e.target.value)} disabled={sent} className={`${inputCls} w-28 shrink-0`}>
                      {DIAL.map((d) => <option key={d.code} value={d.code} className="bg-[#0a0f17]">{d.flag} {d.code}</option>)}
                    </select>
                    <input value={num} onChange={(e) => setNum(e.target.value.replace(/[^\d\s]/g, ""))} disabled={sent} placeholder="Mobile number" inputMode="tel" className={`${inputCls} flex-1`} />
                  </div>
                ) : (
                  <input value={email} onChange={(e) => setEmail(e.target.value)} disabled={sent} type="email" placeholder="you@email.com" className={inputCls} />
                )}
                {method === "phone" && isIndia && !sent && (
                  <div className="flex gap-2">
                    <Chip on={channel === "whatsapp"} onClick={() => setChannel("whatsapp")}>WhatsApp</Chip>
                    <Chip on={channel === "sms"} onClick={() => setChannel("sms")}>SMS</Chip>
                  </div>
                )}
                {method === "phone" && !isIndia && !sent && <p className="text-[0.72rem] font-light text-white/40">We&apos;ll verify your number on WhatsApp.</p>}

                {sent && (
                  <div className="mt-1">
                    <p className="mb-2 text-[0.74rem] font-light text-white/50">Enter the code sent {method === "email" ? "to your email" : `on ${channelName}`} <span className="text-white/30">(demo — any 6 digits)</span></p>
                    <div className="flex gap-2">
                      {otp.map((d, i) => (
                        <input key={i} ref={(el) => { otpRefs.current[i] = el; }} value={d} onChange={(e) => setOtpDigit(i, e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
                          inputMode="numeric" maxLength={1} className="h-11 w-full rounded-sm border border-white/15 bg-white/5 text-center text-[1.1rem] font-medium text-white outline-none focus:border-[#e0b667]" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {err && <p className="mt-2 text-[0.76rem] text-[#f0a68f]">{err}</p>}
              <button className="mt-4 w-full rounded-sm bg-[#46c2ff] px-6 py-3.5 text-[0.86rem] font-semibold text-[#04121c] transition-colors hover:bg-[#6fd0ff]">
                {!sent ? "Send code" : "Open my Buyer Office"}
              </button>
              <div className="my-3 flex items-center gap-3 text-[0.68rem] text-white/30"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
              <button type="button" onClick={() => { if (!name.trim()) { setErr("Please enter your name."); return; } persistAndJoin(); }} className="flex w-full items-center justify-center gap-2 rounded-sm border border-white/15 bg-white/5 px-6 py-3 text-[0.84rem] font-medium text-white transition-colors hover:border-white/35">
                <span className="text-[0.95rem]">G</span> Continue with Google
              </button>
              <button type="button" onClick={() => setStep("req")} className="mt-3 w-full text-center text-[0.76rem] font-light text-white/40 hover:text-white/70">← Back to requirements</button>
              <p className="mt-3 text-[0.66rem] font-light leading-[1.5] text-white/30">Free — no payment. We use this to open your file and reach you, never to spam. Front-end demo; OTP is simulated.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Block({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-white/40">{label}{hint && <span className="ml-2 font-light normal-case tracking-normal text-white/25">{hint}</span>}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-3.5 py-1.5 text-[0.78rem] font-light transition-colors ${on ? "border-[#e0b667] bg-[#e0b667]/12 text-[#ffe3a6]" : "border-white/15 text-white/60 hover:border-white/35"}`}>{children}</button>
  );
}

function MethodTab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`flex-1 rounded-sm px-3 py-2 text-[0.8rem] font-medium transition-colors ${on ? "bg-white/10 text-white" : "text-white/45 hover:text-white/75"}`}>{children}</button>
  );
}
