import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — before importing handler
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => ({ from: mockFrom }),
  useSupabaseUser: vi.fn(),
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

import { useSupabaseUser } from '~/server/utils/supabase'
const { default: handler } = await import('~/server/api/me.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '00000000-0000-0000-0000-000000000001'
const MOCK_USER = { id: VALID_UUID, email: 'test@example.com' }

function setupProfileChain(profileData: unknown, streakData: unknown) {
  const c = {} as Record<string, ReturnType<typeof vi.fn>>
  c.select = vi.fn().mockReturnValue(c)
  c.eq = vi.fn().mockReturnValue(c)
  c.maybeSingle = vi.fn()

  let callCount = 0
  mockFrom.mockImplementation(() => {
    callCount++
    if (callCount === 1) {
      c.maybeSingle = vi.fn().mockResolvedValue({ data: profileData, error: null })
    } else {
      c.maybeSingle = vi.fn().mockResolvedValue({ data: streakData, error: null })
    }
    return c
  })
  return c
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(useSupabaseUser).mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns all user fields and streak when authenticated', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
    setupProfileChain(
      {
        display_name: 'Test User',
        university: 'MIT',
        created_at: '2024-01-01T00:00:00Z',
        approval_status: 'approved',
        tutorial_completed_at: '2024-01-02T00:00:00Z',
        tier: 'attendee',
      },
      { current_streak: 3, longest_streak: 7, daily_goal_minutes: 10, last_practice_date: '2024-01-01' },
    )

    const result = await (handler as Function)({})

    expect(result).toMatchObject({
      user: {
        id: VALID_UUID,
        email: 'test@example.com',
        displayName: 'Test User',
        university: 'MIT',
        approvalStatus: 'approved',
        tutorialCompletedAt: '2024-01-02T00:00:00Z',
        tier: 'attendee',
      },
      streak: 3,
      longestStreak: 7,
      goalMinutes: 10,
    })
    expect(result.user.createdAt).toBe('2024-01-01T00:00:00Z')
  })

  it('returns null for optional fields when profile has none', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
    setupProfileChain(
      { display_name: null, university: null, created_at: '2024-01-01T00:00:00Z', approval_status: null, tutorial_completed_at: null },
      null,
    )

    const result = await (handler as Function)({})

    expect(result.user.displayName).toBeNull()
    expect(result.user.university).toBeNull()
    expect(result.user.tutorialCompletedAt).toBeNull()
    expect(result.user.approvalStatus).toBe('pending')
  })

  it('defaults tier to public when column is absent', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
    setupProfileChain(
      { display_name: null, university: null, created_at: '2024-01-01T00:00:00Z', approval_status: 'approved', tutorial_completed_at: null },
      null,
    )

    const result = await (handler as Function)({})
    expect(result.user.tier).toBe('public')
  })

  it('returns zeros for streak when no streak row exists', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
    setupProfileChain(
      { display_name: null, university: null, created_at: '2024-01-01T00:00:00Z', approval_status: 'approved', tutorial_completed_at: null },
      null,
    )

    const result = await (handler as Function)({})
    expect(result.streak).toBe(0)
    expect(result.goalMinutes).toBe(5)
  })

  it('throws 500 when profile query fails', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)

    const c = {} as Record<string, ReturnType<typeof vi.fn>>
    c.select = vi.fn().mockReturnValue(c)
    c.eq = vi.fn().mockReturnValue(c)
    c.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB failure' } })
    mockFrom.mockReturnValue(c)

    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })
})
