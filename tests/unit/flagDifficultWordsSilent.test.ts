import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockWord, mockPhoneme, mockAssessmentResult } from '../fixtures/mockAssessmentResult'
import type { AssessmentResult } from '~/types/assessment'

// ---------------------------------------------------------------------------
// Helpers — build an assessment result with specific word scores
// ---------------------------------------------------------------------------

function makeResult(words: ReturnType<typeof mockWord>[]): AssessmentResult {
  return {
    ...mockAssessmentResult(),
    Words: words,
  }
}

// ---------------------------------------------------------------------------
// Tests — flagDifficultWordsSilently
// ---------------------------------------------------------------------------

describe('flagDifficultWordsSilently', () => {
  let mockRpc: ReturnType<typeof vi.fn>
  let mockDb: { rpc: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    // Re-import module fresh for each test to reset state
    vi.resetModules()
    mockRpc = vi.fn().mockResolvedValue({ error: null })
    mockDb = { rpc: mockRpc }
  })

  it('calls upsert_flagged_word for each word below DIFFICULT_THRESHOLD (60)', async () => {
    const { flagDifficultWordsSilently } = await import('~/server/utils/flagDifficultWords')
    const result = makeResult([
      mockWord('rock', 45, 'None'),    // below threshold — should flag
      mockWord('lock', 55, 'None'),    // below threshold — should flag
      mockWord('great', 85, 'None'),   // above threshold — skip
    ])

    await flagDifficultWordsSilently(mockDb as any, 'user-1', result, 'passage-1')

    expect(mockRpc).toHaveBeenCalledTimes(2)
    expect(mockRpc).toHaveBeenCalledWith('upsert_flagged_word', expect.objectContaining({ p_word: 'rock' }))
    expect(mockRpc).toHaveBeenCalledWith('upsert_flagged_word', expect.objectContaining({ p_word: 'lock' }))
  })

  it('skips words with ErrorType Omission', async () => {
    const { flagDifficultWordsSilently } = await import('~/server/utils/flagDifficultWords')
    const result = makeResult([
      mockWord('rock', 40, 'Omission'),
    ])

    await flagDifficultWordsSilently(mockDb as any, 'user-1', result, 'passage-1')

    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('skips words with ErrorType Insertion', async () => {
    const { flagDifficultWordsSilently } = await import('~/server/utils/flagDifficultWords')
    const result = makeResult([
      mockWord('rock', 40, 'Insertion'),
    ])

    await flagDifficultWordsSilently(mockDb as any, 'user-1', result, 'passage-1')

    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('processes Mispronunciation words below threshold', async () => {
    const { flagDifficultWordsSilently } = await import('~/server/utils/flagDifficultWords')
    const result = makeResult([
      mockWord('think', 35, 'Mispronunciation'),
    ])

    await flagDifficultWordsSilently(mockDb as any, 'user-1', result, 'passage-1')

    expect(mockRpc).toHaveBeenCalledWith('upsert_flagged_word', expect.objectContaining({
      p_word: 'think',
      p_source: 'auto',
    }))
  })

  it('normalizes the word before upserting', async () => {
    const { flagDifficultWordsSilently } = await import('~/server/utils/flagDifficultWords')
    const result = makeResult([
      mockWord('Rock!', 40, 'None'),
    ])

    await flagDifficultWordsSilently(mockDb as any, 'user-1', result, 'passage-1')

    expect(mockRpc).toHaveBeenCalledWith('upsert_flagged_word', expect.objectContaining({
      p_word: 'rock',
      p_display_word: 'Rock!',
    }))
  })

  it('swallows errors silently (does not throw)', async () => {
    const { flagDifficultWordsSilently } = await import('~/server/utils/flagDifficultWords')
    mockRpc.mockRejectedValue(new Error('DB exploded'))
    const result = makeResult([mockWord('rock', 40, 'None')])

    await expect(
      flagDifficultWordsSilently(mockDb as any, 'user-1', result, 'passage-1')
    ).resolves.not.toThrow()
  })

  it('does nothing when no words are difficult', async () => {
    const { flagDifficultWordsSilently } = await import('~/server/utils/flagDifficultWords')
    const result = makeResult([
      mockWord('great', 90, 'None'),
      mockWord('perfect', 95, 'None'),
    ])

    await flagDifficultWordsSilently(mockDb as any, 'user-1', result, 'passage-1')

    expect(mockRpc).not.toHaveBeenCalled()
  })
})
