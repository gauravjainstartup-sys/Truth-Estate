import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/callback" },
};

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
