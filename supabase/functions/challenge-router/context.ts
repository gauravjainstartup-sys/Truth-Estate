/* ════════════════════════════════════════════════════════════════
   GENERAL CONTEXT — built SERVER-SIDE from the live database.

   Replaces a client-supplied, hand-typed context. Two reasons:

   1. FRESHNESS. The old context hardcoded 6 corridors with invented
      price bands. The database has 8 with real avg_cost_sqft, and the
      invented numbers were badly wrong (Sohna Road was described as the
      cheap corridor at ₹7–14k; it is actually ₹19,250/sqft, the fourth
      most expensive). Counts, corridors, developers and projects are now
      all derived — nothing about the market is typed into this file.

   2. INTEGRITY. The client used to assemble the knowledge and POST it.
      Anyone could edit that payload and have TruthGuide state invented
      projects and scores as fact. The server now builds it; a context
      arriving from a client is ignored for general mode.

   SOURCE OF TRUTH: backlog_listing_public_v3 — the published, scored
   set the site itself renders (97 rows). Deliberately NOT the `projects`
   table (312 rows), which includes unpublished and unscored work the bot
   must never mention, since a visitor could not go and read it.

   Kept free of Deno.* so the offline harness can exercise it under Node.
   ════════════════════════════════════════════════════════════════ */

