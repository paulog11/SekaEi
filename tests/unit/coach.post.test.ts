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
vi.stubGlobal('readBody', vi.fn())

const mockGenerateCoachReply = vi.fn()
vi.mock('~/server/utils/coach', () => ({
  generateCoachReply: mockGenerateCoachReply,
  COACH_DAILY_LIMIT: 20,
}))

const mockRequireApprovedUser = vi.fn()
const mockRequireAccess = vi.fn()
const mockGetUserTier = vi.fn()
vi.mock('~/server/utils/approval', () => ({
  requireApprovedUser: mockRequireApprovedUser,
  requireAccess: mockRequireAccess,
  getUserTier: mockGetUserTier,
}))

const mockIncrementRpc = vi.fn().mockResolvedValue({ data: 1, error: null })
const mockDb = {
  rpc: mockIncrementRpc,
  from: vi.fn(),
}
const mockUser = { id: 'user-1' }

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => mockDb,
  useSupabaseUser: vi.fn(),
}))

vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({
  anthropicApiKey: 'test-anthropic-key',
})))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

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
    mockRequireApprovedUser.mockResolvedValue(mockUser)
    mockRequireAccess.mockResolvedValue(mockUser)
    mockGetUserTier.mockResolvedValue('attendee')
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

  it('throws 403 when user tier is public (coachDaily === 0)', async () => {
    mockGetUserTier.mockResolvedValue('public')
    const handler = await import('~/server/api/coach.post')
    await expect((handler.default as Function)({})).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 429 when daily limit exceeded', async () => {
    mockIncrementRpc.mockResolvedValue({ data: 21, error: null })
    const handler = await import('~/server/api/coach.post')
    await expect((handler.default as Function)({})).rejects.toMatchObject({ statusCode: 429 })
  })

  it('calls generateCoachReply with flaggedWords and weakPhonemes arrays', async () => {
    const handler = await import('~/server/api/coach.post')
    const result = await (handler.default as Function)({})
    expect(mockGenerateCoachReply).toHaveBeenCalledWith(
      'test-anthropic-key',
      expect.objectContaining({
        flaggedWords: expect.any(Array),
        weakPhonemes: expect.any(Array),
      }),
    )
    expect(result).toMatchObject({ pattern: 'You substitute /l/ for /r/.' })
  })

  it('queries flagged_words with active filter, ordered by lowest_score', async () => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockDb.from = vi.fn().mockReturnValue(chainMock)

    const handler = await import('~/server/api/coach.post')
    await (handler.default as Function)({})

    // First from() call is for flagged_words
    expect(mockDb.from).toHaveBeenCalledWith('flagged_words')
    expect(chainMock.is).toHaveBeenCalledWith('retired_at', null)
    expect(chainMock.order).toHaveBeenCalledWith('lowest_score', { ascending: true })
    expect(chainMock.limit).toHaveBeenCalledWith(10)
  })

  it('queries phoneme_stats with minimum attempts filter', async () => {
    let callCount = 0
    const fwChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const phChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockDb.from = vi.fn().mockImplementation(() => {
      callCount++
      return callCount === 1 ? fwChain : phChain
    })

    const handler = await import('~/server/api/coach.post')
    await (handler.default as Function)({})

    expect(phChain.gte).toHaveBeenCalledWith('attempts_count', 3)
  })

  it('throws 422 when generateCoachReply throws', async () => {
    mockGenerateCoachReply.mockRejectedValue(new Error('API error'))
    const handler = await import('~/server/api/coach.post')
    await expect((handler.default as Function)({})).rejects.toMatchObject({ statusCode: 422 })
  })
})
