import type { CookieOptions } from 'express'
import { env } from '../config/env.js'

export const REFRESH_COOKIE = 'refresh_token'

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: env.REFRESH_TOKEN_TTL_SEC * 1000,
    path: '/',
  }
}
