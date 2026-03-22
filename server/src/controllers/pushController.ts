import type { Response } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import { prisma } from '../utils/prisma.js'

const subSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string(),
})

export async function subscribe(req: AuthedRequest, res: Response) {
  const body = subSchema.parse(req.body)
  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    create: {
      userId: req.userId!,
      endpoint: body.endpoint,
      p256dh: body.p256dh,
      auth: body.auth,
    },
    update: { p256dh: body.p256dh, auth: body.auth, userId: req.userId! },
  })
  return res.json({ ok: true })
}

const unsubSchema = z.object({ endpoint: z.string().url() })

export async function unsubscribe(req: AuthedRequest, res: Response) {
  const body = unsubSchema.parse(req.body)
  await prisma.pushSubscription.deleteMany({
    where: { userId: req.userId!, endpoint: body.endpoint },
  })
  return res.json({ ok: true })
}
