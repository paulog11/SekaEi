/**
 * @fileoverview PUT /api/attempts/:id/pitch — persist the student and native
 * pitch contours computed for an attempt so the chart can be reconstructed
 * on the attempt detail page later. Scoped by `user_id` so users can only
 * update their own rows. Auth: `useSupabaseUser` (matches the GET handler
 * — unapproved users can still attach pitch to their own attempts).
 */

import { useSupabase, useSupabaseUser } from '../../../utils/supabase'
import type { PitchSeries } from '../../../../types/pitch'

const MAX_SAMPLES = 5000

function isValidSeries(value: unknown): value is PitchSeries {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (typeof v.durationSec !== 'number') return false
  if (typeof v.medianHz !== 'number') return false
  if (!Array.isArray(v.samples)) return false
  if (v.samples.length > MAX_SAMPLES) return false
  return true
}

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const slug = getRouterParam(event, 'id')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'slug is required.' })
  }

  const body = await readBody(event) as { student?: unknown; native?: unknown } | null
  if (!body) {
    throw createError({ statusCode: 400, message: 'body is required.' })
  }

  if (!isValidSeries(body.student)) {
    throw createError({ statusCode: 400, message: 'student pitch series is invalid.' })
  }

  if (body.native !== null && !isValidSeries(body.native)) {
    throw createError({ statusCode: 400, message: 'native pitch series is invalid (must be a PitchSeries or null).' })
  }

  const db = useSupabase(event)

  const { error } = await db
    .from('attempts')
    .update({ pitch_series: { student: body.student, native: body.native } })
    .eq('slug', slug)
    .eq('user_id', authUser.id)

  if (error) {
    console.error('[attempts/pitch.put] update failed:', error)
    throw createError({ statusCode: 500, message: 'Failed to save pitch series.' })
  }

  return { ok: true }
})
