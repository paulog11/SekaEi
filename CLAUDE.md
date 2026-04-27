# CLAUDE.md — SekaEi

## What this app is

SekaEi is an English pronunciation practice tool. A user reads a passage aloud into their webcam; the app returns per-word and per-phoneme accuracy scores powered by Azure AI Speech Pronunciation Assessment.

The name "SekaEi" is intentionally unexplained — treat it as a proper noun.

---

## Core intent and constraints

- **Privacy first.** Video recordings never leave the browser. Only the extracted audio WAV is sent to the server (and discarded after scoring). Do not add any video upload or storage feature without explicit instruction.
- **Azure key must stay server-side.** The key lives in `runtimeConfig` (Nitro), never in `runtimeConfig.public`. Never move it to the client bundle.
- **No UI framework.** The project intentionally uses plain scoped CSS. Do not introduce Tailwind, UnoCSS, or any component library without being asked.
- **No auth.** There are no user accounts for the MVP. Don't add auth plumbing unless asked.
- **TypeScript strict.** All new files must pass `vue-tsc --noEmit` in strict mode.

---

## Architecture

```
Browser                          Nuxt/Nitro server          Azure
───────                          ─────────────────          ─────
getUserMedia (camera + mic)
  ├─ MediaRecorder ──────────► local <video> playback only
  └─ AudioContext + Worklet ──► 16 kHz mono WAV Blob
                                  POST /api/assess ────────► Azure Speech SDK
                                                  ◄────────── NBest[0].Words[].Phonemes[]
ScoreDisplay renders results
```

### Why dual audio consumers

`MediaRecorder` outputs webm/opus — Azure's SDK won't ingest it cleanly. So the stream is split:

1. `MediaRecorder` → webm Blob → local video playback only.
2. `AudioContext (16 kHz)` + `AudioWorkletNode ('pcm-capture-processor')` → Float32 PCM chunks → `useWavEncoder` assembles a 16-bit PCM WAV → uploaded to `/api/assess`.

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

| File | Purpose |
|------|---------|
| `server/utils/azure.ts` | Azure SDK invocation. Change here to swap pronunciation providers. |
| `server/api/assess.post.ts` | Nitro POST handler. Reads `audio` (WAV) and `referenceText` from multipart form. |
| `composables/useRecorder.ts` | `getUserMedia`, dual-consumer wiring, state machine (`idle → recording → stopped`). |
| `composables/useWavEncoder.ts` | Accepts `Float32Array` + source sample rate → returns 16 kHz mono WAV `Blob`. Downsamples if needed. |
| `public/worklets/pcm-capture.js` | `AudioWorkletProcessor`. Slices input buffer and posts `{ type: 'pcm', data: Float32Array }` to main thread. |
| `components/Recorder.vue` | Camera preview (`srcObject` live stream) + post-recording `<video controls>` playback. |
| `components/WordChip.vue` | Colour-coded word badge. Green ≥80, amber 60–79, red <60. Phoneme breakdown in CSS tooltip on hover. |
| `components/ScoreDisplay.vue` | Renders overall score cards (Accuracy, Fluency, Completeness, Prosody, Overall) + word grid. |
| `pages/index.vue` | Single page. Passage selector (radio cards) + freeform textarea. Wires Recorder → assess → ScoreDisplay. |
| `types/assessment.ts` | `AzureWord`, `AzurePhoneme`, `AssessmentResult` — shape returned by `/api/assess`. |
| `types/passages.ts` | `SAMPLE_PASSAGES` array. Three built-in passages: Interstellar, The Great Dictator, Rocky Balboa. |
| `nuxt.config.ts` | `runtimeConfig.azureSpeechKey` and `runtimeConfig.azureSpeechRegion` (server-only). |

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
| AccuracyScore ≥ 80 | `chip--good` | Green `#d1fae5 / #065f46` |
| AccuracyScore 60–79 | `chip--ok` | Amber `#fef3c7 / #92400e` |
| AccuracyScore < 60 | `chip--bad` | Red `#fee2e2 / #991b1b` |
| ErrorType = Omission | `chip--omission` | Grey + strikethrough |
| ErrorType = Insertion | `chip--insertion` | Purple |

---

## Commands

```bash
pnpm dev          # development server on :3000
pnpm build        # production build
pnpm preview      # preview production build
pnpm typecheck    # vue-tsc strict check
```

---

## What's out of scope (MVP)

Do not add these unless explicitly asked:

- User accounts or auth
- Cloud storage / video upload
- Streaming / real-time scoring (current flow is record-then-score)
- Multi-language support (Azure supports 33 locales — just change `speechRecognitionLanguage` in `azure.ts`)
- Tests (Vitest / Playwright)
- A UI component library
