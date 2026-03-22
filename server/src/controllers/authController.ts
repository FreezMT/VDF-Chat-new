import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { AppError } from '../middleware/errors.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { generateUniqueVisibleId } from '../utils/visibleId.js'
import { REFRESH_COOKIE, refreshCookieOptions } from '../utils/cookies.js'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().datetime().optional(),
  role: z.enum(['dancer', 'parent']),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

function userPublic(u: {
  id: string
  visibleId: string
  firstName: string
  lastName: string
  email: string
  role: string
  birthDate: Date | null
  avatarUrl: string | null
  teamId: string | null
  createdAt: Date
  team?: { id: string; name: string } | null
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
    createdAt: u.createdAt,
    team: u.team ?? null,
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = registerSchema.parse(req.body)
  const exists = await prisma.user.findUnique({ where: { email: body.email } })
  if (exists) throw new AppError(409, 'Email already registered')

  const passwordHash = await bcrypt.hash(body.password, 10)
  const visibleId = await generateUniqueVisibleId()
  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      visibleId,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
    },
  })

  const accessToken = signAccessToken(user.id, user.role)
  const refreshToken = signRefreshToken(user.id)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.status(201).json({
    user: userPublic({ ...user, team: null }),
    accessToken,
  })
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body)
  const user = await prisma.user.findUnique({ where: { email: body.email } })
  if (!user) throw new AppError(401, 'Invalid credentials')
  const ok = await bcrypt.compare(body.password, user.passwordHash)
  if (!ok) throw new AppError(401, 'Invalid credentials')

  const accessToken = signAccessToken(user.id, user.role)
  const refreshToken = signRefreshToken(user.id)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.json({
    user: userPublic({ ...user, team: null }),
    accessToken,
  })
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
  if (!token) throw new AppError(401, 'No refresh token')
  let payload
  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw new AppError(401, 'Invalid refresh token')
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw new AppError(401, 'User not found')

  const accessToken = signAccessToken(user.id, user.role)
  const refreshToken = signRefreshToken(user.id)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.json({ accessToken })
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(REFRESH_COOKIE, { path: '/' })
  res.json({ ok: true })
}
