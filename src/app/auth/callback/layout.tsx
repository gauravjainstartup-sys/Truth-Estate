import type { Metadata } from "next";

/* The OAuth callback (page.tsx) is a transient "use client" redirect handler —
   it has no content to rank and must never be indexed, nor claim the homepage's
   canonical (which a client page with no metadata would inherit). A client
   component can't export `metadata`, so this tiny SERVER layout carries the
   robots + canonical for the route without touching the callback logic. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/callback" },
  title: "Signing you in…",
};

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
