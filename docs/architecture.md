# SekaEi — Architecture & Directory Guide

This document is the single reference for where things live and why. It is written for a human contributor getting oriented in the codebase. For setup instructions, see [README.md](../README.md). For AI/agent context and file-level detail, see [CLAUDE.md](../CLAUDE.md).

---

## What is SekaEi?

SekaEi is an English learning web app aimed at Japanese university students. It has two tracks:

1. **Pronunciation Practice** — the user reads a passage aloud; the app returns per-word and per-phoneme accuracy scores powered by Azure AI Speech.
2. **Real English (Idioms & Slang)** — an idiom quiz where a literal image is shown and the user picks the figurative meaning from a 2×2 image grid. (Work in progress.)

Access is invite-only: users sign up, then an admin approves their account before they can use the app.

---

## Request lifecycle

```
Browser                          Nuxt/Nitro server          Azure
───────                          ─────────────────          ─────
getUserMedia (mic only)
  └─ AudioContext + Worklet ──► 16 kHz mono WAV Blob
                                  POST /api/assess ────────► Azure Speech SDK
                                                  ◄────────── NBest[0].Words[].Phonemes[]
ScoreDisplay renders results
```

The Azure subscription key **never leaves the server**. The browser sends audio to `/api/assess` (your own Nitro endpoint), which proxies to Azure.

---

## Auth & approval model

Every protected route checks two things: (1) the user is logged in, and (2) their `profiles.approval_status = 'approved'`. This is layered defence-in-depth:

| Layer | When it runs |
|---|---|
| Reactive store guard (`auth-state.global.ts`) | Every navigation; redirects on definitive `false`, waits on `null` |
| Inline query guard (`auth.global.ts`) | Every navigation; primary hydration-window guard |
| Boot plugin (`auth-state.client.ts`) | Client boot; seeds auth state before first navigation |
| Post-hydration watcher (`approval-guard.client.ts`) | Client boot; re-checks approval once session restores |
| Server enforcement (`server/utils/approval.ts`) | Every API call; throws 403 if unapproved |

**Redirect targets:** unauthenticated → `/account`; authenticated but unapproved → `/pending`.

---

## Directory map

### Root-level files

`nuxt.config.ts` · `tailwind.config.ts` · `tsconfig.json` · `vitest.config.ts` · `package.json` · `.env.example` — project config. `app.vue` is the root Nuxt layout (wraps every page with `<NuxtPage>`).

---

### `pages/`

File-based routes (Nuxt convention — one `.vue` file = one URL):

- Public auth pages: `/account` (sign in/up), `/confirm`, `/reset`, `/pending`, `/dev-only`
- Pronunciation track: `/practice` (passage picker + recorder), `/practice/words` (word drill), `/attempt/[id]` (attempt detail)
- Idioms track: `/idiomslang`

---

### `components/`

Reusable Vue components, all at the top level (no subfolders). These are auto-imported by Nuxt. Scope: UI building blocks only — no API calls, no Pinia stores defined here. Examples: `Recorder.vue`, `ScoreDisplay.vue`, `WordChip.vue`, `IdiomLabView.vue`, `CoachCard.vue`, `BottomTabBar.vue`.

---

### `composables/`

`useX()` functions — reactive logic that can be shared across pages and components. Auto-imported by Nuxt. Two categories:

- **Browser/device**: `useRecorder` (mic + AudioWorklet state machine), `useWavEncoder` (Float32 → WAV), `useTextToSpeech`, `useVoicePreference`, `useInstallPrompt`
- **Read-models**: `useHistory`, `useProgress`, `useStreak`, `usePhonemeStats`, `useFlaggedWords`, `useCustomPassages`, `useCoach`, `useApi` (typed `$fetch` wrapper)

Composables handle data fetching and browser API wiring. State that must persist across route changes or be shared between unrelated components lives in `stores/` instead.

See [composables/README.md](../composables/README.md) for the full table.

---

### `stores/`

Pinia setup stores — one per feature. All use the `defineStore('id', () => { ... })` syntax. Auto-imported by Nuxt. These hold client state that outlives a single component: `authStore`, `historyStore`, `streakStore`, `phonemeStatsStore`, `flaggedWordsStore`, `customPassagesStore`, `idiomLabStore`, `tutorialStore`.

See [stores/README.md](../stores/README.md) for the full table (TTLs, dependencies, conventions).

---

### `middleware/`

Nuxt route middleware — runs on every navigation (`.global.ts` suffix) or when a page opts in. Contains the two auth/approval guards (`auth.global.ts`, `auth-state.global.ts`) and a stage-gate middleware (`stage.ts`).

---

### `plugins/`

Nuxt client-only plugins that execute once at browser boot, before any navigation. Currently two: `auth-state.client.ts` (seeds the auth store from the live Supabase session) and `approval-guard.client.ts` (re-checks approval status once the session is restored after a hard reload).

---

### `server/`

Everything under `server/` runs server-side only in Nitro. The Azure subscription key and Supabase service-role key are available here and **nowhere else** in the codebase.

#### `server/api/`

