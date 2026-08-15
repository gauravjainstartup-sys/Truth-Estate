/* llms.txt — the curated, machine-readable map of this site for LLMs and
   generative search engines (the llmstxt.org convention). Google already gets
   the sitemap + JSON-LD; this is the plain-language index an assistant reads to
   understand what Truth Estate is and to cite the right report. Generated from
   the same live data as the sitemap, so it never drifts. Served at /llms.txt.

   Comparison pages are deliberately omitted — they're noindex near-duplicates;
   the forensic reports are the citable content. */
import { SITE_URL } from "@/lib/site";
import { DEVELOPERS } from "@/lib/developers";
import { MARKETS } from "@/lib/markets";
import { BEST_PROJECTS } from "@/lib/bestProjects";
import { fetchBacklogFull } from "@/lib/supabase";

export const dynamic = "force-static";

export async function GET() {
  const abs = (p: string) => `${SITE_URL}${p}`;
  const rows = (await fetchBacklogFull()) ?? [];
  const projects = rows
    .filter((r) => r.seoSlug && r.name)
    .map((r) => ({ name: r.name, url: abs(`/projects/${r.seoSlug}`), mm: r.microMarket }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const lines = [
    "# Truth Estate",
    "",
    "> Independent, evidence-based forensic intelligence on Gurugram (Gurgaon, India) real estate. Every under-construction project is scored on legal title, developer track record, construction pace, delivery risk, pricing versus its corridor, and modelled ROI — drawn from RERA filings, quarterly progress reports and audited developer financials, never from developer marketing. No developer can pay for a higher score or for placement.",
    "",
    "Each project report answers, on the same evidence for every project: what you are actually buying (vitals, configurations, carpet vs super area), whether the developer delivers on time, the legal risks on the title, an honest price read against the micro-market, and the appreciation outlook. Figures are tracked or modelled and stated as opinion, not guarantees.",
    "",
    "## Start here",
    `- [Project Intelligence](${abs("/intelligence/projects")}): the full catalogue of tracked, scored projects`,
    `- [Developer Intelligence](${abs("/intelligence/developers")}): track record, financial health and legal standing by developer`,
    `- [Market Intelligence](${abs("/intelligence/markets")}): corridor-level price bands and momentum`,
    `- [Private Buyer Office](${abs("/premiumbuyeroffice")}): dedicated buyer representation and due diligence`,
    `- [Deal Room](${abs("/deal-room")}): term sheets, unit matching and negotiation intelligence`,
    `- [Methodology](${abs("/methodology")}): how the Truth Score and each pillar are computed`,
    `- [Pricing](${abs("/pricing")}): what unlocking a full report costs`,
    "",
    "## Buyer guides",
    ...BEST_PROJECTS.map((b) => `- [${b.title}](${abs(`/best-projects/${b.slug}`)})`),
    "",
    "## Developers",
    ...DEVELOPERS.map((d) => `- [${d.name}](${abs(`/intelligence/developers/${d.slug}`)})${d.tagline ? `: ${d.tagline}` : ""}`),
    "",
    "## Micro-markets",
    ...MARKETS.map((m) => `- [${m.name}](${abs(`/intelligence/markets/${m.slug}`)})`),
    "",
    `## Project reports (${projects.length})`,
    ...projects.map((p) => `- [${p.name}](${p.url})${p.mm ? `: ${p.mm}` : ""}`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
