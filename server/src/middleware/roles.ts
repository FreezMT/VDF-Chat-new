import type { NextFunction, Request, Response } from 'express'
import type { Role } from '@prisma/client'
import type { AuthedRequest } from './auth.js'
import { AppError } from './errors.js'

export function requireRoles(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const r = req as AuthedRequest
    if (!allowed.includes(r.role)) {
      next(new AppError(403, 'Forbidden'))
      return
    }
    next()
  }
}