HTTP route handlers, file-based (Nuxt/Nitro convention). The filename encodes the method: `assess.post.ts`, `attempts.get.ts`, etc. Route groups: `assess`, `attempts`, `me`, `flagged-words`, `passages`, `stats`, `coach`, `synthesize`, `devices`, `admin`.

Every handler that touches user data calls `requireApprovedUser(event)` from `server/utils/approval.ts` before doing anything else.

See [server/api/README.md](../server/api/README.md) for the full endpoint table (method, path, auth, limits).

#### `server/utils/`

Server-only helpers — never imported from client code. Contains: `azure.ts` (Azure Speech SDK invocation), `supabase.ts` / `supabaseService.ts` (Supabase clients), `approval.ts` (`requireApprovedUser`), `coach.ts`, `claimDevice.ts`, and fire-and-forget side-effect utilities (`updateStreak.ts`, `updatePhonemeStats.ts`, `flagDifficultWords.ts`).

See [server/utils/README.md](../server/utils/README.md) for the full helper table.

---

### `types/`

Shared TypeScript types — no runtime code, only `interface` / `type` declarations. Covers: `assessment.ts` (Azure response shapes), `passages.ts`, `idioms.ts`, `flaggedWord.ts`, `tutorial.ts`, `voices.ts`, `database.types.ts` (Supabase-generated DB schema, regenerate with `pnpm dlx supabase gen types typescript`), and ambient `.d.ts` declarations.

---

### `utils/`

Pure, isomorphic helpers safe to import from both browser and server code. Currently contains only `contentFilter.ts` (display-name profanity check). Keep this folder narrow — server-specific logic belongs in `server/utils/`.

---

### `mocks/`

Hard-coded seed data used at **runtime** (not test fixtures). Currently `mockIdioms.ts` — 3 seed idiom challenges. This folder will shrink as real content moves to the database or a CMS.

---

### `assets/`

Build-pipeline assets processed by Vite. Contains `assets/css/tailwind.css` (Tailwind entry file with `@layer components` custom classes) and the favicon SVG source. Do not serve files from here directly — use `public/` for that.

---

### `public/`

Static files served as-is from the web root (no bundling). Notable: `worklets/pcm-capture.js` must live here because `AudioWorklet.addModule()` requires a raw URL, not a bundled module. Also holds: PWA manifest, app icons, and idiom images under `public/images/idioms/`.

---

### `supabase/`

Database-as-code for the Supabase backend:

- `config.toml` — local Supabase dev environment config
- `migrations/` — numbered SQL files that are the **source of truth for the database schema**. Apply in order. Never edit an already-applied migration; add a new one instead. See [supabase/migrations/README.md](../supabase/migrations/README.md) for the migration log.
- `functions/send-approval-email/` — a Supabase Edge Function that emails a user when their account is approved.

---

### `tests/`

Vitest unit tests.

- `tests/unit/` — mirrors the source layout (`assess.post.test.ts` tests `server/api/assess.post.ts`, etc.). All tests run in Node unless they opt in with `// @vitest-environment happy-dom`.
- `tests/fixtures/` — shared mock helpers: `makeChain()` (chainable Supabase mock), `stubNitroGlobals()`, and a typed Azure result builder.

No e2e or integration test tier exists yet.

---

### `.github/`

GitHub Actions config. CI (`ci.yml`) runs `pnpm typecheck` and `pnpm test` on every push and PR to `master`.

---

### Build artifacts (ignore)

`.nuxt/`, `.output/`, `node_modules/` — generated by the build/install process. Never commit, never edit.

---

## Conventions

| Convention | Rule |
|---|---|
| Styling | Tailwind CSS only. Custom classes go in `assets/css/tailwind.css` under `@layer components`. No component libraries without explicit approval. |
| State management | Pinia setup stores (`defineStore('id', () => { ... })`). |
| Secrets | Server-only via `runtimeConfig` in `nuxt.config.ts`. Never `runtimeConfig.public`. |
| TypeScript | Strict mode. All new files must pass `vue-tsc --noEmit`. |
| Tests | `tests/unit/**/*.test.ts`. Mock `~/server/utils/approval` (not `useSupabaseUser`) in API handler tests. |
| Composables/stores outside Nuxt | Explicitly import `{ ref, computed, watch }` from `vue` — Nuxt auto-imports don't work in Vitest. |

---

## Where to add new code

| What you're adding | Where it goes |
|---|---|
| New page / route | `pages/` |
| New UI component | `components/` |
| New reactive logic or data-fetching hook | `composables/` |
| New client-side feature state | `stores/` |
| New API endpoint | `server/api/` (remember to call `requireApprovedUser`) |
| New server-only helper | `server/utils/` |
| New shared TypeScript type | `types/` |
| New isomorphic pure utility | `utils/` |
| Database schema change | New migration file in `supabase/migrations/` |
| Tests | `tests/unit/` mirroring the source path |

---

## Related documents

- [README.md](../README.md) — setup and getting started
- [CLAUDE.md](../CLAUDE.md) — detailed file-level notes and constraints for AI/agents
- [FUTURE.md](../FUTURE.md) — out-of-scope items and deferred work
