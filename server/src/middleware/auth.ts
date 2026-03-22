import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { prisma } from '../utils/prisma.js'
import { HttpError } from './errors.js'

export interface AuthedRequest extends Request {
  userId?: string
  role?: string
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) throw new HttpError(401, 'Unauthorized')
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw new HttpError(401, 'Unauthorized')
    req.userId = user.id
    req.role = user.role
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
