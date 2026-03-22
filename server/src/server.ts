import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { createApp } from './app.js'
import { clientOrigins, env } from './config/env.js'
import { initSocket } from './socket/index.js'
import { configureWebPush } from './utils/push.js'

configureWebPush()

const app = createApp()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: clientOrigins.length === 1 ? clientOrigins[0] : clientOrigins,
    credentials: true,
  },
})

initSocket(io)

httpServer.listen(env.PORT, () => {
  console.log(`VDF Chat API listening on port ${env.PORT}`)
})
