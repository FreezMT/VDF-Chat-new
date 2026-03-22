import { Redis } from 'ioredis'

let client: Redis | null = null
const memoryOnline = new Set<string>()

export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL
  if (!url) return null
  if (!client) {
    client = new Redis(url, { maxRetriesPerRequest: null })
  }
  return client
}

export async function setOnline(userId: string) {
  memoryOnline.add(userId)
  const r = getRedis()
  if (r) await r.setex(`online:${userId}`, 120, '1')
}

export async function setOffline(userId: string) {
  memoryOnline.delete(userId)
  const r = getRedis()
  if (r) await r.del(`online:${userId}`)
}

export async function isOnline(userId: string): Promise<boolean> {
  if (memoryOnline.has(userId)) return true
  const r = getRedis()
  if (!r) return false
  const v = await r.get(`online:${userId}`)
  return v === '1'
}
