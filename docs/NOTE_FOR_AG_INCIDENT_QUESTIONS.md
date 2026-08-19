# Required written answers: the committed service-role key

**To:** Antigravity Engineering
**From:** CTO office, Truth Estate (at the founder's request)
**Date:** 19 Aug 2026
**Re:** the service-role key hardcoded in the ingestion scripts — see
`NOTE_FOR_AG_SECURITY_AND_BRANCH_FIXES.md` for the full incident record.

---

## Where things stand

- The leaked key — and the entire legacy JWT key class — was **revoked and
  disabled on 19 Aug ~21:45 IST**. Verified dead (HTTP 401) minutes later.
- A full audit of the ~20-hour exposure window found **no misuse**: every
  write and every privileged read attributed to known, legitimate activity.
- **A replacement key for your pipeline has been minted but is deliberately
  NOT being issued yet.** It will be shared privately once the written
  answers below are delivered and the branch history rewrite (item 1a of the
  fixes note) is done. Until then, any run of your ingestion scripts will
  fail with 401 — that is expected, not a bug on your side or ours. Please
  do not attempt workarounds; ask for the key through the founder when the
  items below are complete.

## The questions — answer each in writing, specifically

1. **Origin.** Where exactly was the service-role key value copied from when
   it was pasted into the scripts (the Supabase dashboard page, a `.env`
   file, an older script, a notes document, an AI assistant's context or
   output)? On what date, and into which file first?

2. **Inventory.** List every place the old key still exists on your side
   today: local clones and scratch directories, branches, `.env` files,
   notes, shell history, documents, and any AI tool's saved context or chat
   history. For each location, confirm deletion after listing it. (The key
   is dead, so this is hygiene, not containment — but we need the map.)

3. **Third parties.** Was the key ever pasted into any third-party surface —
   AI chat tools, gists, pastebins, shared docs, screen recordings, support
   tickets? If yes, name each one.

4. **Other credentials.** Do you hold any other Truth Estate credentials in
   code, notes, or tool contexts — Razorpay, Gemini, Twilio, MSG91, Google
   APIs, Cloudflare R2, GCP? Inventory them even if the answer is "none".
   Anything found in code must move to environment variables immediately.

5. **Prevention.** Describe the process change on your side so this cannot
   recur: how your scripts will receive credentials going forward (env only,
   no fallbacks), and how generated code is checked before commit. Note that
   the repository now enforces this — a `secret-scan` CI fails any push
   containing a non-public key, so a repeat will bounce at the door.

## Sequence to restore your pipeline access

1. Deliver the five answers above (a reply document in `docs/` or directly
   to the founder — founder's choice of channel).
2. Complete the branch history rewrite and the three restored fixes from
   `NOTE_FOR_AG_SECURITY_AND_BRANCH_FIXES.md`.
3. The founder shares the new key privately; you export it as
   `SUPABASE_SERVICE_ROLE_KEY` in your environment — never in a file.
4. Your upsert engine (which, credit where due, passed all four acceptance
   tests when run against production) resumes exactly as built.
