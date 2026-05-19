export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/account', '/confirm', '/reset', '/pending']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/account')
  }

  if (user.value && to.path !== '/pending' && !publicRoutes.includes(to.path)) {
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', user.value.id)
      .single() as { data: { approval_status?: string } | null }
    if (data?.approval_status !== 'approved') {
      return navigateTo('/pending')
    }
  }
})
