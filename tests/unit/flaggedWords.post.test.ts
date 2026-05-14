import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Nitro/H3 globals
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

const mockRpc = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn()
const mockDb = { rpc: mockRpc, from: mockFrom }
const mockUser = { id: 'user-1' }

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => mockDb,
  useSupabaseUser: vi.fn().mockResolvedValue(mockUser),
}))

describe('flagged-words POST handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '1', word: 'rock', display_word: 'rock' }, error: null }),
    })
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
})
