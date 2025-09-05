import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Function to send data to client
      const sendEvent = (data: any) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(new TextEncoder().encode(payload))
      }

      // Send initial connection message
      sendEvent({
        type: 'connection',
        message: 'Connected to Master Room SSE stream',
        timestamp: new Date().toISOString()
      })

      // Simulate real-time master room data
      const interval = setInterval(() => {
        const stats = {
          totalRequests: Math.floor(Math.random() * 1000) + 150000,
          activeConnections: Math.floor(Math.random() * 20) + 80,
          sovereignStatus: 'ACTIVE',
          systemLoad: `${Math.floor(Math.random() * 30) + 15}%`,
          revenue: Math.random() * 10 + 150,
          timestamp: new Date().toISOString()
        }

        sendEvent({
          type: 'stats_update',
          data: stats
        })
      }, 2000)

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        sendEvent({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        clearInterval(heartbeat)
        controller.close()
      })
    },
  })

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}