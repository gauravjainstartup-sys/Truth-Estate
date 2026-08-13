/* ════════════════════════════════════════════════════════════════
   google-signin CORE — resolve a Google login to ONE canonical account.

   The site has two auth systems: phone sign-in mints its own HS256 token
   (chat-signin), while Google goes through Supabase OAuth and lands on a
   SEPARATE auth user. So a person who uses both ends up with two accounts.
   This closes that: it verifies the Google identity server-side and mints
   a session for the CANONICAL account, resolved by google_sub.

   Two actions:
     signin — find the account whose google_sub matches this Google user;
              mint its session. No match → this Google account is its own
              canonical (a genuinely new user): stamp its google_sub and
              mint its session. (Never auto-links by bare email — that is
              an account-takeover vector; linking is explicit, below.)

     link   — the caller is signed in on a phone account A (proves it by
              passing A's HS256 token, whose signature we verify) and has
              just proven a Google identity. Stamp google_sub + the Google
              email onto A, fold the throwaway Google account into A, and
              mint A's session. Every later Google login then resolves to A.

   The Google identity is proven by calling GET /auth/v1/user with the
   Supabase Google access token — the browser cannot fake that.

   Injected deps (env, fetchImpl, now) so it runs offline in test.
   ════════════════════════════════════════════════════════════════ */

export type Env = {
  DB_URL: string;
  SERVICE_KEY: string;
  JWT_SECRET: string;
};

export type Deps = {
  env: Env;
  fetchImpl: typeof fetch;
  now?: () => number; // ms
};

export type Body = {
  action?: string;
  googleToken?: string; // the Supabase OAuth access token for the Google user
  linkToken?: string;   // action=link: the phone account's HS256 session token
  anonId?: string;
  sessionId?: string;
};

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

