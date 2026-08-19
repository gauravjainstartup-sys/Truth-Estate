/* ════════════════════════════════════════════════════════════════
   THE OFFICE — reports, portfolio, invoices & feedback (client layer)

   A thin localStorage layer that powers the rebuilt Documents & Reports
   and My Portfolio tabs. Everything here is a front-end simulation:
     · views      — every report the buyer has OPENED (bought or not)
     · owned      — self-declared "I've invested / I own this"
     · ratings    — ★ + optional free-text, per report
     · payments   — the client-side record every invoice is generated from
     · votes      — interest votes for upcoming features

   The purchased set is derived from the real entitlement store
   ("truthEstate.access", written by journey.ts on a successful payment) —
   read directly here so this module never depends on journey.ts (journey
   depends on this, for addPayment).

   All reads/writes are SSR-safe (typeof window guards) so the static
   export prerenders without a DOM.

   KEYS the office joins on: an office record is keyed by the report's
   INTERNAL slug (p.slug — the same id entitlements use). Each record also
   carries the PUBLIC seoSlug so we can (a) link to /projects/<seoSlug> and
   (b) look up the per-section dates in report-dates.json, which is keyed by
   seoSlug.
   ════════════════════════════════════════════════════════════════ */

import { basePath } from "./site";
import { readEntitlements } from "./entitlementsCache";

/* ── Records ── */
export type ViewRecord = { name: string; market: string; seoSlug: string | null; at: number };
export type OwnedRecord = { name: string; market: string; seoSlug: string | null; at: number; note?: string };
export type Rating = { stars: number; comment?: string; at: number };
export type Payment = {
  id: string;
  slug: string | null; // null for the site-wide All-Access purchase
  item: string;
  amountInr: number;      // what was actually paid
  mrpInr?: number;        // list price, when an offer was on (struck on the receipt)
  discountLabel?: string | null;
  date: number;
  razorpayId?: string;
  invoiceNo: string; // "TE-YYYY-NNNN"
};
export type Vote = "in" | "no";

/* ── Per-section report dates (from report-dates.json) ── */
export type SectionDates = { legal?: string | null; construction?: string | null; location?: string | null; hero?: string | null; news?: string | null };
export type ReportDates = Record<string, SectionDates>; // keyed by seoSlug
export type SectionUpdate = { key: string; label: string; iso: string };

/* ── A purchased-report row (Documents · Purchased) ── */
export type PurchasedRow = { slug: string; name: string; market: string; seoSlug: string | null; at?: number; allAccess?: boolean };

/* ── localStorage keys ── */
const VIEWS_KEY = "truthEstate.office.views";
const OWNED_KEY = "truthEstate.office.owned";
const RATINGS_KEY = "truthEstate.office.ratings";
const PAYMENTS_KEY = "truthEstate.office.payments";
const VOTES_KEY = "truthEstate.office.votes";
const ACCESS_KEY = "truthEstate.access"; // owned by journey.ts — read only, never written here

const uid = () => Math.random().toString(36).slice(2, 9);

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, val: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* a full quota must never block the read/purchase behind it */
  }
}

/* Prettify a bare slug for the rare purchased row we hold no view/owned
   record for ("dlf-the-arbour" → "Dlf The Arbour"). */
function prettySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ════════ VIEWS — opened reports (the "last opened" clock) ════════ */
export function recordReportView(slug: string, name: string, market: string, seoSlug?: string | null): void {
  if (typeof window === "undefined" || !slug) return;
  const map = readJSON<Record<string, ViewRecord>>(VIEWS_KEY, {});
  map[slug] = {
    name: name || map[slug]?.name || prettySlug(slug),
    market: market || map[slug]?.market || "",
    seoSlug: seoSlug ?? map[slug]?.seoSlug ?? null,
    at: Date.now(),
  };
  writeJSON(VIEWS_KEY, map);
}
export function listViews(): Record<string, ViewRecord> {
  return readJSON<Record<string, ViewRecord>>(VIEWS_KEY, {});
}
export function getView(slug: string): ViewRecord | null {
  return listViews()[slug] ?? null;
}

