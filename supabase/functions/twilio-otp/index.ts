/* ════════════════════════════════════════════════════════════════
   TWILIO-OTP — real verification for NON-+91 numbers.

   The +91 path is untouched: the client sends via MSG91's send-otp and
   verifies + gets its session through chat-signin. International numbers
   never had a real OTP — chat-signin waves them through unverified
   (phone_verified stays false, no session). This function gives them a
   genuine one, through Twilio Verify, WITHOUT modifying chat-signin
   (which the live AI-Studio site also depends on).

   Two actions, both server-side so the browser never proves its own
   identity — the same boundary chat-signin and 0009 keep:

     POST { action:"send",  dial, phone }
       → Twilio Verify sends an SMS code.  { ok:true, status }

     POST { action:"check", dial, phone, code, anonId?, sessionId?, name? }
       → Twilio Verify checks the code; on "approved" we resolve/create the
         account, claim this device's history, and mint a REAL session
         (identical HS256 to chat-signin's mintSession — inert until
         PROJECT_JWT_SECRET is set).  { ok:true, userId, verified:true, session? }

   Secrets (Supabase → Edge Functions → Secrets):
     TWILIO_ACCOUNT_SID · TWILIO_AUTH_TOKEN · TWILIO_VERIFY_SERVICE_SID
     SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY · PROJECT_JWT_SECRET

   Deploy:
     supabase functions deploy twilio-otp --no-verify-jwt
   ════════════════════════════════════════════════════════════════ */

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const JWT_SECRET = Deno.env.get("PROJECT_JWT_SECRET") ?? "";
const TW_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TW_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TW_SERVICE = Deno.env.get("TWILIO_VERIFY_SERVICE_SID") ?? "";

