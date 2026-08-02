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

/* ── Records ── */
export type ViewRecord = { name: string; market: string; seoSlug: string | null; at: number };
export type OwnedRecord = { name: string; market: string; seoSlug: string | null; at: number; note?: string };
export type Rating = { stars: number; comment?: string; at: number };
export type Payment = {
  id: string;
  slug: string | null; // null for the site-wide All-Access purchase
  item: string;
  amountInr: number;
  date: number;
  razorpayId?: string;
  invoiceNo: string; // "TE-YYYY-NNNN"
};
export type Vote = "in" | "no";

/* ── Per-section report dates (from report-dates.json) ── */
export type SectionDates = { legal?: string | null; construction?: string | null; location?: string | null; hero?: string | null };
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
}
export function unmarkOwned(slug: string): void {
  if (typeof window === "undefined" || !slug) return;
  const map = readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {});
  if (map[slug]) {
    delete map[slug];
    writeJSON(OWNED_KEY, map);
  }
}
export function isOwned(slug: string): boolean {
  if (typeof window === "undefined" || !slug) return false;
  return !!readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {})[slug];
}
export function listOwned(): (OwnedRecord & { slug: string })[] {
  const map = readJSON<Record<string, OwnedRecord>>(OWNED_KEY, {});
  return Object.entries(map)
    .map(([slug, rec]) => ({ slug, ...rec }))
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
export function addPayment(input: { slug: string | null; item: string; amountInr: number; razorpayId?: string; date?: number }): Payment | null {
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
function loadAccess(): AccessState {
  const a = readJSON<Partial<AccessState>>(ACCESS_KEY, {});
  return { all: !!a.all, reads: a.reads ?? [], threeD: a.threeD ?? [] };
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
    rows.push({
      slug,
      name: rec?.name ?? prettySlug(slug),
      market: rec?.market ?? "",
      seoSlug: rec?.seoSlug ?? null,
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
    .map(([slug, v]) => ({ slug, ...v }))
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
};
const SECTION_ORDER = ["legal", "construction", "location", "hero"] as const;

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
