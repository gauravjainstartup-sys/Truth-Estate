/* Build-emitted search index for the project-page palette: every live
   project file and developer dossier in ~14 KB. Static export writes
   this once per deploy; the palette fetches it on first open only.
   (Curated dossiers no longer exist as pages — the pipeline files ARE
   the project pages, so only live rows are indexed.) */
import { DEVELOPERS } from "@/lib/developers";
import { fetchBacklogFull, fetchDevelopersOverview } from "@/lib/supabase";

export const dynamic = "force-static";

type P = { n: string; s: string; m?: string; d?: string; ts?: number };
type D = { n: string; s: string; c?: number };

export async function GET() {
  const p: P[] = [];
  for (const r of (await fetchBacklogFull()) ?? []) {
    if (p.some((e) => e.s === r.slug)) continue;
    p.push({
      n: r.name,
      s: r.slug,
      ...(r.microMarket ?? r.location ? { m: (r.microMarket ?? r.location)! } : {}),
      ...(r.developer ? { d: r.developer } : {}),
      ...(r.truthScore != null ? { ts: r.truthScore } : {}),
    });
  }
  const d: D[] = DEVELOPERS.map((x) => ({ n: x.name, s: x.slug }));
  for (const r of (await fetchDevelopersOverview()) ?? []) {
    if (!r.slug || d.some((e) => e.s === r.slug)) continue;
    d.push({ n: r.name, s: r.slug, ...(r.total != null ? { c: r.total } : {}) });
  }
  return Response.json({ p, d });
}
