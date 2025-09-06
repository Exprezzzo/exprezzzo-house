// Fix: Add degraded flag for cost overruns
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt') || 'Hello';
  
  // Estimate cost
  const estimatedCost = (prompt.length / 4) * 0.0001;
  const degraded = estimatedCost > 0.001;
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial response chunks
      controller.enqueue(encoder.encode(`data: {"response":"Welcome to EXPREZZZO House"}\n\n`));
      
      // Signal degraded if over cost limit
      if (degraded) {
        controller.enqueue(encoder.encode(`data: {"degraded":true,"reason":"Cost limit exceeded"}\n\n`));
      }
      
      // Send completion marker
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}