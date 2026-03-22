import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import path from 'node:path'
import rateLimit from 'express-rate-limit'
import { clientOrigins, env } from './config/env.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errors.js'

export function createApp(): express.Express {
  const app = express()
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  app.use(
    cors({
      origin: clientOrigins.length === 1 ? clientOrigins[0] : clientOrigins,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '12mb' }))
  app.use(cookieParser())
  app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)))
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.get('/', (_req, res) => {
    res.type('html').send(`<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VDF Chat — API</title>
<style>body{font-family:system-ui,sans-serif;max-width:36rem;margin:2rem auto;padding:0 1rem;line-height:1.5;background:#0f0f0f;color:#fff}a{color:#a78bfa}</style>
</head>
<body>
<h1>VDF Chat — сервер API</h1>
<p>Это бэкенд (порт ${env.PORT}). Интерфейс приложения запускается отдельно.</p>
<p><a href="${clientOrigins[0] ?? env.CLIENT_ORIGIN}">Открыть VDF Chat (клиент)</a></p>
<p style="color:#a0a0b0;font-size:.9rem">В разработке: <code>npm run dev</code> в папке <code>client</code> → обычно <code>http://localhost:5173</code></p>
</body>
</html>`)
  })

  app.use('/api', apiRouter)
  app.use(errorHandler)
  return app
}
