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

   POST { phone, otp, anonId?, sessionId?, name? }
     → { ok: true, userId, chatsClaimed, leadsClaimed }
     → { ok: false, error }

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

/* Last ten digits. user_profiles alone holds '9958777313',
   '+917011823963' and '7768003668', so anything stricter fails to match
   a returning visitor and silently creates them a second account. */
const tenDigits = (s: string) => s.replace(/\D/g, "").slice(-10);

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
      phone?: string; otp?: string; anonId?: string; sessionId?: string;
      name?: string; nameOnly?: boolean; userId?: string;
    };
    const phone = tenDigits(body.phone ?? "");
    const otp = (body.otp ?? "").replace(/\D/g, "");
    if (phone.length !== 10) return fail("That number doesn't look right — mind checking it?");

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
      return new Response(JSON.stringify({
        ok: true, userId: actual,
        chatsClaimed: l?.chats_claimed ?? 0, leadsClaimed: l?.leads_claimed ?? 0,
      }), { status: 200, headers });
    }

    if (!otp) return fail("Enter the code we sent you.");

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

    console.log(`[chat-signin] ok user=${userId} chats=${linked?.chats_claimed ?? 0} leads=${linked?.leads_claimed ?? 0}`);
    return new Response(JSON.stringify({
      ok: true,
      userId,
      chatsClaimed: linked?.chats_claimed ?? 0,
      leadsClaimed: linked?.leads_claimed ?? 0,
    }), { status: 200, headers });
  } catch (e) {
    return fail("Couldn't complete sign-in just now. Try again in a moment.",
      e instanceof Error ? e.message : String(e));
  }
});
