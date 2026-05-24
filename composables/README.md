# `composables/`

`useX()` functions — reactive logic shared across pages and components. Auto-imported by Nuxt. See [docs/architecture.md](../../docs/architecture.md) for the bigger picture.

Two flavours: **browser/device wrappers** that own a piece of native API, and **store facades** that bundle a Pinia store's refs + actions into a single import.

## Browser / device

| File | Owns | Used by |
|---|---|---|
| `useRecorder.ts` | `getUserMedia` → `AudioContext` → `AudioWorklet` pipeline; `idle → recording → stopped` state machine. 60 s cap. | `Recorder.vue`, `FlashcardDrill.vue` |
| `useWavEncoder.ts` | Float32 PCM → 16 kHz mono 16-bit WAV `Blob` (with downsampling). | `useRecorder` |
| `useTextToSpeech.ts` | Module-level singleton audio + LRU cache (50 blobs, key `voice:text`). Calling `play()` always stops the previous clip. | `WordChip.vue`, anywhere a passage line plays back |
| `useVoicePreference.ts` | Module-level shared ref for preferred TTS voice; localStorage-backed. | `useTextToSpeech`, the voice picker UI |
| `useInstallPrompt.ts` | Captures `beforeinstallprompt` for Android; iOS-only fallback flag because Safari has no programmatic install API. | `InstallPromptCard.vue` |

## Server-data facades

These wrap a Pinia store with `storeToRefs` so callers can destructure reactive refs and actions in one import. The actual state + caching lives in `stores/`.

| File | Wraps | Notes |
|---|---|---|
| `useHistory.ts` | `historyStore` | Re-exports `AttemptRecord` type so it has one canonical import location. |
| `useStreak.ts` | `streakStore` | — |
| `usePhonemeStats.ts` | `phonemeStatsStore` | — |
| `useFlaggedWords.ts` | `flaggedWordsStore` | — |
| `useCustomPassages.ts` | `customPassagesStore` | — |
| `useCoach.ts` | (none — calls `/api/coach` directly) | Single-flight guard via `loading` ref. |
| `useApi.ts` | Underlying fetch wrapper for everything above. | Adds Bearer token; signs out on 401; also exports `getOrCreateDeviceId`. |
| `useProgress.ts` | Pure helpers — no store. | `passageStars()` (≥90/≥80/≥60 thresholds) and `customPassageId()` (slugify). |

## Conventions

- **Composables don't define stores.** If you need state that survives a component unmount or that multiple unrelated components must share, add a Pinia store in `stores/` and write a `useX` facade here.
- **Composables don't talk to Supabase directly.** Use `useApi()` so the bearer token and 401 handling apply uniformly.
- **Composables that run in tests** must explicitly import `{ ref, computed, watch }` from `vue` — Nuxt auto-imports don't apply in Vitest.
