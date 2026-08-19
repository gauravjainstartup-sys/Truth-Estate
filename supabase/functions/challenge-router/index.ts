/* ════════════════════════════════════════════════════════════════
   CHALLENGE-ROUTER — Supabase Edge Function (Deno).

   Powers "Challenge our read" with Gemini, grounded ONLY in the access-
   scoped context the client sends. Stateless: the browser assembles the
   knowledge (public always; paid ONLY when the visitor is unlocked — see
   src/lib/challengeChat.ts buildChallengeContext), so paid findings never
   sit in any public file and a locked visitor's paid content never reaches
   this function.

   POST { question, locked, history?, context } → { ok:true, text, gate }
                                               |  { ok:false }  (client
                                                  falls back to its built-in
                                                  deterministic answer)

   The pure logic lives in core.ts (so the offline harness can exercise it
   under Node). This file only wires Deno.serve / env / CORS around it.

   Deploy (see README.md):
     supabase functions deploy challenge-router --no-verify-jwt
     supabase secrets set GEMINI_API_KEY=<AI Studio key>
     # optional: supabase secrets set GEMINI_MODEL=gemini-2.5-flash
   ════════════════════════════════════════════════════════════════ */
import { routeChallenge, type Body, type FetchLike } from "./core.ts";
import { buildGeneralContext, buildProjectExtras, type FetchLike as CtxFetch } from "./context.ts";
import { logTurn, type FetchLike as LogFetch } from "./chatlog.ts";

const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

/* Supabase injects these into every Edge Function — nothing to configure.
   The service role is used so the reads keep working regardless of how RLS
   evolves on the published views. */
const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const DB_KEY =
  (Deno.env.get("EDGE_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? (Deno.env.get("EDGE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")) ?? "";

const ALLOW_ORIGIN = [
  /* THE PRODUCTION DOMAIN WAS NEVER ON THIS LIST.
     Three functions — challenge-router, omni-router, shortlist-rerank —
     allowed only github.io and localhost, so each would have started
     failing the moment the site answered on truthestate.in, whether or
     not Cloud Run was involved. A CORS rejection reads as a dead network
     in the UI, so they would have looked like an outage with nothing in
     any log to say otherwise. */
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/(www\.)?truthestate\.in$/,
  /^https:\/\/truthestate-[a-z0-9-]+\.a\.run\.app$/,
  /^https:\/\/truthestate-[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/,
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
    const startedAt = Date.now();
    const answer = await routeChallenge(body, {
      apiKey: Deno.env.get("GEMINI_API_KEY"),
      model: MODEL,
      fetchImpl: fetch as unknown as FetchLike,
      generalContext: (unlocked) =>
        buildGeneralContext(
          { url: DB_URL, key: DB_KEY, fetchImpl: fetch as unknown as CtxFetch },
          unlocked,
        ),
      projectExtras: (slugOrName) =>
        buildProjectExtras(
          { url: DB_URL, key: DB_KEY, fetchImpl: fetch as unknown as CtxFetch },
          slugOrName,
        ),
    });

    /* Record the turn — BOTH modes now. The site-wide TruthGuide (general)
       and the per-project "Challenge our read" (project) both log to
       chat_sessions, grouped by session_id; project turns also carry which
       project they were about. Previously only general was logged, so a
       project chat showed up in Amplitude but never in Supabase.

       Needs a sessionId to group under — a project chat that doesn't send one
       has nothing to join and is skipped (logTurn guards this too).

       Awaited rather than fired-and-forgotten because the isolate can be torn
       down the moment we respond, which would drop the write — it is one
       insert to the same region, and logTurn swallows its own failures so a
       logging outage can never cost a visitor an answer. */
    if (answer.ok && body.sessionId) {
      await logTurn(
        { url: DB_URL, key: DB_KEY, fetchImpl: fetch as unknown as LogFetch },
        {
          sessionId: body.sessionId,
          anonId: body.anonId,
          question: body.question ?? "",
          answer: answer.text,
          model: MODEL,
          tier: body.tier,
          latencyMs: Date.now() - startedAt,
          project: body.mode === "general" ? null : (body.projectName ?? body.projectSlug ?? null),
        },
      );
    }

    return new Response(JSON.stringify(answer), { status: 200, headers });
  } catch (e) {
    console.error("[challenge-router]", e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers });
  }
});
