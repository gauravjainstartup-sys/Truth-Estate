/* ════════════════════════════════════════════════════════════════
   PHONE AUTH — MSG91 OTP via the Edge Functions already deployed for
   the AI Studio site.

   Deliberately NOT Supabase's built-in phone auth. That is wired to
   Twilio on this project, whereas production sends through MSG91 with
   the DLT-registered templates that actually reach Indian handsets.
   Reusing the live path means one OTP implementation, one DLT
   registration, and one set of delivery problems rather than two.

   CONTRACT, recovered by probing the deployed functions:

     POST /functions/v1/send-otp    { phone }        10 digits, NO +91
       → { success, message }

     POST /functions/v1/verify-otp  { phone, otp }   'otp', not 'code'
       → { success, requestId, step, message, providerResponse? }
       failure steps seen: validate_phone · validate_otp
                           · msg91_otp_not_verified

   The 10-digit, no-country-code format is not a preference — verify-otp
   rejects anything else with "Send only 10 digit Indian mobile number
   without +91", so normalisation has to strip a +91 the visitor types
   rather than add one.

   Bridges into the app's EXISTING localStorage session rather than
   replacing it. The rest of the site reads isSignedIn() / loadAccount(),
   and rewriting those call sites is a separate job from putting a real
   OTP in the chat. This file is where that bridge gets cut later.
   ════════════════════════════════════════════════════════════════ */
import { setSignedIn, signOut, loadAccount, saveAccount, emptyBuyData } from "@/lib/journey";
import { getAnonId, getSessionId } from "@/lib/truthGuideChat";
import { track } from "@/lib/events";
import { basePath } from "@/lib/site";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "implicit",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

const SESSION_STORE = "truthEstate.sbSession";

export type AuthResult = { ok: true } | { ok: false; error: string };

/* MSG91's template sends a 4-digit code on this account. Kept as a
   constant because it is set by the DLT-registered template, not by us —
   if the template changes, this is the one place to follow it. */
export const OTP_LENGTH = 4;

/* ── Phone normalisation ────────────────────────────────────────
   Returns the 10 digits the Edge Functions require. People type their
   number every which way — "+91 99587 77312", "099587-77312",
   "919958777312" — and all of them must reduce to the same ten digits,
   because a mis-parsed number means an SMS that costs money, never
   arrives, and looks to the visitor like the site is broken. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  let ten = digits;
  if (digits.length === 12 && digits.startsWith("91")) ten = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) ten = digits.slice(1);
  else if (digits.length === 13 && digits.startsWith("091")) ten = digits.slice(3);
  // Indian mobiles are 10 digits opening 6-9.
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

export function prettyPhone(ten: string): string {
  return ten.length === 10 ? `${ten.slice(0, 5)} ${ten.slice(5)}` : ten;
}

/* ── International ───────────────────────────────────────────────
   MSG91's DLT templates reach Indian handsets only, so an international
   number gets a WhatsApp step instead of an SMS one — DUMMIED until
   those templates are live. Any code is accepted, and the account is
   recorded as unverified.

   This is not a new hole. truthestate.in lets international numbers in
   today with no verification step at all; this at least marks them, and
   puts the flow in the shape the real WhatsApp OTP will need so only
   the transport changes later. */
export const INDIA_DIAL = "+91";

export function isIndiaDial(dial: string): boolean {
  return dial.replace(/\D/g, "") === "91";
}

/* Digits including the country code, e.g. "+44 7911 123456" → 447911123456.
   Deliberately NOT reduced to the last ten: a UK number's last ten can
   collide with an Indian one, and matching on them would hand a stranger
   somebody else's account. */
export function normaliseIntl(dial: string, raw: string): string | null {
  const cc = dial.replace(/\D/g, "");
  let local = raw.replace(/\D/g, "");
  if (local.startsWith(cc)) local = local.slice(cc.length);
  local = local.replace(/^0+/, "");
  if (local.length < 5 || local.length > 14) return null;
  return cc + local;
}

type FnResponse = {
  success?: boolean;
  message?: string;
  step?: string;
  requestId?: string;
  providerResponse?: unknown;
  /* The success shape is unconfirmed — it cannot be observed without a
     real code. Every plausible place a session might arrive is read
     below, and its absence is handled rather than assumed away. */
  session?: { access_token?: string; user?: { id?: string } };
  access_token?: string;
  token?: string;
  user?: { id?: string };
  userId?: string;
};

async function callFn(name: string, body: unknown): Promise<{ ok: boolean; data: FnResponse }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  let data: FnResponse = {};
  try { data = (await res.json()) as FnResponse; } catch { /* empty body */ }
  return { ok: res.ok && data.success === true, data };
}

