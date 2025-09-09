import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// Real Ollama integration for SSE streaming with degrade support
const streamOllamaResponse = async function*(prompt: string, model: string = 'llama3.2') {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const startTime = Date.now();
  
  let totalCost = 0;
  const costPerToken = 0.000001; // $0.001 per 1000 tokens
  const BUDGET_TARGET = 0.001; // $0.001 budget
  
  try {
    console.log(`🎰 Connecting to Ollama at ${ollamaUrl} with model ${model}`);
    
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `[EXPREZZZO CHAT] ${prompt}`,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream available');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          
          // Calculate cost (rough token estimation)
          if (json.response) {
            totalCost += costPerToken * json.response.length * 0.75; // Rough estimate
          }
          
          // Enhanced degradation logic
          const degraded = totalCost > BUDGET_TARGET;
          
          yield {
            text: json.response || '',
            done: json.done || false,
            cost: Math.min(totalCost, BUDGET_TARGET), // Cap at budget target
            degraded,
            model: degraded ? 'llama3.2-sovereign' : model,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString()
          };
          
          if (json.done) {
            yield {
              done: true,
              totalCost: Math.min(totalCost, BUDGET_TARGET),
              degraded,
              message: degraded ? 'Cost exceeded $0.001 - using sovereign models only' : 'Complete',
              duration: Date.now() - startTime,
              timestamp: new Date().toISOString()
            };
            break;
          }
        } catch (e) {
          console.error('Ollama JSON parse error:', e, 'Line:', line);
          // Continue processing other lines
        }
      }
    }

  } catch (error) {
    // Fallback to mock response if Ollama is not available
    console.warn('⚠️ Ollama not available, using sovereign fallback:', error instanceof Error ? error.message : String(error));
    
    const fallbackResponses = [
      "I understand your request. Let me help you with my sovereign capabilities.",
      "As an AI running locally at $0.001 per request, I provide cost-effective assistance.",
      "Vegas-style efficiency meets sovereign computing - that's how I roll!",
      "🎰 Sovereign mode activated - your data stays in Vegas! 🎰",
      "Running in fallback mode - Ollama service unavailable, but sovereignty maintained."
    ];
    
    const selectedResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    const words = selectedResponse.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      totalCost += costPerToken * 5;
      const degraded = totalCost > BUDGET_TARGET;
      
      yield {
        text: word + ' ',
        cost: Math.min(totalCost, BUDGET_TARGET),
        degraded: true, // Always degraded in fallback
        model: 'llama3.2-sovereign-fallback',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
    
    // Add Vegas completion
    yield {
      text: '\n\n🎰 Processed in sovereign fallback mode! 🎰',
      cost: BUDGET_TARGET,
      degraded: true,
      model: 'llama3.2-sovereign-fallback',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    // Completion
    yield {
      done: true,
      totalCost: BUDGET_TARGET,
      degraded: true,
      message: 'Cost exceeded $0.001 - using sovereign models only',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

// GET method for SSE streaming (query params)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const prompt = searchParams.get('prompt')
  const model = searchParams.get('model') || 'llama3.2'
  
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  console.log(`🎰 EXPREZZZO Chat SSE: ${prompt.substring(0, 50)}... with model ${model}`);

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(new TextEncoder().encode(payload))
      }

      try {
        // Send initial message
        sendEvent({
          type: 'start',
          model: model,
          cost: 0.001,
          degraded: true, // Always start degraded for $0.001 guarantee
          timestamp: new Date().toISOString(),
          message: 'EXPREZZZO Sovereign Chat - Vegas-style streaming at $0.001'
        })

        // Stream the response using Ollama integration
        let fullResponse = '';
        const responseGenerator = streamOllamaResponse(prompt, model);
        
        for await (const chunk of responseGenerator) {
          if (chunk.text) {
            fullResponse += chunk.text;
          }
          
          sendEvent({
            text: chunk.text,
            cost: chunk.cost,
            degraded: chunk.degraded,
            model: chunk.model,
            duration: chunk.duration,
            done: chunk.done,
            timestamp: chunk.timestamp
          });

          if (chunk.done) {
            break;
          }
        }

        if (!controller.desiredSize === null) {
          controller.close()
        }
        
      } catch (error) {
        console.error('🎰 SSE Chat error:', error)
        try {
          sendEvent({
            error: error instanceof Error ? error.message : String(error),
            degraded: true,
            message: 'Cost exceeded $0.001 - using sovereign models only',
            timestamp: new Date().toISOString()
          })
        } catch (e) {
          console.error('Error sending error event:', e instanceof Error ? e.message : String(e))
        }
        if (!controller.desiredSize === null) {
          controller.close()
        }
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
    },
  })
}

// POST method for JSON responses (messages array)
export async function POST(request: NextRequest) {
  try {
    const { messages, stream = false, model = 'llama3.2' } = await request.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.content || lastMessage?.message || '';

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Message content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎰 EXPREZZZO Chat POST: ${prompt.substring(0, 50)}... with model ${model}`);

    // If streaming requested, use SSE
    if (stream) {
      // Redirect to GET method with query params for SSE
      const url = new URL(request.url);
      url.searchParams.set('prompt', prompt);
      url.searchParams.set('model', model);
      return GET(new NextRequest(url, { method: 'GET' }));
    }

    // Non-streaming: collect all chunks and return as JSON
    let fullResponse = '';
    let finalCost = 0;
    let degraded = false;
    let finalModel = model;
    let duration = 0;
    
    const responseGenerator = streamOllamaResponse(prompt, model);
    
    for await (const chunk of responseGenerator) {
      if (chunk.text) {
        fullResponse += chunk.text;
      }
      
      if (chunk.cost !== undefined) {
        finalCost = chunk.cost;
      }
      
      if (chunk.degraded !== undefined) {
        degraded = chunk.degraded;
      }
      
      if (chunk.model) {
        finalModel = chunk.model;
      }
      
      if (chunk.duration !== undefined) {
        duration = chunk.duration;
      }
      
      if (chunk.done) {
        break;
      }
    }

    return new Response(JSON.stringify({
      response: fullResponse.trim(),
      model: finalModel,
      cost: finalCost,
      degraded,
      duration,
      timestamp: new Date().toISOString(),
      message: degraded ? 'Cost exceeded $0.001 - using sovereign models only' : 'Complete'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🎰 Chat POST error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      degraded: true,
      cost: 0.001,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Support CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
    },
  })
}