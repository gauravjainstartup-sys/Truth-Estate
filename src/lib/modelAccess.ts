/* ════════════════════════════════════════════════════════════════
   MODEL ACCESS — the entitlement writer's client half.

   When a buyer becomes a lead / unlocks a project / joins the Buyer
   Office, the journey lib calls grantModelAccess() so the gated-3D
   backend (model_access_grants → mint-token) knows who unlocked what.

   DORMANT until NEXT_PUBLIC_MODEL_GATE_URL is set at build time (the
   go-live runbook's step) — with it unset, every call is a no-op and
   live behaviour is byte-identical to today. Fire-and-forget: the UX
   gate NEVER waits on, or surfaces, this plumbing. Server-side the
   grant-entitlement function clamps self-service writes to 'lead', so
   nothing here is trusted with tiers.

   Imports nothing (journey.ts imports us; projects.ts imports journey —
   keeping this leaf-level avoids the cycle).
   ════════════════════════════════════════════════════════════════ */

const GATE_URL = (process.env.NEXT_PUBLIC_MODEL_GATE_URL ?? "").replace(/\/+$/, "");

export type ModelEntitlement = "lead" | "member" | "paid";

/** Record that `subject` unlocked `slugs` (fire-and-forget; no-op while dormant). */
export function grantModelAccess(
  slugs: string | string[],
  subject: string | null | undefined,
  entitlement: ModelEntitlement,
): void {
  if (!GATE_URL || typeof window === "undefined") return;
  const list = (Array.isArray(slugs) ? slugs : [slugs]).map((s) => (s ?? "").trim()).filter(Boolean);
  const sub = (subject ?? "").trim();
  if (list.length === 0 || sub.length < 3) return;
  try {
    void fetch(`${GATE_URL}/grant-entitlement`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: list, subject: sub, entitlement }),
      keepalive: true, // survives an immediate navigation after unlock
    }).catch(() => {
      /* entitlement plumbing must never touch the UX */
    });
  } catch {
    /* ignore — same reason */
  }
}

/* Project display name → the advisor/model slug dialect. Mirrors
   projects.ts tiSlug exactly (kept inline: importing projects.ts from
   here would cycle through journey.ts). */
export function modelSlugFor(name: string | null | undefined): string {
  return (name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* Best-effort gated identity for flows that don't carry a contact of
   their own (paid unlock / membership): the OTP-verified contact first,
   else the most recent lead's phone/email. Same localStorage keys the
   journey + shortlist libs own. */
export function resolveModelSubject(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const rawV = window.localStorage.getItem("truthEstate.shortlistVerified");
    if (rawV) {
      const v = JSON.parse(rawV) as { channel?: string; contact?: string; cc?: string; email?: string };
      if (v.channel === "mobile" && v.contact) return `${v.cc ?? "+91"}${String(v.contact).replace(/\D/g, "")}`;
      if (v.contact) return String(v.contact);
      if (v.email) return String(v.email);
    }
    const rawL = window.localStorage.getItem("truthEstate.leads");
    if (rawL) {
      const leads = JSON.parse(rawL) as { phone?: string; email?: string }[];
      for (let i = leads.length - 1; i >= 0; i--) {
        const c = leads[i]?.phone || leads[i]?.email;
        if (c) return String(c);
      }
    }
  } catch {
    /* fall through */
  }
  return null;
}
