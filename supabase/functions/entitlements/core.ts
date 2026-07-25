/* ════════════════════════════════════════════════════════════════
   ENTITLEMENTS — what this account has actually paid for.

   The new site keeps entitlements in localStorage, which loses them on a
   hard refresh and knows nothing about the 29 profiles who bought on
   truthestate.in. This is the server-side truth those screens should be
   reading instead.

   TWO SOURCES, deliberately unioned rather than one trusted over the
   other:

     user_profiles.unlocked_reports — the GRANT record, written when a
       report is opened up.
     payments (status = completed)  — the MONEY record.

   They should agree. When they do not, the union is the only defensible
   answer: someone whose payment succeeded but whose grant failed to
   write has paid, and refusing them access because of our bookkeeping
   would be indefensible. The reverse — a grant with no payment — is a
   comp or a fixed bug, and clawing it back silently would be worse than
   letting it stand.

   Pure functions, no Deno or network. test-offline.mjs runs this under
   node so the mapping can be proven against real rows without deploying.
   ════════════════════════════════════════════════════════════════ */

/* Byte-identical to liveSlug (src/lib/supabase.ts) and modelSlugFor
   (src/lib/journey.ts). Entitlements are recorded against prod's SEO
   slug — "gurugram-real-estate-dlf-the-arbour-golf-course-road-extension
   -gcre-sector-63" — which cannot be reduced back to a project name,
   because the name and the corridor run together with no delimiter.
   Every entry also carries projectName, so the join goes through the
   name in both directions. */
export function slugify(name: string): string {
  return (name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export type ProfileRow = {
  id?: string;
  plan?: string | null;
  unlocked_reports?: unknown;
};

export type PaymentRow = {
  status?: string | null;
  project_name?: string | null;
  package_name?: string | null;
  amount?: number | string | null;
};

export type Entitlements = {
  unlocked: string[];
  all: boolean;
  plan: string | null;
  /* Entries we could not turn into a slug. Surfaced rather than dropped:
     a silently discarded entitlement is a paying customer seeing a
     paywall, and nothing would error. */
  unmapped: string[];
  from: { grants: number; payments: number };
};

/* Plans that mean "everything". Deliberately an explicit list, not a
   "not Free" test: a new plan named "Free Trial" or "Founder" would
   otherwise silently hand over the whole catalogue. Every profile in the
   database today is "Free", so this list is currently unexercised —
   which is exactly when a wrong default would go unnoticed. */
const ALL_ACCESS_PLANS = new Set(["all-access", "all", "unlimited"]);

/* Entries are JSON strings inside a text[]. 110 of the 111 in production
   are {projectId, projectName, projectSlug, unlockedAt}; one also carries
   {amountPaid, paymentId}. A bare string is handled too — the column is
   text[], so nothing guarantees the JSON. */
function nameFromGrant(entry: unknown): { name: string | null; raw: string } {
  const raw = typeof entry === "string" ? entry : JSON.stringify(entry ?? "");
  if (typeof entry !== "string") {
    const o = entry as { projectName?: string };
    return { name: typeof o?.projectName === "string" ? o.projectName : null, raw };
  }
  try {
    const o = JSON.parse(entry) as { projectName?: string };
    if (typeof o?.projectName === "string" && o.projectName.trim()) return { name: o.projectName, raw };
    return { name: null, raw };
  } catch {
    /* Not JSON. Accept it as a project name only if it actually reads
       like one. The first version accepted anything that was not a bare
       kebab slug, so truncated JSON — `{not json` — slugified into an
       entitlement called "not-json". Granting access to a project that
       does not exist is harmless; granting it because a string was
       malformed is a rule that will eventually grant something real. */
    return { name: looksLikeProjectName(entry) ? entry : null, raw };
  }
}

/* Starts with a letter or digit, and contains only what a Gurugram
   project name contains. Rules out JSON fragments, and rules out prod's
   SEO slug, which is all-lowercase kebab and cannot be reversed into a
   name because the project and the corridor run together undelimited. */
function looksLikeProjectName(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 200) return false;
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(t)) return false;   // a kebab slug, not a name
  return /^[\p{L}\p{N}][\p{L}\p{N} .,'&()/-]*$/u.test(t);
}

export function entitlementsFrom(profile: ProfileRow | null, payments: PaymentRow[]): Entitlements {
  const unlocked = new Set<string>();
  const unmapped: string[] = [];
  let grants = 0;

  const list = Array.isArray(profile?.unlocked_reports) ? profile!.unlocked_reports : [];
  for (const entry of list) {
    const { name, raw } = nameFromGrant(entry);
    const slug = name ? slugify(name) : "";
    if (slug) { unlocked.add(slug); grants++; }
    else unmapped.push(raw.slice(0, 200));
  }

  let paid = 0;
  for (const p of payments) {
    if ((p.status ?? "").toLowerCase() !== "completed") continue;
    const slug = slugify(p.project_name ?? "");
    if (slug) { unlocked.add(slug); paid++; }
    else unmapped.push(`payment with no project_name: ${p.package_name ?? "(none)"}`);
  }

  const plan = typeof profile?.plan === "string" ? profile.plan : null;
  return {
    unlocked: [...unlocked].sort(),
    all: ALL_ACCESS_PLANS.has((plan ?? "").trim().toLowerCase()),
    plan,
    unmapped,
    from: { grants, payments: paid },
  };
}

/* The single question every gated surface asks. Kept here rather than in
   each caller so "what counts as access" has one definition — and so the
   content-gating step can reuse it unchanged. */
export function isEntitled(ent: Entitlements, slug: string): boolean {
  return ent.all || ent.unlocked.includes(slugify(slug));
}