/* ════════ OWNED — self-declared portfolio (no proof) ════════ */
export function markOwned(slug: string, meta: { name: string; market: string; seoSlug?: string | null; note?: string }): void {
  if (typeof window === "undefined" || !slug) return;
  const map = readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {});
  map[slug] = {
    name: meta.name || map[slug]?.name || prettySlug(slug),
    market: meta.market || map[slug]?.market || "",
    seoSlug: meta.seoSlug ?? map[slug]?.seoSlug ?? null,
    at: map[slug]?.at ?? Date.now(),
    ...(meta.note ? { note: meta.note } : map[slug]?.note ? { note: map[slug].note } : {}),
  };
  writeJSON(OWNED_KEY, map);
  ownedPut(slug, map[slug]); // sync to the account when signed in; a no-op otherwise
}
export function unmarkOwned(slug: string): void {
  if (typeof window === "undefined" || !slug) return;
  const map = readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {});
  if (map[slug]) {
    delete map[slug];
    writeJSON(OWNED_KEY, map);
  }
  ownedDel(slug); // clear the account's copy too; a no-op when signed out
}
export function isOwned(slug: string): boolean {
  if (typeof window === "undefined" || !slug) return false;
  return !!readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {})[slug];
}
export function listOwned(): (OwnedRecord & { slug: string })[] {
  const map = readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {});
  return Object.entries(map)
    .map(([slug, rec]) => {
      const cat = catalogEntry(slug);
      return {
        slug,
        ...rec,
        name: rec.name || cat?.name || prettySlug(slug),
        market: rec.market || cat?.market || "",
        seoSlug: rec.seoSlug ?? cat?.seoSlug ?? null,
      };
    })
    .sort((a, b) => b.at - a.at);
}

/* ════════ RATINGS — ★ 1–5 + optional free text ════════ */
export function rateReport(slug: string, stars: number, comment?: string): void {
  if (typeof window === "undefined" || !slug) return;
  const map = readJSON<Record<string, Rating>>(RATINGS_KEY, {});
  const clamped = Math.max(0, Math.min(5, Math.round(stars)));
  map[slug] = { stars: clamped, ...(comment && comment.trim() ? { comment: comment.trim() } : {}), at: Date.now() };
  writeJSON(RATINGS_KEY, map);
}
export function getRating(slug: string): Rating | null {
  if (typeof window === "undefined" || !slug) return null;
  return readJSON<Record<string, Rating>>(RATINGS_KEY, {})[slug] ?? null;
}

/* ════════ PAYMENTS — the client record every invoice is generated from ════════ */
export function listPayments(): Payment[] {
  return readJSON<Payment[]>(PAYMENTS_KEY, []);
}
/* Best-effort: called from journey.ts after a (dummy) successful payment.
   Deduped on (slug + item + amount) so a re-grant never mints a second
   invoice for the same purchase. */
export function addPayment(input: { slug: string | null; item: string; amountInr: number; mrpInr?: number; discountLabel?: string; razorpayId?: string; date?: number }): Payment | null {
  if (typeof window === "undefined") return null;
  const list = listPayments();
  if (list.some((p) => p.slug === input.slug && p.item === input.item && p.amountInr === input.amountInr)) return null;
  const date = input.date ?? Date.now();
  const seq = list.length + 1;
  const invoiceNo = `TE-${new Date(date).getFullYear()}-${String(seq).padStart(4, "0")}`;
  const pay: Payment = {
    id: uid(),
    slug: input.slug,
    item: input.item,
    amountInr: input.amountInr,
    /* A struck list price only when it exceeds what was paid — the same rule
       the remote mapping uses, so a free read reads "₹2,100 → First report
       free" here exactly as it does off the server. */
    ...(input.mrpInr != null && input.mrpInr > input.amountInr ? { mrpInr: input.mrpInr, discountLabel: input.discountLabel ?? "Offer" } : {}),
    date,
    ...(input.razorpayId ? { razorpayId: input.razorpayId } : {}),
    invoiceNo,
  };
  list.push(pay);
  writeJSON(PAYMENTS_KEY, list);
  return pay;
}