/* The functions return operational messages ("msg91_otp_not_verified",
   raw provider errors). Those belong in a log, not in a chat bubble, so
   map them to something a person can act on. */
function readable(data: FnResponse): string {
  const step = data.step ?? "";
  const msg = data.message ?? "";
  if (step === "validate_phone" || /phone|mobile/i.test(msg)) {
    return "That number doesn't look right — mind checking it?";
  }
  if (step === "validate_otp") return `That code should be ${OTP_LENGTH} digits — try again.`;
  if (step.includes("not_verified") || /invalid|expired/i.test(msg)) {
    return "That code didn't match. Try again, or ask for a new one.";
  }
  if (/limit|too many|rate/i.test(msg)) {
    return "Too many attempts just now — give it a minute and try again.";
  }
  return "Couldn't verify that just now. Try again in a moment.";
}

/* Nothing is sent for an international number — there is no transport
   yet. Resolving ok keeps the UI honest about what happens next (a code
   step appears) without claiming a message was delivered; the copy the
   screens show says WhatsApp, and that is the promise being made. */
export async function sendOtpIntl(_full: string): Promise<AuthResult> {
  return { ok: true };
}

/* "Have we met this number?" — the answer that decides whether the sheet
   asks for a name. Three states, not two: `null` means we could not tell,
   and the caller must treat that as "ask for a name" rather than assume
   either. A lookup outage should cost a returning buyer one extra field,
   never an account they cannot reach. */
export async function phoneKnown(phone: string, dial: string = INDIA_DIAL): Promise<boolean | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/phone-known`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phone, countryCode: dial }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; known?: boolean | null };
    if (!res.ok || data.success !== true) return null;
    return typeof data.known === "boolean" ? data.known : null;
  } catch {
    return null;
  }
}

export async function sendTwilioOtp(dial: string, phone: string): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/twilio/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dial, phone }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Failed to send SMS OTP." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error sending SMS OTP." };
  }
}

export async function verifyTwilioOtp(dial: string, phone: string, code: string, name?: string): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/twilio/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dial, phone, code }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Invalid verification code." };
    }

    const cleanDial = dial.startsWith("+") ? dial : `+${dial}`;
    const fullPhone = `${cleanDial} ${phone.replace(/\D/g, "")}`;
    const token = `twilio_sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const user_id = `usr_${Math.random().toString(36).slice(2, 10)}`;

    try {
      window.localStorage.setItem(
        SESSION_STORE,
        JSON.stringify({ access_token: token, user_id, phone: fullPhone, provider: "twilio" }),
      );
    } catch { /* empty */ }

    setSignedIn();

    if (name?.trim()) {
      await saveName(name.trim());
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Network error verifying SMS OTP." };
  }
}

