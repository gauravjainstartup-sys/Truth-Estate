/* ════════════════════════════════════════════════════════════════
   PRICING — the packages the site offers, served to the browser.

   GET → { ok, packages: [{ id, label, scope, mrp, price, discountLabel,
           includes3D, blurb }], updatedAt }

   Public and unauthenticated: a price is not a secret, and the paywall
   needs it before anyone has signed in. The row's `price_inr` is what the
   buyer pays, `mrp_inr` is the struck-out list price, and the gap is the
   discount — the SAME table razorpay-order charges from, so what the UI
   shows and what the card is charged can never drift.

   The response is cacheable for a minute: long enough to spare the
   database a hit per page view, short enough that turning the inaugural
   offer off in SQL reaches every visitor within the minute. The charge
   authority (razorpay-order) reads the table live, so a price change is
   correct at checkout the instant it lands, cache or no cache.

   Only ACTIVE rows are returned — a retired SKU (read3d) is still honoured
   in the ledger and priced for upgrades, but never offered here.
   ════════════════════════════════════════════════════════════════ */

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const ALLOW_ORIGIN = [
  /^https:\/\/gauravjainstartup-sys\.github\.io$/,
  /^https:\/\/(www\.)?truthestate\.in$/,
  /* Cloud Run — both host forms, same as the other functions. */
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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

type PricingRow = {
  package_id: string;
  label: string;
  scope: "project" | "site";
  mrp_inr: number;
  price_inr: number;
  discount_label: string | null;
  discount_ends_at: string | null;
  includes_3d: boolean;
  blurb: string | null;
  updated_at: string;
};

/* The one pricing rule, shared in spirit with razorpay-order: a discount
   past its end date is no discount — the list price is charged and the UI
   shows no strike-through. */
function effective(row: PricingRow, now: number): { price: number; discountLabel: string | null } {
  const ended = row.discount_ends_at ? Date.parse(row.discount_ends_at) < now : false;
  const hasDiscount = !ended && row.price_inr < row.mrp_inr;
  return {
    price: ended ? row.mrp_inr : row.price_inr,
    discountLabel: hasDiscount ? row.discount_label : null,
  };
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { ...h, "content-type": "application/json", ...extra } });

  if (req.method !== "GET") return json({ ok: false, reason: "method" }, 405);

  try {
    const res = await fetch(
      `${DB_URL}/rest/v1/pricing` +
        `?select=package_id,label,scope,mrp_inr,price_inr,discount_label,discount_ends_at,includes_3d,blurb,updated_at` +
        `&active=eq.true&order=sort.asc`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) {
      console.error(`[pricing] table read ${res.status}`);
      return json({ ok: false, reason: "unavailable" }, 502);
    }
    const rows = (await res.json()) as PricingRow[];
    const now = Date.now();
    let updatedAt = "";
    const packages = rows.map((r) => {
      const { price, discountLabel } = effective(r, now);
      if (r.updated_at > updatedAt) updatedAt = r.updated_at;
      return {
        id: r.package_id,
        label: r.label,
        scope: r.scope,
        mrp: r.mrp_inr,
        price,
        discountLabel,
        includes3D: r.includes_3d,
        blurb: r.blurb ?? "",
      };
    });
    /* One minute at the edge and in the browser; see the header note. */
    return json({ ok: true, packages, updatedAt }, 200, {
      "Cache-Control": "public, max-age=60, s-maxage=60",
    });
  } catch (e) {
    console.error(`[pricing] ${e instanceof Error ? e.message : "error"}`);
    return json({ ok: false, reason: "error" }, 500);
  }
});
