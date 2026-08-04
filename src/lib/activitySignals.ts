/* ════════════════════════════════════════════════════════════════
   ACTIVITY SIGNALS — the implicit requirements.

   The brief is what the buyer TOLD us. This is what they SHOW us: the
   corridors they open, the developer they keep returning to, the price
   band and size they gravitate to, the quality floor they never drop
   below, how close to possession the projects they read are.

   None of it is stated. Every signal is read from THIS account's own
   activity — the same inference trail the dashboard's brief already uses
   (loadBuyerBrief → the /brief function, keyed on the visitor's anon id)
   — joined to the baked catalogue for the two attributes the trail does
   not carry: developer and possession date.

   An adapter in the AGENTS.md sense: it shapes DATA to fit the existing
   office, renders nothing, and only ever claims what the activity
   supports. Two honesty rules, inherited from buyerBrief/fit:

     · a signal appears only when the activity genuinely supports it —
       one glance at one report is not a leaning;
     · a signal is PROMOTABLE only when adding it changes a real brief
       field the recommendation engine actually reads (corridor, budget,
       configuration — see matchScoreFor/rankProjects). Developer, the
       quality bar and urgency are surfaced as context; we never ship a
       control that would look like it sharpens recommendations without
       doing so.
   ════════════════════════════════════════════════════════════════ */
import { basePath } from "@/lib/site";
import { loadBuyerBrief, type BriefProject } from "@/lib/buyerBrief";
import { LOCATIONS, type BuyData } from "@/lib/journey";
import { listOwned } from "@/lib/officeReports";

/* Which BuyData field a promotable signal writes. Only these three move a
   recommendation, so only these three ever carry a `promote`. */
export type ActivitySignal = {
  key: string;
  value: string;      // the headline, e.g. "Dwarka Expressway"
  evidence: string;   // the checkable reason, in words the buyer can verify
  disagrees?: boolean;// their behaviour contradicts their stated brief
  promote?: Partial<BuyData>; // present ⇒ actionable (＋ Add)
};

export type ActivityNudge = {
  message: string;    // full sentence: behaviour vs stated brief
  addLabel: string;   // "Add Dwarka Expressway →"
  patch: Partial<BuyData>;
};

export type ActivitySignals = {
  /* Enough activity to say anything at all. False ⇒ the section shows its
     quiet "as you browse, we'll learn" placeholder rather than guesses. */
  ready: boolean;
  reportsRead: number;
  signals: ActivitySignal[];
  nudge: ActivityNudge | null;
  mostAttention: { name: string; note: string } | null;
};

/* ── Catalogue enrichment ─────────────────────────────────────────────
   match-catalog.json is the baked live universe (buildLiveCatalog). The
   trail gives us market/price/bhk/truthScore per project; the catalogue
   adds the two it doesn't — developer and the RERA possession date — keyed
   on the SAME slug (slugify(name), verified byte-identical to the event
   slug). Fetched once, cached; an unreachable file simply drops the two
   catalogue-only signals and leaves the rest intact. */
type Lite = {
  developer: string | null;
  corridor: string | null;      // resolved to a LOCATIONS entry
  possessionAt: number | null;  // ms epoch of the committed handover
  delivered: boolean;
};

type CatalogRow = {
  name?: string;
  slug?: string;
  developer?: string | null;
  marketShort?: string | null;
  market?: string | null;
  ops?: { possession?: string | null; lifecycle?: string | null } | null;
};

/* marketShort → the corridor vocabulary the brief and the match engine
   speak. Inverse of MARKET_SHORT in journey.ts, plus the two live-catalogue
   shorts the mock set never had (NH-8 Corridor, Sohna Road). */
const SHORT_TO_CORRIDOR: Record<string, string> = {
  GCE: "Golf Course Extension",
  GCR: "Golf Course Road",
  SPR: "SPR",
  "Dwarka Expy": "Dwarka Expressway",
  "New Gurgaon": "New Gurgaon",
  Sohna: "Sohna",
  "Sohna Road": "Sohna Road",
  "NH-8 Corridor": "NH-48",
  Noida: "Noida",
};

