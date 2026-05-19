export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/account', '/confirm', '/reset', '/pending', '/dev-only']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/account')
  }

  if (user.value?.id && !publicRoutes.includes(to.path)) {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', user.value.id)
      .single() as { data: { approval_status?: string } | null; error: unknown }
    if (!error && data?.approval_status !== 'approved') {
      return navigateTo('/pending')
    }
  }
})
