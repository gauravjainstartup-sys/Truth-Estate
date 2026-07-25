"use client";

/* ════════════════════════════════════════════════════════════════
   EVENT TRACKER — one mount in the layout, every route instrumented.

   Mounted once rather than added per page, so a page added next month is
   tracked by construction instead of by remembering. Project reports are
   recognised from the path (/intelligence/<slug>), which is also why
   there is nothing to wire into the report pages themselves.

   Renders nothing and can only ever fail silently — a metric must never
   cost a visitor a page.
   ════════════════════════════════════════════════════════════════ */
import { useEffect, useRef } from "react";
import { fetchEntitlements } from "@/lib/entitlements";
import { AUTH_EVENT } from "@/lib/journey";
import { usePathname } from "next/navigation";
import { track, wireEventFlush, projectSlugFromPath } from "@/lib/events";

export default function EventTracker() {
  const pathname = usePathname();
  /* React Strict Mode double-invokes effects in development, and a
     client-side nav can re-run this for the same path. Without this
     guard every page view would be counted twice in dev and the funnel
     numbers would be quietly wrong. */
  const lastPath = useRef<string | null>(null);

  useEffect(() => { wireEventFlush(); }, []);

  /* Pull the server's view of what this account paid for, once per load
     and again whenever they sign in. Mounted here because this component
     is already global and already fires on every page — a purchase made
     on truthestate.in, or on this device before a refresh, is otherwise
     invisible to the gates in journey.ts. Fire and forget: the helpers
     fall back to the local grant if it never arrives. */
  useEffect(() => {
    void fetchEntitlements();
    const onAuth = () => { void fetchEntitlements(); };
    window.addEventListener(AUTH_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_EVENT, onAuth);
  }, []);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    try {
      track("page_viewed");

      const slug = projectSlugFromPath(pathname);
      if (slug) {
        /* The strongest intent signal the site produces — someone reading
           a specific report is further along than anything they type. */
        track("report_viewed", { projectSlug: slug });
      } else if (/^\/office(\/|$)/.test(pathname)) {
        track("office_opened");
      }
    } catch { /* never break a page for a metric */ }
  }, [pathname]);

  return null;
}
