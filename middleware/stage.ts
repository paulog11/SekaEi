export default defineNuxtRouteMiddleware(() => {
  const { public: { appStage } } = useRuntimeConfig()
  if (appStage !== 'development') {
    return navigateTo('/dev-only')
  }
})
