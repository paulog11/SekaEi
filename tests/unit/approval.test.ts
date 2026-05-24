import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseSupabaseUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabaseUser: mockUseSupabaseUser,
  useSupabase: () => ({ from: mockFrom }),
}))

const createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

vi.stubGlobal('createError', createError)

const { requireApprovedUser, requireAccess, getUserTier } = await import('~/server/utils/approval')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc', email: 'test@example.com' }

function setupProfileChain(data: Record<string, string> | null) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  }
  mockFrom.mockReturnValue(c)
  return c
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('requireApprovedUser', () => {
  it('throws 401 when useSupabaseUser rejects', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect(requireApprovedUser({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when approval_status is "pending"', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain({ approval_status: 'pending' })
    await expect(requireApprovedUser({} as any)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Account pending approval.',
    })
  })

  it('throws 403 when approval_status is "rejected"', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain({ approval_status: 'rejected' })
    await expect(requireApprovedUser({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 403 when profile row is not found', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain(null)
    await expect(requireApprovedUser({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns the user when approval_status is "approved"', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain({ approval_status: 'approved' })
    const result = await requireApprovedUser({} as any)
    expect(result).toEqual(MOCK_USER)
  })

  it('queries the correct table and column', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    const c = setupProfileChain({ approval_status: 'approved' })
    await requireApprovedUser({} as any)
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(c.select).toHaveBeenCalledWith('approval_status')
    expect(c.eq).toHaveBeenCalledWith('id', MOCK_USER.id)
  })
})

describe('getUserTier', () => {
  it('returns "public" when tier column is missing', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain(null)
    const tier = await getUserTier({} as any, MOCK_USER.id)
    expect(tier).toBe('public')
  })

  it('returns "attendee" when tier column is "attendee"', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain({ tier: 'attendee' })
    const tier = await getUserTier({} as any, MOCK_USER.id)
    expect(tier).toBe('attendee')
  })
})

describe('requireAccess with level "attendee"', () => {
  it('throws 403 when user tier is "public"', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain({ tier: 'public' })
    await expect(requireAccess({} as any, 'attendee')).rejects.toMatchObject({
      statusCode: 403,
      message: 'This feature is for program attendees.',
    })
  })

  it('returns user when tier is "attendee"', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain({ tier: 'attendee' })
    const result = await requireAccess({} as any, 'attendee')
    expect(result).toEqual(MOCK_USER)
  })
})
