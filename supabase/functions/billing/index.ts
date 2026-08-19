/* ════════════════════════════════════════════════════════════════
   BILLING — this account's payments, for the Help Centre.

   POST { anonId } → { ok, userId, payments: [...], totalInr }

   IDENTITY is the verified anon→user claim, the same rule entitlements
   and razorpay-order use: a row this anon_id has already had claimed,
   which only happens after MSG91 has confirmed the phone. Never a uid
   from the body. Getting this wrong here is worse than usual — the
   response is somebody's purchase history, with amounts and gateway
   references.

   Only the caller's own rows are ever selected; there is no path through
   this function that reads another account's payments, because the
   user_id filter is the resolved id and not a parameter.

   No PAN, no card, no billing address — Razorpay holds those and we
   never see them. A receipt from here is a record of a transaction, and
   deliberately not a GST tax invoice: that needs a GSTIN, a place of
   supply and an HSN/SAC code, none of which are in this database. See
   the note in src/lib/billing.ts.
   ════════════════════════════════════════════════════════════════ */

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = (Deno.env.get("EDGE_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";

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
    "Access-Control-Allow-Origin": ok ? origin! : "https://www.truthestate.in",
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

const PACKAGE_LABEL: Record<string, string> = {
  read: "Full Read",
  read3d: "Read + Sun & Vastu 3D",
  all: "All-Access",
};
const PRICE_LABEL: Record<number, string> = { 999: "Full Read", 1499: "Read + Sun & Vastu 3D", 9999: "All-Access" };

/* Legacy rows store a sentence where new rows store an id — "Project
   Intelligence Access: DLF Privana West". Printed verbatim next to the
   project name it reads as a stutter, so the tier is recovered from the
   amount and the sentence is only the last resort. */
function labelFor(packageName: string | null | undefined, amountInr: number): string {
  const direct = PACKAGE_LABEL[String(packageName ?? "")];
  if (direct) return direct;
  return PRICE_LABEL[amountInr] ?? String(packageName ?? "") ?? "Report access";
}

const liveSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* project_name on a payment row is the internal slug. The Help Centre
   should say "DLF The Arbour", not "dlf-the-arbour" — a receipt a customer
   cannot read is a support ticket. */
async function nameBySlug(): Promise<Record<string, string>> {
  try {
    const res = await sb("backlog_listing_public_v3?select=name&limit=500");
    if (!res.ok) return {};
    const rows = await res.json() as { name?: string }[];
    const out: Record<string, string> = {};
    for (const r of rows) if (r?.name) out[liveSlug(r.name)] = r.name;
    return out;
  } catch {
    return {};
  }
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };
  const done = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method !== "POST") return done({ ok: false, reason: "method" }, 405);
  if (!DB_URL || !SERVICE_KEY) return done({ ok: false, reason: "not_configured" }, 503);

  let body: { anonId?: string };
  try { body = await req.json(); } catch { return done({ ok: false, reason: "bad_json" }, 400); }
  const anonId = typeof body.anonId === "string" ? body.anonId.trim() : "";
  if (!anonId) return done({ ok: false, reason: "anon_required" }, 400);

  const userId = await verifiedUserId(anonId);
  /* An unverified caller is not an error — they simply have no billing
     history to show, and the Help Centre asks them to sign in. Returning
     an empty list rather than a 401 keeps that a normal state. */
  if (!userId) return done({ ok: true, userId: null, payments: [], totalInr: 0 });

  const [payRes, names] = await Promise.all([
    sb(
      `payments?select=id,status,project_name,package_name,amount,created_at,razorpay_order_id,razorpay_payment_id` +
      `&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=200`,
    ),
    nameBySlug(),
  ]);
  if (!payRes.ok) {
    console.error(`[billing] payments ${payRes.status} for ${userId.slice(0, 8)}…`);
    return done({ ok: false, reason: "read_failed" }, 500);
  }

  type Row = {
    id?: string; status?: string; project_name?: string | null; package_name?: string | null;
    amount?: number | string | null; created_at?: string;
    razorpay_order_id?: string | null; razorpay_payment_id?: string | null;
  };
  const rows = await payRes.json() as Row[];

  const payments = rows.map((r) => {
    /* project_name is a readable name on new rows and a raw slug on the
       old ones. Slugify before the lookup so both resolve, and fall back
       to whatever was stored rather than showing a blank. */
    const stored = r.project_name ?? "";
    const slug = stored ? liveSlug(stored) : "";
    const amt = typeof r.amount === "string" ? parseFloat(r.amount) : (r.amount ?? 0);
    const amountInr = Number.isFinite(amt) ? Math.round(amt as number) : 0;
    return {
      id: r.id ?? r.razorpay_payment_id ?? "",
      status: (r.status ?? "").toLowerCase(),
      packageId: r.package_name ?? null,
      packageLabel: labelFor(r.package_name, amountInr),
      projectSlug: slug || null,
      projectName: stored ? (names[slug] ?? stored) : null,
      amountInr,
      paidAt: r.created_at ?? null,
      orderId: r.razorpay_order_id ?? null,
      paymentId: r.razorpay_payment_id ?? null,
    };
  });

  const totalInr = payments
    .filter((p) => p.status === "completed")
    .reduce((n, p) => n + p.amountInr, 0);

  console.info(`[billing] ${userId.slice(0, 8)}… ${payments.length} payment(s), ₹${totalInr}`);
  return done({ ok: true, userId, payments, totalInr });
});
