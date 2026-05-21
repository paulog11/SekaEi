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
vi.stubGlobal('getQuery', (event: Record<string, unknown>) => event.__query ?? {})
vi.stubGlobal('createError', createError)

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  getQuery: (event: Record<string, unknown>) => event.__query ?? {},
  createError,
}))

const { default: handler } = await import('~/server/api/flagged-words.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function makeEvent(query: Record<string, string> = {}) {
  return { __query: query }
}

function setupListChain(data: unknown[]) {
  const promise = Promise.resolve({ data, error: null })
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnValue(promise),
    not: vi.fn().mockReturnValue(promise),
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

describe('GET /api/flagged-words', () => {
  it('throws 401 when not authenticated', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns words array', async () => {
    const word = { id: '1', word: 'rock', display_word: 'rock' }
    setupListChain([word])
    const result = await (handler as Function)(makeEvent())
    expect(result.words).toHaveLength(1)
    expect(result.words[0]).toMatchObject(word)
  })

  it('returns empty array when no words', async () => {
    setupListChain([])
    const result = await (handler as Function)(makeEvent())
    expect(result.words).toEqual([])
  })

  it('uses is(retired_at, null) for active status', async () => {
    const c = setupListChain([])
    await (handler as Function)(makeEvent({ status: 'active' }))
    expect(c.is).toHaveBeenCalledWith('retired_at', null)
  })

  it('clamps limit to 200', async () => {
    const c = setupListChain([])
    await (handler as Function)(makeEvent({ limit: '9999' }))
    expect(c.limit).toHaveBeenCalledWith(200)
  })
})
