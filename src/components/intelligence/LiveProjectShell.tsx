"use client";

/* ════════════════════════════════════════════════════════════════
   LIVE PROJECT SHELL — the instant page for a NEW project that is
   is_live='Yes' but not yet baked into a static file.

   nginx falls back to this page for any /projects/<slug> that has no
   baked HTML yet (see deploy/nginx.conf.template). It reads the REAL
   url the visitor asked for, resolves the slug against the live set
   (backlog_listing_public_v3, which already filters is_live='Yes'), and
   renders the project through the ORIGINAL ProjectProfile — remoteMedia
   on, so a just-uploaded hero/floor-plan shows. The next scheduled build
   promotes the project to a full static, sitemap-listed, indexable page.

   The reused fetchers run client-side on the network path (SUPABASE_FIXTURES
   is unset in the browser) — the same way ComparePage already reads Supabase.

   States other than "found" stay utilitarian (a line of text / a redirect),
   never a new report template — the report UI itself is ProjectProfile,
   untouched (founder working agreement).
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectProfile from "./ProjectProfile";
import { liveProjectIntel, matchKey } from "@/lib/reportAdapter";
import {
  fetchBacklogFull,
  fetchConfigurations,
  fetchBacklogNameIds,
  fetchCorridorPsf,
  fetchExtendedDetails,
} from "@/lib/supabase";
import type { ProjectIntel } from "@/lib/projects";
import { basePath } from "@/lib/site";

type Phase = "loading" | "found" | "notfound";

export default function LiveProjectShell() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [intel, setIntel] = useState<ProjectIntel | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // The real url nginx fell back from — /projects/<seoSlug> (any basePath
      // prefix is ignored by matching only the segment after /projects/).
      const m = window.location.pathname.match(/\/projects\/([^/]+)\/?$/);
      const slug = m?.[1] ?? "";
      if (!slug) {
        if (!cancelled) setPhase("notfound");
        return;
      }
      const [rows, ext, cfg, nameIds, corridorPsf] = await Promise.all([
        fetchBacklogFull(),
        fetchExtendedDetails(),
        fetchConfigurations(),
        fetchBacklogNameIds(),
        fetchCorridorPsf(),
      ]);
      const row = rows?.find((r) => r.seoSlug === slug);
      if (!row) {
        if (!cancelled) setPhase("notfound");
        return;
      }
      const eKey = matchKey(row.id, row.name, ext, nameIds, row.altIds);
      const cKey = matchKey(row.id, row.name, cfg, nameIds, row.altIds);
      const p = liveProjectIntel(
        row,
        eKey ? ext![eKey] : null,
        cKey ? cfg![cKey] : null,
        corridorPsf,
        { remoteMedia: true },
      );
      if (!cancelled) {
        setIntel(p);
        setPhase("found");
      }
    })().catch(() => {
      if (!cancelled) setPhase("notfound");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A genuinely unknown /projects/ slug is not a live project — send the
  // reader to the catalogue rather than sit on an empty shell.
  useEffect(() => {
    if (phase === "notfound") {
      const t = setTimeout(() => router.replace(`${basePath}/intelligence/projects`), 1500);
      return () => clearTimeout(t);
    }
  }, [phase, router]);

  if (phase === "found" && intel) return <ProjectProfile p={intel} />;

  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontFamily: "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif",
        color: "#1a1a1a",
        padding: 24,
        textAlign: "center",
      }}
    >
      {phase === "notfound" ? (
        <>
          <p style={{ fontSize: "1.05rem" }}>This report isn&rsquo;t available.</p>
          <a href={`${basePath}/intelligence/projects`} style={{ color: "#9a7a2e", fontWeight: 600 }}>
            Browse all projects →
          </a>
        </>
      ) : (
        <p style={{ fontSize: "1.05rem", opacity: 0.7 }}>Loading the latest report…</p>
      )}
    </main>
  );
}
