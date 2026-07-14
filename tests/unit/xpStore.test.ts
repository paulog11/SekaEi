// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// ---------------------------------------------------------------------------
// Mocks — must be declared before dynamic imports
// ---------------------------------------------------------------------------

const mockApiFetch = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch: mockApiFetch, getDeviceId: () => 'test-device-id' }),
}))

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

const { useXpStore } = await import('~/stores/xpStore')
import type { XpAwardPayload } from '~/stores/xpStore'

function makeAward(overrides?: Partial<XpAwardPayload>): XpAwardPayload {
  return { awarded: 30, bonus: 10, total: 200, level: 2, leveledUp: true, ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('xpStore — fetchXp', () => {
  it('sets total and fetchedAt on success', async () => {
    mockApiFetch.mockResolvedValue({ total: 150 })
    const store = useXpStore()
    await store.fetchXp()
    expect(store.total).toBe(150)
    expect(store.fetchedAt).not.toBeNull()
    expect(store.error).toBeNull()
  })

  it('does not refetch within the TTL', async () => {
    mockApiFetch.mockResolvedValue({ total: 150 })
    const store = useXpStore()
    await store.fetchXp()
    await store.fetchXp()
    expect(mockApiFetch).toHaveBeenCalledTimes(1)
  })

  it('refetches when force: true', async () => {
    mockApiFetch.mockResolvedValue({ total: 150 })
    const store = useXpStore()
    await store.fetchXp()
    await store.fetchXp({ force: true })
    expect(mockApiFetch).toHaveBeenCalledTimes(2)
  })

  it('sets error on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'))
    const store = useXpStore()
    await store.fetchXp()
    expect(store.error).not.toBeNull()
  })
})

describe('xpStore — applyAward', () => {
  it('is a no-op when xp is null', () => {
    const store = useXpStore()
    store.applyAward(null)
    expect(store.total).toBe(0)
    expect(store.lastAward).toBeNull()
    expect(store.fetchedAt).toBeNull()
  })

  it('sets total, fetchedAt, and lastAward from the payload', () => {
    const store = useXpStore()
    const award = makeAward()
    store.applyAward(award)
    expect(store.total).toBe(award.total)
    expect(store.fetchedAt).not.toBeNull()
    expect(store.lastAward).toEqual(award)
  })
})

describe('xpStore — consumeLastAward', () => {
  it('returns the award and clears it; second call returns null', () => {
    const store = useXpStore()
    const award = makeAward()
    store.applyAward(award)
    expect(store.consumeLastAward()).toEqual(award)
    expect(store.consumeLastAward()).toBeNull()
  })
})

describe('xpStore — level/progress derivation', () => {
  it('derives level 2 "Honolulu" and nextThreshold 400 at total 200', () => {
    const store = useXpStore()
    store.applyAward(makeAward({ total: 200 }))
    expect(store.level.level).toBe(2)
    expect(store.level.city).toBe('Honolulu')
    expect(store.progress.nextThreshold).toBe(400)
  })
})

describe('xpStore — reset', () => {
  it('returns everything to initial state', () => {
    const store = useXpStore()
    store.applyAward(makeAward())
    store.error = 'some error'
    store.loading = true
    store.reset()
    expect(store.total).toBe(0)
    expect(store.fetchedAt).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.lastAward).toBeNull()
  })
})
