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
-- ISSUING THE KEY — IN THE SQL EDITOR, no local machine needed
--
-- All of this project's code lives on GitHub with no local checkout, so
-- the node script is the secondary route. Postgres can mint the token
-- itself: a JWT is base64url(header).base64url(payload).base64url(HMAC),
-- and pgcrypto already provides the HMAC.
--
--   create extension if not exists pgcrypto with schema extensions;
--
--   with s as (select 'PASTE_JWT_SECRET_HERE'::text as secret),
--   parts as (
--     select
--       translate(replace(encode(convert_to('{"alg":"HS256","typ":"JWT"}','utf8'),
--         'base64'), E'\n',''), '+/=', '-_') as h,
--       translate(replace(encode(convert_to(json_build_object(
--           'role','backoffice',
--           'iss','supabase',
--           'iat',(extract(epoch from now()))::int,
--           'exp',(extract(epoch from now() + interval '5 years'))::int
--         )::text,'utf8'), 'base64'), E'\n',''), '+/=', '-_') as p
--   )
--   select parts.h||'.'||parts.p||'.'||
--     translate(replace(encode(extensions.hmac(parts.h||'.'||parts.p, s.secret, 'sha256'),
--       'base64'), E'\n',''), '+/=', '-_') as backoffice_key
--   from parts, s;
--
-- Three details that are load-bearing, not incidental:
--   • replace(..., E'\n', '')  — encode() wraps base64 at 76 chars, and a
--     newline inside a JWT segment makes the token silently invalid.
--   • translate(..., '+/=', '-_')  — base64 → base64url. The '=' has no
--     counterpart in the target, which is how translate() DELETES it;
--     padding is not allowed in a JWT.
--   • the secret goes in the query text, so DELETE THE SAVED SNIPPET
--     afterwards — the SQL editor keeps query history.
--
-- Alternative, if you have a local checkout:
--   node scripts/mint-backoffice-key.mjs
-- It reads the secret from a hidden prompt instead, so it never reaches
-- shell history.
--
-- Either way, use the key exactly like the anon key — as both the
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
