/* ════════════════════════════════════════════════════════════════
   CAPTURE-LEAD — Supabase Edge Function (Deno).

   The write path for public.leads. Until this existed, every lead the
   site captured was stored in the visitor's own browser and never
   reached the business.

   POST { name?, email?, phone?, intent, project?, docs?, identity?,
          message?, payload?, sessionId?, source?, referrer? }
     → { ok: true }                on success
     → { ok: false, reason }       on a rejected or failed write

   Always answers HTTP 200. The client treats this as fire-and-forget and
   keeps its own localStorage copy, so a non-200 would only produce
   console noise in the visitor's browser for no benefit.

   Deploy:
     supabase functions deploy capture-lead --no-verify-jwt
   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
   ════════════════════════════════════════════════════════════════ */
import { captureLead, type FetchLike, type LeadBody } from "./core.ts";

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const DB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/(www\.)?truthestate\.in$/,
  /* Cloud Run. The site now runs from a container before the domain is
     cut over, and its .run.app host was on no allowlist — so sign-up
     failed at chat-signin with "couldn't reach us" while send-otp, which
     lives outside this repo and is permissive, had already sent the code.
     A CORS rejection is indistinguishable from a dead network in the UI.
     Both URL forms Cloud Run issues: the newer hash style and the older
     project-number style the existing service still uses. */
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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, reason: "method" }), { status: 200, headers });
  }

  try {
    const body = (await req.json()) as LeadBody;
    const result = await captureLead(body, {
      url: DB_URL,
      key: DB_KEY,
      fetchImpl: fetch as unknown as FetchLike,
      userAgent: req.headers.get("user-agent"),
    });
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (e) {
    console.error("[capture-lead]", e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ ok: false, reason: "bad request" }), { status: 200, headers });
  }
});
