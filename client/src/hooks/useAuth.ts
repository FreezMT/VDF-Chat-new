import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { bootstrapSession } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import type { UserPublic } from '@/types'

export function useBootstrapAuth() {
  const setUser = useAuthStore((s) => s.setUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const ok = await bootstrapSession()
        if (!ok) {
          if (!cancelled) setUser(null)
          return
        }
        const { data } = await api.get<{ user: UserPublic }>('/users/me')
        if (!cancelled) setUser(data.user)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setUser])

  return { loading }
}
