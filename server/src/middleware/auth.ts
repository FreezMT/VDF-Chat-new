import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { AppError } from './errors.js'
import type { Role } from '@prisma/client'

export type AuthedRequest = Request & {
  userId: string
  role: Role
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized')
    }
    const token = header.slice(7)
    const payload = verifyAccessToken(token)
    ;(req as AuthedRequest).userId = payload.sub
    ;(req as AuthedRequest).role = payload.role
    next()
  } catch {
    next(new AppError(401, 'Unauthorized'))
  }
}
