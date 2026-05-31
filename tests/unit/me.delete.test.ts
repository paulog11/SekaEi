import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDeleteUser = vi.fn()

vi.mock('~/server/utils/supabaseService', () => ({
  useSupabaseService: () => ({
    auth: { admin: { deleteUser: mockDeleteUser } },
  }),
}))

const mockUseSupabaseUser = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: vi.fn(),
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

const { default: handler } = await import('~/server/api/me.delete')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc', email: 'test@example.com' }

function makeEvent() {
  return {}
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
  mockDeleteUser.mockResolvedValue({ data: {}, error: null })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DELETE /api/me — auth', () => {
  it('throws 401 when not authenticated', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('DELETE /api/me — deletion', () => {
  it('calls deleteUser with the authenticated user id', async () => {
    await (handler as Function)(makeEvent())
    expect(mockDeleteUser).toHaveBeenCalledWith(MOCK_USER.id)
  })

  it('returns { ok: true } on success', async () => {
    const result = await (handler as Function)(makeEvent())
    expect(result).toEqual({ ok: true })
  })

  it('throws 500 when deleteUser returns an error', async () => {
    mockDeleteUser.mockResolvedValue({ data: null, error: { message: 'DB failure' } })
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 500 })
  })
})
