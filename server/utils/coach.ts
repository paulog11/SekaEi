import Anthropic from '@anthropic-ai/sdk'
import type { FlaggedWord, CoachReply } from '~/types/flaggedWord'

const COACH_DAILY_LIMIT = 20
const MODEL = 'claude-haiku-4-5-20251001'

// Fixed system prompt — must stay identical across calls for prompt cache hits.
const SYSTEM_PROMPT = `You are a pronunciation coach specializing in helping Japanese learners of English. Japanese speakers commonly struggle with these sound contrasts: /r/ vs /l/, /v/ vs /b/, /θ/ (th) vs /s/ or /t/, /ð/ (voiced th) vs /z/ or /d/, vowel length distinctions (ship vs sheep), and word-final consonants. You have access to a learner's difficult words and their weak phonemes.

Your task: analyze the data and return a JSON object with exactly these fields:
- "pattern": a 1-2 sentence summary of the dominant pronunciation pattern you observe (e.g., "You consistently substitute /l/ for /r/ at word beginnings.")
- "drills": an array of exactly 3 objects, each with:
  - "pair": an array of exactly 2 English words that contrast the target sounds (minimal pair or near-minimal pair)
  - "hint": one sentence of pronunciation tip for that pair
- "tip": one actionable sentence the learner can apply immediately in their next session

Return ONLY valid JSON. No markdown, no explanation outside the JSON object.

Example output:
{"pattern":"You often replace /r/ with /l/, especially at the start of words.","drills":[{"pair":["rock","lock"],"hint":"For /r/, curl your tongue back slightly without touching the roof of your mouth."},{"pair":["red","led"],"hint":"Feel the difference: /r/ starts with your tongue floating, /l/ touches just behind your teeth."},{"pair":["road","load"],"hint":"Say each word slowly, then speed up — notice how /r/ feels rounder than /l/."}],"tip":"Before each recording session, practice 'rice, rice, rice' three times to warm up the /r/ sound."}`

interface WeakPhoneme {
  phoneme: string
  avgScore: number
  attemptsCount: number
}

export interface CoachInput {
  flaggedWords: Pick<FlaggedWord, 'display_word' | 'lowest_score' | 'weak_phonemes'>[]
  weakPhonemes: WeakPhoneme[]
}

export async function generateCoachReply(
  apiKey: string,
  input: CoachInput,
): Promise<CoachReply> {
  const client = new Anthropic({ apiKey })

  const userContent = JSON.stringify({
    difficult_words: input.flaggedWords.slice(0, 10).map(w => ({
      word: w.display_word,
      lowest_score: w.lowest_score,
      weak_phonemes: w.weak_phonemes,
    })),
    weak_phonemes: input.weakPhonemes.slice(0, 8).map(p => ({
      phoneme: p.phoneme,
      avg_score: Math.round(p.avgScore),
      attempts: p.attemptsCount,
    })),
  })

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userContent }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const cached = ((response.usage as unknown as Record<string, number>).cache_read_input_tokens ?? 0) > 0

  try {
    const parsed = JSON.parse(text) as Partial<CoachReply>
    return {
      pattern: typeof parsed.pattern === 'string' ? parsed.pattern : 'Keep practicing — more data needed for a pattern.',
      drills: Array.isArray(parsed.drills) ? parsed.drills : [],
      tip: typeof parsed.tip === 'string' ? parsed.tip : 'Focus on slow, deliberate pronunciation of difficult words.',
      model: MODEL,
      cached,
    }
  } catch {
    return {
      pattern: 'Keep practicing — more data needed for a pattern.',
      drills: [],
      tip: 'Focus on slow, deliberate pronunciation of difficult words.',
      model: MODEL,
      cached: false,
    }
  }
}

export { COACH_DAILY_LIMIT }
