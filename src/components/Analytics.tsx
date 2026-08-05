"use client";

/* ════════════════════════════════════════════════════════════════
   THIRD-PARTY ANALYTICS — GA4 (gtag) + Amplitude (autocapture + session
   replay). Loaded once from the layout, alongside the first-party events
   pipe (events.ts), which stays the source of truth.

   GATED TO THE PRODUCTION ORIGIN. The github.io preview is a full,
   noindexed mirror of the site; letting it load these would pour a second
   copy of every pageview and session into the real GA4 property and
   Amplitude project. IS_PRODUCTION_ORIGIN is the same guard the noindex
   uses — true on truthestate.in AND on the Cloud Run arena (which builds
   with the production origin), false on the github.io mirror. So the team
   can still watch it work on the arena; only the mirror is excluded.

   Autocapture (Amplitude) and enhanced measurement (GA4) already log
   pageviews, clicks and form interactions; the named funnel events
   (report_unlocked, payment_completed, …) are forwarded from track() in
   events.ts, so the money funnel is first-class in both tools. ════════ */
import Script from "next/script";
import { IS_PRODUCTION_ORIGIN } from "@/lib/site";

const GA4_ID = "G-K0LH7K54LJ";
const AMPLITUDE_KEY = "cae495d5ed3881fb926db3241f5fa6df";

export default function Analytics() {
  if (!IS_PRODUCTION_ORIGIN) return null;
  return (
    <>
      {/* ── GA4 (gtag.js) ── */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA4_ID}');`}
      </Script>

      {/* ── Amplitude (autocapture + session replay @ 100%) ── */}
      <Script src={`https://cdn.amplitude.com/script/${AMPLITUDE_KEY}.js`} strategy="afterInteractive"
        onLoad={() => {
          try {
            const w = window as unknown as {
              amplitude?: { add: (p: unknown) => void; init: (k: string, o: unknown) => void };
              sessionReplay?: { plugin: (o: unknown) => unknown };
            };
            if (w.amplitude && w.sessionReplay) {
              w.amplitude.add(w.sessionReplay.plugin({ sampleRate: 1 }));
              w.amplitude.init(AMPLITUDE_KEY, { fetchRemoteConfig: true, autocapture: true });
            }
          } catch { /* analytics must never break a page */ }
        }}
      />
    </>
  );
}
