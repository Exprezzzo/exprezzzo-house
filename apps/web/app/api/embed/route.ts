import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { text, model = 'nomic-embed-text' } = await request.json();
  
  try {
    // First try with a lighter embedding model
    const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: 'nomic-embed-text', // Use a specific embedding model
        prompt: text,
        options: { temperature: 0.1 }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        embedding: data.embedding,
        dimensions: data.embedding?.length || 768,
        model: 'nomic-embed-text',
        cost: 0.00001,  // Local inference cost
        degraded: false
      });
    }
  } catch (error) {
    console.error('Ollama embedding error:', error);
  }
  
  // Fallback: Generate a mock embedding for development/testing
  // This simulates a 768-dimension embedding based on text hash
  const mockEmbedding = new Array(768).fill(0).map((_, i) => {
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, i);
    return Math.sin(hash / 1000) * 0.1 + Math.cos(hash / 500) * 0.1;
  });
  
  return NextResponse.json({
    embedding: mockEmbedding,
    dimensions: 768,
    model: 'sovereign-mock',
    cost: 0.0001,  // Mock embedding cost
    degraded: true,
    note: 'Using mock embedding - install nomic-embed-text model for production'
  });
}