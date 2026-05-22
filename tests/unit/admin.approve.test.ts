import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()
const mockGetUserById = vi.fn()

vi.mock('~/server/utils/supabaseService', () => ({
  useSupabaseService: () => ({
    from: mockFrom,
    auth: { admin: { getUserById: mockGetUserById } },
  }),
}))

const statusSpy = vi.fn()
const headerSpy = vi.fn()
const createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
vi.stubGlobal('getQuery', (event: Record<string, unknown>) => event.__query ?? {})
vi.stubGlobal('setResponseStatus', statusSpy)
vi.stubGlobal('setResponseHeader', headerSpy)
vi.stubGlobal('createError', createError)

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  getQuery: (event: Record<string, unknown>) => event.__query ?? {},
  setResponseStatus: statusSpy,
  setResponseHeader: headerSpy,
  createError,
}))

const { default: handler } = await import('~/server/api/admin/approve.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_TOKEN = '00000000-1111-2222-3333-444444444444'
const VALID_UUID = '00000000-0000-0000-0000-000000000001'

function makeEvent(query: Record<string, string> = {}) {
  return { __query: query }
}

function setupProfileChain(profile: unknown, updateError: unknown = null) {
  let callCount = 0
  const singleChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile, error: profile ? null : { message: 'not found' } }),
  }
  const updateChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: updateError }),
  }
  mockFrom.mockImplementation(() => {
    callCount++
    return callCount <= 2 ? singleChain : updateChain
  })
  return { singleChain, updateChain }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUserById.mockResolvedValue({ data: { user: { email: 'user@example.com' } } })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/admin/approve', () => {
  it('returns 400 HTML when token is missing', async () => {
    const result = await (handler as Function)(makeEvent({ action: 'approve' }))
    expect(statusSpy).toHaveBeenCalledWith(expect.anything(), 400)
    expect(result).toContain('Invalid link')
  })

  it('returns 400 HTML when token is not a UUID', async () => {
    const result = await (handler as Function)(makeEvent({ token: 'not-a-uuid', action: 'approve' }))
    expect(statusSpy).toHaveBeenCalledWith(expect.anything(), 400)
  })

  it('returns 400 HTML when action is invalid', async () => {
    const result = await (handler as Function)(makeEvent({ token: VALID_TOKEN, action: 'unknown' }))
    expect(statusSpy).toHaveBeenCalledWith(expect.anything(), 400)
    expect(result).toContain('Invalid action')
  })

  it('returns 404 HTML when token not found in DB', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    })
    const result = await (handler as Function)(makeEvent({ token: VALID_TOKEN, action: 'approve' }))
    expect(statusSpy).toHaveBeenCalledWith(expect.anything(), 404)
  })

  it('returns 410 HTML when link was already used', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: VALID_UUID, approval_decided_at: '2024-01-01T00:00:00Z' },
        error: null,
      }),
    })
    const result = await (handler as Function)(makeEvent({ token: VALID_TOKEN, action: 'approve' }))
    expect(statusSpy).toHaveBeenCalledWith(expect.anything(), 410)
    expect(result).toContain('expired')
  })

  it('returns 200 HTML after approving a user', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: VALID_UUID, approval_decided_at: null }, error: null }),
        }
      }
      return {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
    })
    const result = await (handler as Function)(makeEvent({ token: VALID_TOKEN, action: 'approve' }))
    expect(statusSpy).toHaveBeenCalledWith(expect.anything(), 200)
    expect(result).toContain('approved')
  })

  it('returns 200 HTML after rejecting a user', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: VALID_UUID, approval_decided_at: null }, error: null }),
        }
      }
      return {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
    })
    const result = await (handler as Function)(makeEvent({ token: VALID_TOKEN, action: 'reject' }))
    expect(statusSpy).toHaveBeenCalledWith(expect.anything(), 200)
    expect(result).toContain('rejected')
  })

  it('returns 500 HTML when DB update fails', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: VALID_UUID, approval_decided_at: null }, error: null }),
        }
      }
      return {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'DB failure' } }),
      }
    })
    const result = await (handler as Function)(makeEvent({ token: VALID_TOKEN, action: 'approve' }))
    expect(statusSpy).toHaveBeenCalledWith(expect.anything(), 500)
  })
})
