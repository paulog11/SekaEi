# CLAUDE.md — SekaToku

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## What this app is

SekaToku is an English learning tool whose audience is Japanese university students. It currently has two tracks:

1. **Pronunciation Practice** — a user reads a passage aloud; the app returns per-word and per-phoneme accuracy scores powered by Azure AI Speech Pronunciation Assessment.
2. **Idioms & Slang** — (This is a work in progress) an idiom/slang quiz. A literal image is shown; the user picks the figurative meaning from a 2×2 image grid.

---

## Core intent and constraints

- **Azure key must stay server-side.** The key lives in `runtimeConfig` (Nitro), never in `runtimeConfig.public`. Never move it to the client bundle.
- **Styling: Tailwind CSS.** The project uses `@nuxtjs/tailwindcss` (v3). Token config lives in `tailwind.config.ts`; the component layer (`@layer components`) is in `assets/css/tailwind.css`. When touching a component, migrate its `<style scoped>` to Tailwind utilities. Do not introduce a separate component library (shadcn, etc.) without being asked.
- **TypeScript strict.** All new files must pass `vue-tsc --noEmit` in strict mode.
- **State management: Pinia.** Feature-level state lives in `stores/`. Use the Vue 3 setup store syntax (`defineStore('id', () => { ... })`).

---

## Architecture

```
Browser                          Nuxt/Nitro server          Azure
───────                          ─────────────────          ─────
getUserMedia (mic only)
  └─ AudioContext + Worklet ──► 16 kHz mono WAV Blob
                                  POST /api/assess ────────► Azure Speech SDK
                                                  ◄────────── NBest[0].Words[].Phonemes[]
ScoreDisplay renders results
```

### Audio capture

`AudioContext (16 kHz)` + `AudioWorkletNode ('pcm-capture-processor')` → Float32 PCM chunks → `useWavEncoder` assembles a 16-bit PCM WAV → uploaded to `/api/assess`.

The worklet is served from `public/worklets/pcm-capture.js` (static asset, loaded via `audioContext.audioWorklet.addModule()`).

### Azure call shape

`server/utils/azure.ts` runs:

```
SpeechConfig.fromSubscription(key, region)
PushAudioInputStream (format: 16kHz 16-bit mono PCM) ← WAV bytes with header stripped
PronunciationAssessmentConfig(referenceText, HundredMark, Phoneme granularity, miscue+prosody)
SpeechRecognizer.recognizeOnceAsync()
→ JSON.parse(SpeechServiceResponse_JsonResult)
→ return NBest[0]  // { PronunciationAssessment, Words[], recognizedText }
```

The WAV header (44 bytes) is stripped before writing to the PushStream because the format is provided explicitly via `AudioStreamFormat.getWaveFormatPCM`.

---

## Key files and their roles

### Pronunciation track

| File | Purpose |
|------|---------|
| `server/utils/azure.ts` | Azure SDK invocation. Change here to swap pronunciation providers. |
| `server/api/assess.post.ts` | Nitro POST handler. Reads `audio` (WAV) and `referenceText` from multipart form. |
| `composables/useRecorder.ts` | `getUserMedia` (mic only), AudioContext wiring, state machine (`idle → recording → stopped`). |
| `composables/useWavEncoder.ts` | Accepts `Float32Array` + source sample rate → returns 16 kHz mono WAV `Blob`. Downsamples if needed. |
| `public/worklets/pcm-capture.js` | `AudioWorkletProcessor`. Slices input buffer and posts `{ type: 'pcm', data: Float32Array }` to main thread. |
| `components/Recorder.vue` | Microphone recording UI; wires recorder state to the record/stop controls. |
| `components/WordChip.vue` | Colour-coded word badge. Green ≥80, amber 60–79, red <60. Phoneme breakdown in popover on tap/hover. |
| `components/ScoreDisplay.vue` | Overall score cards (Accuracy, Fluency, Completeness, Prosody, Overall) + word grid + diff view. |
| `pages/practice.vue` | Passage selector (radio cards) + freeform textarea. Wires Recorder → assess → ScoreDisplay. |
| `types/assessment.ts` | `AzureWord`, `AzurePhoneme`, `AssessmentResult` — shape returned by `/api/assess`. |
| `types/passages.ts` | `Passage` interface + `SAMPLE_PASSAGES` array (Interstellar, The Great Dictator, Rocky Balboa). |

### Real English track

