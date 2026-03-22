import { create } from 'zustand'
import { setAccessToken } from '@/api/client'
import type { UserPublic } from '@/types'

interface AuthState {
  user: UserPublic | null
  setUser: (u: UserPublic | null) => void
  setAccessToken: (t: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  setAccessToken: (token) => {
    setAccessToken(token)
    set({})
  },
  logout: () => {
    setAccessToken(null)
    set({ user: null })
  },
}))
