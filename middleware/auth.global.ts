export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/account', '/confirm', '/reset', '/pending', '/dev-only']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/account')
  }

  // Approval check runs client-only — it uses the user's JWT via apiFetch,
  // which isn't reliably available in SSR route middleware.
  if (import.meta.server) return

  if (user.value?.id && !publicRoutes.includes(to.path)) {
    if (to.meta.access === 'free') return

    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return navigateTo('/account')

    try {
      const me = await $fetch<{ user: { approvalStatus: string } }>('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (me.user.approvalStatus !== 'approved') {
        return navigateTo('/pending')
      }
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 401) return navigateTo('/account')
      // Fail-closed: any other failure (403, network, RLS) sends to /pending
      return navigateTo('/pending')
    }
  }
})
