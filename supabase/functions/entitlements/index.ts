/* ════════════════════════════════════════════════════════════════
   ENTITLEMENTS — serve an account's paid access, server-side.

   POST { anonId }         → { ok, userId, unlocked: [slug], all, plan }
   POST { anonId, slug }   → …plus { entitled: boolean }

   IDENTITY comes from a row this anon_id has already had CLAIMED — the
   same rule track uses — never from anything the caller sends. On this
   site a claim only happens after MSG91 has verified the phone and
   link_verified_phone has run, so a resolved user id is one the server
   confirmed.

   props.uid is deliberately NOT accepted here. That value is
   self-asserted by truthestate.in, which holds no verifiable session; it
   is fine for labelling a funnel chart and unfit for granting access.
   Reading entitlements from it would let anyone list, and later read,
   anything anyone else had bought.

   WHAT THIS DOES NOT DO YET: gate the content itself. Every paid column
   in backlog_listing_public_v3, project_extended_details and
   project_configurations is readable today with the public anon key that
   ships in the bundle, so the paywall is a UI convention rather than a
   gate. This endpoint is the half that has to exist first — you cannot
   serve gated content without first knowing who is entitled — and
   isEntitled() in core.ts is the seam the content step plugs into.
   ════════════════════════════════════════════════════════════════ */
import { entitlementsFrom, isEntitled, type PaymentRow, type ProfileRow } from "./core.ts";

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

const sb = (path: string) =>
  fetch(`${DB_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    signal: AbortSignal.timeout(8000),
  });

/* The account this device was confirmed to be. Identical rule to track's
   resolver, and identical reason: a claim only lands after a verified
   OTP, so a claimed row is proof in a way a request body never is. */
async function verifiedUserId(anonId: string): Promise<string | null> {
  try {
    const res = await sb(
      `events?select=user_id&anon_id=eq.${encodeURIComponent(anonId)}&user_id=not.is.null` +
      `&order=created_at.desc&limit=1`,
    );
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
    console.error("[entitlements] SUPABASE_URL / SERVICE_ROLE_KEY not set");
    return done({ ok: false, reason: "not configured" });
  }

  try {
    const body = await req.json() as { anonId?: string; slug?: string };
    const anonId = typeof body.anonId === "string" ? body.anonId.trim().slice(0, 100) : "";
    const slug = typeof body.slug === "string" ? body.slug.trim().slice(0, 160) : "";
    if (anonId.length < 8) return done({ ok: false, reason: "anonId" });

    const userId = await verifiedUserId(anonId);
    /* Not an error. Most visitors are anonymous, and "signed out" has to
       be a cheap, ordinary answer rather than something the caller has to
       catch. */
    if (!userId) {
      return done({
        ok: true, userId: null, unlocked: [], all: false, plan: null,
        ...(slug ? { entitled: false } : {}),
      });
    }

    const [pRes, payRes] = await Promise.all([
      sb(`user_profiles?select=id,plan,unlocked_reports&id=eq.${userId}&limit=1`),
      sb(`payments?select=status,project_name,package_name,amount&user_id=eq.${userId}`),
    ]);

    const profile = pRes.ok ? ((await pRes.json() as ProfileRow[])[0] ?? null) : null;
    const payments = payRes.ok ? (await payRes.json() as PaymentRow[]) : [];
    /* payments.user_id is TEXT while user_profiles.id is UUID — the eq
       filter above works because PostgREST compares the text form. A
       failure here must not look like "nothing bought", so it is logged
       rather than swallowed. */
    if (!pRes.ok) console.error(`[entitlements] profile ${pRes.status} for ${userId}`);
    if (!payRes.ok) console.error(`[entitlements] payments ${payRes.status} for ${userId}`);

    const ent = entitlementsFrom(profile, payments);
    if (ent.unmapped.length) {
      console.warn(`[entitlements] ${userId.slice(0, 8)}… ${ent.unmapped.length} unmapped: ${ent.unmapped[0]}`);
    }
    console.info(
      `[entitlements] ${userId.slice(0, 8)}… ${ent.unlocked.length} unlocked ` +
      `(${ent.from.grants} grants, ${ent.from.payments} payments)`,
    );

    return done({
      ok: true,
      userId,
      unlocked: ent.unlocked,
      all: ent.all,
      plan: ent.plan,
      ...(slug ? { entitled: isEntitled(ent, slug) } : {}),
    });
  } catch (err) {
    console.error("[entitlements]", err);
    return done({ ok: false, reason: "error" });
  }
});
