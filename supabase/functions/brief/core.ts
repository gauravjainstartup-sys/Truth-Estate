/* ════════════════════════════════════════════════════════════════
   BRIEF INFERENCE — what the trail says this buyer is looking for.

   The dashboard's opening question is "given what you know about me,
   what should I do?". Answering it needs a brief, and most visitors
   never fill one in. But they leave one: the reports they open, the ones
   they come back to, the one they paid for. This turns that into a brief
   the visitor CONFIRMS rather than a form they complete.

   Two rules govern everything here.

   ONE — never guess from thin evidence. A single report open cannot
   support "SPR, ₹7-9 Cr, 4 BHK" on a seven-crore decision. Below
   MIN_PROJECTS distinct reports the answer is "not enough", and the
   caller falls back to whatever the visitor stated explicitly.

   TWO — every guess carries the evidence that produced it, in words the
   visitor can check ("you opened both, twice"). A guess they cannot audit
   is worse than no guess: it reads as surveillance when it is right and
   as incompetence when it is wrong.

   Pure functions, no Deno or network — test-offline.mjs runs this file
   under node.
   ════════════════════════════════════════════════════════════════ */

/* Three distinct reports. Two is a comparison, not a pattern — and the
   commonest two-report shape is "the one I came for and the one you
   suggested", which says more about the site than the buyer. */
export const MIN_PROJECTS = 3;

export type EventRow = {
  name: string;
  project_slug: string | null;
  created_at: string;
};

export type ProjectRow = {
  name: string;
  microMarket: string | null;
  min_price_cr: number | null;
  config: string | null;
  min_bhk_num: number | null;
  avg_cost_sqft: number | null;
  truthScore: number | null;
};

export type Guess<T> = {
  value: T | null;
  /* Shown verbatim under the field. Written as something the visitor can
     verify from memory, never as a confidence percentage. */
  evidence: string;
  confidence: "strong" | "weak" | "none";
};

export type TouchedProject = {
  slug: string;
  name: string;
  microMarket: string | null;
  minPriceCr: number | null;
  bhk: number | null;
  views: number;
  paid: boolean;
  enquired: boolean;
  weight: number;
  lastAt: string;
};

export type InferredBrief = {
  enough: boolean;
  reportsRead: number;
  projects: TouchedProject[];
  corridor: Guess<string[]>;
  budgetCr: Guess<{ min: number; max: number }>;
  config: Guess<string>;
  timeline: Guess<null>;
};

/* Must stay byte-identical to liveSlug in src/lib/supabase.ts and
   modelSlugFor in src/lib/journey.ts. The report routes are built from
   liveSlug, events are written with it, and this is the only thing
   joining the two — a divergence here silently returns "no projects
   found" rather than an error, which is the worst way to be wrong. */
