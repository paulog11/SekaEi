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

const { default: handler } = await import('~/server/api/passages/index.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function setupListChain(data: unknown[]) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error: null }),
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

describe('GET /api/passages', () => {
  it('throws 401 when not authenticated', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns passages array', async () => {
    const passage = { id: '1', title: 'My passage', text: 'Hello world', category: 'custom' }
    setupListChain([passage])
    const result = await (handler as Function)({})
    expect(result.passages).toHaveLength(1)
    expect(result.passages[0]).toMatchObject(passage)
  })

  it('returns empty array when no passages', async () => {
    setupListChain([])
    const result = await (handler as Function)({})
    expect(result.passages).toEqual([])
  })

  it('throws 500 when DB query fails', async () => {
    const c = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB failure' } }),
    }
    mockFrom.mockReturnValue(c)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })
})
