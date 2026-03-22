export type Role = 'dancer' | 'parent' | 'trainer' | 'admin'

export type User = {
  id: string
  visibleId: string
  firstName: string
  lastName: string
  login: string | null
  email: string | null
  role: Role
  birthDate: string | null
  avatarUrl: string | null
  teamId: string | null
  team: { id: string; name: string } | null
}

export type ChatListItem = {
  id: string
  type: 'private' | 'group'
  name: string | null
  avatarUrl: string | null
  createdAt: string
  lastMessage: Message | null
  unreadCount: number
  members: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    visibleId: string
  }[]
}

export type Message = {
  id: string
  chatId: string
  senderId: string
  content: string | null
  mediaUrl: string | null
  mediaType: string | null
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
}

export type Post = {
  id: string
  authorId: string
  content: string
  mediaUrl: string | null
  mediaType: string | null
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    role: Role
  }
}
