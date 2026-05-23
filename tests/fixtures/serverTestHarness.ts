import { vi } from 'vitest'

export { mockAssessmentResult, mockWord, mockPhoneme, mockAzureNBestJson } from './mockAssessmentResult'

/**
 * Creates a chainable Supabase query-builder mock. Calling the returned mock's
 * methods returns `this` so chains can be composed freely. Terminal methods
 * (single, maybeSingle, limit, rpc) return a resolved promise with `result`.
 */
export function makeChain(result: unknown = { data: null, error: null }) {
  const c: Record<string, ReturnType<typeof vi.fn>> = {}
  const self = () => c

  for (const m of ['select', 'eq', 'order', 'limit', 'is', 'not', 'gte', 'in', 'insert', 'update', 'delete', 'upsert']) {
    c[m] = vi.fn().mockReturnValue(c)
  }

  // Terminal methods that resolve the chain
  c.single = vi.fn().mockResolvedValue(result)
  c.maybeSingle = vi.fn().mockResolvedValue(result)

  // Make limit also resolvable for list queries
  c.limit = vi.fn().mockResolvedValue(result)

  return c
}

/**
 * Returns the standard createError factory used across server tests.
 */
export function makeCreateError() {
  return (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number }
    err.statusCode = opts.statusCode
    return err
  }
}

/**
 * Stubs the Nitro globals that handlers call without importing.
 * Call at top-level in test files (not inside beforeEach) so stubs are
 * in place before the handler module is imported.
 */
export function stubNitroGlobals(overrides: Record<string, unknown> = {}) {
  const createError = makeCreateError()
  vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('readBody', (event: Record<string, unknown>) => Promise.resolve(event.__body))
  vi.stubGlobal('getQuery', (event: Record<string, unknown>) => event.__query ?? {})
  vi.stubGlobal('getRouterParam', (event: Record<string, unknown>, key: string) => (event.__params as Record<string, unknown>)?.[key])
  vi.stubGlobal('setResponseStatus', vi.fn())
  vi.stubGlobal('setResponseHeader', vi.fn())
  vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({})))
  for (const [key, value] of Object.entries(overrides)) {
    vi.stubGlobal(key, value)
  }
  return { createError }
}
