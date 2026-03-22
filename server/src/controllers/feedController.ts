import type { Response } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import { HttpError } from '../middleware/errors.js'
import { prisma } from '../utils/prisma.js'
import { toUserPublic } from '../utils/userPublic.js'

export async function listFeed(req: AuthedRequest, res: Response) {
  const limit = Math.min(Number(req.query.limit ?? 20), 50)
  const cursorId = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
  const cursorPost = cursorId
    ? await prisma.post.findUnique({ where: { id: cursorId } })
    : null
  if (cursorId && !cursorPost) throw new HttpError(400, 'Invalid cursor')
  const posts = await prisma.post.findMany({
    where: cursorPost ? { createdAt: { lt: cursorPost.createdAt } } : undefined,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: { author: { include: { team: true } } },
  })
  const hasMore = posts.length > limit
  const slice = hasMore ? posts.slice(0, limit) : posts
  const nextCursor = hasMore && slice.length > 0 ? slice[slice.length - 1].id : null
  return res.json({
    posts: slice.map((p) => ({
      id: p.id,
      authorId: p.authorId,
      content: p.content,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      createdAt: p.createdAt,
      author: toUserPublic(p.author),
    })),
    nextCursor,
  })
}

const createSchema = z.object({
  content: z.string().min(1),
  mediaUrl: z.string().url().optional(),
  mediaType: z.string().optional(),
})

export async function createPost(req: AuthedRequest, res: Response) {
  const body = createSchema.parse(req.body)
  const post = await prisma.post.create({
    data: {
      authorId: req.userId!,
      content: body.content,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
    },
    include: { author: { include: { team: true } } },
  })
  return res.json({
    post: {
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      createdAt: post.createdAt,
      author: toUserPublic(post.author),
    },
  })
}

export async function deletePost(req: AuthedRequest, res: Response) {
  const postId = String(req.params.postId)
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new HttpError(404, 'Not found')
  if (post.authorId !== req.userId && req.role !== 'admin') throw new HttpError(403, 'Forbidden')
  await prisma.post.delete({ where: { id: postId } })
  return res.json({ ok: true })
}
