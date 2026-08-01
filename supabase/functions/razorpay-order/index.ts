/* ════════════════════════════════════════════════════════════════
   RAZORPAY — CREATE ORDER.

   POST { anonId, packageId, slug? } → { ok, orderId, amountPaise, currency, keyId }

   THE PRICE IS DECIDED HERE AND NOWHERE ELSE. The obvious shape for this
   endpoint is to accept an amount from the client, and it is the reason
   most hand-rolled checkouts get drained: the browser is not a trusted
   party, so "amount" in a request body means "the number the buyer chose
   to send". Anyone could buy All-Access for ₹1. The client sends a
   PACKAGE ID; the rupee figure comes from the table below, which is the
   same one the pricing UI renders from.

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
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

/* Mirrors PACKAGES in src/lib/journey.ts. Duplicated deliberately rather
   than imported: the client copy is what the UI *offers*, this copy is
   what the buyer is *charged*, and the second must not be reachable from
   the first. If they ever disagree the server wins and the order simply
   costs what it says here. */
const PRICE_INR: Record<string, { inr: number; label: string; scope: "project" | "site" }> = {
  read:   { inr: 999,  label: "Full Read",              scope: "project" },
  read3d: { inr: 1499, label: "Read + Sun & Vastu 3D",  scope: "project" },
  all:    { inr: 9999, label: "All-Access",             scope: "site" },
};

const packageIdIsAll = (id: unknown): boolean => id === "all";

/* WHAT TIER A PAST PAYMENT WAS, INCLUDING THE ONES FROM THE OLD SITE.

   package_name is a package ID on rows this build writes ("read"), and a
   sentence on the ones truthestate.in has been writing since May:
   "Project Intelligence Access: DLF Privana West". A straight lookup
   misses every legacy row, and the consequence is not cosmetic — the
   upgrade credit silently becomes zero, so a customer who bought the
   ₹999 read on the old site would be charged the full ₹1,499 for the 3D
   instead of the ₹500 difference. Overcharging a returning customer is
   the worst possible way to greet them.

   So: the id when it is one, otherwise the tier is inferred from what
   they actually paid. The amount is the honest fact in either format,
   and the tolerance is tight enough that no two tiers can be confused. */
function tierOf(packageName: unknown, amount: unknown): { inr: number; scope: "project" | "site" } | null {
  const direct = PRICE_INR[String(packageName ?? "")];
  if (direct) return direct;
  const amt = typeof amount === "string" ? parseFloat(amount) : typeof amount === "number" ? amount : NaN;
  if (!Number.isFinite(amt)) return null;
  /* Nearest tier within ₹1, so 999.00 from a numeric column matches and a
     part-payment or an unrelated figure does not. */
  for (const p of Object.values(PRICE_INR)) if (Math.abs(amt - p.inr) < 1) return p;
  return null;
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

  const pkg = PRICE_INR[String(body.packageId ?? "")];
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

     The sheet offers "pay the difference": someone who bought the ₹999
     read and now wants the 3D is shown ₹500, not ₹1,499. That subtraction
     was happening in the browser off localStorage, which makes the
     discount a client-supplied number — the same class of problem as a
     client-supplied price, just wearing a friendlier face.

     The credit is derived from this account's own completed payments for
     this project: the highest tier already paid for. Nothing the caller
     sends is involved. If the ledger is unreachable the credit is zero,
     which errs toward charging full price rather than giving the
     catalogue away — and is visible to the buyer before they pay. */
  let creditInr = 0;
  if (pkg.scope === "project" || packageIdIsAll(body.packageId)) {
    const prior = await sb(
      `payments?select=package_name,project_name,status&user_id=eq.${encodeURIComponent(userId)}` +
      `&status=eq.completed&limit=200`,
    );
    if (prior.ok) {
      const rows = await prior.json() as { package_name?: string; project_name?: string }[];
      /* Compared through the slug, not by string equality: project_name
         holds the readable project name on rows written since the ledger
         was matched to the table, and the raw slug on the ones before it.
         Both slugify to the same thing, so both credit correctly. */
      const asSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      for (const r of rows) {
        if (asSlug(r.project_name ?? "") !== slug) continue;
        const paid = tierOf(r.package_name, r.amount);
        if (paid && paid.scope === "project" && paid.inr > creditInr) creditInr = paid.inr;
      }
    } else {
      console.warn(`[razorpay-order] ledger ${prior.status} — no credit applied`);
    }
  }

  const amountPaise = Math.max(pkg.inr - creditInr, 0) * 100;
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
        notes: { userId, packageId: body.packageId, slug, label: pkg.label, expectedPaise: String(amountPaise), creditInr: String(creditInr) },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`[razorpay-order] create failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return done({ ok: false, reason: "gateway" }, 502);
    }
    const order = await res.json() as { id: string; amount: number; currency: string };
    console.info(`[razorpay-order] ${order.id} ₹${amountPaise / 100} ${body.packageId}${creditInr ? ` (₹${creditInr} credited)` : ""} for ${userId.slice(0, 8)}…`);
    return done({
      ok: true,
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      keyId: RZP_KEY_ID,
      label: pkg.label,
    });
  } catch (e) {
    console.error(`[razorpay-order] ${e instanceof Error ? e.message : "error"}`);
    return done({ ok: false, reason: "gateway" }, 502);
  }
});
