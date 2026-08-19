/* ════════════════════════════════════════════════════════════════
   CLAIM FREE UNLOCK — the first report, on the house.

   POST { anonId, slug } → { ok, granted, slug } | { ok:false, reason }

   Every NEW profile (one that has never unlocked anything) gets its first
   project Full Read free — phone sign-up only, no card. A free unlock is
   NOT a Razorpay order: the gateway rejects ₹0, and more to the point the
   entitlement is the whole transaction, so it is written here directly
   against the service role — the same grant shape razorpay-verify writes,
   just with amountPaid 0.

   ELIGIBILITY IS ENFORCED HERE, NEVER TRUSTED FROM THE CLIENT. The guard is
   user_profiles.first_free_used (migration 0018), claimed with ONE
   conditional UPDATE:

     PATCH first_free_used=true WHERE id=:uid AND first_free_used IS NOT TRUE

   Postgres makes that atomic, so two tabs cannot both win the free slot:
   exactly one UPDATE returns a row, the other returns none and the caller
   falls back to paying. The backfill in 0018 already marked every existing
   owner used, so "flag is false" means "genuinely new profile".

   GRANT, THEN RECORD — as razorpay-verify does. If the grant write itself
   fails after we claimed the flag, we release the flag again so the buyer
   keeps their free report for a retry rather than losing it to our error.
   The ₹0 ledger row is best-effort and after the fact (it only feeds the
   "Complimentary" line in Owned/invoices; the grant is what unlocks).
   ════════════════════════════════════════════════════════════════ */

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = (Deno.env.get("EDGE_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";

const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/(www\.)?truthestate\.in$/,
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
    "Access-Control-Allow-Origin": ok ? origin! : "https://www.truthestate.in",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const sbFetch = (path: string, init: RequestInit = {}) =>
  fetch(`${DB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(8000),
  });

/* Identity is the verified anon→user claim — the same rule razorpay-order,
   razorpay-verify and entitlements use. A user_id in the request body is
   self-asserted and would let anyone spend someone else's free report. */
async function verifiedUserId(anonId: string): Promise<string | null> {
  try {
    const res = await sbFetch(
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

/* Byte-identical to razorpay-verify: the grant needs the name, the backlog
   id and the SEO slug so entitlements/core.ts resolves it by any of the
   three keys. */
const liveSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const seoSlugOf = (name: string, mm: string | null, loc: string | null) =>
  ["gurugram-real-estate", liveSlug(name), liveSlug(mm ?? ""), liveSlug(loc ?? "")].filter(Boolean).join("-");

type ProjectRef = { id: string; name: string; seoSlug: string };

async function projectBySlug(slug: string): Promise<ProjectRef | null> {
  try {
    const res = await sbFetch(`backlog_listing_public_v3?select=id,name,microMarket,location&limit=500`);
    if (!res.ok) return null;
    const rows = await res.json() as { id?: string; name?: string; microMarket?: string; location?: string }[];
    for (const r of rows) {
      if (!r?.name || liveSlug(r.name) !== slug) continue;
      return { id: r.id ?? slug, name: r.name, seoSlug: seoSlugOf(r.name, r.microMarket ?? null, r.location ?? null) };
    }
    return null;
  } catch {
    return null;
  }
}

function grantEntry(o: { projectId: string; projectName: string; projectSlug: string; paymentId: string; amountPaid: number }) {
  return JSON.stringify({
    projectId: o.projectId,
    projectName: o.projectName,
    projectSlug: o.projectSlug,
    unlockedAt: new Date().toISOString(),
    paymentId: o.paymentId,
    amountPaid: o.amountPaid,
  });
}

/* The struck list value of the Full Read, so the free unlock's invoice can
   say "₹0, was ₹2,100" without reading the pricing table live — a free grant
   has no order to stamp it from. Structural, not the charge authority. */
const READ_MRP_INR = 2100;

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };
  const done = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method !== "POST") return done({ ok: false, reason: "method" }, 405);

  let body: { anonId?: string; slug?: string };
  try { body = await req.json(); } catch { return done({ ok: false, reason: "bad_json" }, 400); }

  const slug = typeof body.slug === "string" ? body.slug.trim().slice(0, 200) : "";
  if (!slug) return done({ ok: false, reason: "slug_required" }, 400);

  const anonId = typeof body.anonId === "string" ? body.anonId.trim() : "";
  if (!anonId) return done({ ok: false, reason: "anon_required" }, 400);

  const userId = await verifiedUserId(anonId);
  /* Not an error — the caller simply has not verified a phone yet. The UI
     sends them back to the OTP step, never to a grant, so nobody unlocks
     before we know whose account to credit. */
  if (!userId) return done({ ok: false, reason: "unverified" });

  /* ── the atomic claim ── one free slot, taken with a single conditional
     UPDATE. A row back means this request won it; none back means the flag
     was already true (used, or an existing owner backfilled in 0018) — the
     caller then falls back to the paid flow. */
  let claimed: { id: string }[] = [];
  try {
    const res = await sbFetch(
      `user_profiles?id=eq.${encodeURIComponent(userId)}&first_free_used=is.false`,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ first_free_used: true }) },
    );
    if (!res.ok) {
      console.error(`[claim-free-unlock] flag claim ${res.status} for ${userId.slice(0, 8)}…`);
      return done({ ok: false, reason: "error" }, 500);
    }
    claimed = await res.json() as { id: string }[];
  } catch (e) {
    console.error(`[claim-free-unlock] ${e instanceof Error ? e.message : "error"}`);
    return done({ ok: false, reason: "error" }, 500);
  }
  if (claimed.length === 0) {
    /* Already used their free report (or an existing customer). Not an
       error — the client shows the normal price from here. */
    return done({ ok: false, reason: "not_eligible" });
  }

  /* Release the flag so a failed grant does not silently burn the free slot. */
  const releaseFlag = async () => {
    try {
      await sbFetch(`user_profiles?id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ first_free_used: false }),
      });
    } catch { /* logged by the caller */ }
  };

  const proj = await projectBySlug(slug);
  if (!proj) console.warn(`[claim-free-unlock] ${slug} not in the catalogue — falling back to the slug`);

  /* Append the grant (read-modify-write, exactly as razorpay-verify does).
     If the report is somehow already granted, leave the list as-is. */
  const cur = await sbFetch(`user_profiles?select=unlocked_reports&id=eq.${encodeURIComponent(userId)}&limit=1`);
  const rows = cur.ok ? (await cur.json()) as { unlocked_reports?: string[] }[] : [];
  const list = Array.isArray(rows[0]?.unlocked_reports) ? rows[0].unlocked_reports! : [];
  const has = list.some((e) => typeof e === "string" && (e.includes(`"projectSlug":"${proj?.seoSlug ?? ""}"`) || e.includes(`"projectId":"${proj?.id ?? ""}"`) || e === slug));

  const paymentId = `free-first-${userId}`;
  if (!has) {
    const entry = grantEntry({
      projectId: proj?.id ?? slug,
      projectName: proj?.name ?? slug,
      projectSlug: proj?.seoSlug ?? slug,
      paymentId,
      amountPaid: 0,
    });
    const g = await sbFetch(`user_profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ unlocked_reports: [...list, entry] }),
    });
    if (!g.ok) {
      console.error(`[claim-free-unlock] GRANT WRITE FAILED ${g.status} for ${userId.slice(0, 8)}… — releasing flag`);
      await releaseFlag();
      return done({ ok: false, reason: "grant_write_failed" }, 500);
    }
  }

  /* The ledger — best-effort, after the fact. A ₹0, "Complimentary" line so
     Owned/invoices shows the free read. razorpay_payment_id is deterministic
     (`free-first-<uid>`) so a retry can't double-insert. */
  try {
    await sbFetch("payments", {
      method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        project_id: proj?.id ?? slug,
        project_name: proj?.name ?? slug,
        package_name: "read",
        amount: 0,
        mrp_inr: READ_MRP_INR,
        discount_label: "First report free",
        currency: "INR",
        status: "completed",
        razorpay_order_id: "free-first",
        razorpay_payment_id: paymentId,
        razorpay_signature: "",
      }),
    });
  } catch (e) {
    console.warn(`[claim-free-unlock] ledger write skipped: ${e instanceof Error ? e.message : "error"}`);
  }

  console.info(`[claim-free-unlock] granted ${slug} FREE to ${userId.slice(0, 8)}…`);
  return done({ ok: true, granted: true, slug: slug || null, all: false });
});
