/* ════════════════════════════════════════════════════════════════
   MOCK GATED API — a local stand-in for the two Supabase Edge
   Functions, so the whole gate can be exercised without the real
   project (Supabase is network-blocked from the build sandbox).

   The logic here is a faithful mirror of the Deno edge functions we
   ship — same four checks, same token shape — so porting is trivial:
   Node http → Deno.serve, pieces/*.json → get_model_bundle(slug).

   Endpoints
     POST /mint-token   body {slug, subject}
        gate: origin allowlist · entitlement (grants) · rate-limit
        → { token }  a 5-min HMAC-signed JWT scoped {slug, ent, sub}
     GET  /model?slug=…  header Authorization: Bearer <token>
        gate: valid signature · not expired · slug matches scope
        → the assembled model bundle (the pieces)

   Nothing here is project IP; it's the doorway, not the vault.
   ════════════════════════════════════════════════════════════════ */
import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";

const PORT = Number(process.env.PORT || 8791);
const SECRET = process.env.MODEL_JWT_SECRET || "dev-secret-not-for-prod"; // real: Edge Function env var
const TTL_S = 300; // short-lived token
const ORIGIN_ALLOW = ["http://localhost:" + PORT, "http://127.0.0.1:" + PORT, "https://gauravjainstartup-sys.github.io"];
const RATE_MAX = 5, RATE_WIN_MS = 60_000; // 5 mints / minute / subject

// ── entitlement source of truth (real: SELECT from model_access_grants) ──
const GRANTS = [
  { slug: "signature-global-titanium-spr", subject: "buyer@demo", entitlement: "paid" },
];

// ── the pieces (real: get_model_bundle(slug) via service_role) ──
const PIECES = "db3d/pieces";
const load = (n) => JSON.parse(readFileSync(`${PIECES}/${n}.json`, "utf8"));
function bundle(slug) {
  const site = load("site");
  if (site.slug !== slug) return null;
  return {
    site,
    towers: load("towers"), configs: load("configs"), plates: load("plates"),
    floorplans: load("floorplans"), intelligence: load("intelligence"), vastu: load("vastu_rules"),
  };
}

// ── tiny HMAC JWT (base64url header.payload.sig) — no deps ──
const b64u = (buf) => Buffer.from(buf).toString("base64url");
const sign = (data) => createHmac("sha256", SECRET).update(data).digest();
function mint(payload) {
  const head = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64u(JSON.stringify(payload));
  return `${head}.${body}.${b64u(sign(head + "." + body))}`;
}
function verify(token) {
  const p = String(token || "").split(".");
  if (p.length !== 3) return null;
  const want = sign(p[0] + "." + p[1]);
  let got; try { got = Buffer.from(p[2], "base64url"); } catch { return null; }
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null; // forged/tampered
  let payload; try { payload = JSON.parse(Buffer.from(p[1], "base64url").toString()); } catch { return null; }
  if (payload.exp && Date.now() / 1000 > payload.exp) return null; // expired
  return payload;
}

// ── rate-limit (real: a counter table / KV) ──
const hits = new Map();
function rateOk(key) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < RATE_WIN_MS);
  arr.push(now); hits.set(key, arr);
  return arr.length <= RATE_MAX;
}

// ── handlers (pure-ish; these are what the edge functions run) ──
function handleMintToken({ origin, body }) {
  if (!ORIGIN_ALLOW.includes(origin)) return { code: 403, json: { error: "bad-origin" } };
  const { slug, subject } = body || {};
  if (!slug || !subject) return { code: 400, json: { error: "slug+subject required" } };
  if (!rateOk(`${subject}|${slug}`)) return { code: 429, json: { error: "rate-limited" } };
  const grant = GRANTS.find((g) => g.slug === slug && g.subject === subject);
  if (!grant) return { code: 403, json: { error: "not-entitled" } };
  const exp = Math.floor(Date.now() / 1000) + TTL_S;
  return { code: 200, json: { token: mint({ slug, ent: grant.entitlement, sub: subject, exp }), exp } };
}
function handleModel({ auth, slug }) {
  const token = /^Bearer (.+)$/.exec(auth || "")?.[1];
  const claims = verify(token);
  if (!claims) return { code: 401, json: { error: "invalid-or-expired-token" } };
  if (claims.slug !== slug) return { code: 403, json: { error: "token-scope-mismatch" } };
  const b = bundle(slug);
  if (!b) return { code: 404, json: { error: "unknown-slug" } };
  return { code: 200, json: b };
}

// ── http shell (real: Deno.serve) ──
const server = createServer((req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  const origin = req.headers.origin || "";
  const send = (code, json) => {
    res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": origin || "*", "access-control-allow-headers": "authorization,content-type" });
    res.end(JSON.stringify(json));
  };
  if (req.method === "OPTIONS") return send(204, {});
  if (req.method === "POST" && u.pathname === "/mint-token") {
    let raw = ""; req.on("data", (c) => (raw += c)); req.on("end", () => {
      let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch { /* */ }
      const r = handleMintToken({ origin, body }); send(r.code, r.json);
    });
    return;
  }
  if (req.method === "GET" && u.pathname === "/model") {
    const r = handleModel({ auth: req.headers.authorization, slug: u.searchParams.get("slug") });
    return send(r.code, r.json);
  }
  send(404, { error: "no-route" });
});

if (process.argv[2] !== "--silent") server.listen(PORT, () => console.log(`[mock-api] gated model API on :${PORT}`));
export { handleMintToken, handleModel, mint, verify, bundle };
