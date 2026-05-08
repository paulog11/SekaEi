create table assess_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  count   int  not null default 0,
  primary key (user_id, day)
);

alter table assess_usage enable row level security;
-- no policies: deny all for anon/authenticated; service role bypasses RLS

-- Atomic increment; returns new count. Called via service role only.
create or replace function increment_assess_usage(p_user_id uuid, p_day date)
returns int
language plpgsql
security definer
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
