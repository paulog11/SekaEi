/**
 * @fileoverview PWA install-prompt handler. Captures the deferred Chrome/Android
 * `beforeinstallprompt` event for later replay, and surfaces an iOS-only flag
 * (`isIosPrompt`) because Safari has no programmatic install API — the UI must
 * tell the user to use "Add to Home Screen" manually.
 */

import { ref, onMounted, onUnmounted } from 'vue'

const DISMISSED_KEY = 'sekaei_install_dismissed'

// BeforeInstallPromptEvent is not in standard TS lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const canInstall = ref(false)
  const isIosPrompt = ref(false)
  const dismissed = ref(false)

  let deferredPrompt: BeforeInstallPromptEvent | null = null

  function checkDismissed() {
    dismissed.value = localStorage.getItem(DISMISSED_KEY) === '1'
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    dismissed.value = true
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    canInstall.value = false
  }

  function onBeforeInstall(e: Event) {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    canInstall.value = true
  }

  onMounted(() => {
    checkDismissed()

    // iOS Safari — no beforeinstallprompt; detect manually
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const isStandalone = (navigator as { standalone?: boolean }).standalone === true
    if (isIos && !isStandalone) {
      isIosPrompt.value = true
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  })

  return { canInstall, isIosPrompt, dismissed, install, dismiss }
}
