<script setup lang="ts">
definePageMeta({})
useHead({ title: 'Awaiting Approval — セカトークXP' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const approvalStatus = ref<string>('pending')

onMounted(async () => {
  if (!user.value) {
    router.replace('/account')
    return
  }
  const { data } = await supabase
    .from('profiles')
    .select('approval_status')
    .eq('id', user.value.id)
    .single() as { data: { approval_status?: string } | null }
  if (data?.approval_status) {
    approvalStatus.value = data.approval_status
    if (data.approval_status === 'approved') {
      router.replace('/')
    }
  }
})

async function signOut() {
  await supabase.auth.signOut()
  router.replace('/account')
}
</script>

<template>
  <main class="container-page flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
    <div class="card w-full max-w-md flex flex-col items-center gap-5 py-10">

      <template v-if="approvalStatus === 'rejected'">
        <div class="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <span class="text-2xl">✕</span>
        </div>
        <div>
          <h1 class="font-heading text-2xl font-bold text-ink mb-2">Access not granted</h1>
          <p class="text-ink-light text-sm">
            Your account request was not approved. If you think this is a mistake, please reach out directly.
          </p>
        </div>
      </template>

      <template v-else>
        <div class="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
          <span class="text-2xl">⏳</span>
        </div>
        <div>
          <h1 class="font-heading text-2xl font-bold text-ink mb-2">Pending approval</h1>
          <p class="text-ink-light text-sm">
            Your account (<strong>{{ user?.email }}</strong>) is awaiting approval.
            You'll have full access once approved — no further action is needed on your end.
          </p>
        </div>
      </template>

      <button class="btn-secondary btn-sm mt-2" @click="signOut">Sign out</button>
    </div>
  </main>
</template>
