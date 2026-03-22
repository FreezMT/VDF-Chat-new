export type Role = 'dancer' | 'parent' | 'trainer' | 'admin'

export type ChatType = 'private' | 'group'

export interface UserPublic {
  id: string
  visibleId: string
  firstName: string
  lastName: string
  email?: string
  role: Role
  birthDate?: string | null
  avatarUrl?: string | null
  teamId?: string | null
  team?: { id: string; name: string } | null
  createdAt?: string
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string | null
  mediaUrl: string | null
  mediaType: string | null
  createdAt: string
  updatedAt: string
  sender?: UserPublic
  readBy?: { userId: string; readAt: string }[]
}

export interface ChatListItem {
  id: string
  type: ChatType
  name: string | null
  avatarUrl: string | null
  lastMessage: Message | null
  unreadCount: number
  members?: { user: UserPublic }[]
}

export interface Post {
  id: string
  authorId: string
  content: string
  mediaUrl: string | null
  mediaType: string | null
  createdAt: string
  author: UserPublic
}

export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
}
