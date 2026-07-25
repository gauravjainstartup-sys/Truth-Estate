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
};

/* Roles as the table already uses them. The tool_name/tool_input/
   tool_result columns imply the assistant convention rather than
   Gemini's "model". If existing rows disagree, change it here only. */
const ROLE_USER = "user";
const ROLE_BOT = "assistant";

const cap = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

export async function logTurn(deps: LogDeps, t: Turn): Promise<void> {
  /* No session means no conversation to group this under — an orphan pair
     of rows would only be noise in the analytics. */
  if (!t.sessionId || !deps.url || !deps.key) return;

  const base = {
    session_id: t.sessionId,
    anon_id: t.anonId ?? null,
    user_id: null,
    tier: t.tier ?? null,
  };

  const rows = [
    { ...base, role: ROLE_USER, content: cap(t.question, 4000) },
    {
      ...base,
      role: ROLE_BOT,
      content: cap(t.answer, 8000),
      model_used: t.model ?? null,
      latency_ms: t.latencyMs ?? null,
    },
  ];

  try {
    const res = await deps.fetchImpl(`${deps.url}/rest/v1/chat_sessions`, {
      method: "POST",
      headers: {
        apikey: deps.key,
        Authorization: `Bearer ${deps.key}`,
        "content-type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      console.error(`[chatlog] insert HTTP ${res.status}: ${(await res.text()).slice(0, 240)}`);
    }
  } catch (e) {
    console.error(`[chatlog] ${e instanceof Error ? e.message : e}`);
  }
}
