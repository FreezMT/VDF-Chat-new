import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { initSocket } from './socket/index.js'
import { configureWebPush } from './utils/push.js'

configureWebPush()

const app = createApp()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: env.CLIENT_ORIGIN, credentials: true },
})

initSocket(io)

httpServer.listen(env.PORT, () => {
  console.log(`VDF Chat API listening on port ${env.PORT}`)
})
