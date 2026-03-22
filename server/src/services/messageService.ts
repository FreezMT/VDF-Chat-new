import type { Server } from 'socket.io'
import { prisma } from '../prisma.js'
import { isUserOnline } from '../redis.js'
import { sendPushToUser } from '../utils/push.js'

export async function createAndEmitMessage(
  io: Server,
  params: {
    chatId: string
    senderId: string
    content?: string | null
    mediaUrl?: string | null
    mediaType?: string | null
  },
): Promise<void> {
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId: params.chatId, userId: params.senderId } },
  })
  if (!member) return

  const message = await prisma.message.create({
    data: {
      chatId: params.chatId,
      senderId: params.senderId,
      content: params.content ?? null,
      mediaUrl: params.mediaUrl ?? null,
      mediaType: params.mediaType ?? null,
    },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  })

  const payload = {
    id: message.id,
    chatId: message.chatId,
    senderId: message.senderId,
    content: message.content,
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    sender: message.sender,
  }

  io.to(`chat:${params.chatId}`).emit('message:new', { message: payload })

  const members = await prisma.chatMember.findMany({
    where: { chatId: params.chatId, userId: { not: params.senderId } },
    select: { userId: true },
  })

  await Promise.all(
    members.map(async ({ userId }) => {
      const online = await isUserOnline(userId)
      if (!online) {
        await sendPushToUser(userId, {
          title: `${message.sender.firstName}`,
          body: message.content?.slice(0, 120) || 'Новое сообщение',
          url: `/chats/${params.chatId}`,
        })
      }
    }),
  )
}
