"use client";

/* ════════════════════════════════════════════════════════════════
   LIVE PROJECT PROFILE — the instant-update overlay for an EXISTING
   (baked) report page.

   Renders the baked ProjectProfile immediately — SEO-complete, and the
   fallback — then on mount re-fetches the two backoffice-editable tables
   (project_extended_details + project_configurations), re-runs the EXACT
   same adapter (remoteMedia on, so a just-uploaded asset shows), and swaps
   in a fresh `p`. A floor plan, config, price band or asset date edited in
   the backoffice therefore appears on the next page view — no deploy.

   FAIL-SAFE: if the fetch returns nothing, resolves to no project, or
   throws, `p` stays the baked value and the page is exactly what the build
   shipped. The live layer can only ADD freshness, never break a page.

   No UI component is touched — this wraps ProjectProfile and changes only
   its data prop (founder working agreement).
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import ProjectProfile from "./ProjectProfile";
import { liveProjectIntel, matchKey } from "@/lib/reportAdapter";
import { fetchConfigsLive, fetchDeveloperFinancialsLive, fetchExtendedLive, resolveBacklogId } from "@/lib/supabaseBrowser";
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
      // assets/configs are keyed by backlog id; financials are the developer's,
      // read live from developer_health by name (same source as the dossier) so
      // a financials edit shows on the next view, like assets already do.
      const [ext, cfg, fin] = await Promise.all([
        fetchExtendedLive(ids),
        fetchConfigsLive(ids),
        row.developer ? fetchDeveloperFinancialsLive(row.developer) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      const eKey = matchKey(row.id, row.name, ext, null, alt);
      const cKey = matchKey(row.id, row.name, cfg, null, alt);
      // nothing resolved for THIS project — keep the baked page (fail-safe)
      if (!eKey && !cKey && !fin) return;
      // fresh developer ratios merged onto the row so the adapter recomputes the
      // Developer-DNA financial audit (and the financials anatomy) from live values.
      const freshRow = fin ? { ...row, ...fin } : row;
      const fresh = liveProjectIntel(
        freshRow,
        eKey ? ext![eKey] : null,
        cKey ? cfg![cKey] : null,
        corridorPsf,
        { remoteMedia: true },
      );
      // Developer dossier on the report: take the freshly-computed developer (so
      // its financial audit reflects the live ratios) but keep the server-grafted
      // ledger — the pure adapter can't produce it.
      const liveDeveloper = fresh.liveDeveloper
        ? { ...fresh.liveDeveloper, ...(baked.liveDeveloper?.ledger ? { ledger: baked.liveDeveloper.ledger } : {}) }
        : baked.liveDeveloper;
      // When the live asset tables resolved, take the whole fresh intel (media +
      // configs + financials). When ONLY financials resolved, refresh just the
      // financial-bearing fields so an unmatched asset fetch can't blank the
      // baked media/homes. `fresh` also lacks the server-only trackedRank /
      // livePillars, so spread baked first either way.
      const merged: ProjectIntel =
        eKey || cKey
          ? { ...baked, ...fresh, ...(liveDeveloper ? { liveDeveloper } : {}) }
          : { ...baked, anatomy: fresh.anatomy, ...(liveDeveloper ? { liveDeveloper } : {}) };
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
