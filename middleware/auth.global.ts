/**
 * @fileoverview Global middleware: primary auth + approval guard. Queries
 * `/api/me` per navigation (client-only — SSR can't reliably forward the JWT)
 * and redirects unapproved users to `/pending`. Fail-closed: any error other
 * than 401 also routes to `/pending` to prevent leaking pages to a user
 * whose approval status couldn't be verified.
 */

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/account', '/confirm', '/reset', '/pending', '/dev-only', '/']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/account')
  }

  // Redirect authenticated users from landing page to dashboard
  if (user.value && to.path === '/') {
    return navigateTo('/dashboard')
  }

  // Approval check runs client-only — it uses the user's JWT via apiFetch,
  // which isn't reliably available in SSR route middleware.
  if (import.meta.server) return

  if (user.value?.id && !publicRoutes.includes(to.path)) {
    if (to.meta.access === 'free') return
    if (to.meta.access === 'attendee') {
      // Tier check is enforced server-side; client guard defers to the store guard below
      return
    }

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
