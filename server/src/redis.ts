import { Redis } from 'ioredis'
import { env } from './config/env.js'

const ONLINE_PREFIX = 'online:'
const ONLINE_TTL_SEC = 300

/** In-memory fallback when REDIS_URL is not set (single process, e.g. local dev on Windows). */
const memOnline = new Map<string, number>()

function memSet(userId: string): void {
  memOnline.set(userId, Date.now() + ONLINE_TTL_SEC * 1000)
}

function memDel(userId: string): void {
  memOnline.delete(userId)
}

function memIs(userId: string): boolean {
  const exp = memOnline.get(userId)
  if (exp === undefined) return false
  if (Date.now() > exp) {
    memOnline.delete(userId)
    return false
  }
  return true
}

export const redis: Redis | null = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  : null

export async function setUserOnline(userId: string): Promise<void> {
  if (redis) {
    await redis.set(`${ONLINE_PREFIX}${userId}`, '1', 'EX', ONLINE_TTL_SEC)
  } else {
    memSet(userId)
  }
}

export async function refreshUserOnline(userId: string): Promise<void> {
  await setUserOnline(userId)
}

export async function setUserOffline(userId: string): Promise<void> {
  if (redis) {
    await redis.del(`${ONLINE_PREFIX}${userId}`)
  } else {
    memDel(userId)
  }
}

export async function isUserOnline(userId: string): Promise<boolean> {
  if (redis) {
    const v = await redis.get(`${ONLINE_PREFIX}${userId}`)
    return v === '1'
  }
  return memIs(userId)
}
