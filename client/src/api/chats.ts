import { api } from '@/api/client'
import type { ChatListItem, Message } from '@/types'

export async function listChats() {
  const { data } = await api.get<{ chats: ChatListItem[] }>('/chats')
  return data.chats
}

export async function getOrCreatePrivate(userId: string) {
  const { data } = await api.post<{ chat: ChatListItem }>(`/chats/private/${userId}`)
  return data.chat
}

export async function createGroup(name: string, memberIds: string[]) {
  const { data } = await api.post<{ chat: ChatListItem }>('/chats/group', { name, memberIds })
  return data.chat
}

export async function fetchMessages(chatId: string, cursor?: string, limit = 30) {
  const { data } = await api.get<{ messages: Message[]; nextCursor: string | null }>(
    `/chats/${chatId}/messages`,
    { params: { cursor, limit } },
  )
  return data
}

export async function markRead(chatId: string) {
  await api.post(`/chats/${chatId}/read`)
}
