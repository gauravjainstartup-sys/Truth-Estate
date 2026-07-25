/* Offline harness for capture-lead. Node runs core.ts directly via TS
   type-stripping — no Deno, no network, no database.
     node supabase/functions/capture-lead/test-offline.mjs             */
import { captureLead, validate, slugify, INTENTS } from "./core.ts";

let pass = 0, fail = 0;
const ok = (cond, label) => {
  if (cond) { pass++; console.log(`✓ ${label}`); }
  else { fail++; console.error(`✗ ${label}`); }
};

const okFetch = () => {
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    return { ok: true, status: 201, text: async () => "" };
  };
  return { f, calls };
};
const DB = { url: "https://db.example", key: "svc-key" };

/* ── validation ─────────────────────────────────────────────── */
ok(!validate({ intent: "documents" }).ok, "no contact method → rejected");
ok(!validate({ intent: "nonsense", email: "a@b.c" }).ok, "unknown intent → rejected");
ok(!validate({ email: "a@b.c" }).ok, "missing intent → rejected");
ok(validate({ intent: "documents", email: "a@b.c" }).ok, "email alone is enough");
ok(validate({ intent: "documents", phone: "+91 98765 43210" }).ok, "phone alone is enough");

for (const i of INTENTS) {
  if (!validate({ intent: i, email: "a@b.c" }).ok) { fail++; console.error(`✗ intent ${i} rejected`); }
}
ok(true, `all ${INTENTS.length} known intents accepted`);

/* ── shaping ────────────────────────────────────────────────── */
const v = validate({
  intent: "documents", email: "  a@b.c  ", project: "DLF The Arbour",
  docs: ["Brochure", "  Floor plan  "], message: "  hi  ",
});
ok(v.ok && v.row.email === "a@b.c", "whitespace trimmed");
ok(v.ok && v.row.project_slug === "dlf-the-arbour", "project_slug derived");
ok(v.ok && v.row.docs.length === 2, "docs preserved");
ok(slugify("DLF The Arbour") === "dlf-the-arbour", "slugify matches liveSlug");

const long = validate({ intent: "feedback", email: "a@b.c", message: "x".repeat(9000) });
ok(long.ok && long.row.message.length === 4000, "oversized message capped at 4000");

const empty = validate({ intent: "documents", email: "a@b.c", docs: [] });
ok(empty.ok && empty.row.docs === null, "empty docs array → null, not []");

/* ── insert ─────────────────────────────────────────────────── */
{
  const { f, calls } = okFetch();
  const r = await captureLead(
    { intent: "buyer-office", name: "A", phone: "+91 90000 00000", payload: { budget: [5, 8] }, sessionId: "s-1" },
    { ...DB, fetchImpl: f, userAgent: "UA/1" },
  );
  ok(r.ok === true, "successful insert → ok:true");
  ok(calls[0].url === "https://db.example/rest/v1/contact_leads", "posts to contact_leads (reused, not duplicated)");
  ok(calls[0].headers.Authorization === "Bearer svc-key", "uses the service role key");
  ok(calls[0].body.user_agent === "UA/1", "user_agent captured server-side");
  ok(calls[0].body.session_id === "s-1", "session_id carried for stitching");
  ok(JSON.stringify(calls[0].body.payload) === '{"budget":[5,8]}', "payload passed through as jsonb");
}

/* ── failure modes all fail SOFT ────────────────────────────── */
{
  const bad = async () => ({ ok: false, status: 500, text: async () => "boom" });
  const r = await captureLead({ intent: "documents", email: "a@b.c" }, { ...DB, fetchImpl: bad });
  ok(r.ok === false && r.reason.includes("500"), "DB error → ok:false with reason, no throw");
}
{
  const { f } = okFetch();
  const r = await captureLead({ intent: "documents", email: "a@b.c" }, { url: "", key: "", fetchImpl: f });
  ok(r.ok === false && r.reason === "not configured", "missing credentials → ok:false, no throw");
}
{
  const { f, calls } = okFetch();
  await captureLead({ intent: "spam-me", email: "a@b.c" }, { ...DB, fetchImpl: f });
  ok(calls.length === 0, "rejected lead never reaches the database");
}

console.log(`\n${pass} checks passed${fail ? `, ${fail} FAILED` : ""}.`);
process.exit(fail ? 1 : 0);
