import type { Response } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import { HttpError } from '../middleware/errors.js'
import { prisma } from '../utils/prisma.js'
import { toUserPublic } from '../utils/userPublic.js'
import type { Role } from '@prisma/client'

function queryString(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  return undefined
}

export async function listUsers(req: AuthedRequest, res: Response) {
  const q = queryString(req.query.q)?.trim()
  const roleRaw = queryString(req.query.role)
  const role =
    roleRaw && ['dancer', 'parent', 'trainer', 'admin'].includes(roleRaw) ? (roleRaw as Role) : undefined
  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { visibleId: { contains: q } },
            ],
          }
        : {}),
      ...(role ? { role } : {}),
    },
    include: { team: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return res.json({ users: users.map(toUserPublic) })
}

const roleSchema = z.object({ role: z.enum(['dancer', 'parent', 'trainer', 'admin']) })

export async function setRole(req: AuthedRequest, res: Response) {
  const id = String(req.params.id)
  const body = roleSchema.parse(req.body)
  const user = await prisma.user.update({
    where: { id },
    data: { role: body.role },
    include: { team: true },
  })
  return res.json({ user: toUserPublic(user) })
}

const teamSchema = z.object({ name: z.string().min(1) })

export async function createTeam(req: AuthedRequest, res: Response) {
  const body = teamSchema.parse(req.body)
  const team = await prisma.team.create({ data: { name: body.name } })
  return res.json({ team })
}

const assignTeamSchema = z.object({ teamId: z.string().uuid().nullable() })

export async function assignTeam(req: AuthedRequest, res: Response) {
  const id = String(req.params.id)
  const body = assignTeamSchema.parse(req.body)
  const user = await prisma.user.update({
    where: { id },
    data: { teamId: body.teamId },
    include: { team: true },
  })
  return res.json({ user: toUserPublic(user) })
}

export async function deleteUser(req: AuthedRequest, res: Response) {
  const id = String(req.params.id)
  if (id === req.userId) throw new HttpError(400, 'Cannot delete self')
  await prisma.user.delete({ where: { id } })
  return res.json({ ok: true })
}
