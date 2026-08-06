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
import { fetchConfigsLive, fetchExtendedLive, resolveBacklogId } from "@/lib/supabaseBrowser";
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
      const [ext, cfg] = await Promise.all([fetchExtendedLive(ids), fetchConfigsLive(ids)]);
      if (cancelled) return;
      const eKey = matchKey(row.id, row.name, ext, null, alt);
      const cKey = matchKey(row.id, row.name, cfg, null, alt);
      // nothing resolved for THIS project — keep the baked page (fail-safe)
      if (!eKey && !cKey) return;
      const fresh = liveProjectIntel(
        row,
        eKey ? ext![eKey] : null,
        cKey ? cfg![cKey] : null,
        corridorPsf,
        { remoteMedia: true },
      );
      // Carry the server-only extras the pure adapter doesn't produce: the
      // tracked rank and truth-score pillars (spread from baked, since `fresh`
      // has no such keys), and the developer's grafted ledger (baked's
      // liveDeveloper is built from the same row and already carries it).
      const merged: ProjectIntel = { ...baked, ...fresh, liveDeveloper: baked.liveDeveloper ?? fresh.liveDeveloper };
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
