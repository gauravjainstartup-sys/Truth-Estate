/* ════════════════════════════════════════════════════════════════
   ENTITLEMENTS — server truth about what this account paid for.

   journey.ts keeps access in localStorage, which is wrong in two
   directions at once. It loses everything on a hard refresh, because the
   pre-hydration script in layout.tsx clears the truthEstate.* namespace
   on reload. And it knows nothing about the 29 profiles who bought on
   truthestate.in, so every one of them would meet a paywall for a report
   they already own.

   This fetches the real answer once and hands it to the existing access
   helpers. The local copy stays as the CACHE it always should have
   been — reads stay synchronous, so no component has to change.

   Deliberately additive: nothing here removes a local grant. A visitor
   who just paid on this device must not lose access because the network
   blinked, so the two sets are unioned and the server only ever adds.
   ════════════════════════════════════════════════════════════════ */
import { getAnonId } from "@/lib/truthGuideChat";
import {
  readEntitlements, writeEntitlements, serverHasAccess,
  type ServerEntitlements,
} from "@/lib/entitlementsCache";

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

let inFlight: Promise<ServerEntitlements | null> | null = null;

/* One request per page load at most. Several gated components mount at
   once on a report page and each would otherwise ask independently. */
export function fetchEntitlements(): Promise<ServerEntitlements | null> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const anonId = getAnonId();
    if (!anonId) return null;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/entitlements`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ anonId }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json().catch(() => null) as
        ({ ok?: boolean } & ServerEntitlements) | null;
      if (!data?.ok) return null;

      const out: ServerEntitlements = {
        userId: data.userId ?? null,
        unlocked: Array.isArray(data.unlocked) ? data.unlocked : [],
        all: data.all === true,
        plan: data.plan ?? null,
      };
      /* Only cache a signed-in answer. Caching the anonymous empty set
         would let a stale "you own nothing" outlive the sign-in that
         disproves it. */
      if (out.userId) {
        writeEntitlements(out);
      }
      return out;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export { readEntitlements as cachedEntitlements, serverHasAccess };
export type { ServerEntitlements };
