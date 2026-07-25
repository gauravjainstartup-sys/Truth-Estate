#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   MINT BACKOFFICE KEY

   Issues a Supabase-compatible JWT carrying role=backoffice, so the AI
   Studio back-office can write product data without holding the
   service_role key — which would also give it every customer email,
   every conversation and every lead. See migration 0008.

   Runs locally with no dependencies. The JWT secret is READ FROM A
   PROMPT, never an argument, so it does not end up in shell history.

     node scripts/mint-backoffice-key.mjs

   The secret is at Dashboard → Settings → API → JWT Settings.
   ════════════════════════════════════════════════════════════════ */
import { createHmac } from "node:crypto";
import { createInterface } from "node:readline";

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function sign(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const body = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  return `${body}.${b64url(createHmac("sha256", secret).update(body).digest())}`;
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden && process.stdin.isTTY) {
      /* Suppress echo so the secret is not left on screen or in a
         screen-share. */
      const onData = (ch) => {
        if (["\n", "\r", ""].includes(ch.toString())) process.stdin.removeListener("data", onData);
        else process.stdout.write("*");
      };
      process.stdout.write(question);
      process.stdin.on("data", onData);
      rl.question("", (a) => { process.stdout.write("\n"); rl.close(); resolve(a.trim()); });
      rl._writeToOutput = () => {};
      return;
    }
    rl.question(question, (a) => { rl.close(); resolve(a.trim()); });
  });
}

const YEARS = Number(process.env.EXPIRY_YEARS ?? 5);

const secret = await ask("Supabase JWT secret (Settings → API → JWT Settings): ", { hidden: true });
if (!secret || secret.length < 20) {
  console.error("\nThat doesn't look like a JWT secret — it should be a long random string.");
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const token = sign(
  {
    role: "backoffice",
    iss: "supabase",
    iat: now,
    /* Long-lived on purpose: this is a static key pasted into a tool, not
       a user session. Revoke by running
         revoke backoffice from authenticator;
       which kills it instantly without touching the anon or service keys. */
    exp: now + Math.round(YEARS * 365 * 24 * 60 * 60),
  },
  secret,
);

console.log("\n──────────── BACKOFFICE KEY ────────────");
console.log(token);
console.log("────────────────────────────────────────");
console.log(`\nExpires in ${YEARS} year(s).`);
console.log("\nUse it exactly like the anon key — BOTH headers:");
console.log("  apikey: <key>");
console.log("  Authorization: Bearer <key>");
console.log("\nIt can write product data. It CANNOT read user_profiles,");
console.log("chat_sessions, contact_leads or payments.");
console.log("\nRun migration 0008 first, or the role will not exist.");
