/* ════════════════════════════════════════════════════════════════
   RAZORPAY — VERIFY AND GRANT.

   POST { anonId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
     → { ok, granted, unlocked: [slug], all }

   THIS IS THE ONLY PLACE ACCESS IS EVER GRANTED. The build this replaces
   granted in the browser: UnlockModal called grantPackage() on a 900ms
   setTimeout that stood in for the Razorpay round trip, wrote the
   entitlement to localStorage and unmasked the report. No charge, no
   server, nothing to verify. Anyone who opened devtools — or simply
   waited out the fake spinner — had the catalogue.

   THREE CHECKS, and all three have to pass:

     1. SIGNATURE. HMAC-SHA256 of "<order_id>|<payment_id>" keyed with the
        Razorpay secret must equal razorpay_signature. This is what proves
        the browser did not invent the payment: only Razorpay and this
        function hold the secret. Compared in constant time — a fast
        string === leaks, byte by byte, how much of a forged signature was
        right, which is enough to construct a valid one given patience.

     2. THE ORDER, FETCHED FROM RAZORPAY. A valid signature proves the
        callback is genuine; it does not prove the money arrived. We ask
        Razorpay directly whether the order is `paid`, and read the amount
        and notes from ITS copy rather than the browser's.

     3. THE AMOUNT. What was actually captured must match the price of the
        package recorded in the order's notes. A signature-valid payment
        of ₹1 against an All-Access order is not access.

   IDEMPOTENT. Razorpay can deliver the same success twice (a retried
   callback, a double click, the webhook racing the browser). A payment id
   already recorded returns the current entitlements and grants nothing
   further, so nobody is double-charged in the ledger and no grant is
   duplicated in the array.
   ════════════════════════════════════════════════════════════════ */

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

const PRICE_INR: Record<string, { inr: number; label: string; scope: "project" | "site" }> = {
  read:   { inr: 999,  label: "Full Read",             scope: "project" },
  read3d: { inr: 1499, label: "Read + Sun & Vastu 3D", scope: "project" },
  all:    { inr: 9999, label: "All-Access",            scope: "site" },
};

const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/(www\.)?truthestate\.in$/,
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

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

/* Length-independent, value-independent comparison. `a === b` on a secret
   returns as soon as two bytes differ, and that timing difference is a
   usable oracle for forging the value one byte at a time. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a), bb = enc.encode(b);
  let diff = ba.length ^ bb.length;
  const n = Math.max(ba.length, bb.length);
  for (let i = 0; i < n; i++) diff |= (ba[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

type RzpOrder = {
  id: string;
  status?: string;
  amount?: number;
  amount_paid?: number;
  currency?: string;
  notes?: { userId?: string; packageId?: string; slug?: string; label?: string; expectedPaise?: string; creditInr?: string };
};

async function fetchOrder(orderId: string): Promise<RzpOrder | null> {
  try {
    const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Basic ${btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`[razorpay-verify] order fetch ${res.status}`);
      return null;
    }
    return await res.json() as RzpOrder;
  } catch {
    return null;
  }
}

/* THE GRANT HAS TO NAME THE PROJECT, NOT THE PACKAGE.

   First cut wrote projectName from the order's `label` note — which is
   the PACKAGE label, "Full Read". entitlements/core.ts resolves a grant by
   projectId, then projectSlug, then slugify(projectName); the internal
   slug matches none of the first two here, so it would have fallen
   through to slugify("Full Read") = "full-read", which is not a project.
   The buyer pays, the ledger records it, and the report stays locked.

   So the project is looked up by its internal slug — slugify(name), the
   same identity the site's own routes and isEntitled() use — and the
   entry is written with the real name, the real backlog id and the real
   SEO slug, so all three resolution keys hit. */
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

