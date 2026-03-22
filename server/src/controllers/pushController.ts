import type { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import { prisma } from '../prisma.js'
import { env } from '../config/env.js'

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

export async function getVapidPublic(_req: Request, res: Response): Promise<void> {
  res.json({ publicKey: env.VAPID_PUBLIC_KEY ?? null })
}

export async function subscribe(req: AuthedRequest, res: Response): Promise<void> {
  const body = subSchema.parse(req.body)
  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    create: {
      userId: req.userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
    update: {
      userId: req.userId,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
  })
  res.json({ ok: true })
}

export async function unsubscribe(req: AuthedRequest, res: Response): Promise<void> {
  const endpoint =
    typeof req.query.endpoint === 'string' && req.query.endpoint.length > 0
      ? req.query.endpoint
      : z.object({ endpoint: z.string().url() }).parse(req.body).endpoint
  await prisma.pushSubscription.deleteMany({
    where: { userId: req.userId, endpoint },
  })
  res.json({ ok: true })
}
