import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => ({ from: mockFrom }),
  useSupabaseUser: vi.fn(),
}))

const mockRequireApprovedUser = vi.fn()
vi.mock('~/server/utils/approval', () => ({
  requireApprovedUser: mockRequireApprovedUser,
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

const { default: handler } = await import('~/server/api/me/tutorial.post')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function setupUpdateChain(error: unknown = null) {
  const c = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error }),
  }
  mockFrom.mockReturnValue(c)
  return c
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireApprovedUser.mockResolvedValue(MOCK_USER)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/me/tutorial', () => {
  it('throws 401 when not authenticated', async () => {
    mockRequireApprovedUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns completedAt on success', async () => {
    setupUpdateChain()
    const result = await (handler as Function)({})
    expect(result).toHaveProperty('completedAt')
    expect(typeof result.completedAt).toBe('string')
  })

  it('updates profiles.tutorial_completed_at', async () => {
    const c = setupUpdateChain()
    await (handler as Function)({})
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(c.update).toHaveBeenCalledWith(expect.objectContaining({ tutorial_completed_at: expect.any(String) }))
    expect(c.eq).toHaveBeenCalledWith('id', MOCK_USER.id)
  })

  it('throws 500 when DB update fails', async () => {
    setupUpdateChain({ message: 'DB failure' })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })
})
