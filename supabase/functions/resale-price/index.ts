/* ════════════════════════════════════════════════════════════════
   RESALE-PRICE — Supabase Edge Function (Deno).

   POST { project, city } → { ok:true, price }  (price may be "" when the
   market can't be read reliably) | { ok:false } on a hard error. The Deal
   Room step 2 calls this to show the project's current resale price under
   the buyer's target. Grounded in live Google Search; never a guess.

   The pure logic lives in core.ts (offline-testable under Node). This file
   only wires Deno.serve / env / CORS around it.

   Deploy:
     supabase functions deploy resale-price --no-verify-jwt --project-ref lyetvabfgaidvqrbmaoy
   Secrets (GEMINI_API_KEY is already set for challenge-router):
     supabase secrets set GEMINI_API_KEY=<AI Studio key>
     # optional override: supabase secrets set RESALE_MODEL=gemini-2.5-pro
   ════════════════════════════════════════════════════════════════ */
import { getResalePrice, type ResaleBody, type FetchLike } from "./core.ts";

/* Top model with thinking, per the product call — highest accuracy for a
   grounded lookup that must reject look-alike projects and stale posts. */
const MODEL = Deno.env.get("RESALE_MODEL") ?? "gemini-2.5-pro";

const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/(www\.)?truthestate\.in$/,
  /* A `tag---` prefix also matches Cloud Run revision URLs (the `dev---…`
     staging tag), so the Deal Room works on the staging revision too. */
  /^https:\/\/([a-z0-9-]+---)?truthestate-[a-z0-9-]+\.a\.run\.app$/,
  /^https:\/\/([a-z0-9-]+---)?truthestate-[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/,
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
    const body = (await req.json()) as ResaleBody;
    const answer = await getResalePrice(body, {
      apiKey: Deno.env.get("GEMINI_API_KEY"),
      model: MODEL,
      fetchImpl: fetch as unknown as FetchLike,
    });
    return new Response(JSON.stringify(answer), { status: 200, headers });
  } catch (e) {
    console.error("[resale-price]", e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers });
  }
});
