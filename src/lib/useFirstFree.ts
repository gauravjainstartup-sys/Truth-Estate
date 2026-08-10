"use client";

/* ════════════════════════════════════════════════════════════════
   useFirstFree — the ₹0 offer, kept in sync.

   offerFirstFree() reads a synchronous cache that the entitlements fetch
   fills a few hundred ms after mount, and that a free claim updates in
   place. A component that only reads it ONCE keeps showing the mount-time
   answer — which is why the ₹0 CTA persisted on the NEXT report after the
   first was claimed: the claim updated the cache, but LockedReport /
   UnlockDesk never re-read it.

   This re-reads on every signal that can change the answer (the cache write
   event, an auth change, another tab), and pokes one fetch on mount so a
   client-side navigation — which does NOT remount the app shell that
   normally refreshes entitlements — still gets a fresh answer. fetch()
   dedupes in-flight, so several components using this hook cost one request.
   ════════════════════════════════════════════════════════════════ */
import { useEffect, useState } from "react";
import { offerFirstFree, fetchEntitlements } from "@/lib/entitlements";
import { ENTITLEMENTS_EVENT } from "@/lib/entitlementsCache";
import { AUTH_EVENT } from "@/lib/journey";

export function useFirstFree(): boolean {
  // Lazy initial read matches the pre-hook behaviour (offerFirstFree at render),
  // so the first paint is unchanged; the effect keeps it current after that.
  const [free, setFree] = useState<boolean>(() => offerFirstFree());
  useEffect(() => {
    const sync = () => setFree(offerFirstFree());
    sync(); // the cache may have changed between the lazy init and this effect
    window.addEventListener(ENTITLEMENTS_EVENT, sync);
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    // Refresh from the server; writeEntitlements dispatches ENTITLEMENTS_EVENT
    // on write, which fires `sync` above.
    void fetchEntitlements();
    return () => {
      window.removeEventListener(ENTITLEMENTS_EVENT, sync);
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return free;
}
