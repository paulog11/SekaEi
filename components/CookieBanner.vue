<script setup lang="ts">
const STORAGE_KEY = 'cookie-consent-v1'
const visible = ref(false)

onMounted(() => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    visible.value = true
  }
})

function dismiss() {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString())
  visible.value = false
}
</script>

<template>
  <Transition name="cookie">
    <div
      v-if="visible"
      class="fixed bottom-20 sm:bottom-4 right-4 left-4 sm:left-auto max-w-sm bg-ink text-white rounded-xl shadow-lg p-4 z-40 flex flex-col gap-3"
      role="region"
      aria-label="Cookie利用に関するお知らせ"
    >
      <p class="text-sm leading-relaxed m-0">
        当サイトはサインインと利用状況の計測のためCookieを使用します。詳しくは
        <NuxtLink to="/privacy" class="underline text-white hover:opacity-75 transition-opacity" @click="dismiss">プライバシーポリシー</NuxtLink>
        をご覧ください。
      </p>
      <button
        class="self-end text-xs font-semibold bg-white text-ink rounded-lg px-4 py-2 hover:opacity-85 transition-opacity"
        @click="dismiss"
      >
        了解
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.cookie-enter-active,
.cookie-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.cookie-enter-from,
.cookie-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