| File | Purpose |
|------|---------|
| `types/idioms.ts` | `IdiomChallenge` interface — `id`, `phrase`, `literalImageUrl`, `figurativeImageUrl`, `distractorImageUrls`, `audioUrl?`, `explanation`. |
| `mocks/mockIdioms.ts` | `MOCK_IDIOMS: IdiomChallenge[]` — 3 seed entries (Cold feet, Break a leg, Bite the bullet) using `placehold.co` URLs. Replace with real image paths under `public/images/idioms/` as assets are added. |
| `stores/idiomLabStore.ts` | Pinia store. Manages `currentIndex`, `hasGuessedCorrectly`, `selectedAnswer`. Computes `currentChallenge` and `shuffledOptions` (Fisher-Yates on figurative + distractors). Actions: `submitAnswer`, `nextChallenge`. |
| `components/IdiomLabView.vue` | Split-screen UI: literal image + blurred phrase on left; 2×2 option grid on right. Phrase revealed only after "Play Audio" is clicked. Correct answer → green border + checkmark + explanation card. Wrong answer → red border + ✗. |
| `pages/idiomslang.vue` | Route `/idiomslang`. Renders `<IdiomLabView />`. |
| `public/images/idioms/` | Static image assets for idiom challenges. Target: WebP, 800×800px, <150 KB per image. |

### Gamification (World Journey)

XP is awarded server-side in `server/api/attempts.post.ts` via the service-role `add_xp` RPC (clients have no direct write access to `user_xp`). Levels/ranks are static in `types/levels.ts` — a soft path (8 levels, nothing gated); each level's `passageIds` are recommendations only. Passport stamps are derived client-side from existing attempt history/stars, not persisted. Badges are lazily computed and awarded on `GET /api/badges` — no separate cron/job.

| File | Purpose |
|------|---------|
| `types/levels.ts` | `LevelDef` + static `LEVELS` array (8 ranks, Tokyo → Honolulu → … → Paris → Tokyo), each with recommended `passageIds`. `levelForXp` / `levelProgress` helpers. |
| `types/badges.ts` | `BadgeDef` + static `BADGES` registry (streaks, attempt counts, first mastery, phoneme mastery). No award logic here. |
| `supabase/migrations/0014_xp.sql` | `user_xp` table + `add_xp` RPC (atomic upsert-increment, service-role only) + `user_badges` table (own-row select; writes via service client only). |
| `server/utils/xp.ts` | `computeXpAward(overall, priorBestOverall)` — base XP by score tier + first-attempt/mastery-crossing bonuses. |
| `server/utils/badges.ts` | `computeEligibleBadges(data)` — pure eligibility check (streaks, attempts, mastery, `/l//r/` and `θ/ð` phoneme mastery). |
| `server/api/stats/xp.get.ts` | GET /api/stats/xp — current XP total; defaults to 0 with no `user_xp` row. Level derivation stays client-side. |
| `server/api/badges.get.ts` | GET /api/badges — lazy check-and-award: computes eligibility, upserts newly-earned badges via the service client (bypasses RLS), returns all earned badges. |
| `stores/xpStore.ts` | Pinia store; XP total cache (5 min TTL) + `applyAward`/`consumeLastAward` for the practice page's XP toast / level-up modal. |
| `stores/badgesStore.ts` | Pinia store; earned-badges cache (10 min TTL) backed by `GET /api/badges`. |
| `composables/useXp.ts` | Facade over `xpStore` — total/level/progress/lastAward + `fetchXp`/`consumeLastAward`. |
| `composables/useBadges.ts` | Facade over `badgesStore` — earned badges + `fetchBadges`. |
| `components/XpBar.vue` | Rank + city + progress bar toward the next level, from `levelProgress(total)`. |
| `components/LevelUpModal.vue` | Teleport modal shown when an attempt's XP award crosses a level threshold. |
| `components/LevelPath.vue` | Vertical "World Journey" timeline of all 8 levels with their passage stops + stars; emits `select` to open a passage. |
| `components/PassportStamps.vue` | Grid of per-level stamps (emoji per city); a stamp fills in once every passage in that level has been starred (`levelStampEarned`). |
| `components/BadgeGrid.vue` | Grid of all `BADGES`, greyed out until earned. |
| `pages/practice/index.vue` | Adds a Path/grid picker toggle (`LevelPath` vs. the existing category grid), an XP toast, and `LevelUpModal`, driven by the `xp` field on the `/api/attempts` response. |
| `pages/dashboard.vue` | Adds an `XpBar` row plus Passport (`PassportStamps`) and Badges (`BadgeGrid`) sections. |

