export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/account', '/confirm', '/reset']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/account')
  }
})
