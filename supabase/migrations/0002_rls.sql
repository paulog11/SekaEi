-- Enable RLS on all user-scoped tables
alter table profiles        enable row level security;
alter table attempts        enable row level security;
alter table custom_passages enable row level security;
alter table daily_streaks   enable row level security;
alter table phoneme_stats   enable row level security;

-- profiles
create policy "profiles: own row" on profiles
  for all using (auth.uid() = id);

-- attempts
create policy "attempts: own rows" on attempts
  for all using (auth.uid() = user_id);

-- custom_passages
create policy "custom_passages: own rows" on custom_passages
  for all using (auth.uid() = user_id);

-- daily_streaks
create policy "daily_streaks: own row" on daily_streaks
  for all using (auth.uid() = user_id);

-- phoneme_stats
create policy "phoneme_stats: own rows" on phoneme_stats
  for all using (auth.uid() = user_id);

-- device_claims is service-role only — no RLS policies for anon/authenticated
