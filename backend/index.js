import cors from 'cors'
import 'dotenv/config'
import express from 'express'

import { aiRouter } from './routes/ai.js'
import { notFound, errorHandler } from './middleware/errors.js'

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) || true,
    credentials: true,
  })
)
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/ai', aiRouter)

app.use(notFound)
app.use(errorHandler)

function startServer(preferredPort) {
  const server = app.listen(preferredPort, () => {
    // eslint-disable-next-line no-console
    console.log(`[faresplit-backend] listening on :${preferredPort}`)
  })

  server.on('error', (err) => {
    if (err?.code === 'EADDRINUSE') {
      const next = preferredPort + 1
      // eslint-disable-next-line no-console
      console.warn(
        `[faresplit-backend] port ${preferredPort} in use, trying ${next}...`
      )
      startServer(next)
      return
    }
    // eslint-disable-next-line no-console
    console.error('[faresplit-backend] failed to start', err)
    process.exit(1)
  })
}

startServer(Number(process.env.PORT || 8080))

