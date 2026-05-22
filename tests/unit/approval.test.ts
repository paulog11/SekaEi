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

const { requireApprovedUser } = await import('~/server/utils/approval')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc', email: 'test@example.com' }

function setupProfileChain(approvalStatus: string | null) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: approvalStatus !== null ? { approval_status: approvalStatus } : null,
      error: null,
    }),
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
    setupProfileChain('pending')
    await expect(requireApprovedUser({} as any)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Account pending approval.',
    })
  })

  it('throws 403 when approval_status is "rejected"', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain('rejected')
    await expect(requireApprovedUser({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 403 when profile row is not found', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain(null)
    await expect(requireApprovedUser({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns the user when approval_status is "approved"', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    setupProfileChain('approved')
    const result = await requireApprovedUser({} as any)
    expect(result).toEqual(MOCK_USER)
  })

  it('queries the correct table and column', async () => {
    mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
    const c = setupProfileChain('approved')
    await requireApprovedUser({} as any)
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(c.select).toHaveBeenCalledWith('approval_status')
    expect(c.eq).toHaveBeenCalledWith('id', MOCK_USER.id)
  })
})
