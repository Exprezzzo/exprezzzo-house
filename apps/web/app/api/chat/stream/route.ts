import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Mock Ollama integration - replace with actual Ollama client
const mockOllamaResponse = async (message: string, model: string) => {
  // Simulate different response styles based on model
  const responses: { [key: string]: string[] } = {
    'llama3.2': [
      "I understand your request. Let me help you with that using my sovereign capabilities.",
      "As an AI running locally at $0.001 per request, I aim to provide cost-effective assistance.",
      "Vegas-style efficiency meets sovereign computing - that's how I roll!"
    ],
    'mistral': [
      "Bonjour! I'm Mistral running in your sovereign house.",
      "Efficient, local, and cost-effective - just $0.001 per interaction.",
      "Your data stays in Vegas, processed with European precision."
    ],
    'codellama:7b': [
      "```python\n# Here's a code solution for you\ndef sovereign_response():\n    return 'Local AI at $0.001/request'\n```",
      "Let me code that up for you using local processing power.",
      "Sovereign code generation - keeping your logic in-house."
    ]
  }

  const modelResponses = responses[model] || responses['llama3.2']
  const baseResponse = modelResponses[Math.floor(Math.random() * modelResponses.length)]
  
  // Add some Vegas flair
  const vegasEnding = [
    "\n\n🎰 Processed locally, Vegas-style! 🎰",
    "\n\n🎲 What happens in your house, stays in your house! 🎲",
    "\n\n🎪 Sovereign AI - the house always wins at $0.001! 🎪"
  ]
  
  return baseResponse + vegasEnding[Math.floor(Math.random() * vegasEnding.length)]
}

export async function POST(request: NextRequest) {
  try {
    const { message, model = 'llama3.2', degrade = true } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get mock response (in production, this would be actual Ollama)
          const fullResponse = await mockOllamaResponse(message, model)
          
          // Stream the response word by word
          const words = fullResponse.split(' ')
          
          for (let i = 0; i < words.length; i++) {
            const chunk = i === 0 ? words[i] : ' ' + words[i]
            
            const sseData = `data: ${JSON.stringify({
              content: chunk,
              model,
              cost: 0.001,
              timestamp: new Date().toISOString()
            })}\n\n`
            
            controller.enqueue(new TextEncoder().encode(sseData))
            
            // Add delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
          }
          
          // Send completion signal
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            content: '',
            done: true,
            model,
            total_cost: 0.001,
            timestamp: new Date().toISOString()
          })}\n\n`))
          
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            error: 'Stream processing error',
            timestamp: new Date().toISOString()
          })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}