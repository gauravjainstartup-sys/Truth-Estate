/* ════════════════════════════════════════════════════════════════
   BRIEF — read this device's trail, return the inferred brief.

   Runs server-side for the same reason track does: events.RLS grants
   select only to `authenticated` matching user_id, and the browser holds
   no Supabase session (verify-otp issues no token). So the only way the
   visitor can see their own trail is through a function holding the
   service key.

   Identity is resolved from anon_id, never taken from the request body.
   This function bypasses RLS; honouring a client-supplied user_id would
   let anyone read anyone else's trail — including which projects they
   are considering and what they paid for.
   ════════════════════════════════════════════════════════════════ */
import { inferBrief, type EventRow, type ProjectRow } from "./core.ts";

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = (Deno.env.get("EDGE_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";

const ALLOWED = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/([a-z0-9-]+\.)?truthestate\.in$/,
  /* A `tag---` prefix also matches Cloud Run revision URLs (the `dev---…`
     staging tag), so OTP and sign-in work on the staging revision too. */
  /^https:\/\/([a-z0-9-]+---)?truthestate-[a-z0-9-]+\.a\.run\.app$/,
  /^https:\/\/([a-z0-9-]+---)?truthestate-[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
];
function cors(origin: string | null): Record<string, string> {
  const ok = origin && ALLOWED.some((re) => re.test(origin));
  return {
    "access-control-allow-origin": ok ? origin! : "https://gauravjainstartup-sys.github.io",
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "origin",
  };
}

const sb = (path: string) =>
  fetch(`${DB_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    signal: AbortSignal.timeout(8000),
  });

/* The catalogue changes when projects are added or re-scored, and a brief
   built on stale prices would quietly misstate someone's budget. Short
   TTL, and the previous copy is kept rather than cleared so a blip at the
   database never turns into an empty brief. */
let cache: { at: number; rows: ProjectRow[] } | null = null;
const TTL_MS = 5 * 60 * 1000;

const CATALOGUE_QUERY =
  "backlog_listing_public_v3?select=name,%22microMarket%22,min_price_cr,config,min_bhk_num,avg_cost_sqft,%22truthScore%22&limit=500";

async function projects(): Promise<ProjectRow[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  /* One retry, because the failure this guards against is transient and
     the consequence is not. A COLD start during a blip has no stale copy
     to fall back on, so the function returns "no catalogue" and the
     dashboard tells the visitor it does not know them — a false statement
     about a person, produced by a two-second outage. PostgREST answered
     521 for several minutes on 2026-07-25 while this was being built,
     which is exactly the window a retry covers. */
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await sb(CATALOGUE_QUERY);
      if (res.ok) {
        const rows = await res.json() as ProjectRow[];
        if (Array.isArray(rows) && rows.length) {
          cache = { at: Date.now(), rows };
          return rows;
        }
      } else {
        console.warn(`[brief] catalogue HTTP ${res.status} (attempt ${attempt + 1})`);
      }
    } catch (err) {
      console.warn(`[brief] catalogue unreachable (attempt ${attempt + 1})`, err);
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
  }
  /* Stale beats absent: a brief built on a catalogue five minutes out of
     date is right about everything that matters here. */
  if (cache) {
    console.warn(`[brief] serving catalogue cached ${Math.round((Date.now() - cache.at) / 1000)}s ago`);
    return cache.rows;
  }
  return [];
}

/* Everything this person has done, on this device or any other they have
   signed in from. Once user_id is known it is the better key: someone who
   read three reports on their phone and came back on a laptop is one
   buyer, and a brief that forgets half their search is worse than none. */
async function trail(anonId: string): Promise<EventRow[]> {
  const sel = "select=name,project_slug,created_at,props&order=created_at.asc&limit=1000";
  const idRes = await sb(
    `events?select=user_id&anon_id=eq.${encodeURIComponent(anonId)}&user_id=not.is.null&limit=1`,
  );
  const idRows = idRes.ok ? await idRes.json() as { user_id?: string }[] : [];
  const userId = idRows?.[0]?.user_id ?? null;

  const filter = userId
    ? `or=(user_id.eq.${userId},anon_id.eq.${encodeURIComponent(anonId)})`
    : `anon_id=eq.${encodeURIComponent(anonId)}`;
  const res = await sb(`events?${sel}&${filter}`);
  return res.ok ? await res.json() as EventRow[] : [];
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };
  const done = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers });

  if (req.method !== "POST") return done({ ok: false, reason: "method" });
  if (!DB_URL || !SERVICE_KEY) {
    console.error("[brief] SUPABASE_URL / SERVICE_ROLE_KEY not set");
    return done({ ok: false, reason: "not configured" });
  }

  try {
    const body = await req.json() as { anonId?: string };
    const anonId = typeof body.anonId === "string" ? body.anonId.trim().slice(0, 100) : "";
    /* Same floor the claim RPCs use — a short or empty id would match a
       swathe of unrelated rows rather than one device. */
    if (anonId.length < 8) return done({ ok: false, reason: "anonId" });

    const [events, cat] = await Promise.all([trail(anonId), projects()]);
    if (!cat.length) {
      console.error("[brief] catalogue empty — cannot infer");
      return done({ ok: false, reason: "catalogue" });
    }

    const brief = inferBrief(events, cat);
    console.info(`[brief] ${events.length} events, ${brief.reportsRead} projects, enough=${brief.enough}`);
    return done({ ok: true, brief });
  } catch (err) {
    console.error("[brief]", err);
    return done({ ok: false, reason: "error" });
  }
});
