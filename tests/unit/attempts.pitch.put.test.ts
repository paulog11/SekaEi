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
vi.stubGlobal('getRouterParam', (event: Record<string, unknown>, key: string) => (event.__params as Record<string, unknown>)?.[key])
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', (event: Record<string, unknown>) => Promise.resolve(event.__body))

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  getRouterParam: (event: Record<string, unknown>, key: string) => (event.__params as Record<string, unknown>)?.[key],
  createError,
}))

const { default: handler } = await import('~/server/api/attempts/[id]/pitch.put')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }
const VALID_SERIES = { samples: [{ t: 0, hz: 220 }], durationSec: 1, medianHz: 220 }

function makeEvent(slug?: string, body?: unknown) {
  return { __params: slug ? { id: slug } : {}, __body: body }
}

function setupUpdateChain(error: unknown = null) {
  const c = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: undefined as unknown,
  }
  // Final `.eq()` resolves the chain
  const eqMock = vi.fn()
    .mockReturnValueOnce(c)        // first eq returns chain
    .mockResolvedValueOnce({ error }) // second eq resolves
  c.eq = eqMock
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

describe('PUT /api/attempts/:id/pitch', () => {
  it('throws 401 when not authenticated', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent('slug-1', { student: VALID_SERIES, native: null })))
      .rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when slug is missing', async () => {
    await expect((handler as Function)(makeEvent(undefined, { student: VALID_SERIES, native: null })))
      .rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when body is missing', async () => {
    await expect((handler as Function)(makeEvent('slug', null)))
      .rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when student is invalid (not an object)', async () => {
    await expect((handler as Function)(makeEvent('slug', { student: 'nope', native: null })))
      .rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when student.samples is not an array', async () => {
    await expect((handler as Function)(makeEvent('slug', {
      student: { samples: 'nope', durationSec: 1, medianHz: 220 },
      native: null,
    }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when sample count exceeds the cap', async () => {
    const huge = { samples: new Array(5001).fill({ t: 0, hz: 220 }), durationSec: 1, medianHz: 220 }
    await expect((handler as Function)(makeEvent('slug', { student: huge, native: null })))
      .rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when native is provided but invalid', async () => {
    await expect((handler as Function)(makeEvent('slug', {
      student: VALID_SERIES,
      native: { samples: 'nope', durationSec: 1, medianHz: 220 },
    }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('accepts native: null', async () => {
    setupUpdateChain()
    const result = await (handler as Function)(makeEvent('slug-1', { student: VALID_SERIES, native: null }))
    expect(result).toEqual({ ok: true })
  })

  it('scopes update by slug and user_id', async () => {
    const chain = setupUpdateChain()
    await (handler as Function)(makeEvent('slug-1', { student: VALID_SERIES, native: VALID_SERIES }))

    expect(mockFrom).toHaveBeenCalledWith('attempts')
    expect(chain.update).toHaveBeenCalledWith({
      pitch_series: { student: VALID_SERIES, native: VALID_SERIES },
    })
    expect(chain.eq).toHaveBeenNthCalledWith(1, 'slug', 'slug-1')
    expect(chain.eq).toHaveBeenNthCalledWith(2, 'user_id', MOCK_USER.id)
  })

  it('throws 500 when the DB update fails', async () => {
    setupUpdateChain({ message: 'db down' })
    await expect((handler as Function)(makeEvent('slug-1', { student: VALID_SERIES, native: null })))
      .rejects.toMatchObject({ statusCode: 500 })
  })
})
