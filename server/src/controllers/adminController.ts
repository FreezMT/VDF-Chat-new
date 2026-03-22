import type { Response } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import type { Role } from '@prisma/client'
import { prisma } from '../prisma.js'
import { AppError } from '../middleware/errors.js'
import { paramString } from '../utils/params.js'

const rolesList = ['dancer', 'parent', 'trainer', 'admin'] as const

export async function listUsers(req: AuthedRequest, res: Response): Promise<void> {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const roleParam = typeof req.query.role === 'string' ? req.query.role : undefined
  const role: Role | undefined =
    roleParam && rolesList.includes(roleParam as Role) ? (roleParam as Role) : undefined
  const teamId = typeof req.query.teamId === 'string' ? req.query.teamId : undefined

  const users = await prisma.user.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { email: { contains: q } },
                { login: { contains: q } },
                { firstName: { contains: q } },
                { lastName: { contains: q } },
                { visibleId: { contains: q } },
              ],
            }
          : {},
        role ? { role } : {},
        teamId ? { teamId } : {},
      ],
    },
    include: { team: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  res.json({
    users: users.map((u) => ({
      id: u.id,
      visibleId: u.visibleId,
      firstName: u.firstName,
      lastName: u.lastName,
      login: u.login,
      email: u.email,
      role: u.role,
      teamId: u.teamId,
      team: u.team,
      createdAt: u.createdAt,
    })),
  })
}

const roleSchema = z.object({ role: z.enum(['dancer', 'parent', 'trainer', 'admin']) })

export async function setUserRole(req: AuthedRequest, res: Response): Promise<void> {
  const id = paramString(req.params, 'id')
  const body = roleSchema.parse(req.body)
  if (!id) throw new AppError(400, 'Invalid id')
  if (id === req.userId && body.role !== 'admin') {
    throw new AppError(400, 'Cannot demote yourself')
  }
  const user = await prisma.user.update({
    where: { id },
    data: { role: body.role },
    include: { team: true },
  })
  res.json({ user })
}

const teamSchema = z.object({ name: z.string().min(1) })

export async function createTeam(req: AuthedRequest, res: Response): Promise<void> {
  const body = teamSchema.parse(req.body)
  const team = await prisma.team.create({ data: { name: body.name } })
  res.status(201).json({ team })
}

const teamUserSchema = z.object({ teamId: z.string().uuid().nullable() })

export async function setUserTeam(req: AuthedRequest, res: Response): Promise<void> {
  const id = paramString(req.params, 'id')
  const body = teamUserSchema.parse(req.body)
  if (!id) throw new AppError(400, 'Invalid id')
  if (body.teamId) {
    const t = await prisma.team.findUnique({ where: { id: body.teamId } })
    if (!t) throw new AppError(404, 'Team not found')
  }
  const user = await prisma.user.update({
    where: { id },
    data: { teamId: body.teamId },
    include: { team: true },
  })
  res.json({ user })
}

export async function deleteUser(req: AuthedRequest, res: Response): Promise<void> {
  const id = paramString(req.params, 'id')
  if (!id) throw new AppError(400, 'Invalid id')
  if (id === req.userId) throw new AppError(400, 'Cannot delete yourself')
  await prisma.user.delete({ where: { id } })
  res.json({ ok: true })
}
