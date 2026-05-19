import { watch } from 'vue'

// On initial hydration, fetch the user's approval status from /api/me and
// redirect to /pending if not approved. Cache the result so all subsequent
// client-side navigations can be blocked synchronously via router.beforeEach
// without making a network request.
export default defineNuxtPlugin(() => {
  const publicRoutes = ['/account', '/confirm', '/reset', '/pending', '/dev-only']
  const user = useSupabaseUser()
  const router = useRouter()
  const supabase = useSupabaseClient()
  let cachedStatus: string | null = null

  async function fetchAndGuard() {
    if (publicRoutes.includes(router.currentRoute.value.path)) return

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      await navigateTo('/account')
      return
    }

    try {
      const me = await $fetch<{ user: { approvalStatus: string } }>('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      cachedStatus = me.user.approvalStatus
      if (cachedStatus !== 'approved') {
        await navigateTo('/pending')
      }
    } catch (err) {
      cachedStatus = 'pending'
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 401) {
        await navigateTo('/account')
      } else {
        await navigateTo('/pending')
      }
    }
  }

  const unwatch = watch(user, async (newUser) => {
    if (!newUser) return
    unwatch()
    await fetchAndGuard()
  }, { immediate: true })

  // Block all subsequent client-side navigations synchronously once status is known.
  router.beforeEach((to) => {
    if (!user.value) return
    if (publicRoutes.includes(to.path)) return
    if (cachedStatus !== null && cachedStatus !== 'approved') {
      return '/pending'
    }
  })
})