/* ════════ VOTES — interest gauge for upcoming features ════════ */
export function setVote(feature: string, vote: Vote): void {
  if (typeof window === "undefined" || !feature) return;
  const map = readJSON<Record<string, Vote>>(VOTES_KEY, {});
  map[feature] = vote;
  writeJSON(VOTES_KEY, map);
}
export function getVote(feature: string): Vote | null {
  if (typeof window === "undefined" || !feature) return null;
  return readJSON<Record<string, Vote>>(VOTES_KEY, {})[feature] ?? null;
}

/* ════════ ENTITLEMENTS — read the real access store directly ════════ */
type AccessState = { all: boolean; reads: string[]; threeD: string[] };

/* Session-backed unlocks, primed from the account's own completed payments
   (read under the session, the same source the Invoices list uses). Stashed
   here so the SYNCHRONOUS access helpers below can union them without an
   await — and session-guarded, so a previous account's slugs can never bleed
   into a new sign-in. A completed payment IS an entitlement (see
   entitlements/core.ts), so this is what makes a paid report show under
   Purchased — and drop out of Viewed — even after the reload wipe clears the
   local grant store. */
let _sessionUnlocked: { userId: string; slugs: string[] } | null = null;
export function primeSessionUnlocked(slugs: string[]): void {
  const uid = sessionUserId();
  _sessionUnlocked = uid ? { userId: uid, slugs: [...new Set(slugs.filter(Boolean))] } : null;
}

function loadAccess(): AccessState {
  const a = readJSON<Partial<AccessState>>(ACCESS_KEY, {});
  const reads = new Set<string>(a.reads ?? []);
  let all = !!a.all;
  const uid = sessionUserId();

  /* PAYMENT-ONLY (grants switched off for now, founder call). Purchased
     reflects the account's completed PAYMENTS — primed from the same session
     read that lists the invoices — so Purchased always equals Invoices.
     Individual grants (user_profiles.unlocked_reports) are deliberately NOT
     unioned in; a comped report is no longer shown as "Purchased". */
  if (uid && _sessionUnlocked && _sessionUnlocked.userId === uid) {
    for (const s of _sessionUnlocked.slugs) reads.add(s);
  }

  /* All-Access is a paid PLAN, not a grant, so it stays — an All-Access buyer
     still owns everything. Gated to whoever is signed in right now, the same
     check the report-page gate uses. */
  const e = readEntitlements();
  if (e && e.userId && uid && e.userId === uid && e.all) all = true;

  return { all, reads: [...reads], threeD: a.threeD ?? [] };
}
/* A report the buyer has bought (single read) or holds via All-Access. */
export function hasPurchase(slug: string): boolean {
  const a = loadAccess();
  return a.all || a.reads.includes(slug) || a.threeD.includes(slug);
}

/* Documents · Purchased — the real entitlements, enriched with the name /
   market / seoSlug we recorded when the report was opened. All-Access is a
   single synthetic entry (never 97 rows). */
export function listPurchased(): PurchasedRow[] {
  const access = loadAccess();
  const views = listViews();
  const ownedMap = readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {});
  const rows: PurchasedRow[] = [];
  if (access.all) {
    const allPay = listPayments().find((p) => p.slug === null || /all-access/i.test(p.item));
    rows.push({
      slug: "*all*",
      name: "All-Access",
      market: "Every report & 3D across the site",
      seoSlug: null,
      allAccess: true,
      ...(allPay ? { at: allPay.date } : {}),
    });
  }
  const seen = new Set<string>();
  for (const slug of [...access.reads, ...access.threeD]) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    const rec = views[slug] ?? ownedMap[slug];
    const cat = catalogEntry(slug);
    rows.push({
      slug,
      name: rec?.name ?? cat?.name ?? prettySlug(slug),
      market: rec?.market ?? cat?.market ?? "",
      seoSlug: rec?.seoSlug ?? cat?.seoSlug ?? null,
      ...(rec?.at ? { at: rec.at } : {}),
    });
  }
  return rows;
}

