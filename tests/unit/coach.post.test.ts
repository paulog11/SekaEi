import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateError = vi.fn((opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('createError', mockCreateError)
vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
vi.stubGlobal('readBody', vi.fn())

const mockGenerateCoachReply = vi.fn()
vi.mock('~/server/utils/coach', () => ({
  generateCoachReply: mockGenerateCoachReply,
  COACH_DAILY_LIMIT: 20,
}))

const mockIncrementRpc = vi.fn().mockResolvedValue({ data: 1, error: null })
const mockFlaggedFrom = vi.fn()
const mockPhonemeFrom = vi.fn()
let fromCallCount = 0
const mockDb = {
  rpc: mockIncrementRpc,
  from: vi.fn(),
}
const mockUser = { id: 'user-1' }

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => mockDb,
  useSupabaseUser: vi.fn().mockResolvedValue(mockUser),
}))

vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({
  anthropicApiKey: 'test-anthropic-key',
})))

describe('coach POST handler', () => {
  const mockCoachReply = {
    pattern: 'You substitute /l/ for /r/.',
    drills: [{ pair: ['rock', 'lock'], hint: 'Try this.' }],
    tip: 'Practice slowly.',
    model: 'claude-haiku-4-5-20251001',
    cached: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    fromCallCount = 0
    mockDb.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    mockIncrementRpc.mockResolvedValue({ data: 1, error: null })
    mockGenerateCoachReply.mockResolvedValue(mockCoachReply)
  })

  it('throws 503 when anthropicApiKey is missing', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ anthropicApiKey: '' })))
    const handler = await import('~/server/api/coach.post')
    await expect((handler.default as Function)({})).rejects.toMatchObject({ statusCode: 503 })
    vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ anthropicApiKey: 'test-anthropic-key' })))
  })

  it('throws 429 when daily limit exceeded', async () => {
    mockIncrementRpc.mockResolvedValue({ data: 21, error: null })
    const handler = await import('~/server/api/coach.post')
    await expect((handler.default as Function)({})).rejects.toMatchObject({ statusCode: 429 })
  })

  it('calls generateCoachReply and returns result', async () => {
    const handler = await import('~/server/api/coach.post')
    const result = await (handler.default as Function)({})
    expect(mockGenerateCoachReply).toHaveBeenCalledWith(
      'test-anthropic-key',
      expect.objectContaining({ flaggedWords: expect.any(Array), weakPhonemes: expect.any(Array) })
    )
    expect(result).toMatchObject({ pattern: 'You substitute /l/ for /r/.' })
  })

  it('throws 422 when generateCoachReply throws', async () => {
    mockGenerateCoachReply.mockRejectedValue(new Error('API error'))
    const handler = await import('~/server/api/coach.post')
    await expect((handler.default as Function)({})).rejects.toMatchObject({ statusCode: 422 })
  })
})