### Auth / access control

The app enforces two checks on every protected route: (1) the user is logged in, (2) `profiles.approval_status = 'approved'`. This is implemented in three layers that compound — each layer is defence-in-depth, not a replacement for the others.

| Layer | File | When it runs |
|-------|------|-------------|
| Reactive state | `stores/authStore.ts` | Always; tri-state `null \| true \| false` — `null` means "not yet checked" |
| State initialiser | `plugins/auth-state.client.ts` | Client boot; awaits `supabase.auth.getSession()` before flipping `isLoggedIn` off `null` to prevent hydration false-negatives. Also resets all per-user Pinia stores on sign-out or account switch. |
| Store-driven guard | `middleware/auth-state.global.ts` | Every navigation; redirects only on definitive `false` — ignores `null` so the other two guards (below) handle the hydration window. |
| Inline query guard | `middleware/auth.global.ts` | Every navigation; queries `profiles.approval_status` directly. Primary server-side + hydration-window guard. |
| Post-hydration guard | `plugins/approval-guard.client.ts` | Client boot; watches `useSupabaseUser()` and re-checks approval once the Supabase session restores. |
| Server enforcement | `server/utils/approval.ts` | Called by API handlers via `requireApprovedUser(event)`. Throws 403 if unapproved. |

**Redirect targets:** unauthenticated → `/account`; authenticated but unapproved → `/pending`.

**Public routes** (excluded from all guards): `/account`, `/confirm`, `/reset`, `/pending`, `/dev-only`.

**`authStore` internals:** `refreshApproval()` calls `GET /api/me` (not a raw Supabase query) so approval status is derived from the same endpoint used by the rest of the app. On error it conservatively sets `isApproved = false`.

### Shared / infrastructure

| File | Purpose |
|------|---------|
| `nuxt.config.ts` | Modules: `tailwindcss`, `supabase`, `pinia`. Server-only `runtimeConfig`: `azureSpeechKey`, `azureSpeechRegion`, `supabaseServiceKey`. |
| `types/database.types.ts` | Supabase DB type stub. Regenerate with `pnpm dlx supabase gen types typescript --project-id <id>` when schema changes. |
| `composables/useApi.ts` | Typed `$fetch` wrapper used by client composables. |
| `composables/useHistory.ts` | Fetches attempt history for the current user. |
| `composables/useProgress.ts` | Aggregates score trends for the progress page. |
| `composables/useStreak.ts` | Computes daily practice streak. |
| `composables/usePhonemeStats.ts` | Per-phoneme accuracy aggregation across attempts. |
| `server/api/attempts.post.ts` | Saves a completed attempt to Supabase; also awards XP synchronously via the service-role `add_xp` RPC and returns an `xp` field (`{ awarded, bonus, total, level, leveledUp }`, or `null` on RPC failure). |
| `server/api/attempts.get.ts` | Returns attempt history for the authenticated user. |
| `server/api/me.get.ts` | Returns the current user profile (id, email, displayName, approvalStatus, tutorialCompletedAt) + streak data. |
| `server/api/me.delete.ts` | DELETE /api/me — deletes the authenticated user via `supabase.auth.admin.deleteUser`. Cascades remove all per-user rows. Auth: any authenticated user (not approval-gated). |
| `server/api/me/export.get.ts` | GET /api/me/export — APPI right of disclosure. Returns a JSON bundle of profile + attempts + custom_passages + streak + phoneme_stats + flagged_words. Sets `Content-Disposition: attachment`. |
| `server/api/devices/index.get.ts` | GET /api/devices — lists `device_claims` rows for the current user (deviceId + claimedAt). Not a live-session list. |
| `components/ConfirmDialog.vue` | Reusable Teleport+Transition confirmation dialog. Props: `open`, `title`, `message`, `confirmWord?` (typed input), `confirmLabel?`, `danger?`. Emits `confirm` / `cancel`. |

---

## Environment variables

```
AZURE_SPEECH_KEY=       # Azure Cognitive Services Speech subscription key
AZURE_SPEECH_REGION=    # Azure region, e.g. eastus
```

Both are server-only via Nitro `runtimeConfig`. Template in `.env.example`.

---

## Scoring colour convention

Used in `WordChip.vue` and consistently throughout the UI:

