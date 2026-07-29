/* ════════════════════════════════════════════════════════════════
   PUBLISH WATCHDOG — is the live site actually showing the database?

   The site is a static export, so "live data" means "rebuilt since the
   last write". Two independent things keep that true: a Postgres trigger
   on each source table that dispatches a rebuild within seconds, and a
   daily cron as a backstop. Between 22 and 29 July the trigger side was
   covering two of the five tables the build reads, so every edit to
   prices, units and micro-markets waited up to a day for the cron. It
   went unnoticed for six days precisely BECAUSE the backstop worked:
   the site was never visibly broken, only ever up to 24 hours behind.

   WHY THIS IS NOT "ALERT IF NO DISPATCH IN 48 HOURS".
   That is the obvious check and it is the wrong one. It fires on any
   quiet weekend, when nothing is wrong at all — and an alarm that cries
   on silence is one you learn to close without reading, which is worse
   than no alarm. The real invariant is a comparison, not a timer:

       has anything been WRITTEN that has not been PUBLISHED?

   Quiet database, quiet watchdog. A write that fails to publish is the
   only thing that rings, and that is exactly the fault we had.

   Two checks, both from the same two facts:
     1. TRIGGER  a write landed and no dispatch followed it → the trigger
                 chain is broken for that table (our bug)
     2. BACKSTOP no data-refreshing build of ANY kind in 36h → the cron
                 has stopped too, so nothing is covering us

   Exits non-zero on either, which fails the scheduled workflow, which is
   what GitHub emails the repo owner about. No new secret, no new service.
   ════════════════════════════════════════════════════════════════ */

const SUPABASE_URL = "https://lyetvabfgaidvqrbmaoy.supabase.co";
/* The public anon key — the same one the browser bundle ships. It reads
   published views and nothing else; there is no secret here to leak. */
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5ZXR2YWJmZ2FpZHZxcmJtYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDI2MzEsImV4cCI6MjA5MzI3ODYzMX0.zJzqyfhANxChklw7bEiOc7PwSq2R9wiJIpS39wCYS_8";

/* Every table the build reads and that carries a publish trigger. Adding
   a source to the snapshot without adding it here means the watchdog
   stops watching the thing you just started shipping. */
const WATCHED = [
  "backlog_projects",
  "backlog_project_data",
  "project_extended_details",
  "project_configurations",
  "micro_market_data",
];

const REPO = process.env.GITHUB_REPOSITORY ?? "gauravjainstartup-sys/Truth-Estate";
const TOKEN = process.env.GITHUB_TOKEN ?? "";
const WORKFLOW = "deploy.yml";

/* A build takes 3–4 minutes and the dispatch itself is debounced by 90
   seconds, so a write in the last few minutes has not had time to
   publish yet and must not ring. */
const GRACE_MIN = 20;
/* The cron is daily. Thirty-six hours means it has missed a whole cycle,
   not that GitHub delayed it by an hour — which it routinely does. */
const BACKSTOP_H = 36;

const gh = async (path) => {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} on ${path}: ${(await res.text()).slice(0, 160)}`);
  return res.json();
};

const lastRunOf = async (event) => {
  const d = await gh(`/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?event=${event}&per_page=1`);
  const r = d.workflow_runs?.[0];
  return r ? { at: Date.parse(r.created_at), conclusion: r.conclusion, status: r.status, url: r.html_url } : null;
};

const newestWrite = async (table) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=updated_at&order=updated_at.desc&limit=1`,
    { headers: { apikey: ANON, authorization: `Bearer ${ANON}` } },
  );
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${table}`);
  const rows = await res.json();
  const at = rows?.[0]?.updated_at ? Date.parse(rows[0].updated_at) : null;
  return { table, at };
};

const ago = (ms) => {
  const h = (Date.now() - ms) / 3.6e6;
  return h < 1 ? `${Math.round(h * 60)} min ago` : h < 48 ? `${h.toFixed(1)} h ago` : `${(h / 24).toFixed(1)} days ago`;
};
const iso = (ms) => new Date(ms).toISOString().replace("T", " ").slice(0, 19) + "Z";

const [writes, dispatch, schedule, manual] = await Promise.all([
  Promise.all(WATCHED.map(newestWrite)),
  lastRunOf("repository_dispatch"),
  lastRunOf("schedule"),
  lastRunOf("workflow_dispatch"),
]);

const written = writes.filter((w) => w.at != null).sort((a, b) => b.at - a.at);
/* Any of the three refreshes pulls a fresh snapshot, so any of them
   makes the site current — the backstop check must consider all three. */
const refreshes = [dispatch, schedule, manual].filter(Boolean).sort((a, b) => b.at - a.at);
const lastRefresh = refreshes[0] ?? null;

console.log("── publish watchdog ─────────────────────────────────");
for (const w of written) console.log(`   ${w.table.padEnd(26)} written ${iso(w.at)}  (${ago(w.at)})`);
console.log(`   ${"last dispatch".padEnd(26)} ${dispatch ? `${iso(dispatch.at)}  (${ago(dispatch.at)})` : "never"}`);
console.log(`   ${"last data refresh".padEnd(26)} ${lastRefresh ? `${iso(lastRefresh.at)}  (${ago(lastRefresh.at)})` : "never"}`);
console.log("");

const problems = [];

/* 1 · TRIGGER — a write with no dispatch behind it */
const newest = written[0] ?? null;
if (newest && dispatch) {
  const lagMin = (newest.at - dispatch.at) / 60000;
  if (lagMin > GRACE_MIN) {
    problems.push(
      `TRIGGER CHAIN: ${newest.table} was written ${iso(newest.at)} but the last rebuild dispatch was ` +
      `${iso(dispatch.at)} — ${Math.round(lagMin)} min earlier. That write never published.\n` +
      `      Check the trigger exists on that table:\n` +
      `        select c.relname, t.tgname from pg_trigger t join pg_class c on c.oid = t.tgrelid\n` +
      `        where not t.tgisinternal and t.tgfoid = 'notify_publish_deploy'::regproc;\n` +
      `      Then the delivery log:  select status_code, content from net._http_response order by created desc limit 5;`,
    );
  }
} else if (newest && !dispatch) {
  problems.push("TRIGGER CHAIN: no repository_dispatch run has ever happened, but the database has writes.");
}

/* 2 · BACKSTOP — nothing has refreshed the data at all */
if (!lastRefresh) {
  problems.push("BACKSTOP: no scheduled, manual or dispatched data refresh on record.");
} else if (Date.now() - lastRefresh.at > BACKSTOP_H * 3.6e6) {
  problems.push(
    `BACKSTOP: the last data-refreshing build was ${ago(lastRefresh.at)} (over ${BACKSTOP_H} h). ` +
    `The daily cron may be disabled — GitHub switches schedules off in repos with no recent commits.`,
  );
}

if (problems.length) {
  console.error("PUBLISH WATCHDOG FAILED\n");
  for (const p of problems) console.error(`  · ${p}\n`);
  process.exit(1);
}

console.log(
  newest
    ? `ok — newest write (${newest.table}, ${ago(newest.at)}) is covered by a rebuild at ${iso(dispatch.at)}.`
    : "ok — no writes on record to publish.",
);
