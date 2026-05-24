# `supabase/migrations/`

Numbered SQL files = the source of truth for the database schema. Applied in lexical order by the Supabase CLI. See [docs/architecture.md](../../../docs/architecture.md) for the bigger picture.

## Rules

- **Never edit a migration that has already been applied** (to staging or prod). Add a new one instead — even for a single-column rename or a tweak to a function body.
- **One concern per migration.** Easier to read, easier to revert.
- **Numbering is `NNNN_short_name.sql`** (4 digits, snake_case). Duplicate numbers exist for historical reasons (early parallel branches); new migrations must use the next unused number.
- **Regenerate types after schema changes:**
  ```bash
  pnpm dlx supabase gen types typescript --project-id <id> > types/database.types.ts
  ```

## Log

| # | File | What it changed |
|---|---|---|
| 0001 | `0001_init.sql` | Dropped dormant pre-history tables; created the real `profiles` schema. |
| 0001 | `0001_initial.sql` | Early parallel branch: bare `users` table — superseded by `0001_init.sql`. |
| 0002 | `0002_rls.sql` | Enabled RLS on all user-scoped tables (`profiles`, `attempts`, `custom_passages`, `daily_streaks`, ...). |
| 0003 | `0003_custom_passages_category.sql` | Added `custom_passages.category` (enum: movies-tv / speeches / idioms / custom). |
| 0003 | `0003_triggers.sql` | `handle_new_user()` trigger — auto-creates a `profiles` row on auth signup. |
| 0004 | `0004_assess_usage.sql` | `assess_usage` table for per-user daily quota tracking. |
| 0004 | `0004_attempt_slug.sql` | Added `attempts.slug` for shareable short URLs; backfilled existing rows. |
| 0005 | `0005_difficult_words.sql` | `flagged_words` table for the per-user difficult-word collection. |
| 0006 | `0006_approval_status.sql` | `profiles.approval_status` enum + `approval_token` for the email-link approve/reject flow. |
| 0007 | `0007_tutorial_completed.sql` | Added `profiles.tutorial_completed_at`. |
| 0008 | `0008_no_auto_retire.sql` | Removed auto-retirement from `upsert_flagged_word`; words now stay active until the user archives. |
| 0009 | `0009_university.sql` | Added `profiles.university` (optional). |
| 0010 | `0010_invite_codes_and_tier.sql` | Added `profiles.tier` (`public` / `attendee`) + invite-code redemption RPC. |

## Local dev

Apply migrations against a local Supabase stack:

```bash
supabase start          # one-time, brings up the local stack
supabase db reset       # re-applies every migration cleanly (DESTRUCTIVE)
```

See `supabase/config.toml` for local settings, including `enable_confirmations` (currently off for dev — see `FUTURE.md` for the revert checklist).
