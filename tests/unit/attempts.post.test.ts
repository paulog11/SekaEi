import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAssessmentResult } from '../fixtures/mockAssessmentResult'

// ---------------------------------------------------------------------------
// Mocks — before importing handler
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

vi.mock('~/server/utils/updateStreak', () => ({
  computeStreak: vi.fn().mockReturnValue({ current_streak: 1, longest_streak: 1, last_practice_date: '2024-01-01' }),
}))

vi.mock('~/server/utils/updatePhonemeStats', () => ({
  extractPhonemeDelta: vi.fn().mockReturnValue({}),
}))

const mockFlagDifficultWordsSilently = vi.fn().mockResolvedValue(undefined)

vi.mock('~/server/utils/flagDifficultWords', () => ({
  flagDifficultWordsSilently: mockFlagDifficultWordsSilently,
}))

const mockServiceRpc = vi.fn()

vi.mock('~/server/utils/supabaseService', () => ({
  useSupabaseService: () => ({ rpc: mockServiceRpc }),
}))

const createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
vi.stubGlobal('readBody', (event: Record<string, unknown>) => Promise.resolve(event.__body))
vi.stubGlobal('createError', createError)

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  readBody: (event: Record<string, unknown>) => Promise.resolve(event.__body),
  createError,
}))

const { default: handler } = await import('~/server/api/attempts.post')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '00000000-0000-0000-0000-000000000001'
const MOCK_USER = { id: VALID_UUID, email: 'test@example.com' }

function makeEvent(body: unknown) {
  return { __body: body }
}

function setupInsertChain(result: unknown, priorBestResult: unknown = { data: [], error: null }) {
  const c = {} as Record<string, ReturnType<typeof vi.fn>>
  c.select = vi.fn().mockReturnValue(c)
  c.eq = vi.fn().mockReturnValue(c)
  c.order = vi.fn().mockReturnValue(c)
  c.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  c.insert = vi.fn().mockReturnValue(c)
  c.single = vi.fn().mockResolvedValue(result)
  c.limit = vi.fn().mockResolvedValue(priorBestResult)
  c.update = vi.fn().mockReturnValue(c)
  c.upsert = vi.fn().mockResolvedValue({ error: null })
  c.rpc = vi.fn().mockResolvedValue({ error: null })
  c.in = vi.fn().mockReturnValue(c)
  mockFrom.mockReturnValue(c)
  // Default: add_xp succeeds with a total of 0 (overridden per-test as needed).
  mockServiceRpc.mockResolvedValue({ data: 0, error: null })
  return c
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const VALID_BODY = {
  passageId: 'interstellar',
  passageTitle: 'Interstellar',
  scores: { accuracy: 80, fluency: 75, completeness: 90, overall: 82 },
}

const MOCK_ROW = {
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

describe('POST /api/attempts — auth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockRequireApprovedUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent({}))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns 403 when user is not approved', async () => {
    mockRequireApprovedUser.mockRejectedValue(createError({ statusCode: 403, message: 'Account pending approval.' }))
    await expect((handler as Function)(makeEvent({}))).rejects.toMatchObject({ statusCode: 403 })
  })
})

describe('POST /api/attempts — body validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue(MOCK_USER)
  })

  it('returns 400 when passageId is missing', async () => {
    await expect(
      (handler as Function)(makeEvent({
        passageTitle: 'Test',
        scores: { accuracy: 80, fluency: 80, completeness: 80, overall: 80 },
      }))
    ).rejects.toMatchObject({ statusCode: 400, message: 'passageId is required.' })
  })

  it('returns 400 when passageId is whitespace only', async () => {
    await expect(
      (handler as Function)(makeEvent({ ...VALID_BODY, passageId: '   ' }))
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 when passageTitle is missing', async () => {
    await expect(
      (handler as Function)(makeEvent({
        passageId: 'interstellar',
        scores: { accuracy: 80, fluency: 80, completeness: 80, overall: 80 },
      }))
    ).rejects.toMatchObject({ statusCode: 400, message: 'passageTitle is required.' })
  })

  it('returns 400 when passageTitle is whitespace only', async () => {
    await expect(
      (handler as Function)(makeEvent({ ...VALID_BODY, passageTitle: '   ' }))
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 when scores object is missing', async () => {
    await expect(
      (handler as Function)(makeEvent({ passageId: 'interstellar', passageTitle: 'Test' }))
    ).rejects.toMatchObject({ statusCode: 400, message: 'scores object is required.' })
  })

  it('returns 400 when accuracy is missing from scores', async () => {
    const { accuracy: _a, ...badScores } = VALID_BODY.scores
    await expect(
      (handler as Function)(makeEvent({ ...VALID_BODY, scores: badScores }))
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 when a score field is a string instead of a number', async () => {
    await expect(
      (handler as Function)(makeEvent({ ...VALID_BODY, scores: { ...VALID_BODY.scores, accuracy: '80' } }))
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})

describe('POST /api/attempts — happy path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue(MOCK_USER)
  })

  it('inserts attempt and returns it', async () => {
    const c = setupInsertChain({ data: MOCK_ROW, error: null })

    const result = await (handler as Function)(makeEvent(VALID_BODY))

    expect(result).toMatchObject({ attempt: MOCK_ROW })
    expect(c.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: VALID_UUID,
      passage_id: 'interstellar',
      overall_score: 82,
    }))
  })

  it('rounds fractional scores before inserting', async () => {
    const c = setupInsertChain({ data: MOCK_ROW, error: null })

    await (handler as Function)(makeEvent({
      ...VALID_BODY,
      scores: { accuracy: 79.7, fluency: 74.2, completeness: 89.9, overall: 81.5 },
    }))

    expect(c.insert).toHaveBeenCalledWith(expect.objectContaining({
      accuracy_score: 80,
      fluency_score: 74,
      completeness_score: 90,
      overall_score: 82,
    }))
  })

  it('stores prosody_score when provided', async () => {
    const c = setupInsertChain({ data: MOCK_ROW, error: null })

    await (handler as Function)(makeEvent({
      ...VALID_BODY,
      scores: { ...VALID_BODY.scores, prosody: 77.4 },
    }))

    expect(c.insert).toHaveBeenCalledWith(expect.objectContaining({ prosody_score: 77 }))
  })

  it('stores prosody_score as null when not provided', async () => {
    const c = setupInsertChain({ data: MOCK_ROW, error: null })

    await (handler as Function)(makeEvent(VALID_BODY))

    expect(c.insert).toHaveBeenCalledWith(expect.objectContaining({ prosody_score: null }))
  })

  it('truncates passageTitle to 120 characters', async () => {
    const c = setupInsertChain({ data: MOCK_ROW, error: null })
    const longTitle = 'A'.repeat(200)

    await (handler as Function)(makeEvent({ ...VALID_BODY, passageTitle: longTitle }))

    expect(c.insert).toHaveBeenCalledWith(expect.objectContaining({
      passage_title: 'A'.repeat(120),
    }))
  })

  it('triggers flagDifficultWordsSilently when azureResult is provided', async () => {
    setupInsertChain({ data: MOCK_ROW, error: null })
    const azureResult = mockAssessmentResult()

    await (handler as Function)(makeEvent({ ...VALID_BODY, azureResult }))

    expect(mockFlagDifficultWordsSilently).toHaveBeenCalledWith(
      expect.anything(),
      VALID_UUID,
      azureResult,
      'interstellar',
    )
  })

  it('does not call flagDifficultWordsSilently when azureResult is absent', async () => {
    setupInsertChain({ data: MOCK_ROW, error: null })

    await (handler as Function)(makeEvent(VALID_BODY))

    expect(mockFlagDifficultWordsSilently).not.toHaveBeenCalled()
  })
})

