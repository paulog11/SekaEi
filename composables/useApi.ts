/**
 * @fileoverview Auth-aware `$fetch` wrapper used by every client-side API call.
 * Injects the Supabase access token as a Bearer header and signs the user out
 * on 401. Also owns the per-browser device id used to attribute pre-signup attempts.
 */

const DEVICE_ID_KEY = 'sekaei.deviceId.v1'

/**
 * Returns a persistent per-browser UUID stored in localStorage. Falls back to a
 * fresh non-persisted UUID if localStorage is unavailable (private mode, SSR).
 */
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

/**
 * Returns an authenticated fetch wrapper. Adds `Authorization: Bearer <token>`
 * from the current Supabase session; on 401 it signs out and redirects to `/account`.
 */
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
    }) as Promise<T>
  }

  return { apiFetch, getDeviceId: getOrCreateDeviceId }
}
