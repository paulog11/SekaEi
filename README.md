# SekaEi — English Learning Practice

SekaEi is a web app for Japanese university students to practise English. It has two tracks:

1. **Pronunciation Practice** — read a passage aloud; get instant per-word and per-phoneme accuracy scores powered by Azure AI Speech.
2. **Real English (Idioms & Slang)** — an idiom quiz with image-based multiple choice. (Work in progress.)

Access is invite-only: users sign up, then an admin approves their account.

---

## What the pronunciation track does

1. **Pick a passage** — choose a built-in passage or paste your own text.
2. **Record** — your microphone turns on; read the passage aloud, then stop.
3. **Get scored** — every word is colour-coded within seconds:

| Colour | Meaning |
|--------|---------|
| Green  | Score ≥ 80 — well pronounced |
| Amber  | Score 60–79 — acceptable but could improve |
| Red    | Score < 60 — needs attention |

Hover over any word to see a breakdown of each individual phoneme.

Overall scores for **Accuracy**, **Fluency**, **Completeness**, **Prosody**, and a combined **Overall** are shown at the top.

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
- A [Supabase](https://supabase.com) project (for auth + database)

### 1. Clone and install

```bash
git clone <repo-url>
cd SekaEi
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in your Azure and Supabase credentials. All values are server-only; see `.env.example` for the full list.

### 3. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture overview

```
Browser                          Nuxt/Nitro server          Azure
───────                          ─────────────────          ─────
getUserMedia (mic only)
  └─ AudioContext + Worklet ──► 16 kHz mono WAV Blob
                                  POST /api/assess ────────► Azure Speech SDK
                                                  ◄────────── per-word + phoneme scores
ScoreDisplay renders results
```

The Azure subscription key **never leaves the server**. The browser sends audio to `/api/assess` (your own Nitro endpoint), which proxies to Azure.

For a full directory-level map of the codebase, see [docs/architecture.md](docs/architecture.md).

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [Nuxt 3](https://nuxt.com) + [Vue 3](https://vuejs.org) |
| Language | TypeScript (strict) |
| Package manager | pnpm |
| Database / Auth | [Supabase](https://supabase.com) |
| Pronunciation API | [Azure AI Speech — Pronunciation Assessment](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment) |
| Audio capture | Web Audio API (`AudioContext` + `AudioWorklet`) |
| Server | Nitro (built into Nuxt) |

---

## Other pronunciation APIs

If you want to swap out Azure, here are the other providers evaluated:

| Provider | Phoneme-level | Notes |
|----------|--------------|-------|
| [Speechace](https://docs.speechace.com) | Yes | Learner-focused, IELTS/PTE-aligned scores. Paid only. |
| [SpeechSuper](https://www.speechsuper.com) | Yes | 8 languages, competitive pricing. |
| [ELSA Speak API](https://elsaspeak.com/en/elsa-api/) | Yes | Highest learner UX quality, enterprise pricing. |
| [Langcraft](https://platform.langcraft.world) | IPA + timestamps | Developer-first, good for high-volume apps. |

Swapping providers requires changing only `server/utils/azure.ts` and `server/api/assess.post.ts`.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview the production build |
| `pnpm typecheck` | Run `vue-tsc` type checking |
| `pnpm test` | Run unit tests (Vitest) |
