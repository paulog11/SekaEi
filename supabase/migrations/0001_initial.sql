create table users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text unique,
  display_name text
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  passage_id text not null,
  passage_title text not null,
  created_at timestamptz not null default now(),
  accuracy_score smallint not null,
  fluency_score smallint not null,
  completeness_score smallint not null,
  prosody_score smallint,
  overall_score smallint not null
);

create index attempts_user_passage_idx on attempts (user_id, passage_id, created_at desc);
create index attempts_user_created_idx on attempts (user_id, created_at desc);

alter table users enable row level security;
alter table attempts enable row level security;

create policy users_self_read on users for select using (auth.uid() = id);
create policy users_self_update on users for update using (auth.uid() = id);

create policy attempts_owner_all on attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
