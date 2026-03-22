import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
})

export function getUploadDir() {
  return uploadDir
}
