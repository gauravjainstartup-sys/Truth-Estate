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
  | "chat_opened"
  /* Help Centre — paid readers checking what they bought. Worth its own
     name: a spike here is usually a payment that did not land. */
  | "help_centre_opened"
  /* Owner or prospect, declared at the unlock. */
  | "stake_declared"
  /* Sun & Vastu 3D advisor opened on a project page. */
  | "model_opened"
  /* Home-page search engaged — the first keystroke, or the mobile search
     surface opened. Top-of-funnel intent, distinct from chat_opened. */
  | "search_started"
  /* A search that SETTLED on a query (debounced), and the failure case broken
     out: search_no_results names a query that matched nothing — the recall gap
     that sends a searcher back to Google, and the bounce driver we could not
     previously see. props: source ("home" | "palette"), query, hits. Together
     they give the denominator (searches) and numerator (misses). */
  | "search_performed"
  | "search_no_results"
  /* ── Funnel events (GA4/Amplitude spec) — the click/attempt half the
     "completed" events above never captured. All fire via track() so they
     reach GA4 + Amplitude synchronously. ── */
  | "unlock_full_read_clicked"   // "Get Full Read" clicked (intent, before the modal)
  | "sign_up_form_opened"        // any sign-up / OTP form shown (props.source = which)
  | "package_1100_clicked"       // ₹1,100 package selected
  | "package_5100_clicked"       // ₹5,100 package selected
  | "razorpay_redirected"        // Razorpay checkout about to open
  | "payment_failed"             // Razorpay reported a failed payment
  /* ── Page-reach + flow-step events (GA4/Amplitude spec, round 2). Each
     names a place a visitor arrived or an intent they declared, so a funnel
     can be built from arrival → request → unlock without inferring from the
     URL. Fire via track(), so GA4 + Amplitude get them synchronously. ── */
  | "deal_room_page_viewed"          // the Deal Room surface was reached
  | "sun_vastu_page_viewed"          // the /sun-vastu gallery was reached
  | "compare_projects"               // a project-vs-project compare page opened
  | "compare_developers"             // a developer-vs-developer compare page opened
  | "compare_markets"                // a market-vs-market compare page opened
  | "requirements_flow_started"      // the requirements / brief flow was opened
  | "shortlist_page_reached"         // the shortlist surface was reached
  | "first_shortlist_unlocked"       // the reader's FIRST shortlist unlock (once per device)
  | "sun_vastu_requested"            // a Sun & Vastu 3D request was submitted
  | "project_request_submitted"      // a project interest / request lead was submitted
  /* ── Deal Room mandate funnel (Stage-1 demand experiment). ── */
  | "deal_room_mandate_started"      // the mandate wizard was opened
  | "deal_room_mandate_submitted"    // a Deal Room mandate was submitted — the demand signal
  | "deal_room_track_viewed"         // the buyer reopened /deal-room/track to watch their mandate
  /* ── News & Updates engagement — the section is a free, load-more feed on the
     report; these measure whether readers dig into it (props.placement =
     "locked" | "unlocked", so the locked engagement probe can be read apart). ── */
  | "news_viewed"                    // the News & Updates section rendered with items
  | "news_load_more";                // the reader expanded past the first items

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
    })
      /* The function answers 200 even when it stored nothing — an unknown
         event name, a failed insert and a clean write are indistinguishable
         from the status line alone. Without this check a broken pipeline
         looks exactly like a working one, which is how report_viewed went
         unnoticed. Warn only; a metric must never surface an error to the
         visitor, and must never retry into a loop. */
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { stored?: number } | null;
        const stored = body?.stored ?? 0;
        if (!res.ok || stored < batch.length) {
          console.warn(
            `[events] sent ${batch.length}, stored ${stored} (http ${res.status})`,
            batch.map((e) => e.name),
          );
        }
      })
      .catch(() => { /* analytics must never surface an error */ });
  } catch { /* same */ }
}

function flush(useBeacon = false): void {
  if (timer) { clearTimeout(timer); timer = null; }
  const batch = queue;
  queue = [];
  send(batch, useBeacon);
}

/* Fan the same named events out to GA4 (gtag) and Amplitude when they've
   loaded — production only; see components/Analytics.tsx. Autocapture
   (Amplitude) and enhanced measurement (GA4) already log pageviews in both,
   so page_viewed is left to them; everything else is the funnel, sent with
   its properties and the anon_id so a vendor event joins back to this
   first-party trail. Best-effort and silent, like the rest of this file. */
function forwardToVendors(name: EventName, detail: Omit<Queued, "name" | "path" | "referrer">): void {
  if (name === "page_viewed") return;
  try {
    const props: Record<string, unknown> = {
      ...(detail.projectSlug ? { project_slug: detail.projectSlug } : {}),
      ...(detail.projectName ? { project_name: detail.projectName } : {}),
      ...(detail.props ?? {}),
      anon_id: getAnonId(),
    };
    const w = window as unknown as {
      gtag?: (...a: unknown[]) => void;
      amplitude?: { track?: (n: string, p?: Record<string, unknown>) => void };
    };
    w.gtag?.("event", name, props);
    w.amplitude?.track?.(name, props);
  } catch { /* analytics must never surface an error */ }
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
    forwardToVendors(name, detail);
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

/* DELIBERATELY NOT DERIVED FROM THE PATH ANY MORE.

   This used to read the slug out of the URL, and it was wrong twice.
   First the pattern was written against an assumed route and matched
   none of the 198 report pages, so report_viewed never fired at all.
   Then the reports moved to /projects/<seo slug> — and that slug is the
   PUBLIC address, not the internal id, so a path-derived value would no
   longer join to entitlements, to the inferred brief, or to any event
   already stored.

   Both failures share one cause: inferring identity from a string that
   was never meant to carry it. The report page knows exactly which
   project it is rendering, so it now says so — see ProjectProfile. There
   is nothing left here to get out of step with the routing. */
