/* ════════════════════════════════════════════════════════════════
   CHAT-SIGNIN — completes a sign-in that verify-otp only half finishes.

   The deployed verify-otp confirms the code with MSG91 and returns
   success. It does not create a Supabase user, so a visitor could sign
   in through the chat and stay completely invisible: conversation still
   filed under anon_id, name typed into the chat going nowhere, and no
   way to answer "who logged in and what did they do".

   This wraps it rather than modifying it. verify-otp is shared with the
   live AI Studio site, and changing a function that production depends
   on to serve a second consumer is how you break the first one.

   POST { phone, otp, countryCode?, anonId?, sessionId?, name? }
     → { ok: true, userId, chatsClaimed, leadsClaimed, verified }
     → { ok: false, error }

   INTERNATIONAL NUMBERS TAKE A DUMMY PATH. MSG91's DLT templates only
   reach Indian handsets, so a code sent to a UK or UAE number is billed
   for and never arrives. Until the WhatsApp templates are live, any code
   is accepted for a non-Indian number — which is what truthestate.in
   already does today, where international sign-in has no OTP at all.

   It is recorded honestly: phone_verified stays FALSE for those
   accounts, so nothing downstream can mistake one for a verified
   handset. Anyone who knows an international number can sign in as that
   person; that is the standing behaviour of the live site, not something
   introduced here, and it is why the flag exists.

   WHY THE VERIFY HAPPENS HERE. The obvious shortcut is to let the
   browser call verify-otp itself and then tell us "I'm verified". That
   would let anyone POST a stranger's number and inherit their history.
   The code is checked on this side, where the client cannot reach.

   Deploy:
     supabase functions deploy chat-signin --no-verify-jwt
   ════════════════════════════════════════════════════════════════ */

const DB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

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

async function rpc<T>(fn: string, args: unknown): Promise<T | null> {
  const res = await fetch(`${DB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST", headers: svc(), body: JSON.stringify(args),
  });
  if (!res.ok) {
    console.error(`[chat-signin] rpc ${fn} HTTP ${res.status}: ${(await res.text()).slice(0, 240)}`);
    return null;
  }
  try { return (await res.json()) as T; } catch { return null; }
}

/* ── Who this device is NOW ───────────────────────────────────────────
   track resolves a device to a person by reading the newest events row
   for that anon_id that already carries a user_id. link_verified_phone
   backfills that column, but only `where user_id is null` — correctly,
   since it must never reassign somebody else's history.

   Together those two rules have a consequence nobody chose: the SECOND
   person to sign in on a handset claims nothing (every row already
   belongs to the first), so no row ever carries their id, so track keeps
   resolving the device to the first person — permanently. Their reading,
   their enquiries and their payment all land on someone else's trail.

   One row fixes it. Writing the sign-in itself with the new user_id
   gives the resolver something to find, and every event after it is
   attributed to whoever actually signed in. Best-effort: a failure here
   costs attribution, and must never cost a sign-in. */
async function stampSignIn(userId: string, anonId?: string | null, sessionId?: string | null): Promise<void> {
  if (!anonId) return;
  try {
    const res = await fetch(`${DB_URL}/rest/v1/events`, {
      method: "POST",
      headers: svc({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        anon_id: anonId,
        session_id: sessionId ?? null,
        user_id: userId,
        name: "signed_in",
        props: { via: "chat-signin", server: true },
      }),
    });
    if (!res.ok) console.error(`[chat-signin] stamp HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  } catch (e) {
    console.error("[chat-signin] stamp failed", e);
  }
}

/* Last ten digits. user_profiles alone holds '9958777313',
   '+917011823963' and '7768003668', so anything stricter fails to match
   a returning visitor and silently creates them a second account. */
const tenDigits = (s: string) => s.replace(/\D/g, "").slice(-10);

const allDigits = (s: string) => s.replace(/\D/g, "");

/* Anything that is not a +91 ten-digit mobile. The caller sends the
   dialling code it collected rather than us guessing from the number:
   +1 and +91 numbers are both parseable as "some digits", and a wrong
   guess either bills for an SMS that cannot arrive or blocks a real
   Indian visitor. */
function isIndian(countryCode: string | undefined, digits: string): boolean {
  const cc = (countryCode ?? "").replace(/\D/g, "");
  if (cc && cc !== "91") return false;
  return /^[6-9]\d{9}$/.test(digits.slice(-10)) && (digits.length === 10 || digits.length === 12);
}

