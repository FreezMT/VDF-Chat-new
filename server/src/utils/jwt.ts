import jwt from 'jsonwebtoken'

const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me'
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me'

export interface JwtPayload {
  sub: string
  role: string
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, accessSecret, { expiresIn: '15m' })
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, refreshSecret, { expiresIn: '30d' })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, accessSecret) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, refreshSecret) as JwtPayload
}
