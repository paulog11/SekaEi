import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()
const mockUseSupabaseUser = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => ({ from: mockFrom }),
  useSupabaseUser: mockUseSupabaseUser,
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

const { default: handler } = await import('~/server/api/stats/streak.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function setupMaybeSingleChain(data: unknown) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  }
  mockFrom.mockReturnValue(c)
  return c
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/stats/streak', () => {
  it('throws 401 when not authenticated', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns defaults when no streak record exists', async () => {
    setupMaybeSingleChain(null)
    const result = await (handler as Function)({})
    expect(result).toMatchObject({ current: 0, longest: 0, goalMinutes: 5 })
    expect(typeof result.todayMet).toBe('boolean')
  })

  it('returns streak data from the DB', async () => {
    const today = new Date().toISOString().slice(0, 10)
    setupMaybeSingleChain({
      current_streak: 7,
      longest_streak: 14,
      daily_goal_minutes: 10,
      last_practice_date: today,
    })
    const result = await (handler as Function)({})
    expect(result).toMatchObject({ current: 7, longest: 14, goalMinutes: 10, todayMet: true })
  })

  it('returns todayMet: false when last_practice_date is not today', async () => {
    setupMaybeSingleChain({
      current_streak: 3,
      longest_streak: 5,
      daily_goal_minutes: 5,
      last_practice_date: '2000-01-01',
    })
    const result = await (handler as Function)({})
    expect(result.todayMet).toBe(false)
  })

  it('queries the daily_streaks table for the current user', async () => {
    const c = setupMaybeSingleChain(null)
    await (handler as Function)({})
    expect(mockFrom).toHaveBeenCalledWith('daily_streaks')
    expect(c.eq).toHaveBeenCalledWith('user_id', MOCK_USER.id)
  })
})
