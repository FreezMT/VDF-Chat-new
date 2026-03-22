import type { Response } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import { prisma } from '../prisma.js'
import { AppError } from '../middleware/errors.js'
import { paramString } from '../utils/params.js'

const groupSchema = z.object({
  name: z.string().min(1),
  memberIds: z.array(z.string().uuid()).min(1),
})

function serializeMessage(m: {
  id: string
  chatId: string
  senderId: string
  content: string | null
  mediaUrl: string | null
  mediaType: string | null
  createdAt: Date
  updatedAt: Date
  sender: { id: string; firstName: string; lastName: string; avatarUrl: string | null }
}) {
  return {
    id: m.id,
    chatId: m.chatId,
    senderId: m.senderId,
    content: m.content,
    mediaUrl: m.mediaUrl,
    mediaType: m.mediaType,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    sender: m.sender,
  }
}

export async function listChats(req: AuthedRequest, res: Response): Promise<void> {
  const memberships = await prisma.chatMember.findMany({
    where: { userId: req.userId },
    include: {
      chat: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: { id: true, firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  visibleId: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const items = await Promise.all(
    memberships.map(async (m) => {
      const chat = m.chat
      const last = chat.messages[0]
      const unreadCount = await prisma.message.count({
        where: {
          chatId: chat.id,
          senderId: { not: req.userId },
          readBy: { none: { userId: req.userId } },
        },
      })

      let title = chat.name
      if (chat.type === 'private' && !title) {
        const other = chat.members.find((x) => x.userId !== req.userId)?.user
        title = other ? `${other.firstName} ${other.lastName}` : 'Чат'
      }

      return {
        id: chat.id,
        type: chat.type,
        name: title,
        avatarUrl: chat.avatarUrl,
        createdAt: chat.createdAt,
        lastMessage: last ? serializeMessage(last) : null,
        unreadCount,
        members: chat.members.map((mb) => mb.user),
      }
    }),
  )

  items.sort((a, b) => {
    const ta = a.lastMessage?.createdAt?.getTime() ?? a.createdAt.getTime()
    const tb = b.lastMessage?.createdAt?.getTime() ?? b.createdAt.getTime()
    return tb - ta
  })

  res.json({ chats: items })
}

export async function privateChat(req: AuthedRequest, res: Response): Promise<void> {
  const otherId = paramString(req.params, 'userId')
  if (!otherId || otherId === req.userId) throw new AppError(400, 'Invalid user')

  const other = await prisma.user.findUnique({ where: { id: otherId } })
  if (!other) throw new AppError(404, 'User not found')

  const existing = await prisma.chat.findFirst({
    where: {
      type: 'private',
      AND: [
        { members: { some: { userId: req.userId } } },
        { members: { some: { userId: otherId } } },
      ],
    },
    include: {
      members: { include: { user: true } },
    },
  })

  if (existing) {
    res.json({ chat: existing })
    return
  }

  const chat = await prisma.chat.create({
    data: {
      type: 'private',
      createdBy: req.userId,
      members: {
        create: [{ userId: req.userId }, { userId: otherId }],
      },
    },
    include: {
      members: { include: { user: true } },
    },
  })
  res.status(201).json({ chat })
}

export async function createGroup(req: AuthedRequest, res: Response): Promise<void> {
  const body = groupSchema.parse(req.body)
  const memberSet = new Set([req.userId, ...body.memberIds])
  const users = await prisma.user.findMany({
    where: { id: { in: [...memberSet] } },
  })
  if (users.length !== memberSet.size) throw new AppError(400, 'Invalid members')

  const chat = await prisma.chat.create({
    data: {
      type: 'group',
      name: body.name,
      createdBy: req.userId,
      members: {
        create: [...memberSet].map((userId) => ({ userId })),
      },
    },
    include: {
      members: { include: { user: true } },
    },
  })
  res.status(201).json({ chat })
}

export async function getMessages(req: AuthedRequest, res: Response): Promise<void> {
  const chatId = paramString(req.params, 'chatId')
  if (!chatId) throw new AppError(400, 'Invalid chat')

  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30))
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined

  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId: req.userId } },
  })
  if (!member) throw new AppError(403, 'Not a member')

  const where: { chatId: string; createdAt?: { lt: Date } } = { chatId }
  if (cursor) {
    const c = await prisma.message.findUnique({ where: { id: cursor } })
    if (c && c.chatId === chatId) where.createdAt = { lt: c.createdAt }
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  })

  const nextCursor =
    messages.length === limit ? messages[messages.length - 1]?.id ?? null : null
  res.json({
    messages: messages.reverse().map(serializeMessage),
    nextCursor,
  })
}

export async function markRead(req: AuthedRequest, res: Response): Promise<void> {
  const chatId = paramString(req.params, 'chatId')
  if (!chatId) throw new AppError(400, 'Invalid chat')

  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId: req.userId } },
  })
  if (!member) throw new AppError(403, 'Not a member')

  const unread = await prisma.message.findMany({
    where: {
      chatId,
      senderId: { not: req.userId },
      readBy: { none: { userId: req.userId } },
    },
    select: { id: true },
  })

  if (unread.length) {
    await prisma.$transaction(
      unread.map((m) =>
        prisma.readReceipt.upsert({
          where: {
            messageId_userId: { messageId: m.id, userId: req.userId },
          },
          create: { messageId: m.id, userId: req.userId },
          update: {},
        }),
      ),
    )
  }

  res.json({ ok: true })
}
