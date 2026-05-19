import { watch } from 'vue'

// The global middleware runs on client-side navigation but Supabase restores
// its session asynchronously after hydration, so user.value is null when the
// middleware first runs on the initial page load. This plugin watches for the
// user to become available and then runs the same approval check.
export default defineNuxtPlugin(() => {
  const publicRoutes = ['/account', '/confirm', '/reset', '/pending', '/dev-only']
  const user = useSupabaseUser()
  const router = useRouter()
  const supabase = useSupabaseClient()

  const unwatch = watch(user, async (newUser) => {
    if (!newUser) return
    unwatch()

    if (publicRoutes.includes(router.currentRoute.value.path)) return

    const { data, error } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', newUser.id)
      .single() as { data: { approval_status?: string } | null; error: unknown }

    if (!error && data?.approval_status !== 'approved') {
      await navigateTo('/pending')
    }
  }, { immediate: true })
})
