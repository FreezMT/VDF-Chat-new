import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { Role } from '@prisma/client'

export type AccessPayload = { sub: string; role: Role; typ: 'access' }
export type RefreshPayload = { sub: string; typ: 'refresh' }

export function signAccessToken(userId: string, role: Role): string {
  const payload: AccessPayload = { sub: userId, role, typ: 'access' }
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL_SEC,
  })
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshPayload = { sub: userId, typ: 'refresh' }
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL_SEC,
  })
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload
  if (decoded.typ !== 'access') throw new Error('Invalid token type')
  return decoded
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload
  if (decoded.typ !== 'refresh') throw new Error('Invalid token type')
  return decoded
}
