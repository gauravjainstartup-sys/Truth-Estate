/* ════════════════════════════════════════════════════════════════
   THE SUBMITTED DEAL ROOM MANDATE — one local record, two readers.

   The mandate flow (DealRoomMandate) writes this the instant a mandate is
   submitted; the /deal-room/track page reads it back to show the buyer where
   their mandate stands. It is a convenience mirror of the contact_lead we
   persist server-side — not the system of record — so a missing or malformed
   value must never throw: every accessor fails soft to null.
   ════════════════════════════════════════════════════════════════ */

/* ── The cohort, in ONE place ────────────────────────────────────────
   Hand-maintained scarcity, per the founder: bump SEATS_CLAIMED as
   mandates land — never automatically, never speculatively. Every
   screen that mentions the cohort reads THESE values: the landing's
   seat dots, the wizard's sidebar, the tracker's eyebrow. Two screens
   disagreeing about how many seats remain reads as fake scarcity,
   which is worse than no scarcity at all. */
export const COHORT = "August cohort";
export const SEATS_TOTAL = 10;
export const SEATS_CLAIMED = 6;
export const SEATS_LEFT = SEATS_TOTAL - SEATS_CLAIMED;
/* The canonical sentence, verbatim from the founder. Render it whole
   wherever it fits; screens too narrow for it use the same numbers. */
export const COHORT_LINE = `${COHORT} · ${SEATS_LEFT} of ${SEATS_TOTAL} seats left — a limited number of mandates, personally run.`;

export const MANDATE_KEY = "truthEstate.dealRoomMandate";

export type SavedMandate = {
  city: string;
  project: string;
  config: string;
  sizeSqft?: string;
  unit: string;
  stage: string; // buyer readiness — "Still exploring" | "Comparing a few" | "Finalised it"
  target: string;
  timeline: string;
  funding: string;
  offer: string;
  name: string;
  phone: string;
  via: "otp" | "google";
  submittedAt: number; // epoch ms
};

export function saveMandate(m: SavedMandate): void {
  try {
    window.localStorage.setItem(MANDATE_KEY, JSON.stringify(m));
  } catch {
    /* a full or blocked localStorage must never break the submit path */
  }
}

export function loadMandate(): SavedMandate | null {
  try {
    const raw = window.localStorage.getItem(MANDATE_KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as SavedMandate;
    return m && typeof m.submittedAt === "number" && m.project ? m : null;
  } catch {
    return null;
  }
}
