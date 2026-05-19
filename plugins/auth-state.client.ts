import { watch } from 'vue'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Wait for session hydration so isLoggedIn moves off null only when the
  // answer is definitive — prevents a false-negative redirect mid-hydration.
  await supabase.auth.getSession()

  authStore.setLoggedIn(!!user.value)
  if (user.value?.id) {
    await authStore.refreshApproval()
  }

  function resetUserStores() {
    useHistoryStore().reset()
    useStreakStore().reset()
    usePhonemeStatsStore().reset()
    useCustomPassagesStore().reset()
    useFlaggedWordsStore().reset()
    useTutorialStore().reset()
  }

  let previousUserId: string | null = user.value?.id ?? null

  watch(user, async (newUser) => {
    const newId = newUser?.id ?? null
    // Clear cached per-user data on sign-out or account switch so the
    // previous user's progress doesn't bleed into the next session.
    if (previousUserId && previousUserId !== newId) {
      resetUserStores()
    }
    previousUserId = newId

    authStore.setLoggedIn(!!newUser)
    if (newUser?.id) {
      await authStore.refreshApproval()
    }
  })
})
