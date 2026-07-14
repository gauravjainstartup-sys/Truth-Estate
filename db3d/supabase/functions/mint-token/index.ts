/* ════════════════════════════════════════════════════════════════
   EDGE FUNCTION · mint-token — POST {slug, subject} → 5-min token

   Gate: origin allowlist · entitlement (model_access_grants, via
   service_role PostgREST — RLS keeps the table invisible to anon) ·
   rate-limit (5/min/subject·slug) · HMAC-signed JWT from
   MODEL_JWT_SECRET. 1:1 port of the proven mock (db3d/mock-api.mjs);
   db3d/test-edge-parity.mjs drives THIS file under Node to prove it.

   Deploy with --no-verify-jwt: the platform's Supabase-JWT check is
   replaced by this stronger four-check gate (see db3d/RUNBOOK.md).
   ════════════════════════════════════════════════════════════════ */
import { corsHeaders, envGet, handleMintToken, makeRateLimiter } from "../_shared/gate.ts";

const originAllow = (): string[] => [
  "https://gauravjainstartup-sys.github.io",
  ...envGet("EXTRA_ORIGIN").split(",").filter(Boolean), // custom domain / local test origins
];
const rateOk = makeRateLimiter(5, 60_000); // per instance — same semantics as the mock

/* entitlement source of truth: model_access_grants (service_role read;
   non-expired only; strongest wins if a subject holds several) */
async function getGrant(slug: string, subject: string): Promise<{ entitlement: string } | null> {
  const base = envGet("SUPABASE_URL"), key = envGet("SUPABASE_SERVICE_ROLE_KEY");
  const u = `${base}/rest/v1/model_access_grants?slug=eq.${encodeURIComponent(slug)}` +
    `&subject=eq.${encodeURIComponent(subject)}&select=entitlement,expires_at`;
  const r = await fetch(u, { headers: { apikey: key, authorization: `Bearer ${key}` } });
  if (!r.ok) return null;
  const rows = (await r.json()) as { entitlement: string; expires_at: string | null }[];
  const now = Date.now();
  const rank: Record<string, number> = { paid: 3, member: 2, lead: 1 };
  const live = rows
    .filter((g) => !g.expires_at || Date.parse(g.expires_at) > now)
    .sort((a, b) => (rank[b.entitlement] ?? 0) - (rank[a.entitlement] ?? 0));
  return live.length ? { entitlement: live[0].entitlement } : null;
}

export async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin") ?? "";
  const allow = originAllow();
  const headers = corsHeaders(origin, allow);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "no-route" }), { status: 404, headers });
  const secret = envGet("MODEL_JWT_SECRET");
  if (!secret || !envGet("SUPABASE_URL") || !envGet("SUPABASE_SERVICE_ROLE_KEY")) {
    return new Response(JSON.stringify({ error: "misconfigured" }), { status: 500, headers }); // never mint on an empty secret
  }
  let body: { slug?: string; subject?: string } | null = null;
  try { body = await req.json(); } catch { /* handled as missing fields */ }
  const r = await handleMintToken({ origin, body }, { secret, originAllow: allow, rateOk, getGrant });
  return new Response(JSON.stringify(r.json), { status: r.code, headers });
}

const D = (globalThis as { Deno?: { serve?: (h: (r: Request) => Promise<Response>) => void } }).Deno;
if (D?.serve) D.serve(handler); // Deno Edge runtime only; the parity test imports `handler` under Node
