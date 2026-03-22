import axios from 'axios'
import { api, setAccessToken } from '@/api/client'
import type { Role, UserPublic } from '@/types'

export async function bootstrapSession(): Promise<boolean> {
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      '/api/auth/refresh',
      {},
      { withCredentials: true },
    )
    setAccessToken(data.accessToken)
    return true
  } catch {
    setAccessToken(null)
    return false
  }
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ accessToken: string; user: UserPublic }>('/auth/login', { email, password })
  setAccessToken(data.accessToken)
  return data
}

export async function register(body: {
  firstName: string
  lastName: string
  email: string
  password: string
  birthDate?: string
  role: Extract<Role, 'dancer' | 'parent'>
}) {
  const { data } = await api.post<{ accessToken: string; user: UserPublic }>('/auth/register', body)
  setAccessToken(data.accessToken)
  return data
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    setAccessToken(null)
  }
}
