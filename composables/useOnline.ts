import { ref, onMounted, onUnmounted } from 'vue'

export function useOnline() {
  const online = ref(true)

  function handleOnline() { online.value = true }
  function handleOffline() { online.value = false }

  onMounted(() => {
    online.value = navigator.onLine
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return { online }
}
