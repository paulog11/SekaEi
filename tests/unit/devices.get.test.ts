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

const { default: handler } = await import('~/server/api/devices/index.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function makeEvent() {
  return {}
}

function setupDeviceChain(data: unknown[], error: unknown = null) {
  const result = { data, error }
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
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

describe('GET /api/devices — auth', () => {
  it('throws 401 when not authenticated', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    setupDeviceChain([])
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('GET /api/devices — success', () => {
  it('returns an empty devices array when no rows exist', async () => {
    setupDeviceChain([])
    const result = await (handler as Function)(makeEvent())
    expect(result).toEqual({ devices: [] })
  })

  it('maps snake_case columns to camelCase', async () => {
    setupDeviceChain([
      { device_id: 'dev-1', claimed_at: '2026-01-01T00:00:00Z' },
      { device_id: 'dev-2', claimed_at: null },
    ])
    const result = await (handler as Function)(makeEvent())
    expect(result.devices).toEqual([
      { deviceId: 'dev-1', claimedAt: '2026-01-01T00:00:00Z' },
      { deviceId: 'dev-2', claimedAt: null },
    ])
  })

  it('queries device_claims filtered by the authenticated user id', async () => {
    const c = setupDeviceChain([])
    await (handler as Function)(makeEvent())
    expect(mockFrom).toHaveBeenCalledWith('device_claims')
    expect(c.eq).toHaveBeenCalledWith('user_id', MOCK_USER.id)
  })
})

describe('GET /api/devices — DB error', () => {
  it('throws 500 when the query fails', async () => {
    setupDeviceChain([], { message: 'DB failure' })
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 500 })
  })
})
