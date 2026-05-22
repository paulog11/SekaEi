// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mockAssessmentResult } from '../fixtures/mockAssessmentResult'

// ---------------------------------------------------------------------------
// Mocks — must be declared before dynamic imports
// ---------------------------------------------------------------------------

const mockApiFetch = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch: mockApiFetch, getDeviceId: () => 'test-device-id' }),
}))

vi.mock('~/stores/streakStore', () => ({
  useStreakStore: () => ({ invalidate: vi.fn() }),
}))

vi.mock('~/stores/phonemeStatsStore', () => ({
  usePhonemeStatsStore: () => ({ invalidate: vi.fn() }),
}))

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

const { useHistory } = await import('~/composables/useHistory')
import type { AttemptRecord } from '~/composables/useHistory'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAttempt(overrides?: Partial<AttemptRecord>): AttemptRecord {
  return {
    passageId: 'interstellar',
    passageTitle: 'Interstellar',
    timestamp: Date.now(),
    scores: { accuracy: 80, fluency: 75, completeness: 90, overall: 82 },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia()) // fresh store state between each test
})

describe('useHistory — getHistory', () => {
  it('returns empty array when API returns empty', async () => {
    mockApiFetch.mockResolvedValue({ attempts: [] })
    const { getHistory } = useHistory()
    expect(await getHistory()).toEqual([])
  })

  it('returns attempts from API', async () => {
    const attempt = makeAttempt()
    mockApiFetch.mockResolvedValue({ attempts: [attempt] })
    const { getHistory } = useHistory()
    expect(await getHistory()).toHaveLength(1)
    expect((await getHistory())[0]).toMatchObject({ passageId: 'interstellar' })
  })

  it('returns empty array when API throws', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'))
    const { getHistory } = useHistory()
    expect(await getHistory()).toEqual([])
  })

  it('returns cached result without a second API call', async () => {
    mockApiFetch.mockResolvedValue({ attempts: [makeAttempt()] })
    const { getHistory } = useHistory()
    await getHistory()
    await getHistory()
    expect(mockApiFetch).toHaveBeenCalledTimes(1)
  })

  it('re-fetches when force: true', async () => {
    mockApiFetch.mockResolvedValue({ attempts: [makeAttempt()] })
    const { getHistory } = useHistory()
    await getHistory()
    await getHistory({ force: true })
    expect(mockApiFetch).toHaveBeenCalledTimes(2)
  })
})

describe('useHistory — addAttempt', () => {
  it('calls API with correct payload', async () => {
    mockApiFetch.mockResolvedValue({})
    const { addAttempt } = useHistory()
    const attempt = makeAttempt()
    await addAttempt(attempt)

    expect(mockApiFetch).toHaveBeenCalledWith('/api/attempts', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({ passageId: 'interstellar' }),
    }))
  })

  it('does not throw when API fails', async () => {
    mockApiFetch.mockRejectedValue(new Error('Server down'))
    const { addAttempt } = useHistory()
    await expect(addAttempt(makeAttempt())).resolves.not.toThrow()
  })

  it('forwards azureResult to the API body when provided', async () => {
    mockApiFetch.mockResolvedValue({})
    const { addAttempt } = useHistory()
    const attempt = makeAttempt()
    const azure = mockAssessmentResult()
    await addAttempt(attempt, azure)

    expect(mockApiFetch).toHaveBeenCalledWith('/api/attempts', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({ azureResult: azure }),
    }))
  })

  it('invalidates the cache so next getHistory re-fetches', async () => {
    mockApiFetch.mockResolvedValue({ attempts: [makeAttempt()] })
    const { getHistory, addAttempt } = useHistory()
    await getHistory()           // populates cache
    await addAttempt(makeAttempt()) // should invalidate
    await getHistory()           // should re-fetch
    expect(mockApiFetch).toHaveBeenCalledTimes(3) // getHistory + addAttempt + getHistory
  })
})

describe('useHistory — getByPassage', () => {
  it('fetches with passageId query param', async () => {
    mockApiFetch.mockResolvedValue({ attempts: [] })
    const { getByPassage } = useHistory()
    await getByPassage('interstellar')
    expect(mockApiFetch).toHaveBeenCalledWith('/api/attempts?passageId=interstellar')
  })

  it('returns only attempts for the given passage', async () => {
    const attempt = makeAttempt({ passageId: 'interstellar' })
    mockApiFetch.mockResolvedValue({ attempts: [attempt] })
    const { getByPassage } = useHistory()
    const result = await getByPassage('interstellar')
    expect(result).toHaveLength(1)
    expect(result[0].passageId).toBe('interstellar')
  })

  it('returns empty array when API throws', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'))
    const { getByPassage } = useHistory()
    expect(await getByPassage('interstellar')).toEqual([])
  })
})
