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

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  getRouterParam: (event: Record<string, unknown>, key: string) => (event.__params as Record<string, unknown>)?.[key],
  createError,
}))

const { default: handler } = await import('~/server/api/attempts/[id].get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function makeEvent(slug?: string) {
  return { __params: slug ? { id: slug } : {} }
}

function setupSingleChain(data: unknown, error: unknown = null) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
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

describe('GET /api/attempts/:id', () => {
  it('throws 401 when not authenticated', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent('slug-1'))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when slug is missing', async () => {
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when attempt is not found', async () => {
    setupSingleChain(null, { message: 'not found' })
    await expect((handler as Function)(makeEvent('missing-slug'))).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns attempt with all fields', async () => {
    setupSingleChain({
      slug: 'abc123',
      passage_id: 'interstellar',
      passage_title: 'Interstellar',
      created_at: '2024-01-01T00:00:00Z',
      accuracy_score: 80,
      fluency_score: 75,
      completeness_score: 90,
      prosody_score: 72,
      overall_score: 82,
      azure_result: null,
    })

    const result = await (handler as Function)(makeEvent('abc123'))

    expect(result.attempt).toMatchObject({
      slug: 'abc123',
      passageId: 'interstellar',
      passageTitle: 'Interstellar',
      scores: { accuracy: 80, fluency: 75, completeness: 90, prosody: 72, overall: 82 },
    })
  })

  it('includes azureResult when present', async () => {
    const azureResult = { PronunciationAssessment: { PronScore: 85 } }
    setupSingleChain({
      slug: 'xyz789',
      passage_id: 'test',
      passage_title: 'Test',
      created_at: '2024-01-01T00:00:00Z',
      accuracy_score: 80,
      fluency_score: 80,
      completeness_score: 80,
      prosody_score: null,
      overall_score: 80,
      azure_result: azureResult,
    })

    const result = await (handler as Function)(makeEvent('xyz789'))
    expect(result.attempt.azureResult).toEqual(azureResult)
  })

  it('returns pitchSeries when present', async () => {
    const pitch = {
      student: { samples: [{ t: 0, hz: 220 }], durationSec: 1, medianHz: 220 },
      native: { samples: [{ t: 0, hz: 180 }], durationSec: 1, medianHz: 180 },
    }
    setupSingleChain({
      slug: 'pitch-1',
      passage_id: 'p',
      passage_title: 'P',
      created_at: '2024-01-01T00:00:00Z',
      accuracy_score: 80, fluency_score: 80, completeness_score: 80, prosody_score: null, overall_score: 80,
      azure_result: null,
      pitch_series: pitch,
    })

    const result = await (handler as Function)(makeEvent('pitch-1'))
    expect(result.attempt.pitchSeries).toEqual(pitch)
  })

  it('returns pitchSeries: null when column is null', async () => {
    setupSingleChain({
      slug: 'no-pitch',
      passage_id: 'p',
      passage_title: 'P',
      created_at: '2024-01-01T00:00:00Z',
      accuracy_score: 80, fluency_score: 80, completeness_score: 80, prosody_score: null, overall_score: 80,
      azure_result: null,
      pitch_series: null,
    })

    const result = await (handler as Function)(makeEvent('no-pitch'))
    expect(result.attempt.pitchSeries).toBeNull()
  })
})
