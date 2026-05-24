/**
 * @fileoverview Client-only plugin: seeds `authStore` from the live Supabase
 * session before the first navigation, then watches `useSupabaseUser()` to
 * keep it in sync. On sign-out or account switch, resets every per-user
 * Pinia store so the previous user's history/streak/etc. doesn't bleed into
 * the next session. Also auto-redeems any pending invite code stashed in
 * `user_metadata.pending_invite_code` at signup.
 */

import { watch } from 'vue'

async function redeemPendingCode(userId: string, pendingCode: string) {
  try {
    await $fetch('/api/redeem-code', { method: 'POST', body: { code: pendingCode } })
  } catch { /* non-fatal: user can redeem from /account */ }
}

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
    // Auto-redeem invite code stashed in user_metadata at signup
    const pendingCode = user.value.user_metadata?.pending_invite_code
    if (pendingCode && authStore.tier !== 'attendee') {
      await redeemPendingCode(user.value.id, pendingCode)
      await authStore.refreshApproval()
    }
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
      const pendingCode = newUser.user_metadata?.pending_invite_code
      if (pendingCode && authStore.tier !== 'attendee') {
        await redeemPendingCode(newUser.id, pendingCode)
        await authStore.refreshApproval()
      }
    }
  })
})
