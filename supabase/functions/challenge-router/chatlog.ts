/* ════════════════════════════════════════════════════════════════
   CHAT LOG — persists each turn to public.chat_sessions.

   Reuses the table the AI Studio site already writes (2,107 rows).
   Despite the name it is a MESSAGE log: one row per turn, grouped by
   session_id, with role/content per row.

   Written server-side rather than from the browser so the record cannot
   be forged or edited, and so model, latency and tier are recorded from
   the place that actually knows them.

   Fails SOFT and never blocks the reply. A visitor's answer must not
   depend on our analytics succeeding.
   ════════════════════════════════════════════════════════════════ */

export type FetchLike = (url: string, init?: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

export type LogDeps = { url: string; key: string; fetchImpl: FetchLike };

export type Turn = {
  sessionId?: string;
  /* Stable per browser, unlike sessionId which changes when the visitor
     starts a fresh chat. This is what lets several conversations from one
     device be claimed together once a phone number is verified. */
  anonId?: string;
  question: string;
  answer: string;
  model?: string;
  tier?: string;
  latencyMs?: number;
  /* Which project a "Challenge our read" chat was about (null for the
     site-wide TruthGuide). Stored in the `project` column added by migration
     0022; the insert below degrades gracefully until that migration lands. */
  project?: string | null;
};

/* Roles as the table already uses them. The tool_name/tool_input/
   tool_result columns imply the assistant convention rather than
   Gemini's "model". If existing rows disagree, change it here only. */
const ROLE_USER = "user";
const ROLE_BOT = "assistant";

const cap = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

export async function logTurn(deps: LogDeps, t: Turn): Promise<void> {
  /* No session means no conversation to group this under — an orphan pair
     of rows would only be noise in the analytics. Logged rather than
     returned silently: a missing sessionId means the client is not sending
     one, which looks identical to a broken insert from the outside. */
  if (!t.sessionId) {
    console.error("[chatlog] skipped — no sessionId on the request");
    return;
  }
  if (!deps.url || !deps.key) {
    console.error(`[chatlog] skipped — url=${!!deps.url} key=${!!deps.key}`);
    return;
  }

  /* id and created_at are supplied explicitly rather than left to column
     defaults. The AI Studio app writes this table with client-generated
     ids, so the columns may well have no default at all — and supplying
     them is harmless either way, since an explicit value simply overrides
     a default where one exists. Two failure modes removed for nothing. */
  /* PostgREST rejects a bulk insert whose objects have differing key sets
     (PGRST102 "All object keys must match") — it builds one INSERT with a
     single column list, so it cannot express per-row columns. model_used
     and latency_ms are meaningful only on the reply, but both rows must
     still CARRY the keys, so the user row sets them null rather than
     omitting them. Keep every key in `base` and override per row. */
  const now = new Date().toISOString();
  const base = {
    session_id: t.sessionId,
    anon_id: t.anonId ?? null,
    user_id: null,
    tier: t.tier ?? null,
    created_at: now,
    model_used: null as string | null,
    latency_ms: null as number | null,
    project: t.project ?? null,
  };

  const rows = [
    {
      ...base,
      id: crypto.randomUUID(),
      role: ROLE_USER,
      content: cap(t.question, 4000),
    },
    {
      ...base,
      id: crypto.randomUUID(),
      role: ROLE_BOT,
      content: cap(t.answer, 8000),
      model_used: t.model ?? null,
      latency_ms: t.latencyMs ?? null,
    },
  ];

  const post = (payload: Record<string, unknown>[]) =>
    deps.fetchImpl(`${deps.url}/rest/v1/chat_sessions`, {
      method: "POST",
      headers: {
        apikey: deps.key,
        Authorization: `Bearer ${deps.key}`,
        "content-type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

  try {
    let res = await post(rows);
    /* The `project` column arrives in migration 0022. Until it is applied,
       PostgREST 400s with 'column "project" ... does not exist' (PGRST204 /
       42703). Strip project and retry ONCE, so tagging is forward-compatible
       and its absence never regresses the logging that already worked. Any
       other 400 (e.g. PGRST102) is a real error — reported, not retried. */
    if (!res.ok && res.status === 400) {
      const errText = await res.text();
      if (/project/i.test(errText)) {
        const stripped = rows.map((r) => {
          const clone = { ...r } as Record<string, unknown>;
          delete clone.project;
          return clone;
        });
        res = await post(stripped);
        if (!res.ok) {
          console.error(`[chatlog] retry insert HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
        } else {
          console.log(`[chatlog] stored 2 rows (project col pending 0022) session=${t.sessionId}`);
        }
      } else {
        console.error(`[chatlog] insert HTTP ${res.status}: ${errText.slice(0, 400)}`);
      }
    } else if (!res.ok) {
      console.error(`[chatlog] insert HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
    } else {
      console.log(`[chatlog] stored 2 rows session=${t.sessionId} latency=${t.latencyMs ?? "-"}ms`);
    }
  } catch (e) {
    console.error(`[chatlog] ${e instanceof Error ? e.message : e}`);
  }
}
