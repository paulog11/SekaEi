import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CoachInput } from '~/server/utils/coach'

// ---------------------------------------------------------------------------
// Mocks — Anthropic SDK
// ---------------------------------------------------------------------------

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate }
    constructor(public opts: unknown) {}
  },
}))

const { generateCoachReply } = await import('~/server/utils/coach')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_INPUT: CoachInput = {
  flaggedWords: [
    { display_word: 'rock', lowest_score: 45, weak_phonemes: [] },
    { display_word: 'lock', lowest_score: 50, weak_phonemes: [] },
  ],
  weakPhonemes: [
    { phoneme: 'r', avgScore: 40, attemptsCount: 5 },
    { phoneme: 'l', avgScore: 55, attemptsCount: 4 },
  ],
}

const GOOD_JSON = JSON.stringify({
  pattern: 'You substitute /l/ for /r/.',
  drills: [{ pair: ['rock', 'lock'], hint: 'Try this.' }, { pair: ['red', 'led'], hint: 'Tip.' }, { pair: ['run', 'fun'], hint: 'Go slow.' }],
  tip: 'Warm up with rock-rock-rock.',
})

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateCoachReply', () => {
  it('returns parsed CoachReply on success', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: GOOD_JSON }],
      usage: { cache_read_input_tokens: 0 },
    })

    const result = await generateCoachReply('api-key', SAMPLE_INPUT)

    expect(result.pattern).toBe('You substitute /l/ for /r/.')
    expect(result.drills).toHaveLength(3)
    expect(result.tip).toBe('Warm up with rock-rock-rock.')
    expect(result.model).toContain('haiku')
  })

  it('sets cached=true when cache_read_input_tokens > 0', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: GOOD_JSON }],
      usage: { cache_read_input_tokens: 512 },
    })

    const result = await generateCoachReply('api-key', SAMPLE_INPUT)
    expect(result.cached).toBe(true)
  })

  it('returns fallback defaults when JSON parse fails', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not valid json at all' }],
      usage: { cache_read_input_tokens: 0 },
    })

    const result = await generateCoachReply('api-key', SAMPLE_INPUT)

    expect(result.pattern).toBe('Keep practicing — more data needed for a pattern.')
    expect(result.drills).toEqual([])
    expect(result.cached).toBe(false)
  })

  it('uses partial JSON gracefully — falls back fields individually', async () => {
    const partial = JSON.stringify({ pattern: 'You mix r/l.', drills: [] })
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: partial }],
      usage: { cache_read_input_tokens: 0 },
    })

    const result = await generateCoachReply('api-key', SAMPLE_INPUT)

    expect(result.pattern).toBe('You mix r/l.')
    expect(result.drills).toEqual([])
    expect(result.tip).toBe('Focus on slow, deliberate pronunciation of difficult words.')
  })

  it('slices flaggedWords to top 10 before sending', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: GOOD_JSON }],
      usage: { cache_read_input_tokens: 0 },
    })

    const manyWords = Array.from({ length: 15 }, (_, i) => ({
      display_word: `word${i}`, lowest_score: i * 5, weak_phonemes: [],
    }))

    await generateCoachReply('api-key', { ...SAMPLE_INPUT, flaggedWords: manyWords })

    const userContent = JSON.parse(mockCreate.mock.calls[0][0].messages[0].content)
    expect(userContent.difficult_words).toHaveLength(10)
  })

  it('slices weakPhonemes to top 8 before sending', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: GOOD_JSON }],
      usage: { cache_read_input_tokens: 0 },
    })

    const manyPhonemes = Array.from({ length: 12 }, (_, i) => ({
      phoneme: `ph${i}`, avgScore: i * 8, attemptsCount: 4,
    }))

    await generateCoachReply('api-key', { ...SAMPLE_INPUT, weakPhonemes: manyPhonemes })

    const userContent = JSON.parse(mockCreate.mock.calls[0][0].messages[0].content)
    expect(userContent.weak_phonemes).toHaveLength(8)
  })
})
