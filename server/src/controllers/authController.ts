import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { HttpError } from '../middleware/errors.js'
import { prisma } from '../utils/prisma.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { generateUniqueVisibleId } from '../utils/visibleId.js'
import { toUserPublic } from '../utils/userPublic.js'

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  birthDate: z.string().optional(),
  role: z.enum(['dancer', 'parent']),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const REFRESH_COOKIE = 'refreshToken'
const cookieOpts = (res: Response) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
})

export async function register(req: Request, res: Response) {
  const body = registerSchema.parse(req.body)
  const exists = await prisma.user.findUnique({ where: { email: body.email } })
  if (exists) throw new HttpError(400, 'Email already registered')
  const passwordHash = await bcrypt.hash(body.password, 10)
  const visibleId = await generateUniqueVisibleId()
  const user = await prisma.user.create({
    data: {
      visibleId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      passwordHash,
      role: body.role,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
    },
    include: { team: true },
  })
  const payload = { sub: user.id, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts(res))
  return res.json({ accessToken, user: toUserPublic(user) })
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body)
  const user = await prisma.user.findUnique({ where: { email: body.email }, include: { team: true } })
  if (!user) throw new HttpError(401, 'Invalid credentials')
  const ok = await bcrypt.compare(body.password, user.passwordHash)
  if (!ok) throw new HttpError(401, 'Invalid credentials')
  const payload = { sub: user.id, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts(res))
  return res.json({ accessToken, user: toUserPublic(user) })
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
  if (!token) throw new HttpError(401, 'No refresh token')
  try {
    const payload = verifyRefreshToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw new HttpError(401, 'Invalid user')
    const accessToken = signAccessToken({ sub: user.id, role: user.role })
    return res.json({ accessToken })
  } catch {
    throw new HttpError(401, 'Invalid refresh token')
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/' })
  return res.json({ ok: true })
}