/* Fall back to matching a free-text market string against the vocabulary on
   significant words — "Southern Peripheral Road (SPR Corridor)" → "SPR" —
   the same idea fit.ts uses so a real corridor never reads as unknown. */
function corridorFromText(s: string | null | undefined): string | null {
  if (!s) return null;
  const norm = (x: string) =>
    x.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/)
      .filter((w) => w.length > 2 && !["the", "road", "corridor", "extension", "sector"].includes(w));
  const want = new Set(norm(s));
  for (const loc of LOCATIONS) {
    if (norm(loc).some((w) => want.has(w))) return loc;
  }
  return null;
}

function parsePossession(s: string | null | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s); // "31 Mar 2030" parses natively
  return Number.isFinite(t) ? t : null;
}

let _cat: Map<string, Lite> | null = null;
let _catInflight: Promise<Map<string, Lite>> | null = null;
async function catalog(): Promise<Map<string, Lite>> {
  if (_cat) return _cat;
  if (typeof window === "undefined") return new Map();
  if (_catInflight) return _catInflight;
  _catInflight = fetch(`${basePath}/match-catalog.json`)
    .then((r) => (r.ok ? r.json() : { projects: [] }))
    .then((j: { projects?: CatalogRow[] }) => {
      const map = new Map<string, Lite>();
      for (const p of j.projects ?? []) {
        if (!p.slug) continue;
        map.set(p.slug, {
          developer: p.developer ?? null,
          corridor: SHORT_TO_CORRIDOR[p.marketShort ?? ""] ?? corridorFromText(p.market),
          possessionAt: parsePossession(p.ops?.possession),
          delivered: (p.ops?.lifecycle ?? "") === "delivered",
        });
      }
      _cat = map;
      return map;
    })
    .catch(() => (_cat = new Map()));
  return _catInflight;
}

/* ── Weighting ────────────────────────────────────────────────────────
   The same shape the brief's own inference uses: a purchase is a different
   kind of statement from a glance, and repeat views are capped so a tab
   left open nine times doesn't shout down a considered second read. */
type Touched = BriefProject & { w: number; cat: Lite | null; owned: boolean };

/* One weight scale, matching the server's /brief inference: a booked
   consultation (12) outranks a purchase (10), a self-declared ownership is
   as strong (10), a plain enquiry is 4, and repeat views cap at 3 so a tab
   left open nine times can't shout down a considered second read. */
function weight(p: BriefProject, owned: boolean): number {
  return Math.min(p.views, 3)
    + (p.consulted ? 12 : 0)
    + (p.paid ? 10 : 0)
    + (owned ? 10 : 0)
    + (p.enquired ? 4 : 0);
}

function weightedMedian(pairs: { v: number; w: number }[]): number | null {
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

const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))];

/* corridor A ≈ corridor B on significant words (GCE vs "Golf Course Ext"). */
function sameCorridor(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/)
      .filter((w) => w.length > 2 && !["the", "road", "corridor", "extension", "sector"].includes(w));
  const set = new Set(norm(a));
  return norm(b).some((w) => set.has(w));
}

/* ── Signals ──────────────────────────────────────────────────────────
   Each helper returns a signal only when the activity earns it. */

function marketSignal(ts: Touched[], stated: string[]): { signal: ActivitySignal | null; nudge: ActivityNudge | null } {
  const by = new Map<string, { w: number; n: number }>();
  for (const t of ts) {
    const c = t.cat?.corridor ?? corridorFromText(t.microMarket);
    if (!c) continue;
    const e = by.get(c) ?? { w: 0, n: 0 };
    e.w += t.w; e.n += 1;
    by.set(c, e);
  }
  if (!by.size) return { signal: null, nudge: null };
  const [corridor, top] = [...by.entries()].sort((a, b) => b[1].w - a[1].w)[0];
  const inStated = stated.some((s) => sameCorridor(s, corridor));
  const promote = inStated ? undefined : { locations: uniq([...stated, corridor]) };
  const disagrees = !inStated && stated.length > 0;

  const signal: ActivitySignal = {
    key: "market",
    value: corridor,
    evidence: `${top.n} report${top.n === 1 ? "" : "s"} opened${disagrees ? " · not in your stated markets" : inStated ? " · matches your brief" : ""}`,
    disagrees,
    promote,
  };

  const nudge: ActivityNudge | null = disagrees
    ? {
        message: `You've opened ${top.n} report${top.n === 1 ? "" : "s"} on ${corridor}, but your brief lists ${stated.join(" & ")}. Want us to widen your markets to match what you're actually reading?`,
        addLabel: `Add ${corridor} →`,
        patch: { locations: uniq([...stated, corridor]) },
      }
    : null;

  return { signal, nudge };
}

