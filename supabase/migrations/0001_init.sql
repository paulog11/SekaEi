-- Drop old dormant tables if they exist (never ran against real DB)
drop table if exists attempts cascade;
drop table if exists users cascade;

-- Profiles (1-1 with auth.users)
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at  timestamptz not null default now()
);

-- Attempts
create table attempts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users on delete cascade,
  passage_id          text not null,
  passage_title       text not null,
  accuracy_score      int not null,
  fluency_score       int not null,
  completeness_score  int not null,
  prosody_score       int,
  overall_score       int not null,
  azure_result        jsonb,
  created_at          timestamptz not null default now()
);

create index attempts_user_date   on attempts (user_id, created_at desc);
create index attempts_user_passage on attempts (user_id, passage_id, created_at desc);

-- Custom passages saved by users
create table custom_passages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  title      text not null,
  text       text not null,
  ipa        jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, title)
);

-- Daily streaks (one row per user)
create table daily_streaks (
  user_id           uuid primary key references auth.users on delete cascade,
  current_streak    int not null default 0,
  longest_streak    int not null default 0,
  last_practice_date date,
  daily_goal_minutes int not null default 5
);

-- Per-phoneme rolling stats
create table phoneme_stats (
  user_id        uuid not null references auth.users on delete cascade,
  phoneme        text not null,
  attempts_count int not null default 0,
  score_sum      int not null default 0,
  last_seen      timestamptz not null default now(),
  primary key (user_id, phoneme)
);

-- Device claim table for anonymous-to-auth migration
create table device_claims (
  device_id  uuid primary key,
  user_id    uuid references auth.users on delete cascade,
  claimed_at timestamptz
);
