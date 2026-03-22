import type { Response } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import { HttpError } from '../middleware/errors.js'
import { prisma } from '../utils/prisma.js'
import { toUserPublic } from '../utils/userPublic.js'

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  birthDate: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
})

export async function meGet(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: { team: true },
  })
  if (!user) throw new HttpError(404, 'Not found')
  return res.json({ user: toUserPublic(user) })
}

export async function mePut(req: AuthedRequest, res: Response) {
  const body = updateSchema.parse(req.body)
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      ...('firstName' in body && body.firstName !== undefined ? { firstName: body.firstName } : {}),
      ...('lastName' in body && body.lastName !== undefined ? { lastName: body.lastName } : {}),
      ...('birthDate' in body && body.birthDate !== undefined
        ? { birthDate: body.birthDate ? new Date(body.birthDate) : null }
        : {}),
      ...('avatarUrl' in body && body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
    },
    include: { team: true },
  })
  return res.json({ user: toUserPublic(user) })
}

export async function findByVisibleId(req: AuthedRequest, res: Response) {
  const visibleId = String(req.params.visibleId)
  if (!/^\d{7}$/.test(visibleId)) throw new HttpError(400, 'Invalid visibleId')
  const user = await prisma.user.findUnique({
    where: { visibleId },
    include: { team: true },
  })
  if (!user) throw new HttpError(404, 'User not found')
  return res.json({ user: toUserPublic(user) })
}

export async function addFriend(req: AuthedRequest, res: Response) {
  const userId = String(req.params.userId)
  if (userId === req.userId) throw new HttpError(400, 'Cannot add yourself')
  const friend = await prisma.user.findUnique({ where: { id: userId } })
  if (!friend) throw new HttpError(404, 'User not found')
  await prisma.friendship.upsert({
    where: {
      userId_friendId: { userId: req.userId!, friendId: userId },
    },
    create: { userId: req.userId!, friendId: userId },
    update: {},
  })
  return res.json({ ok: true })
}

export async function listFriends(req: AuthedRequest, res: Response) {
  const rows = await prisma.friendship.findMany({
    where: { userId: req.userId! },
    include: { friend: { include: { team: true } } },
  })
  return res.json({ friends: rows.map((r) => toUserPublic(r.friend)) })
}