/* Documents · Viewed — reports opened but NOT bought and NOT owned. */
export function listViewed(): (ViewRecord & { slug: string })[] {
  const views = listViews();
  const ownedMap = readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {});
  return Object.entries(views)
    .filter(([slug]) => !hasPurchase(slug) && !ownedMap[slug])
    .map(([slug, v]) => {
      const cat = catalogEntry(slug);
      return {
        slug,
        ...v,
        name: v.name || cat?.name || prettySlug(slug),
        market: v.market || cat?.market || "",
        seoSlug: v.seoSlug ?? cat?.seoSlug ?? null,
      };
    })
    .sort((a, b) => b.at - a.at);
}

/* ════════ UPDATE BADGE — date-based section flags ════════
   A section is "updated" when its DB date (baked into report-dates.json at
   build time) is newer than `since` — the buyer's last-opened timestamp for
   that report. Opening the report refreshes `since` (recordReportView), so
   the badge clears. Labels are the buyer-facing section names. */
const SECTION_LABEL: Record<string, string> = {
  legal: "Legal & Compliance",
  construction: "Construction & Sales",
  location: "Location Intelligence",
  hero: "Report",
  news: "News & Updates",
};
const SECTION_ORDER = ["news", "legal", "construction", "location", "hero"] as const;

export function reportUpdates(dates: SectionDates | null | undefined, since: number | null | undefined): SectionUpdate[] {
  if (!dates || since == null) return [];
  const out: SectionUpdate[] = [];
  for (const key of SECTION_ORDER) {
    const iso = dates[key];
    if (!iso) continue;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) continue;
    if (t > since) out.push({ key, label: SECTION_LABEL[key], iso });
  }
  return out;
}

/* ════════════════════════════════════════════════════════════════
   SESSION-BACKED READS — the office, per account (Phase 2)

   With a real session (minted at sign-in, stored by phoneAuth under
   "truthEstate.sbSession") the office reads the buyer's OWN invoices and
   viewed reports straight from Postgres under RLS, so they follow the
   ACCOUNT across devices instead of living on one browser. Purchased is
   already account-backed (the entitlements cache, refreshed on every load);
   owned is next, once its table exists (migration 0012).

   These are ADAPTERS, not UI: each maps DB rows onto the EXISTING Payment /
   ViewRecord shapes the Documents tab already renders — no component
   changes. Every path fails SOFT and returns null (never []) when there is
   no session, the lookup errors, or the shape is wrong — null means "keep
   the local copy you already painted", which the caller can tell apart from
   an empty array ("signed in, genuinely nothing").
   ════════════════════════════════════════════════════════════════ */
const SB_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
const SB_ANON =
  "sb_publishable_bLpHCRL6Xa0viqYeEuM3NA_U5VvNWwq";

/* The session phoneAuth writes on a verified sign-in. Read inline rather
   than importing phoneAuth so this data layer keeps its single dependency
   (./site) and never pulls the auth/journey chain into the office bundle. */
function accessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("truthEstate.sbSession");
    const s = raw ? (JSON.parse(raw) as { access_token?: string | null }) : null;
    return s?.access_token ?? null;
  } catch {
    return null;
  }
}

/* The account id in the same session blob — owned writes scope the row to
   the signed-in user. RLS with-check re-enforces this server-side, so a
   tampered id buys nothing; sending it just lets the row land in one shot. */
function sessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("truthEstate.sbSession");
    const s = raw ? (JSON.parse(raw) as { user_id?: string | null }) : null;
    return s?.user_id ?? null;
  } catch {
    return null;
  }
}

/* liveSlug, inlined — the internal id events and entitlements key on is the
   slugified project name. Kept local so this module never imports the
   build-time supabase layer just for one string transform. */
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* jsonb can surface as a real object OR a string depending on the driver;
   normalise both to a plain record so a props read never throws. */
function asProps(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v) as unknown;
      return p && typeof p === "object" && !Array.isArray(p) ? (p as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return {};
}

type PaymentRow = {
  id?: string; status?: string | null; project_name?: string | null; package_name?: string | null;
  amount?: number | string | null; created_at?: string | null;
  mrp_inr?: number | string | null; discount_label?: string | null;
  razorpay_order_id?: string | null; razorpay_payment_id?: string | null;
};

