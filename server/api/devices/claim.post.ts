import { useSupabaseUser } from '~/server/utils/supabase'
import { claimDevice } from '~/server/utils/claimDevice'

export default defineEventHandler(async (event) => {
  const user = await useSupabaseUser(event)
  const { deviceId } = (await readBody(event)) ?? {}

  if (typeof deviceId !== 'string' || !/^[0-9a-f-]{36}$/i.test(deviceId)) {
    throw createError({ statusCode: 400, message: 'Invalid deviceId.' })
  }

  await claimDevice(deviceId, user.id)
  return { ok: true }
})