| Threshold | Class | Colour |
|-----------|-------|--------|
| AccuracyScore ≥ 80 | `chip-good` | Green `#d1fae5 / #065f46` |
| AccuracyScore 60–79 | `chip-ok` | Amber `#fef3c7 / #92400e` |
| AccuracyScore < 60 | `chip-bad` | Red `#fee2e2 / #991b1b` |
| ErrorType = Omission | `chip-omission` | Grey + strikethrough |
| ErrorType = Insertion | `chip-insertion` | Purple |

---

## Commands

```bash
pnpm dev          # development server on :3000
pnpm build        # production build
pnpm preview      # preview production build
pnpm typecheck    # vue-tsc strict check
pnpm test         # run all unit tests (Vitest)
pnpm test:watch   # watch mode
pnpm test:coverage # coverage report
```

---

## Testing

Framework: **Vitest 3.x**. Default environment is `node`; tests that need DOM APIs opt in with `// @vitest-environment happy-dom` as the first line of the file. `vitest.config.ts` uses a single glob (`tests/unit/**/*.test.ts`) — no manual file listing required.

CI runs on every push to `master` and on PRs via `.github/workflows/ci.yml`.

### Audio / encoder

| Test file | What it covers |
|-----------|---------------|
| `tests/unit/useWavEncoder.test.ts` | Float32→int16 clamping, downsampling, WAV header byte layout, performance smoke |
| `tests/unit/pcmCapture.test.ts` | AudioWorklet processor logic via a hand-rolled `AudioWorkletProcessor` mock (no browser needed) |
| `tests/unit/useRecorder.test.ts` | Recorder state machine, PCM chunk concatenation, mic track teardown (`@vitest-environment happy-dom`) |

### Azure / assessment

| Test file | What it covers |
|-----------|---------------|
| `tests/unit/azure.test.ts` | All Azure SDK result branches mocked (happy path, NoMatch, Canceled, SDK error, missing NBest), header stripping, config flags |
| `tests/unit/assess.post.test.ts` | Field validation, 403 unapproved, 429 daily limit, 429 concurrency cap (3 inflight), unicode control-char normalization, Azure error → 422 |

### Auth / access control

| Test file | What it covers |
|-----------|---------------|
| `tests/unit/supabaseUser.test.ts` | `useSupabaseUser` — missing/invalid Bearer token → 401, Supabase error → 401, valid token → user |
| `tests/unit/approval.test.ts` | `requireApprovedUser` — 401 from useSupabaseUser, 403 for pending/rejected, pass-through for approved |
| `tests/unit/admin.approve.test.ts` | Admin approve/reject flow — 400 malformed, 404 unknown, 410 already decided, approve/reject success |

### API routes — attempts

| Test file | What it covers |
|-----------|---------------|
| `tests/unit/attempts.post.test.ts` | Save attempt, 403 unapproved, azureResult forwarding, streak/phoneme/flagging fire-and-forget, XP award (base/bonus tiers, `leveledUp`, `xp: null` on `add_xp` RPC failure) |
| `tests/unit/attempts.get.test.ts` | List attempts, field mapping (slug/passageId/scores) |
| `tests/unit/attemptById.get.test.ts` | Fetch by slug, 404, azureResult blob inclusion |

### API routes — user profile

| Test file | What it covers |
|-----------|---------------|
| `tests/unit/me.get.test.ts` | Profile fields (id, email, displayName, university, approvalStatus, tutorialCompletedAt), null-field fallbacks |
| `tests/unit/me.patch.test.ts` | displayName validation (length, charset, bad words), university length, DB error → 500 |
| `tests/unit/me.delete.test.ts` | 401 unauthenticated, deleteUser called with user id, 500 on error, `{ ok: true }` success |
| `tests/unit/me.export.get.test.ts` | 401 unauthenticated, bundle keys present, Content-Disposition header set, 500 on DB error |
| `tests/unit/tutorial.post.test.ts` | Mark tutorial complete, returns completedAt, profiles update |

### API routes — flagged words

| Test file | What it covers |
|-----------|---------------|
| `tests/unit/flaggedWords.post.test.ts` | Add word, normalization ("Rock!" → "rock"), optional fields (ipa/passageId/weakPhonemes) |
| `tests/unit/flaggedWords.get.test.ts` | List words, `status=active` → `is(retired_at, null)`, limit clamped to 200 |
| `tests/unit/flaggedWords.delete.test.ts` | Soft-delete (retire), word normalization, 400 empty |

### API routes — custom passages

