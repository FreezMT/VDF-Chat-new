import type { Response } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import { HttpError } from '../middleware/errors.js'
import { prisma } from '../utils/prisma.js'
import { toUserPublic } from '../utils/userPublic.js'

async function findPrivateChatBetween(a: string, b: string) {
  const chats = await prisma.chat.findMany({
    where: {
      type: 'private',
      AND: [{ members: { some: { userId: a } } }, { members: { some: { userId: b } } }],
    },
    include: { members: { include: { user: { include: { team: true } } } } },
  })
  return chats.find((c) => c.members.length === 2) ?? null
}

async function mapChatListItem(chatId: string, userId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      members: { include: { user: { include: { team: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { include: { team: true } } } },
    },
  })
  if (!chat) return null
  const lastMessage = chat.messages[0] ?? null
  const unread = await prisma.message.count({
    where: {
      chatId,
      senderId: { not: userId },
      NOT: { readBy: { some: { userId } } },
    },
  })
  const other =
    chat.type === 'private'
      ? chat.members.find((m) => m.userId !== userId)?.user
      : null
  const displayName =
    chat.type === 'group'
      ? chat.name ?? 'Группа'
      : other
        ? `${other.firstName} ${other.lastName}`
        : 'Чат'
  const avatarUrl = chat.type === 'group' ? chat.avatarUrl : other?.avatarUrl ?? null
  return {
    id: chat.id,
    type: chat.type,
    name: displayName,
    avatarUrl,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          chatId: lastMessage.chatId,
          senderId: lastMessage.senderId,
          content: lastMessage.content,
          mediaUrl: lastMessage.mediaUrl,
          mediaType: lastMessage.mediaType,
          createdAt: lastMessage.createdAt,
          updatedAt: lastMessage.updatedAt,
          sender: toUserPublic(lastMessage.sender),
        }
      : null,
    unreadCount: unread,
    members: chat.members.map((m) => ({ user: toUserPublic(m.user) })),
  }
}

export async function listChats(req: AuthedRequest, res: Response) {
  const memberRows = await prisma.chatMember.findMany({
    where: { userId: req.userId! },
    select: { chatId: true },
  })
  const items = []
  for (const { chatId } of memberRows) {
    const mapped = await mapChatListItem(chatId, req.userId!)
    if (mapped) items.push(mapped)
  }
  items.sort((a, b) => {
    const ta = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
    const tb = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
    return tb - ta
  })
  return res.json({ chats: items })
}

export async function getOrCreatePrivate(req: AuthedRequest, res: Response) {
  const otherId = String(req.params.userId)
  if (otherId === req.userId) throw new HttpError(400, 'Invalid user')
  const other = await prisma.user.findUnique({ where: { id: otherId } })
  if (!other) throw new HttpError(404, 'User not found')
  const existing = await findPrivateChatBetween(req.userId!, otherId)
  const created =
    existing ??
    (await prisma.chat.create({
      data: {
        type: 'private',
        createdBy: req.userId!,
        members: {
          create: [{ userId: req.userId! }, { userId: otherId }],
        },
      },
      include: { members: { include: { user: { include: { team: true } } } } },
    }))
  const mapped = await mapChatListItem(created.id, req.userId!)
  if (!mapped) throw new HttpError(500, 'Chat error')
  return res.json({ chat: mapped })
}

const groupSchema = z.object({
  name: z.string().min(1),
  memberIds: z.array(z.string().uuid()).min(1),
})

export async function createGroup(req: AuthedRequest, res: Response) {
  const body = groupSchema.parse(req.body)
  const memberIds = Array.from(new Set([...body.memberIds, req.userId!]))
  const chat = await prisma.chat.create({
    data: {
      type: 'group',
      name: body.name,
      createdBy: req.userId!,
      members: {
        create: memberIds.map((userId) => ({ userId })),
      },
    },
  })
  const mapped = await mapChatListItem(chat.id, req.userId!)
  return res.json({ chat: mapped })
}

export async function getMessages(req: AuthedRequest, res: Response) {
  const chatId = String(req.params.chatId)
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId: req.userId! } },
  })
  if (!member) throw new HttpError(403, 'Not a member')
  const limit = Math.min(Number(req.query.limit ?? 30), 100)
  const cursorId = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
  const cursorMsg = cursorId
    ? await prisma.message.findFirst({ where: { id: cursorId, chatId } })
    : null
  if (cursorId && !cursorMsg) throw new HttpError(400, 'Invalid cursor')
  const messages = await prisma.message.findMany({
    where: {
      chatId,
      ...(cursorMsg ? { createdAt: { lt: cursorMsg.createdAt } } : {}),
    },
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: { sender: { include: { team: true } } },
  })
  const hasMore = messages.length > limit
  const slice = hasMore ? messages.slice(0, limit) : messages
  const nextCursor = hasMore && slice.length > 0 ? slice[slice.length - 1].id : null
  const ordered = slice.reverse().map((m) => ({
    id: m.id,
    chatId: m.chatId,
    senderId: m.senderId,
    content: m.content,
    mediaUrl: m.mediaUrl,
    mediaType: m.mediaType,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    sender: toUserPublic(m.sender),
  }))
  return res.json({ messages: ordered, nextCursor })
}

export async function markRead(req: AuthedRequest, res: Response) {
  const chatId = String(req.params.chatId)
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId: req.userId! } },
  })
  if (!member) throw new HttpError(403, 'Not a member')
  const msgs = await prisma.message.findMany({
    where: { chatId, senderId: { not: req.userId! } },
    select: { id: true },
  })
  await prisma.$transaction(
    msgs.map((m) =>
      prisma.readReceipt.upsert({
        where: { messageId_userId: { messageId: m.id, userId: req.userId! } },
        create: { messageId: m.id, userId: req.userId! },
        update: {},
      }),
    ),
  )
  return res.json({ ok: true })
}
