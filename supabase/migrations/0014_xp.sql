create table user_xp (
  user_id    uuid not null primary key references auth.users(id) on delete cascade,
  total      int  not null default 0,
  updated_at timestamptz not null default now()
);

alter table user_xp enable row level security;

create policy "user_xp: own row" on user_xp
  for select using (auth.uid() = user_id);

-- No insert/update policies: writes go through add_xp via the service role.

-- Atomic upsert-increment; returns new total. Called via service role only.
create or replace function add_xp(p_user_id uuid, p_amount int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_total int;
begin
  insert into user_xp (user_id, total, updated_at)
    values (p_user_id, p_amount, now())
    on conflict (user_id)
    do update set total = user_xp.total + p_amount, updated_at = now()
    returning total into new_total;
  return new_total;
end;
$$;

revoke execute on function add_xp(uuid, int) from public, anon, authenticated;

create table user_badges (
  user_id   uuid not null references auth.users(id) on delete cascade,
  badge_id  text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table user_badges enable row level security;

create policy "user_badges: own rows" on user_badges
  for select using (auth.uid() = user_id);

-- No insert policy: writes go through the service client, which bypasses RLS.
