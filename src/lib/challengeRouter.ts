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
import type { ChallengeAnswer } from "@/lib/challengeChat";

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
    const res = await fetch(ROUTER_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: p.slug, name: p.name, question, locked, history }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; text?: string; gate?: boolean };
    if (!data?.ok || typeof data.text !== "string") return null;
    // the server is the source of truth on the wall, but never trust it to
    // OPEN a gate the client knows must be shut: a locked visitor's paid
    // answer stays gated regardless of what the model returned.
    return { text: data.text, gate: Boolean(data.gate) };
  } catch {
    return null; // network / timeout / abort → deterministic fallback
  }
}
