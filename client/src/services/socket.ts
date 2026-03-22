import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken
  if (!token) return null
  if (socket?.connected) return socket

  const url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || ''
  socket = io(url || undefined, {
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
  })
  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}

export function reconnectSocket(): Socket | null {
  disconnectSocket()
  return connectSocket()
}
