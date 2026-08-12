/* ════════════════════════════════════════════════════════════════
   THE SUBMITTED DEAL ROOM MANDATE — one local record, two readers.

   The mandate flow (DealRoomMandate) writes this the instant a mandate is
   submitted; the /deal-room/track page reads it back to show the buyer where
   their mandate stands. It is a convenience mirror of the contact_lead we
   persist server-side — not the system of record — so a missing or malformed
   value must never throw: every accessor fails soft to null.

   Static export, no per-user backend for the cohort yet, so "where it stands"
   is honest-by-construction: the mandate is logged and the advisor call is
   pending. We never fabricate offer progress here.
   ════════════════════════════════════════════════════════════════ */

export const MANDATE_KEY = "truthEstate.dealRoomMandate";

export type SavedMandate = {
  city: string;
  project: string;
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
