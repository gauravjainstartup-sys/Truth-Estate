"use client";

/* ════════════════════════════════════════════════════════════════
   LIVE PROJECT PROFILE — the instant-update overlay for an EXISTING
   (baked) report page.

   Renders the baked ProjectProfile immediately — SEO-complete, and the
   fallback — then on mount re-fetches the WHOLE report live and swaps in a
   fresh `p`. Anything edited in the backoffice, or recomputed by the pipeline,
   shows on the next page view — no deploy. Sources re-read:
     · backlog_listing_public_v3 + backlog_project_data (the whole row: Truth
       Score, developer track record, legal, ROI, location, USPs, financials,
       and the Truth-Score pillar breakdown) — via fetchBacklogRowLive
     · project_extended_details + project_configurations (media, price/area
       bands, unit configs, floor plans) — remoteMedia on, so a just-uploaded
       asset shows
     · developer_health (the developer's audited financial ratios — the same
       table the dossier reads; overlaid last so a direct financials edit wins)
   All re-run through the EXACT same adapter the build uses.

   FAIL-SAFE: if a fetch returns nothing, resolves to no project, or throws,
   `p` stays the baked value and the page is exactly what the build shipped.
   The live layer can only ADD freshness, never break a page. Cross-project
   aggregates the adapter can't produce alone (trackedRank; the developer's
   grafted ledger) are carried over from the baked value.

   No UI component is touched — this wraps ProjectProfile and changes only
   its data prop (founder working agreement).
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import ProjectProfile from "./ProjectProfile";
import { liveProjectIntel, matchKey } from "@/lib/reportAdapter";
import { fetchBacklogRowLive, fetchConfigsLive, fetchDeveloperFinancialsLive, fetchExtendedLive, resolveBacklogId } from "@/lib/supabaseBrowser";
import type { ProjectIntel } from "@/lib/projects";
import type { CorridorPsf, LiveBacklogFull } from "@/lib/supabase";
import type { RelatedGroups } from "@/lib/relatedProjects";

export default function LiveProjectProfile({
  baked,
  row,
  corridorPsf,
  related,
  alternatives,
}: {
  baked: ProjectIntel;
  row: LiveBacklogFull;
  corridorPsf: CorridorPsf | null;
  related?: RelatedGroups;
  alternatives?: ProjectIntel[];
}) {
  const [p, setP] = useState<ProjectIntel>(baked);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // ext/configs are keyed by backlog_projects.id, which is NOT the listing
      // view's id — resolve by name first, then fall back to the row's own id
      // and any absorbed duplicate ids (mirrors the build's lookupKey).
      const bridge = await resolveBacklogId(row.name);
      const alt = [...(row.altIds ?? []), ...(bridge ? [bridge] : [])];
      const ids = [...new Set([row.id, ...alt])].filter(Boolean) as string[];
      // The whole row (v3 + backlog_project_data) is keyed by the listing id;
      // assets/configs by backlog id (name-bridged above); financials by the
      // developer's name. Fetch all in parallel.
      const [rowLive, ext, cfg, fin] = await Promise.all([
        fetchBacklogRowLive(row.id),
        fetchExtendedLive(ids),
        fetchConfigsLive(ids),
        row.developer ? fetchDeveloperFinancialsLive(row.developer) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      const eKey = matchKey(row.id, row.name, ext, null, alt);
      const cKey = matchKey(row.id, row.name, cfg, null, alt);
      // nothing resolved for THIS project — keep the baked page (fail-safe)
      if (!eKey && !cKey && !fin && !rowLive) return;
      // Compose the freshest inputs onto the baked row: the whole live row first,
      // then developer_health financials LAST so a direct edit to that table wins
      // over the row's (possibly pipeline-lagged) copy of the same five ratios.
      // Identity fields (id/slug/seoSlug/name) are not in rowLive.fields, so the
      // URL/name never move.
      const freshRow: LiveBacklogFull = { ...row, ...(rowLive?.fields ?? {}), ...(fin ?? {}) };
      const fresh = liveProjectIntel(
        freshRow,
        eKey ? ext![eKey] : null,
        cKey ? cfg![cKey] : null,
        corridorPsf,
        { remoteMedia: true },
      );
      // The Truth-Score pillar breakdown the adapter can't produce — fresh from
      // the live row, else the baked value.
      const livePillars = rowLive?.pillars ?? baked.livePillars;
      // Developer dossier on the report: take the freshly-computed developer (so
      // its track record + financial audit reflect live values) but keep the
      // server-grafted ledger — the pure adapter can't produce it.
      const liveDeveloper = fresh.liveDeveloper
        ? { ...fresh.liveDeveloper, ...(baked.liveDeveloper?.ledger ? { ledger: baked.liveDeveloper.ledger } : {}) }
        : baked.liveDeveloper;
      // When the live asset tables resolved, take the whole fresh intel (media +
      // configs + row). When they DIDN'T, keep the baked asset-derived fields
      // (budget/configs/ops/psfOwn/sizeBand/tags) so an unmatched asset fetch
      // can't blank the media — but still apply every row-derived field. `fresh`
      // lacks the server-only trackedRank, so spreading baked first preserves it.
      let merged: ProjectIntel;
      if (eKey || cKey) {
        merged = { ...baked, ...fresh, ...(livePillars ? { livePillars } : {}), ...(liveDeveloper ? { liveDeveloper } : {}) };
      } else {
        const { budget, configs, ops, psfOwn, sizeBand, tags, ...rowDerived } = fresh;
        void budget; void configs; void ops; void psfOwn; void sizeBand; void tags;
        merged = { ...baked, ...rowDerived, ...(livePillars ? { livePillars } : {}), ...(liveDeveloper ? { liveDeveloper } : {}) };
      }
      if (!cancelled) setP(merged);
    })().catch(() => {
      /* any failure → keep the baked page */
    });
    return () => {
      cancelled = true;
    };
  }, [row, baked, corridorPsf]);

  return <ProjectProfile p={p} related={related} alternatives={alternatives} />;
}
