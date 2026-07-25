/* ════════════════════════════════════════════════════════════════
   EVENTS — the funnel trail.

   chat_sessions records what someone asked, contact_leads what they
   requested, unlocked_reports what they own. None of them records that
   they read three reports, opened the office, came back the next day and
   only then paid. That sequence is what this captures.

   Anonymous-first: events are written under the same anon_id the chat
   uses, from the first page view, and claimed by the account at sign-in.
   The trail therefore starts at the first visit rather than at signup —
   which is the half that explains why someone converted.

   FIRE AND FORGET, ALWAYS. Analytics must never cost a visitor an
   interaction: every path here swallows its own errors, and a failed
   send loses the event rather than surfacing anything.
   ════════════════════════════════════════════════════════════════ */
import { getAnonId, getSessionId } from "@/lib/truthGuideChat";

const TRACK_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co/functions/v1/track";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

/* Keep in step with EVENT NAMES in migration 0010 and the allowlist in
   the track function. The server drops anything it does not recognise,
   so a typo shows up in its logs rather than becoming a silent category
   of one. */
export type EventName =
  | "page_viewed"
  | "report_viewed"
  | "signed_in"
  | "report_unlocked"
  | "payment_completed"
  | "lead_captured"
  | "office_opened"
  | "chat_opened";

type Queued = {
  name: EventName;
  projectSlug?: string;
  projectName?: string;
  props?: Record<string, unknown>;
  path?: string;
  referrer?: string;
};

/* Batched on a short timer. A project page can fire page_viewed and
   report_viewed in the same tick, and a burst of one-request-per-event
   is both wasteful and easy to drop on navigation. */
const FLUSH_MS = 800;
let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function send(batch: Queued[], useBeacon = false): void {
  if (!batch.length) return;
  const payload = JSON.stringify({
    events: batch,
    anonId: getAnonId(),
    sessionId: getSessionId(),
  });
  try {
    /* On pagehide the tab may die before fetch resolves. sendBeacon is
       the only transport the browser promises to finish, and it is why
       the last event before someone leaves is not routinely lost. */
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(TRACK_URL, new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch(TRACK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: payload,
      keepalive: true,
    }).catch(() => { /* analytics must never surface an error */ });
  } catch { /* same */ }
}

function flush(useBeacon = false): void {
  if (timer) { clearTimeout(timer); timer = null; }
  const batch = queue;
  queue = [];
  send(batch, useBeacon);
}

export function track(
  name: EventName,
  detail: Omit<Queued, "name" | "path" | "referrer"> = {},
): void {
  if (typeof window === "undefined") return;
  try {
    queue.push({
      name,
      ...detail,
      path: location.pathname + location.search,
      referrer: document.referrer || undefined,
    });
    if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
  } catch { /* never break a page for a metric */ }
}

/* Flush before the tab goes away. `pagehide` fires in cases `unload`
   does not — notably the bfcache path on iOS Safari, which is a large
   share of this audience. */
let wired = false;
export function wireEventFlush(): void {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("pagehide", () => flush(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}

/* Project pages live at /intelligence/<slug>; deriving the slug from the
   path means every report page is instrumented by the single tracker in
   the layout, with nothing to remember when pages are added. */
export function projectSlugFromPath(path: string): string | null {
  const m = path.match(/\/intelligence\/([a-z0-9-]+)\/?$/i);
  if (!m) return null;
  const slug = m[1].toLowerCase();
  /* Index and utility routes under /intelligence are not reports. */
  const NOT_REPORTS = new Set(["markets", "developers", "compare", "map", "index"]);
  return NOT_REPORTS.has(slug) ? null : slug;
}
