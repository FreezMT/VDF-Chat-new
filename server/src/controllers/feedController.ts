import type { Response } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import { prisma } from '../prisma.js'
import { AppError } from '../middleware/errors.js'
import { paramString } from '../utils/params.js'

const createSchema = z.object({
  content: z.string().min(1),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['image', 'video', 'file']).optional(),
})

export async function listFeed(req: AuthedRequest, res: Response): Promise<void> {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined

  const where: { createdAt?: { lt: Date } } = {}
  if (cursor) {
    const p = await prisma.post.findUnique({ where: { id: cursor } })
    if (p) where.createdAt = { lt: p.createdAt }
  }

  const posts = await prisma.post.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  })

  const nextCursor = posts.length === limit ? posts[posts.length - 1]?.id ?? null : null
  res.json({ posts, nextCursor })
}

export async function createPost(req: AuthedRequest, res: Response): Promise<void> {
  const body = createSchema.parse(req.body)
  const post = await prisma.post.create({
    data: {
      authorId: req.userId,
      content: body.content,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  })
  res.status(201).json({ post })
}

export async function deletePost(req: AuthedRequest, res: Response): Promise<void> {
  const postId = paramString(req.params, 'postId')
  if (!postId) throw new AppError(400, 'Invalid post')
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new AppError(404, 'Post not found')
  if (post.authorId !== req.userId && req.role !== 'admin') {
    throw new AppError(403, 'Forbidden')
  }
  await prisma.post.delete({ where: { id: postId } })
  res.json({ ok: true })
}
