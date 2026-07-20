/* ════════════════════════════════════════════════════════════════
   SHORTLIST VERIFICATION — the OTP gate on the #1 match.

   The flow is real; the OTP transport is a PLACEHOLDER. `sendOtp` and
   `verifyOtp` are the single seam where MSG91 (mobile) wires in — swap
   the two stubs for MSG91's send/verify calls and nothing else on the
   page changes. Today: sendOtp resolves after a beat, verifyOtp accepts
   any 4-digit code. Verification is mobile-only — SMS for +91, WhatsApp
   for international numbers (same as the office Sign-in).

   Verification persists locally (no backend yet); when Supabase Auth
   lands, replace this store with the session and keep the same surface.
   ════════════════════════════════════════════════════════════════ */

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

/* ── the MSG91 seam ─────────────────────────────────────────────── */

/** Trigger the OTP. TODO(MSG91): replace the stub with the send call. */
export async function sendOtp(_channel: Channel, _contact: string): Promise<{ ok: boolean; error?: string }> {
  await new Promise((r) => setTimeout(r, 650));
  return { ok: true };
}

/** Check the code. TODO(MSG91): replace the stub with the verify call. */
export async function verifyOtp(_channel: Channel, _contact: string, code: string): Promise<{ ok: boolean; error?: string }> {
  await new Promise((r) => setTimeout(r, 550));
  if (!/^\d{4}$/.test(code.trim())) return { ok: false, error: "Enter the 4-digit code we sent." };
  return { ok: true };
}
