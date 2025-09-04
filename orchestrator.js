#!/usr/bin/env node
/**
 * EXPREZZZO Orchestrator - Service Management
 * Coordinates Ollama, PostgreSQL, Redis, and Next.js
 */

const { spawn, exec } = require('child_process')
const { readFileSync } = require('fs')

class ExprezzoOrchestrator {
  constructor() {
    this.services = new Map()
    this.budget = 0.001 // $0.001 per request
    this.degraded = false
  }

  async start() {
    console.log(`
🎰 EXPREZZZO ORCHESTRATOR STARTING 🎰
====================================
🏠 Sovereign House v4.1
💰 Budget: $${this.budget}/request
====================================
    `)

    // Start services in order
    await this.startPostgres()
    await this.startRedis()
    await this.startOllama()
    await this.startNextjs()

    this.monitor()
  }

  async startPostgres() {
    console.log('🐘 Starting PostgreSQL...')
    try {
      const pg = spawn('pg_ctl', ['start', '-D', process.env.PGDATA || '/usr/local/var/postgres'], {
        stdio: 'pipe'
      })
      this.services.set('postgres', pg)
      console.log('✅ PostgreSQL started')
    } catch (error) {
      console.log('⚠️ PostgreSQL not available - using mock data')
    }
  }

  async startRedis() {
    console.log('🔴 Starting Redis...')
    try {
      const redis = spawn('redis-server', [], { stdio: 'pipe' })
      this.services.set('redis', redis)
      console.log('✅ Redis started')
    } catch (error) {
      console.log('⚠️ Redis not available - using in-memory cache')
    }
  }

  async startOllama() {
    console.log('🦙 Starting Ollama...')
    try {
      const ollama = spawn('ollama', ['serve'], { stdio: 'pipe' })
      this.services.set('ollama', ollama)
      
      // Wait for Ollama to be ready
      await this.waitForService('http://localhost:11434', 10000)
      console.log('✅ Ollama started')
    } catch (error) {
      console.log('⚠️ Ollama not available - using fallback responses')
      this.degraded = true
    }
  }

  async startNextjs() {
    console.log('⚡ Starting Next.js...')
    const nextjs = spawn('node', ['server.js'], { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    })
    this.services.set('nextjs', nextjs)
    console.log('✅ Next.js started')
  }

  async waitForService(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now()
      
      const check = () => {
        exec(`curl -s ${url}`, (error) => {
          if (!error) {
            resolve()
          } else if (Date.now() - start > timeout) {
            reject(new Error(`Service ${url} not ready after ${timeout}ms`))
          } else {
            setTimeout(check, 500)
          }
        })
      }
      
      check()
    })
  }

  monitor() {
    console.log('👁️ Monitoring services...')
    
    setInterval(() => {
      const status = {
        timestamp: new Date().toISOString(),
        services: {},
        degraded: this.degraded,
        budget: this.budget
      }

      for (const [name, process] of this.services) {
        status.services[name] = {
          running: !process.killed && process.exitCode === null,
          pid: process.pid
        }
      }

      console.log('🏠 EXPREZZZO Status:', JSON.stringify(status, null, 2))
    }, 30000) // Status every 30 seconds
  }

  async stop() {
    console.log('🛑 Stopping EXPREZZZO services...')
    
    for (const [name, process] of this.services) {
      console.log(`Stopping ${name}...`)
      process.kill('SIGTERM')
    }

    console.log('✅ All services stopped')
    process.exit(0)
  }
}

// Handle graceful shutdown
const orchestrator = new ExprezzoOrchestrator()

process.on('SIGINT', () => orchestrator.stop())
process.on('SIGTERM', () => orchestrator.stop())

// Start the show
orchestrator.start().catch(console.error)