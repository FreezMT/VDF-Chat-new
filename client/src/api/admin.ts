import { api } from '@/api/client'
import type { Role, UserPublic } from '@/types'

export async function listUsers(params?: { q?: string; role?: Role }) {
  const { data } = await api.get<{ users: UserPublic[] }>('/admin/users', { params })
  return data.users
}

export async function setUserRole(id: string, role: Role) {
  const { data } = await api.put<{ user: UserPublic }>(`/admin/users/${id}/role`, { role })
  return data.user
}

export async function createTeam(name: string) {
  const { data } = await api.post<{ team: { id: string; name: string } }>('/admin/teams', { name })
  return data.team
}

export async function assignTeam(userId: string, teamId: string | null) {
  const { data } = await api.put<{ user: UserPublic }>(`/admin/users/${userId}/team`, { teamId })
  return data.user
}

export async function deleteUser(id: string) {
  await api.delete(`/admin/users/${id}`)
}