export type FetchLike = (url: string, init?: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

export type DbDeps = { url: string; key: string; fetchImpl: FetchLike };

export type ProjectRow = {
  name: string;
  developer: string | null;
  location: string | null;
  microMarket: string | null;
  truthScore: number | null;
  min_price_cr: number | null;
  avg_cost_sqft: number | null;
  config: string | null;
  deliveryYear: string | null;
  redFlags: number | null;
  delayRisk: string | null;
};

export type CorridorRow = {
  name: string;
  slug: string | null;
  avg_cost_sqft: number | null;
  mm_potential: { notes?: string; score?: { final_score?: number } } | null;
};

export type LiveData = {
  projects: ProjectRow[];
  corridors: CorridorRow[];
  developers: string[];
  fetchedAt: number;
};

/* ── Live reads ─────────────────────────────────────────────────── */

const PROJECT_COLS =
  "name,developer,location,microMarket,truthScore,min_price_cr,avg_cost_sqft,config,deliveryYear,redFlags,delayRisk";

async function rows<T>(path: string, deps: DbDeps): Promise<T[]> {
  const res = await deps.fetchImpl(`${deps.url}/rest/v1/${path}`, {
    headers: { apikey: deps.key, Authorization: `Bearer ${deps.key}` },
  });
  if (!res.ok) {
    console.error(`[context] ${path.split("?")[0]} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function fetchLiveData(deps: DbDeps): Promise<LiveData> {
  const [projects, corridors, devs] = await Promise.all([
    // %22 quotes the camelCase column — PostgREST needs it for order
    rows<ProjectRow>(
      `backlog_listing_public_v3?select=${PROJECT_COLS}&order=%22truthScore%22.desc.nullslast&limit=500`,
      deps,
    ),
    rows<CorridorRow>(
      `micro_market_data?select=name,slug,avg_cost_sqft,mm_potential&order=avg_cost_sqft.desc&limit=100`,
      deps,
    ),
    rows<{ name: string }>(`developers?select=name&order=name.asc&limit=200`, deps),
  ]);
  return {
    projects: projects.filter((p) => p.name),
    corridors: corridors.filter((c) => c.name),
    developers: devs.map((d) => d.name).filter(Boolean),
    fetchedAt: Date.now(),
  };
}

/* ── Cache ──────────────────────────────────────────────────────
   The scoreboard is identical for every visitor and only changes when
   the pipeline writes. A short TTL keeps answers effectively live while
   turning per-message reads into a handful per hour. */
export const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: LiveData | null = null;

export async function getLiveData(deps: DbDeps, now = Date.now()): Promise<LiveData> {
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache;
  const fresh = await fetchLiveData(deps);
  // Never replace a good cache with an empty read — a transient DB blip
  // would otherwise leave TruthGuide with no projects at all.
  if (fresh.projects.length === 0 && cache) {
    console.error("[context] live read returned 0 projects — serving stale cache");
    return cache;
  }
  cache = fresh;
  return fresh;
}

export function resetCache(): void {
  cache = null;
}

/* ── Rendering ──────────────────────────────────────────────────── */

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/* Mirrors liveSlug() in src/lib/supabase.ts. */
export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function projectLine(p: ProjectRow): string {
  const bits = [p.name];
  if (p.developer) bits.push(p.developer);
  const where = p.microMarket ?? p.location;
  if (where) bits.push(where);
  if (p.truthScore != null) bits.push(`Truth Score ${Math.round(p.truthScore)}`);
  if (p.min_price_cr != null) bits.push(`from ₹${p.min_price_cr} Cr`);
  if (p.avg_cost_sqft != null) bits.push(`${inr(p.avg_cost_sqft)}/sqft`);
  if (p.config) bits.push(p.config);
  if (p.deliveryYear) bits.push(`handover ${p.deliveryYear}`);
  return `- ${bits.join(" · ")}`;
}

function corridorLine(c: CorridorRow): string {
  const bits = [c.name];
  if (c.avg_cost_sqft != null) bits.push(`${inr(c.avg_cost_sqft)}/sqft avg`);
  const score = c.mm_potential?.score?.final_score;
  if (score != null) bits.push(`corridor potential ${score}/100`);
  let line = `- ${bits.join(" · ")}`;
  const notes = c.mm_potential?.notes;
  if (notes) line += `\n    ${notes.trim()}`;
  return line;
}

/* Forensic signals are the paid layer, and they unlock PER PROJECT —
   mirroring the ₹999 wall on the project reports. A visitor sees depth
   only on the projects they have actually bought. */
function forensicLine(p: ProjectRow): string | null {
  const bits: string[] = [];
  if (p.redFlags != null && p.redFlags > 0) bits.push(`${p.redFlags} red flag${p.redFlags === 1 ? "" : "s"} logged`);
  if (p.delayRisk) bits.push(`delay risk ${p.delayRisk}`);
  return bits.length ? `- ${p.name}: ${bits.join("; ")}` : null;
}

/* ════════════════════════════════════════════════════════════════
   NEWS & UPDATES (project_intelligence_wire)

   The verified ground-events log the site renders in each report's
   "News & Updates" section — regulatory filings, EPC milestones, JVs,
   pricing moves. The SITE bakes it at build time; TruthGuide reads it
   LIVE here (same 5-min cache as the scoreboard), so a fresh dispatch
   reaches the chat within minutes without a redeploy.

   PUBLISHED rows only. The service key bypasses RLS, so the query pins
   status=eq.PUBLISHED and the mapper re-checks it — a DRAFT must never
   reach the model (it would state unreviewed claims as verified fact).
   ════════════════════════════════════════════════════════════════ */
export type WireRow = {
  project_slug: string;
  project_name: string;
  event_date: string;
  category: string;
  headline: string;
  verified_facts: string;
  forensic_impact_type: string;
  forensic_impact_summary: string;
  source_name: string;
  status: string;
  is_pinned: boolean;
};

let wireCache: { at: number; rows: WireRow[] } | null = null;

export async function fetchWireRows(deps: DbDeps, now = Date.now()): Promise<WireRow[]> {
  if (wireCache && now - wireCache.at < CACHE_TTL_MS) return wireCache.rows;
  const fresh = (
    await rows<WireRow>(
      "project_intelligence_wire?select=project_slug,project_name,event_date,category,headline,verified_facts,forensic_impact_type,forensic_impact_summary,source_name,status,is_pinned&status=eq.PUBLISHED&order=event_date.desc,display_order.asc&limit=1000",
      deps,
    )
  ).filter((r) => r.status === "PUBLISHED" && r.project_slug && r.headline);
  // Never replace a good cache with an empty read (transient blip / renamed
  // column would otherwise strip every event).
  if (fresh.length === 0 && wireCache) return wireCache.rows;
  wireCache = { at: now, rows: fresh };
  return fresh;
}

export function resetWireCache(): void {
  wireCache = null;
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/* Which wire rows belong to this report. MIRRORS fetchProjectWire in
   src/lib/supabase.ts — keep the two in step: exact slug match wins
   outright (returning ONLY exact rows is what stops "m3m-capital" stealing
   its "-phase-2" sibling's dispatches), then an exact project-NAME match
   (for a caller that only has the name), then the same tight fuzzy
   fallback for a report whose rows were filed under a compressed slug. */
export function matchWire(all: WireRow[], slugOrName: string): WireRow[] {
  const target = slugify(slugOrName);
  if (!target) return [];

  const exact = all.filter((r) => slugify(r.project_slug) === target);
  if (exact.length) return exact;

  const byName = all.filter((r) => slugify(r.project_name) === target);
  if (byName.length) return byName;

  const targetTokens = target.split("-").filter(Boolean);
  const targetSet = new Set(targetTokens);
  return all.filter((r) => {
    const itSlug = slugify(r.project_slug);
    if (!itSlug) return false;
    if (itSlug.length >= 8 && (target.includes(itSlug) || itSlug.includes(target))) return true;
    const itTokens = itSlug.split("-").filter(Boolean);
    const [small, big] = itTokens.length <= targetTokens.length
      ? [itTokens, targetSet]
      : [targetTokens, new Set(itTokens)];
    return small.length >= 6 && small.every((t) => big.has(t));
  });
}

/* One event, full depth — project mode only. */
function projectWireLine(r: WireRow): string {
  const head = [fmtDate(r.event_date), r.category, r.forensic_impact_type].filter(Boolean).join(" · ");
  const bits = [`${head} — ${r.headline.trim()}`];
  const facts = clip((r.verified_facts ?? "").trim(), 300);
  if (facts) bits.push(`Facts: ${facts}`);
  const impact = clip((r.forensic_impact_summary ?? "").trim(), 220);
  if (impact) bits.push(`Impact: ${impact}`);
  const src = (r.source_name ?? "").trim();
  if (src) bits.push(`Source: ${src}`);
  return `- ${bits.join(" ")}`;
}

/* One event, one compact line — the cross-project digest in general mode. */
function generalWireLine(r: WireRow): string {
  return `- ${fmtDate(r.event_date)} · ${(r.project_name ?? "").trim() || r.project_slug} — ${r.category} · ${r.forensic_impact_type}: ${clip(r.headline.trim(), 140)}`;
}

const PROJECT_NEWS_SHOWN = 10;

export async function buildProjectNews(deps: DbDeps, slugOrName: string): Promise<string | null> {
  if (!slugOrName?.trim()) return null;
  const mine = matchWire(await fetchWireRows(deps), slugOrName);
  if (!mine.length) return null;
  /* Pinned float to the top, newest first within each group — the same
     order the report's News & Updates section renders (sort is stable, and
     the rows arrive event_date desc). */
  const sorted = [...mine].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
  const shown = sorted.slice(0, PROJECT_NEWS_SHOWN);
  const lines = [
    `── NEWS & UPDATES (this project — ${mine.length} verified ground event${mine.length === 1 ? "" : "s"}, newest first. Use these for questions about recent news, progress, approvals or price moves, and quote the event date) ──`,
    ...shown.map(projectWireLine),
  ];
  if (mine.length > shown.length) lines.push(`(${mine.length - shown.length} older event${mine.length - shown.length === 1 ? "" : "s"} not shown)`);
  return lines.join("\n");
}

export type BuiltContext = { publicKnowledge: string; paidKnowledge: string | null; projectCount: number };

export function renderContext(
  data: LiveData,
  unlockedProjects: string[] = [],
  wire: WireRow[] = [],
): BuiltContext {
  const { projects, corridors, developers } = data;

  /* Newest first across all projects; capped so 400+ events can't crowd the
     scoreboard out of the prompt. The per-project chat carries that project's
     full log via buildProjectNews. */
  const recentWire = wire.slice(0, 25);

  const publicKnowledge = [
    `ROLE: You are TruthGuide, the independent real estate advisor for Truth Estate — a buyer-side-only advisory. No inventory, no developer commission, no paid placement.`,
    `SCOPE: Gurugram residential real estate ONLY.`,
    ``,
    `METHODOLOGY: Every tracked project carries a Truth Score (0–100) from five weighted pillars — Location (26%), Developer (25%), Construction (22%), Legal (15%), USPs (12%). Re-scored quarterly. No builder can pay to move it.`,
    `SCORE BANDS: 90+ Exceptional · 80–89 Strong · 70–79 Solid · 60–69 Fair · below 60 Watch.`,
    ``,
    `MICRO-MARKETS (${corridors.length} tracked, with our current average rates):`,
    ...corridors.map(corridorLine),
    ``,
    `DEVELOPERS TRACKED (${developers.length}): ${developers.join(", ")}`,
    ``,
    `TRACKED PROJECTS (${projects.length}, ranked by Truth Score — this scoreboard is PUBLIC. Use it freely to name projects, quote scores, filter by budget, corridor or configuration, and rank):`,
    ...projects.map(projectLine),
    ...(recentWire.length
      ? [
          ``,
          `NEWS & UPDATES (the ${recentWire.length} most recent of ${wire.length} verified ground events across tracked projects, newest first — use these for "any recent news / what changed" questions and quote the event date. A news question about ANY tracked project is IN SCOPE — never give the out-of-scope line for one. Only the latest events are listed here, so absence is NOT "no news": for a tracked project not listed below, say the latest dispatches don't cover it and point the visitor to the "News & Updates" section of that project's report, which carries its full log):`,
          ...recentWire.map(generalWireLine),
        ]
      : []),
  ].join("\n");

  if (!unlockedProjects.length) {
    return { publicKnowledge, paidKnowledge: null, projectCount: projects.length };
  }

  /* The client stores unlocks as slugs; the view carries only names. Match
     on the slug both sides derive the same way (mirrors liveSlug() in
     src/lib/supabase.ts — keep the two in step). Accept a raw name too, so
     an unlock recorded either way still resolves. */
  const unlocked = new Set(unlockedProjects.map((s) => slugify(s)));
  const forensics = projects
    .filter((p) => unlocked.has(slugify(p.name)))
    .map(forensicLine)
    .filter(Boolean) as string[];

  if (!forensics.length) {
    return { publicKnowledge, paidKnowledge: null, projectCount: projects.length };
  }

  const paidKnowledge = [
    `FORENSIC LAYER — this visitor has PURCHASED the read on the projects below. Go to full depth on THESE ONLY; for anything else stay at the public level.`,
    ...forensics,
  ].join("\n");

  return { publicKnowledge, paidKnowledge, projectCount: projects.length };
}

export async function buildGeneralContext(
  deps: DbDeps,
  unlockedProjects: string[] = [],
): Promise<BuiltContext> {
  /* The news digest fails soft — a wire outage must never cost the whole
     scoreboard answer (general mode has no try/catch above this). */
  const [data, wire] = await Promise.all([
    getLiveData(deps),
    fetchWireRows(deps).catch((e) => {
      console.error("[context] wire read failed", e instanceof Error ? e.message : e);
      return [] as WireRow[];
    }),
  ]);
  return renderContext(data, unlockedProjects, wire);
}

/* ════════════════════════════════════════════════════════════════
   PROJECT DOCUMENTS & EXTENDED DETAILS (project mode only)

   The scoreboard view is shallow — the brochure, payment plan, site plan
   and launch-price / size / floors detail live in project_extended_details,
   which keys on backlog_projects.id, NOT on the listing name. We bridge
   listing name → backlog id → extended row (the same name bridge the site's
   catalogue uses) and key the result by slug, so the per-project chat can
   quote real pricing and hand over a document link when asked.

   Fails soft everywhere: a missing table, a 400 or an unmatched name simply
   yields no block, and the chat answers from the public facts as before.
   ════════════════════════════════════════════════════════════════ */
type ExtEntry = {
  brochureUrl: string | null;
  paymentPlanUrl: string | null;
  siteMapUrl: string | null;
  priceRangeSqft: string | null;
  superAreaRange: string | null;
  floorsRange: string | null;
  totalTowers: number | null;
  launchPrice: number | null;
};

let extCache: { at: number; index: Record<string, ExtEntry> } | null = null;

async function fetchExtIndex(deps: DbDeps, now = Date.now()): Promise<Record<string, ExtEntry>> {
  if (extCache && now - extCache.at < CACHE_TTL_MS) return extCache.index;
  const [ext, names] = await Promise.all([
    rows<Record<string, unknown>>(
      "project_extended_details?select=backlog_id,brochure_url,payment_plan_url,site_map_image_url,price_range_sqft,super_area_range,floors_range,total_towers,launch_price&limit=400",
      deps,
    ),
    // project_name is the current column; the bridge mirrors fetchBacklogNameIds.
    rows<{ id: string | number; project_name: string }>("backlog_projects?select=id,project_name&limit=2000", deps),
  ]);
  const nameById = new Map<string, string>();
  for (const r of names) if (r.id != null && r.project_name) nameById.set(String(r.id), r.project_name);
  const index: Record<string, ExtEntry> = {};
  for (const r of ext) {
    const name = nameById.get(String(r.backlog_id ?? ""));
    if (!name) continue;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const num = (v: unknown) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
    index[slugify(name)] = {
      brochureUrl: str(r.brochure_url),
      paymentPlanUrl: str(r.payment_plan_url),
      siteMapUrl: str(r.site_map_image_url),
      priceRangeSqft: str(r.price_range_sqft),
      superAreaRange: str(r.super_area_range),
      floorsRange: str(r.floors_range),
      totalTowers: num(r.total_towers),
      launchPrice: num(r.launch_price),
    };
  }
  // Never replace a good cache with an empty read (a transient blip or a
  // renamed column would otherwise strip every project's documents).
  if (Object.keys(index).length === 0 && extCache) return extCache.index;
  extCache = { at: now, index };
  return index;
}

export function resetExtCache(): void {
  extCache = null;
}

export async function buildProjectExtras(deps: DbDeps, slugOrName: string): Promise<string | null> {
  const key = slugify(slugOrName);
  if (!key) return null;
  const e = (await fetchExtIndex(deps))[key];
  if (!e) return null;

  const facts: string[] = [];
  if (e.priceRangeSqft) facts.push(`base rate ${e.priceRangeSqft}/sqft`);
  if (e.superAreaRange) facts.push(`sizes ${e.superAreaRange} sqft`);
  if (e.floorsRange) facts.push(`floors ${e.floorsRange}`);
  if (e.totalTowers != null) facts.push(`${e.totalTowers} towers`);
  if (e.launchPrice != null) facts.push(`launch price ${inr(e.launchPrice)}`);

  const docs: string[] = [];
  if (e.brochureUrl) docs.push(`Brochure: ${e.brochureUrl}`);
  if (e.paymentPlanUrl) docs.push(`Payment plan: ${e.paymentPlanUrl}`);
  if (e.siteMapUrl) docs.push(`Site plan: ${e.siteMapUrl}`);

  if (!facts.length && !docs.length) return null;

  const lines = ["── EXTENDED DETAILS & DOCUMENTS (this project) ──"];
  if (facts.length) lines.push(facts.join(" · "));
  if (docs.length) {
    lines.push("DOCUMENTS — share the DIRECT link if the visitor asks for the brochure / payment plan / site plan:");
    lines.push(...docs.map((d) => `- ${d}`));
  }
  return lines.join("\n");
}
