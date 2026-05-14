-- Flagged words: per-user collection of difficult words for focused drill
create table flagged_words (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  word              text not null,        -- normalized: lowercase, punctuation stripped
  display_word      text not null,        -- original casing from Azure
  ipa               text,
  source_passage_id text,
  source            text not null check (source in ('auto', 'manual')),
  attempts_count    int  not null default 1,
  last_score        int  not null,
  lowest_score      int  not null,
  best_score        int  not null,
  weak_phonemes     jsonb,               -- [{ph, heard, score}]
  retired_at        timestamptz,
  last_seen         timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  unique (user_id, word)
);

create index flagged_words_user_active
  on flagged_words (user_id, last_seen desc)
  where retired_at is null;

alter table flagged_words enable row level security;

create policy "flagged_words: own rows" on flagged_words
  for all using (auth.uid() = user_id);

-- Atomic upsert: insert or increment, auto-retires when best_score >= 85 AND attempts >= 3.
-- Called via service role only (security definer bypasses RLS).
create or replace function upsert_flagged_word(
  p_user_id        uuid,
  p_word           text,
  p_display_word   text,
  p_score          int,
  p_source         text,
  p_passage_id     text,
  p_ipa            text,
  p_weak_phonemes  jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_best  int;
  v_new_low   int;
  v_new_count int;
begin
  insert into flagged_words (
    user_id, word, display_word, ipa, source_passage_id, source,
    attempts_count, last_score, lowest_score, best_score,
    weak_phonemes, last_seen
  ) values (
    p_user_id, p_word, p_display_word, p_ipa, p_passage_id, p_source,
    1, p_score, p_score, p_score,
    p_weak_phonemes, now()
  )
  on conflict (user_id, word) do update set
    display_word      = p_display_word,
    ipa               = coalesce(p_ipa, flagged_words.ipa),
    source_passage_id = coalesce(p_passage_id, flagged_words.source_passage_id),
    source            = case when p_source = 'manual' then 'manual' else flagged_words.source end,
    attempts_count    = flagged_words.attempts_count + 1,
    last_score        = p_score,
    lowest_score      = least(flagged_words.lowest_score, p_score),
    best_score        = greatest(flagged_words.best_score, p_score),
    weak_phonemes     = coalesce(p_weak_phonemes, flagged_words.weak_phonemes),
    last_seen         = now(),
    -- retire only when conditions met and not already retired
    retired_at        = case
      when flagged_words.retired_at is null
           and greatest(flagged_words.best_score, p_score) >= 85
           and (flagged_words.attempts_count + 1) >= 3
      then now()
      else flagged_words.retired_at
    end
  returning best_score, lowest_score, attempts_count
  into v_new_best, v_new_low, v_new_count;
end;
$$;

-- Coach usage quota: per-user daily cap (mirrors assess_usage)
create table coach_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  count   int  not null default 0,
  primary key (user_id, day)
);

alter table coach_usage enable row level security;
-- no policies: deny all for anon/authenticated; service role bypasses RLS

create or replace function increment_coach_usage(p_user_id uuid, p_day date)
returns int
language plpgsql
security definer
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