/* The grant, in the exact shape prod has been writing since May, so the
   two sites' records stay one record. entitlements/core.ts resolves it by
   projectId first, then projectSlug, then projectName. */
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

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };
  const done = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method !== "POST") return done({ ok: false, reason: "method" }, 405);
  if (!RZP_KEY_SECRET || !DB_URL || !SERVICE_KEY) return done({ ok: false, reason: "not_configured" }, 503);

  let b: Record<string, string>;
  try { b = await req.json(); } catch { return done({ ok: false, reason: "bad_json" }, 400); }

  const orderId = String(b.razorpay_order_id ?? "");
  const paymentId = String(b.razorpay_payment_id ?? "");
  const signature = String(b.razorpay_signature ?? "");
  const anonId = String(b.anonId ?? "");
  if (!orderId || !paymentId || !signature || !anonId) return done({ ok: false, reason: "missing_fields" }, 400);

  // ── 1. signature ──
  const expected = await hmacHex(`${orderId}|${paymentId}`, RZP_KEY_SECRET);
  if (!timingSafeEqual(expected, signature)) {
    console.error(`[razorpay-verify] BAD SIGNATURE for ${orderId} / ${paymentId}`);
    return done({ ok: false, reason: "bad_signature" }, 400);
  }

  // ── 2. the order, from Razorpay itself ──
  const order = await fetchOrder(orderId);
  if (!order) return done({ ok: false, reason: "gateway" }, 502);
  if (order.status !== "paid") {
    console.warn(`[razorpay-verify] ${orderId} status=${order.status} — not granting`);
    return done({ ok: false, reason: "not_paid" }, 402);
  }

  const packageId = String(order.notes?.packageId ?? "");
  const pkg = PRICE_INR[packageId];
  if (!pkg) {
    console.error(`[razorpay-verify] ${orderId} unknown package in notes: ${packageId}`);
    return done({ ok: false, reason: "unknown_package" }, 400);
  }

  /* ── 3. the amount actually captured ──
     Against expectedPaise from the ORDER's notes, not against the list
     price: an upgrade is legitimately charged less (see the credit in
     razorpay-order). Falling back to list price when notes are absent
     keeps an older order from being under-verified. */
  const expectedPaise = Number(order.notes?.expectedPaise ?? "") || pkg.inr * 100;
  const paidPaise = order.amount_paid ?? order.amount ?? 0;
  if (paidPaise < expectedPaise) {
    console.error(`[razorpay-verify] ${orderId} underpaid: ${paidPaise} < ${expectedPaise}`);
    return done({ ok: false, reason: "amount_mismatch" }, 402);
  }

  /* The account is the one the ORDER was created for. Taking it from the
     caller instead would let a verified device replay somebody else's
     genuine callback onto its own account. anonId still has to resolve —
     an unverified caller gets nothing — but it is a gate, not the key. */
  const orderUserId = String(order.notes?.userId ?? "");
  const callerUserId = await verifiedUserId(anonId);
  if (!callerUserId) return done({ ok: false, reason: "unverified" }, 401);
  if (!orderUserId || orderUserId !== callerUserId) {
    console.error(`[razorpay-verify] ${orderId} account mismatch`);
    return done({ ok: false, reason: "account_mismatch" }, 403);
  }
  const userId = orderUserId;

  // ── idempotency: has this payment already been recorded? ──
  const seen = await sbFetch(
    `payments?select=id&razorpay_payment_id=eq.${encodeURIComponent(paymentId)}&limit=1`,
  );
  if (seen.ok && ((await seen.json()) as unknown[]).length > 0) {
    console.info(`[razorpay-verify] ${paymentId} already recorded — no double grant`);
    return done({ ok: true, granted: false, duplicate: true });
  }

  const slug = String(order.notes?.slug ?? "");
  const amountInr = Math.round(paidPaise / 100);

  /* Ledger first, then the grant. If the second write fails the customer
     has a recorded payment we can reconcile from; the other order would
     leave money taken with nothing on file. */
  const payRes = await sbFetch("payments", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      status: "completed",
      project_name: pkg.scope === "project" ? slug : null,
      package_name: packageId,
      amount: amountInr,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
    }),
  });
  if (!payRes.ok) {
    console.error(`[razorpay-verify] payments insert ${payRes.status}: ${(await payRes.text()).slice(0, 300)}`);
    return done({ ok: false, reason: "ledger_write_failed" }, 500);
  }

  /* All-Access is a plan, not 97 grants. A project purchase appends one
     entry in prod's existing shape. */
  if (pkg.scope === "site") {
    const r = await sbFetch(`user_profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ plan: "all-access" }),
    });
    if (!r.ok) console.error(`[razorpay-verify] plan write ${r.status}`);
  } else {
    const cur = await sbFetch(`user_profiles?select=unlocked_reports&id=eq.${encodeURIComponent(userId)}&limit=1`);
    const rows = cur.ok ? (await cur.json()) as { unlocked_reports?: string[] }[] : [];
    const list = Array.isArray(rows[0]?.unlocked_reports) ? rows[0].unlocked_reports! : [];
    /* Unresolvable means the catalogue is unreachable or the slug is not
       a project. Falling back to the slug in all three fields still
       resolves — entitlements compares slugify(projectName) against the
       internal slug and a slug slugifies to itself — so a buyer is never
       left holding a grant that names nothing. */
    const proj = await projectBySlug(slug);
    if (!proj) console.warn(`[razorpay-verify] ${slug} not in the catalogue — writing the slug in all three fields`);
    const entry = grantEntry({
      projectId: proj?.id ?? slug,
      projectName: proj?.name ?? slug,
      projectSlug: proj?.seoSlug ?? slug,
      paymentId,
      amountPaid: amountInr,
    });
    const r = await sbFetch(`user_profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ unlocked_reports: [...list, entry] }),
    });
    if (!r.ok) {
      console.error(`[razorpay-verify] grant write ${r.status} — payment IS recorded, reconcile ${paymentId}`);
      return done({ ok: false, reason: "grant_write_failed", paymentId }, 500);
    }
  }

  console.info(`[razorpay-verify] granted ${packageId}${slug ? ` ${slug}` : ""} to ${userId.slice(0, 8)}… (${paymentId})`);
  return done({ ok: true, granted: true, packageId, slug: slug || null, all: pkg.scope === "site" });
});