/* Documents · Invoices / the "Invoice ↗" buttons — the buyer's real
   completed payments, RLS-scoped to them. The invoice number is a display
   artifact (the authoritative reference is the Razorpay id on the receipt),
   so it is synthesised deterministically from chronological order — TE-YYYY
   from each payment's own year, a running sequence across all of them —
   mirroring how addPayment numbers the local records. */
export async function fetchMyPaymentsRemote(): Promise<Payment[] | null> {
  const token = accessToken();
  if (!token) return null;
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/payments` +
        `?select=id,status,project_name,package_name,amount,mrp_inr,discount_label,created_at,razorpay_order_id,razorpay_payment_id` +
        `&order=created_at.asc&limit=200`,
      { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const rows = (await res.json().catch(() => null)) as PaymentRow[] | null;
    if (!Array.isArray(rows)) return null;
    const out: Payment[] = [];
    let seq = 0;
    for (const r of rows) {
      /* Only settled money is an invoice — a pending or failed row is not
         something to hand the buyer a receipt for. Case-tolerant, because
         status has been written both "completed" and "Completed". */
      if ((r.status ?? "").toLowerCase() !== "completed") continue;
      const amt = typeof r.amount === "string" ? parseFloat(r.amount) : r.amount ?? 0;
      const amountInr = Number.isFinite(amt) ? Math.round(amt as number) : 0;
      /* List price, only when it exceeds what was paid — a struck price ≤ the
         total would be noise on the receipt. */
      const mrpRaw = typeof r.mrp_inr === "string" ? parseFloat(r.mrp_inr) : r.mrp_inr ?? 0;
      const mrpInr = Number.isFinite(mrpRaw) && (mrpRaw as number) > amountInr ? Math.round(mrpRaw as number) : undefined;
      const date = r.created_at ? new Date(r.created_at).getTime() : Date.now();
      /* All-Access carries the "all" package and no single project. */
      const allAccess = (r.package_name ?? "").toLowerCase() === "all" || !r.project_name;
      const stored = (r.project_name ?? "").trim();
      const slug = allAccess ? null : slugify(stored);
      /* project_name is a readable name on new rows and a raw slug on old
         ones; prettify only when it looks like a slug. */
      const name = allAccess
        ? ""
        : stored && !/^[a-z0-9-]+$/.test(stored)
          ? stored
          : slug
            ? prettySlug(slug)
            : "";
      seq += 1;
      const invoiceNo = `TE-${new Date(date).getFullYear()}-${String(seq).padStart(4, "0")}`;
      out.push({
        id: r.id ?? r.razorpay_payment_id ?? invoiceNo,
        slug,
        item: allAccess ? "All-Access — every report & 3D across the site" : `Full read${name ? ` — ${name}` : ""}`,
        amountInr,
        ...(mrpInr ? { mrpInr, discountLabel: r.discount_label ?? "Offer" } : {}),
        date,
        ...(r.razorpay_payment_id ? { razorpayId: r.razorpay_payment_id } : {}),
        invoiceNo,
      });
    }
    /* The server is authoritative for a signed-in buyer, but never at the
       cost of dropping a real receipt: a purchase whose ledger write failed,
       or one recorded locally before the account was attached, lives only in
       localStorage. Merge those in (deduped on project + amount, the server
       row winning) so switching on sessions can only ADD invoices, never
       hide one the buyer already had. */
    const key = (p: Payment) => `${p.slug ?? "all"}|${p.amountInr}`;
    const have = new Set(out.map(key));
    for (const p of listPayments()) if (!have.has(key(p))) out.push(p);
    return out;
  } catch {
    return null;
  }
}

type EventRow = { project_slug?: string | null; project_name?: string | null; created_at?: string | null; props?: unknown };

/* Documents · Viewed — reports the buyer OPENED but has not bought or
   marked owned, read from the event trail (report_viewed) under RLS.
   Deduped to the latest open per report and filtered exactly like the local
   listViewed(): purchased and owned reports live on other tabs.

   seoSlug / market ride along in the event props on new opens; for older
   events (props absent) they are backfilled from THIS device's local view
   record when it has one, and otherwise left null — the row still shows,
   its link falling back to the catalogue, rather than being dropped. */
export async function fetchMyViewedRemote(): Promise<(ViewRecord & { slug: string })[] | null> {
  const token = accessToken();
  if (!token) return null;
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/events` +
        `?name=eq.report_viewed&select=project_slug,project_name,created_at,props` +
        `&order=created_at.desc&limit=500`,
      { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const rows = (await res.json().catch(() => null)) as EventRow[] | null;
    if (!Array.isArray(rows)) return null;
    const localViews = listViews();
    const ownedMap = readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {});
    const seen = new Set<string>();
    const out: (ViewRecord & { slug: string })[] = [];
    for (const r of rows) {
      const slug = (r.project_slug ?? "").trim();
      if (!slug || seen.has(slug)) continue; // desc order ⇒ the first row per slug is the newest
      seen.add(slug);
      if (hasPurchase(slug) || ownedMap[slug]) continue; // same filter as listViewed()
      const p = asProps(r.props);
      const local = localViews[slug];
      const cat = catalogEntry(slug);
      const seoSlug = (typeof p.seoSlug === "string" && p.seoSlug ? p.seoSlug : local?.seoSlug) ?? cat?.seoSlug ?? null;
      const market = (typeof p.market === "string" && p.market ? p.market : local?.market) || cat?.market || "";
      out.push({
        slug,
        name: r.project_name || local?.name || cat?.name || prettySlug(slug),
        market,
        seoSlug,
        at: r.created_at ? new Date(r.created_at).getTime() : local?.at ?? Date.now(),
      });
    }
    /* Augment with any local-only open the trail is missing — a view whose
       event never flushed (tab closed inside the 800ms batch) or failed to
       send. listViewed() is already filtered to not-purchased/not-owned and
       deduped, so this only adds reports the server set doesn't already carry
       and never resurrects one that belongs on another tab. */
    for (const v of listViewed()) if (!seen.has(v.slug)) { seen.add(v.slug); out.push(v); }
    return out.sort((a, b) => b.at - a.at);
  } catch {
    return null;
  }
}

