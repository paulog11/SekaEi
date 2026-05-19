-- Remove automatic retirement from upsert_flagged_word.
-- Words now stay active until the user explicitly archives them.
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
    last_seen         = now();
end;
$$;
