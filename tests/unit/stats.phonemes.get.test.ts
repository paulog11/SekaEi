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

const { default: handler } = await import('~/server/api/stats/phonemes.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function setupMaybeSingleChain(data: unknown, error: unknown = null) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
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

describe('GET /api/stats/phonemes', () => {
  it('throws 401 when not authenticated', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns empty weakest/strongest arrays when no stats', async () => {
    setupMaybeSingleChain(null)
    const result = await (handler as Function)({})
    expect(result).toEqual({ weakest: [], strongest: [] })
  })

  it('filters out phonemes with fewer than 3 attempts', async () => {
    setupMaybeSingleChain({
      stats: {
        AE: { s: 180, c: 2 }, // only 2 attempts — excluded
        IY: { s: 270, c: 3 }, // exactly 3 — included
      },
    })
    const result = await (handler as Function)({})
    expect(result.weakest).toHaveLength(1)
    expect(result.weakest[0].phoneme).toBe('IY')
  })

  it('rounds avgScore correctly', async () => {
    setupMaybeSingleChain({ stats: { AE: { s: 200, c: 3 } } })
    const result = await (handler as Function)({})
    expect(result.weakest[0].avgScore).toBe(67) // 200/3 = 66.66... → 67
  })

  it('sorts weakest ascending and strongest descending', async () => {
    setupMaybeSingleChain({
      stats: {
        AE: { s: 300, c: 3 }, // avg 100
        IY: { s: 180, c: 3 }, // avg 60
        UW: { s: 240, c: 3 }, // avg 80
      },
    })
    const result = await (handler as Function)({})
    expect(result.weakest.map((r: any) => r.phoneme)).toEqual(['IY', 'UW', 'AE'])
    expect(result.strongest.map((r: any) => r.phoneme)).toEqual(['AE', 'UW', 'IY'])
  })

  it('caps weakest and strongest at 10 entries', async () => {
    const stats: Record<string, { s: number; c: number }> = {}
    for (let i = 0; i < 15; i++) {
      stats[`P${i}`] = { s: (i + 1) * 10 * 3, c: 3 }
    }
    setupMaybeSingleChain({ stats })
    const result = await (handler as Function)({})
    expect(result.weakest).toHaveLength(10)
    expect(result.strongest).toHaveLength(10)
  })

  it('throws 500 on DB error', async () => {
    setupMaybeSingleChain(null, { message: 'DB failure' })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })
})
