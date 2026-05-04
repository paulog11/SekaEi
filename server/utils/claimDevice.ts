import { useSupabase } from './supabase'

export async function claimDevice(deviceId: string, userId: string): Promise<void> {
  const db = useSupabase()

  // Record the claim
  await db.from('device_claims').upsert({ device_id: deviceId, user_id: userId, claimed_at: new Date().toISOString() })

  // Migrate any attempts that were stored with this device id as user_id
  // (old schema used device uuid directly as user_id — this handles any pre-migration data)
  await db.from('attempts').update({ user_id: userId }).eq('user_id', deviceId)
}
