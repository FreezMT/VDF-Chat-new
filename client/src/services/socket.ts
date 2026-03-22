import { io, type Socket } from 'socket.io-client'
import { getAccessToken } from '@/api/client'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket

  const token = getAccessToken()
  const url = typeof window !== 'undefined' ? window.location.origin : ''

  socket = io(url, {
    path: '/socket.io',
    auth: token ? { token } : {},
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}

export function reconnectSocket() {
  disconnectSocket()
  connectSocket()
}
