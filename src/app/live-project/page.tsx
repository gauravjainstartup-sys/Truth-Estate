import type { Metadata } from "next";
import LiveProjectShell from "@/components/intelligence/LiveProjectShell";

/* Fallback shell for a NEW is_live='Yes' project that has no baked static file
   yet. nginx serves this HTML for any unbaked /projects/<slug> (see
   deploy/nginx.conf.template); the client resolves the real slug and renders.

   NOINDEX on purpose: the indexable, canonical page is the static one the next
   scheduled build produces. This transient client render must never be the copy
   Google keeps — and a genuinely-unknown slug lands here too, so indexing it
   would mint soft-404s. */
export const metadata: Metadata = {
  title: "Project — Truth Estate",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LiveProjectShell />;
}