export function slugify(name: string): string {
  return (name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* Engagement weights. A purchase is not a louder view — it is a
   different kind of statement, and the gap between them should be big
   enough that one paid project outweighs a handful of idle opens.
   Repeat views are capped: someone who leaves a tab open and returns to
   it nine times has not told us nine times more than someone who
   returned twice. */
const W_VIEW = 1;
const W_VIEW_CAP = 3;
const W_ENQUIRED = 4;
const W_PAID = 10;

export function weightFor(t: { views: number; paid: boolean; enquired: boolean }): number {
  return Math.min(t.views, W_VIEW_CAP) * W_VIEW
    + (t.enquired ? W_ENQUIRED : 0)
    + (t.paid ? W_PAID : 0);
}

/* ── Collapse the event stream into one row per project ───────────── */
export function touchedProjects(
  events: EventRow[],
  bySlug: Map<string, ProjectRow>,
): TouchedProject[] {
  const acc = new Map<string, TouchedProject>();

  for (const e of events) {
    const slug = e.project_slug;
    if (!slug) continue;
    const p = bySlug.get(slug);
    /* A slug with no matching project is not worth guessing from — it
       means the catalogue moved under us, and inventing attributes for
       it would poison every field below. */
    if (!p) continue;

    let t = acc.get(slug);
    if (!t) {
      t = {
        slug,
        name: p.name,
        microMarket: p.microMarket,
        minPriceCr: p.min_price_cr,
        bhk: p.min_bhk_num,
        views: 0,
        paid: false,
        enquired: false,
        weight: 0,
        lastAt: e.created_at,
      };
      acc.set(slug, t);
    }
    if (e.name === "report_viewed") t.views += 1;
    if (e.name === "payment_completed" || e.name === "report_unlocked") t.paid = true;
    if (e.name === "lead_captured") t.enquired = true;
    if (e.created_at > t.lastAt) t.lastAt = e.created_at;
  }

  const out = [...acc.values()];
  for (const t of out) t.weight = weightFor(t);
  out.sort((a, b) => b.weight - a.weight || (a.lastAt < b.lastAt ? 1 : -1));
  return out;
}

/* ── Corridor ─────────────────────────────────────────────────────── */
function inferCorridor(ts: TouchedProject[]): Guess<string[]> {
  const byMarket = new Map<string, { weight: number; projects: string[] }>();
  let total = 0;
  for (const t of ts) {
    if (!t.microMarket) continue;
    const m = byMarket.get(t.microMarket) ?? { weight: 0, projects: [] };
    m.weight += t.weight;
    m.projects.push(t.name);
    byMarket.set(t.microMarket, m);
    total += t.weight;
  }
  if (!total) return { value: null, evidence: "we've no signal on this", confidence: "none" };

  const ranked = [...byMarket.entries()].sort((a, b) => b[1].weight - a[1].weight);
  const [top] = ranked;
  const share = top[1].weight / total;

  /* One corridor that dominates is a claim worth making. Two that
     together dominate is the real shape of most Gurugram searches —
     people shortlist a corridor and its neighbour. Three or more is not
     a preference, it is browsing, and saying so is more useful than
     naming whichever happened to come first. */
  if (share >= 0.6) {
    const n = top[1].projects.length;
    return {
      value: [top[0]],
      evidence: n > 1 ? `${n} of the reports you opened are here` : `the report you've spent most on is here`,
      confidence: share >= 0.8 ? "strong" : "weak",
    };
  }
  if (ranked.length >= 2) {
    const two = ranked.slice(0, 2);
    const twoShare = (two[0][1].weight + two[1][1].weight) / total;
    if (twoShare >= 0.75) {
      return {
        value: [two[0][0], two[1][0]],
        evidence: `you've opened reports in both — ${two[0][1].projects.length} and ${two[1][1].projects.length}`,
        confidence: "weak",
      };
    }
  }
  return {
    value: null,
    evidence: `you've looked across ${byMarket.size} corridors — too spread to call`,
    confidence: "none",
  };
}

/* ── Budget ───────────────────────────────────────────────────────── */
/* Entry prices, weighted by engagement, then a band around the weighted
   median. A plain min-max is useless the moment someone glances at one
   cheap project: opening a ₹2 Cr report once and buying a ₹9.5 Cr one
   is a ₹9.5 Cr buyer, not a "₹2-9.5 Cr" one. */
export function weightedMedian(pairs: { v: number; w: number }[]): number | null {
  const xs = pairs.filter((p) => Number.isFinite(p.v) && p.w > 0).sort((a, b) => a.v - b.v);
  if (!xs.length) return null;
  const total = xs.reduce((s, p) => s + p.w, 0);
  let run = 0;
  for (const p of xs) {
    run += p.w;
    if (run >= total / 2) return p.v;
  }
  return xs[xs.length - 1].v;
}

/* Round to something a person would say out loud. Below ₹5 Cr people
   talk in quarter-crores; above it, halves. */
function roundCr(n: number): number {
  const step = n < 5 ? 0.25 : 0.5;
  return Math.round(n / step) * step;
}

function inferBudget(ts: TouchedProject[]): Guess<{ min: number; max: number }> {
  const pairs = ts
    .filter((t) => typeof t.minPriceCr === "number")
    .map((t) => ({ v: t.minPriceCr as number, w: t.weight }));
  if (!pairs.length) return { value: null, evidence: "we've no signal on this", confidence: "none" };

  const mid = weightedMedian(pairs);
  if (mid == null) return { value: null, evidence: "we've no signal on this", confidence: "none" };

  /* The band is the spread of what they actually looked at, clamped so a
     single project still yields a usable range rather than a point. */
  const near = pairs.filter((p) => p.v >= mid * 0.6 && p.v <= mid * 1.6);
  const lo = Math.min(...near.map((p) => p.v));
  const hi = Math.max(...near.map((p) => p.v));
  const min = roundCr(Math.min(lo, mid * 0.85));
  const max = roundCr(Math.max(hi, mid * 1.15));

  const paid = ts.find((t) => t.paid);
  const evidence = paid
    ? `the report you paid for starts at ₹${paid.minPriceCr} Cr`
    : `entry prices on the reports you opened`;
  return {
    value: { min, max },
    evidence,
    confidence: near.length >= 2 || paid ? "strong" : "weak",
  };
}

/* ── Configuration ────────────────────────────────────────────────── */
function inferConfig(ts: TouchedProject[]): Guess<string> {
  const byBhk = new Map<number, number>();
  let total = 0;
  for (const t of ts) {
    if (typeof t.bhk !== "number") continue;
    byBhk.set(t.bhk, (byBhk.get(t.bhk) ?? 0) + t.weight);
    total += t.weight;
  }
  if (!total) return { value: null, evidence: "we've no signal on this", confidence: "none" };

  const ranked = [...byBhk.entries()].sort((a, b) => b[1] - a[1]);
  const [bhk, w] = ranked[0];
  const share = w / total;
  const n = ts.filter((t) => t.bhk === bhk).length;

  if (share < 0.5) {
    return { value: null, evidence: `you've looked at ${byBhk.size} different sizes`, confidence: "none" };
  }
  return {
    value: `${bhk} BHK`,
    evidence: n === ts.length ? "every project you viewed" : `${n} of the ${ts.length} you viewed`,
    confidence: share >= 0.75 ? "strong" : "weak",
  };
}

/* ── The whole brief ──────────────────────────────────────────────── */
export function inferBrief(events: EventRow[], projects: ProjectRow[]): InferredBrief {
  const bySlug = new Map<string, ProjectRow>();
  for (const p of projects) bySlug.set(slugify(p.name), p);

  const ts = touchedProjects(events, bySlug);
  const enough = ts.length >= MIN_PROJECTS;

  /* Below the threshold the projects still come back — the caller may
     legitimately want to show "you've been reading X and Y" — but every
     inferred field stays empty. Half a guess is still a guess. */
  const none = <T,>(): Guess<T> => ({
    value: null,
    evidence: `read ${MIN_PROJECTS - ts.length} more report${MIN_PROJECTS - ts.length === 1 ? "" : "s"} and we can`,
    confidence: "none",
  });

  return {
    enough,
    reportsRead: ts.length,
    projects: ts,
    corridor: enough ? inferCorridor(ts) : none<string[]>(),
    budgetCr: enough ? inferBudget(ts) : none<{ min: number; max: number }>(),
    config: enough ? inferConfig(ts) : none<string>(),
    /* Nothing anyone does on the site reveals when they need possession.
       It is one of the two things worth asking outright, so it is
       modelled as a permanent unknown rather than left out — the UI
       should ask for it, not hide the field. */
    timeline: { value: null, evidence: "we've no signal on this", confidence: "none" },
  };
}