describe('POST /api/attempts — XP awarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue(MOCK_USER)
  })

  it('response contains xp with awarded, bonus, total, level, leveledUp on a successful save', async () => {
    setupInsertChain({ data: MOCK_ROW, error: null }) // no prior attempts -> priorBest null
    mockServiceRpc.mockResolvedValue({ data: 30, error: null })

    // overall 82 -> base 20 (80-89) + 10 first-attempt bonus = 30
    const result = await (handler as Function)(makeEvent(VALID_BODY))

    expect(result.xp).toEqual({
      awarded: 30,
      bonus: 10,
      total: 30,
      level: 1,
      leveledUp: false,
    })
  })

  it('issues the prior-best query with user_id and passage_id filters before the insert', async () => {
    const c = setupInsertChain({ data: MOCK_ROW, error: null })
    mockServiceRpc.mockResolvedValue({ data: 30, error: null })

    await (handler as Function)(makeEvent(VALID_BODY))

    expect(c.eq).toHaveBeenCalledWith('user_id', VALID_UUID)
    expect(c.eq).toHaveBeenCalledWith('passage_id', 'interstellar')
    expect(c.order).toHaveBeenCalledWith('overall_score', { ascending: false })
    expect(c.limit.mock.invocationCallOrder[0]).toBeLessThan(c.insert.mock.invocationCallOrder[0])
  })

  it('awards the mastery bonus when prior best was 85 and the new overall is 92', async () => {
    setupInsertChain({ data: MOCK_ROW, error: null }, { data: [{ overall_score: 85 }], error: null })
    mockServiceRpc.mockResolvedValue({ data: 80, error: null })

    const result = await (handler as Function)(makeEvent({
      ...VALID_BODY,
      scores: { accuracy: 90, fluency: 90, completeness: 90, overall: 92 },
    }))

    expect(result.xp.bonus).toBe(50)
    expect(result.xp.awarded).toBe(80)
  })

  it('returns xp: null and still saves the attempt when the add_xp RPC fails', async () => {
    setupInsertChain({ data: MOCK_ROW, error: null })
    mockServiceRpc.mockResolvedValue({ data: null, error: { message: 'rpc failure' } })

    const result = await (handler as Function)(makeEvent(VALID_BODY))

    expect(result.attempt).toEqual(MOCK_ROW)
    expect(result.xp).toBeNull()
  })

  it('reports leveledUp: true when the new total crosses a level threshold', async () => {
    setupInsertChain({ data: MOCK_ROW, error: null }, { data: [{ overall_score: 82 }], error: null })
    mockServiceRpc.mockResolvedValue({ data: 160, error: null })

    // priorBest 82, overall 82 -> base 20, no bonuses -> awarded 20; 160 - 20 = 140 (level 1), 160 (level 2)
    const result = await (handler as Function)(makeEvent(VALID_BODY))

    expect(result.xp.level).toBe(2)
    expect(result.xp.leveledUp).toBe(true)
  })

  it('reports leveledUp: false when the new total does not cross a level threshold', async () => {
    setupInsertChain({ data: MOCK_ROW, error: null }, { data: [{ overall_score: 82 }], error: null })
    mockServiceRpc.mockResolvedValue({ data: 100, error: null })

    const result = await (handler as Function)(makeEvent(VALID_BODY))

    expect(result.xp.level).toBe(1)
    expect(result.xp.leveledUp).toBe(false)
  })
})

describe('POST /api/attempts — DB error', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue(MOCK_USER)
  })

  it('throws 500 when DB insert returns an error', async () => {
    setupInsertChain({ data: null, error: { message: 'unique constraint violation' } })

    await expect(
      (handler as Function)(makeEvent(VALID_BODY))
    ).rejects.toMatchObject({ statusCode: 500 })
  })
})