/* ── base64url + HS256, byte-identical to chat-signin.mintSession ── */
export function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function mintSession(userId: string, env: Env, nowMs: number): Promise<{ access_token: string; token_type: string; expires_in: number } | null> {
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
    console.error("[google-signin] mint failed:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

/* Verify OUR HS256 token (the phone account's session) and return its sub.
   The SIGNATURE is checked, not just decoded — a forged token with someone
   else's sub must never be able to link a Google identity onto their
   account. Returns null on bad signature / shape / expiry. */
export async function verifyOurToken(token: string, env: Env, nowMs: number): Promise<{ sub: string } | null> {
  if (!env.JWT_SECRET || !token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p))) as { sub?: string; exp?: number };
    if (!payload.sub) return null;
    if (payload.exp && payload.exp < Math.floor(nowMs / 1000)) return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

export type GoogleIdentity = { userId: string; email: string | null; sub: string | null; name: string | null; avatar: string | null };

/* Prove the Google identity: the Supabase-issued OAuth token, exchanged at
   /auth/v1/user for the real user. The browser cannot forge this. */
export async function verifyGoogleToken(token: string, env: Env, fetchImpl: typeof fetch): Promise<GoogleIdentity | null> {
  if (!token) return null;
  try {
    const res = await fetchImpl(`${env.DB_URL}/auth/v1/user`, {
      headers: { apikey: env.SERVICE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { console.error(`[google-signin] /auth/v1/user HTTP ${res.status}`); return null; }
    const u = await res.json() as {
      id?: string; email?: string;
      user_metadata?: Record<string, unknown>;
      identities?: { provider?: string; id?: string; identity_data?: Record<string, unknown> }[];
    };
    if (!u.id) return null;
    const gid = (u.identities ?? []).find((i) => i.provider === "google");
    const meta = u.user_metadata ?? {};
    const sub = (gid?.id ?? (meta.sub as string) ?? (meta.provider_id as string) ?? null) || null;
    const name = ((meta.full_name as string) ?? (meta.name as string) ?? null) || null;
    const avatar = ((meta.avatar_url as string) ?? (meta.picture as string) ?? null) || null;
    return { userId: u.id, email: u.email ?? null, sub, name, avatar };
  } catch (e) {
    console.error("[google-signin] verifyGoogleToken", e);
    return null;
  }
}

async function findByGoogleSub(sub: string, env: Env, fetchImpl: typeof fetch): Promise<string | null> {
  try {
    const res = await fetchImpl(`${env.DB_URL}/rest/v1/user_profiles?select=id&google_sub=eq.${encodeURIComponent(sub)}&limit=1`, { headers: svc(env.SERVICE_KEY) });
    if (!res.ok) return null;
    const rows = await res.json() as { id?: string }[];
    return rows?.[0]?.id ?? null;
  } catch { return null; }
}

/* An existing account that already owns this (real, verified) email — the
   returning member whose profile carries this Google address but not yet the
   google_sub. Excludes the throwaway OAuth account itself and synthetic
   phone_<digits>@truthestate.com addresses (a phone-only account is not an
   email identity, and its address can never equal a real Google email anyway).

   Why an exact match on email is safe here — the takeover worry with bare-email
   linking is a VERIFIED login adopting an account whose email is UNVERIFIED
   (attacker-seeded). That can't happen on this project: the only writers of
   user_profiles.email are Google (verified) and chat-signin (synthetic
   phone_*), and no path stores a typed/unverified address. The 0015 unique
   index on lower(email) also guarantees at most one account holds a given
   email, so a hit is unambiguous. If a typed-email path is ever added, gate
   this to a verified-email flag. */
async function findByVerifiedEmail(email: string, excludeId: string, env: Env, fetchImpl: typeof fetch): Promise<string | null> {
  const e = email.trim();
  if (!e || /^phone_\d+@truthestate\.com$/i.test(e)) return null;
  try {
    // eq (not ilike) — exact, and free of LIKE wildcard pitfalls (_ / %). Google
    // returns the address already normalised, matching what was stored from it.
    const res = await fetchImpl(`${env.DB_URL}/rest/v1/user_profiles?select=id,email&email=eq.${encodeURIComponent(e)}&limit=2`, { headers: svc(env.SERVICE_KEY) });
    if (!res.ok) return null;
    const rows = await res.json() as { id?: string; email?: string }[];
    const hit = (rows ?? []).find((r) => r.id && r.id !== excludeId && r.email && !/^phone_\d+@truthestate\.com$/i.test(r.email));
    return hit?.id ?? null;
  } catch { return null; }
}

async function patchProfile(id: string, patch: Record<string, unknown>, env: Env, fetchImpl: typeof fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(`${env.DB_URL}/rest/v1/user_profiles?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH", headers: svc(env.SERVICE_KEY, { Prefer: "return=minimal" }), body: JSON.stringify(patch),
    });
    return res.ok;
  } catch { return false; }
}

/* Ensure the Google account has a profile row + its google_sub, so a
   returning Google-only user resolves next time. Upsert on id. */
async function ensureProfile(g: GoogleIdentity, env: Env, fetchImpl: typeof fetch): Promise<void> {
  try {
    await fetchImpl(`${env.DB_URL}/rest/v1/user_profiles?on_conflict=id`, {
      method: "POST",
      headers: svc(env.SERVICE_KEY, { Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({
        id: g.userId,
        ...(g.email ? { email: g.email } : {}),
        ...(g.name ? { name: g.name } : {}),
        ...(g.sub ? { google_sub: g.sub } : {}),
        ...(g.avatar ? { avatar_url: g.avatar } : {}),
      }),
    });
  } catch (e) { console.error("[google-signin] ensureProfile", e); }
}

async function rpc(fn: string, args: unknown, env: Env, fetchImpl: typeof fetch): Promise<void> {
  try {
    await fetchImpl(`${env.DB_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: svc(env.SERVICE_KEY), body: JSON.stringify(args) });
  } catch (e) { console.error(`[google-signin] rpc ${fn}`, e); }
}

export type Result = { status: number; json: Record<string, unknown> };

export async function handleGoogleSignin(body: Body, deps: Deps): Promise<Result> {
  const { env, fetchImpl } = deps;
  const now = deps.now ?? (() => Date.now());
  const ok = (extra: Record<string, unknown>) => ({ status: 200, json: { ok: true, ...extra } });
  const fail = (error: string, log?: string): Result => {
    if (log) console.error(`[google-signin] ${log}`);
    return { status: 200, json: { ok: false, error } };
  };

  if (!env.DB_URL || !env.SERVICE_KEY) return fail("Sign-in is unavailable right now.", "missing env");

  const g = await verifyGoogleToken(body.googleToken ?? "", env, fetchImpl);
  if (!g) return fail("Couldn't verify your Google sign-in. Please try again.", "google token invalid");

  /* ── LINK: attach this Google identity to the phone account the caller
        has proven it holds (verified HS256 token). ── */
  if (body.action === "link") {
    const claim = await verifyOurToken(body.linkToken ?? "", env, now());
    if (!claim) return fail("Couldn't confirm your signed-in account. Please sign in again and retry.", "link token invalid");
    const target = claim.sub;
    if (target === g.userId) {
      // Already the same auth user — nothing to fold, just stamp + session.
      if (g.sub) await patchProfile(target, { google_sub: g.sub, ...(g.email ? { email: g.email } : {}), ...(g.avatar ? { avatar_url: g.avatar } : {}) }, env, fetchImpl);
      const session = await mintSession(target, env, now());
      return ok({ userId: target, linked: true, ...(session ? { session } : {}) });
    }
    // Stamp the Google identity onto the phone account, then fold the
    // throwaway Google account into it (moves any rows, deletes it).
    await patchProfile(target, {
      google_sub: g.sub,
      ...(g.email ? { email: g.email } : {}),
      ...(g.avatar ? { avatar_url: g.avatar } : {}),
    }, env, fetchImpl);
    await rpc("merge_user_profiles", { p_target: target, p_source: g.userId }, env, fetchImpl);
    await rpc("resolve_and_merge_verified_identity", { p_target_id: target, p_google_sub: g.sub }, env, fetchImpl);
    const session = await mintSession(target, env, now());
    console.log(`[google-signin] linked google=${g.userId} -> account=${target} session=${session ? "minted" : "off"}`);
    return ok({ userId: target, linked: true, ...(session ? { session } : {}) });
  }

  /* ── SIGNIN: resolve to the ONE canonical account. ──
       1) by google_sub — the permanent Google id, set on a prior sign-in/link.
       2) fallback, by VERIFIED email — a returning member whose account already
          carries this Google address (from an earlier Google login, or handed
          to the survivor by a data-merge) but not yet the google_sub. This is
          what makes "Continue with Google" land on the EXISTING profile instead
          of forking a fresh, empty one — the split the founder saw. Safe
          because no unverified email can exist in user_profiles (see
          findByVerifiedEmail).
     On either match, fold the throwaway OAuth account in; on an email match also
     stamp google_sub so the NEXT login resolves by (1) directly. */
  /* A google_sub hit only counts if it points at a DIFFERENT account than the
     fresh OAuth user. A self-hit (the throwaway already carries its own sub
     from an earlier new-user login) must NOT short-circuit the email fallback —
     otherwise a member with an existing email-bearing account stays split. */
  const subHit = g.sub ? await findByGoogleSub(g.sub, env, fetchImpl) : null;
  let userId: string | null = subHit && subHit !== g.userId ? subHit : null;
  let via = userId ? "google_sub" : "";
  if (!userId && g.email) {
    const byEmail = await findByVerifiedEmail(g.email, g.userId, env, fetchImpl);
    if (byEmail) { userId = byEmail; via = "email"; }
  }
  if (userId) {
    /* An existing, different account is canonical. On an email match it has no
       google_sub yet — stamp it so future logins resolve straight by sub. Then
       fold this fresh OAuth account in so it never lingers. */
    if (via === "email" && g.sub) {
      await patchProfile(userId, { google_sub: g.sub, ...(g.avatar ? { avatar_url: g.avatar } : {}) }, env, fetchImpl);
    }
    await rpc("merge_user_profiles", { p_target: userId, p_source: g.userId }, env, fetchImpl);
  } else {
    // New Google-only user: this account is its own canonical.
    userId = g.userId;
    via = "new";
    await ensureProfile(g, env, fetchImpl);
  }
  const session = await mintSession(userId, env, now());
  console.log(`[google-signin] signin account=${userId} (google=${g.userId}) via=${via} session=${session ? "minted" : "off"}`);
  return ok({ userId, verified: true, ...(session ? { session } : {}) });
}
