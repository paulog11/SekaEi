create type approval_status as enum ('pending', 'approved', 'rejected');

alter table profiles
  add column approval_status approval_status not null default 'pending',
  add column approval_token  uuid not null default gen_random_uuid(),
  add column approval_decided_at timestamptz,
  add column approval_decided_by text;

create index profiles_pending_idx on profiles (approval_status) where approval_status = 'pending';
create unique index profiles_approval_token_idx on profiles (approval_token);

-- Backfill: mark all existing users as approved so nobody gets locked out on deploy.
update profiles set
  approval_status = 'approved',
  approval_decided_at = now(),
  approval_decided_by = 'backfill';
