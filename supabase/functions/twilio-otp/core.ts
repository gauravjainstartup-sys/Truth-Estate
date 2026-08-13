/* ════════════════════════════════════════════════════════════════
   twilio-otp CORE — the pure, injectable heart of the function.

   No Deno, no ambient env, no real network: everything that talks to
   the outside (Twilio Verify, the Supabase REST/admin API) goes through
   an injected `fetchImpl`, and the clock through `now`. index.ts is the
   thin Deno.serve shell that injects the real fetch + Deno.env; the
   offline harness (test-offline.mjs) injects fakes and asserts.

   Same split as capture-lead / brief / entitlements. The JWT minted here
   is byte-identical to chat-signin.mintSession — do not "improve" it, or
   sessions it issues stop validating against the same PROJECT_JWT_SECRET.
   ════════════════════════════════════════════════════════════════ */

export type Env = {
  DB_URL: string;
  SERVICE_KEY: string;
  JWT_SECRET: string;
  TW_SID: string;
  TW_TOKEN: string;
  TW_SERVICE: string;
};

export type Deps = {
  env: Env;
  fetchImpl: typeof fetch;
  now?: () => number; // ms since epoch; defaults to Date.now
};

export type Body = {
  action?: string;
  dial?: string;
  phone?: string;
  code?: string;
  anonId?: string;
  sessionId?: string;
  name?: string;
};

export const digitsOf = (s: string) => (s ?? "").replace(/\D/g, "");

