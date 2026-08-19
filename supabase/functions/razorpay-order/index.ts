/* ════════════════════════════════════════════════════════════════
   RAZORPAY — CREATE ORDER.

   POST { anonId, packageId, slug? } → { ok, orderId, amountPaise, currency, keyId }

   THE PRICE IS DECIDED HERE AND NOWHERE ELSE. The obvious shape for this
   endpoint is to accept an amount from the client, and it is the reason
   most hand-rolled checkouts get drained: the browser is not a trusted
   party, so "amount" in a request body means "the number the buyer chose
   to send". Anyone could buy All-Access for ₹1. The client sends a
   PACKAGE ID; the rupee figure is read from the `pricing` table in the
   database (migration 0013) — the same rows the pricing UI renders from,
   so the strike-through the buyer saw and the amount the card is charged
   come from one source and cannot drift. Never an amount from the body.

   IDENTITY is the verified anon→user claim — a row this anon_id has
   already had claimed, which on this site only happens after MSG91 has
   confirmed the phone. Never a uid from the request body: that value is
   self-asserted and would let anyone buy access onto someone else's
   account, or read what they had bought.

   The key SECRET never leaves this function. The key ID is public by
   design (Razorpay's own checkout.js needs it in the browser) but is
   returned from here rather than baked into the bundle, so rotating it
   is a dashboard change and not a rebuild.
   ════════════════════════════════════════════════════════════════ */

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = (Deno.env.get("EDGE_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";
const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

/* FALLBACK ONLY. The live prices are in the `pricing` table (migration
   0013) and this function reads them per order; the client's PACKAGES is
   what the UI *offers*, the table is what the buyer is *charged*, and the
   two must not be reachable from each other. This copy exists so a
   momentary failure to read the table creates a correct, current order
   rather than turning a paying customer away — it mirrors the seeded
   baseline and the table always wins when it is reachable. */
type Price = { mrp: number; price: number; label: string; scope: "project" | "site"; discountLabel: string | null };
const DEFAULT_PRICING: Record<string, Omit<Price, "discountLabel">> = {
  read:   { mrp: 2100,  price: 1100,  label: "Full Read",              scope: "project" },
  read3d: { mrp: 1499,  price: 1499,  label: "Read + Sun & Vastu 3D",  scope: "project" },
  all:    { mrp: 11000, price: 5100,  label: "All-Access",             scope: "site" },
};
const fallbackPrice = (id: string): Price | null => {
  const f = DEFAULT_PRICING[id];
  return f ? { ...f, discountLabel: f.mrp > f.price ? "Inaugural offer" : null } : null;
};

const packageIdIsAll = (id: unknown): boolean => id === "all";

/* THE PRICE, READ LIVE FROM THE TABLE. price_inr is charged, mrp_inr is
   the struck list price, and a discount past its end date is no discount.
   The table is authority when reachable: an id that is absent or inactive
   is simply not on sale (null → unknown_package), NOT quietly rescued by
   the fallback. The fallback fires only when the READ itself fails, so an
   outage cannot take checkout down. */
type PricingRow = {
  label: string; scope: "project" | "site";
  mrp_inr: number; price_inr: number;
  discount_label: string | null; discount_ends_at: string | null;
};
async function priceOf(packageId: string): Promise<Price | null> {
  try {
    const res = await sb(
      `pricing?select=label,scope,mrp_inr,price_inr,discount_label,discount_ends_at` +
      `&package_id=eq.${encodeURIComponent(packageId)}&active=eq.true&limit=1`,
    );
    if (res.ok) {
      const r = (await res.json() as PricingRow[])[0];
      if (!r) return null;                                   // the table says: not an active offer
      const ended = r.discount_ends_at ? Date.parse(r.discount_ends_at) < Date.now() : false;
      const price = ended ? r.mrp_inr : r.price_inr;
      return {
        mrp: r.mrp_inr, price, label: r.label, scope: r.scope,
        discountLabel: ended || price >= r.mrp_inr ? null : r.discount_label,
      };
    }
    console.warn(`[razorpay-order] pricing read ${res.status} — using fallback`);
  } catch (e) {
    console.warn(`[razorpay-order] pricing read failed — using fallback: ${e instanceof Error ? e.message : "error"}`);
  }
  return fallbackPrice(packageId);
}

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

/* Identical rule to entitlements and track: a claimed row is proof of who
   this device is in a way a request body never is. */
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
  const done = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method !== "POST") return done({ ok: false, reason: "method" }, 405);
  if (!RZP_KEY_ID || !RZP_KEY_SECRET) {
    console.error("[razorpay-order] keys not configured");
    return done({ ok: false, reason: "not_configured" }, 503);
  }

  let body: { anonId?: string; packageId?: string; slug?: string };
  try { body = await req.json(); } catch { return done({ ok: false, reason: "bad_json" }, 400); }

  const packageId = String(body.packageId ?? "");
  const pkg = await priceOf(packageId);
  if (!pkg) return done({ ok: false, reason: "unknown_package" }, 400);

  /* A project package without a project is not a purchase we can honour —
     the grant would have nothing to attach to and the buyer would be left
     with a payment and no report. */
  const slug = typeof body.slug === "string" ? body.slug.trim().slice(0, 200) : "";
  if (pkg.scope === "project" && !slug) return done({ ok: false, reason: "slug_required" }, 400);

  const anonId = typeof body.anonId === "string" ? body.anonId.trim() : "";
  if (!anonId) return done({ ok: false, reason: "anon_required" }, 400);
  const userId = await verifiedUserId(anonId);
  if (!userId) {
    /* Not an error — the caller simply has not verified a phone yet. The
       UI sends them back to the OTP step rather than to Razorpay, so
       nobody can pay before we know who to credit. */
    return done({ ok: false, reason: "unverified" }, 200);
  }

  /* UPGRADE CREDIT, COMPUTED HERE.

     "Pay the difference": someone who already bought this project's read
     and now buys All-Access is charged the balance, not the full price
     again. That subtraction used to happen in the browser off
     localStorage, which makes the discount a client-supplied number — the
     same class of problem as a client-supplied price, just wearing a
     friendlier face.

     The credit is the rupees this account has already paid for this
     project, read from the ledger. Nothing the caller sends is involved.
     If the ledger is unreachable the credit is zero, which errs toward
     charging full price rather than giving the catalogue away — and is
     visible to the buyer before they pay. */
  let creditInr = 0;
  if (pkg.scope === "project" || packageIdIsAll(packageId)) {
    const prior = await sb(
      `payments?select=project_id,project_name,amount&user_id=eq.${encodeURIComponent(userId)}` +
      `&status=eq.completed&limit=200`,
    );
    if (prior.ok) {
      const rows = await prior.json() as { project_id?: string; project_name?: string; amount?: number | string }[];
      /* Credit the actual rupees already paid for THIS project, read from
         the ledger, so the upgrade price is right regardless of what the
         list price is today. Matched through the slug because project_name
         is the readable name on new rows and the raw slug on old ones and
         both slugify the same. The site-wide sentinel is skipped —
         All-Access is not a per-project credit. */
      const asSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      for (const r of rows) {
        if ((r.project_id ?? "") === "all-access") continue;
        if (asSlug(r.project_name ?? "") !== slug) continue;
        const amt = typeof r.amount === "string" ? parseFloat(r.amount) : r.amount ?? 0;
        if (Number.isFinite(amt) && (amt as number) > creditInr) creditInr = Math.round(amt as number);
      }
    } else {
      console.warn(`[razorpay-order] ledger ${prior.status} — no credit applied`);
    }
  }

  const amountPaise = Math.max(pkg.price - creditInr, 0) * 100;
  /* Razorpay will not create a zero-value order, and an account that has
     already paid for an equal or better tier should not be here at all —
     the sheet filters owned tiers out. Fail loudly rather than take ₹0. */
  if (amountPaise <= 0) return done({ ok: false, reason: "already_owned" }, 409);
  /* Razorpay receipts are capped at 40 characters. */
  const receipt = `te_${Date.now().toString(36)}_${userId.slice(0, 8)}`.slice(0, 40);

  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        /* Notes travel with the order and come back on the webhook and on
           the order fetch, so verification can confirm what was bought
           without trusting the browser to tell it a second time. */
        /* expectedPaise is what verify compares the captured amount
           against. Recomputing the credit at verification time would race
           the buyer's own entitlements — two tabs, or a webhook arriving
           after a second purchase — and could reject a payment that was
           correct when it was made. */
        notes: { userId, packageId, slug, label: pkg.label, expectedPaise: String(amountPaise), creditInr: String(creditInr), mrpInr: String(pkg.mrp), discountLabel: pkg.discountLabel ?? "" },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`[razorpay-order] create failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return done({ ok: false, reason: "gateway" }, 502);
    }
    const order = await res.json() as { id: string; amount: number; currency: string };
    console.info(`[razorpay-order] ${order.id} ₹${amountPaise / 100} ${packageId}${creditInr ? ` (₹${creditInr} credited)` : ""} for ${userId.slice(0, 8)}…`);
    return done({
      ok: true,
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      keyId: RZP_KEY_ID,
      label: pkg.label,
      /* So the checkout UI can show the strike-through the buyer saw on the
         paywall. mrp is the list price; amountPaise is the true charge. */
      mrp: pkg.mrp,
      discountLabel: pkg.discountLabel,
    });
  } catch (e) {
    console.error(`[razorpay-order] ${e instanceof Error ? e.message : "error"}`);
    return done({ ok: false, reason: "gateway" }, 502);
  }
});
