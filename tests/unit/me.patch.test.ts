import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => ({ from: mockFrom }),
  useSupabaseUser: vi.fn(),
}))

const mockRequireApprovedUser = vi.fn()
vi.mock('~/server/utils/approval', () => ({
  requireApprovedUser: mockRequireApprovedUser,
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

const { default: handler } = await import('~/server/api/me.patch')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function makeEvent(body: unknown) {
  return { __body: body }
}

function setupUpdateChain(error: unknown = null) {
  const c = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error }),
  }
  mockFrom.mockReturnValue(c)
  return c
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireApprovedUser.mockResolvedValue(MOCK_USER)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PATCH /api/me — auth', () => {
  it('throws 401 when not authenticated', async () => {
    mockRequireApprovedUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent({}))).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('PATCH /api/me — displayName validation', () => {
  it('throws 400 when displayName is not a string', async () => {
    await expect((handler as Function)(makeEvent({ displayName: 42 }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when displayName is empty', async () => {
    await expect((handler as Function)(makeEvent({ displayName: '   ' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when displayName exceeds 30 characters', async () => {
    await expect((handler as Function)(makeEvent({ displayName: 'A'.repeat(31) }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when displayName contains disallowed characters', async () => {
    await expect((handler as Function)(makeEvent({ displayName: 'hello@world' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when displayName contains a bad word', async () => {
    await expect((handler as Function)(makeEvent({ displayName: 'fuck' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('accepts a valid displayName with letters, numbers, spaces, and allowed symbols', async () => {
    setupUpdateChain()
    const result = await (handler as Function)(makeEvent({ displayName: 'Alice_B.C-2' }))
    expect(result).toMatchObject({ displayName: 'Alice_B.C-2' })
  })
})

describe('PATCH /api/me — university validation', () => {
  it('throws 400 when university exceeds 100 characters', async () => {
    await expect(
      (handler as Function)(makeEvent({ university: 'U'.repeat(101) }))
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('accepts an empty university string (no-op trim)', async () => {
    setupUpdateChain()
    const result = await (handler as Function)(makeEvent({ university: '' }))
    expect(result).toMatchObject({ university: '' })
  })

  it('accepts a valid university name', async () => {
    setupUpdateChain()
    const result = await (handler as Function)(makeEvent({ university: 'MIT' }))
    expect(result).toMatchObject({ university: 'MIT' })
  })
})

describe('PATCH /api/me — empty body', () => {
  it('throws 400 when no valid fields are provided', async () => {
    await expect((handler as Function)(makeEvent({}))).rejects.toMatchObject({ statusCode: 400 })
  })
})

describe('PATCH /api/me — DB error', () => {
  it('throws 500 when DB update fails', async () => {
    setupUpdateChain({ message: 'DB failure' })
    await expect(
      (handler as Function)(makeEvent({ displayName: 'Alice' }))
    ).rejects.toMatchObject({ statusCode: 500 })
  })
})
