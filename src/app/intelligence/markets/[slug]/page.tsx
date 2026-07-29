import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MARKETS, marketBySlug } from "@/lib/markets";
import { resolveMarketBySlug } from "@/lib/marketsLive";
import { buildIndex } from "@/lib/omniIndex";
import MarketProfile from "@/components/intelligence/MarketProfile";
import { breadcrumbLd, ldJson } from "@/lib/seo";

export function generateStaticParams() {
  return MARKETS.map((m) => ({ slug: m.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = marketBySlug(slug);
  if (!m) return { title: "Location Intelligence" };
  return {
    title: `${m.name} — Location Intelligence`,
    description: `Independent intelligence on ${m.name}, Gurugram: verdict, project count, price band, current and future trends, and the projects we track. ${m.info}`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolveMarketBySlug(slug);
  if (!resolved) notFound();
  const { m, live } = resolved;

  /* The "Projects in SPR" grid ran on scoredProjectsIn() — a filter over
     the hand-written journey dataset. Five of its ten entries do not exist
     in the database at all, so a corridor page could advertise projects
     whose links 404, at scores nobody computed. The grid now shows the
     corridor's real tracked projects, matched by slug against the same
     index the front door and the omnibox use. */
  const index = await buildIndex();
  const want = new Set((live?.projects ?? []).map((p) => p.slug));
  const projects = index.projects.filter((p) => want.has(p.slug)).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "" },
    { name: "Intelligence", path: "/intelligence" },
    { name: "Locations", path: "/intelligence/markets" },
    { name: m.name, path: `/intelligence/markets/${m.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumb)} />
      <MarketProfile
        m={m}
        projects={projects}
        cagrConfidence={live?.cagrConfidence ?? null}
        potential={live?.potential ?? null}
        supplyPressure={live?.supplyPressure ?? null}
      />
    </>
  );
}
