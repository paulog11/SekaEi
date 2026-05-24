/**
 * @fileoverview Migrates anonymous pre-signup data to a real user account.
 * Called on first sign-in to link the per-browser device id to the new user
 * and reassign any attempts that were stored against the device id.
 */

import type { H3Event } from 'h3'
import { useSupabase } from './supabase'

/**
 * Upserts a `device_claims` row and rewrites any `attempts.user_id = deviceId`
 * to the new `userId`. Safe to call multiple times — both operations are
 * idempotent.
 */
export async function claimDevice(event: H3Event, deviceId: string, userId: string): Promise<void> {
  const db = useSupabase(event)

  // Record the claim
  await db.from('device_claims').upsert({ device_id: deviceId, user_id: userId, claimed_at: new Date().toISOString() })

  // Migrate any attempts that were stored with this device id as user_id
  // (old schema used device uuid directly as user_id — this handles any pre-migration data)
  await db.from('attempts').update({ user_id: userId }).eq('user_id', deviceId)
}
