import type { Metadata } from "next";
import { fetchBacklogFull } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════════
   The address this build served before the reports moved.

   Reports now live at /projects/<seo slug> — the URL truthestate.in
   already serves and Google has indexed — so the domain can migrate here
   without every ranking page 404ing. This route keeps the old
   /intelligence/projects/<db-name slug> working: rel=canonical carries
   the equity forward, the script hops humans instantly, and the visible
   link covers anything that does not run scripts.

   GitHub Pages cannot issue a 301. This is the static-host equivalent,
   and the same device the retired curated URLs already use.
   ════════════════════════════════════════════════════════════════ */

const BASE = "/Truth-Estate";

let cache: Awaited<ReturnType<typeof fetchBacklogFull>> | undefined;
async function rows() {
  if (cache === undefined) cache = await fetchBacklogFull();
  return cache;
}

async function targetFor(slug: string): Promise<string | null> {
  const all = await rows();
  const hit = all?.find((r) => r.slug === slug);
  return hit ? `/projects/${hit.seoSlug}` : null;
}

export async function generateStaticParams() {
  const all = await rows();
  const params = (all ?? []).map((r) => ({ slug: r.slug }));
  console.log(`[urls] legacy project stubs at /intelligence/projects: ${params.length}`);
  return params;
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const target = await targetFor(slug);
  return {
    title: "This report moved — Truth Estate",
    /* Not indexed itself; the canonical is what search should keep. */
    robots: { index: false, follow: true },
    alternates: { canonical: target ?? "/intelligence/projects" },
  };
}

export default async function LegacyProjectStub(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const target = await targetFor(slug);
  const href = `${BASE}${target ?? "/intelligence/projects"}`;
  return (
    <div data-legacy-stub className="mx-auto max-w-xl px-6 py-28 text-center">
      <script dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(href)})` }} />
      <p className="text-[0.8rem] font-light text-[#1a1a1a]/55">This report moved to a new address.</p>
      <a href={href} className="mt-3 inline-block text-[0.95rem] font-medium text-[#1e6b45] underline underline-offset-4">
        Continue to the report →
      </a>
    </div>
  );
}
