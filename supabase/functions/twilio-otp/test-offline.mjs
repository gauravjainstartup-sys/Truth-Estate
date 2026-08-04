/* Offline harness for twilio-otp. Node runs core.ts directly via TS
   type-stripping — no Deno, no Twilio, no database, no network.
     node supabase/functions/twilio-otp/test-offline.mjs

   Covers the decisions that carry money/identity risk: the +91 refusal,
   the send + check flows against a faked Twilio/Supabase, account
   resolve-vs-create, and that the minted session is a byte-valid HS256
   JWT (same secret the database will verify it with). */
import { handleTwilioOtp, mintSession, findAccountPath, corsHeaders, digitsOf } from "./core.ts";

let pass = 0, fail = 0;
const ok = (cond, label) => {
  if (cond) { pass++; console.log(`✓ ${label}`); }
  else { fail++; console.error(`✗ ${label}`); }
};

const ENV = { DB_URL: "https://db.example", SERVICE_KEY: "svc", JWT_SECRET: "", TW_SID: "AC1", TW_TOKEN: "tok", TW_SERVICE: "VA1" };
const AT = () => 1_700_000_000_000; // fixed clock so JWT claims are deterministic

/* Fake fetch: route by URL substring; record every call. Each route gives
   { status, json, ok? } — ok defaults to 2xx. */
function makeFetch(routes) {
  const calls = [];
  const f = async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, method: init.method || "GET", headers: init.headers || {}, body: init.body });
    for (const [pat, resp] of routes) {
      if (u.includes(pat)) {
        const r = typeof resp === "function" ? resp(u, init) : resp;
        const status = r.status ?? 200;
        return { ok: r.ok ?? (status >= 200 && status < 300), status, json: async () => r.json ?? {}, text: async () => r.text ?? JSON.stringify(r.json ?? {}) };
      }
    }
    return { ok: false, status: 404, json: async () => ({}), text: async () => "no route" };
  };
  return { f, calls };
}

const b64urlDecode = (s) => JSON.parse(Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));

/* ── pure helpers ───────────────────────────────────────────────── */
ok(digitsOf("+44 7911-123456") === "447911123456", "digitsOf strips non-digits");

const path = findAccountPath("+447911123456", "447911123456");
ok(path.includes("phone.eq.%2B447911123456"), "findAccountPath matches E.164 (encoded +)");
ok(path.includes("phone.eq.447911123456"), "findAccountPath matches bare digits");
ok(path.includes("email.eq.phone_447911123456%40truthestate.com"), "findAccountPath matches synthetic .com email");
ok(path.includes("email.eq.intl_447911123456%40truthestate.in"), "findAccountPath matches synthetic .in email");

ok(corsHeaders("https://truthestate.in")["Access-Control-Allow-Origin"] === "https://truthestate.in", "CORS echoes an allowed origin");
ok(corsHeaders("https://evil.example")["Access-Control-Allow-Origin"] === "https://gauravjainstartup-sys.github.io", "CORS falls back for a disallowed origin");

/* ── mintSession ────────────────────────────────────────────────── */
ok((await mintSession("u1", { ...ENV, JWT_SECRET: "" }, AT())) === null, "no PROJECT_JWT_SECRET → no session (soft mode)");
{
  const s = await mintSession("u1", { ...ENV, JWT_SECRET: "shhh" }, AT());
  const [h, p, sig] = s.access_token.split(".");
  const head = b64urlDecode(h), pay = b64urlDecode(p);
  ok(head.alg === "HS256" && head.typ === "JWT", "JWT header is HS256");
  ok(pay.sub === "u1" && pay.role === "authenticated" && pay.aud === "authenticated", "JWT claims: sub/role/aud");
  ok(pay.iss === "https://db.example/auth/v1", "JWT iss points at this project's auth");
  ok(pay.exp - pay.iat === 7 * 24 * 60 * 60, "JWT ttl is 7 days");
  // the signature actually verifies under the same secret the DB will use
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("shhh"), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const sigBytes = Uint8Array.from(Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64"));
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(`${h}.${p}`));
  ok(valid, "JWT signature verifies (byte-identical to chat-signin mint)");
}

/* ── guards ─────────────────────────────────────────────────────── */
ok((await handleTwilioOtp({ action: "send", dial: "44", phone: "7911123456" }, { env: { ...ENV, TW_SID: "" }, fetchImpl: makeFetch([]).f })).json.ok === false, "missing Twilio env → refused");
ok((await handleTwilioOtp({ action: "send", dial: "91", phone: "9958777313" }, { env: ENV, fetchImpl: makeFetch([]).f })).json.error.includes("+91"), "+91 is refused (belongs to MSG91)");
ok((await handleTwilioOtp({ action: "send", dial: "44", phone: "123" }, { env: ENV, fetchImpl: makeFetch([]).f })).json.ok === false, "too-short local number → refused");

