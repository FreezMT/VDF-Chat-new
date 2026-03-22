import type { Server } from 'socket.io'
import { verifyAccessToken } from '../utils/jwt.js'
import { attachChatHandlers } from './chatHandlers.js'

export function initSocket(io: Server): void {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined
      if (!token) {
        next(new Error('Unauthorized'))
        return
      }
      const payload = verifyAccessToken(token)
      socket.data.userId = payload.sub
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string
    attachChatHandlers(io, socket, userId)
  })
}
