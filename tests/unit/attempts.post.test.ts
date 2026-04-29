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
vi.stubGlobal('readBody', (event: Record<string, unknown>) => Promise.resolve(event.__body))
vi.stubGlobal('createError', createError)

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  getHeader: (event: Record<string, unknown>, key: string) => (event.__headers as Record<string, unknown>)?.[key],
  readBody: (event: Record<string, unknown>) => Promise.resolve(event.__body),
  createError,
}))

const { default: handler } = await import('~/server/api/attempts.post')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '00000000-0000-0000-0000-000000000001'

function makeEvent(deviceId: string | undefined, body: unknown) {
  return { __headers: { 'x-device-id': deviceId }, __body: body }
}

function setupInsertChain(result: unknown) {
  const c = {} as Record<string, ReturnType<typeof vi.fn>>
  c.insert = vi.fn().mockReturnValue(c)
  c.select = vi.fn().mockReturnValue(c)
  c.single = vi.fn().mockResolvedValue(result)
  mockFrom.mockReturnValue(c)
  return c
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/attempts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when x-device-id is missing', async () => {
    await expect((handler as Function)(makeEvent(undefined, {}))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns 400 when passageId is missing', async () => {
    await expect(
      (handler as Function)(makeEvent(VALID_UUID, {
        passageTitle: 'Test',
        scores: { accuracy: 80, fluency: 80, completeness: 80, overall: 80 },
      }))
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 when scores object is missing', async () => {
    await expect(
      (handler as Function)(makeEvent(VALID_UUID, { passageId: 'interstellar', passageTitle: 'Test' }))
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('inserts attempt and returns it on happy path', async () => {
    const row = {
      id: 'abc-123',
      user_id: VALID_UUID,
      passage_id: 'interstellar',
      passage_title: 'Interstellar',
      created_at: '2024-01-01T00:00:00Z',
      accuracy_score: 80,
      fluency_score: 75,
      completeness_score: 90,
      prosody_score: null,
      overall_score: 82,
    }
    const c = setupInsertChain({ data: row, error: null })

    const result = await (handler as Function)(makeEvent(VALID_UUID, {
      passageId: 'interstellar',
      passageTitle: 'Interstellar',
      scores: { accuracy: 80, fluency: 75, completeness: 90, overall: 82 },
    }))

    expect(result).toEqual({ attempt: row })
    expect(c.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: VALID_UUID,
      passage_id: 'interstellar',
      overall_score: 82,
    }))
  })
})
