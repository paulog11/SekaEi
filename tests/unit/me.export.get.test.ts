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

const headerSpy = vi.fn()

const createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
vi.stubGlobal('setResponseHeader', headerSpy)
vi.stubGlobal('createError', createError)

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  setResponseHeader: headerSpy,
  createError,
}))

const { default: handler } = await import('~/server/api/me/export.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc', email: 'test@example.com' }

function makeEvent() {
  return {}
}

function makeOkChain(data: unknown) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  }
  // list queries resolve with array
  ;(c as unknown as Record<string, unknown>)._listResolve = { data, error: null }
  return c
}

function setupAllOk() {
  const profile = { id: 'user-abc', display_name: 'Alice' }
  let callCount = 0

  mockFrom.mockImplementation((table: string) => {
    callCount++
    const listResult = { data: [], error: null }
    const singleResult = { data: callCount === 1 ? profile : null, error: null }

    const c = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(singleResult),
    }

    // For list-returning tables, eq() is the terminal after order()
    let chainDepth = 0
    c.eq = vi.fn().mockImplementation(() => {
      chainDepth++
      // profile and daily_streaks use maybeSingle(); others are list queries
      if (table === 'profiles' || table === 'daily_streaks') return c
      // order() hasn't been called yet — still chainable
      return c
    })
    c.order = vi.fn().mockResolvedValue(listResult)

    return c
  })
}

function setupProfileError() {
  mockFrom.mockImplementation((table: string) => {
    const c = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(
        table === 'profiles'
          ? { data: null, error: { message: 'DB failure' } }
          : { data: null, error: null }
      ),
    }
    c.order = vi.fn().mockResolvedValue({ data: [], error: null })
    return c
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSupabaseUser.mockResolvedValue(MOCK_USER)
  setupAllOk()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/me/export — auth', () => {
  it('throws 401 when not authenticated', async () => {
    mockUseSupabaseUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('GET /api/me/export — success', () => {
  it('returns a bundle with all expected keys', async () => {
    const result = await (handler as Function)(makeEvent())
    expect(result).toHaveProperty('exportedAt')
    expect(result).toHaveProperty('profile')
    expect(result).toHaveProperty('attempts')
    expect(result).toHaveProperty('customPassages')
    expect(result).toHaveProperty('streak')
    expect(result).toHaveProperty('phonemeStats')
    expect(result).toHaveProperty('flaggedWords')
  })

  it('sets Content-Disposition attachment header', async () => {
    await (handler as Function)(makeEvent())
    expect(headerSpy).toHaveBeenCalledWith(
      expect.anything(),
      'Content-Disposition',
      'attachment; filename="sekatoku-data.json"'
    )
  })

  it('exportedAt is an ISO date string', async () => {
    const result = await (handler as Function)(makeEvent())
    expect(() => new Date(result.exportedAt).toISOString()).not.toThrow()
  })
})

describe('GET /api/me/export — DB error', () => {
  it('throws 500 when profiles query fails', async () => {
    setupProfileError()
    await expect((handler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 500 })
  })
})
