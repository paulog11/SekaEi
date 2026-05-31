<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmWord?: string
  confirmLabel?: string
  danger?: boolean
}>(), {
  confirmWord: undefined,
  confirmLabel: 'Confirm',
  danger: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const typed = ref('')

// Reset typed input whenever dialog opens
watch(() => props.open, (val) => {
  if (val) typed.value = ''
})

const isConfirmEnabled = computed(() =>
  !props.confirmWord || typed.value === props.confirmWord
)

function handleConfirm() {
  if (!isConfirmEnabled.value) return
  emit('confirm')
}

function handleBackdropClick() {
  emit('cancel')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 flex items-center justify-center px-4"
        style="z-index: 60; background: rgba(0,0,0,0.45)"
        aria-modal="true"
        role="dialog"
        :aria-label="title"
        @click.self="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="bg-white rounded-xl border-2 border-ink shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] p-6 w-full max-w-sm">
          <h2 class="text-lg font-bold text-ink mb-2">{{ title }}</h2>
          <p class="text-sm text-ink-light mb-4">{{ message }}</p>

          <div v-if="confirmWord" class="mb-4">
            <label class="field-label mb-1 block">
              Type <span class="font-mono font-bold text-ink">{{ confirmWord }}</span> to confirm
            </label>
            <input
              v-model="typed"
              class="field-input w-full"
              type="text"
              :placeholder="confirmWord"
              autocomplete="off"
              spellcheck="false"
            >
          </div>

          <div class="flex gap-3 justify-end">
            <button class="btn-secondary btn-sm" type="button" @click="emit('cancel')">
              Cancel
            </button>
            <button
              :class="danger ? 'btn-danger' : 'btn-primary'"
              class="btn-sm"
              type="button"
              :disabled="!isConfirmEnabled"
              @click="handleConfirm"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