/* Finding an existing international account is genuinely unreliable, and
   pretending otherwise would silently split people across duplicates.
   Production holds the same kind of number as '+14377705834',
   '61456787654' and '+3542321435', with six accounts carrying NO phone
   at all and identified only by a synthetic 'phone_<digits>@' email —
   in two different conventions. Every one of those shapes is checked
   here. It will still miss occasionally; a duplicate account is the
   failure mode, and it is a better one than attaching a stranger. */
async function findInternational(digits: string): Promise<string | null> {
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
      console.error(`[chat-signin] intl lookup HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const rows = await res.json() as { id?: string }[];
    return rows?.[0]?.id ?? null;
  } catch (e) {
    console.error("[chat-signin] intl lookup", e);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const headers = { ...h, "content-type": "application/json" };
  const fail = (error: string, log?: string) => {
    if (log) console.error(`[chat-signin] ${log}`);
    return new Response(JSON.stringify({ ok: false, error }), { status: 200, headers });
  };

  if (req.method !== "POST") return fail("method");
  if (!DB_URL || !SERVICE_KEY) return fail("Sign-in is unavailable right now.", "missing env");

  try {
    const body = await req.json() as {
      phone?: string; otp?: string; countryCode?: string;
      anonId?: string; sessionId?: string;
      name?: string; nameOnly?: boolean; userId?: string;
    };
    const raw = allDigits(body.phone ?? "");
    const indian = isIndian(body.countryCode, raw);
    const phone = indian ? tenDigits(body.phone ?? "") : raw;
    const otp = (body.otp ?? "").replace(/\D/g, "");
    if (indian && phone.length !== 10) return fail("That number doesn't look right — mind checking it?");
    /* A country code plus a handful of digits. Short enough to be a typo
       is rejected; the alternative is an account keyed on '44'. */
    if (!indian && phone.length < 8) return fail("That number doesn't look right — mind checking it?");

    /* NAME-ONLY. The chat asks for a name AFTER verification, by which
       point the code is spent and cannot be replayed. Rather than burn a
       second SMS, this path accepts the userId returned by the verified
       call and checks it still resolves to the same phone — so a caller
       needs BOTH the phone and a UUID that was only ever handed to the
       verified client. Proportionate for a display name; it is not a
       route to anything else. */
    if (body.nameOnly) {
      const claimed = (body.userId ?? "").trim();
      if (!claimed) return fail("Couldn't save that name.", "nameOnly without userId");
      const actual = await rpc<string | null>("find_user_id_by_phone", { p_phone: phone });
      if (!actual || actual !== claimed) {
        return fail("Couldn't save that name.", `nameOnly mismatch claimed=${claimed} actual=${actual}`);
      }
      const l = await rpc<{ chats_claimed?: number; leads_claimed?: number }>("link_verified_phone", {
        p_user_id: actual, p_phone: phone,
        p_anon_id: body.anonId ?? null, p_session_id: body.sessionId ?? null,
        p_name: body.name ?? null,
      });
      await stampSignIn(actual, body.anonId, body.sessionId);
      return new Response(JSON.stringify({
        ok: true, userId: actual,
        chatsClaimed: l?.chats_claimed ?? 0, leadsClaimed: l?.leads_claimed ?? 0,
      }), { status: 200, headers });
    }

    if (!otp) return fail("Enter the code we sent you.");

    /* ── INTERNATIONAL: the dummy WhatsApp path ──────────────────────
       No verification happens. MSG91's DLT templates are registered for
       Indian handsets, so nothing was sent and there is nothing to
       check. The step exists so the flow, the copy and the client code
       are already the shape the real WhatsApp OTP will need — only this
       block changes when the templates go live.

       Recorded as UNVERIFIED, which is the whole point of doing it here
       rather than waving international users straight through. */
    if (!indian) {
      let intlId = await findInternational(phone);
      if (!intlId) {
        const cres = await fetch(`${DB_URL}/auth/v1/admin/users`, {
          method: "POST",
          headers: svc(),
          /* phone_confirm false: nothing has confirmed this handset, and
             saying otherwise here is exactly the lie that makes the flag
             worthless. The synthetic email follows the convention the
             live site already uses so the two converge on one account
             rather than two. */
          body: JSON.stringify({
            phone: `+${phone}`,
            phone_confirm: false,
            email: `phone_${phone}@truthestate.com`,
            email_confirm: true,
          }),
        });
        const cdata = await cres.json().catch(() => ({})) as { id?: string; msg?: string; message?: string };
        if (!cres.ok || !cdata.id) {
          return fail("Signed you in, but we couldn't save your account. Please try again.",
            `intl create HTTP ${cres.status}: ${cdata.msg ?? cdata.message ?? ""}`);
        }
        intlId = cdata.id;
      }

      const l = await rpc<{ chats_claimed?: number; leads_claimed?: number }>("link_verified_phone", {
        p_user_id: intlId, p_phone: `+${phone}`,
        p_anon_id: body.anonId ?? null, p_session_id: body.sessionId ?? null,
        p_name: body.name ?? null,
      });

      await stampSignIn(intlId, body.anonId, body.sessionId);

      /* link_verified_phone sets phone_verified true unconditionally —
         it was written for a path where MSG91 had already proven the
         handset. Corrected immediately rather than changing that
         function's contract, which the verified path depends on. */
      await fetch(`${DB_URL}/rest/v1/user_profiles?id=eq.${intlId}`, {
        method: "PATCH", headers: svc({ Prefer: "return=minimal" }),
        body: JSON.stringify({ phone_verified: false }),
      }).catch(() => { /* the sign-in still stands */ });

      console.log(`[chat-signin] intl (UNVERIFIED) user=${intlId} chats=${l?.chats_claimed ?? 0}`);
      return new Response(JSON.stringify({
        ok: true, userId: intlId, verified: false,
        chatsClaimed: l?.chats_claimed ?? 0, leadsClaimed: l?.leads_claimed ?? 0,
      }), { status: 200, headers });
    }

    /* 1. Verify with MSG91, via the function production already uses. */
    const vres = await fetch(`${DB_URL}/functions/v1/verify-otp`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ phone, otp }),
    });
    const vdata = await vres.json().catch(() => ({})) as { success?: boolean; step?: string; message?: string };
    if (!vdata.success) {
      console.warn(`[chat-signin] verify rejected step=${vdata.step ?? "?"} msg=${vdata.message ?? "?"}`);
      return fail(
        vdata.step === "validate_phone"
          ? "That number doesn't look right — mind checking it?"
          : "That code didn't match. Try again, or ask for a new one.",
      );
    }

    /* 2. Find the account, or make one. Matching on the last ten digits
          is what stops a returning visitor getting a second account
          purely because the stored format differs. */
    let userId = await rpc<string | null>("find_user_id_by_phone", { p_phone: phone });

    if (!userId) {
      const cres = await fetch(`${DB_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: svc(),
        /* phone_confirm: MSG91 has already proven the handset — asking
           the visitor to confirm the same number twice would be absurd. */
        body: JSON.stringify({ phone: `91${phone}`, phone_confirm: true }),
      });
      const cdata = await cres.json().catch(() => ({})) as { id?: string; msg?: string; message?: string };
      if (!cres.ok || !cdata.id) {
        return fail("Signed you in, but we couldn't save your account. Please try again.",
          `create user HTTP ${cres.status}: ${cdata.msg ?? cdata.message ?? ""}`);
      }
      userId = cdata.id;
    }

    /* 3. Write the profile and claim everything this device did before
          signing in — the questions asked before they trusted us. */
    const linked = await rpc<{ chats_claimed?: number; leads_claimed?: number }>("link_verified_phone", {
      p_user_id: userId,
      p_phone: phone,
      p_anon_id: body.anonId ?? null,
      p_session_id: body.sessionId ?? null,
      p_name: body.name ?? null,
    });

    await stampSignIn(userId, body.anonId, body.sessionId);
    console.log(`[chat-signin] ok user=${userId} chats=${linked?.chats_claimed ?? 0} leads=${linked?.leads_claimed ?? 0}`);
    return new Response(JSON.stringify({
      ok: true,
      userId,
      verified: true,
      chatsClaimed: linked?.chats_claimed ?? 0,
      leadsClaimed: linked?.leads_claimed ?? 0,
    }), { status: 200, headers });
  } catch (e) {
    return fail("Couldn't complete sign-in just now. Try again in a moment.",
      e instanceof Error ? e.message : String(e));
  }
});
