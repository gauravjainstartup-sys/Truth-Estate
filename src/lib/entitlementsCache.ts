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
   id does: it records something bought, and demo state does not. Keep
   this key in step with KEEP in that script. */
export const ENTITLEMENTS_KEY = "truthEstate.entitlements";

export function readEntitlements(): ServerEntitlements | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ENTITLEMENTS_KEY);
    if (!raw) return null;
    const e = JSON.parse(raw) as ServerEntitlements;
    return Array.isArray(e?.unlocked) ? e : null;
  } catch { return null; }
}

export function writeEntitlements(e: ServerEntitlements): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(ENTITLEMENTS_KEY, JSON.stringify(e)); } catch { /* quota */ }
}

/* true, or null for "not known" — NEVER false.

   The distinction is the whole safety property. A visitor who has just
   paid on this device, or whose request failed, must fall through to
   their local grant rather than be told they own nothing. The server may
   only ever add access here, never take it away. */
export function serverHasAccess(slug: string): true | null {
  const e = readEntitlements();
  if (!e) return null;
  if (e.all) return true;
  return e.unlocked.includes(slug) ? true : null;
}
