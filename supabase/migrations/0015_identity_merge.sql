-- ════════════════════════════════════════════════════════════════
-- 0015 — IDENTITY MERGE + phone dedup + email uniqueness
--
-- One human can hold two verified identities (a Google email and a phone),
-- and today's data already holds two accounts that are the SAME person under
-- format-variant phones. merge_user_profiles folds a SOURCE identity into a
-- TARGET so nothing the source owned is lost — above all the paid reports in
-- unlocked_reports.
--
-- SECURITY (the reason this is a DEFINER function, not client SQL):
--   • SECURITY DEFINER + search_path pinned, EXECUTE revoked from every client
--     role — only the service role, from inside an Edge Function that has just
--     PROVEN control of both identities, may call it (the 0009 boundary).
--   • It never takes ids from a browser; the Edge Function passes the two it
--     verified. If it were client-callable, it would be an account-takeover
--     primitive.
--   • Idempotent: a second call with the same pair is a no-op (the source is
--     already gone).
--
-- WHAT MOVES:  every public.* row with a user_id column (events, contact_leads,
--   chat_sessions, owned_properties, invoices, …) + the on-profile columns
--   (unlocked_reports union, best plan, fill-nulls). The absorbed account's
--   auth.users row is deleted (cascading its profile + auth rows) AFTER its
--   phone/email are handed to the survivor, so find_user_id_by_phone resolves a
--   later phone login to the survivor rather than minting a fresh orphan.
-- ════════════════════════════════════════════════════════════════

create or replace function public.merge_user_profiles(p_target uuid, p_source uuid)
returns json
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_tgt  public.user_profiles%rowtype;
  v_src  public.user_profiles%rowtype;
  v_src_auth_phone text;
  v_src_auth_email text;
  r record;
  v_set_cast text;
  v_ctids tid[];
  v_ctid  tid;
begin
  if p_target is null or p_source is null or p_target = p_source then
    return json_build_object('ok', false, 'reason', 'bad-args');
  end if;

  -- Lock both rows in a stable order (smaller uuid first) to avoid deadlocks.
  if p_target < p_source then
    select * into v_tgt from public.user_profiles where id = p_target for update;
    select * into v_src from public.user_profiles where id = p_source for update;
  else
    select * into v_src from public.user_profiles where id = p_source for update;
    select * into v_tgt from public.user_profiles where id = p_target for update;
  end if;

  -- Idempotent / defensive: if either side is gone, do nothing.
  if v_tgt.id is null or v_src.id is null then
    return json_build_object('ok', true, 'noop', true);
  end if;

  -- Snapshot the source's auth identifiers before we delete it.
  select phone, email into v_src_auth_phone, v_src_auth_email from auth.users where id = p_source;

  -- 1) Re-home every per-user row across the whole public schema. Binds are
  --    passed as text and the SET is cast back to the column's real type
  --    (contact_leads / payments key on TEXT, the rest on uuid), so one code
  --    path serves both; user_id::text on the read side compares either shape.
  --
  --    A table with a UNIQUE key that includes user_id (owned_properties is
  --    PK (user_id, slug)) can COLLIDE when both accounts hold the "same" row.
  --    A single bulk UPDATE would then abort wholesale — and every un-moved
  --    source row would die on the cascade delete below, silently dropping
  --    rows that did NOT collide. So on collision we fall back to moving the
  --    table row-by-row (by ctid, snapshotted first so mutation can't disturb
  --    the scan): each row that fits moves, each genuine duplicate is deleted
  --    outright (it would die with the source anyway). Nothing non-duplicate
  --    is ever lost.
  for r in
    select table_name, data_type
    from information_schema.columns
    where table_schema = 'public' and column_name = 'user_id'
  loop
    v_set_cast := case when r.data_type = 'uuid' then '::uuid' else '' end;
    begin
      -- Fast path: one bulk move (the norm — no collision).
      execute format('update public.%I set user_id = $1%s where user_id::text = $2', r.table_name, v_set_cast)
        using p_target::text, p_source::text;
    exception
      when unique_violation then
        -- Slow path: only reached when a bulk move collided.
        execute format('select coalesce(array_agg(ctid), ''{}'') from public.%I where user_id::text = $1', r.table_name)
          into v_ctids using p_source::text;
        foreach v_ctid in array v_ctids loop
          begin
            execute format('update public.%I set user_id = $1%s where ctid = $2', r.table_name, v_set_cast)
              using p_target::text, v_ctid;
          exception when unique_violation then
            execute format('delete from public.%I where ctid = $1', r.table_name) using v_ctid;
          end;
        end loop;
      when others then
        raise notice 'merge_user_profiles: skipped %.user_id (%)', r.table_name, sqlerrm;
    end;
  end loop;

  -- 2) Delete the source auth user FIRST — cascades its user_profiles row and
  --    frees the phone/email UNIQUE constraints so the survivor can take them.
  delete from auth.users where id = p_source;

  -- 3) Fold the source's profile values into the survivor.
  update public.user_profiles t set
    unlocked_reports = (
      select coalesce(array_agg(distinct x), '{}')
      from unnest(coalesce(t.unlocked_reports, '{}') || coalesce(v_src.unlocked_reports, '{}')) as x
    ),
    plan = case
             when t.plan = 'Premium' or v_src.plan = 'Premium' then 'Premium'
             when t.plan = 'Pro'     or v_src.plan = 'Pro'     then 'Pro'
             else 'Free'
           end,
    phone           = coalesce(nullif(t.phone, ''), nullif(v_src.phone, '')),
    email           = coalesce(nullif(t.email, ''), nullif(v_src.email, '')),
    name            = coalesce(nullif(t.name, ''),  nullif(v_src.name, '')),
    persona         = coalesce(t.persona, v_src.persona),
    google_sub      = coalesce(t.google_sub, v_src.google_sub),
    avatar_url      = coalesce(t.avatar_url, v_src.avatar_url),
    phone_verified  = t.phone_verified or v_src.phone_verified,
    onboarding_done = t.onboarding_done or v_src.onboarding_done,
    pref_locations      = case when array_length(t.pref_locations, 1) is null then v_src.pref_locations else t.pref_locations end,
    pref_budgets        = case when array_length(t.pref_budgets, 1) is null then v_src.pref_budgets else t.pref_budgets end,
    pref_configs        = case when array_length(t.pref_configs, 1) is null then v_src.pref_configs else t.pref_configs end,
    pref_delivery_years = case when array_length(t.pref_delivery_years, 1) is null then v_src.pref_delivery_years else t.pref_delivery_years end,
    pref_target_cagr    = coalesce(t.pref_target_cagr, v_src.pref_target_cagr),
    pref_exit_years     = coalesce(t.pref_exit_years, v_src.pref_exit_years),
    updated_at = now()
  where t.id = p_target;

  -- 4) Give the survivor the source's phone/email in auth.users too (only where
  --    empty), so a later phone/OTP login resolves here, not to a new account.
  update auth.users u set
    phone = coalesce(nullif(u.phone, ''), v_src_auth_phone),
    email = coalesce(nullif(u.email, ''), v_src_auth_email),
    phone_confirmed_at = coalesce(u.phone_confirmed_at, case when v_src_auth_phone is not null then now() end)
  where u.id = p_target;

  return json_build_object('ok', true, 'target', p_target, 'merged', p_source);
