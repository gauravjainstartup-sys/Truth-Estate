/* ════════════════════════════════════════════════════════════════
   ASK ROUTER — the canvas's client bridge to the omni-router Edge
   Function (Phase 2). Progressive enhancement only: the canvas
   always renders its deterministic answer first; this call runs in
   the background and refines it. ANY failure — function not deployed
   yet, network down, bad payload, timeout — resolves to null and the
   canvas simply stays deterministic. No user-facing errors, ever.
   ════════════════════════════════════════════════════════════════ */
import { sanitizeAnswer, type Chip, type OmniIndex, type RouterAnswer } from "@/lib/omni";

const DEFAULT_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/omni-router";
/* public anon key (same as src/lib/supabase.ts — RLS is the boundary);
   sent so the router also works if deployed without --no-verify-jwt */
const SUPABASE_ANON_KEY =
  "sb_publishable_bLpHCRL6Xa0viqYeEuM3NA_U5VvNWwq";

/* test seam: Playwright/local mocks point the canvas at a stub server */
function routerUrl(): string {
  if (typeof window !== "undefined") {
    const w = window as { __routerUrl?: string };
    if (typeof w.__routerUrl === "string") return w.__routerUrl;
  }
  return DEFAULT_URL;
}

export type AskPayload = { q: string; chips: Chip[]; project: string | null };

export async function askRouter(payload: AskPayload, index: OmniIndex): Promise<RouterAnswer | null> {
  try {
    const res = await fetch(routerUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean } & Record<string, unknown>;
    if (!data.ok) return null;
    return sanitizeAnswer(data, index);
  } catch {
    return null;
  }
}
