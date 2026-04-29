import { useSupabase } from '../utils/supabase'
import type { AttemptRecord } from '~/composables/useHistory'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const deviceId = getHeader(event, 'x-device-id')
  if (!deviceId || !UUID_RE.test(deviceId)) {
    throw createError({ statusCode: 401, message: 'Missing or invalid x-device-id header.' })
  }

  const query = getQuery(event)
  const passageId = typeof query.passageId === 'string' ? query.passageId : undefined
  const limit = Math.min(Number(query.limit) || 100, 500)

  const db = useSupabase()

  let q = db
    .from('attempts')
    .select('id, passage_id, passage_title, created_at, accuracy_score, fluency_score, completeness_score, prosody_score, overall_score')
    .eq('user_id', deviceId)

  if (passageId) q = q.eq('passage_id', passageId)

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw createError({ statusCode: 500, message: error.message })

  const attempts: AttemptRecord[] = (data ?? []).map(row => ({
    passageId: row.passage_id,
    passageTitle: row.passage_title,
    timestamp: new Date(row.created_at).getTime(),
    scores: {
      accuracy: row.accuracy_score,
      fluency: row.fluency_score,
      completeness: row.completeness_score,
      prosody: row.prosody_score ?? undefined,
      overall: row.overall_score,
    },
  }))

  return { attempts }
})
