import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — before importing handler
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => ({ from: mockFrom }),
  useSupabaseUser: vi.fn(),
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

import { useSupabaseUser } from '~/server/utils/supabase'
const { default: handler } = await import('~/server/api/attempts.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '00000000-0000-0000-0000-000000000001'
const MOCK_USER = { id: VALID_UUID, email: 'test@example.com' }

function makeEvent(query: Record<string, string> = {}) {
  return { __query: query }
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

  it('returns 401 when not authenticated', async () => {
    vi.mocked(useSupabaseUser).mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns empty array when no attempts exist', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
    setupQueryChain([])
    const result = await (handler as Function)(makeEvent())
    expect(result).toEqual({ attempts: [] })
  })

  it('maps DB rows to AttemptRecord shape', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
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

    const result = await (handler as Function)(makeEvent())

    expect(result.attempts).toHaveLength(1)
    expect(result.attempts[0]).toMatchObject({
      id: 'row-1',
      passageId: 'interstellar',
      passageTitle: 'Interstellar',
      scores: { accuracy: 80, fluency: 75, completeness: 90, overall: 82 },
    })
    expect(result.attempts[0].scores.prosody).toBeUndefined()
  })

  it('includes prosody score when present', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
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
    const result = await (handler as Function)(makeEvent())
    expect(result.attempts[0].scores.prosody).toBe(72)
  })

  it('filters by passageId when query param is provided', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
    const c = setupQueryChain([])
    await (handler as Function)(makeEvent({ passageId: 'rocky-balboa' }))
    expect(c.eq).toHaveBeenCalledWith('passage_id', 'rocky-balboa')
  })

  it('clamps limit to 500 when a larger value is requested', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
    const c = setupQueryChain([])
    await (handler as Function)(makeEvent({ limit: '9999' }))
    expect(c.limit).toHaveBeenCalledWith(500)
  })

  it('uses default limit of 100 when limit is not provided', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
    const c = setupQueryChain([])
    await (handler as Function)(makeEvent())
    expect(c.limit).toHaveBeenCalledWith(100)
  })

  it('throws 500 when DB query returns an error', async () => {
    vi.mocked(useSupabaseUser).mockResolvedValue(MOCK_USER as any)
    const c = {} as Record<string, ReturnType<typeof vi.fn>>
    c.select = vi.fn().mockReturnValue(c)
    c.eq = vi.fn().mockReturnValue(c)
    c.order = vi.fn().mockReturnValue(c)
    c.limit = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB failure' } })
    mockFrom.mockReturnValue(c)
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 500 })
  })
})
