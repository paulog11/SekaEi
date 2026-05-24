# `server/utils/`

Server-only helpers. Never import from client code (`pages/`, `components/`, `composables/`, `stores/`) — these files use Node-only APIs and assume the server runtime config / environment. See [docs/architecture.md](../../docs/architecture.md) for the bigger picture.

## What's here

| File | Purpose | Notes |
|---|---|---|
| `approval.ts` | Auth + tier guards (`requireApprovedUser`, `requireAccess`, `getUserTier`). | Call as the first line of any protected handler. |
| `tierLimits.ts` | Per-tier quotas (`assessDaily`, `coachDaily`, `canAddCustomPassages`). | Edit here to change what each tier can do. |
| `supabase.ts` | Per-request RLS-respecting Supabase client + bearer-token user resolver. | Default for handler-side DB access. |
| `supabaseService.ts` | Service-role Supabase client — bypasses RLS. | Trusted flows only. Never user-driven paths. |
| `azure.ts` | Azure Speech SDK wrapper: `runPronunciationAssessment` + `synthesizeSpeech`. | Provider-swap point. WAV header stripped before push. |
| `coach.ts` | Anthropic-backed coach reply generator. | Fixed system prompt → prompt-cache hits. Safe JSON fallbacks. |
| `flagDifficultWords.ts` | Fire-and-forget background job: flag words scoring <60. | Errors swallowed — must never block the response. |
| `updateStreak.ts` | Pure streak math (`computeStreak`). | Uses `YYYY-MM-DD` strings to dodge timezone drift. |
| `updatePhonemeStats.ts` | Pure phoneme-stats delta extractor. | Caller merges into the persisted totals. |
| `claimDevice.ts` | Links a pre-signup device id to a user; reattributes anonymous attempts. | Idempotent. |

## Conventions

- **Server-only.** If you're tempted to import from `server/utils/` in a `composables/` or `stores/` file, you're crossing the trust boundary. Add a server API endpoint instead.
- **Pure where possible.** `computeStreak`, `extractPhonemeDelta`, and `normalizeWord` are pure functions — covered by tests in `tests/unit/`. Side-effecting helpers (DB writes, Azure calls) live alongside them but are clearly marked.
- **Fire-and-forget never throws.** `flagDifficultWordsSilently`, the inline `updateStreakSilently`/`updatePhonemeStatsSilently` in `attempts.post.ts` — all swallow errors. The user-visible request must not fail because a background side effect failed.
- **Secrets via `useRuntimeConfig()`**, never `process.env` directly in handlers (some helpers here read `process.env` because Supabase clients need URLs at module init time — fine for that case).
