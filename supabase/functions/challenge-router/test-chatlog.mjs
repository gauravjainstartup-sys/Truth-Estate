/* Offline harness for chatlog. Node runs the .ts directly via type-stripping.
     node supabase/functions/challenge-router/test-chatlog.mjs              */
import { logTurn } from "./chatlog.ts";

let pass = 0, fail = 0;
const ok = (c, l) => { c ? (pass++, console.log(`✓ ${l}`)) : (fail++, console.error(`✗ ${l}`)); };

const spy = () => {
  const calls = [];
  return { calls, f: async (url, init) => {
    calls.push({ url, rows: JSON.parse(init.body), headers: init.headers });
    return { ok: true, status: 201, text: async () => "" };
  }};
};
const DB = (f) => ({ url: "https://db.example", key: "svc", fetchImpl: f });
const TURN = { sessionId: "s1", anonId: "a1", question: "q", answer: "a", model: "m", tier: "anonymous", latencyMs: 42 };

{
  const { f, calls } = spy();
  await logTurn(DB(f), TURN);
  const [u, b] = calls[0].rows;

  /* The regression this file exists for: PostgREST answers PGRST102
     "All object keys must match" if a bulk insert's objects differ, because
     it emits one INSERT with a single column list. */
  const ku = Object.keys(u).sort(), kb = Object.keys(b).sort();
  ok(JSON.stringify(ku) === JSON.stringify(kb), "PGRST102: both rows carry an identical key set");

  ok(calls[0].url.endsWith("/rest/v1/chat_sessions"), "writes to chat_sessions");
  ok(u.role === "user" && b.role === "assistant", "roles match the table's existing convention");
  ok(u.model_used === null && b.model_used === "m", "model_used null on the question, set on the reply");
  ok(u.latency_ms === null && b.latency_ms === 42, "latency_ms null on the question, set on the reply");
  ok(u.anon_id === "a1" && b.anon_id === "a1", "anon_id on both rows — it is the stitch key");
  ok(!!u.id && !!b.id && u.id !== b.id, "distinct ids supplied, not left to a default");
}

{ const { f, calls } = spy();
  await logTurn(DB(f), { ...TURN, sessionId: undefined });
  ok(calls.length === 0, "no sessionId → nothing written"); }

{ const { f, calls } = spy();
  await logTurn({ url: "", key: "", fetchImpl: f }, TURN);
  ok(calls.length === 0, "missing credentials → nothing written"); }

{ const boom = async () => { throw new Error("network down"); };
  let threw = false;
  try { await logTurn(DB(boom), TURN); } catch { threw = true; }
  ok(!threw, "network failure never propagates — logging cannot cost a visitor their answer"); }

{ const bad = async () => ({ ok: false, status: 400, text: async () => "PGRST102" });
  let threw = false;
  try { await logTurn(DB(bad), TURN); } catch { threw = true; }
  ok(!threw, "DB rejection never propagates either"); }

console.log(`\n${pass} checks passed${fail ? `, ${fail} FAILED` : ""}.`);
process.exit(fail ? 1 : 0);
