import { useSupabase, useSupabaseUser } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const authUser = await useSupabaseUser(event)
  const slug = getRouterParam(event, 'id')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'slug is required.' })
  }

  const db = useSupabase(event)

  const { data, error } = await db
    .from('attempts')
    .select('slug, passage_id, passage_title, created_at, accuracy_score, fluency_score, completeness_score, prosody_score, overall_score, azure_result')
    .eq('slug', slug)
    .eq('user_id', authUser.id)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, message: 'Attempt not found.' })
  }

  return {
    attempt: {
      slug: data.slug,
      passageId: data.passage_id,
      passageTitle: data.passage_title,
      timestamp: new Date(data.created_at).getTime(),
      scores: {
        accuracy: data.accuracy_score,
        fluency: data.fluency_score,
        completeness: data.completeness_score,
        prosody: data.prosody_score ?? undefined,
        overall: data.overall_score,
      },
      azureResult: data.azure_result ?? null,
    },
  }
})
