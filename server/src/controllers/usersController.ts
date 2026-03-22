import type { Response } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import { prisma } from '../prisma.js'
import { AppError } from '../middleware/errors.js'
import { paramString } from '../utils/params.js'

function publicUser(u: {
  id: string
  visibleId: string
  firstName: string
  lastName: string
  email: string
  role: string
  birthDate: Date | null
  avatarUrl: string | null
  teamId: string | null
  team: { id: string; name: string } | null
}) {
  return {
    id: u.id,
    visibleId: u.visibleId,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    birthDate: u.birthDate,
    avatarUrl: u.avatarUrl,
    teamId: u.teamId,
    team: u.team,
  }
}

export async function getMe(req: AuthedRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { team: true },
  })
  if (!user) throw new AppError(404, 'User not found')
  res.json(publicUser(user))
}

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  birthDate: z.string().datetime().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

export async function updateMe(req: AuthedRequest, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body)
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      birthDate:
        body.birthDate === undefined
          ? undefined
          : body.birthDate
            ? new Date(body.birthDate)
            : null,
      avatarUrl: body.avatarUrl,
    },
    include: { team: true },
  })
  res.json(publicUser(user))
}

export async function getByVisibleId(req: AuthedRequest, res: Response): Promise<void> {
  const visibleId = paramString(req.params, 'visibleId')
  if (!visibleId || !/^\d{7}$/.test(visibleId)) throw new AppError(400, 'Invalid ID format')
  const user = await prisma.user.findUnique({
    where: { visibleId },
    include: { team: true },
  })
  if (!user) throw new AppError(404, 'User not found')
  res.json(publicUser(user))
}

export async function addFriend(req: AuthedRequest, res: Response): Promise<void> {
  const friendId = paramString(req.params, 'userId')
  if (!friendId || friendId === req.userId) throw new AppError(400, 'Cannot add yourself')

  const friend = await prisma.user.findUnique({
    where: { id: friendId },
    include: { team: true },
  })
  if (!friend) throw new AppError(404, 'User not found')

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: req.userId, friendId },
        { userId: friendId, friendId: req.userId },
      ],
    },
  })
  if (existing) {
    res.json({ friendship: existing })
    return
  }

  const friendship = await prisma.friendship.create({
    data: { userId: req.userId, friendId },
  })
  res.status(201).json({ friendship })
}

export async function listFriends(req: AuthedRequest, res: Response): Promise<void> {
  const rows = await prisma.friendship.findMany({
    where: {
      OR: [{ userId: req.userId }, { friendId: req.userId }],
    },
    include: {
      user: { include: { team: true } },
      friend: { include: { team: true } },
    },
  })

  const friends = rows.map((r) => {
    const other = r.userId === req.userId ? r.friend : r.user
    return publicUser(other)
  })
  res.json({ friends })
}
