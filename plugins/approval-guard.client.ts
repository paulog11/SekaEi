// Route middleware skips the approval check on SSR and doesn't re-run after
// hydration on the initial page load. This plugin fills that gap by running
// the check once the app mounts on the client.
export default defineNuxtPlugin((nuxtApp) => {
  const publicRoutes = ['/account', '/confirm', '/reset', '/pending']

  nuxtApp.hook('app:mounted', async () => {
    const user = useSupabaseUser()
    const router = useRouter()

    if (!user.value || publicRoutes.includes(router.currentRoute.value.path)) return

    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', user.value.id)
      .single() as { data: { approval_status?: string } | null; error: unknown }

    if (!error && data?.approval_status !== 'approved') {
      await navigateTo('/pending')
    }
  })
})
