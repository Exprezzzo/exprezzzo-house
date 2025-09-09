import { NextRequest } from 'next/server';

// Demo responses for fallback
const DEMO_RESPONSES = [
  "🌹 The House always wins, and we're building the ultimate House!",
  "Vegas taught me: Ship fast, iterate faster, win biggest.",
  "We're running at $0.0002 vs BigTech's $0.15 - that's disruption!",
  "Privacy-first, sovereignty always, your data stays YOUR data."
];

function getDemoResponse(message: string): string {
  return DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
}

async function isProjectedCostOverThreshold(message: string, threshold: number): Promise<boolean> {
  // Simple cost projection based on message length
  const estimatedTokens = message.length / 4;
  const estimatedCost = estimatedTokens * 0.00002;
  return estimatedCost > threshold;
}

export async function POST(req: Request) {
  const { message, sessionId } = await req.json();
  const enc = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Check cost projection
        const degraded = await isProjectedCostOverThreshold(message, 0.001);
        if (degraded) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ meta: { degraded: true } })}\n\n`));
        }
        
        // Try Ollama first (sovereign)
        const r = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            model: 'llama3.2', 
            prompt: message, 
            stream: true 
          })
        });
        
        const reader = r.body?.getReader();
        if (!reader) throw new Error('No reader');
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = new TextDecoder().decode(value);
          const lines = text.split('\n').filter(Boolean);
          
          for (const line of lines) {
            try {
              const obj = JSON.parse(line);
              if (obj.response) {
                controller.enqueue(enc.encode(`data: ${obj.response}\n\n`));
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      } catch (e) {
        // Fallback to demo with typing effect
        const response = getDemoResponse(message);
        for (const ch of response) {
          controller.enqueue(enc.encode(`data: ${ch}\n\n`));
          await new Promise(r => setTimeout(r, 20));
        }
      } finally {
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