function developerSignal(ts: Touched[]): ActivitySignal | null {
  const by = new Map<string, number>();
  for (const t of ts) {
    const d = t.cat?.developer;
    if (!d) continue;
    by.set(d, (by.get(d) ?? 0) + 1);
  }
  if (!by.size) return null;
  const [dev, n] = [...by.entries()].sort((a, b) => b[1] - a[1])[0];
  if (n < 2) return null; // one project by a developer is not "returning to" them
  return { key: "developer", value: dev, evidence: `${n} of their projects viewed` };
}

function priceSignal(ts: Touched[], stated: BuyData): ActivitySignal | null {
  const priced = ts.filter((t) => typeof t.minPriceCr === "number") as (Touched & { minPriceCr: number })[];
  if (priced.length < 2) return null;
  const mid = weightedMedian(priced.map((t) => ({ v: t.minPriceCr, w: t.w })));
  if (mid == null) return null;
  /* Spread-guard, matching the server: with no strong anchor (purchase,
     consultation, or declared ownership), if under half the weighted reading
     clusters near the median there is no price band to name — don't show one.
     An anchor's own weight dominates the median, so we trust it and skip. */
  const anchored = priced.some((t) => t.paid || t.consulted || t.owned);
  if (!anchored) {
    const total = priced.reduce((s, t) => s + t.w, 0);
    const nearMid = priced
      .filter((t) => t.minPriceCr >= mid * 0.7 && t.minPriceCr <= mid * 1.3)
      .reduce((s, t) => s + t.w, 0);
    if (total > 0 && nearMid / total < 0.5) return null;
  }
  const lo = Math.floor(mid);
  const hi = lo + 1;
  const budgetCr = Math.round(mid);
  /* A stated brief they never touched (default 6) is not a claim. */
  const statedTouched = stated.locations.length > 0 || stated.configs.length > 0 || stated.priorities.length > 0;
  /* Already covered by the stated budget ⇒ nothing to add; surface as context,
     the same way markets/config de-dup once they're in the brief. */
  const inBand = statedTouched && stated.budgetCr >= lo && stated.budgetCr <= hi;
  const disagrees = statedTouched && !inBand && Math.abs(stated.budgetCr - mid) >= 1.5;
  return {
    key: "price",
    value: `₹${lo}–${hi} Cr`,
    evidence: inBand ? "your most-viewed band · matches your brief" : "your most-viewed price band",
    disagrees,
    promote: inBand ? undefined : { budgetCr },
  };
}

function configSignal(ts: Touched[], stated: BuyData): ActivitySignal | null {
  const by = new Map<number, number>();
  let total = 0;
  for (const t of ts) {
    if (typeof t.bhk !== "number") continue;
    by.set(t.bhk, (by.get(t.bhk) ?? 0) + t.w);
    total += t.w;
  }
  if (!total) return null;
  const [bhk, w] = [...by.entries()].sort((a, b) => b[1] - a[1])[0];
  const n = ts.filter((t) => t.bhk === bhk).length;
  /* Two gates, like the brief's config inference: it must dominate AND
     recur. "Leaning 4 BHK — 1 of the 3 you viewed" refutes itself. */
  if (w / total < 0.5 || n < 2) return null;
  const size = `${bhk} BHK`;
  /* Already in the stated brief ⇒ nothing to add; surface it as context. */
  const have = stated.configs.some((c) => c.includes(size));
  return {
    key: "config",
    value: `Leaning ${size}`,
    evidence: `${n} of ${ts.length} reports opened were ${size}`,
    /* Add ALONGSIDE what they stated — a lean towards 4 BHK doesn't mean
       they've stopped wanting the 3 BHK they told us about. */
    promote: have ? undefined : { configs: uniq([...stated.configs, size]) },
  };
}

