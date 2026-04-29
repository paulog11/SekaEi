import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock useApi so tests don't need a real browser or server
// ---------------------------------------------------------------------------

const mockApiFetch = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch: mockApiFetch, getDeviceId: () => 'test-device-id' }),
}))

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

const { useHistory, _cache } = await import('~/composables/useHistory')
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
  _cache.all = null
  _cache.passageId = null
  _cache.passageData = null
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
