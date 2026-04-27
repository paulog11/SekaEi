# SekaEi — English Pronunciation Practice

SekaEi is a web application that listens to you read a passage aloud, then tells you exactly which words and sounds you pronounced correctly — and which ones need work.

Record yourself on your webcam, replay the video, and get instant phoneme-level feedback powered by Azure AI Speech.

---

## What it does

1. **Pick a passage** — choose one of three built-in passages or paste your own text.
2. **Record** — your camera and microphone turn on; read the passage aloud, then stop.
3. **Watch yourself** — the recorded video plays back in the browser. Nothing is uploaded or stored.
4. **Get scored** — hit "Check My Pronunciation" and within a few seconds every word is colour-coded:

| Colour | Meaning |
|--------|---------|
| Green  | Score ≥ 80 — well pronounced |
| Amber  | Score 60–79 — acceptable but could improve |
| Red    | Score < 60 — needs attention |

Hover over any word to see a breakdown of each individual phoneme.

Overall scores for **Accuracy**, **Fluency**, **Completeness**, **Prosody**, and a combined **Overall** score are shown at the top of the results.

---

## Sample passages

| Title | Source |
|-------|--------|
| *Interstellar* | Christopher Nolan, 2014 |
| *The Great Dictator* | Charlie Chaplin, 1940 |
| *Rocky Balboa* | Sylvester Stallone, 2006 |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) v20 or later
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- An [Azure AI Speech](https://portal.azure.com) resource (free tier: 5 hours/month)

### 1. Clone and install

```bash
git clone <repo-url>
cd SekaEi
pnpm install
```

### 2. Configure Azure credentials

Copy the example environment file and fill in your Azure details:

```bash
cp .env.example .env
```

Edit `.env`:

```
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_REGION=eastus
```

To get these values:
1. Go to [portal.azure.com](https://portal.azure.com)
2. Create a resource → search "Speech"
3. After creation, go to **Keys and Endpoint**
4. Copy **KEY 1** and the **Location/Region**

### 3. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture overview

```
Browser                          Nuxt server (Nitro)        Azure
───────                          ───────────────────        ─────
getUserMedia (camera + mic)
  ├─ MediaRecorder ──────────► local video playback only
  └─ AudioContext + Worklet ──► 16 kHz mono WAV
                                  POST /api/assess ────────► Azure Speech SDK
                                                  ◄────────── per-word + phoneme scores
ScoreDisplay renders results
```

The Azure subscription key **never leaves the server**. The browser only sends audio to `/api/assess` (your own Nitro endpoint), which proxies to Azure.

---

## Project structure

```
SekaEi/
├── app.vue                         Root layout
├── pages/index.vue                 Main page — passage picker, recorder, results
├── components/
│   ├── Recorder.vue                Camera preview + record/stop controls
│   ├── ScoreDisplay.vue            Overall scores + word grid
│   └── WordChip.vue                Per-word colour chip with phoneme tooltip
├── composables/
│   ├── useRecorder.ts              getUserMedia, dual MediaRecorder + AudioWorklet pipeline
│   └── useWavEncoder.ts            Float32 PCM → 16 kHz mono WAV Blob
├── public/worklets/
│   └── pcm-capture.js              AudioWorkletProcessor — emits raw PCM chunks
├── server/
│   ├── api/assess.post.ts          Multipart upload handler → Azure → JSON response
│   └── utils/azure.ts              Azure Speech SDK: PronunciationAssessmentConfig runner
└── types/
    ├── assessment.ts               Azure response types (AzureWord, AzurePhoneme, etc.)
    └── passages.ts                 Built-in sample passages
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [Nuxt 3](https://nuxt.com) + [Vue 3](https://vuejs.org) |
| Language | TypeScript (strict) |
| Package manager | pnpm |
| Pronunciation API | [Azure AI Speech — Pronunciation Assessment](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment) |
| Audio capture | Web Audio API (`AudioContext` + `AudioWorklet`) |
| Video capture | `MediaRecorder` API |
| Server | Nitro (built into Nuxt) |

---

## Other available pronunciation APIs

If you want to swap out Azure, here are the other providers evaluated:

| Provider | Phoneme-level | Notes |
|----------|--------------|-------|
| [Speechace](https://docs.speechace.com) | Yes | Learner-focused, IELTS/PTE-aligned scores. Paid only. |
| [SpeechSuper](https://www.speechsuper.com) | Yes | 8 languages, competitive pricing. |
| [ELSA Speak API](https://elsaspeak.com/en/elsa-api/) | Yes | Highest learner UX quality, enterprise pricing. |
| [Langcraft](https://platform.langcraft.world) | IPA + timestamps | Developer-first, good for high-volume apps. |

The scoring interface in `server/utils/azure.ts` is isolated enough that swapping providers requires changing only that file and `server/api/assess.post.ts`.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview the production build |
| `pnpm typecheck` | Run `vue-tsc` type checking |
