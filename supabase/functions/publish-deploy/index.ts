/* ────────────────────────────────────────────────────────────────────────
   publish-deploy — near-real-time republish hook

   Supabase Database Webhook  →  this Edge Function  →  GitHub repository_dispatch
   →  the Pages deploy rebuilds with a FRESH Supabase snapshot (SNAPSHOT_REFRESH=1)
   →  the static site shows the DB edit in ~3–4 min, with no manual step.

   The site is a static export (zero per-view Supabase egress by design), so
   "live data" means "rebuild on change". This function is the change→rebuild
   bridge. It:
     1. authenticates the webhook with a shared secret header,
     2. debounces bursts (a bulk pipeline rewrite = ONE rebuild, not hundreds),
     3. fires one GitHub repository_dispatch.

   Secrets (set with `supabase secrets set …`):
     GH_DISPATCH_TOKEN   fine-grained GitHub PAT, repo Truth-Estate, Contents: write
     PUBLISH_HOOK_SECRET shared secret; the DB webhook sends it as x-publish-secret
     GH_REPO             optional, defaults to gauravjainstartup-sys/Truth-Estate
     PUBLISH_DEBOUNCE_SEC optional, defaults to 90
   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the platform and are
   used only for the (optional) debounce throttle table `public.deploy_throttle`.
   ──────────────────────────────────────────────────────────────────────── */

const GH_REPO = Deno.env.get("GH_REPO") ?? "gauravjainstartup-sys/Truth-Estate";
const EVENT_TYPE = "supabase-data-changed";
const DEBOUNCE_SEC = Number(Deno.env.get("PUBLISH_DEBOUNCE_SEC") ?? "90");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/* Best-effort leading debounce via public.deploy_throttle (single row id=1).
   Returns true if we should dispatch now, false if a rebuild is already imminent.
   Fails OPEN: if the table/service-role isn't available, we still dispatch. */
async function shouldDispatch(): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key || DEBOUNCE_SEC <= 0) return true;
  try {
    const base = `${url}/rest/v1/deploy_throttle`;
    const h = { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" };
    const cur = await fetch(`${base}?id=eq.1&select=last_dispatch_at`, { headers: h });
    if (cur.ok) {
      const rows = await cur.json();
      const last = rows?.[0]?.last_dispatch_at ? Date.parse(rows[0].last_dispatch_at) : 0;
      if (Date.now() - last < DEBOUNCE_SEC * 1000) return false; // a fresh rebuild is already on the way
    }
    // claim this window
    await fetch(`${base}?id=eq.1`, {
      method: "PATCH",
      headers: { ...h, Prefer: "return=minimal" },
      body: JSON.stringify({ last_dispatch_at: new Date().toISOString() }),
    });
    return true;
  } catch {
    return true; // never let debounce bookkeeping block a publish
  }
}

Deno.serve(async (req) => {
  if (req.method === "GET") return json({ ok: true, service: "publish-deploy" });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const secret = Deno.env.get("PUBLISH_HOOK_SECRET");
  if (!secret || req.headers.get("x-publish-secret") !== secret) {
    return json({ error: "unauthorized" }, 401);
  }

  const token = Deno.env.get("GH_DISPATCH_TOKEN");
  if (!token) return json({ error: "GH_DISPATCH_TOKEN not configured" }, 500);

  if (!(await shouldDispatch())) {
    return json({ ok: true, dispatched: false, reason: "debounced — a rebuild is already queued" }, 202);
  }

  const gh = await fetch(`https://api.github.com/repos/${GH_REPO}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "truth-estate-publish-deploy",
      "content-type": "application/json",
    },
    body: JSON.stringify({ event_type: EVENT_TYPE }),
  });

  if (gh.status !== 204) {
    const detail = await gh.text().catch(() => "");
    return json({ ok: false, dispatched: false, github_status: gh.status, detail: detail.slice(0, 300) }, 502);
  }
  return json({ ok: true, dispatched: true, event_type: EVENT_TYPE });
});
