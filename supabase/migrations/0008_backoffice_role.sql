-- ════════════════════════════════════════════════════════════════
-- 0008 — BACKOFFICE ROLE
--
-- 0003 removed anon write access from the product tables, because the
-- anon key ships in the public bundle and anyone holding it could have
-- run `delete from projects`. That also broke the AI Studio back-office,
-- which writes with the anon key and has no real login to authenticate
-- with.
--
-- The obvious fix is to hand the back-office the service_role key. Don't.
-- service_role bypasses RLS on EVERYTHING: leaked, it reads every
-- customer email and phone in user_profiles, every conversation in
-- chat_sessions, every lead, and can delete any of it.
--
-- This role can rewrite project data and nothing else. Leaked, the damage
-- is product data — bad, visible, and restorable from a backup. It cannot
-- read one customer record.
--
-- HOW IT WORKS. PostgREST reads the `role` claim from the JWT and does
-- SET LOCAL ROLE. A token signed with the project's JWT secret carrying
-- role=backoffice therefore executes as this role, with exactly the
-- grants below. See mint-backoffice-key.mjs for issuing the token.
-- ════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'backoffice') then
    create role backoffice nologin;
  end if;
end $$;

-- PostgREST connects as `authenticator` and switches roles per request;
-- without this grant the switch is refused and every call 500s.
grant backoffice to authenticator;
grant usage on schema public to backoffice;

-- Serial/identity columns need their sequences.
grant usage, select on all sequences in schema public to backoffice;

-- ── Grants + policies, product tables only ──────────────────────
-- RLS still applies (this role is not a superuser and has no BYPASSRLS),
-- so each table needs both a grant and a policy.
do $$
declare t text;
begin
  foreach t in array array[
    'projects',
    'developers',
    'micro_market_data',
    'cagr_defaults',
    'developer_health',
    'backlog_projects',
    'backlog_project_data',
    'project_configurations',
    'project_extended_details',
    'project_3d_intake'
  ] loop
    if to_regclass('public.' || t) is null then
      raise notice 'skipping %, table not present', t;
      continue;
    end if;

    execute format('grant select, insert, update, delete on public.%I to backoffice', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_backoffice', t);
    execute format(
      'create policy %I on public.%I for all to backoffice using (true) with check (true)',
      t || '_backoffice', t);
  end loop;
end $$;

-- ── Explicitly NOT granted ──────────────────────────────────────
-- user_profiles, chat_sessions, contact_leads, payments.
--
-- Omission alone would be enough, but stating it makes the boundary a
-- decision rather than an oversight — and makes it obvious if someone
-- later adds a grant here without thinking about it.
revoke all on public.user_profiles from backoffice;
revoke all on public.chat_sessions from backoffice;
revoke all on public.contact_leads from backoffice;
revoke all on public.payments      from backoffice;


-- ════════════════════════════════════════════════════════════════
-- ISSUING THE KEY
--   node scripts/mint-backoffice-key.mjs
-- It asks for the project's JWT secret (Settings → API → JWT Settings)
-- and prints a token. Use it exactly like the anon key — as both the
-- `apikey` header and the Bearer token.
--
-- VERIFY — with the backoffice token:
--   ✅ writes product data:
--   curl -X PATCH "<URL>/rest/v1/project_extended_details?id=eq.<id>" \
--        -H "apikey: <BO>" -H "Authorization: Bearer <BO>" \
--        -H "content-type: application/json" -d '{"...":"..."}'
--
--   ✅ CANNOT read customers — must return [] or a permission error:
--   curl "<URL>/rest/v1/user_profiles?select=email" \
--        -H "apikey: <BO>" -H "Authorization: Bearer <BO>"
--
-- REVOKING a leaked key: rotating the project JWT secret invalidates it,
-- but also every anon and service_role key. The lighter option is
--   revoke backoffice from authenticator;
-- which disables the role instantly and leaves everything else running.
-- ════════════════════════════════════════════════════════════════
