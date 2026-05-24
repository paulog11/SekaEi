# `stores/`

Pinia setup stores (`defineStore('id', () => { ... })`) — one per feature. Auto-imported by Nuxt. See [docs/architecture.md](../../docs/architecture.md) for the bigger picture.

Most stores cache server data behind a TTL and expose a `fetchX({ force })` action; mutations invalidate the cache so the next read re-validates. Many also expose `reset()` for the auth-plugin to wipe state on sign-out.

## Stores

| File | TTL | Persists to | Key state | Notes |
|---|---|---|---|---|
| `authStore.ts` | (live) | — | `isLoggedIn`, `isApproved` (tri-state `null \| true \| false`), `tier` | `null` means "not yet checked" — guards must wait. `refreshApproval()` reads `/api/me`. |
| `historyStore.ts` | 5 min | — | `attempts` + per-passage sub-cache | `addAttempt()` cascades invalidation to `streakStore` + `phonemeStatsStore`. |
| `streakStore.ts` | 5 min | — | `streak` (`current`, `longest`, `goalMinutes`, `todayMet`) | Invalidated by `historyStore.addAttempt`. |
| `phonemeStatsStore.ts` | 10 min | — | `weakest`, `strongest` (server pre-sorted, top-10 each) | Invalidated by `historyStore.addAttempt`. |
| `flaggedWordsStore.ts` | 5 min | — | `words`, `flaggedSet` | Cache keyed by `status` filter; switching filters forces refetch. Optimistic flag/unflag. |
| `customPassagesStore.ts` | 10 min | — | `items` | `addPassage` / `deletePassage` update in-place and refresh `fetchedAt`. |
| `idiomLabStore.ts` | (in-memory only) | — | `currentPackIndex`, `currentIndex`, `hasGuessedCorrectly`, `selectedAnswer` | `shuffledOptions` re-shuffles per challenge. Image-based variants kept commented for future use. |
| `tutorialStore.ts` | (loaded once) | localStorage + `profiles.tutorial_completed_at` | `completed`, `active`, `currentStep` | localStorage is the durable signal so a completed tour never re-shows even if `/api/me` is slow. |

## Conventions

- **Setup syntax only.** No `state: () => ({})` options syntax.
- **TTL cache pattern.** Use `fetchedAt: ref<number | null>(null)` + `isStale()` helper; expose `invalidate()` and `reset()`.
- **Mutations invalidate.** Any action that changes server state should invalidate its own cache (and any dependent store's cache).
- **`reset()` on every store.** The `auth-state.client.ts` plugin calls `reset()` on each per-user store when the user signs out or switches accounts. Without it, the previous user's data leaks into the next session.
- **No Supabase imports.** Stores fetch via `useApi()` from `~/composables/useApi`.
