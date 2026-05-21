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

const { default: handler } = await import('~/server/api/flagged-words.delete')

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
    eq: vi.fn().mockReturnThis(),
  }
  c.eq = vi.fn().mockImplementation(() => {
    const next = { eq: vi.fn().mockResolvedValue({ error }) }
    return next
  })
  // Simpler approach: make the whole chain resolve
  const chain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  }
  let eqCount = 0
  chain.eq = vi.fn().mockImplementation(() => {
    eqCount++
    if (eqCount >= 2) return Promise.resolve({ error })
    return chain
  })
  mockFrom.mockReturnValue(chain)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireApprovedUser.mockResolvedValue(MOCK_USER)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DELETE /api/flagged-words', () => {
  it('throws 401 when not authenticated', async () => {
    mockRequireApprovedUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent({ word: 'rock' }))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when word is missing', async () => {
    await expect((handler as Function)(makeEvent({}))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when word is empty string', async () => {
    await expect((handler as Function)(makeEvent({ word: '  ' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns { ok: true } on success', async () => {
    setupUpdateChain()
    const result = await (handler as Function)(makeEvent({ word: 'rock' }))
    expect(result).toEqual({ ok: true })
  })

  it('normalizes word before retiring', async () => {
    const chain = setupUpdateChain()
    await (handler as Function)(makeEvent({ word: 'Rock!' }))
    expect(chain.eq).toHaveBeenCalledWith('word', 'rock')
  })
})
