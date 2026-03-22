import { create } from 'zustand'
import type { ChatListItem, Message } from '@/types'

interface ChatState {
  chats: ChatListItem[]
  messagesByChat: Record<string, Message[]>
  typingByChat: Record<string, { userId: string; firstName: string } | null>
  onlineUsers: Set<string>
  totalUnread: number
  setChats: (chats: ChatListItem[]) => void
  upsertChat: (chat: ChatListItem) => void
  prependMessages: (chatId: string, messages: Message[]) => void
  addMessage: (chatId: string, message: Message) => void
  setTyping: (chatId: string, payload: { userId: string; firstName: string } | null) => void
  setOnline: (userId: string, online: boolean) => void
  setTotalUnread: (n: number) => void
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  messagesByChat: {},
  typingByChat: {},
  onlineUsers: new Set(),
  totalUnread: 0,
  setChats: (chats) => set({ chats, totalUnread: chats.reduce((s, c) => s + c.unreadCount, 0) }),
  upsertChat: (chat) =>
    set((state) => {
      const idx = state.chats.findIndex((c) => c.id === chat.id)
      const next = [...state.chats]
      if (idx >= 0) next[idx] = chat
      else next.unshift(chat)
      return { chats: next, totalUnread: next.reduce((s, c) => s + c.unreadCount, 0) }
    }),
  prependMessages: (chatId, messages) =>
    set((state) => ({
      messagesByChat: {
        ...state.messagesByChat,
        [chatId]: [...messages, ...(state.messagesByChat[chatId] ?? [])],
      },
    })),
  addMessage: (chatId, message) =>
    set((state) => {
      const list = state.messagesByChat[chatId] ?? []
      if (list.some((m) => m.id === message.id)) return state
      return {
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: [...list, message],
        },
      }
    }),
  setTyping: (chatId, payload) =>
    set((state) => ({
      typingByChat: { ...state.typingByChat, [chatId]: payload },
    })),
  setOnline: (userId, online) =>
    set((state) => {
      const next = new Set(state.onlineUsers)
      if (online) next.add(userId)
      else next.delete(userId)
      return { onlineUsers: next }
    }),
  setTotalUnread: (n) => set({ totalUnread: n }),
}))
