/* ════════════════════════════════════════════════════════════════
   CAPTURE-LEAD CORE — pure logic, no Deno globals.

   Receives a lead from the browser and writes it to public.leads with
   the service role. The anon key has no grant on that table, so this
   function is the only way in: a lead cannot be read, enumerated or
   forged from the public bundle.

   Fails SOFT by contract. The caller treats this as fire-and-forget —
   a rejected or unreachable write must never cost the visitor their
   form submission, because the client also keeps a localStorage copy.
   ════════════════════════════════════════════════════════════════ */

export type FetchLike = (url: string, init?: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

/* Mirrors the Lead union in src/lib/journey.ts. An unknown intent is
   rejected rather than stored, so a typo in a new form surfaces in the
   logs instead of quietly creating an uncategorisable row. */
export const INTENTS = [
  "tower-intel",
  "buyer-office",
  "documents",
  "report-error",
  "feedback",
  "shortlist-unlock",
  "custom-report",
] as const;

export type LeadBody = {
  name?: string;
  email?: string;
  phone?: string;
  intent?: string;
  project?: string;
  docs?: string[];
  identity?: string;
  message?: string;
  payload?: unknown;
  sessionId?: string;
  source?: string;
  referrer?: string;
};

export type LeadResult = { ok: true; id?: string } | { ok: false; reason: string };

/* Mirrors liveSlug() in src/lib/supabase.ts. */
export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* Length caps. Nothing here is a security boundary — the table would
   accept far more — they exist so a runaway client or a bored visitor
   cannot write megabytes into a row we then have to read in a worklist. */
const CAP = { name: 120, email: 200, phone: 40, project: 200, identity: 80, message: 4000, source: 300, referrer: 500, ua: 400 };

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

export function validate(body: LeadBody): { ok: true; row: Record<string, unknown> } | { ok: false; reason: string } {
  const intent = clean(body.intent, 40);
  if (!intent || !(INTENTS as readonly string[]).includes(intent)) {
    return { ok: false, reason: `unknown intent: ${intent ?? "(none)"}` };
  }

  const email = clean(body.email, CAP.email);
  const phone = clean(body.phone, CAP.phone);
  /* A lead with no way to reach them is not a lead. This is also the
     cheapest spam filter available — an empty POST is dropped here. */
  if (!email && !phone) return { ok: false, reason: "no contact method" };

  const project = clean(body.project, CAP.project);
  const docs = Array.isArray(body.docs)
    ? body.docs.map((d) => clean(d, 200)).filter(Boolean).slice(0, 20)
    : null;

  return {
    ok: true,
    row: {
      name: clean(body.name, CAP.name),
      email,
      phone,
      intent,
      project,
      project_slug: project ? slugify(project) : null,
      docs: docs && docs.length ? docs : null,
      identity: clean(body.identity, CAP.identity),
      message: clean(body.message, CAP.message),
      payload: body.payload ?? null,
      session_id: clean(body.sessionId, 100),
      source: clean(body.source, CAP.source),
      referrer: clean(body.referrer, CAP.referrer),
    },
  };
}

export async function captureLead(
  body: LeadBody,
  opts: { url: string; key: string; fetchImpl: FetchLike; userAgent?: string | null },
): Promise<LeadResult> {
  const checked = validate(body);
  if (!checked.ok) {
    console.error(`[capture-lead] rejected: ${checked.reason}`);
    return { ok: false, reason: checked.reason };
  }
  if (!opts.url || !opts.key) {
    console.error("[capture-lead] SUPABASE_URL / SERVICE_ROLE_KEY not set");
    return { ok: false, reason: "not configured" };
  }

  const row = { ...checked.row, user_agent: clean(opts.userAgent, CAP.ua) };

  const res = await opts.fetchImpl(`${opts.url}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: opts.key,
      Authorization: `Bearer ${opts.key}`,
      "content-type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    console.error(`[capture-lead] insert HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return { ok: false, reason: `insert failed (${res.status})` };
  }

  console.log(`[capture-lead] stored intent=${row.intent} project=${row.project ?? "-"} contact=${row.phone ? "phone" : "email"}`);
  return { ok: true };
}
