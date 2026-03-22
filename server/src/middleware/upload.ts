import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { env } from '../config/env.js'

const dir = path.resolve(env.UPLOAD_DIR)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
})
