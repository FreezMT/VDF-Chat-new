import type { Response, NextFunction } from 'express'
import type { AuthedRequest } from './auth.js'
import { HttpError } from './errors.js'

export function requireRoles(...roles: string[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return next(new HttpError(403, 'Forbidden'))
    }
    next()
  }
}
