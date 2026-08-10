/* ════════════════════════════════════════════════════════════════
   ENTITLEMENTS CACHE — the last server answer about what was paid for.

   A leaf module: it imports NOTHING. journey.ts needs to read this
   synchronously while components are rendering, and lib/entitlements
   needs to write it after fetching — and entitlements reaches
   truthGuideChat, which reaches journey. Putting the storage here means
   there is no cycle to work around rather than a global to smuggle one
   value through.
   ════════════════════════════════════════════════════════════════ */

export type ServerEntitlements = {
  userId: string | null;
  unlocked: string[];
  all: boolean;
  plan: string | null;
};

/* Survives the reload wipe in layout.tsx for the same reason the device
   id does: it records something bought, and demo state does not. The
   list lives in durableKeys.ts — this module stays a leaf, so the name
   is repeated there rather than imported from here. */
export const ENTITLEMENTS_KEY = "truthEstate.entitlements";

/* Written by phoneAuth on a verified sign-in: { user_id, phone }. Read
   here by name for the same leaf reason — phoneAuth imports journey,
   journey reads this module, and an import back would close the cycle. */
const SESSION_KEY = "truthEstate.sbSession";

function signedInUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as { user_id?: string | null };
    return typeof s?.user_id === "string" && s.user_id ? s.user_id : null;
  } catch { return null; }
}

export function clearEntitlements(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(ENTITLEMENTS_KEY); } catch { /* ignore */ }
}

export function readEntitlements(): ServerEntitlements | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ENTITLEMENTS_KEY);
    if (!raw) return null;
    const e = JSON.parse(raw) as ServerEntitlements;
    return Array.isArray(e?.unlocked) ? e : null;
  } catch { return null; }
}

/* The gates read this synchronously, once, when a component mounts — and
   the answer arrives over the network some hundreds of milliseconds
   later. Nothing told them it had landed, so a reader who owns a report
   met the paywall anyway and only got in on their NEXT navigation, once
   the cache was already on disk. Anyone who paid on truthestate.in and
   opened a report here saw exactly that. */
export const ENTITLEMENTS_EVENT = "truthEstate:entitlements";

export function writeEntitlements(e: ServerEntitlements): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(ENTITLEMENTS_KEY, JSON.stringify(e)); } catch { /* quota */ }
  try { window.dispatchEvent(new Event(ENTITLEMENTS_EVENT)); } catch { /* ignore */ }
}

/* true, or null for "not known" — NEVER false.

   The distinction is the whole safety property. A visitor who has just
   paid on this device, or whose request failed, must fall through to
   their local grant rather than be told they own nothing. The server may
   only ever add access here, never take it away.

   ── The gate, and why it has to be here ──
   This answer is about a PERSON, but it is fetched with the DEVICE id:
   the entitlements function maps anon_id → the newest user_id on that
   device's event trail, because no front-end here holds a Supabase
   session it could authenticate with instead.

   So the answer must never outlive the session that justifies it, and it
   must belong to whoever is signed in RIGHT NOW. Without that check a
   device that once signed in as an account with 51 unlocked reports
   served all 51 to anybody holding the phone, signed in or not — which
   is precisely what it was doing.

   Checked here rather than at the call sites because this is the one
   funnel every paid-content read already passes through. A gate that has
   to be remembered is a gate that gets forgotten. */
export function serverHasAccess(slug: string): true | null {
  const e = readEntitlements();
  if (!e) return null;
  const uid = signedInUserId();
  if (!uid || uid !== e.userId) return null;
  if (e.all) return true;
  return e.unlocked.includes(slug) ? true : null;
}

/* Should this reader be OFFERED their first report free?

   Reads the entitlements cache UNGATED — and that is deliberate, because it
   MUST agree with claim-free-unlock. Both this cache (via fetchEntitlements)
   and the claim resolve identity the SAME way: the device's event trail
   (anon_id → newest user_id), NOT the client session. So the cache already
   reflects exactly the account the grant will be credited to. Gating it on the
   session id instead (a second identity that can diverge on a device that has
   signed into more than one account) is what made the ₹0 we SHOW and the grant
   the server MAKES disagree — ₹0 shown, then declined, then ₹0 again on the
   next report. One identity, one answer.

   No cache, or a cache with nothing unlocked and no All-Access, means eligible.
   claim-free-unlock re-checks and remains the authority, so at worst this
   offers a ₹0 the server then declines, dropping the reader onto the paid
   price. A guest owns nothing, so they see the offer too (the sign-up hook);
   the unlock modal signs them in before anything is actually claimed.

   NB: serverHasAccess() DOES gate on the session — unmasking paid content is a
   security decision that must belong to whoever is signed in right now. Whether
   to OFFER a free unlock is not; it only has to predict the grant. */
export function offerFirstFree(): boolean {
  const e = readEntitlements();
  return !e || (e.unlocked.length === 0 && !e.all);
}
