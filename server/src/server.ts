import { httpServer } from './app.js'

const port = Number(process.env.PORT ?? 4000)

httpServer.listen(port, () => {
  console.log(`VDF Chat API listening on http://localhost:${port}`)
})
