/* ════════════════════════════════════════════════════════════════
   SHORTLIST RE-RANK — the client bridge to the Gemini shortlist-rerank
   Edge Function (Path 2, docs/shortlist-ai-rerank-spec.md).

   The deterministic ranking is always computed first and is the permanent
   fallback: this call sends the top candidates plus the buyer's full brief
   (including the free-text notes the formula cannot read) and, when a VALID
   response arrives inside the timeout, re-orders the shortlist to the
   model's picks. ANY failure — function not deployed, network, timeout,
   hallucinated slug, malformed JSON — resolves to null and the
   deterministic order stands. No user-facing errors, ever.
   ════════════════════════════════════════════════════════════════ */
import type { BuyData } from "./journey";
import type { RankedIntel } from "./shortlist";

const DEFAULT_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/shortlist-rerank";
/* public anon key (same as src/lib/supabase.ts — RLS is the boundary);
   sent so the function also works if deployed WITH JWT verification on */
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

const TIMEOUT_MS = 3000; // spec: never hold the shortlist longer than this
const MAX_CANDIDATES = 10;

/* env override wins; then a window test seam (Playwright/local); else default */
function rerankUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SHORTLIST_RERANK_URL) {
    return process.env.NEXT_PUBLIC_SHORTLIST_RERANK_URL;
  }
  if (typeof window !== "undefined") {
    const w = window as { __shortlistRerankUrl?: string };
    if (typeof w.__shortlistRerankUrl === "string") return w.__shortlistRerankUrl;
  }
  return DEFAULT_URL;
}

export type RerankPick = { slug: string; why: string; confidence: string };

/* Ask the model to re-rank the deterministic top candidates. Returns the
   model's picks (already validated as a subset) or null for "keep the
   deterministic order". */
export async function rerankRemote(buy: BuyData, recs: RankedIntel[]): Promise<RerankPick[] | null> {
  const top = recs.slice(0, MAX_CANDIDATES);
  if (top.length < 2) return null; // nothing to re-rank
  try {
    const candidates = top.map((r) => ({
      slug: r.slug,
      name: r.name,
      market: r.market,
      entryCr: r.budget[0],
      configs: r.configs,
      tags: r.tags,
      truthScore: r.truthScore,
      matchPct: r.matchPct,
      strengths: (r.strengths ?? []).slice(0, 3),
      watchouts: (r.watchouts ?? []).slice(0, 3),
    }));
    const res = await fetch(rerankUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ brief: buy, candidates }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; ranked?: RerankPick[] };
    if (!data?.ok || !Array.isArray(data.ranked) || data.ranked.length < 1) return null;
    // client-side wall (the server validates too, but we trust nothing):
    // every pick must be a distinct slug from OUR candidate set
    const allowed = new Set(top.map((r) => r.slug));
    const seen = new Set<string>();
    const picks: RerankPick[] = [];
    for (const p of data.ranked.slice(0, 3)) {
      if (typeof p?.slug !== "string" || !allowed.has(p.slug) || seen.has(p.slug)) return null;
      seen.add(p.slug);
      picks.push({ slug: p.slug, why: typeof p.why === "string" ? p.why : "", confidence: p.confidence ?? "Medium" });
    }
    return picks.length ? picks : null;
  } catch {
    return null; // network / timeout / abort → deterministic fallback
  }
}

/* Apply the model's picks: its choices lead (carrying their existing scored
   objects — scores, prices and copy always render from OUR data), the rest
   follow in deterministic order. */
export function applyRerank(recs: RankedIntel[], picks: RerankPick[]): RankedIntel[] {
  const bySlug = new Map(recs.map((r) => [r.slug, r]));
  const lead = picks.map((p) => bySlug.get(p.slug)).filter((r): r is RankedIntel => r != null);
  const chosen = new Set(lead.map((r) => r.slug));
  return [...lead, ...recs.filter((r) => !chosen.has(r.slug))];
}
