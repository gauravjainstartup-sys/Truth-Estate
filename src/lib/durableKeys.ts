/* ════════════════════════════════════════════════════════════════
   WHAT SURVIVES A REFRESH — one list, three readers.

   layout.tsx wipes the truthEstate.* namespace on reload so the demo
   behaves like a first visit. That wipe was written when everything in
   that namespace WAS demo state. It no longer is: people sign in with a
   real OTP and pay real money, and their session lives in the same
   namespace as a half-finished mock brief.

   Three places have to agree on the exception list — the pre-hydration
   script, clearAllDemoData, and signOut — and until now they agreed by
   comment ("keep this in step with…"). They drifted, and the drift is
   exactly what produced a header saying "Sign in" above 51 unlocked
   reports: the session key was wiped on refresh while the entitlements
   cache was kept.

   A leaf module. It imports nothing so anything may import it.
   ════════════════════════════════════════════════════════════════ */

/* Who this browser is. Not demo state: clearing it makes the visitor a
   stranger to their own event trail and orphans everything written
   before the reset. */
export const DEVICE_KEYS = ["truthEstate.tgAnon"] as const;

/* Who is signed in, and what they paid for. A refresh is not a sign-out,
   and it never was meant to be one — that it behaved like one was an
   accident of this namespace being shared with the mocks. */
export const SESSION_KEYS = [
  "truthEstate.signedIn",
  "truthEstate.sbSession",
  "truthEstate.shortlistVerified",
  "truthEstate.entitlements",
] as const;

/* Survives a reload. */
export const KEEP_ON_RELOAD: readonly string[] = [...DEVICE_KEYS, ...SESSION_KEYS];

/* Survives an explicit "reset demo data" — the device, but not the
   session. Signing out is a separate, deliberate act. */
export const KEEP_ON_DEMO_RESET: readonly string[] = [...DEVICE_KEYS];

/* Cleared by signOut. The device id is NOT here: the person leaves, the
   browser stays the same browser. */
export const CLEARED_ON_SIGN_OUT: readonly string[] = [
  ...SESSION_KEYS,
  "truthEstate.member",
  "truthEstate.access",
  "truthEstate.account",
  "truthEstate.unlocked",
  /* Whether this person owns a flat in each project they unlocked. It is
     a fact about THEM, not about the handset — the next person to sign in
     on this phone must not inherit an owner's framing of the report. */
  "truthEstate.stake",
  /* The Office's own record of this person — the reports they opened, the
     homes they self-declared, their ratings, invoices and feature votes.
     Facts about THEM, cleared with their session for the same reason as the
     stake above: the next person to sign in must start clean. */
  "truthEstate.office.views",
  "truthEstate.office.owned",
  "truthEstate.office.ratings",
  "truthEstate.office.payments",
  "truthEstate.office.votes",
];