/* ── My Portfolio, per account (owned_properties, migration 0012) ──
   Owned is self-declared and READ-WRITE, so unlike invoices/views it needs
   a write path too — markOwned / unmarkOwned mirror every change up. All
   three helpers are no-ops without a session and fail soft: before the
   table exists (0012 not yet run) the read 404s to null and the writes are
   swallowed, so the office simply stays on its localStorage copy. */
type OwnedRow = { slug?: string; name?: string | null; market?: string | null; seo_slug?: string | null; note?: string | null; created_at?: string | null };

async function ownedGet(): Promise<(OwnedRecord & { slug: string })[] | null> {
  const token = accessToken();
  if (!token) return null;
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/owned_properties?select=slug,name,market,seo_slug,note,created_at&order=created_at.desc`,
      { headers: { apikey: SB_ANON, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null; // 404 until 0012 is run ⇒ keep the local copy
    const rows = (await res.json().catch(() => null)) as OwnedRow[] | null;
    if (!Array.isArray(rows)) return null;
    return rows
      .filter((r) => r.slug)
      .map((r) => ({
        slug: r.slug as string,
        name: r.name || prettySlug(r.slug as string),
        market: r.market || "",
        seoSlug: r.seo_slug ?? null,
        at: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
        ...(r.note ? { note: r.note } : {}),
      }));
  } catch {
    return null;
  }
}

/* Upsert on (user_id, slug). created_at carries the ORIGINAL mark time
   (markOwned preserves it) so the "marked <date>" label survives the trip
   to a second device; updated_at moves on every write. Fire-and-forget —
   the local copy already drives the UI. */
function ownedPut(slug: string, rec: OwnedRecord): void {
  const token = accessToken();
  const uid = sessionUserId();
  if (!token || !uid) return;
  void fetch(`${SB_URL}/rest/v1/owned_properties?on_conflict=user_id,slug`, {
    method: "POST",
    headers: {
      apikey: SB_ANON,
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: uid,
      slug,
      name: rec.name,
      market: rec.market,
      seo_slug: rec.seoSlug,
      note: rec.note ?? null,
      created_at: new Date(rec.at).toISOString(),
      updated_at: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => { /* local copy is authoritative for the UI */ });
}

function ownedDel(slug: string): void {
  const token = accessToken();
  const uid = sessionUserId();
  if (!token || !uid) return;
  void fetch(
    `${SB_URL}/rest/v1/owned_properties?user_id=eq.${encodeURIComponent(uid)}&slug=eq.${encodeURIComponent(slug)}`,
    { method: "DELETE", headers: { apikey: SB_ANON, Authorization: `Bearer ${token}`, Prefer: "return=minimal" }, signal: AbortSignal.timeout(8000) },
  ).catch(() => { /* local delete already happened */ });
}

/* My Portfolio, reconciled across devices. Pull anything the account holds
   that this browser is missing DOWN into the local copy (so it persists
   here), push anything this browser holds that the account is missing UP
   (so a portfolio declared before sessions still propagates), and return
   the merged, de-duplicated list for display. Null (keep local) when signed
   out, offline, or before 0012 creates the table. */
export async function syncOwnedRemote(): Promise<(OwnedRecord & { slug: string })[] | null> {
  const remote = await ownedGet();
  if (!remote) return null;
  const map = readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {});
  const remoteSlugs = new Set(remote.map((r) => r.slug));
  let changed = false;
  for (const r of remote) {
    if (!map[r.slug]) {
      map[r.slug] = { name: r.name, market: r.market, seoSlug: r.seoSlug, at: r.at, ...(r.note ? { note: r.note } : {}) };
      changed = true;
    }
  }
  if (changed) writeJSON(OWNED_KEY, map);
  for (const [slug, rec] of Object.entries(map)) if (!remoteSlugs.has(slug)) ownedPut(slug, rec);
  return Object.entries(map).map(([slug, rec]) => ({ slug, ...rec })).sort((a, b) => b.at - a.at);
}

/* ════════ slug → public page + name (search-index.json) ════════
   The build emits search-index.json ({ p: [{ s: slug, q: seoSlug, n: name,
   m: market }] }) — the same index the project palette uses. The office loads
   it so it can link a report to its REAL page (and label it correctly) even
   when the row it holds carries only the internal slug: a payment, or an old
   report_viewed event from before the seo slug rode along in the event props.
   Without it, reportHref falls back to the catalogue for every such row — the
   "all CTAs point at /intelligence/projects" bug. */
type CatalogEntry = { name: string; seoSlug: string | null; market: string | null };
let _catalog: Record<string, CatalogEntry> | null = null;
let _catalogInflight: Promise<Record<string, CatalogEntry>> | null = null;
export async function loadReportCatalog(): Promise<Record<string, CatalogEntry>> {
  if (_catalog) return _catalog;
  if (typeof window === "undefined") return {};
  if (_catalogInflight) return _catalogInflight;
  _catalogInflight = fetch(`${basePath}/search-index.json`)
    .then((r) => (r.ok ? r.json() : { p: [] }))
    .then((j: { p?: { s?: string; q?: string; n?: string; m?: string }[] }) => {
      const map: Record<string, CatalogEntry> = {};
      for (const p of j.p ?? []) {
        if (p.s) map[p.s] = { name: p.n || prettySlug(p.s), seoSlug: p.q ?? null, market: p.m ?? null };
      }
      _catalog = map;
      return map;
    })
    .catch(() => (_catalog = {}));
  return _catalogInflight;
}
/* Synchronous lookup against the cache loadReportCatalog() fills; null until
   it has loaded, so every caller degrades to whatever it already held. */
function catalogEntry(slug: string): CatalogEntry | null {
  return (_catalog && _catalog[slug]) || null;
}

/* ════════ report-dates.json — fetch once, cache ════════ */
let _datesCache: ReportDates | null = null;
let _datesInflight: Promise<ReportDates> | null = null;
export async function loadReportDates(): Promise<ReportDates> {
  if (_datesCache) return _datesCache;
  if (typeof window === "undefined") return {};
  if (_datesInflight) return _datesInflight;
  _datesInflight = fetch(`${basePath}/report-dates.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((j: unknown) => {
      _datesCache = j && typeof j === "object" ? (j as ReportDates) : {};
      return _datesCache;
    })
    .catch(() => {
      _datesCache = {};
      return _datesCache;
    });
  return _datesInflight;
}
