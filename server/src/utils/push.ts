import webpush from 'web-push'
import { prisma } from '../prisma.js'
import { env } from '../config/env.js'

let configured = false

export function configureWebPush(): void {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  )
  configured = true
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!configured) return
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
  })
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          data,
        )
      } catch {
        await prisma.pushSubscription.deleteMany({ where: { id: s.id } })
      }
    }),
  )
}
