let pool: any = null;

async function getPool() {
  if (!pool) {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

type RagRow = { id: string; content: string; room: string | null; distance: number };

async function embed(text: string): Promise<number[]> {
  const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_PRIMARY_EMBED_MODEL || 'nomic-embed-text';
  const r = await fetch(`${base}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text })
  });
  const j = await r.json();
  if (!j?.embedding) throw new Error('Embedding failed');
  return j.embedding;
}

export async function ragSearch(query: string, k = 5, room?: string): Promise<RagRow[]> {
  const dbPool = await getPool();
  const vec = await embed(query);
  const v = `[${vec.join(',')}]`;
  const sql = `
    SELECT id, content, room,
           embedding <=> $1::vector as distance
    FROM embeddings
    ${room ? 'WHERE room = $3' : ''}
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `;
  const args = room ? [v, k, room] : [v, k];
  const { rows } = await dbPool.query(sql, args);
  return rows as RagRow[];
}