import webpush from 'web-push'
import { prisma } from '../utils/prisma.js'

const publicKey = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com'

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

export async function notifyUsersAboutMessage(
  recipientIds: string[],
  payload: { title: string; body: string; data?: Record<string, string> },
  senderId: string,
) {
  if (!publicKey || !privateKey) return
  const body = JSON.stringify(payload)
  for (const userId of recipientIds) {
    if (userId === senderId) continue
    const subs = await prisma.pushSubscription.findMany({ where: { userId } })
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        )
      } catch (e) {
        console.warn('webpush failed', e)
        await prisma.pushSubscription.deleteMany({ where: { id: sub.id } })
      }
    }
  }
}
