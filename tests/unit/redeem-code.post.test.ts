import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseSupabaseUser = vi.fn()
const mockRpc = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabaseUser: mockUseSupabaseUser,
  useSupabase: () => ({ rpc: mockRpc }),
}))

const createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', (_event: unknown, ) => Promise.resolve({}))

const mockReadBody = vi.fn()
vi.stubGlobal('readBody', mockReadBody)

const { default: handler } = await import('~/server/api/redeem-code.post')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc', email: 'test@example.com' }

function makeEvent(body: unknown = {}) {
  return { __body: body } as any
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
  mockReadBody.mockImplementation((_e: unknown) => Promise.resolve(_e && typeof _e === 'object' ? (_e as any).__body : {}))
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/redeem-code', () => {
  it('returns 400 when code is missing', async () => {
    const event = makeEvent({ code: '' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400, message: 'code is required.' })
  })

  it('returns 400 with friendly message when code is not found', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'code_not_found' } })
    const event = makeEvent({ code: 'FAKE-CODE' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400, message: 'That code was not found. Check for typos.' })
  })

  it('returns 400 with friendly message when code is expired', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'code_expired' } })
    const event = makeEvent({ code: 'OLD-CODE' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400, message: 'That code has expired.' })
  })

  it('returns 400 with friendly message when code is exhausted', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'code_exhausted' } })
    const event = makeEvent({ code: 'USED-CODE' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400, message: 'That code has already been fully redeemed.' })
  })

  it('returns success:true when code is valid', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })
    const event = makeEvent({ code: 'GOOD-CODE' })
    const result = await handler(event)
    expect(result).toMatchObject({ success: true, tier: 'attendee', alreadyAttendee: false })
  })

  it('returns alreadyAttendee:true when RPC returns false (idempotent)', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })
    const event = makeEvent({ code: 'GOOD-CODE' })
    const result = await handler(event)
    expect(result).toMatchObject({ success: true, alreadyAttendee: true })
  })

  it('normalises the code to uppercase', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })
    const event = makeEvent({ code: 'good-code' })
    await handler(event)
    expect(mockRpc).toHaveBeenCalledWith('redeem_invite_code', {
      p_code: 'GOOD-CODE',
      p_user_id: MOCK_USER.id,
    })
  })
})
