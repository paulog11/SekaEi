import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockClaimDevice = vi.fn()

vi.mock('~/server/utils/claimDevice', () => ({
  claimDevice: mockClaimDevice,
}))

const mockUseSupabaseUser = vi.fn()
vi.mock('~/server/utils/supabase', () => ({
  useSupabaseUser: mockUseSupabaseUser,
  useSupabase: () => ({}),
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

const { default: handler } = await import('~/server/api/devices/claim.post')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }
const VALID_DEVICE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

function makeEvent(body: unknown) {
  return { __body: body }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
  mockClaimDevice.mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/devices/claim', () => {
  it('throws 401 when not authenticated', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent({ deviceId: VALID_DEVICE_ID }))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when deviceId is missing', async () => {
    await expect((handler as Function)(makeEvent({}))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when deviceId is not a valid UUID-like string', async () => {
    await expect((handler as Function)(makeEvent({ deviceId: 'not-valid' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when deviceId is a number', async () => {
    await expect((handler as Function)(makeEvent({ deviceId: 12345 }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('calls claimDevice with event, deviceId, and user.id', async () => {
    await (handler as Function)(makeEvent({ deviceId: VALID_DEVICE_ID }))
    expect(mockClaimDevice).toHaveBeenCalledWith(
      expect.anything(),
      VALID_DEVICE_ID,
      MOCK_USER.id,
    )
  })

  it('returns { ok: true } on success', async () => {
    const result = await (handler as Function)(makeEvent({ deviceId: VALID_DEVICE_ID }))
    expect(result).toEqual({ ok: true })
  })
})
