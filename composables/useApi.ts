const DEVICE_ID_KEY = 'sekaei.deviceId.v1'

export function getOrCreateDeviceId(): string {
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
  const supabase = useSupabaseClient()

  async function apiFetch<T>(url: string, options?: Parameters<typeof $fetch>[1]): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    return $fetch<T>(url, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers as Record<string, string> | undefined),
      },
      async onResponseError({ response }) {
        if (response.status === 401) {
          await supabase.auth.signOut()
          await navigateTo('/account')
        }
      },
    })
  }

  return { apiFetch, getDeviceId: getOrCreateDeviceId }
}
