import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: any) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(new TextEncoder().encode(payload))
      }

      // Send initial connection
      sendEvent({
        type: 'connection',
        message: 'Connected to Network Room monitoring',
        timestamp: new Date().toISOString()
      })

      // Simulate network monitoring data
      const interval = setInterval(() => {
        const networkData = {
          nodes: [
            {
              id: 'vegas-primary',
              status: Math.random() > 0.1 ? 'active' : 'warning',
              latency: Math.floor(Math.random() * 20) + 10,
              throughput: Math.floor(Math.random() * 200) + 800,
              connections: Math.floor(Math.random() * 100) + 1200
            },
            {
              id: 'sovereign-core',
              status: 'active',
              latency: Math.floor(Math.random() * 5) + 1,
              throughput: Math.floor(Math.random() * 300) + 1000,
              connections: Math.floor(Math.random() * 50) + 850
            },
            {
              id: 'ollama-node',
              status: Math.random() > 0.05 ? 'active' : 'warning',
              latency: Math.floor(Math.random() * 3) + 1,
              throughput: Math.floor(Math.random() * 100) + 400,
              connections: Math.floor(Math.random() * 30) + 200
            }
          ],
          totalThroughput: Math.floor(Math.random() * 500) + 2200,
          networkLoad: Math.floor(Math.random() * 40) + 30,
          timestamp: new Date().toISOString()
        }

        sendEvent({
          type: 'network_update',
          data: networkData
        })
      }, 3000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}