import { useEffect } from 'react'
import { connectSocket, disconnectSocket, getSocket, reconnectSocket } from '@/services/socket'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import type { Message } from '@/types'

export function useSocket(enabled: boolean) {
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!enabled || !user) return

    const socket = connectSocket()

    const onNew = (payload: { message: Message }) => {
      const { message } = payload
      useChatStore.getState().addMessage(message.chatId, message)
      useChatStore.getState().upsertChat({
        id: message.chatId,
        type: 'private',
        name: null,
        avatarUrl: null,
        lastMessage: message,
        unreadCount: message.senderId === user.id ? 0 : 1,
      })
    }

    const onTyping = (payload: { chatId: string; userId: string; firstName: string }) => {
      useChatStore.getState().setTyping(payload.chatId, {
        userId: payload.userId,
        firstName: payload.firstName,
      })
      window.setTimeout(() => {
        useChatStore.getState().setTyping(payload.chatId, null)
      }, 3000)
    }

    const onOnline = (payload: { userId: string }) => {
      useChatStore.getState().setOnline(payload.userId, true)
    }
    const onOffline = (payload: { userId: string }) => {
      useChatStore.getState().setOnline(payload.userId, false)
    }

    socket.on('message:new', onNew)
    socket.on('message:typing', onTyping)
    socket.on('user:online', onOnline)
    socket.on('user:offline', onOffline)

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        reconnectSocket()
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      socket.off('message:new', onNew)
      socket.off('message:typing', onTyping)
      socket.off('user:online', onOnline)
      socket.off('user:offline', onOffline)
      disconnectSocket()
    }
  }, [enabled, user])
}

export { getSocket }
