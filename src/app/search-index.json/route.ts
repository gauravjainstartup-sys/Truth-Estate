/* Build-emitted search index for the project-page palette: every live
   project file and developer dossier in ~14 KB. Static export writes
   this once per deploy; the palette fetches it on first open only.
   (Curated dossiers no longer exist as pages — the pipeline files ARE
   the project pages, so only live rows are indexed.) */
import { DEVELOPERS } from "@/lib/developers";
import { MARKETS } from "@/lib/markets";
import { corridorKey } from "@/lib/journey";
import { fetchBacklogFull, fetchDevelopersOverview } from "@/lib/supabase";

export const dynamic = "force-static";

/* `q` is the report's public address. Without it the palette built
   /intelligence/projects/<slug> — the legacy redirect stub — so every
   search result took an extra hop through a noindex page. Same omission
   the project cards had. */
type P = { n: string; s: string; q?: string; m?: string; d?: string; ts?: number };
type D = { n: string; s: string; c?: number };
/* corridor: name, slug, short code (SPR/GCE/GCR — what buyers actually
   type), and the count of projects we track there. */
type C = { n: string; s: string; k?: string; c?: number };

export async function GET() {
  const p: P[] = [];
  /* corridor tallies, keyed the same way the reports resolve a corridor
     (corridorKey), so "Golf Course Road Extension (GCRE)" and "Golf Course
     Extension" land on one entry rather than two near-misses. */
  const byCorridor = new Map<string, number>();
  for (const r of (await fetchBacklogFull()) ?? []) {
    if (p.some((e) => e.s === r.slug)) continue;
    const mkt = r.microMarket ?? r.location;
    if (mkt) {
      const k = corridorKey(mkt);
      byCorridor.set(k, (byCorridor.get(k) ?? 0) + 1);
    }
    p.push({
      n: r.name,
      s: r.slug,
      ...(r.seoSlug ? { q: r.seoSlug } : {}),
      ...(r.microMarket ?? r.location ? { m: (r.microMarket ?? r.location)! } : {}),
      ...(r.developer ? { d: r.developer } : {}),
      ...(r.truthScore != null ? { ts: r.truthScore } : {}),
    });
  }
  /* Only surface developers that actually have a dossier PAGE. Pages are
     generated from resolveDevelopers() (curated + filings, deduped by name,
     zero-project developers dropped); if this index lists a developer that
     resolver skips, the search result 404s. Mirror the two skips here:
     dedup filed rows against a curated NAME (not just slug — "Birla Estates"
     is curated as slug "birla" but filed as "birla-estates"), and drop
     developers with no filed projects. */
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const curatedNames = new Set(DEVELOPERS.map((x) => norm(x.name)));
  const d: D[] = DEVELOPERS.map((x) => ({ n: x.name, s: x.slug }));
  for (const r of (await fetchDevelopersOverview()) ?? []) {
    if (!r.slug || (r.total ?? 0) < 1) continue;
    if (d.some((e) => e.s === r.slug) || curatedNames.has(norm(r.name))) continue;
    d.push({ n: r.name, s: r.slug, ...(r.total != null ? { c: r.total } : {}) });
  }
  /* Corridors, same contract as developers: only entries with a real page
     (MARKETS drives generateStaticParams for /intelligence/markets/[slug])
     and at least one tracked project, so a hit is never a dead end. The
     count is OUR tracked number, not the registry's market-wide figure. */
  const c: C[] = [];
  for (const m of MARKETS) {
    const n = byCorridor.get(corridorKey(m.name)) ?? 0;
    if (n < 1) continue;
    c.push({ n: m.name, s: m.slug, ...(m.short && m.short !== m.name ? { k: m.short } : {}), c: n });
  }
  return Response.json({ p, d, c });
}
