/* ════════════════════════════════════════════════════════════════
   EDGE FUNCTION · grant-entitlement — write model_access_grants rows

   The entitlement WRITER: the site's lead/unlock/membership flows
   (src/lib/modelAccess.ts, fire-and-forget) call this to record who
   unlocked what; mint-token then honours those rows. RLS keeps the
   table itself invisible — this function (service_role) is the only
   write path, as get_model_bundle is the only read path.

   Trust model — self-service writes are CLAMPED to 'lead': giving us
   your contact makes you a lead, so that tier is honestly self-service.
   'member'/'paid' stick only when the caller presents x-grant-key ==
   GRANT_ADMIN_KEY (payment webhook / ops) — a static site cannot hold
   that secret, so client "payments" (today simulated) cannot mint paid
   tiers. Any grant tier is enough for mint-token; the tier only feeds
   the parent UI + future per-tier scoping.

   POST {slug: string|string[], subject, entitlement} → {granted, entitlement}
   Gate: origin allowlist · shape validation · 10/min/subject rate-limit.
   Deploy with --no-verify-jwt (see db3d/RUNBOOK.md).
   ════════════════════════════════════════════════════════════════ */
import { corsHeaders, envGet, makeRateLimiter } from "../_shared/gate.ts";

const originAllow = (): string[] => [
  "https://gauravjainstartup-sys.github.io",
  ...envGet("EXTRA_ORIGIN").split(",").filter(Boolean),
];
const rateOk = makeRateLimiter(10, 60_000); // writes are chattier than mints
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,78}$/;
const TIERS = ["lead", "member", "paid"];

export async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin") ?? "";
  const allow = originAllow();
  const headers = corsHeaders(origin, allow);
  const send = (code: number, json: Record<string, unknown>) =>
    new Response(JSON.stringify(json), { status: code, headers });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return send(404, { error: "no-route" });
  const base = envGet("SUPABASE_URL"), key = envGet("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !key) return send(500, { error: "misconfigured" });
  if (!allow.includes(origin)) return send(403, { error: "bad-origin" });

  let body: { slug?: string | string[]; subject?: string; entitlement?: string } = {};
  try { body = await req.json(); } catch { /* handled below */ }
  const slugs = (Array.isArray(body.slug) ? body.slug : [body.slug || ""]).filter(Boolean);
  const subject = String(body.subject || "").trim();
  const asked = String(body.entitlement || "");
  if (!slugs.length || slugs.length > 40 || !slugs.every((s) => SLUG_RE.test(String(s)))) return send(400, { error: "bad-slug" });
  if (subject.length < 3 || subject.length > 120) return send(400, { error: "bad-subject" });
  if (!TIERS.includes(asked)) return send(400, { error: "bad-entitlement" });
  if (!rateOk(subject)) return send(429, { error: "rate-limited" });

  const adminKey = envGet("GRANT_ADMIN_KEY");
  const trusted = Boolean(adminKey) && req.headers.get("x-grant-key") === adminKey;
  const entitlement = trusted ? asked : "lead"; // self-service is a lead, whatever it claims

  const rows = slugs.map((slug) => ({ slug, subject, entitlement }));
  const r = await fetch(`${base}/rest/v1/model_access_grants?on_conflict=slug,subject,entitlement`, {
    method: "POST",
    headers: {
      apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json",
      prefer: "resolution=ignore-duplicates,return=minimal", // idempotent re-grants
    },
    body: JSON.stringify(rows),
  });
  if (!r.ok) return send(502, { error: "grant-write-failed" });
  return send(200, { granted: rows.length, entitlement });
}

const D = (globalThis as { Deno?: { serve?: (h: (r: Request) => Promise<Response>) => void } }).Deno;
if (D?.serve) D.serve(handler); // Deno Edge runtime only; the parity test imports `handler` under Node