/* Same allowlist chat-signin uses — kept in step deliberately. */
const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/(www\.)?truthestate\.in$/,
  /^https:\/\/truthestate-[a-z0-9-]+\.a\.run\.app$/,
  /^https:\/\/truthestate-[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

export function corsHeaders(origin: string | null): Record<string, string> {
  const ok = origin != null && ALLOW_ORIGIN.some((re) => re.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "https://gauravjainstartup-sys.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const svc = (key: string, extra: Record<string, string> = {}) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "content-type": "application/json",
  ...extra,
});

/* ── Session mint — byte-identical to chat-signin.mintSession ────── */
export function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function mintSession(
  userId: string,
  env: Env,
  nowMs: number,
): Promise<{ access_token: string; token_type: string; expires_in: number } | null> {
  if (!env.JWT_SECRET) return null;
  try {
    const now = Math.floor(nowMs / 1000);
    const ttl = 7 * 24 * 60 * 60;
    const data =
      `${b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.` +
      `${b64url(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", iss: `${env.DB_URL}/auth/v1`, iat: now, exp: now + ttl }))}`;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
    return { access_token: `${data}.${b64url(sig)}`, token_type: "bearer", expires_in: ttl };
  } catch (e) {
    console.error("[twilio-otp] session mint failed (non-fatal):", e instanceof Error ? e.message : String(e));
    return null;
  }
}

/* Resolve an existing international account across every shape production
   holds — full E.164, the bare digits, and the two synthetic-email
   conventions chat-signin created. Pure so the query itself is testable. */
export function findAccountPath(e164: string, digits: string): string {
  const variants = [e164, `+${digits}`, digits];
  const emails = [
    `phone_${digits}@truthestate.com`, `intl_${digits}@truthestate.com`,
    `phone_${digits}@truthestate.in`, `intl_${digits}@truthestate.in`,
  ];
  const or = [
    ...variants.map((v) => `phone.eq.${encodeURIComponent(v)}`),
    ...emails.map((e) => `email.eq.${encodeURIComponent(e)}`),
  ].join(",");
  return `user_profiles?select=id&or=(${or})&limit=1`;
}

async function rpc<T>(fn: string, args: unknown, env: Env, fetchImpl: typeof fetch): Promise<T | null> {
  const res = await fetchImpl(`${env.DB_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: svc(env.SERVICE_KEY), body: JSON.stringify(args) });
  if (!res.ok) {
    console.error(`[twilio-otp] rpc ${fn} HTTP ${res.status}: ${(await res.text()).slice(0, 240)}`);
    return null;
  }
  try { return (await res.json()) as T; } catch { return null; }
}

/* ── Twilio Verify (Basic auth = SID:token) ─────────────────────── */
function twilioAuth(env: Env): string {
  return "Basic " + btoa(`${env.TW_SID}:${env.TW_TOKEN}`);
}

async function twilioForm(
  path: string,
  params: Record<string, string>,
  env: Env,
  fetchImpl: typeof fetch,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const body = new URLSearchParams(params);
  const res = await fetchImpl(`https://verify.twilio.com/v2/Services/${env.TW_SERVICE}/${path}`, {
    method: "POST",
    headers: { Authorization: twilioAuth(env), "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

async function findAccount(e164: string, digits: string, env: Env, fetchImpl: typeof fetch): Promise<string | null> {
  try {
    const res = await fetchImpl(`${env.DB_URL}/rest/v1/${findAccountPath(e164, digits)}`, { headers: svc(env.SERVICE_KEY) });
    if (!res.ok) { console.error(`[twilio-otp] lookup HTTP ${res.status}`); return null; }
    const rows = await res.json() as { id?: string }[];
    return rows?.[0]?.id ?? null;
  } catch (e) { console.error("[twilio-otp] lookup", e); return null; }
}

async function stampSignIn(userId: string, anonId: string | null | undefined, sessionId: string | null | undefined, env: Env, fetchImpl: typeof fetch): Promise<void> {
  if (!anonId) return;
  try {
    await fetchImpl(`${env.DB_URL}/rest/v1/events`, {
      method: "POST",
      headers: svc(env.SERVICE_KEY, { Prefer: "return=minimal" }),
      body: JSON.stringify({ anon_id: anonId, session_id: sessionId ?? null, user_id: userId, name: "signed_in", props: { via: "twilio-otp", server: true } }),
    });
  } catch (e) { console.error("[twilio-otp] stamp failed", e); }
}

export type Result = { status: number; json: Record<string, unknown> };

/* The whole request, minus transport. Parsed body in, {status, json} out. */
export async function handleTwilioOtp(body: Body, deps: Deps): Promise<Result> {
  const { env, fetchImpl } = deps;
  const now = deps.now ?? (() => Date.now());
  const fail = (error: string, log?: string): Result => {
    if (log) console.error(`[twilio-otp] ${log}`);
    return { status: 200, json: { ok: false, error } };
  };

  if (!env.TW_SID || !env.TW_TOKEN || !env.TW_SERVICE) return fail("International sign-in isn't available right now.", "twilio env missing");
  if (!env.DB_URL || !env.SERVICE_KEY) return fail("Sign-in is unavailable right now.", "supabase env missing");

  const dial = digitsOf(body.dial ?? "");
  const local = digitsOf(body.phone ?? "");
  if (!dial || local.length < 6) return fail("That number doesn't look right — mind checking it?");
  /* Never take +91 here — that path is MSG91's, and Twilio would bill for
     an SMS the Indian flow already sends. */
  if (dial === "91") return fail("Indian numbers verify by SMS on the app — please use the +91 flow.", "twilio-otp got +91");

  const e164 = `+${dial}${local}`;
  const fullDigits = `${dial}${local}`;

  /* ── SEND ── */
  if (body.action === "send") {
    const r = await twilioForm("Verifications", { To: e164, Channel: "sms" }, env, fetchImpl);
    if (!r.ok) return fail("Couldn't send the code. Check the number and try again.", `send HTTP ${r.status}: ${JSON.stringify(r.data).slice(0, 200)}`);
    return { status: 200, json: { ok: true, status: r.data.status ?? "pending" } };
  }

  /* ── CHECK ── */
  if (body.action === "check") {
    const code = digitsOf(body.code ?? "");
    if (!code) return fail("Enter the code we sent you.");
    const r = await twilioForm("VerificationCheck", { To: e164, Code: code }, env, fetchImpl);
    if (!r.ok || r.data.status !== "approved") {
      return fail("That code didn't match. Try again, or ask for a new one.", `check status=${r.data.status ?? r.status}`);
    }

    /* Verified. Resolve or create the account. phone_confirm true — Twilio
       has genuinely proven this handset (unlike chat-signin's intl path). */
    let userId = await findAccount(e164, fullDigits, env, fetchImpl);
    if (!userId) {
      const cres = await fetchImpl(`${env.DB_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: svc(env.SERVICE_KEY),
        body: JSON.stringify({ phone: e164, phone_confirm: true, email: `phone_${fullDigits}@truthestate.com`, email_confirm: true }),
      });
      const cdata = await cres.json().catch(() => ({})) as { id?: string; msg?: string; message?: string };
      if (!cres.ok || !cdata.id) {
        return fail("Verified you, but couldn't save your account. Please try again.", `create HTTP ${cres.status}: ${cdata.msg ?? cdata.message ?? ""}`);
      }
      userId = cdata.id;
    }

    /* Write profile + claim this device's pre-sign-in history. p_phone is
       the canonical E.164. link_verified_phone sets phone_verified=true —
       correct here, the number IS verified. */
    const linked = await rpc<{ chats_claimed?: number; leads_claimed?: number }>("link_verified_phone", {
      p_user_id: userId, p_phone: e164,
      p_anon_id: body.anonId ?? null, p_session_id: body.sessionId ?? null, p_name: body.name ?? null,
    }, env, fetchImpl);
    await rpc("resolve_and_merge_verified_identity", {
      p_target_id: userId,
      p_verified_phone: e164,
      p_phone_is_verified: true,
    }, env, fetchImpl);
    await stampSignIn(userId, body.anonId, body.sessionId, env, fetchImpl);
    const session = await mintSession(userId, env, now());
    console.log(`[twilio-otp] ok user=${userId} chats=${linked?.chats_claimed ?? 0} session=${session ? "minted" : "off"}`);
    return {
      status: 200,
      json: {
        ok: true, userId, verified: true,
        chatsClaimed: linked?.chats_claimed ?? 0, leadsClaimed: linked?.leads_claimed ?? 0,
        ...(session ? { session } : {}),
      },
    };
  }

  return fail("Unknown request.", `bad action=${body.action}`);
}