function qualitySignal(ts: Touched[]): ActivitySignal | null {
  const scores = ts.map((t) => t.truthScore).filter((s): s is number => typeof s === "number");
  if (scores.length < 3) return null;
  const floor = Math.min(...scores);
  /* Only a claim if they CONSISTENTLY stay high — a floor in the 70s+ that
     they never drop below. Otherwise there is no bar to speak of. */
  if (floor < 75) return null;
  const bar = Math.floor(floor / 2) * 2; // round down to an even, sayable number
  return { key: "quality", value: `Truth Score ${bar}+`, evidence: "you rarely open lower-scored projects" };
}

function urgencySignal(ts: Touched[]): ActivitySignal | null {
  const dated = ts.filter((t) => t.cat && (t.cat.delivered || t.cat.possessionAt != null));
  if (dated.length < 2) return null;
  /* "Near possession" = committed handover within ~18 months, or already
     delivered. On a market of under-construction homes, a lean towards the
     near-ready end is a real preference worth surfacing. */
  const horizon = Date.now() + 18 * 30 * 24 * 60 * 60 * 1000;
  const near = dated.filter((t) => t.cat!.delivered || (t.cat!.possessionAt != null && t.cat!.possessionAt <= horizon));
  if (near.length / dated.length < 0.5) return null;
  return {
    key: "urgency",
    value: "Ready-to-move leaning",
    evidence: `${near.length} of your ${dated.length} recent views are near-possession`,
  };
}

function attention(ts: Touched[]): { name: string; note: string } | null {
  const top = ts[0]; // ts is weight-sorted
  if (!top) return null;
  const note = top.consulted
    ? "you booked a consultation"
    : top.paid
      ? "unlocked"
      : top.owned
        ? "in your portfolio"
        : top.enquired
          ? `opened ${top.views} time${top.views === 1 ? "" : "s"}, enquired`
          : `opened ${top.views} time${top.views === 1 ? "" : "s"}`;
  return { name: top.name, note };
}

/* ── The block ────────────────────────────────────────────────────────
   `stated` is the buyer's own brief (locations/budget/configs), read by the
   caller so the same basis drives both the disagreement flags and the
   promotions. Returns ready:false when the trail is too thin to say
   anything — the section then invites activity rather than inventing a read. */
export async function loadActivitySignals(stated: BuyData): Promise<ActivitySignals> {
  const empty: ActivitySignals = { ready: false, reportsRead: 0, signals: [], nudge: null, mostAttention: null };
  try {
    const [brief, cat] = await Promise.all([loadBuyerBrief(), catalog()]);
    const ownedSlugs = new Set(listOwned().map((o) => o.slug));
    const ts: Touched[] = brief.projects
      .map((p) => ({ ...p, w: weight(p, ownedSlugs.has(p.slug)), cat: cat.get(p.slug) ?? null, owned: ownedSlugs.has(p.slug) }))
      .sort((a, b) => b.w - a.w || (a.lastAt < b.lastAt ? 1 : -1));

    if (ts.length < 2) return { ...empty, reportsRead: ts.length };

    const market = marketSignal(ts, stated.locations);
    const signals = [
      market.signal,
      developerSignal(ts),
      priceSignal(ts, stated),
      configSignal(ts, stated),
      qualitySignal(ts),
      urgencySignal(ts),
    ].filter((s): s is ActivitySignal => s != null);

    return {
      ready: signals.length > 0,
      reportsRead: ts.length,
      signals,
      nudge: market.nudge,
      mostAttention: attention(ts),
    };
  } catch {
    return empty;
  }
}
