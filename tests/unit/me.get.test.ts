import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must happen before importing the handler
// ---------------------------------------------------------------------------

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockMaybeSingle = vi.fn()
const mockInsert = vi.fn()
const mockSingle = vi.fn()

const mockFrom = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

const createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
vi.stubGlobal('getHeader', (event: Record<string, unknown>, key: string) => event[key])
vi.stubGlobal('createError', createError)

vi.mock('#imports', () => ({
  defineEventHandler: (fn: unknown) => fn,
  getHeader: (event: Record<string, unknown>, key: string) => event[key],
  createError,
}))

const { default: handler } = await import('~/server/api/me.get')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '00000000-0000-0000-0000-000000000001'

function setupChain({ existing }: { existing: unknown }) {
  const chain: Record<string, () => unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(
      existing === null
        ? { data: null, error: null }
        : { data: existing, error: null }
    ),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: existing, error: null }),
  }
  Object.keys(chain).forEach(k => {
    const orig = chain[k]
    chain[k] = vi.fn().mockImplementation(function(this: unknown, ...args: unknown[]) {
      return orig.call(this, ...args) ?? chain
    })
  })
  // Make each method return the chain so calls can be chained
  const c = {} as Record<string, ReturnType<typeof vi.fn>>
  c.select = vi.fn().mockReturnValue(c)
  c.eq = vi.fn().mockReturnValue(c)
  c.maybeSingle = vi.fn().mockResolvedValue(
    existing === null ? { data: null, error: null } : { data: existing, error: null }
  )
  c.insert = vi.fn().mockReturnValue(c)
  c.single = vi.fn().mockResolvedValue({ data: existing, error: null })
  mockFrom.mockReturnValue(c)
  return c
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when x-device-id is missing', async () => {
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns 401 when x-device-id is not a valid UUID', async () => {
    await expect((handler as Function)({ 'x-device-id': 'not-a-uuid' })).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns existing user when found', async () => {
    const existing = { id: VALID_UUID, created_at: '2024-01-01T00:00:00Z' }
    setupChain({ existing })
    const result = await (handler as Function)({ 'x-device-id': VALID_UUID })
    expect(result).toEqual({ user: { id: VALID_UUID, createdAt: '2024-01-01T00:00:00Z' } })
  })

  it('creates a new user when not found', async () => {
    const newUser = { id: VALID_UUID, created_at: '2024-06-01T00:00:00Z' }
    const c = {} as Record<string, ReturnType<typeof vi.fn>>
    c.select = vi.fn().mockReturnValue(c)
    c.eq = vi.fn().mockReturnValue(c)
    c.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    c.insert = vi.fn().mockReturnValue(c)
    c.single = vi.fn().mockResolvedValue({ data: newUser, error: null })
    mockFrom.mockReturnValue(c)

    const result = await (handler as Function)({ 'x-device-id': VALID_UUID })
    expect(result).toEqual({ user: { id: VALID_UUID, createdAt: '2024-06-01T00:00:00Z' } })
    expect(c.insert).toHaveBeenCalledWith({ id: VALID_UUID })
  })
})
