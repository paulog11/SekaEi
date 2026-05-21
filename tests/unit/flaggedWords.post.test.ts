import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — before importing handler
// ---------------------------------------------------------------------------

const mockCreateError = vi.fn((opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('createError', mockCreateError)
vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)

const readBodyMockFn = vi.fn()
vi.stubGlobal('readBody', readBodyMockFn)
vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ azureSpeechKey: 'key', azureSpeechRegion: 'eastus' })))

const mockRpc = vi.fn().mockResolvedValue({ data: { id: '1', word: 'rock', display_word: 'rock' }, error: null })
const mockFrom = vi.fn()
const mockDb = { rpc: mockRpc, from: mockFrom }

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => mockDb,
  useSupabaseUser: vi.fn(),
}))

const mockRequireApprovedUser = vi.fn()
vi.mock('~/server/utils/approval', () => ({
  requireApprovedUser: mockRequireApprovedUser,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-1' }

function setupSelectChain(returnData: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: returnData, error: null }),
  }
  mockFrom.mockReturnValue(chain)
  return chain
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('flagged-words POST handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue(MOCK_USER)
    setupSelectChain({ id: '1', word: 'rock', display_word: 'Rock' })
  })

  it('throws 400 when word is missing', async () => {
    readBodyMockFn.mockResolvedValue({ source: 'manual', score: 45 })
    const handler = await import('~/server/api/flagged-words.post')
    await expect((handler.default as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when source is invalid', async () => {
    readBodyMockFn.mockResolvedValue({ word: 'rock', source: 'unknown', score: 45 })
    const handler = await import('~/server/api/flagged-words.post')
    await expect((handler.default as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when score is out of range', async () => {
    readBodyMockFn.mockResolvedValue({ word: 'rock', source: 'manual', score: 150 })
    const handler = await import('~/server/api/flagged-words.post')
    await expect((handler.default as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('calls upsert_flagged_word RPC with normalized word', async () => {
    readBodyMockFn.mockResolvedValue({ word: 'Rock!', displayWord: 'Rock', source: 'manual', score: 45 })
    const handler = await import('~/server/api/flagged-words.post')
    await (handler.default as Function)({})
    expect(mockRpc).toHaveBeenCalledWith('upsert_flagged_word', expect.objectContaining({
      p_word: 'rock',
      p_score: 45,
      p_source: 'manual',
    }))
  })

  it('normalizes word — strips punctuation and lowercases', async () => {
    readBodyMockFn.mockResolvedValue({ word: 'Rock!', source: 'auto', score: 40 })
    const handler = await import('~/server/api/flagged-words.post')
    await (handler.default as Function)({})
    expect(mockRpc).toHaveBeenCalledWith('upsert_flagged_word', expect.objectContaining({
      p_word: 'rock',
    }))
  })

  it('forwards optional fields to the RPC call', async () => {
    readBodyMockFn.mockResolvedValue({
      word: 'through',
      displayWord: 'through',
      source: 'manual',
      score: 55,
      ipa: 'θruː',
      passageId: 'interstellar',
      weakPhonemes: [{ ph: 'θ', heard: 's', score: 30 }],
    })
    const handler = await import('~/server/api/flagged-words.post')
    await (handler.default as Function)({})
    expect(mockRpc).toHaveBeenCalledWith('upsert_flagged_word', expect.objectContaining({
      p_ipa: 'θruː',
      p_passage_id: 'interstellar',
      p_weak_phonemes: [{ ph: 'θ', heard: 's', score: 30 }],
    }))
  })

  it('returns the upserted word row', async () => {
    const mockRow = { id: '42', word: 'rock', display_word: 'Rock', score: 45 }
    setupSelectChain(mockRow)
    readBodyMockFn.mockResolvedValue({ word: 'Rock', source: 'manual', score: 45 })
    const handler = await import('~/server/api/flagged-words.post')
    const result = await (handler.default as Function)({})
    expect(result).toMatchObject({ word: mockRow })
  })
})
