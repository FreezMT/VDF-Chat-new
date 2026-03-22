import type { Server, Socket } from 'socket.io'
import { z } from 'zod'
import { prisma } from '../utils/prisma.js'
import { toUserPublic } from '../utils/userPublic.js'
import { notifyUsersAboutMessage } from '../services/pushService.js'
import { isOnline } from '../utils/redis.js'

const sendSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.string().optional(),
})

export function registerChatHandlers(io: Server, socket: Socket, userId: string) {
  socket.on('chat:join', async (raw: unknown) => {
    const { chatId } = z.object({ chatId: z.string().uuid() }).parse(raw)
    const m = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    })
    if (!m) return
    await socket.join(`chat:${chatId}`)
  })

  socket.on('message:send', async (raw: unknown) => {
    const body = sendSchema.parse(raw)
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: body.chatId, userId } },
    })
    if (!member) return
    if (!body.content && !body.mediaUrl) return
    const message = await prisma.message.create({
      data: {
        chatId: body.chatId,
        senderId: userId,
        content: body.content ?? null,
        mediaUrl: body.mediaUrl ?? null,
        mediaType: body.mediaType ?? null,
      },
      include: { sender: { include: { team: true } } },
    })
    const payload = {
      message: {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        sender: toUserPublic(message.sender),
      },
    }
    io.to(`chat:${body.chatId}`).emit('message:new', payload)

    const members = await prisma.chatMember.findMany({
      where: { chatId: body.chatId },
      select: { userId: true },
    })
    const recipientIds = members.map((m) => m.userId).filter((id) => id !== userId)
    for (const rid of recipientIds) {
      const online = await isOnline(rid)
      if (!online) {
        await notifyUsersAboutMessage(
          [rid],
          {
            title: `${message.sender.firstName}`,
            body: message.content ?? 'Медиа',
            data: { chatId: body.chatId, messageId: message.id },
          },
          userId,
        )
      }
    }
  })

  socket.on('message:typing', async (raw: unknown) => {
    const { chatId } = z.object({ chatId: z.string().uuid() }).parse(raw)
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    })
    if (!member) return
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return
    socket.to(`chat:${chatId}`).emit('message:typing', {
      chatId,
      userId,
      firstName: user.firstName,
    })
  })
}
