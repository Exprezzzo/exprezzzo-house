import { NextRequest } from 'next/server';
import costGuard from '../../../lib/cost-guard'
import analytics from '../../../lib/analytics'

// Demo responses for fallback
const DEMO_RESPONSES = [
  "🌹 The House always wins, and we're building the ultimate House!",
  "Vegas taught me: Ship fast, iterate faster, win biggest.",
  "We're running at $0.0002 vs BigTech's $0.15 - that's disruption!",
  "Privacy-first, sovereignty always, your data stays YOUR data.",
  "Hurricane v4.1: Cost guard active, sovereignty protected, Vegas-first always."
];

function getDemoResponse(message: string): string {
  return DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
}

async function checkCostWithGuard(message: string): Promise<{allowed: boolean, degraded: boolean, cost: number, reason?: string}> {
  // Estimate cost based on message length
  const estimatedTokens = message.length / 4;
  const estimatedCost = estimatedTokens * 0.00002 + 0.00008; // Base processing cost
  
  // Check with Hurricane v4.1 cost guard
  const result = await costGuard.checkCost(estimatedCost, 'chat_streaming');
  
  return {
    allowed: result.allowed,
    degraded: result.degraded,
    cost: result.adjustedCost || estimatedCost,
    reason: result.reason
  };
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const { message, sessionId } = await req.json();
  const enc = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Hurricane v4.1 Cost Guard Check
        const costCheck = await checkCostWithGuard(message);
        
        if (!costCheck.allowed) {
          await analytics.logEvent('CHAT_BLOCKED', {
            reason: costCheck.reason,
            cost: costCheck.cost,
            messageLength: message.length
          });
          
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ 
            error: 'Request blocked by Hurricane v4.1 cost guard', 
            cost: costCheck.cost,
            reason: costCheck.reason,
            degraded: costCheck.degraded,
            suggestion: 'Try a shorter message or wait for daily budget reset'
          })}\n\n`));
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }
        
        if (costCheck.degraded) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ 
            meta: { 
              degraded: true, 
              cost: costCheck.cost,
              message: '🎰 Hurricane v4.1 degraded mode active - Vegas sovereignty protected 🎰' 
            } 
          })}\n\n`));
        }
        
        // Log the request start
        await analytics.logEvent('CHAT_STREAM_START', {
          sessionId,
          messageLength: message.length,
          estimatedCost: costCheck.cost,
          degraded: costCheck.degraded
        });
        
        // Try Ollama first (sovereign)
        const r = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            model: costCheck.degraded ? 'llama3.2:1b' : 'llama3.2', // Use smaller model in degraded mode
            prompt: message, 
            stream: true,
            options: {
              num_predict: costCheck.degraded ? 50 : 200 // Limit tokens in degraded mode
            }
          })
        });
        
        const reader = r.body?.getReader();
        if (!reader) throw new Error('No reader available');
        
        let totalTokens = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = new TextDecoder().decode(value);
          const lines = text.split('\n').filter(Boolean);
          
          for (const line of lines) {
            try {
              const obj = JSON.parse(line);
              if (obj.response) {
                totalTokens += obj.response.length / 4; // Estimate tokens
                controller.enqueue(enc.encode(`data: ${obj.response}\n\n`));
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
        
        // Log successful completion
        const latency = Date.now() - startTime;
        await analytics.logEvent('CHAT_STREAM_COMPLETE', {
          sessionId,
          totalTokens,
          actualCost: costCheck.cost,
          latency,
          degraded: costCheck.degraded,
          model: costCheck.degraded ? 'llama3.2:1b' : 'llama3.2'
        });
        
      } catch (e) {
        // Fallback to demo with typing effect
        await analytics.logEvent('CHAT_FALLBACK', {
          error: e?.message || 'Unknown error',
          sessionId,
          messageLength: message.length
        });
        
        const response = getDemoResponse(message);
        for (const ch of response) {
          controller.enqueue(enc.encode(`data: ${ch}\n\n`));
          await new Promise(r => setTimeout(r, costCheck?.degraded ? 50 : 20)); // Slower typing in degraded mode
        }
        
        // Add sovereignty footer
        const footer = "\n\n🎰 Vegas Sovereign AI - Hurricane v4.1 Protected 🎰";
        for (const ch of footer) {
          controller.enqueue(enc.encode(`data: ${ch}\n\n`));
          await new Promise(r => setTimeout(r, 10));
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
      'Connection': 'keep-alive',
      'X-Hurricane-Version': '4.1',
      'X-Cost-Guard': costGuard.getDegradedMode() ? 'DEGRADED' : 'ACTIVE'
    }
  });
}

// GET endpoint for cost guard status
export async function GET() {
  const stats = costGuard.getStats();
  
  return new Response(JSON.stringify({
    success: true,
    data: {
      hurricane: {
        version: '4.1',
        costGuard: stats,
        degradedMode: costGuard.getDegradedMode(),
        optimizationSuggestions: costGuard.getOptimizationSuggestions()
      }
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Hurricane-Version': '4.1'
    }
  });
}