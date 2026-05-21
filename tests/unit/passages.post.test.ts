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

const { default: handler } = await import('~/server/api/passages/index.post')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function makeEvent(body: unknown) {
  return { __body: body }
}

function setupInsertChain(data: unknown, error: unknown = null) {
  const c = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  mockFrom.mockReturnValue(c)
  return c
}

const VALID_BODY = {
  title: 'My Passage',
  text: 'Hello world, this is a test passage.',
  category: 'custom',
}

const MOCK_PASSAGE = {
  id: '1', title: 'My Passage', text: 'Hello world, this is a test passage.', ipa: null, category: 'custom', created_at: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireApprovedUser.mockResolvedValue(MOCK_USER)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/passages', () => {
  it('throws 401 when not authenticated', async () => {
    mockRequireApprovedUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent(VALID_BODY))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when title is missing', async () => {
    await expect((handler as Function)(makeEvent({ text: 'Hello', category: 'custom' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when text is missing', async () => {
    await expect((handler as Function)(makeEvent({ title: 'Test', category: 'custom' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when text exceeds 300 characters', async () => {
    await expect(
      (handler as Function)(makeEvent({ ...VALID_BODY, text: 'a'.repeat(301) }))
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when category is invalid', async () => {
    await expect(
      (handler as Function)(makeEvent({ ...VALID_BODY, category: 'invalid-cat' }))
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns the created passage on success', async () => {
    setupInsertChain(MOCK_PASSAGE)
    const result = await (handler as Function)(makeEvent(VALID_BODY))
    expect(result.passage).toMatchObject({ title: 'My Passage', category: 'custom' })
  })

  it('throws 409 on duplicate title', async () => {
    setupInsertChain(null, { code: '23505', message: 'duplicate key' })
    await expect((handler as Function)(makeEvent(VALID_BODY))).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 500 on other DB errors', async () => {
    setupInsertChain(null, { code: '99999', message: 'generic error' })
    await expect((handler as Function)(makeEvent(VALID_BODY))).rejects.toMatchObject({ statusCode: 500 })
  })

  it('defaults category to "custom" when not provided', async () => {
    const c = setupInsertChain(MOCK_PASSAGE)
    await (handler as Function)(makeEvent({ title: VALID_BODY.title, text: VALID_BODY.text }))
    expect(c.insert).toHaveBeenCalledWith(expect.objectContaining({ category: 'custom' }))
  })
})
