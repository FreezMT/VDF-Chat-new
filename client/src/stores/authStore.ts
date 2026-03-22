import { create } from 'zustand'
import type { User } from '@/types'

type AuthState = {
  accessToken: string | null
  user: User | null
  bootstrapped: boolean
  setAuth: (accessToken: string, user: User) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
  setBootstrapped: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  bootstrapped: false,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
}))
