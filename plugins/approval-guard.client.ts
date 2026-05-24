/**
 * @fileoverview Client-only plugin: post-hydration approval guard. On the
 * first session restore after a hard reload, fetches `/api/me` once, caches
 * the result, and installs a synchronous `router.beforeEach` so subsequent
 * navigations don't re-hit the network. Drives the `appReady` global state
 * that powers the full-page loading overlay in `app.vue`.
 */

import { watch } from 'vue'
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
    if (to.meta.access === 'attendee') return // tier enforced server-side
    if (cachedStatus !== null && cachedStatus !== 'approved') {
      return '/pending'
    }
  })
})
