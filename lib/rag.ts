import { Pool } from 'pg';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Retry wrapper for resilience
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

async function embed(text: string): Promise<number[]> {
  const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  
  return retryOperation(async () => {
    const response = await fetch(`${base}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: text }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });
    
    if (!response.ok) {
      throw new Error(`Embedding failed: ${response.status} ${response.statusText}`);
    }
    
    const json = await response.json();
    if (!json?.embedding) {
      throw new Error('Invalid embedding response');
    }
    
    return json.embedding;
  });
}

export async function ragSearch(
  query: string, 
  k = 5, 
  room?: string,
  threshold = 0.7
): Promise<Array<{id: string, content: string, room: string | null, distance: number}>> {
  const vec = await embed(query);
  const vectorString = `[${vec.join(',')}]`;
  
  const sql = `
    SELECT 
      id, 
      content, 
      room,
      embedding <=> $1::vector as distance
    FROM embeddings
    WHERE 
      embedding <=> $1::vector < $4
      ${room ? 'AND room = $3' : ''}
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `;
  
  const params = room ? [vectorString, k, room, threshold] : [vectorString, k, null, threshold];
  
  return retryOperation(async () => {
    const { rows } = await pool.query(sql, params);
    return rows;
  });
}

// Health check
export async function checkRAGHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${base}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}