/* ── SEND ───────────────────────────────────────────────────────── */
{
  const { f, calls } = makeFetch([["verify.twilio.com", { status: 201, json: { status: "pending" } }]]);
  const r = await handleTwilioOtp({ action: "send", dial: "44", phone: "7911123456" }, { env: ENV, fetchImpl: f });
  ok(r.json.ok === true && r.json.status === "pending", "send → ok:true, status pending");
  const sent = calls.find((c) => c.url.includes("Verifications"));
  const form = new URLSearchParams(sent.body);
  ok(form.get("To") === "+447911123456" && form.get("Channel") === "sms", "send posts To=E.164, Channel=sms to Twilio Verify");
}
{
  const { f } = makeFetch([["verify.twilio.com", { status: 400, json: { message: "bad" } }]]);
  const r = await handleTwilioOtp({ action: "send", dial: "44", phone: "7911123456" }, { env: ENV, fetchImpl: f });
  ok(r.json.ok === false, "Twilio send failure → ok:false, no throw");
}

/* ── CHECK: wrong code ──────────────────────────────────────────── */
{
  const { f } = makeFetch([["VerificationCheck", { status: 200, json: { status: "pending" } }]]);
  const r = await handleTwilioOtp({ action: "check", dial: "44", phone: "7911123456", code: "000000" }, { env: ENV, fetchImpl: f });
  ok(r.json.ok === false, "check not-approved → ok:false");
}

/* ── CHECK: approved, EXISTING account ──────────────────────────── */
{
  const { f, calls } = makeFetch([
    ["VerificationCheck", { status: 200, json: { status: "approved" } }],
    ["user_profiles?select=id", { status: 200, json: [{ id: "u-existing" }] }],
    ["rpc/link_verified_phone", { status: 200, json: { chats_claimed: 2, leads_claimed: 1 } }],
    ["/rest/v1/events", { status: 201, json: {} }],
  ]);
  const r = await handleTwilioOtp({ action: "check", dial: "44", phone: "7911123456", code: "123456", anonId: "a1", sessionId: "s1", name: "Ada" }, { env: ENV, fetchImpl: f, now: AT });
  ok(r.json.ok === true && r.json.userId === "u-existing" && r.json.verified === true, "approved + existing → signs in that account");
  ok(r.json.chatsClaimed === 2 && r.json.leadsClaimed === 1, "claim counts surfaced from link_verified_phone");
  ok(!r.json.session, "no session while PROJECT_JWT_SECRET unset (soft mode)");
  ok(!calls.some((c) => c.url.includes("/auth/v1/admin/users")), "existing account is NOT re-created");
  const link = calls.find((c) => c.url.includes("link_verified_phone"));
  ok(JSON.parse(link.body).p_user_id === "u-existing" && JSON.parse(link.body).p_phone === "+447911123456", "link_verified_phone gets the resolved id + canonical E.164");
}

/* ── CHECK: approved, NO account → create ───────────────────────── */
{
  const { f, calls } = makeFetch([
    ["VerificationCheck", { status: 200, json: { status: "approved" } }],
    ["user_profiles?select=id", { status: 200, json: [] }],
    ["/auth/v1/admin/users", { status: 200, json: { id: "u-new" } }],
    ["rpc/link_verified_phone", { status: 200, json: { chats_claimed: 0, leads_claimed: 0 } }],
    ["/rest/v1/events", { status: 201, json: {} }],
  ]);
  const r = await handleTwilioOtp({ action: "check", dial: "44", phone: "7911123456", code: "123456" }, { env: ENV, fetchImpl: f });
  ok(r.json.ok === true && r.json.userId === "u-new", "approved + no account → creates one and signs it in");
  const create = calls.find((c) => c.url.includes("/auth/v1/admin/users"));
  const cbody = JSON.parse(create.body);
  ok(cbody.phone === "+447911123456" && cbody.phone_confirm === true, "admin create: E.164 + phone_confirm true (Twilio proved it)");
  ok(cbody.email === "phone_447911123456@truthestate.com", "admin create: synthetic email is deterministic");
}

/* ── CHECK: approved + session minted (secret set) ──────────────── */
{
  const { f } = makeFetch([
    ["VerificationCheck", { status: 200, json: { status: "approved" } }],
    ["user_profiles?select=id", { status: 200, json: [{ id: "u-existing" }] }],
    ["rpc/link_verified_phone", { status: 200, json: { chats_claimed: 0, leads_claimed: 0 } }],
    ["/rest/v1/events", { status: 201, json: {} }],
  ]);
  const r = await handleTwilioOtp({ action: "check", dial: "44", phone: "7911123456", code: "123456" }, { env: { ...ENV, JWT_SECRET: "shhh" }, fetchImpl: f, now: AT });
  ok(r.json.session && typeof r.json.session.access_token === "string" && r.json.session.access_token.split(".").length === 3, "session minted when PROJECT_JWT_SECRET is set");
  ok(b64urlDecode(r.json.session.access_token.split(".")[1]).sub === "u-existing", "minted session is bound to the signed-in user");
}

console.log(`\n${pass} checks passed${fail ? `, ${fail} FAILED` : ""}.`);
process.exit(fail ? 1 : 0);
