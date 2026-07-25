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
import { setSignedIn, loadAccount, saveAccount, emptyBuyData } from "@/lib/journey";
import { getAnonId, getSessionId } from "@/lib/truthGuideChat";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

const SESSION_STORE = "truthEstate.sbSession";

export type AuthResult = { ok: true } | { ok: false; error: string };

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
  if (step === "validate_otp") return "That code should be 6 digits — try again.";
  if (step.includes("not_verified") || /invalid|expired/i.test(msg)) {
    return "That code didn't match. Try again, or ask for a new one.";
  }
  if (/limit|too many|rate/i.test(msg)) {
    return "Too many attempts just now — give it a minute and try again.";
  }
  return "Couldn't verify that just now. Try again in a moment.";
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

export async function verifyOtp(phone10: string, code: string): Promise<AuthResult> {
  try {
    const { ok, data } = await callFn("verify-otp", {
      phone: phone10,
      otp: code.replace(/\D/g, ""),
    });
    if (!ok) {
      console.warn("[otp] verify failed", data.step ?? "", data.message ?? "");
      return { ok: false, error: readable(data) };
    }

    /* Read the session from wherever the function puts it. If it returns
       none, the visitor is still legitimately verified — MSG91 said so —
       so sign them in locally and carry on. Only the history claim and
       the profile write need a token, and both are best-effort. */
    const token = data.session?.access_token ?? data.access_token ?? data.token ?? null;
    const userId = data.session?.user?.id ?? data.user?.id ?? data.userId ?? null;

    try {
      window.localStorage.setItem(
        SESSION_STORE,
        JSON.stringify({ access_token: token, user_id: userId, phone: phone10 }),
      );
    } catch { /* a full quota must not block a verified sign-in */ }

    setSignedIn();

    if (token) void claimAnonymousHistory(token);
    else console.warn("[otp] verified but no session token returned — history claim skipped");

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach us just now — check your connection and try again." };
  }
}

export function getSession(): { access_token: string | null; user_id: string | null; phone: string } | null {
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
  if (!session?.access_token || !session.user_id) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${session.user_id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ name: clean, phone: session.phone, phone_verified: true }),
      signal: AbortSignal.timeout(10000),
    });
  } catch { /* the local copy is already saved */ }
}
