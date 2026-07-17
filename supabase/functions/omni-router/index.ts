/* ════════════════════════════════════════════════════════════════
   OMNI-ROUTER — Supabase Edge Function entry (Deno).

   POST { q, chips?, project? }  →  { ok:true, ...RouterAnswer }
                                 |  { ok:false }   (client falls back
                                    to the deterministic Phase-1 path)

   The function fetches the site's build-published /omni-index.json —
   the EXACT index the canvas renders from — caches it in module
   scope, and runs the Claude tool-use loop in core.ts over it.

   Deploy (see README.md next to this file):
     supabase functions deploy omni-router --no-verify-jwt
     supabase secrets set ANTHROPIC_API_KEY=sk-ant-…
   ════════════════════════════════════════════════════════════════ */
import Anthropic from "npm:@anthropic-ai/sdk";
import { routeAsk, type AskBody } from "./core.ts";
import type { OmniIndex } from "./omni.ts";

const INDEX_URL =
  Deno.env.get("OMNI_INDEX_URL") ??
  "https://gauravjainstartup-sys.github.io/Truth-Estate/omni-index.json";
const INDEX_TTL_MS = 10 * 60 * 1000;

/* browser origins allowed to call the router */
const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

let cached: { at: number; index: OmniIndex } | null = null;

async function loadIndex(): Promise<OmniIndex> {
  if (cached && Date.now() - cached.at < INDEX_TTL_MS) return cached.index;
  try {
    const res = await fetch(INDEX_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`index HTTP ${res.status}`);
    const index = (await res.json()) as OmniIndex;
    if (!Array.isArray(index.projects) || !index.projects.length) throw new Error("index empty");
    cached = { at: Date.now(), index };
    return index;
  } catch (e) {
    if (cached) return cached.index; // stale beats dead
    throw e;
  }
}

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
  if (req.method !== "POST")
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), { status: 405, headers });

  try {
    const body = (await req.json()) as AskBody;
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("[omni-router] ANTHROPIC_API_KEY secret not set");
      return new Response(JSON.stringify({ ok: false, error: "router not configured" }), { status: 200, headers });
    }
    const index = await loadIndex();
    const client = new Anthropic({ apiKey });
    const answer = await routeAsk(
      { create: (params) => client.messages.create(params as never) as never, index },
      body,
    );
    if (!answer) return new Response(JSON.stringify({ ok: false }), { status: 200, headers });
    return new Response(JSON.stringify({ ok: true, ...answer }), { status: 200, headers });
  } catch (e) {
    console.error("[omni-router]", e instanceof Error ? e.message : e);
    /* 200 + ok:false — the canvas treats any non-ok as "router absent"
       and stays on its deterministic answer; never a user-facing error */
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers });
  }
});
