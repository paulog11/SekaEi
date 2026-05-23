import { watch } from 'vue'

// On initial hydration, fetch the user's approval status from /api/me and
// redirect to /pending if not approved. Cache the result so all subsequent
// client-side navigations can be blocked synchronously via router.beforeEach
// without making a network request.
//
// appReady drives the full-page loading overlay in app.vue. It starts true
// (SSR renders normally), flips false while the approval fetch is in-flight
// on a protected route, then returns to true once the check resolves.
export default defineNuxtPlugin(() => {
  const publicRoutes = ['/account', '/confirm', '/reset', '/pending', '/dev-only']
  const user = useSupabaseUser()
  const router = useRouter()
  const supabase = useSupabaseClient()
  const appReady = useState('appReady', () => true)
  let cachedStatus: string | null = null

  async function fetchAndGuard() {
    const current = router.currentRoute.value
    if (publicRoutes.includes(current.path)) return

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
      if (current.meta.access === 'free') return
      if (cachedStatus !== 'approved') {
        await navigateTo('/pending')
      }
    } catch (err) {
      cachedStatus = 'pending'
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 401) {
        await navigateTo('/account')
      } else if (current.meta.access !== 'free') {
        await navigateTo('/pending')
      }
    }
  }

  const unwatch = watch(user, async (newUser) => {
    if (!newUser) return

    const isProtected = !publicRoutes.includes(router.currentRoute.value.path)
    if (isProtected) appReady.value = false

    unwatch()
    await fetchAndGuard()
    appReady.value = true
  }, { immediate: true })

  // Block all subsequent client-side navigations synchronously once status is known.
  router.beforeEach((to) => {
    if (!user.value) return
    if (publicRoutes.includes(to.path)) return
    if (to.meta.access === 'free') return
    if (cachedStatus !== null && cachedStatus !== 'approved') {
      return '/pending'
    }
  })
})
