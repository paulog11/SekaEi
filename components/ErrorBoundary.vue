<script setup lang="ts">
defineProps<{ error?: string | null }>()
const emit = defineEmits<{ retry: [] }>()

const captured = ref<string | null>(null)

onErrorCaptured((err) => {
  captured.value = err instanceof Error ? err.message : 'Unexpected error.'
  return false
})

function retry() {
  captured.value = null
  emit('retry')
}
</script>

<template>
  <div
    v-if="error || captured"
    class="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3"
    role="alert"
  >
    <p class="flex-1 text-sm text-red-800 m-0">{{ error || captured || "Couldn't load — please try again." }}</p>
    <button class="btn-secondary btn-sm" @click="retry">Retry</button>
  </div>
  <slot v-else />
</template>
