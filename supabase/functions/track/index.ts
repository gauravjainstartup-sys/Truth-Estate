/* ════════════════════════════════════════════════════════════════
   TRACK — the write path for public.events.

   Accepts one event or a small batch and inserts with the service role.
   The anon key has no grant on that table, so this is the only way in:
   an event stream readable from the public bundle would leak which
   projects every visitor is considering.

   POST { events: [ { name, projectSlug?, projectName?, props?,
                      path?, referrer? } ], anonId, sessionId? }
     → { ok: true, stored: n }

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
]);

const MAX_BATCH = 20;

const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/(www\.)?truthestate\.in$/,
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
      events?: InEvent[]; anonId?: string; sessionId?: string;
    };
    const anonId = str(body.anonId, 100);
    const sessionId = str(body.sessionId, 100);
    const ua = str(req.headers.get("user-agent"), 400);

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
        user_id: null,
        name: str(e.name, 60),
        project_slug: str(e.projectSlug, 160),
        project_name: str(e.projectName, 200),
        props: e.props ?? null,
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
