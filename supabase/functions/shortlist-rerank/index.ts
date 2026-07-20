/* ════════════════════════════════════════════════════════════════
   SHORTLIST-RERANK — Supabase Edge Function (Deno).

   Path 2 of the recommendation engine: the browser's deterministic
   ranking (affordability gate + weighted score) sends its top candidates
   plus the buyer's brief — including the free-text notes — and Gemini
   returns a validated top-3 re-rank with grounded "why" copy. Stateless;
   no data leaves the payload the client assembles.

   POST { brief, candidates } → { ok:true, ranked:[{slug,why,confidence}] }
                              |  { ok:false }   (client keeps the
                                 deterministic order — the permanent
                                 fallback, so the failure mode is exactly
                                 the pre-AI behaviour)

   The pure logic lives in core.ts (so the offline harness can exercise it
   under Node). This file only wires Deno.serve / env / CORS around it.

   Deploy (see README.md):
     supabase functions deploy shortlist-rerank --no-verify-jwt
     # key is shared with challenge-router; set once:
     supabase secrets set GEMINI_API_KEY=<AI Studio key>
     # optional: supabase secrets set GEMINI_MODEL=gemini-2.5-flash
   ════════════════════════════════════════════════════════════════ */
import { rerankShortlist, type Body, type FetchLike } from "./core.ts";

const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

function corsHeaders(origin: string | null): Record<string, string> {
  const ok = origin != null && ALLOW_ORIGIN.some((re) => re.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "https://gauravjainstartup-sys.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const headers = { ...cors, "content-type": "application/json" };
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false }), { status: 200, headers });

  try {
    const body = (await req.json()) as Body;
    const answer = await rerankShortlist(body, {
      apiKey: Deno.env.get("GEMINI_API_KEY"),
      model: MODEL,
      fetchImpl: fetch as unknown as FetchLike,
    });
    return new Response(JSON.stringify(answer), { status: 200, headers });
  } catch (e) {
    console.error("[shortlist-rerank]", e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers });
  }
});
