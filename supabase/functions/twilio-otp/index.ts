/* ════════════════════════════════════════════════════════════════
   TWILIO-OTP — real verification for NON-+91 numbers.

   The +91 path is untouched: the client sends via MSG91's send-otp and
   verifies + gets its session through chat-signin. International numbers
   never had a real OTP — chat-signin waves them through unverified
   (phone_verified stays false, no session). This function gives them a
   genuine one, through Twilio Verify, WITHOUT modifying chat-signin
   (which the live AI-Studio site also depends on).

   This file is the Deno.serve SHELL only — CORS, method/JSON parsing,
   and injecting the real fetch + Deno.env. All the logic lives in
   core.ts, so it can be exercised offline (test-offline.mjs) exactly as
   capture-lead / brief / entitlements are.

   Two actions, both server-side so the browser never proves its own
   identity — the same boundary chat-signin and 0009 keep:

     POST { action:"send",  dial, phone }
       → Twilio Verify sends an SMS code.  { ok:true, status }

     POST { action:"check", dial, phone, code, anonId?, sessionId?, name? }
       → Twilio Verify checks the code; on "approved" we resolve/create the
         account, claim this device's history, and mint a REAL session
         (identical HS256 to chat-signin's mintSession — inert until
         PROJECT_JWT_SECRET is set).  { ok:true, userId, verified:true, session? }

   Secrets (Supabase → Edge Functions → Secrets):
     TWILIO_ACCOUNT_SID · TWILIO_AUTH_TOKEN · TWILIO_VERIFY_SERVICE_SID
     SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · PROJECT_JWT_SECRET

   Deploy:
     supabase functions deploy twilio-otp --no-verify-jwt
   ════════════════════════════════════════════════════════════════ */

import { corsHeaders, handleTwilioOtp, type Env } from "./core.ts";

const env: Env = {
  DB_URL: Deno.env.get("SUPABASE_URL") ?? "",
  SERVICE_KEY: (Deno.env.get("EDGE_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "",
  JWT_SECRET: Deno.env.get("PROJECT_JWT_SECRET") ?? "",
  TW_SID: Deno.env.get("TWILIO_ACCOUNT_SID") ?? "",
  TW_TOKEN: Deno.env.get("TWILIO_AUTH_TOKEN") ?? "",
  TW_SERVICE: Deno.env.get("TWILIO_VERIFY_SERVICE_SID") ?? "",
};

Deno.serve(async (req: Request) => {
  const h = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "method" }), { status: 200, headers });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty / malformed body → handled as unknown action */ }

  try {
    const { status, json } = await handleTwilioOtp(body, { env, fetchImpl: fetch, now: () => Date.now() });
    return new Response(JSON.stringify(json), { status, headers });
  } catch (e) {
    console.error("[twilio-otp]", e instanceof Error ? e.message : String(e));
    return new Response(JSON.stringify({ ok: false, error: "Couldn't complete that just now. Try again in a moment." }), { status: 200, headers });
  }
});
