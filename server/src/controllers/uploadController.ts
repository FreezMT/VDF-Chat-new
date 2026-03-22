import type { Response } from 'express'
import type { AuthedRequest } from '../middleware/auth.js'
import path from 'node:path'
import { AppError } from '../middleware/errors.js'

export async function uploadFile(req: AuthedRequest, res: Response): Promise<void> {
  const file = req.file
  if (!file) throw new AppError(400, 'No file')

  const publicPath = `/uploads/${file.filename}`
  const ext = path.extname(file.originalname).toLowerCase()
  let mediaType: 'image' | 'video' | 'file' = 'file'
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) mediaType = 'image'
  if (['.mp4', '.webm', '.mov'].includes(ext)) mediaType = 'video'

  res.json({ url: publicPath, mediaType, filename: file.filename })
}
