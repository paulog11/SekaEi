/**
 * @fileoverview Per-route middleware: gates a page to non-production stages.
 * Pages opt in via `definePageMeta({ middleware: ['stage'] })`. Redirects to
 * `/dev-only` if `runtimeConfig.public.appStage !== 'development'`.
 */

export default defineNuxtRouteMiddleware(() => {
  const { public: { appStage } } = useRuntimeConfig()
  if (appStage !== 'development') {
    return navigateTo('/dev-only')
  }
})
