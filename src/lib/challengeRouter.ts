/* ════════════════════════════════════════════════════════════════
   CHALLENGE ROUTER — the client seam to the (future) Gemini brain.

   Phase 1 (today): returns null → the UI falls back to the deterministic
   answerChallenge() engine. Nothing to configure, works offline.

   Phase 2 (production, when the founder's Gemini key is set): point
   NEXT_PUBLIC_CHALLENGE_ROUTER_URL at a Supabase Edge Function that runs
   Gemini over the access-tagged report knowledge and RETURNS THE ACCESS
   FILTER ALREADY APPLIED — i.e. the server must never place paid chunks
   in the model context for a locked visitor (`locked` is passed through
   so the function filters retrieval before Gemini sees anything). The
   { text, gate } contract is identical to the deterministic engine, so
   the chat UI and the gate wall don't change.

   Mirrors the omni-router pattern: any failure or non-ok response →
   null → deterministic fallback. The wall is enforced on BOTH paths.
   ════════════════════════════════════════════════════════════════ */
import type { ProjectIntel } from "@/lib/projects";
import { buildChallengeContext, type ChallengeAnswer } from "@/lib/challengeChat";

const ROUTER_URL =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_CHALLENGE_ROUTER_URL : undefined;

export async function askChallengeRemote(
  p: ProjectIntel,
  question: string,
  locked: boolean,
  history: { role: "user" | "bot"; text: string }[] = [],
): Promise<ChallengeAnswer | null> {
  if (!ROUTER_URL) return null; // Phase 1 — no remote brain wired yet
  try {
    // The wall is enforced at assembly: a locked visitor's context carries
    // NO paid content, so paid findings never reach the server or Gemini.
    const context = buildChallengeContext(p, locked);
    const res = await fetch(ROUTER_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, locked, history: history.slice(-8), context }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; text?: string; gate?: boolean };
    if (!data?.ok || typeof data.text !== "string") return null;
    // Client is authoritative on the wall: never let the server OPEN a gate
    // that must stay shut. A locked, paid-topic question stays gated even if
    // the model's own flag says otherwise.
    return { text: data.text, gate: locked ? Boolean(data.gate) : false };
  } catch {
    return null; // network / timeout / abort → deterministic fallback
  }
}
