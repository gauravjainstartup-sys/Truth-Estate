/* ════════════════════════════════════════════════════════════════
   CHALLENGE ROUTER — the client bridge to the Gemini challenge-router
   Edge Function. Progressive enhancement only: ChallengeChat always has
   its deterministic answer; this call refines the PROSE in the background.
   ANY failure — function down, network, bad payload, timeout — resolves to
   null and the chat stays on the built-in engine. No user-facing errors.

   The wall is enforced at assembly (buildChallengeContext): a locked
   visitor's context carries NO paid content, so paid findings never reach
   this function or Gemini. The client stays authoritative on the gate.
   ════════════════════════════════════════════════════════════════ */
import type { ProjectIntel } from "@/lib/projects";
import { buildChallengeContext, type ChallengeAnswer } from "@/lib/challengeChat";

const DEFAULT_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/challenge-router";
/* public anon key (same as src/lib/supabase.ts — RLS is the boundary);
   sent so the router also works if deployed WITH JWT verification on */
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

/* env override wins; then a window test seam (Playwright/local); else default */
function routerUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CHALLENGE_ROUTER_URL) {
    return process.env.NEXT_PUBLIC_CHALLENGE_ROUTER_URL;
  }
  if (typeof window !== "undefined") {
    const w = window as { __challengeRouterUrl?: string };
    if (typeof w.__challengeRouterUrl === "string") return w.__challengeRouterUrl;
  }
  return DEFAULT_URL;
}

export async function askChallengeRemote(
  p: ProjectIntel,
  question: string,
  locked: boolean,
  history: { role: "user" | "bot"; text: string }[] = [],
): Promise<ChallengeAnswer | null> {
  try {
    // The wall is enforced at assembly: a locked visitor's context carries
    // NO paid content, so paid findings never reach the server or Gemini.
    const context = buildChallengeContext(p, locked);
    const res = await fetch(routerUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ question, locked, history: history.slice(-8), context }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; text?: string; gate?: boolean };
    if (!data?.ok || typeof data.text !== "string") return null;
    // Client is authoritative on the wall: never let the server OPEN a gate
    // that must stay shut. A locked paid-topic question stays gated.
    return { text: data.text, gate: locked ? Boolean(data.gate) : false };
  } catch {
    return null; // network / timeout / abort → deterministic fallback
  }
}
