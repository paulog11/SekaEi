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
vi.stubGlobal('getRouterParam', (event: Record<string, unknown>, key: string) => (event.__params as Record<string, unknown>)?.[key])
vi.stubGlobal('createError', createError)

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  getRouterParam: (event: Record<string, unknown>, key: string) => (event.__params as Record<string, unknown>)?.[key],
  createError,
}))

const { default: handler } = await import('~/server/api/passages/[id].delete')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function makeEvent(id?: string) {
  return { __params: id ? { id } : {} }
}

function setupDeleteChain(error: unknown = null) {
  const chain = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  }
  let eqCount = 0
  chain.eq = vi.fn().mockImplementation(() => {
    eqCount++
    if (eqCount >= 2) return Promise.resolve({ error })
    return chain
  })
  mockFrom.mockReturnValue(chain)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireApprovedUser.mockResolvedValue(MOCK_USER)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DELETE /api/passages/:id', () => {
  it('throws 401 when not authenticated', async () => {
    mockRequireApprovedUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent('passage-1'))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when id is missing', async () => {
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns { ok: true } on success', async () => {
    setupDeleteChain()
    const result = await (handler as Function)(makeEvent('passage-1'))
    expect(result).toEqual({ ok: true })
  })

  it('scopes delete to the authenticated user', async () => {
    const chain = setupDeleteChain()
    await (handler as Function)(makeEvent('passage-1'))
    expect(chain.eq).toHaveBeenCalledWith('id', 'passage-1')
    expect(chain.eq).toHaveBeenCalledWith('user_id', MOCK_USER.id)
  })

  it('throws 500 on DB error', async () => {
    setupDeleteChain({ message: 'DB failure' })
    await expect((handler as Function)(makeEvent('passage-1'))).rejects.toMatchObject({ statusCode: 500 })
  })
})
