import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn()

vi.mock('~/server/utils/supabase', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

const { claimDevice } = await import('~/server/utils/claimDevice')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEVICE_ID = 'device-uuid-0000-0000-0000-000000000001'
const USER_ID = 'user-uuid-0000-0000-0000-000000000001'

function setupFromChain() {
  const c = {
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  }
  mockFrom.mockReturnValue(c)
  return c
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('claimDevice', () => {
  it('upserts a device_claims row', async () => {
    const c = setupFromChain()
    await claimDevice({} as any, DEVICE_ID, USER_ID)
    expect(mockFrom).toHaveBeenCalledWith('device_claims')
    expect(c.upsert).toHaveBeenCalledWith(expect.objectContaining({
      device_id: DEVICE_ID,
      user_id: USER_ID,
    }))
  })

  it('migrates legacy attempts by updating user_id', async () => {
    const c = setupFromChain()
    await claimDevice({} as any, DEVICE_ID, USER_ID)
    expect(mockFrom).toHaveBeenCalledWith('attempts')
    expect(c.update).toHaveBeenCalledWith({ user_id: USER_ID })
    expect(c.eq).toHaveBeenCalledWith('user_id', DEVICE_ID)
  })

  it('calls device_claims upsert before attempts migration', async () => {
    const callOrder: string[] = []
    mockFrom.mockImplementation((table: string) => {
      callOrder.push(table)
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
    })
    await claimDevice({} as any, DEVICE_ID, USER_ID)
    expect(callOrder[0]).toBe('device_claims')
    expect(callOrder[1]).toBe('attempts')
  })
})
