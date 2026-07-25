-- ════════════════════════════════════════════════════════════════
-- 0009 — LINK A VERIFIED PHONE TO ITS HISTORY
--
-- The deployed verify-otp checks the code with MSG91 and returns
-- success. It does NOT create a Supabase user — confirmed empirically:
-- a chat sign-in at ~06:47 left auth.users unchanged since 06:21, and
-- chat_rows_claimed sat at 0.
--
-- So a visitor could sign in and remain completely invisible: their
-- conversation stayed under anon_id, the name they typed went nowhere,
-- and "who logged in and what did they do" had no answer.
--
-- These two functions are what the chat-signin Edge Function calls after
-- MSG91 confirms the code. They are SECURITY DEFINER because auth.users
-- is not reachable any other way, and EXECUTE is granted to no client
-- role — only the service role behind the Edge Function may call them.
-- That placement is the security boundary: verification happens where a
-- browser cannot reach, so a client cannot simply announce "I verified
-- 9958777312" and inherit a stranger's history.
-- ════════════════════════════════════════════════════════════════

-- ── Find a user by phone, whatever shape it was stored in ───────
-- user_profiles alone holds '9958777313', '+917011823963' and
-- '7768003668'. Matching on the last ten digits is the only comparison
-- that survives that, and it is why this is a function rather than an
-- equality check inlined at each call site.
create or replace function public.find_user_id_by_phone(p_phone text)
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select u.id
    from auth.users u
   where right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 10)
       = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)
     and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 10
   order by u.created_at
   limit 1;
$$;


-- ── Attach the profile and claim the anonymous history ──────────
create or replace function public.link_verified_phone(
  p_user_id    uuid,
  p_phone      text,
  p_anon_id    text default null,
  p_session_id text default null,
  p_name       text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_chats integer := 0;
  v_leads integer := 0;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required' using errcode = '22023';
  end if;

  -- Profile. Written here rather than from the browser because the
  -- browser never receives a session token, so it has nothing to
  -- authenticate a PATCH with.
  insert into public.user_profiles (id, phone, phone_verified, name)
  values (p_user_id, p_phone, true, nullif(trim(coalesce(p_name, '')), ''))
  on conflict (id) do update
    set phone          = coalesce(excluded.phone, user_profiles.phone),
        phone_verified = true,
        -- Never overwrite a name they already gave with a null.
        name           = coalesce(excluded.name, user_profiles.name),
        updated_at     = now();

  -- The conversations they had BEFORE trusting us enough to sign in.
  -- That is the most honest data in the funnel, and until now it was
  -- orphaned at exactly the moment it became attributable.
  if p_anon_id is not null and length(p_anon_id) >= 8 then
    update public.chat_sessions
       set user_id = p_user_id
     where anon_id = p_anon_id
       and user_id is null;
    get diagnostics v_chats = row_count;
  end if;

  -- contact_leads.user_id is TEXT while chat_sessions.user_id is UUID.
  -- The cast is load-bearing; this schema is not consistent.
  update public.contact_leads
     set user_id = p_user_id::text
   where user_id is null
     and (
       (p_anon_id    is not null and session_id = p_anon_id)
       or (p_session_id is not null and session_id = p_session_id)
       or right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10)
        = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)
     );
  get diagnostics v_leads = row_count;

  return json_build_object('user_id', p_user_id, 'chats_claimed', v_chats, 'leads_claimed', v_leads);
end;
$$;

-- No client role may call these. The Edge Function holds the service
-- role, and service_role bypasses these grants entirely.
revoke all on function public.find_user_id_by_phone(text)                     from public, anon, authenticated;
revoke all on function public.link_verified_phone(uuid, text, text, text, text) from public, anon, authenticated;


-- ════════════════════════════════════════════════════════════════
-- VERIFY, after a sign-in through the chat:
--
--   select count(*) filter (where user_id is not null) as claimed,
--          count(*) filter (where anon_id is not null) as from_new_site
--     from public.chat_sessions;          -- claimed should no longer be 0
--
--   -- who signed in, and what they asked:
--   select p.name, p.phone, u.created_at as first_seen,
--          count(*) filter (where c.role = 'user') as questions
--     from auth.users u
--     join public.user_profiles p on p.id = u.id
--     left join public.chat_sessions c on c.user_id = u.id
--    group by p.name, p.phone, u.created_at
--    order by first_seen desc;
-- ════════════════════════════════════════════════════════════════
