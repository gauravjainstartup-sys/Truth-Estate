/* ════════════════════════════════════════════════════════════════
   SHARED GATE — the four checks, portable.

   1:1 port of db3d/mock-api.mjs's gate logic to Web APIs only
   (crypto.subtle, btoa/atob) so the SAME file runs in the Supabase
   Edge runtime (Deno) and under Node 22 `--experimental-strip-types`
   — which is how db3d/test-edge-parity.mjs proves this port speaks
   exactly the mock's token dialect (byte-identical JWTs) and keeps
   the same check order: origin → fields → rate-limit → entitlement.

   Nothing here is project IP; it's the doorway, not the vault.
   ════════════════════════════════════════════════════════════════ */

const te = new TextEncoder();
const td = new TextDecoder();

/* ── base64url (no Buffer — Deno-safe) ── */
function b64uBytes(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const b64uJson = (o: unknown): string => b64uBytes(te.encode(JSON.stringify(o)));
function b64uDecode(s: string): Uint8Array | null {
  try {
    const mod = s.length % 4;
    if (mod === 1) return null;
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + (mod === 2 ? "==" : mod === 3 ? "=" : ""));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch { return null; }
}

/* ── tiny HMAC JWT (header.payload.sig) — same shape as the mock ── */
async function hmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", te.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}
export async function mint(payload: Record<string, unknown>, secret: string): Promise<string> {
  const head = b64uJson({ alg: "HS256", typ: "JWT" });
  const body = b64uJson(payload);
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret, "sign"), te.encode(head + "." + body));
  return `${head}.${body}.${b64uBytes(new Uint8Array(sig))}`;
}
export async function verify(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const p = String(token || "").split(".");
  if (p.length !== 3) return null;
  const sig = b64uDecode(p[2]);
  if (!sig) return null;
  const okSig = await crypto.subtle.verify("HMAC", await hmacKey(secret, "verify"), sig as BufferSource, te.encode(p[0] + "." + p[1])); // constant-time
  if (!okSig) return null; // forged/tampered
  const bodyBytes = b64uDecode(p[1]);
  if (!bodyBytes) return null;
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(td.decode(bodyBytes)); } catch { return null; }
  const exp = payload.exp as number | undefined;
  if (exp && Date.now() / 1000 > exp) return null; // expired
  return payload;
}

/* ── rate-limit — sliding window, per Edge Function instance.
      (Same semantics as the mock. A counter table is the upgrade path
      if multi-instance fan-out ever makes this too generous.) ── */
export function makeRateLimiter(max: number, winMs: number): (key: string) => boolean {
  const hits = new Map<string, number[]>();
  return (key: string) => {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < winMs);
    arr.push(now);
    hits.set(key, arr);
    return arr.length <= max;
  };
}

/* ── the two handlers — pure; deps injected so the Edge shells bind
      Supabase and the parity test binds in-memory stand-ins ── */
export type Gated = { code: number; json: Record<string, unknown> };
export type MintDeps = {
  secret: string;
  originAllow: string[];
  rateOk: (key: string) => boolean;
  getGrant: (slug: string, subject: string) => Promise<{ entitlement: string } | null>;
  ttlS?: number; // default 300 — short-lived token
};
export async function handleMintToken(
  req: { origin: string; body: { slug?: string; subject?: string } | null },
  deps: MintDeps,
): Promise<Gated> {
  if (!deps.originAllow.includes(req.origin)) return { code: 403, json: { error: "bad-origin" } };
  const { slug, subject } = req.body || {};
  if (!slug || !subject) return { code: 400, json: { error: "slug+subject required" } };
  if (!deps.rateOk(`${subject}|${slug}`)) return { code: 429, json: { error: "rate-limited" } };
  const grant = await deps.getGrant(slug, subject);
  if (!grant) return { code: 403, json: { error: "not-entitled" } };
  const exp = Math.floor(Date.now() / 1000) + (deps.ttlS ?? 300);
  return { code: 200, json: { token: await mint({ slug, ent: grant.entitlement, sub: subject, exp }, deps.secret), exp } };
}

export type ModelDeps = {
  secret: string;
  getBundle: (slug: string) => Promise<Record<string, unknown> | null>;
};
export async function handleModel(
  req: { auth: string | null; slug: string | null },
  deps: ModelDeps,
): Promise<Gated> {
  const m = /^Bearer (.+)$/.exec(req.auth || "");
  const claims = m ? await verify(m[1], deps.secret) : null;
  if (!claims) return { code: 401, json: { error: "invalid-or-expired-token" } };
  if (claims.slug !== req.slug) return { code: 403, json: { error: "token-scope-mismatch" } };
  const b = req.slug ? await deps.getBundle(req.slug) : null;
  if (!b) return { code: 404, json: { error: "unknown-slug" } };
  return { code: 200, json: b };
}

/* ── CORS — echo only allowlisted origins (hardening over the mock,
      which echoed blindly; the browser enforces, curl is unaffected,
      and the mint handler still 403s bad origins either way) ── */
export function corsHeaders(origin: string, allow: string[]): Record<string, string> {
  const h: Record<string, string> = {
    "content-type": "application/json",
    "access-control-allow-headers": "authorization,content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    vary: "origin",
  };
  if (!origin) h["access-control-allow-origin"] = "*"; // curl / same-origin
  else if (allow.includes(origin)) h["access-control-allow-origin"] = origin;
  return h;
}

/* ── env — Deno in production, process under the Node parity test ── */
export function envGet(k: string): string {
  const g = globalThis as {
    Deno?: { env: { get(k: string): string | undefined } };
    process?: { env: Record<string, string | undefined> };
  };
  return g.Deno?.env.get(k) ?? g.process?.env[k] ?? "";
}
