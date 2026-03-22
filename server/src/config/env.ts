import { config } from 'dotenv'
import { z } from 'zod'

config()

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  /** Пусто = без Redis, онлайн-статус в памяти процесса (удобно для Windows без Docker) */
  REDIS_URL: z
    .preprocess((v) => {
      if (v === undefined || v === null) return undefined
      if (typeof v === 'string' && v.trim() === '') return undefined
      return v
    }, z.string().min(1).optional()),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().default(900),
  REFRESH_TOKEN_TTL_SEC: z.coerce.number().default(60 * 60 * 24 * 30),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('uploads'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:4000'),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:admin@vdf.local'),
})

export const env = schema.parse(process.env)
