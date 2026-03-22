import type { Server } from 'socket.io'
import { verifyAccessToken } from '../utils/jwt.js'
import { setOnline, setOffline } from '../utils/redis.js'
import { registerChatHandlers } from './chatHandlers.js'

const connectionCounts = new Map<string, number>()

export function initSocket(io: Server) {
  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth as { token?: string })?.token ||
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : undefined)
      if (!token) return next(new Error('Unauthorized'))
      const payload = verifyAccessToken(token)
      socket.data.userId = payload.sub
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string
    const next = (connectionCounts.get(userId) ?? 0) + 1
    connectionCounts.set(userId, next)
    if (next === 1) {
      await setOnline(userId)
      io.emit('user:online', { userId })
    }

    registerChatHandlers(io, socket, userId)

    socket.on('online:ping', async () => {
      await setOnline(userId)
    })

    socket.on('disconnect', async () => {
      const left = (connectionCounts.get(userId) ?? 1) - 1
      if (left <= 0) {
        connectionCounts.delete(userId)
        await setOffline(userId)
        io.emit('user:offline', { userId })
      } else {
        connectionCounts.set(userId, left)
      }
    })
  })
}
