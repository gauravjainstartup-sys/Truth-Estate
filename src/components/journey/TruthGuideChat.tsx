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
  PAID_DAILY_LIMIT,
  type ChatMsg,
  type GateReason,
} from "@/lib/truthGuideChat";
import { isSignedIn } from "@/lib/journey";

export default function TruthGuideChat({
  onClose,
  onSignUp,
}: {
  onClose: () => void;
  onSignUp: () => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [gate, setGate] = useState<GateReason>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 350);
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
          {tier !== "registered" && remaining !== null && (
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[0.6rem] font-medium text-white/50">
              {remaining} left{tier === "paid" ? " today" : ""}
            </span>
          )}
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
                ? `Hi — I'm TruthGuide, your independent advisor for Gurugram residential real estate. Ask me anything about projects, developers, pricing, or corridors. You have ${ANON_MESSAGE_LIMIT} questions — sign up free for unlimited.`
                : tier === "registered"
                  ? "Hi — you're signed in. Ask me anything about Gurugram residential real estate — projects, developers, pricing, risks, corridors. I'll answer from our independent research."
                  : `Hi — you have full access. Ask me anything — I'll go as deep as our read allows. ${PAID_DAILY_LIMIT} questions per day.`}
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
        {gate === "anon-limit" && !signedIn && (
          <div className="rounded-2xl border border-[#1e6b45]/20 bg-[#1e6b45]/[0.06] px-5 py-5 text-center">
            <p className="text-[0.85rem] font-medium text-[#1a1a1a]/80">
              You&apos;ve used your {ANON_MESSAGE_LIMIT} free questions
            </p>
            <p className="mt-1.5 text-[0.78rem] font-light text-[#1a1a1a]/50">
              Sign up free for unlimited conversations — no credit card needed.
            </p>
            <button
              onClick={onSignUp}
              className="mt-4 rounded-xl bg-[#1e6b45] px-6 py-3 text-[0.82rem] font-semibold text-white transition-colors hover:bg-[#238c55]"
            >
              Sign up free &rarr;
            </button>
          </div>
        )}

        {/* Gate: paid daily limit reached */}
        {gate === "paid-daily-limit" && (
          <div className="rounded-2xl border border-[#c9a96e]/20 bg-[#c9a96e]/[0.06] px-5 py-5 text-center">
            <p className="text-[0.85rem] font-medium text-[#1a1a1a]/80">
              You&apos;ve reached the daily limit ({PAID_DAILY_LIMIT} questions)
            </p>
            <p className="mt-1.5 text-[0.78rem] font-light text-[#1a1a1a]/50">
              Your quota resets at midnight. Need urgent help? Request an advisor call.
            </p>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[#1a1a1a]/8 bg-[#F5F0E8] px-4 pb-4 pt-3">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2 rounded-full border border-[#1a1a1a]/15 bg-white pl-4 pr-1.5 py-1.5 focus-within:border-[#1e6b45]"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Gurugram real estate..."
            disabled={!!gate}
            className="min-w-0 flex-1 bg-transparent text-[0.85rem] outline-none placeholder:text-[#1a1a1a]/35 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing || !!gate}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e6b45] text-white transition-colors hover:bg-[#238c55] disabled:opacity-35"
          >&uarr;</button>
        </form>
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
