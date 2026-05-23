import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — supabase client and h3 globals
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn()
const mockCreateClient = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

const createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

vi.stubGlobal('createError', createError)
vi.stubGlobal('getHeader', (event: Record<string, unknown>, key: string) => (event.__headers as Record<string, unknown>)?.[key] ?? null)

const { useSupabaseUser } = await import('~/server/utils/supabase')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(authHeader?: string) {
  return { __headers: authHeader ? { authorization: authHeader } : {} }
}

const MOCK_USER = { id: 'user-abc', email: 'test@example.com' }

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockReturnValue({
    auth: { getUser: mockGetUser },
  })
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_KEY = 'anon-key'
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSupabaseUser', () => {
  it('throws 401 when no Authorization header is present', async () => {
    await expect(useSupabaseUser(makeEvent() as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when header is not a Bearer token', async () => {
    await expect(useSupabaseUser(makeEvent('Basic abc123') as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when Supabase returns an error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Token expired' } })
    await expect(useSupabaseUser(makeEvent('Bearer bad-token') as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when Supabase returns no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(useSupabaseUser(makeEvent('Bearer valid-token') as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns the user when token is valid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    const result = await useSupabaseUser(makeEvent('Bearer valid-token') as any)
    expect(result).toEqual(MOCK_USER)
  })

  it('passes the Bearer token to the Supabase client', async () => {
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    await useSupabaseUser(makeEvent('Bearer my-secret-token') as any)
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        global: { headers: { Authorization: 'Bearer my-secret-token' } },
      }),
    )
  })
})
