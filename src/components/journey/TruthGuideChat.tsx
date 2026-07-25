"use client";

import { useEffect, useRef, useState } from "react";
import {
  getTier,
  checkGate,
  trackMessage,
  remainingMessages,
  askTruthGuideRemote,
  fallbackAnswer,
  msgId,
  GUIDE_SUGGESTIONS,
  ANON_MESSAGE_LIMIT,
  DAILY_LIMIT,
  trackedProjectCount,
  type ChatMsg,
  type GateReason,
} from "@/lib/truthGuideChat";
import { isSignedIn } from "@/lib/journey";
import { normalisePhone, prettyPhone, sendOtp, verifyOtp, saveName } from "@/lib/phoneAuth";

export default function TruthGuideChat({
  onClose,
}: {
  onClose: () => void;
  /* Kept for callers that still pass it. Sign-in now happens inline in the
     thread, so this is no longer used to leave the chat. */
  onSignUp?: () => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [gate, setGate] = useState<GateReason>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  /* Sign-in runs INSIDE the thread rather than as a modal: the visitor is
     mid-conversation, and bouncing them to a separate screen is where
     these flows lose people. */
  const [authStep, setAuthStep] = useState<null | "phone" | "code" | "name">(null);
  const [authPhone, setAuthPhone] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 350);
    trackedProjectCount().then(setProjectCount).catch(() => {});
  }, []);

  async function send(raw: string) {
    const q = raw.trim();
    if (!q || typing) return;

    const gated = checkGate();
    if (gated) { setGate(gated); return; }

    setInput("");
    setMsgs((m) => [...m, { id: msgId(), role: "user", text: q }]);
    setTyping(true);

    trackMessage();

    const history = msgs.map((m) => ({ role: m.role, text: m.text }));
    const remote = await askTruthGuideRemote(q, history).catch(() => null);
    const text = remote?.text ?? (await fallbackAnswer(q).catch(() => "I couldn't reach our research just now — try that again in a moment."));
    const followups = remote?.followups ?? [];

    await new Promise((r) => setTimeout(r, 400));
    setTyping(false);

    const afterGate = checkGate();
    setMsgs((m) => [...m, { id: msgId(), role: "bot", text, gate: afterGate, followups }]);
    if (afterGate) setGate(afterGate);
  }

  const say = (text: string) =>
    setMsgs((m) => [...m, { id: msgId(), role: "bot", text }]);
  const echo = (text: string) =>
    setMsgs((m) => [...m, { id: msgId(), role: "user", text }]);

  function startAuth() {
    setAuthStep("phone");
    setInput("");
    say("Happy to keep going — I just need a number to verify. What's the best mobile for you?");
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function handleAuth(raw: string) {
    const v = raw.trim();
    if (!v || authBusy) return;

    if (authStep === "phone") {
      const e164 = normalisePhone(v);
      if (!e164) { say("That doesn't look like a mobile number — try 10 digits, or include the country code."); return; }
      setInput(""); echo(prettyPhone(e164)); setAuthBusy(true);
      const r = await sendOtp(e164);
      setAuthBusy(false);
      if (!r.ok) { say(r.error); return; }
      setAuthPhone(e164);
      setAuthStep("code");
      say(`Sent a 6-digit code to ${prettyPhone(e164)} — pop it in below.`);
      return;
    }

    if (authStep === "code") {
      setInput(""); echo(v.replace(/\D/g, "")); setAuthBusy(true);
      const r = await verifyOtp(authPhone, v);
      setAuthBusy(false);
      if (!r.ok) { say(r.error); return; }
      /* Verified — the quota gate no longer applies. */
      setGate(null);
      setAuthStep("name");
      say("You're in. What should I call you?");
      return;
    }

    if (authStep === "name") {
      setInput(""); echo(v); setAuthBusy(true);
      await saveName(v);
      setAuthBusy(false);
      setAuthStep(null);
      say(`Thanks, ${v.trim().split(/\s+/)[0]}. Ask me anything — ${DAILY_LIMIT} questions a day now.`);
      return;
    }
  }

  const tier = getTier();
  const remaining = remainingMessages();
  const signedIn = isSignedIn();

  return (
    <div className="flex h-full w-full flex-col bg-[#F5F0E8] text-[#1a1a1a]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#1a1a1a]/8 bg-[#0a0a0a] px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e6b45] text-[#eafff3]">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[18px] w-[18px]">
              <path d="M12 2.4l1.75 7.1 7.1 1.75-7.1 1.75L12 21.6l-1.75-7.1L3.15 12.75l7.1-1.75z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-[#c9a96e]">TruthGuide</p>
            <p className="text-[0.9rem] font-medium leading-tight">Gurugram Real Estate</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/15 px-2.5 py-1 text-[0.6rem] font-medium text-white/50">
            {remaining} left{tier === "anonymous" ? "" : " today"}
          </span>
          <button onClick={onClose} aria-label="Close" className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white">
            &#10005;
          </button>
        </div>
      </div>

      {/* Thread */}
      <div ref={scrollRef} className="relative min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {msgs.length === 0 && !typing && (
          <div>
            <Bubble>
              {tier === "anonymous"
                ? `Hi — I'm TruthGuide, Truth Estate's independent advisor. I answer from our own research on ${projectCount ? `${projectCount} Gurugram projects` : "Gurugram projects"}, each scored 0–100. We take no developer commission and sell no inventory, so you get our honest read — including the unflattering parts.\n\nWhat are you trying to work out?`
                : tier === "registered"
                  ? `Welcome back. Ask me anything about Gurugram residential real estate — I'll rank projects, compare corridors, and give you our read on any developer. ${DAILY_LIMIT} questions a day.`
                  : `You're all set — full access. Ask anything and I'll go as deep as our research goes: red flags, delay risk, and the trade-offs behind each score. ${DAILY_LIMIT} questions a day.`}
            </Bubble>
            <p className="mt-4 mb-2 px-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a]/40">Try asking</p>
            <div className="flex flex-col gap-2">
              {GUIDE_SUGGESTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="group flex items-center justify-between rounded-xl border border-[#1a1a1a]/12 bg-white/70 px-4 py-2.5 text-left text-[0.82rem] text-[#1a1a1a]/80 transition-colors hover:border-[#1e6b45]/40 hover:bg-white"
                >
                  {c}
                  <span aria-hidden className="text-[#9a7a2e] opacity-50 transition-opacity group-hover:opacity-100">&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-[#1e6b45] px-4 py-2.5 text-[0.85rem] leading-relaxed text-white">{m.text}</p>
            </div>
          ) : (
            <div key={m.id}>
              <Bubble>{m.text}</Bubble>
            </div>
          ),
        )}

        {(() => {
          const replies = msgs.filter((m) => m.role === "bot").length;
          if (typing || gate || signedIn || tier !== "anonymous" || replies !== 1) return null;
          return (
            <div className="rounded-2xl border border-[#1a1a1a]/10 bg-white/60 px-4 py-3.5">
              <p className="text-[0.78rem] font-light leading-relaxed text-[#1a1a1a]/60">
                Everything above is our real read — we don&apos;t hold back facts for guests.
                Signing in doesn&apos;t get you a better answer, just more of them:
                {" "}{ANON_MESSAGE_LIMIT} questions as a guest, {DAILY_LIMIT} a day once you&apos;re in.
              </p>
              <button
                onClick={startAuth}
                className="mt-2.5 text-[0.78rem] font-semibold text-[#1e6b45] transition-opacity hover:opacity-70"
              >
                Sign in &rarr;
              </button>
            </div>
          );
        })()}

        {(() => {
          const last = msgs[msgs.length - 1];
          if (typing || gate || last?.role !== "bot" || !last.followups?.length) return null;
          return (
            <div className="flex flex-wrap gap-2 pl-1 pt-1">
              {last.followups.map((f) => (
                <button
                  key={f}
                  onClick={() => send(f)}
                  className="rounded-full border border-[#1a1a1a]/12 bg-white/70 px-3.5 py-1.5 text-[0.78rem] text-[#1a1a1a]/70 transition-colors hover:border-[#1e6b45]/40 hover:bg-white hover:text-[#1a1a1a]"
                >
                  {f}
                </button>
              ))}
            </div>
          );
        })()}

        {typing && (
          <Bubble>
            <span className="inline-flex gap-1 py-1">
              <Dot /> <Dot d="0.15s" /> <Dot d="0.3s" />
            </span>
          </Bubble>
        )}

        {/* Gate: anonymous limit reached */}
        {gate === "anon-limit" && !signedIn && !authStep && (
          <div className="rounded-2xl border border-[#1e6b45]/20 bg-[#1e6b45]/[0.06] px-5 py-5 text-center">
            <p className="text-[0.85rem] font-medium text-[#1a1a1a]/80">
              Want to keep going?
            </p>
            <p className="mt-1.5 text-[0.78rem] font-light text-[#1a1a1a]/50">
              Signing in gets you {DAILY_LIMIT} questions a day — same answers, no card.
              Either way, the project reads stay open to you.
            </p>
            <button
              onClick={startAuth}
              className="mt-4 rounded-xl bg-[#1e6b45] px-6 py-3 text-[0.82rem] font-semibold text-white transition-colors hover:bg-[#238c55]"
            >
              Sign in &rarr;
            </button>
          </div>
        )}

        {/* Gate: paid daily limit reached */}
        {gate === "daily-limit" && (
          <div className="rounded-2xl border border-[#c9a96e]/20 bg-[#c9a96e]/[0.06] px-5 py-5 text-center">
            <p className="text-[0.85rem] font-medium text-[#1a1a1a]/80">
              You&apos;ve reached today&apos;s limit of {DAILY_LIMIT} questions
            </p>
            <p className="mt-1.5 text-[0.78rem] font-light text-[#1a1a1a]/50">
              It resets at midnight. Need something sooner? Request an advisor call.
            </p>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[#1a1a1a]/8 bg-[#F5F0E8] px-4 pb-4 pt-3">
        <form
          onSubmit={(e) => { e.preventDefault(); authStep ? handleAuth(input) : send(input); }}
          className="flex items-center gap-2 rounded-full border border-[#1a1a1a]/15 bg-white pl-4 pr-1.5 py-1.5 focus-within:border-[#1e6b45]"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              authStep === "phone" ? "Your mobile number"
              : authStep === "code" ? "6-digit code"
              : authStep === "name" ? "Your name"
              : "Ask about Gurugram real estate..."
            }
            inputMode={authStep === "phone" || authStep === "code" ? "numeric" : "text"}
            autoComplete={
              authStep === "phone" ? "tel"
              : authStep === "code" ? "one-time-code"
              : authStep === "name" ? "given-name"
              : "off"
            }
            disabled={!!gate && !authStep}
            className="min-w-0 flex-1 bg-transparent text-[0.85rem] outline-none placeholder:text-[#1a1a1a]/35 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing || authBusy || (!!gate && !authStep)}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e6b45] text-white transition-colors hover:bg-[#238c55] disabled:opacity-35"
          >&uarr;</button>
        </form>
        {authStep === "code" && (
          <div className="mt-2 flex justify-center gap-4 text-[0.68rem] text-[#1a1a1a]/45">
            <button
              onClick={async () => {
                if (authBusy) return;
                setAuthBusy(true);
                const r = await sendOtp(authPhone);
                setAuthBusy(false);
                say(r.ok ? "Sent another code." : r.error);
              }}
              className="underline underline-offset-2 transition-colors hover:text-[#1a1a1a]/70"
            >
              Resend code
            </button>
            <button
              onClick={() => { setAuthStep("phone"); setInput(""); say("No problem — what's the right number?"); }}
              className="underline underline-offset-2 transition-colors hover:text-[#1a1a1a]/70"
            >
              Wrong number?
            </button>
          </div>
        )}

        <p className="mt-2 px-1 text-center text-[0.62rem] font-light leading-snug text-[#1a1a1a]/35">
          TruthGuide answers from our independent research on Gurugram residential real estate. Not investment advice. Conversations are saved to improve our answers.
        </p>
      </div>
    </div>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-[#1a1a1a]/8 bg-white px-4 py-2.5 text-[0.85rem] leading-relaxed text-[#1a1a1a]/85">
        {children}
      </div>
    </div>
  );
}

function Dot({ d = "0s" }: { d?: string }) {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1a1a1a]/40" style={{ animationDelay: d }} />;
}
