import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const data = `data: ${JSON.stringify({ 
        type: 'connected',
        timestamp: Date.now(),
        message: 'EXPREZZZO SSE Connected'
      })}\n\n`;
      
      controller.enqueue(encoder.encode(data));
      
      const interval = setInterval(() => {
        const ping = `data: ${JSON.stringify({ 
          type: 'ping',
          timestamp: Date.now()
        })}\n\n`;
        
        try {
          controller.enqueue(encoder.encode(ping));
        } catch (error) {
          clearInterval(interval);
          controller.close();
        }
      }, 30000);
      
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
