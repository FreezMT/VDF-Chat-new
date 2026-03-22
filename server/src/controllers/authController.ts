import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { AppError } from '../middleware/errors.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { generateUniqueVisibleId } from '../utils/visibleId.js'
import { REFRESH_COOKIE, refreshCookieOptions } from '../utils/cookies.js'
import { isAllowedTeamValue, teamLabelFromValue } from '../constants/vdfTeams.js'

const registerSchema = z.object({
  login: z.string().min(3).max(32),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  role: z.enum(['dancer', 'parent']),
  teamValue: z.string(),
})

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
})

function normalizeLogin(s: string): string {
  return s.trim().toLowerCase()
}

function userPublic(u: {
  id: string
  visibleId: string
  firstName: string
  lastName: string
  login: string | null
  email: string | null
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
    login: u.login,
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
  if (!isAllowedTeamValue(body.teamValue)) {
    throw new AppError(400, 'Invalid team')
  }
  const label = teamLabelFromValue(body.teamValue)
  if (!label) throw new AppError(400, 'Invalid team')

  const loginNorm = normalizeLogin(body.login)
  const exists = await prisma.user.findUnique({ where: { login: loginNorm } })
  if (exists) throw new AppError(409, 'Login already taken')

  const team = await prisma.team.upsert({
    where: { name: label },
    create: { name: label },
    update: {},
  })

  const passwordHash = await bcrypt.hash(body.password, 10)
  const visibleId = await generateUniqueVisibleId()
  const birthDate = new Date(`${body.birthDate}T12:00:00`)

  const user = await prisma.user.create({
    data: {
      login: loginNorm,
      email: null,
      passwordHash,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      role: body.role,
      visibleId,
      birthDate,
      teamId: team.id,
    },
  })

  const accessToken = signAccessToken(user.id, user.role)
  const refreshToken = signRefreshToken(user.id)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.status(201).json({
    user: userPublic({ ...user, team }),
    accessToken,
  })
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body)
  const raw = body.login.trim()
  const user = raw.includes('@')
    ? await prisma.user.findUnique({ where: { email: raw }, include: { team: true } })
    : await prisma.user.findUnique({
        where: { login: normalizeLogin(raw) },
        include: { team: true },
      })
  if (!user) throw new AppError(401, 'Invalid credentials')
  const ok = await bcrypt.compare(body.password, user.passwordHash)
  if (!ok) throw new AppError(401, 'Invalid credentials')

  const accessToken = signAccessToken(user.id, user.role)
  const refreshToken = signRefreshToken(user.id)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.json({
    user: userPublic({ ...user, team: user.team }),
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
