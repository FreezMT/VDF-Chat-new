import type { Response } from 'express'
import type { AuthedRequest } from '../middleware/auth.js'
import path from 'node:path'

export async function uploadFile(req: AuthedRequest, res: Response) {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'No file' })
  const publicBase = process.env.PUBLIC_URL ?? 'http://localhost:4000'
  const url = `${publicBase}/uploads/${path.basename(file.filename)}`
  const ext = path.extname(file.originalname).toLowerCase()
  let mediaType = 'file'
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) mediaType = 'image'
  if (['.mp4', '.webm', '.mov'].includes(ext)) mediaType = 'video'
  return res.json({ url, mediaType })
}