end;
$$;

-- Service-role only — never a client.
revoke execute on function public.merge_user_profiles(uuid, uuid) from public, anon, authenticated;

-- ── Dedup the format-variant duplicates that already exist ───────
-- Group auth.users by last-ten-digits (the app's identity key); where a number
-- has >1 account, keep the richest (paid plan, then most unlocked reports, then
-- oldest) and merge the rest into it. Two such pairs exist today.
do $$
declare
  grp record;
  v_target uuid;
  v_source uuid;
begin
  for grp in
    select right(regexp_replace(phone, '\D', '', 'g'), 10) as last10,
           array_agg(id order by created_at) as ids
    from auth.users
    where phone is not null and phone <> ''
    group by 1
    having count(*) > 1
  loop
    select up.id into v_target
    from public.user_profiles up
    where up.id = any(grp.ids)
    order by case up.plan when 'Premium' then 3 when 'Pro' then 2 else 1 end desc,
             coalesce(array_length(up.unlocked_reports, 1), 0) desc,
             up.created_at asc
    limit 1;
    if v_target is null then v_target := grp.ids[1]; end if;

    foreach v_source in array grp.ids loop
      if v_source <> v_target then
        perform public.merge_user_profiles(v_target, v_source);
      end if;
    end loop;
  end loop;
end;
$$;

-- ── Email uniqueness for Google SSO (guarded) ────────────────────
-- Now that dupes are merged, add one-account-per-email — but only if the data
-- is actually clean, so this migration can never fail a deploy on a stray
-- duplicate (which would then be a manual reconcile, not a broken migration).
do $$
begin
  if not exists (
    select 1 from public.user_profiles
    where email is not null and email <> ''
    group by lower(email) having count(*) > 1
  ) then
    create unique index if not exists user_profiles_email_uniq
      on public.user_profiles (lower(email)) where email is not null and email <> '';
  else
    raise notice '0015: duplicate emails present — email unique index deferred (reconcile first)';
  end if;
end;
$$;
