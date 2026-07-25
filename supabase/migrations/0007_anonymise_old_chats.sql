-- ════════════════════════════════════════════════════════════════
-- 0007 — 90-DAY ANONYMISATION OF UNCONVERTED CHATS
--
-- DPDP expects a stated retention limit on personal data. The founder's
-- choice was anonymise rather than delete, which is the better trade:
-- "what do people ask" is the most valuable product research this
-- business will ever collect, and it stays useful forever once it can no
-- longer be tied to a person.
--
-- WHAT COUNTS AS ANONYMISING HERE
--
-- The personal part of a chat row is not mainly the text — it is the
-- LINKAGE. user_id, anon_id and session_id are what turn "someone asked
-- about DLF Privana" into "this person asked about DLF Privana". Breaking
-- those three links is what makes the row non-personal, so that is the
-- primary action, and the content survives.
--
-- Content is still scrubbed for self-disclosed identifiers, because
-- visitors type things like "call me on 98765 43210" into chat regardless
-- of what the box is for. Phone and email patterns are replaced in place;
-- everything else — the question, the projects named, the budget — stays.
--
-- SCOPE. Only rows with user_id IS NULL: conversations that never became
-- a customer. Once someone signs in, the chat is part of a customer
-- relationship with its own retention basis, and silently stripping their
-- own history from them would be worse service, not better privacy.
-- ════════════════════════════════════════════════════════════════

-- ── Preview. Always run this before the real thing ──────────────
create or replace function public.preview_anonymise_chats(p_days integer default 90)
returns table (rows_affected bigint, oldest timestamptz, newest timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*), min(created_at), max(created_at)
    from public.chat_sessions
   where user_id is null
     and created_at < now() - make_interval(days => p_days)
     and (anon_id is not null or session_id is not null or content is not null);
$$;


-- ── The job ─────────────────────────────────────────────────────
create or replace function public.anonymise_old_chats(p_days integer default 90)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows integer := 0;
begin
  -- Refuse a nonsensical window rather than quietly anonymising everything.
  -- A caller passing 0 almost certainly meant something else.
  if p_days is null or p_days < 1 then
    raise exception 'retention window must be at least 1 day, got %', p_days
      using errcode = '22023';
  end if;

  update public.chat_sessions
     set
       -- The linkage. This is what actually anonymises the row.
       anon_id    = null,
       session_id = null,
       -- Self-disclosed identifiers. Emails first — they can contain digit
       -- runs the phone pattern would otherwise eat.
       --
       -- The phone branch is an ALTERNATION, not an optional prefix, and
       -- that detail is load-bearing: with a country code written compactly
       -- ("+919958777312") there is no word boundary between the 91 and the
       -- number, so a leading \m simply never matches and the identifier
       -- survives the scrub. Two explicit branches — with prefix, or bare
       -- and word-bounded — catch both forms.
       --
       -- Requiring 10 digits opening 6-9 is what keeps real estate content
       -- intact: "₹5 Cr", "Truth Score 82", "₹18,250/sqft", "Sector 76/77"
       -- and "handover 2031" all pass through untouched.
       content = case when content is null then null else
         regexp_replace(
           regexp_replace(content,
             '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email removed]', 'g'),
           '(\+?91[\s-]?[6-9][0-9]{9}|\m[6-9][0-9]{9})\M', '[phone removed]', 'g')
       end
   where user_id is null
     and created_at < now() - make_interval(days => p_days)
     -- Idempotent: a row already stripped of both links is skipped, so
     -- re-running this costs nothing and cannot double-scrub.
     and (anon_id is not null or session_id is not null);

  get diagnostics v_rows = row_count;

  raise notice 'anonymise_old_chats: % rows older than % days', v_rows, p_days;
  return json_build_object('rows_anonymised', v_rows, 'days', p_days, 'ran_at', now());
end;
$$;

-- Maintenance only. No client role should be able to trigger this.
revoke all on function public.anonymise_old_chats(integer)   from public, anon, authenticated;
revoke all on function public.preview_anonymise_chats(integer) from public, anon, authenticated;


-- ════════════════════════════════════════════════════════════════
-- SCHEDULING — pick ONE
--
-- A. pg_cron (preferred; keeps a data-retention duty inside the database
--    rather than hanging off a deploy pipeline). Enable the extension
--    once under Database → Extensions, then:
--
--      select cron.schedule(
--        'anonymise-old-chats',
--        '30 3 * * *',                        -- 03:30 UTC = 09:00 IST
--        $$ select public.anonymise_old_chats(90) $$
--      );
--
--    Inspect or remove:
--      select * from cron.job;
--      select cron.unschedule('anonymise-old-chats');
--
-- B. If pg_cron is unavailable, call the RPC with the SERVICE ROLE key
--    from any scheduler. Never the anon key — execute is revoked from
--    every client role above.
--
--
-- FIRST RUN
--   select * from public.preview_anonymise_chats(90);   -- look first
--   select public.anonymise_old_chats(90);              -- then act
--
-- Expect 0 rows today: TruthGuide chat logging started this month, so
-- nothing is 90 days old yet. Zero is the correct answer, not a failure —
-- and it is worth scheduling now so the obligation is met before there is
-- anything to meet it about.
--
-- VERIFY the scrub on a shorter window in a transaction you roll back:
--   begin;
--     select public.anonymise_old_chats(1);
--     select anon_id, session_id, left(content, 80) from public.chat_sessions
--      where user_id is null order by created_at desc limit 5;
--   rollback;
-- ════════════════════════════════════════════════════════════════
