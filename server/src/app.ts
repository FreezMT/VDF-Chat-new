import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { createServer } from 'node:http'
import { Server as SocketIOServer } from 'socket.io'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errors.js'
import { initSocket } from './socket/index.js'
import { getUploadDir } from './middleware/upload.js'

const app = express()

app.use(helmet({ contentSecurityPolicy: false }))
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(getUploadDir()))

app.use('/api', apiRouter)

app.use(errorHandler)

const httpServer = createServer(app)

const io = new SocketIOServer(httpServer, {
  path: '/socket.io',
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? true,
    credentials: true,
  },
})

initSocket(io)

export { app, httpServer }