| Test file | What it covers |
|-----------|---------------|
| `tests/unit/passages.post.test.ts` | Create passage, title/text/category validation (text ≤300 chars, category enum), 409 duplicate, default category |
| `tests/unit/passages.get.test.ts` | List user passages, 500 on DB error |
| `tests/unit/passages.delete.test.ts` | Delete own passage (scoped to user_id), 400 missing id, 500 on error |
| `tests/unit/passages.test.ts` | Data integrity of SAMPLE_PASSAGES (non-empty fields, unique ids) |

### API routes — stats

| Test file | What it covers |
|-----------|---------------|
| `tests/unit/stats.streak.get.test.ts` | Streak data, defaults when no record, todayMet flag |
| `tests/unit/stats.phonemes.get.test.ts` | Min-3-attempts filter, avgScore rounding, weakest/strongest sort, 10-entry cap |
| `tests/unit/stats.goal.put.test.ts` | 1–120 range validation, boundary values, rounding, upsert with user_id |
| `tests/unit/stats.xp.get.test.ts` | 401 unauthenticated, defaults to 0 with no `user_xp` row, returns stored total, queries scoped to user_id |

### Composables / stores

| Test file | What it covers |
|-----------|---------------|
| `tests/unit/useHistory.test.ts` | Fetch history, azureResult forwarding (`@vitest-environment happy-dom`) |
| `tests/unit/useProgress.test.ts` | `passageStars` (thresholds 90/80/60), `customPassageId` (slugify, 80-char truncation), `levelStampEarned` (all passages in a level starred) |
| `tests/unit/idiomLabStore.test.ts` | submitAnswer, nextChallenge, restartPack, selectPack, shuffledOptions (`@vitest-environment happy-dom`) |
| `tests/unit/xpStore.test.ts` | `fetchXp` (TTL, force refetch, error), `applyAward`/`consumeLastAward`, derived `level`/`progress`, `reset` (`@vitest-environment happy-dom`) |

### Utils

| Test file | What it covers |
|-----------|---------------|
| `tests/unit/updatePhonemeStats.test.ts` | `extractPhonemeDelta` — score accumulation, merging |
| `tests/unit/updateStreak.test.ts` | Streak update logic |
| `tests/unit/coach.util.test.ts` | `generateCoachReply` — Anthropic SDK mocked, JSON-parse fallback, input slicing |
| `tests/unit/flagDifficultWordsSilent.test.ts` | `flagDifficultWordsSilently` — threshold 60, skips Omission/Insertion, normalization, error swallowing |
| `tests/unit/claimDevice.test.ts` | `claimDevice` util — upsert + attempts migration (legacy device_id → real user) |
| `tests/unit/devices.claim.test.ts` | `POST /api/devices/claim` — UUID validation, delegation |
| `tests/unit/devices.get.test.ts` | `GET /api/devices` — 401 unauthenticated, snake→camel mapping, empty list, 500 on DB error |
| `tests/unit/levels.test.ts` | `LEVELS` data integrity (every `SAMPLE_PASSAGES` id covered exactly once, increasing thresholds, contiguous level numbers), `levelForXp` boundaries, negative-total clamping, `levelProgress` mid-journey and max-level cases |
| `tests/unit/xp.util.test.ts` | `computeXpAward` — base score tiers, first-attempt bonus, mastery-crossing bonus, idempotent (no re-bonus), `amount = base + bonus` |
| `tests/unit/badges.util.test.ts` | `computeEligibleBadges` — streak/attempts thresholds, first-mastery, `/l//r/` and `θ/ð` phoneme-mastery pairing (both required), id integrity against `BADGES` |
| `tests/unit/badges.get.test.ts` | `GET /api/badges` — 401 unauthenticated, returns existing earned badges, awards + upserts newly-eligible badges via service client, skips upsert when nothing new, degrades gracefully on query errors |

### Shared fixtures

- `tests/fixtures/mockAssessmentResult.ts` — typed helper to build Azure NBest JSON for handler mocks
- `tests/fixtures/serverTestHarness.ts` — `makeChain()` chainable Supabase mock, `stubNitroGlobals()` Nitro global stubs

**Key constraints:**
- `composables/useRecorder.ts` and `stores/idiomLabStore.ts` must explicitly import `{ ref, computed, watch }` from `vue` (not rely on Nuxt auto-imports) so Vitest can resolve them outside Nuxt context.
- All protected API handlers call `requireApprovedUser(event)` from `~/server/utils/approval`. Tests must mock `~/server/utils/approval` (not `useSupabaseUser` directly) or the approval check will hit the Supabase mock and throw 403.