/* ════════════════════════════════════════════════════════════════
   ENTITLEMENTS — server truth about what this account paid for.

   journey.ts keeps access in localStorage, which is wrong in two
   directions at once. It loses everything on a hard refresh, because the
   pre-hydration script in layout.tsx clears the truthEstate.* namespace
   on reload. And it knows nothing about the profiles who bought on
   truthestate.in, so every one of them would meet a paywall for a report
   they already own.

   This fetches the real answer once and hands it to the existing access
   helpers. The local copy stays as the CACHE it always should have
   been — reads stay synchronous, so no component has to change.

   Deliberately additive: nothing here removes a local grant. A visitor
   who just paid on this device must not lose access because the network
   blinked, so the two sets are unioned and the server only ever adds.

   ── TWO WAYS to learn who this account is ──
   1. SIGNED IN (a session token in truthEstate.sbSession): read the
      account's OWN payments + profile straight from Postgres under RLS,
      exactly as the Office does. The token IS the identity — Postgres
      only returns this user's rows — so the answer belongs to whoever is
      signed in RIGHT NOW, with no device-trail guesswork.
   2. SIGNED OUT (no token): fall back to the `entitlements` edge
      function, which maps this DEVICE (anon_id → newest claimed user_id)
      to a person. This is the only identity a signed-out visitor has.

   Why (1) had to exist: the gate (serverHasAccess) requires the cached
   answer's userId to equal the signed-in userId. The edge function
   resolves identity from the device's event trail, which on a
   multi-account device (incognito unlock, then the normal browser;
   a shared handset) points at a DIFFERENT account than the session — so
   a report the signed-in user genuinely owns opened LOCKED, while the
   Office (which already read payments under the session) showed it as
   Purchased. Reading the session's own rows makes the two agree by
   construction: same source, same identity.
   ════════════════════════════════════════════════════════════════ */
import { getAnonId } from "@/lib/truthGuideChat";
import {
  readEntitlements, writeEntitlements, serverHasAccess, offerFirstFree,
  type ServerEntitlements,
} from "@/lib/entitlementsCache";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

/* Byte-identical to the server's slugify (entitlements/core.ts) and the
   report page's projectSlug — the internal id every gate keys on is the
   slugified project NAME. Kept inline so this module stays a small leaf. */
const liveSlug = (name: string): string =>
  (name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* Plans that mean "everything unlocked" — mirrors ALL_ACCESS_PLANS in
   entitlements/core.ts. `Premium` is the live All-Access tier; the rest
   are legacy aliases the CHECK constraint no longer permits but which
   stay harmless. Explicit list, never a "not Free" test. */
const ALL_ACCESS_PLANS = new Set(["premium", "all-access", "all", "unlimited"]);

/* The session phoneAuth writes on a verified sign-in: { access_token,
   user_id, phone }. Read inline (by name) rather than importing phoneAuth,
   which would pull the auth/journey chain into this leaf. The token is
   null until PROJECT_JWT_SECRET is set server-side; without it the RLS
   reads can't run and we fall back to the device-trail edge function. */
function readSession(): { token: string; userId: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("truthEstate.sbSession");
    if (!raw) return null;
    const s = JSON.parse(raw) as { access_token?: string | null; user_id?: string | null };
    return s?.access_token && s?.user_id ? { token: s.access_token, userId: s.user_id } : null;
  } catch {
    return null;
  }
}

/* The project NAME a grant carries. Grants are JSON strings inside a
   text[]; 110 of 111 in production are {projectId, projectName,
   projectSlug, unlockedAt}. Mirrors the caution in core.ts nameFromGrant:
   a non-JSON string is accepted as a name only if it does NOT read as a
   bare kebab slug (prod's SEO slug can't be reversed into a name, and a
   malformed fragment must not slugify into a fake entitlement). */
function grantName(entry: unknown): string | null {
  if (entry && typeof entry === "object") {
    const n = (entry as { projectName?: unknown }).projectName;
    return typeof n === "string" && n.trim() ? n : null;
  }
  if (typeof entry === "string") {
    try {
      const o = JSON.parse(entry) as { projectName?: unknown };
      if (typeof o?.projectName === "string" && o.projectName.trim()) return o.projectName;
      return null;
    } catch {
      const t = entry.trim();
      return t && !/^[a-z0-9]+(-[a-z0-9]+)+$/.test(t) ? t : null;
    }
  }
  return null;
}

