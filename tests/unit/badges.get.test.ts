import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — before importing handler
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()
const mockUseSupabaseUser = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => ({ from: mockFrom }),
  useSupabaseUser: mockUseSupabaseUser,
}))

const mockServiceFrom = vi.fn()

vi.mock('~/server/utils/supabaseService', () => ({
  useSupabaseService: () => ({ from: mockServiceFrom }),
}))

const createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
vi.stubGlobal('createError', createError)

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  createError,
}))

const { default: handler } = await import('~/server/api/badges.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

/**
 * Builds the five sequential `db.from(...)` chains the handler issues, in
 * call order: user_badges (earned), daily_streaks, attempts (count),
 * attempts (mastery), phoneme_stats. Wires them onto `mockFrom` via
 * `mockReturnValueOnce` so each `.from()` call gets its own chain.
 */
function setupChains(opts: {
  earned?: { data: unknown; error?: unknown }
  streak?: { data: unknown; error?: unknown }
  count?: { count: number | null; error?: unknown }
  mastery?: { data: unknown; error?: unknown }
  phonemeStats?: { data: unknown; error?: unknown }
} = {}) {
  const earnedResult = { data: [], error: null, ...opts.earned }
  const streakResult = { data: null, error: null, ...opts.streak }
  const countResult = { count: 0, error: null, ...opts.count }
  const masteryResult = { data: [], error: null, ...opts.mastery }
  const phonemeResult = { data: null, error: null, ...opts.phonemeStats }

  const earnedChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(earnedResult),
  }
  const streakChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(streakResult),
  }
  const countChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(countResult),
  }
  const masteryChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(masteryResult),
  }
  const phonemeChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(phonemeResult),
  }

  mockFrom
    .mockReturnValueOnce(earnedChain)
    .mockReturnValueOnce(streakChain)
    .mockReturnValueOnce(countChain)
    .mockReturnValueOnce(masteryChain)
    .mockReturnValueOnce(phonemeChain)

  return { earnedChain, streakChain, countChain, masteryChain, phonemeChain }
}

function setupUpsertChain(error: unknown = null) {
  const upsertChain = { upsert: vi.fn().mockResolvedValue({ error }) }
  mockServiceFrom.mockReturnValue(upsertChain)
  return upsertChain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/badges', () => {
  it('throws 401 when not authenticated (propagates auth error)', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns existing earned badges with no new eligibility', async () => {
    setupChains({
      earned: { data: [{ badge_id: 'streak-3', earned_at: '2024-01-01T00:00:00.000Z' }] },
    })

    const result = await (handler as Function)({})

    expect(result.badges).toEqual([{ id: 'streak-3', earnedAt: '2024-01-01T00:00:00.000Z' }])
    expect(mockServiceFrom).not.toHaveBeenCalled()
  })

  it('awards a newly eligible badge via upsert and includes it in the response', async () => {
    setupChains({
      earned: { data: [] },
      streak: { data: { longest_streak: 3 } },
    })
    const upsertChain = setupUpsertChain(null)

    const result = await (handler as Function)({})

    expect(upsertChain.upsert).toHaveBeenCalledWith(
      [{ user_id: MOCK_USER.id, badge_id: 'streak-3', earned_at: expect.any(String) }],
      { onConflict: 'user_id,badge_id', ignoreDuplicates: true },
    )
    expect(result.badges).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'streak-3' })]),
    )
  })

  it('does not call upsert when nothing new is eligible', async () => {
    setupChains({ earned: { data: [] } }) // all defaults -> nothing eligible
    await (handler as Function)({})
    expect(mockServiceFrom).not.toHaveBeenCalled()
  })

  it('does not re-award a badge that is already earned', async () => {
    setupChains({
      earned: { data: [{ badge_id: 'streak-3', earned_at: '2024-01-01T00:00:00.000Z' }] },
      streak: { data: { longest_streak: 3 } },
    })

    const result = await (handler as Function)({})

    expect(mockServiceFrom).not.toHaveBeenCalled()
    expect(result.badges).toEqual([{ id: 'streak-3', earnedAt: '2024-01-01T00:00:00.000Z' }])
  })

  it('degrades gracefully when the streak query errors, still returning earned badges', async () => {
    setupChains({
      earned: { data: [{ badge_id: 'attempts-10', earned_at: '2024-01-01T00:00:00.000Z' }] },
      streak: { data: null, error: { message: 'db down' } },
    })

    const result = await (handler as Function)({})

    expect(result.badges).toEqual([{ id: 'attempts-10', earnedAt: '2024-01-01T00:00:00.000Z' }])
    expect(mockServiceFrom).not.toHaveBeenCalled()
  })

  it('degrades gracefully when the earned-badges query itself errors', async () => {
    setupChains({ earned: { data: null, error: { message: 'db down' } } })
    const result = await (handler as Function)({})
    expect(result.badges).toEqual([])
  })
})
