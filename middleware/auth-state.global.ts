const PUBLIC_ROUTES = ['/account', '/confirm', '/reset', '/pending', '/dev-only']

export default defineNuxtRouteMiddleware((to) => {
  if (PUBLIC_ROUTES.includes(to.path)) return

  const authStore = useAuthStore()

  if (authStore.isLoggedIn === false) {
    return navigateTo('/account')
  }
  if (to.meta.access === 'free') return
  if (to.meta.access === 'attendee') {
    if (authStore.tier === 'public') return navigateTo('/account?upgrade=1')
    return
  }
  if (authStore.isApproved === false) {
    return navigateTo('/pending')
  }
})