export async function sendOtp(phone10: string): Promise<AuthResult> {
  try {
    const { ok, data } = await callFn("send-otp", { phone: phone10 });
    if (!ok) {
      console.warn("[otp] send failed", data.step ?? "", data.message ?? "");
      return { ok: false, error: readable(data) };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach us just now — check your connection and try again." };
  }
}

/* Goes through chat-signin rather than verify-otp directly.
   verify-otp confirms the code with MSG91 and stops there — it creates no
   Supabase user, so calling it from here left every sign-in invisible:
   conversation still under anon_id, name going nowhere, and no answer to
   "who logged in". chat-signin re-verifies server-side, creates or finds
   the account, and claims this device's history in one call. */
export async function verifyOtp(
  phone10: string,
  code: string,
  name?: string,
  dial: string = INDIA_DIAL,
): Promise<AuthResult> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-signin`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        phone: phone10,
        otp: code.replace(/\D/g, ""),
        countryCode: dial,
        anonId: getAnonId(),
        sessionId: getSessionId(),
        ...(name?.trim() ? { name: name.trim() } : {}),
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean; error?: string; userId?: string;
      chatsClaimed?: number; leadsClaimed?: number;
      session?: { access_token: string; token_type: string; expires_in: number };
    };
    if (!data.ok || !data.userId) {
      return { ok: false, error: data.error ?? "Couldn't verify that just now. Try again in a moment." };
    }

    /* A different person on the same handset. Everything cached about the
       last one — what they had unlocked, their brief, their office — was
       fetched or built for THEM, and none of it transfers.

       This matters more than it looks. Entitlements are fetched with the
       device id, so on a shared phone the server will happily answer with
       the previous account's unlocks; the session check in
       entitlementsCache then refuses them, but only because the cached
       answer no longer matches who is signed in. Clearing here is what
       makes that check meet a clean slate rather than a stale one. */
    const previous = getSession()?.user_id ?? null;
    if (previous && previous !== data.userId) {
      console.info("[signin] different account on this device — clearing the previous one's state");
      signOut();
    }

    try {
      window.localStorage.setItem(
        SESSION_STORE,
        /* The real session chat-signin mints once PROJECT_JWT_SECRET is set;
           null until then. getSession() already exposes it. */
        JSON.stringify({ access_token: data.session?.access_token ?? null, user_id: data.userId, phone: phone10 }),
      );
    } catch { /* a full quota must not block a verified sign-in */ }

    setSignedIn();
    /* Fired BEFORE the events are claimed server-side, so it lands under
       the anon_id and is swept up with the rest of the pre-signup trail —
       putting the sign-in itself in sequence rather than after it. */
    track("signed_in", { props: { chatsClaimed: data.chatsClaimed ?? 0, leadsClaimed: data.leadsClaimed ?? 0 } });
    console.info(`[signin] linked ${data.chatsClaimed ?? 0} chats, ${data.leadsClaimed ?? 0} leads`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach us just now — check your connection and try again." };
  }
}

/* ── Account profile, read/written through the session ──────────────
   With a session token the browser reads and updates the user's OWN
   user_profiles row directly, under the RLS own-row policies — no edge
   function. Both return null/false with no session, so the office falls
   back to its localStorage copy when sessions aren't live. */
export type MyProfile = { id: string; name: string | null; phone: string | null; email: string | null };

export async function fetchMyProfile(): Promise<MyProfile | null> {
  const token = getSession()?.access_token;
  if (!token) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles?select=id,name,phone,email&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const rows = (await res.json().catch(() => null)) as MyProfile[] | null;
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

export type ProfileUpdateResult = { ok: true } | { ok: false; error: string };

export async function updateMyProfile(patch: Partial<Pick<MyProfile, "name" | "email" | "phone">>): Promise<ProfileUpdateResult> {
  const session = getSession();
  const token = session?.access_token;
  const uid = session?.user_id;
  if (!token || !uid) return { ok: false, error: "Not signed in" };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${encodeURIComponent(uid)}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(patch),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) {
      if (res.status === 409 || res.status === 400) {
        return { ok: false, error: "This mobile number or email is already linked to another member profile." };
      }
      return { ok: false, error: "Couldn't update profile right now." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error — please check your connection." };
  }
}

export async function signInWithGoogle(redirectTo?: string): Promise<AuthResult> {
  if (typeof window === "undefined") return { ok: false, error: "Window undefined" };
  try {
    const origin = window.location.origin;
    const target = redirectTo || window.location.href;
    const callbackUrl = `${origin}${basePath}/auth/callback?next=${encodeURIComponent(target)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google Sign-In failed";
    return { ok: false, error: message };
  }
}

export function getSession(): { access_token: string | null; user_id: string | null; phone: string | null; email?: string | null; provider?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* Attach every conversation and lead from this device to the verified
   account. Runs as the authenticated user, so the RPC takes the identity
   from the JWT rather than from anything the client claims. */
export async function claimAnonymousHistory(accessToken: string): Promise<void> {
  const anonId = getAnonId();
  if (!anonId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_anonymous_history`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ p_anon_id: anonId, p_session_id: getSessionId() }),
      signal: AbortSignal.timeout(10000),
    });
  } catch { /* best effort — the visitor is already signed in */ }
}

/* Asked AFTER verification, never before. A one-field ask converts far
   better than a two-field form, and by the time someone has entered an
   OTP they are committed — whereas a name demanded up front is friction
   in front of the only step that actually matters. A verified number
   with no name is still a lead; a form that scares them off is not. */
export async function saveName(name: string): Promise<void> {
  const clean = name.trim().slice(0, 120);
  if (!clean) return;

  /* Preserve anything the visitor already told us — someone can reach the
     chat having part-completed the buy journey, and signing in must not
     silently discard that. */
  const existing = loadAccount();
  saveAccount({
    name: clean,
    createdAt: existing?.createdAt ?? Date.now(),
    buy: existing?.buy ?? emptyBuyData,
    booking: existing?.booking ?? null,
  });

  const session = getSession();
  if (!session?.phone || !session.user_id) return;
  /* Re-runs chat-signin's link step with the name attached. The browser
     holds no session token — verify-otp never issues one — so it cannot
     PATCH user_profiles itself, and this is the only path that reaches
     the row. Cheap enough to repeat, and idempotent. */
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/chat-signin`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        phone: session.phone,
        userId: session.user_id,
        name: clean,
        anonId: getAnonId(),
        sessionId: getSessionId(),
        nameOnly: true,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch { /* the local copy is already saved */ }
}
