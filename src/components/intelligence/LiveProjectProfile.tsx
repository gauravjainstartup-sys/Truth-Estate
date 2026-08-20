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
   The live layer can only ADD freshness, never break a page. The rank ("N of
   M") recomputes from the live score against the baked comparison set; the
   developer's grafted ledger is carried over from the baked value.

   No UI component is touched — this wraps ProjectProfile and changes only
   its data prop (founder working agreement).
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import ProjectProfile from "./ProjectProfile";
import { liveProjectIntel, matchKey, latestWireUpdate } from "@/lib/reportAdapter";
import { fetchBacklogRowLive, fetchConfigsLive, fetchDeveloperFinancialsLive, fetchExtendedLive, fetchProjectWireLive, resolveBacklogId } from "@/lib/supabaseBrowser";
import { trackedRankOf, type ProjectIntel } from "@/lib/projects";
import type { CorridorPsf, LiveBacklogFull } from "@/lib/supabase";
import type { RelatedGroups } from "@/lib/relatedProjects";

export default function LiveProjectProfile({
  baked,
  row,
  corridorPsf,
  related,
  alternatives,
  liveScores,
}: {
  baked: ProjectIntel;
  row: LiveBacklogFull;
  corridorPsf: CorridorPsf | null;
  related?: RelatedGroups;
  alternatives?: ProjectIntel[];
  // Every live project's Truth Score (baked at build). The rank recomputes from
  // THIS project's live score against this set — with its own baked score swapped
  // for the live one — so the "ranks N of M" line matches the live score instead
  // of lagging to the next snapshot. The comparison set itself stays baked (it
  // only shifts when the whole corpus is re-scored, i.e. a publish).
  liveScores?: number[];
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
      const [rowLive, ext, cfg, fin, wireLive] = await Promise.all([
        fetchBacklogRowLive(row.id),
        fetchExtendedLive(ids),
        fetchConfigsLive(ids),
        row.developer ? fetchDeveloperFinancialsLive(row.developer) : Promise.resolve(null),
        /* News & Updates, scoped to this project. Without this the section was
           the one part of the report that could only change on a rebuild —
           every other field here already refreshes live, so news sat up to an
           hour behind its own "last updated" date. */
        fetchProjectWireLive(row.seoSlug || row.slug || ""),
      ]);
      if (cancelled) return;
      const eKey = matchKey(row.id, row.name, ext, null, alt);
      const cKey = matchKey(row.id, row.name, cfg, null, alt);
      // nothing resolved for THIS project — keep the baked page (fail-safe).
      // wireLive counts: a news-only change must still refresh the page, or the
      // section this whole path exists to unblock would stay stale.
      if (!eKey && !cKey && !fin && !rowLive && !wireLive) return;
      /* Fresh news when the scoped read resolved, baked otherwise — never an
         empty list, so a failed fetch can't blank a populated section. */
      const wireItems = wireLive ?? baked.wireItems;
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
        /* newsLatest from the LIVE wire items when they resolved, so the
           report's "last updated" date moves the moment new research
           publishes — and from the baked ones otherwise, which keeps the
           news contribution the build put there rather than dropping it. */
        { remoteMedia: true, newsLatest: latestWireUpdate(wireItems) },
      );
      // The Truth-Score pillar breakdown the adapter can't produce — fresh from
      // the live row, else the baked value.
      const livePillars = rowLive?.pillars ?? baked.livePillars;
      // Developer dossier on the report: take the freshly-computed developer (so
      // its track record + financial audit reflect live values) but keep the
      // server-grafted ledger — the pure adapter can't produce it.
      const liveDeveloper = fresh.liveDeveloper
        ? {
            ...fresh.liveDeveloper,
            ...(baked.liveDeveloper?.ledger ? { ledger: baked.liveDeveloper.ledger } : {}),
            // Avg slippage is computed from the filed ledger at build time (the
            // row's developer_avg_delay_months is stale/null); keep that baked
            // value while launched/delivered/on-time stay live from the row.
            ...(baked.liveDeveloper?.performance?.avgDelayMonths != null
              ? { performance: { ...fresh.liveDeveloper.performance, avgDelayMonths: baked.liveDeveloper.performance.avgDelayMonths } }
              : {}),
          }
        : baked.liveDeveloper;
      // "Ranks N of M" from the LIVE score. Swap this project's own baked score
      // in the comparison set for its live score (so a changed score never reads
      // "98 of 97"), then rank normally. The set is otherwise baked — it only
      // moves when the whole corpus is re-scored. Falls back to the baked rank if
      // the score didn't change or the set wasn't passed.
      const freshScore = freshRow.truthScore;
      let trackedRank = baked.trackedRank;
      if (liveScores?.length && freshScore != null && freshScore > 0 && freshScore !== row.truthScore) {
        const arr = [...liveScores];
        const i = row.truthScore != null ? arr.indexOf(row.truthScore) : -1;
        if (i >= 0) arr[i] = freshScore;
        else arr.push(freshScore);
        trackedRank = trackedRankOf(freshScore, arr) ?? baked.trackedRank;
      }
      // When the live asset tables resolved, take the whole fresh intel (media +
      // configs + row). When they DIDN'T, keep the baked asset-derived fields
      // (budget/configs/ops/psfOwn/sizeBand/tags) so an unmatched asset fetch
      // can't blank the media — but still apply every row-derived field. `fresh`
      // lacks the server-only trackedRank / livePillars, so set them explicitly.
      // wireItems is set explicitly on both branches: the adapter doesn't
      // produce it (the build grafts it on afterwards), so without this the
      // spread would silently keep the baked news next to a live date.
      let merged: ProjectIntel;
      if (eKey || cKey) {
        merged = { ...baked, ...fresh, ...(wireItems ? { wireItems } : {}), ...(livePillars ? { livePillars } : {}), ...(liveDeveloper ? { liveDeveloper } : {}), ...(trackedRank ? { trackedRank } : {}) };
      } else {
        const { budget, configs, ops, psfOwn, sizeBand, tags, ...rowDerived } = fresh;
        void budget; void configs; void ops; void psfOwn; void sizeBand; void tags;
        merged = { ...baked, ...rowDerived, ...(wireItems ? { wireItems } : {}), ...(livePillars ? { livePillars } : {}), ...(liveDeveloper ? { liveDeveloper } : {}), ...(trackedRank ? { trackedRank } : {}) };
      }
      if (!cancelled) setP(merged);
    })().catch(() => {
      /* any failure → keep the baked page */
    });
    return () => {
      cancelled = true;
    };
  }, [row, baked, corridorPsf, liveScores]);

  return <ProjectProfile p={p} related={related} alternatives={alternatives} />;
}
