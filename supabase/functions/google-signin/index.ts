/* ════════════════════════════════════════════════════════════════
   GOOGLE-SIGNIN — resolve a Google login to ONE canonical account and
   mint that account's session (so Google and phone converge on a single
   identity). Thin Deno.serve shell; logic + offline test in core.ts.

   POST { action:"signin", googleToken }
     → verify the Google identity, find the account linked by google_sub
       (or treat this Google account as its own), mint its session.

   POST { action:"link", googleToken, linkToken }
     → the caller proves a phone account (linkToken = its HS256 session,
       signature-verified here) and a Google identity (googleToken); stamp
       google_sub onto the phone account, fold the Google account in, mint
       the phone account's session.

   Secrets: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · PROJECT_JWT_SECRET
   Deploy:  supabase functions deploy google-signin --no-verify-jwt
   ════════════════════════════════════════════════════════════════ */

import { corsHeaders, handleGoogleSignin, type Env } from "./core.ts";

const env: Env = {
  DB_URL: Deno.env.get("SUPABASE_URL") ?? "",
  SERVICE_KEY: (Deno.env.get("EDGE_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "",
  JWT_SECRET: Deno.env.get("PROJECT_JWT_SECRET") ?? "",
};

Deno.serve(async (req: Request) => {
  const h = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "method" }), { status: 200, headers });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* malformed → handled as bad action */ }

  try {
    const { status, json } = await handleGoogleSignin(body, { env, fetchImpl: fetch, now: () => Date.now() });
    return new Response(JSON.stringify(json), { status, headers });
  } catch (e) {
    console.error("[google-signin]", e instanceof Error ? e.message : String(e));
    return new Response(JSON.stringify({ ok: false, error: "Couldn't complete that just now. Try again in a moment." }), { status: 200, headers });
  }
});
