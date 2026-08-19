/* Build-emitted per-section report dates: the raw DB "last updated" date for
   each of a report's four dated sections, published as a static file the
   Office fetches client-side to drive the "See new update" badge.

   One row per published project, keyed by the SAME public seoSlug the report
   pages and links use. Emits ISO date strings (or null). Refreshed on every
   deploy, like /omni-index.json and /search-index.json — and built from the
   same backlog fetch, so it works under SUPABASE_FIXTURES.

   The four dates mirror exactly what liveReport.ts folds into the report's
   own "last updated": legal = legal_health.retrieval_date · construction =
   last_updated_qpr_date · location = location_last_updated_date · hero =
   project_extended_details.hero_date. */
import { fetchBacklogFull, fetchExtendedDetails, fetchBacklogNameIds, fetchProjectWire, type LiveExtendedDetails } from "@/lib/supabase";
import { newestWireEventDate } from "@/lib/reportAdapter";

export const dynamic = "force-static";

type SectionDates = { legal: string | null; construction: string | null; location: string | null; hero: string | null; news: string | null };

/* legal_health.retrieval_date lives inside the backlog_project_data JSON that
   fetchBacklogFull already joins onto the row as `legalHealth` (unknown). */
function legalRetrievalDate(legalHealth: unknown): string | null {
  if (!legalHealth || typeof legalHealth !== "object" || Array.isArray(legalHealth)) return null;
  const o = legalHealth as Record<string, unknown>;
  for (const k of ["retrieval_date", "retrievalDate", "as_of"]) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/* The extended-details table keys on backlog_projects.id; join on the row id,
   then any collapsed sibling id, then bridge through the project name — the
   same id-drift tolerance the report page and the live catalog use. */
function extKeyFor(
  id: string,
  name: string,
  ext: Record<string, LiveExtendedDetails> | null,
  nameIds: Record<string, string> | null,
  altIds: string[] = [],
): string | null {
  if (!ext) return null;
  if (ext[id] !== undefined) return id;
  for (const a of altIds) if (ext[a] !== undefined) return a;
  const alt = nameIds?.[name];
  return alt && ext[alt] !== undefined ? alt : null;
}

export async function GET() {
  const [rows, ext, nameIds] = await Promise.all([fetchBacklogFull(), fetchExtendedDetails(), fetchBacklogNameIds()]);
  const out: Record<string, SectionDates> = {};
  for (const r of rows ?? []) {
    if (!r.seoSlug) continue;
    const eKey = extKeyFor(r.id, r.name, ext, nameIds, r.altIds);
    const hero = eKey && ext ? ext[eKey]?.heroDate ?? null : null;
    out[r.seoSlug] = {
      legal: legalRetrievalDate(r.legalHealth) ?? r.legalLastUpdated ?? null,
      construction: r.lastQprDate ?? null,
      location: r.locationLastUpdated ?? null,
      hero,
      /* Newest News & Updates event, through the same exact-slug matcher the
         report itself uses — a fresh dispatch flips the Office badge. */
      news: newestWireEventDate(await fetchProjectWire(r.seoSlug)),
    };
  }
  return Response.json(out);
}
