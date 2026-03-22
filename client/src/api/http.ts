import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const baseURL = import.meta.env.VITE_API_URL || ''

const bare = axios.create({
  baseURL,
  withCredentials: true,
})

const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccess(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = bare
      .post<{ accessToken: string }>('/api/auth/refresh')
      .then((r) => {
        const t = r.data.accessToken
        useAuthStore.getState().setAccessToken(t)
        return t
      })
      .catch(() => {
        useAuthStore.getState().logout()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

http.interceptors.response.use(
  (r) => r,
  async (error: { config?: { _retry?: boolean; url?: string; headers?: Record<string, string> }; response?: { status?: number } }) => {
    const original = error.config
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      original.url &&
      !original.url.includes('/api/auth/refresh') &&
      !original.url.includes('/api/auth/login')
    ) {
      original._retry = true
      const token = await refreshAccess()
      if (token) {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${token}`
        return http.request(original)
      }
    }
    return Promise.reject(error)
  },
)

export { http, bare }
