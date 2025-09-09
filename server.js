#!/usr/bin/env node
/**
 * EXPREZZZO Sovereign House - Production Server
 * Vegas-first, sovereign-always, $0.0002/request
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 3000

// Initialize Next.js
const app = next({ dev, hostname, port, dir: './apps/web' })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Add EXPREZZZO headers
      res.setHeader('X-Powered-By', 'EXPREZZZO-Sovereign-House')
      res.setHeader('X-Cost-Per-Request', '$0.0002')
      res.setHeader('X-Vegas-First', 'true')
      
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('🎰 Server error:', err)
      res.statusCode = 500
      res.end('Sovereign fallback activated')
    }
  })
  .once('error', (err) => {
    console.error('🎰 Server startup error:', err)
    process.exit(1)
  })
  .listen(port, () => {
    console.log(`
🎰 EXPREZZZO SOVEREIGN HOUSE LIVE! 🎰
======================================
🏠 Server: http://${hostname}:${port}
💰 Cost: $0.0002 per request
🛡️ Mode: ${dev ? 'Development' : 'Production'}
🌹 Vegas First, Sovereignty Always
======================================
    `)
  })
})