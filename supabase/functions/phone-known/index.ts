/* ════════════════════════════════════════════════════════════════
   PHONE-KNOWN — "have we met this number before?", and nothing else.

   The unlock sheet used to ask everyone for their name, so a returning
   buyer typed it again every time and we learned nothing from the fact
   that we already knew them. Asking the number first lets the sheet
   greet a returning buyer and skip straight to the code, and ask a new
   one for their name alongside it.

   POST { phone, countryCode? } → { success: true, known: boolean }

   WHAT THIS DELIBERATELY DOES NOT RETURN, AND WHY.

   Not the user id. That is a capability — chat-signin accepts a userId
   from the caller and checks it still resolves to the same phone, so
   handing ids out over an open endpoint would weaken a check that is
   currently load-bearing.

   Not the name. The obvious personalisation is "Welcome back, Rohan",
   and it cannot be done before the code is verified: anyone who types a
   stranger's number would be told who owns it. The greeting stays
   name-less until the OTP comes back good, at which point the client
   already has the name from chat-signin and can use it freely.

   IT IS STILL AN ENUMERATION SURFACE. Anyone can ask whether a given
   number is registered here, one number at a time. That is the standing
   behaviour of most Indian consumer apps and it is the price of the
   flow the founder asked for; a boolean is the smallest answer that
   delivers it. If that trade stops being acceptable, the fix is a rate
   limit on this endpoint, not a different shape of response.

   Normalisation is copied from chat-signin rather than shared, because
   these deploy independently and a lookup that disagrees with the
   sign-in about what counts as the same number is worse than a
   duplicated function: it would greet someone as new and then attach
   them to the account it just said did not exist.

   Deploy:
     supabase functions deploy phone-known --no-verify-jwt
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
    "Access-Control-Allow-Origin": ok ? origin! : "https://gauravjainstartup-sys.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const svc = (extra: Record<string, string> = {}) => ({
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "content-type": "application/json",
  ...extra,
});

/* — the three helpers below are chat-signin's, unchanged — */

const tenDigits = (s: string) => s.replace(/\D/g, "").slice(-10);
const allDigits = (s: string) => s.replace(/\D/g, "");

function isIndian(countryCode: string | undefined, digits: string): boolean {
  const cc = (countryCode ?? "").replace(/\D/g, "");
  if (cc && cc !== "91") return false;
  return /^[6-9]\d{9}$/.test(digits.slice(-10)) && (digits.length === 10 || digits.length === 12);
}

async function findInternational(digits: string): Promise<boolean> {
  const variants = [`+${digits}`, digits];
  const emails = [
    `phone_${digits}@truthestate.com`, `intl_${digits}@truthestate.com`,
    `phone_${digits}@truthestate.in`,  `intl_${digits}@truthestate.in`,
  ];
  const or = [
    ...variants.map((v) => `phone.eq.${encodeURIComponent(v)}`),
    ...emails.map((e) => `email.eq.${encodeURIComponent(e)}`),
  ].join(",");
  try {
    const res = await fetch(`${DB_URL}/rest/v1/user_profiles?select=id&or=(${or})&limit=1`, { headers: svc() });
    if (!res.ok) {
      console.error(`[phone-known] intl lookup HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return false;
    }
    const rows = await res.json() as { id?: string }[];
    return !!rows?.[0]?.id;
  } catch (e) {
    console.error("[phone-known] intl lookup", e);
    return false;
  }
}

async function findIndian(phone10: string): Promise<boolean> {
  try {
    const res = await fetch(`${DB_URL}/rest/v1/rpc/find_user_id_by_phone`, {
      method: "POST",
      headers: svc(),
      body: JSON.stringify({ p_phone: phone10 }),
    });
    if (!res.ok) {
      console.error(`[phone-known] rpc HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return false;
    }
    const id = await res.json() as string | null;
    return typeof id === "string" && id.length > 0;
  } catch (e) {
    console.error("[phone-known] rpc", e);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };

  /* A lookup that cannot answer must not answer "new". Saying new to a
     returning buyer sends them through the name step and, worse, tells
     them we have forgotten them. `known: null` lets the sheet fall back
     to asking for a name without asserting anything either way. */
  const unknown = () => new Response(JSON.stringify({ success: true, known: null }), { status: 200, headers });

  try {
    const body = await req.json().catch(() => ({})) as { phone?: string; countryCode?: string };
    const raw = allDigits(body.phone ?? "");
    if (!raw) return unknown();

    const indian = isIndian(body.countryCode, raw);
    if (indian) {
      const ten = tenDigits(raw);
      if (ten.length !== 10) return unknown();
      return new Response(JSON.stringify({ success: true, known: await findIndian(ten) }), { status: 200, headers });
    }
    if (raw.length < 8) return unknown();
    return new Response(JSON.stringify({ success: true, known: await findInternational(raw) }), { status: 200, headers });
  } catch (e) {
    console.error("[phone-known]", e);
    return unknown();
  }
});
