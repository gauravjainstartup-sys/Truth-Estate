/* ════════════════════════════════════════════════════════════════
   SHORTLIST VERIFICATION — the OTP gate on the #1 match.

   The seam this file always promised is now closed: sendOtp/verifyOtp
   delegate to lib/phoneAuth, which goes to MSG91 through the deployed
   Edge Functions. Until today they were stubs that resolved after a beat
   and accepted ANY four digits, so three separate surfaces — the
   shortlist sheet, the consultation booking and the custom-report
   request — let a visitor past the gate without ever receiving a code.
   That is worse than no gate: it recorded a phone number as "verified"
   when nothing had verified it, and every lead built on top of it was
   fiction.

   Verification is mobile-only and, for now, India-only: the DLT
   templates MSG91 sends against are registered for Indian numbers, so
   an international number would be charged for and never arrive.
   Saying so beats pretending to send.
   ════════════════════════════════════════════════════════════════ */

import {
  normalisePhone,
  sendOtp as sendPhoneOtp,
  verifyOtp as verifyPhoneOtp,
  OTP_LENGTH,
} from "@/lib/phoneAuth";

export type Channel = "mobile" | "email";

export type Verified = {
  channel: Channel;
  contact: string; // phone digits (mobile) or address (email)
  cc?: string; // dialing code for mobile, e.g. "+91"
  name?: string;
  email?: string;
  at: number;
};

const VKEY = "truthEstate.shortlistVerified";

export function loadVerified(): Verified | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(VKEY);
    return raw ? (JSON.parse(raw) as Verified) : null;
  } catch {
    return null;
  }
}

export function saveVerified(v: Verified): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VKEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function clearVerified(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(VKEY);
  } catch {
    /* ignore */
  }
}

/* A discreet identity chip: "+91 ·····3210" / "ga···@gmail.com" */
export function maskContact(v: Verified): string {
  if (v.channel === "mobile") {
    const d = v.contact.replace(/\D/g, "");
    return `${v.cc ?? "+91"} ·····${d.slice(-4)}`;
  }
  const [user, domain] = v.contact.split("@");
  return `${(user ?? "").slice(0, 2)}···@${domain ?? ""}`;
}

/* ── the MSG91 seam, now closed ─────────────────────────────────── */

/* Callers hold the dialling code separately and pass bare digits here, so
   an Indian number arrives as ten digits and normalisePhone accepts it.
   A UAE or UK number does not fit /^[6-9]\d{9}$/ and comes back null —
   which is the correct answer, not a bug to route around. */
function toTen(contact: string): string | null {
  return normalisePhone(contact);
}

/** Trigger the OTP. Goes to MSG91 via the deployed send-otp function. */
export async function sendOtp(channel: Channel, contact: string): Promise<{ ok: boolean; error?: string }> {
  if (channel !== "mobile") {
    return { ok: false, error: "We can only verify by mobile right now." };
  }
  const ten = toTen(contact);
  if (!ten) return { ok: false, error: "We can only verify Indian mobile numbers right now." };
  return sendPhoneOtp(ten);
}

/** Check the code with MSG91, then create/find the account and sign in. */
export async function verifyOtp(
  channel: Channel,
  contact: string,
  code: string,
  name?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (channel !== "mobile") {
    return { ok: false, error: "We can only verify by mobile right now." };
  }
  const ten = toTen(contact);
  if (!ten) return { ok: false, error: "That number doesn't look right — go back and check it." };
  const clean = code.trim().replace(/\D/g, "");
  if (clean.length !== OTP_LENGTH) {
    return { ok: false, error: `Enter the ${OTP_LENGTH}-digit code we sent.` };
  }
  return verifyPhoneOtp(ten, clean, name);
}

/* Re-exported so the screens that drive this flow render the number of
   boxes MSG91's template actually fills. Two of them were drawing six. */
export { OTP_LENGTH };
