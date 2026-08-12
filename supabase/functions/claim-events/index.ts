/* ════════════════════════════════════════════════════════════════
   CLAIM-EVENTS — attach a device's anonymous trail to the account that
   just signed in.

   Why this exists as its own function: link_verified_phone does the same
   job for THIS repo's sign-in, but it takes a phone number, upserts
   user_profiles, and is revoked from every public role. The AI Studio
   site on truthestate.in signs people in through Supabase auth directly,
   holds a real session, and has no phone step to hang the claim off. It
   needs a door of its own.

   POST { anonId, accessToken }  → { ok, userId, events, chats }

   NOT USABLE BY truthestate.in AS IT STANDS. That site verifies through
   MSG91 and mints its own JWT in the browser, so it holds no Supabase
   session: localStorage carries no sb-* key, and the token it does have
   fails /auth/v1/user with "signature is invalid". Its attribution goes
   through track's userRef instead, which is honest about being
   self-asserted. This function stays for the front-ends that DO hold a
   real session, and is the right path the moment that site moves to
   Supabase auth.

   THE ONE RULE: the account is taken from the access token, verified
   against Supabase auth on every call — never from the request body.
   This function holds the service key and writes across users, so a
   caller-supplied user id would let anybody graft anybody else's
   browsing onto their own account.

   Only rows that are still unclaimed (user_id is null) are touched, so
   this is idempotent and cannot move a trail from one account to
   another.

   After one successful call, nothing further is needed: track resolves
   the account from an already-claimed row with the same anon_id, so
   every later event is attributed on write.
   ════════════════════════════════════════════════════════════════ */

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/(www\.)?truthestate\.in$/,
  /* Cloud Run. The site now runs from a container before the domain is
     cut over, and its .run.app host was on no allowlist — so sign-up
     failed at chat-signin with "couldn't reach us" while send-otp, which
     lives outside this repo and is permissive, had already sent the code.
     A CORS rejection is indistinguishable from a dead network in the UI.
     Both URL forms Cloud Run issues: the newer hash style and the older
     project-number style the existing service still uses. */
  /* A `tag---` prefix also matches Cloud Run revision URLs (the `dev---…`
     staging tag), so OTP and sign-in work on the staging revision too. */
  /^https:\/\/([a-z0-9-]+---)?truthestate-[a-z0-9-]+\.a\.run\.app$/,
  /^https:\/\/([a-z0-9-]+---)?truthestate-[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/,
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

/* Ask Supabase who this token belongs to. Deliberately the auth endpoint
   rather than decoding the JWT here: it costs one request and it respects
   expiry, revocation and sign-out, none of which a local signature check
   would notice. */
type TokenCheck = { userId: string | null; detail: string };

async function userFromToken(token: string): Promise<TokenCheck> {
  /* "unauthenticated" alone sent us guessing for a round trip. The caller
     needs to know WHICH thing was wrong — a token the auth server
     rejected, a shape that was never a JWT, or this function missing its
     own key. None of these leak anything: the detail describes the
     request, never the token. */
  if (!ANON_KEY && !SERVICE_KEY) return { userId: null, detail: "function has no key configured" };
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { userId: null, detail: `not a JWT (${parts.length} segment${parts.length === 1 ? "" : "s"}) — this is probably not a Supabase session token` };
  }
  try {
    const res = await fetch(`${DB_URL}/auth/v1/user`, {
      headers: {
        apikey: ANON_KEY || SERVICE_KEY,
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 200);
      return { userId: null, detail: `auth rejected it: ${res.status} ${body}` };
    }
    const u = await res.json() as { id?: string };
    if (typeof u?.id === "string" && u.id.length >= 32) return { userId: u.id, detail: "ok" };
    return { userId: null, detail: "auth accepted the token but returned no user id" };
  } catch (err) {
    return { userId: null, detail: `could not reach auth: ${String(err).slice(0, 120)}` };
  }
}

/* PATCH ... ?anon_id=eq.X&user_id=is.null — the null filter is what makes
   this safe to call repeatedly and impossible to use to steal a trail
   that already belongs to somebody. */
async function claim(table: string, anonId: string, userId: string): Promise<number> {
  try {
    const res = await fetch(
      `${DB_URL}/rest/v1/${table}?anon_id=eq.${encodeURIComponent(anonId)}&user_id=is.null`,
      {
        method: "PATCH",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "content-type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ user_id: userId }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) {
      console.error(`[claim-events] ${table} ${res.status} ${await res.text()}`);
      return 0;
    }
    const rows = await res.json() as unknown[];
    return Array.isArray(rows) ? rows.length : 0;
  } catch (err) {
    console.error(`[claim-events] ${table}`, err);
    return 0;
  }
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };
  const done = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers });

  if (req.method !== "POST") return done({ ok: false, reason: "method" });
  if (!DB_URL || !SERVICE_KEY) {
    console.error("[claim-events] SUPABASE_URL / SERVICE_ROLE_KEY not set");
    return done({ ok: false, reason: "not configured" });
  }

  try {
    const body = await req.json() as { anonId?: string; accessToken?: string };
    const anonId = typeof body.anonId === "string" ? body.anonId.trim().slice(0, 100) : "";
    const token = typeof body.accessToken === "string" ? body.accessToken.trim() : "";

    /* Same floor the other claim paths use: a short id would match a
       swathe of unrelated rows rather than one device. */
    if (anonId.length < 8) return done({ ok: false, reason: "anonId" });
    if (!token) return done({ ok: false, reason: "accessToken" });

    const check = await userFromToken(token);
    if (!check.userId) {
      console.warn(`[claim-events] rejected: ${check.detail}`);
      return done({ ok: false, reason: "unauthenticated", detail: check.detail });
    }
    const userId = check.userId;

    /* chat_sessions carries anon_id too, so the conversation is swept up
       with the browsing. A site that does not write it simply claims 0. */
    const events = await claim("events", anonId, userId);
    const chats = await claim("chat_sessions", anonId, userId);

    console.info(`[claim-events] ${userId.slice(0, 8)}… claimed ${events} events, ${chats} chats`);
    return done({ ok: true, userId, events, chats });
  } catch (err) {
    console.error("[claim-events]", err);
    return done({ ok: false, reason: "error" });
  }
});
