/* Offline harness for google-signin. No Deno, no network, no database.
     node supabase/functions/google-signin/test-offline.mjs

   Focus: the security-critical bits — a FORGED phone token must never link
   a Google identity onto someone's account; a valid one must; and signin
   must resolve to the account that owns the google_sub. */
import { handleGoogleSignin, verifyOurToken, mintSession } from "./core.ts";

let pass = 0, fail = 0;
const ok = (c, l) => { if (c) { pass++; console.log(`✓ ${l}`); } else { fail++; console.error(`✗ ${l}`); } };

const ENV = { DB_URL: "https://db.example", SERVICE_KEY: "svc", JWT_SECRET: "shhh" };
const AT = () => 1_700_000_000_000;

/* Fake fetch routed by URL substring; records calls. Each route → {status,json}. */
function makeFetch(routes) {
  const calls = [];
  const f = async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, method: init.method || "GET", body: init.body });
    for (const [pat, resp] of routes) {
      if (u.includes(pat)) {
        const r = typeof resp === "function" ? resp(u, init) : resp;
        const status = r.status ?? 200;
        return { ok: status >= 200 && status < 300, status, json: async () => r.json ?? {}, text: async () => JSON.stringify(r.json ?? {}) };
      }
    }
    return { ok: false, status: 404, json: async () => ({}), text: async () => "no route" };
  };
  return { f, calls };
}

const GOOGLE_USER = { id: "goog-oauth-uid", email: "gj@gmail.com", identities: [{ provider: "google", id: "google-sub-123" }], user_metadata: { full_name: "GJ", avatar_url: "http://x/a.png" } };
const userRoute = ["/auth/v1/user", { status: 200, json: GOOGLE_USER }];

/* ── token verification (the security core) ─────────────────────── */
{
  const minted = await mintSession("phone-acct-A", ENV, AT());
  const good = await verifyOurToken(minted.access_token, ENV, AT());
  ok(good?.sub === "phone-acct-A", "valid HS256 token → sub extracted");

  // tamper the payload but keep the old signature → must fail
  const [h, , s] = minted.access_token.split(".");
  const forgedPayload = Buffer.from(JSON.stringify({ sub: "victim-acct", role: "authenticated", exp: 9999999999 })).toString("base64url");
  const forged = `${h}.${forgedPayload}.${s}`;
  ok((await verifyOurToken(forged, ENV, AT())) === null, "forged token (tampered sub) → REJECTED");

  // wrong secret → fail
  ok((await verifyOurToken(minted.access_token, { ...ENV, JWT_SECRET: "different" }, AT())) === null, "token under a different secret → rejected");
}

/* ── invalid google token ───────────────────────────────────────── */
{
  const { f } = makeFetch([["/auth/v1/user", { status: 401, json: {} }]]);
  const r = await handleGoogleSignin({ action: "signin", googleToken: "bad" }, { env: ENV, fetchImpl: f, now: AT });
  ok(r.json.ok === false, "unverifiable Google token → refused");
}

/* ── SIGNIN: google_sub already linked to a phone account ───────── */
{
  const { f, calls } = makeFetch([
    userRoute,
    ["google_sub=eq.google-sub-123", { status: 200, json: [{ id: "phone-acct-A" }] }],
    ["rpc/merge_user_profiles", { status: 200, json: {} }],
  ]);
  const r = await handleGoogleSignin({ action: "signin", googleToken: "g" }, { env: ENV, fetchImpl: f, now: AT });
  ok(r.json.ok === true && r.json.userId === "phone-acct-A", "signin resolves to the account that owns the google_sub");
  ok(r.json.session && r.json.session.access_token.split(".").length === 3, "mints a session for the canonical account");
  const merge = calls.find((c) => c.url.includes("merge_user_profiles"));
  ok(merge && JSON.parse(merge.body).p_target === "phone-acct-A" && JSON.parse(merge.body).p_source === "goog-oauth-uid", "folds the fresh OAuth account into the canonical one");
}

/* ── SIGNIN: brand-new Google user (no link) ────────────────────── */
{
  const { f, calls } = makeFetch([
    userRoute,
    ["google_sub=eq.google-sub-123", { status: 200, json: [] }],  // no match
    ["user_profiles?on_conflict=id", { status: 201, json: {} }],
  ]);
  const r = await handleGoogleSignin({ action: "signin", googleToken: "g" }, { env: ENV, fetchImpl: f, now: AT });
  ok(r.json.ok === true && r.json.userId === "goog-oauth-uid", "new Google user → its own account is canonical");
  ok(calls.some((c) => c.url.includes("on_conflict=id")), "upserts a profile row (with google_sub) for the new user");
}

/* ── LINK: valid phone token → stamps + folds ───────────────────── */
{
  const minted = await mintSession("phone-acct-A", ENV, AT());
  const { f, calls } = makeFetch([
    userRoute,
    ["user_profiles?id=eq.phone-acct-A", { status: 204, json: {} }],
    ["rpc/merge_user_profiles", { status: 200, json: {} }],
  ]);
  const r = await handleGoogleSignin({ action: "link", googleToken: "g", linkToken: minted.access_token }, { env: ENV, fetchImpl: f, now: AT });
  ok(r.json.ok === true && r.json.userId === "phone-acct-A" && r.json.linked === true, "link stamps Google onto the proven phone account");
  const patch = calls.find((c) => c.method === "PATCH" && c.url.includes("phone-acct-A"));
  ok(patch && JSON.parse(patch.body).google_sub === "google-sub-123", "google_sub written to the phone account");
  const merge = calls.find((c) => c.url.includes("merge_user_profiles"));
  ok(merge && JSON.parse(merge.body).p_target === "phone-acct-A" && JSON.parse(merge.body).p_source === "goog-oauth-uid", "the throwaway Google account is folded in");
}

/* ── LINK: forged phone token → REFUSED (no takeover) ───────────── */
{
  const { f, calls } = makeFetch([userRoute, ["merge_user_profiles", { status: 200, json: {} }]]);
  const r = await handleGoogleSignin({ action: "link", googleToken: "g", linkToken: "not.a.validtoken" }, { env: ENV, fetchImpl: f, now: AT });
  ok(r.json.ok === false, "link with a forged token → refused");
  ok(!calls.some((c) => c.url.includes("merge_user_profiles")), "no merge happens on a forged link (no account-takeover)");
}

console.log(`\n${pass} checks passed${fail ? `, ${fail} FAILED` : ""}.`);
process.exit(fail ? 1 : 0);
