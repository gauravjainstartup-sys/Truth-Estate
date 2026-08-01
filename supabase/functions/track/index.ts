/* ════════════════════════════════════════════════════════════════
   TRACK — the write path for public.events.

   Accepts one event or a small batch and inserts with the service role.
   The anon key has no grant on that table, so this is the only way in:
   an event stream readable from the public bundle would leak which
   projects every visitor is considering.

   POST { events: [ { name, projectSlug?, projectName?, props?,
                      path?, referrer? } ], anonId, sessionId?, userRef? }
     → { ok: true, stored: n }

   userRef is a SELF-ASSERTED account id from a front-end with no
   Supabase session. It is stored in props.uid, never in user_id — see
   the note at the read site below.

   Always answers HTTP 200 and never blocks the page. Analytics failing
   must never cost a visitor an interaction, so the client fires this and
   forgets it — a non-200 would only produce console noise for nobody's
   benefit.

   Deploy:
     supabase functions deploy track --no-verify-jwt
   ════════════════════════════════════════════════════════════════ */

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/* Mirrors EVENT NAMES in migration 0010 and src/lib/events.ts. Unknown
   names are dropped rather than stored: free-form names would make the
   funnel unqueryable within a month, and a typo should surface in the
   logs rather than quietly become a category of one. */
const KNOWN = new Set([
  "page_viewed",
  "report_viewed",
  "signed_in",
  "report_unlocked",
  "payment_completed",
  "lead_captured",
  "office_opened",
  "chat_opened",
  "stake_declared",
]);

const MAX_BATCH = 20;

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

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

type InEvent = {
  name?: string;
  projectSlug?: string;
  projectName?: string;
  props?: unknown;
  path?: string;
  referrer?: string;
};

/* A short, stable label per front-end. Deliberately an allow-list rather
   than the raw host: an unrecognised origin becomes "other" instead of
   creating a new bucket, so one stray deploy preview cannot fragment
   every group-by in the funnel. */
function siteFromOrigin(origin: string | null): string {
  if (!origin) return "unknown";
  if (/^https:\/\/(www\.)?truthestate\.in$/.test(origin)) return "truthestate.in";
  if (/^https:\/\/gauravjainstartup-sys\.github\.io$/.test(origin)) return "pages";
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return "local";
  return "other";
}

/* The account this device has already been linked to, if any. One indexed
   lookup on (anon_id, created_at); null is a perfectly normal answer and
   must never block the write — an unattributed event beats a lost one. */
async function resolveUserId(anonId: string): Promise<string | null> {
  try {
    const url = `${DB_URL}/rest/v1/events?select=user_id&anon_id=eq.${encodeURIComponent(anonId)}`
      + `&user_id=not.is.null&order=created_at.desc&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const rows = await res.json() as { user_id?: string }[];
    return rows?.[0]?.user_id ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };
  const done = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers });

  if (req.method !== "POST") return done({ ok: false, reason: "method" });
  if (!DB_URL || !SERVICE_KEY) {
    console.error("[track] SUPABASE_URL / SERVICE_ROLE_KEY not set");
    return done({ ok: false, reason: "not configured" });
  }

  try {
    const body = await req.json() as {
      events?: InEvent[]; anonId?: string; sessionId?: string; userRef?: string;
    };
    const anonId = str(body.anonId, 100);
    const sessionId = str(body.sessionId, 100);
    const ua = str(req.headers.get("user-agent"), 400);
    /* Which site wrote this. Two front-ends now share this table — the
       Next build and the AI Studio site on truthestate.in — and without a
       marker every number is a blend of two different products with two
       different funnels.

       Taken from the Origin header, not the request body, for one
       practical reason: a body field is something the NEXT integration
       has to remember to send, and the moment it forgets, the data is
       silently wrong rather than missing. The browser sets Origin on
       every cross-origin POST, including sendBeacon. */
    const site = siteFromOrigin(req.headers.get("origin"));

    /* A SELF-ASSERTED account id, for front-ends that do not hold a
       Supabase session — truthestate.in signs people in with MSG91 and
       mints its own JWT client-side, so there is no token anyone could
       verify and nothing to check this against.

       It therefore does NOT go in events.user_id. That column means "an
       account this server confirmed", and quietly filling it with a
       string the browser supplied would destroy the only thing that makes
       it worth having. It lands in props.uid instead, where every query
       can see exactly what kind of claim it is.

       This is what identify() does in Mixpanel or GA, and it is safe for
       the same reason: the value labels analytics, it grants nothing.
       Forging it buys an attacker a wrong row in a funnel chart. */
    const userRef = str(body.userRef, 100);

    /* Who this device turned out to be.

       link_verified_phone stamps user_id onto the rows that exist AT THE
       MOMENT of sign-in and never runs again, so everything after it —
       including payment_completed, the one event that matters most —
       stayed anonymous forever. Resolving it here instead means the
       attribution continues for the life of the device.

       Derived from a row this anon_id has ALREADY had claimed, never from
       anything the caller sends. This function holds the service key and
       bypasses RLS, so trusting a client-supplied user_id would let anyone
       write events onto anyone else's trail. */
    const userId = anonId ? await resolveUserId(anonId) : null;

    const incoming = Array.isArray(body.events) ? body.events.slice(0, MAX_BATCH) : [];
    const rows = incoming
      .filter((e) => {
        const n = str(e.name, 60);
        if (n && KNOWN.has(n)) return true;
        console.warn(`[track] dropped unknown event: ${n ?? "(none)"}`);
        return false;
      })
      /* Every row carries an identical key set — PostgREST builds a bulk
         insert as one statement with a single column list and rejects
         differing shapes with PGRST102. */
      .map((e) => ({
        anon_id: anonId,
        session_id: sessionId,
        user_id: userId,
        name: str(e.name, 60),
        project_slug: str(e.projectSlug, 160),
        project_name: str(e.projectName, 200),
        /* Merged rather than nested so existing queries on props keep
           working, and site is one hop away: props->>'site'. */
        props: {
          ...(e.props && typeof e.props === "object" ? e.props : {}),
          site,
          ...(userRef ? { uid: userRef } : {}),
        },
        path: str(e.path, 300),
        referrer: str(e.referrer, 500),
        user_agent: ua,
      }));

    if (!rows.length) return done({ ok: true, stored: 0 });

    const res = await fetch(`${DB_URL}/rest/v1/events`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "content-type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      console.error(`[track] insert HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return done({ ok: false, reason: `insert failed (${res.status})` });
    }
    return done({ ok: true, stored: rows.length });
  } catch (e) {
    console.error("[track]", e instanceof Error ? e.message : e);
    return done({ ok: false, reason: "bad request" });
  }
});
