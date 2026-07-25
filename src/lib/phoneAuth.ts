/* ════════════════════════════════════════════════════════════════
   PHONE AUTH — real Supabase phone OTP, called over REST.

   Two endpoints, so this talks to /auth/v1 directly rather than pulling
   in @supabase/supabase-js (~40 KB gzipped) for two POSTs on a site that
   ships as a static export.

   Bridges into the app's EXISTING localStorage session rather than
   replacing it. The rest of the site reads isSignedIn() / loadAccount(),
   and rewriting every one of those call sites is a separate job from
   putting a real OTP in the chat — so a verified phone sets both the real
   Supabase session and the flags the app already understands. When the
   wider auth migration happens, this file is where the bridge is cut.

   The SMS itself is sent by the provider configured on the Supabase
   project, against DLT-registered templates. Nothing here needs to know
   about that — but it does mean every send costs money and lands on a
   real handset, so this must never be called speculatively.
   ════════════════════════════════════════════════════════════════ */
import { setSignedIn, loadAccount, saveAccount, emptyBuyData } from "@/lib/journey";
import { getAnonId, getSessionId } from "@/lib/truthGuideChat";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

const TOKEN_KEY = "truthEstate.sbSession";

export type AuthResult = { ok: true } | { ok: false; error: string };

/* India-first. The chat asks for "your mobile", not an E.164 string, so a
   visitor typing "98765 43210", "+91 98765 43210" or "098765-43210" must
   all resolve to the same number. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (raw.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
}

export function prettyPhone(e164: string): string {
  const d = e164.replace(/^\+91/, "");
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : e164;
}

async function authPost(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  let data: Record<string, unknown> = {};
  try { data = (await res.json()) as Record<string, unknown>; } catch { /* empty body */ }
  return { ok: res.ok, status: res.status, data };
}

/* Supabase surfaces provider failures in several shapes; collapse them to
   something a person reading a chat bubble can act on. */
function readableError(status: number, data: Record<string, unknown>): string {
  const msg = String(data.msg ?? data.error_description ?? data.message ?? "");
  if (/rate|too many|limit/i.test(msg) || status === 429) {
    return "Too many attempts just now — give it a minute and try again.";
  }
  if (/invalid.*(otp|token)|expired/i.test(msg)) {
    return "That code didn't match. Check it and try again, or ask for a new one.";
  }
  if (/phone|number/i.test(msg)) return "That number doesn't look right — mind checking it?";
  return msg || "Something went wrong at our end. Try again in a moment.";
}

export async function sendOtp(phoneE164: string): Promise<AuthResult> {
  const { ok, status, data } = await authPost("otp", { phone: phoneE164, create_user: true });
  if (!ok) return { ok: false, error: readableError(status, data) };
  return { ok: true };
}

export async function verifyOtp(phoneE164: string, code: string): Promise<AuthResult> {
  const { ok, status, data } = await authPost("verify", {
    phone: phoneE164,
    token: code.replace(/\D/g, ""),
    type: "sms",
  });
  if (!ok) return { ok: false, error: readableError(status, data) };

  const token = data.access_token as string | undefined;
  const user = data.user as { id?: string } | undefined;
  if (!token || !user?.id) return { ok: false, error: "Verification didn't complete — try once more." };

  try {
    window.localStorage.setItem(
      TOKEN_KEY,
      JSON.stringify({ access_token: token, refresh_token: data.refresh_token, user_id: user.id, phone: phoneE164 }),
    );
  } catch { /* a full quota must not block a verified sign-in */ }

  /* The bridge: the rest of the app still reads this flag. */
  setSignedIn();

  /* Claim the pre-signup history. Deliberately not awaited by the caller —
     the visitor is already verified, and a failed claim is a data-quality
     problem to fix later, not a reason to hold up the conversation. */
  void claimAnonymousHistory(token);

  return { ok: true };
}

export function getSession(): { access_token: string; user_id: string; phone: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
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
  } catch { /* best effort — see above */ }
}

/* Asked AFTER verification, never before. A one-field ask converts far
   better than a two-field form, and by the time someone has entered an
   OTP they are committed — whereas a name demanded up front is friction
   in front of the only step that actually matters. */
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
  if (!session) return;
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
