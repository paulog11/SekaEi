export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/', '/account', '/confirm']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/account')
  }
})
