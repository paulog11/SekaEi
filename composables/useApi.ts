const DEVICE_ID_KEY = 'sekaei.deviceId.v1'

function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function useApi() {
  function apiFetch<T>(url: string, options?: Parameters<typeof $fetch>[1]): Promise<T> {
    const deviceId = getOrCreateDeviceId()
    return $fetch<T>(url, {
      ...options,
      headers: {
        'x-device-id': deviceId,
        ...(options?.headers as Record<string, string> | undefined),
      },
    })
  }

  return { apiFetch, getDeviceId: getOrCreateDeviceId }
}
