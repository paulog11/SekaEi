-- device_claims was created without RLS (0001_init.sql) and 0002_rls.sql only
-- left a comment claiming it was "service-role only" — it was never enabled.
-- Supabase grants ALL on public tables to anon/authenticated by default, so
-- this device_id -> user_id map was fully readable/writable by anyone holding
-- the (client-side) anon key.
alter table device_claims enable row level security;

create policy "device_claims: own rows" on device_claims
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 0012_auto_approve_new_users.sql set tier's default to 'attendee' alongside
-- approval_status's default to 'approved'. That means every signup — with
-- email confirmation currently off — gets the metered paid tier (60
-- assessments/day, 20 coach calls/day) for free, and makes invite codes a
-- no-op. Revert tier only; approval auto-approve stays as-is (product call).
alter table profiles alter column tier set default 'public';

-- SECURITY DEFINER functions bypass RLS and should pin search_path to guard
-- against search-path hijacking (standard Postgres/Supabase-linter hardening).
-- upsert_flagged_word already does this; these four did not.

create or replace function increment_assess_usage(p_user_id uuid, p_day date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into assess_usage (user_id, day, count)
    values (p_user_id, p_day, 1)
    on conflict (user_id, day)
    do update set count = assess_usage.count + 1
    returning count into new_count;
  return new_count;
end;
$$;

create or replace function increment_coach_usage(p_user_id uuid, p_day date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into coach_usage (user_id, day, count)
    values (p_user_id, p_day, 1)
    on conflict (user_id, day)
    do update set count = coach_usage.count + 1
    returning count into new_count;
  return new_count;
end;
$$;

create or replace function redeem_invite_code(p_code text, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row invite_codes%ROWTYPE;
begin
  -- Lock the code row so concurrent calls don't over-redeem
  select * into v_row from invite_codes where code = p_code for update;
  if not found then
    raise exception 'code_not_found';
  end if;
  if v_row.expires_at is not null and v_row.expires_at < now() then
    raise exception 'code_expired';
  end if;
  if v_row.max_uses is not null and v_row.use_count >= v_row.max_uses then
    raise exception 'code_exhausted';
  end if;

  -- Idempotent: if already attendee, return false without double-counting
  if (select tier from profiles where id = p_user_id) = 'attendee' then
    return false;
  end if;

  update invite_codes set use_count = use_count + 1 where code = p_code;
  update profiles set tier = 'attendee' where id = p_user_id;
  return true;
end;
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;