/* SIGNED-IN path — the account's own entitlements, read under the session
   token so Postgres (RLS) returns only this user's rows. Union of:
     · payments (status = completed)  → the MONEY record
     · unlocked_reports               → the GRANT record (comps, fixes)
     · plan ∈ ALL_ACCESS              → owns everything
   Same three sources the edge function unions, resolved here against the
   session instead of the device trail. Returns null (→ fall back) only
   when BOTH reads fail, e.g. an expired token — an empty-but-successful
   read is a real "signed in, owns nothing" answer and must stand. */
async function fetchFromSession(sess: { token: string; userId: string }): Promise<ServerEntitlements | null> {
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${sess.token}` };
  try {
    const [payRes, profRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/payments?select=status,project_name,package_name&limit=500`,
        { headers, signal: AbortSignal.timeout(8000) }),
      fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=plan,unlocked_reports&id=eq.${encodeURIComponent(sess.userId)}&limit=1`,
        { headers, signal: AbortSignal.timeout(8000) }),
    ]);
    /* A bad/expired token 401s both — that is "we couldn't tell", not
       "you own nothing", so hand back null and let the caller fall
       through to the device-trail resolver rather than caching an empty
       set that would mask real access. */
    if (!payRes.ok && !profRes.ok) return null;

    const unlocked = new Set<string>();
    let all = false;
    let plan: string | null = null;

    if (payRes.ok) {
      const rows = (await payRes.json().catch(() => [])) as
        { status?: string | null; project_name?: string | null; package_name?: string | null }[];
      for (const p of Array.isArray(rows) ? rows : []) {
        if ((p.status ?? "").toLowerCase() !== "completed") continue;
        /* All-Access carries the "all" package and no single project. */
        if ((p.package_name ?? "").toLowerCase() === "all" || !p.project_name) { all = true; continue; }
        const s = liveSlug(p.project_name);
        if (s) unlocked.add(s);
      }
    }

    if (profRes.ok) {
      const prof = ((await profRes.json().catch(() => [])) as
        { plan?: string | null; unlocked_reports?: unknown }[])?.[0] ?? null;
      plan = typeof prof?.plan === "string" ? prof.plan : null;
      if (ALL_ACCESS_PLANS.has((plan ?? "").trim().toLowerCase())) all = true;
      const list = Array.isArray(prof?.unlocked_reports) ? prof!.unlocked_reports as unknown[] : [];
      for (const entry of list) {
        const name = grantName(entry);
        const s = name ? liveSlug(name) : "";
        if (s) unlocked.add(s);
      }
    }

    return { userId: sess.userId, unlocked: [...unlocked].sort(), all, plan };
  } catch {
    return null;
  }
}

/* SIGNED-OUT path — map this DEVICE to a person via the edge function
   (anon_id → newest claimed user_id). The only identity a signed-out
   visitor has; also the historical path, kept unchanged. */
async function fetchFromDevice(): Promise<ServerEntitlements | null> {
  const anonId = getAnonId();
  if (!anonId) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/entitlements`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ anonId }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => null)) as
      ({ ok?: boolean } & ServerEntitlements) | null;
    if (!data?.ok) return null;
    return {
      userId: data.userId ?? null,
      unlocked: Array.isArray(data.unlocked) ? data.unlocked : [],
      all: data.all === true,
      plan: data.plan ?? null,
    };
  } catch {
    return null;
  }
}

let inFlight: Promise<ServerEntitlements | null> | null = null;

/* One request per page load at most. Several gated components mount at
   once on a report page and each would otherwise ask independently. */
export function fetchEntitlements(): Promise<ServerEntitlements | null> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const sess = readSession();
      /* Signed in → the session is the identity; read its own rows. Falls
         through to the device resolver only if the token can't read (both
         requests failed). */
      if (sess) {
        const fromSession = await fetchFromSession(sess);
        if (fromSession) {
          /* Always cache a signed-in answer, even the empty one: it is a
             real "this account owns nothing", and it must be allowed to
             overwrite a stale cache left by a DIFFERENT account on this
             device (the shared-handset case). */
          writeEntitlements(fromSession);
          return fromSession;
        }
      }

      const fromDevice = await fetchFromDevice();
      if (fromDevice?.userId) {
        /* Only cache a signed-in (identified) answer. Caching the
           anonymous empty set would let a stale "you own nothing" outlive
           the sign-in that disproves it. */
        writeEntitlements(fromDevice);
      }
      return fromDevice;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export { readEntitlements as cachedEntitlements, serverHasAccess, offerFirstFree };
export type { ServerEntitlements };
