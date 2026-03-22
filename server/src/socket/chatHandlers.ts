import type { Socket } from 'socket.io'
import type { Server } from 'socket.io'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { createAndEmitMessage } from '../services/messageService.js'
import { registerSocket, unregisterSocket } from './onlineTracker.js'

const sendSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['image', 'video', 'file']).optional(),
})

const typingSchema = z.object({
  chatId: z.string().uuid(),
})

const joinSchema = z.object({
  chatId: z.string().uuid(),
})

export function attachChatHandlers(io: Server, socket: Socket, userId: string): void {
  registerSocket(io, userId, socket.id)

  socket.on('disconnect', () => {
    void unregisterSocket(io, userId, socket.id)
  })

  socket.on('chat:join', async (raw) => {
    try {
      const { chatId } = joinSchema.parse(raw)
      const m = await prisma.chatMember.findUnique({
        where: { chatId_userId: { chatId, userId } },
      })
      if (!m) return
      void socket.join(`chat:${chatId}`)
    } catch {
      /* ignore */
    }
  })

  socket.on('message:send', async (raw) => {
    try {
      const data = sendSchema.parse(raw)
      if (!data.content && !data.mediaUrl) return
      await createAndEmitMessage(io, {
        chatId: data.chatId,
        senderId: userId,
        content: data.content,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
      })
    } catch {
      /* ignore */
    }
  })

  socket.on('message:typing', async (raw) => {
    try {
      const { chatId } = typingSchema.parse(raw)
      const m = await prisma.chatMember.findUnique({
        where: { chatId_userId: { chatId, userId } },
      })
      if (!m) return
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true },
      })
      socket.to(`chat:${chatId}`).emit('message:typing', {
        chatId,
        userId,
        firstName: u?.firstName ?? '',
      })
    } catch {
      /* ignore */
    }
  })

  socket.on('online:ping', () => {
    registerSocket(io, userId, socket.id)
  })
}
