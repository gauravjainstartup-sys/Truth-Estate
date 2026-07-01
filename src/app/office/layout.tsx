import type { Metadata } from "next";

/* The Private Office is a client portal, not content. Keep it out of search
   indexes (and out of AI answer engines) — it should never surface in
   organic results. Child pages inherit this. */
export const metadata: Metadata = {
  title: "Private Office",
  robots: { index: false, follow: false, nocache: true },
};

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
