"use client";

/* ────────────────────────────────────────────────────────────────────────
   ChallengeChat — the "Challenge our read" advisor, scoped to ONE project.

   A conversational surface (side-drawer on desktop, bottom-sheet on mobile)
   that answers from Truth Estate's own read of this project and respects the
   unlock wall: paid answers become a true teaser + an inline unlock CTA when
   locked, and answer in full once unlocked. The brain is challengeChat.ts
   (deterministic today); challengeRouter.ts is the Gemini seam for later.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { type ProjectIntel } from "@/lib/projects";
import { askChallengeRemote } from "@/lib/challengeRouter";
import {
  answerChallenge,
  openingChips,
  openingLine,
  loadCorridorPeers,
  msgId,
  GATE_CTA,
  type ChatMsg,
  type Peer,
} from "@/lib/challengeChat";

export default function ChallengeChat({
  p, open, onClose, locked, onUnlock,
}: {
  p: ProjectIntel;
  open: boolean;
  onClose: () => void;
  locked: boolean;
  onUnlock: () => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevLocked = useRef(locked);
  const chips = openingChips(p);

  // keep the thread pinned to the newest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  // focus the input when the panel opens; load corridor rivals in the
  // background (public scoreboard — names + Truth Scores) for head-to-heads
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 350);
    if (peers.length === 0) loadCorridorPeers(p).then(setPeers).catch(() => {});
  }, [open, p, peers.length]);

  // when the visitor unlocks mid-conversation, celebrate + invite the deep ask
  useEffect(() => {
    if (prevLocked.current && !locked && open) {
      setMsgs((m) => [...m, { id: msgId(), role: "bot", text: `✓ You've unlocked the full read on ${p.name}. Ask me anything now — the verdict, the ROI, any pillar — I can go all the way.` }]);
    }
    prevLocked.current = locked;
  }, [locked, open, p.name]);

  async function send(raw: string) {
    const q = raw.trim();
    if (!q || typing) return;
    setInput("");
    setMsgs((m) => [...m, { id: msgId(), role: "user", text: q }]);
    setTyping(true);
    // The deterministic engine decides the WALL (gate) and is the fallback;
    // Gemini, when wired, only upgrades the prose. So the paywall can never
    // drift on the model's whim — a locked paid question stays gated.
    const det = answerChallenge(p, q, locked, peers);
    const history = msgs.map((m) => ({ role: m.role, text: m.text }));
    const remote = await askChallengeRemote(p, q, locked, history, peers).catch(() => null);
    const text = remote?.text ?? det.text;
    await new Promise((r) => setTimeout(r, 480)); // brief "thinking"
    setTyping(false);
    setMsgs((m) => [...m, { id: msgId(), role: "bot", text, gate: det.gate }]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-stretch sm:justify-end">
      <div className="absolute inset-0 bg-[#0B1F1A]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90svh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#F5F0E8] shadow-[0_-30px_80px_-24px_rgba(11,31,26,0.6)] sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-none">
        {/* header — dark, brand-consistent with the TruthGuide bubble */}
        <div className="relative flex shrink-0 items-center justify-between gap-3 bg-[#0a0a0a] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e6b45] text-[0.95rem]">◆</span>
            <div className="min-w-0">
              <p className="text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-[#c9a96e]">TruthGuide · Challenge our read</p>
              <p className="truncate text-[0.9rem] font-medium leading-tight">{p.name}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white">✕</button>
        </div>

        {/* thread */}
        <div ref={scrollRef} className="relative min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {/* opening: intro + project-scoped challenge chips (only before first ask) */}
          {msgs.length === 0 && (
            <div>
              <Bubble>{openingLine(p, locked)}</Bubble>
              <p className="mt-4 mb-2 px-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a]/40">Try challenging me on</p>
              <div className="flex flex-col gap-2">
                {chips.map((c) => (
                  <button
                    key={c}
                    onClick={() => send(c)}
                    className="group flex items-center justify-between rounded-xl border border-[#1a1a1a]/12 bg-white/70 px-4 py-2.5 text-left text-[0.82rem] text-[#1a1a1a]/80 transition-colors hover:border-[#1e6b45]/40 hover:bg-white"
                  >
                    {c}
                    <span aria-hidden className="text-[#9a7a2e] opacity-50 transition-opacity group-hover:opacity-100">→</span>
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
                {m.gate && (
                  <button
                    onClick={onUnlock}
                    className="group mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e6b45] px-4 py-3 text-[0.82rem] font-semibold text-white transition-colors hover:bg-[#238c55]"
                  >
                    🔒 {GATE_CTA}
                    <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
                  </button>
                )}
              </div>
            ),
          )}

          {typing && (
            <Bubble>
              <span className="inline-flex gap-1 py-1">
                <Dot /> <Dot d="0.15s" /> <Dot d="0.3s" />
              </span>
            </Bubble>
          )}
        </div>

        {/* composer */}
        <div className="shrink-0 border-t border-[#1a1a1a]/8 bg-[#F5F0E8] px-4 pb-4 pt-3">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 rounded-full border border-[#1a1a1a]/15 bg-white pl-4 pr-1.5 py-1.5 focus-within:border-[#1e6b45]"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask anything about ${p.name}…`}
              className="min-w-0 flex-1 bg-transparent text-[0.85rem] outline-none placeholder:text-[#1a1a1a]/35"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e6b45] text-white transition-colors hover:bg-[#238c55] disabled:opacity-35"
            >↑</button>
          </form>
          <p className="mt-2 px-1 text-center text-[0.62rem] font-light leading-snug text-[#1a1a1a]/35">
            TruthGuide answers only from our independent read of this project. Not investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#1a1a1a]/8 bg-white px-4 py-2.5 text-[0.85rem] leading-relaxed text-[#1a1a1a]/85">
        {children}
      </div>
    </div>
  );
}

function Dot({ d = "0s" }: { d?: string }) {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1a1a1a]/40" style={{ animationDelay: d }} />;
}