/* Same allowlist chat-signin uses — kept in step deliberately. */
const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/(www\.)?truthestate\.in$/,
  /^https:\/\/truthestate-[a-z0-9-]+\.a\.run\.app$/,
  /^https:\/\/truthestate-[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

function cors(origin: string | null): Record<string, string> {
  const ok = origin != null && ALLOW_ORIGIN.some((re) => re.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "https://gauravjainstartup-sys.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const svc = (extra: Record<string, string> = {}) => ({
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "content-type": "application/json",
  ...extra,
});

async function rpc<T>(fn: string, args: unknown): Promise<T | null> {
  const res = await fetch(`${DB_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: svc(), body: JSON.stringify(args) });
  if (!res.ok) {
    console.error(`[twilio-otp] rpc ${fn} HTTP ${res.status}: ${(await res.text()).slice(0, 240)}`);
    return null;
  }
  try { return (await res.json()) as T; } catch { return null; }
}

/* ── Twilio Verify (Basic auth = SID:token) ─────────────────────── */
function twilioAuth(): string {
  return "Basic " + btoa(`${TW_SID}:${TW_TOKEN}`);
}
async function twilioForm(path: string, params: Record<string, string>): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const body = new URLSearchParams(params);
  const res = await fetch(`https://verify.twilio.com/v2/Services/${TW_SERVICE}/${path}`, {
    method: "POST",
    headers: { Authorization: twilioAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

/* ── Session mint — byte-identical to chat-signin.mintSession ────── */
function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function mintSession(userId: string): Promise<{ access_token: string; token_type: string; expires_in: number } | null> {
  if (!JWT_SECRET) return null;
  try {
    const now = Math.floor(Date.now() / 1000);
    const ttl = 7 * 24 * 60 * 60;
    const data =
      `${b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.` +
      `${b64url(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", iss: `${DB_URL}/auth/v1`, iat: now, exp: now + ttl }))}`;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
    return { access_token: `${data}.${b64url(sig)}`, token_type: "bearer", expires_in: ttl };
  } catch (e) {
    console.error("[twilio-otp] session mint failed (non-fatal):", e instanceof Error ? e.message : String(e));
    return null;
  }
}

async function stampSignIn(userId: string, anonId?: string | null, sessionId?: string | null): Promise<void> {
  if (!anonId) return;
  try {
    await fetch(`${DB_URL}/rest/v1/events`, {
      method: "POST",
      headers: svc({ Prefer: "return=minimal" }),
      body: JSON.stringify({ anon_id: anonId, session_id: sessionId ?? null, user_id: userId, name: "signed_in", props: { via: "twilio-otp", server: true } }),
    });
  } catch (e) { console.error("[twilio-otp] stamp failed", e); }
}

/* Resolve an existing international account across every shape production
   holds — full E.164, the bare digits, and the two synthetic-email
   conventions chat-signin created — else null. Superset of chat-signin's
   findInternational so the two paths converge on ONE account. */
async function findAccount(e164: string, digits: string): Promise<string | null> {
  const variants = [e164, `+${digits}`, digits];
  const emails = [
    `phone_${digits}@truthestate.com`, `intl_${digits}@truthestate.com`,
    `phone_${digits}@truthestate.in`, `intl_${digits}@truthestate.in`,
  ];
  const or = [
    ...variants.map((v) => `phone.eq.${encodeURIComponent(v)}`),
    ...emails.map((e) => `email.eq.${encodeURIComponent(e)}`),
  ].join(",");
  try {
    const res = await fetch(`${DB_URL}/rest/v1/user_profiles?select=id&or=(${or})&limit=1`, { headers: svc() });
    if (!res.ok) { console.error(`[twilio-otp] lookup HTTP ${res.status}`); return null; }
    const rows = await res.json() as { id?: string }[];
    return rows?.[0]?.id ?? null;
  } catch (e) { console.error("[twilio-otp] lookup", e); return null; }
}

const digitsOf = (s: string) => (s ?? "").replace(/\D/g, "");

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };
  const fail = (error: string, log?: string) => {
    if (log) console.error(`[twilio-otp] ${log}`);
    return new Response(JSON.stringify({ ok: false, error }), { status: 200, headers });
  };

  if (req.method !== "POST") return fail("method");
  if (!TW_SID || !TW_TOKEN || !TW_SERVICE) return fail("International sign-in isn't available right now.", "twilio env missing");
  if (!DB_URL || !SERVICE_KEY) return fail("Sign-in is unavailable right now.", "supabase env missing");

  try {
    const body = await req.json() as {
      action?: string; dial?: string; phone?: string; code?: string;
      anonId?: string; sessionId?: string; name?: string;
    };
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
      const r = await twilioForm("Verifications", { To: e164, Channel: "sms" });
      if (!r.ok) return fail("Couldn't send the code. Check the number and try again.", `send HTTP ${r.status}: ${JSON.stringify(r.data).slice(0, 200)}`);
      return new Response(JSON.stringify({ ok: true, status: r.data.status ?? "pending" }), { status: 200, headers });
    }

    /* ── CHECK ── */
    if (body.action === "check") {
      const code = digitsOf(body.code ?? "");
      if (!code) return fail("Enter the code we sent you.");
      const r = await twilioForm("VerificationCheck", { To: e164, Code: code });
      if (!r.ok || r.data.status !== "approved") {
        return fail("That code didn't match. Try again, or ask for a new one.", `check status=${r.data.status ?? r.status}`);
      }

      /* Verified. Resolve or create the account. phone_confirm true — Twilio
         has now genuinely proven this handset (unlike chat-signin's intl
         path, which had to record phone_verified=false). */
      let userId = await findAccount(e164, fullDigits);
      if (!userId) {
        const cres = await fetch(`${DB_URL}/auth/v1/admin/users`, {
          method: "POST",
          headers: svc(),
          body: JSON.stringify({ phone: e164, phone_confirm: true, email: `phone_${fullDigits}@truthestate.com`, email_confirm: true }),
        });
        const cdata = await cres.json().catch(() => ({})) as { id?: string; msg?: string; message?: string };
        if (!cres.ok || !cdata.id) {
          return fail("Verified you, but couldn't save your account. Please try again.", `create HTTP ${cres.status}: ${cdata.msg ?? cdata.message ?? ""}`);
        }
        userId = cdata.id;
      }

      /* Write profile + claim this device's pre-sign-in history. p_phone is
         the canonical E.164 so the profile stores one consistent shape.
         link_verified_phone sets phone_verified=true — correct here, the
         number IS verified. */
      const linked = await rpc<{ chats_claimed?: number; leads_claimed?: number }>("link_verified_phone", {
        p_user_id: userId, p_phone: e164,
        p_anon_id: body.anonId ?? null, p_session_id: body.sessionId ?? null, p_name: body.name ?? null,
      });
      await stampSignIn(userId, body.anonId, body.sessionId);
      const session = await mintSession(userId);
      console.log(`[twilio-otp] ok user=${userId} chats=${linked?.chats_claimed ?? 0} session=${session ? "minted" : "off"}`);
      return new Response(JSON.stringify({
        ok: true, userId, verified: true,
        chatsClaimed: linked?.chats_claimed ?? 0, leadsClaimed: linked?.leads_claimed ?? 0,
        ...(session ? { session } : {}),
      }), { status: 200, headers });
    }

    return fail("Unknown request.", `bad action=${body.action}`);
  } catch (e) {
    return fail("Couldn't complete that just now. Try again in a moment.", e instanceof Error ? e.message : String(e));
  }
});
