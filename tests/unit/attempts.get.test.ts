import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — before importing handler
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

const createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
vi.stubGlobal('getHeader', (event: Record<string, unknown>, key: string) => (event.__headers as Record<string, unknown>)?.[key])
vi.stubGlobal('getQuery', (event: Record<string, unknown>) => event.__query ?? {})
vi.stubGlobal('createError', createError)

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  getHeader: (event: Record<string, unknown>, key: string) => (event.__headers as Record<string, unknown>)?.[key],
  getQuery: (event: Record<string, unknown>) => event.__query ?? {},
  createError,
}))

const { default: handler } = await import('~/server/api/attempts.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '00000000-0000-0000-0000-000000000001'

function makeEvent(deviceId: string | undefined, query: Record<string, string> = {}) {
  return { __headers: { 'x-device-id': deviceId }, __query: query }
}

function setupQueryChain(data: unknown[]) {
  const c = {} as Record<string, ReturnType<typeof vi.fn>>
  c.select = vi.fn().mockReturnValue(c)
  c.eq = vi.fn().mockReturnValue(c)
  c.order = vi.fn().mockReturnValue(c)
  c.limit = vi.fn().mockResolvedValue({ data, error: null })
  mockFrom.mockReturnValue(c)
  return c
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/attempts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when x-device-id is missing', async () => {
    await expect((handler as Function)(makeEvent(undefined))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns 401 when x-device-id is not a valid UUID', async () => {
    await expect((handler as Function)(makeEvent('not-a-uuid'))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns 401 when x-device-id is a plain string that looks close but is not UUID format', async () => {
    await expect((handler as Function)(makeEvent('12345678-1234-1234-1234-1234567890ZZ'))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns empty array when no attempts exist', async () => {
    setupQueryChain([])
    const result = await (handler as Function)(makeEvent(VALID_UUID))
    expect(result).toEqual({ attempts: [] })
  })

  it('maps DB rows to AttemptRecord shape', async () => {
    setupQueryChain([{
      id: 'row-1',
      passage_id: 'interstellar',
      passage_title: 'Interstellar',
      created_at: '2024-01-01T00:00:00.000Z',
      accuracy_score: 80,
      fluency_score: 75,
      completeness_score: 90,
      prosody_score: null,
      overall_score: 82,
    }])

    const result = await (handler as Function)(makeEvent(VALID_UUID))

    expect(result.attempts).toHaveLength(1)
    expect(result.attempts[0]).toMatchObject({
      passageId: 'interstellar',
      passageTitle: 'Interstellar',
      scores: { accuracy: 80, fluency: 75, completeness: 90, overall: 82 },
    })
    expect(result.attempts[0].scores.prosody).toBeUndefined()
  })

  it('includes prosody score when present', async () => {
    setupQueryChain([{
      id: 'row-2',
      passage_id: 'rocky-balboa',
      passage_title: 'Rocky',
      created_at: '2024-02-01T00:00:00.000Z',
      accuracy_score: 70,
      fluency_score: 65,
      completeness_score: 80,
      prosody_score: 72,
      overall_score: 71,
    }])
    const result = await (handler as Function)(makeEvent(VALID_UUID))
    expect(result.attempts[0].scores.prosody).toBe(72)
  })

  it('filters by passageId when query param is provided', async () => {
    const c = setupQueryChain([])
    await (handler as Function)(makeEvent(VALID_UUID, { passageId: 'rocky-balboa' }))
    expect(c.eq).toHaveBeenCalledWith('passage_id', 'rocky-balboa')
  })

  it('clamps limit to 500 when a larger value is requested', async () => {
    const c = setupQueryChain([])
    await (handler as Function)(makeEvent(VALID_UUID, { limit: '9999' }))
    expect(c.limit).toHaveBeenCalledWith(500)
  })

  it('uses default limit of 100 when limit is not provided', async () => {
    const c = setupQueryChain([])
    await (handler as Function)(makeEvent(VALID_UUID))
    expect(c.limit).toHaveBeenCalledWith(100)
  })

  it('throws 500 when DB query returns an error', async () => {
    const c = {} as Record<string, ReturnType<typeof vi.fn>>
    c.select = vi.fn().mockReturnValue(c)
    c.eq = vi.fn().mockReturnValue(c)
    c.order = vi.fn().mockReturnValue(c)
    c.limit = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB failure' } })
    mockFrom.mockReturnValue(c)
    await expect((handler as Function)(makeEvent(VALID_UUID))).rejects.toMatchObject({ statusCode: 500 })
  })
})
