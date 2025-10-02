interface EmbeddingVector {
  id: string
  content: string
  embedding: number[]
  metadata: {
    type: string
    source: string
    timestamp: Date
    tags?: string[]
  }
}

interface SearchResult {
  id: string
  content: string
  similarity: number
  metadata: any
}

class RAGHelper {
  private vectors: EmbeddingVector[] = []
  private readonly embeddingDimension = 1536 // OpenAI ada-002 dimension

  async embedContent(
    content: string, 
    type: string, 
    source: string,
    tags?: string[]
  ): Promise<string> {
    const id = this.generateId()
    
    // Mock embedding generation - in production would use OpenAI API
    const embedding = this.mockEmbedding(content)
    
    const vector: EmbeddingVector = {
      id,
      content,
      embedding,
      metadata: {
        type,
        source,
        timestamp: new Date(),
        tags
      }
    }

    this.vectors.push(vector)
    
    // In production, would store in pgvector database
    await this.persistVector(vector)
    
    return id
  }

  async semanticSearch(
    query: string, 
    limit: number = 10,
    filterType?: string
  ): Promise<SearchResult[]> {
    const queryEmbedding = this.mockEmbedding(query)
    
    let candidates = this.vectors
    
    // Filter by type if specified
    if (filterType) {
      candidates = candidates.filter(v => v.metadata.type === filterType)
    }
    
    // Calculate similarities
    const results = candidates.map(vector => ({
      id: vector.id,
      content: vector.content,
      similarity: this.cosineSimilarity(queryEmbedding, vector.embedding),
      metadata: vector.metadata
    }))
    
    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .filter(r => r.similarity > 0.7) // Minimum similarity threshold
  }

  async searchBlueprints(query: string): Promise<SearchResult[]> {
    return this.semanticSearch(query, 5, 'blueprint')
  }

  async searchVendors(query: string): Promise<SearchResult[]> {
    return this.semanticSearch(query, 10, 'vendor')
  }

  async searchPatterns(query: string): Promise<SearchResult[]> {
    return this.semanticSearch(query, 8, 'pattern')
  }

  private mockEmbedding(content: string): number[] {
    // Mock embedding - in production would call OpenAI API
    const hash = this.simpleHash(content)
    const embedding = new Array(this.embeddingDimension)
    
    for (let i = 0; i < this.embeddingDimension; i++) {
      embedding[i] = Math.sin(hash + i) * 0.5 + 0.5
    }
    
    return embedding
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  private generateId(): string {
    return `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async persistVector(vector: EmbeddingVector): Promise<void> {
    // In production, would use SQL like:
    // INSERT INTO embeddings (id, content, embedding, metadata) 
    // VALUES ($1, $2, $3, $4)
    // WHERE embedding is stored as vector type in pgvector
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`RAG: Persisted embedding ${vector.id}`)
    }
  }

  // Bulk import utilities for migration
  async bulkEmbedPatterns(patterns: Array<{content: string, source: string, tags?: string[]}>): Promise<string[]> {
    const ids = []
    for (const pattern of patterns) {
      const id = await this.embedContent(
        pattern.content, 
        'pattern', 
        pattern.source, 
        pattern.tags
      )
      ids.push(id)
    }
    return ids
  }

  async bulkEmbedVendors(vendors: Array<{content: string, source: string, tags?: string[]}>): Promise<string[]> {
    const ids = []
    for (const vendor of vendors) {
      const id = await this.embedContent(
        vendor.content, 
        'vendor', 
        vendor.source, 
        vendor.tags
      )
      ids.push(id)
    }
    return ids
  }

  // Stats and management
  getStats() {
    const byType = this.vectors.reduce((acc, v) => {
      acc[v.metadata.type] = (acc[v.metadata.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalVectors: this.vectors.length,
      byType,
      memoryUsage: this.vectors.length * this.embeddingDimension * 4 // bytes
    }
  }
}

// Singleton instance
const ragHelper = new RAGHelper()

export default ragHelper
export type { EmbeddingVector, SearchResult }