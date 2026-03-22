import { api } from '@/api/client'
import type { UserPublic } from '@/types'

export async function fetchMe() {
  const { data } = await api.get<{ user: UserPublic }>('/users/me')
  return data.user
}

export async function updateMe(body: Partial<Pick<UserPublic, 'firstName' | 'lastName' | 'avatarUrl'>> & { birthDate?: string | null }) {
  const { data } = await api.put<{ user: UserPublic }>('/users/me', body)
  return data.user
}

export async function findByVisibleId(visibleId: string) {
  const { data } = await api.get<{ user: UserPublic }>(`/users/${visibleId}`)
  return data.user
}

export async function addFriend(userId: string) {
  await api.post(`/users/friend/${userId}`)
}

export async function listFriends() {
  const { data } = await api.get<{ friends: UserPublic[] }>('/users/friends')
  return data.friends
}
