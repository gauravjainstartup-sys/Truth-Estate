"use client";

import { useEffect, useState } from "react";
import { PROJECTS } from "./journey";
import { projectByName, type ProjectIntel } from "./projects";

/* ════════════════════════════════════════════════════════════════
   LIVE MATCH CATALOG — the client-side hook the shortlist ranks against.

   Fetches match-catalog.json (baked at build from backlog_listing_public)
   once and hands back the live ProjectIntel set. Returns null until the
   fetch settles so the caller can hold render — no flash of the mock set,
   no empty-state flicker for a real buyer. If the file is missing or empty
   (offline build, dev server, or a stale deploy) it falls back to the mock
   catalog resolved to ProjectIntel, so the shortlist behaves exactly as it
   did before live data existed. Same static, zero-egress pattern the maps
   use for projects-geo.json.
   ════════════════════════════════════════════════════════════════ */

const basePath = "/Truth-Estate";

/* The mock PROJECTS, resolved to their enriched ProjectIntel — the fallback
   whenever the baked catalog can't be fetched or comes back empty. */
const MOCK_INTEL: ProjectIntel[] = PROJECTS.map((p) => projectByName(p.name)).filter(
  (p): p is ProjectIntel => Boolean(p),
);

export function useMatchCatalog(): ProjectIntel[] | null {
  const [catalog, setCatalog] = useState<ProjectIntel[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${basePath}/match-catalog.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { projects?: ProjectIntel[] }) => {
        if (!alive) return;
        const live = Array.isArray(data.projects) ? data.projects : [];
        setCatalog(live.length ? live : MOCK_INTEL);
      })
      .catch(() => {
        if (alive) setCatalog(MOCK_INTEL);
      });
    return () => {
      alive = false;
    };
  }, []);

  return catalog;
}
