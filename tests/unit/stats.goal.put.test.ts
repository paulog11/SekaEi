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

const { default: handler } = await import('~/server/api/stats/goal.put')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-abc' }

function makeEvent(body: unknown) {
  return { __body: body }
}

function setupUpsertChain(error: unknown = null) {
  const c = {
    upsert: vi.fn().mockResolvedValue({ error }),
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

describe('PUT /api/stats/goal', () => {
  it('throws 401 when not authenticated', async () => {
    mockRequireApprovedUser.mockRejectedValue(createError({ statusCode: 401, message: 'Not authenticated.' }))
    await expect((handler as Function)(makeEvent({ minutes: 10 }))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when minutes is missing', async () => {
    await expect((handler as Function)(makeEvent({}))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when minutes is a string', async () => {
    await expect((handler as Function)(makeEvent({ minutes: '10' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when minutes is 0', async () => {
    await expect((handler as Function)(makeEvent({ minutes: 0 }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when minutes is 121', async () => {
    await expect((handler as Function)(makeEvent({ minutes: 121 }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('accepts boundary values 1 and 120', async () => {
    setupUpsertChain()
    await expect((handler as Function)(makeEvent({ minutes: 1 }))).resolves.toMatchObject({ ok: true })
    setupUpsertChain()
    await expect((handler as Function)(makeEvent({ minutes: 120 }))).resolves.toMatchObject({ ok: true })
  })

  it('returns { ok: true, goalMinutes } on success', async () => {
    setupUpsertChain()
    const result = await (handler as Function)(makeEvent({ minutes: 15 }))
    expect(result).toEqual({ ok: true, goalMinutes: 15 })
  })

  it('rounds minutes to the nearest integer', async () => {
    const c = setupUpsertChain()
    const result = await (handler as Function)(makeEvent({ minutes: 14.7 }))
    expect(result.goalMinutes).toBe(15)
    expect(c.upsert).toHaveBeenCalledWith(expect.objectContaining({ daily_goal_minutes: 15 }))
  })

  it('upserts with user_id from the auth user', async () => {
    const c = setupUpsertChain()
    await (handler as Function)(makeEvent({ minutes: 10 }))
    expect(c.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: MOCK_USER.id }))
  })

  it('throws 500 on DB error', async () => {
    setupUpsertChain({ message: 'DB failure' })
    await expect((handler as Function)(makeEvent({ minutes: 10 }))).rejects.toMatchObject({ statusCode: 500 })
  })
})
