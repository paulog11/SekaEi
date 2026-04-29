import { useSupabase } from '../utils/supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const deviceId = getHeader(event, 'x-device-id')
  if (!deviceId || !UUID_RE.test(deviceId)) {
    throw createError({ statusCode: 401, message: 'Missing or invalid x-device-id header.' })
  }

  const body = await readBody(event)
  const { passageId, passageTitle, scores } = body ?? {}

  if (typeof passageId !== 'string' || !passageId.trim()) {
    throw createError({ statusCode: 400, message: 'passageId is required.' })
  }
  if (typeof passageTitle !== 'string' || !passageTitle.trim()) {
    throw createError({ statusCode: 400, message: 'passageTitle is required.' })
  }
  if (!scores || typeof scores !== 'object') {
    throw createError({ statusCode: 400, message: 'scores object is required.' })
  }
  const { accuracy, fluency, completeness, prosody, overall } = scores as Record<string, unknown>
  if (typeof accuracy !== 'number' || typeof fluency !== 'number' ||
      typeof completeness !== 'number' || typeof overall !== 'number') {
    throw createError({ statusCode: 400, message: 'scores must include accuracy, fluency, completeness, and overall.' })
  }

  const db = useSupabase()

  const { data, error } = await db
    .from('attempts')
    .insert({
      user_id: deviceId,
      passage_id: passageId.trim(),
      passage_title: passageTitle.trim().slice(0, 120),
      accuracy_score: Math.round(accuracy),
      fluency_score: Math.round(fluency),
      completeness_score: Math.round(completeness),
      prosody_score: typeof prosody === 'number' ? Math.round(prosody) : null,
      overall_score: Math.round(overall),
    })
    .select('id, user_id, passage_id, passage_title, created_at, accuracy_score, fluency_score, completeness_score, prosody_score, overall_score')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { attempt: data }
})
