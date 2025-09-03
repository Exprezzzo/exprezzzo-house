const API_BASE = process.env.API_URL || 'http://localhost:3001'

export const api = {
  async chat({ message, room, model, sessionId }: {
    message: string
    room: string
    model: string
    sessionId: string
  }) {
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          room,
          model,
          sessionId
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Sorry, I encountered an error processing your request.',
        cost: '0.000',
        tokens: 0
      }
    }
  },

  async embed(text: string) {
    try {
      const response = await fetch(`${API_BASE}/api/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      return await response.json()
    } catch (error) {
      console.error('Embed API Error:', error)
      return { error: 'Failed to generate embedding' }
    }
  },

  async search({ query, limit = 10 }: { query: string, limit?: number }) {
    try {
      const response = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit }),
      })

      return await response.json()
    } catch (error) {
      console.error('Search API Error:', error)
      return { error: 'Search failed', results: [] }
    }
  },

  async health() {
    try {
      const response = await fetch(`${API_BASE}/health`)
      return await response.json()
    } catch (error) {
      console.error('Health API Error:', error)
      return { 
        status: 'error',
        services: { ollama: 'disconnected', postgres: 'disconnected', redis: 'disconnected' }
      }
    }
  },

  async sovereignty() {
    // Mock sovereignty data for now
    return {
      vendors: [
        { vendor_name: 'Ollama', sovereignty_score: 1.0, lock_in_risk: 'none', escape_difficulty: 'easy' },
        { vendor_name: 'PostgreSQL', sovereignty_score: 1.0, lock_in_risk: 'none', escape_difficulty: 'easy' },
        { vendor_name: 'Redis', sovereignty_score: 1.0, lock_in_risk: 'none', escape_difficulty: 'easy' },
        { vendor_name: 'OpenAI', sovereignty_score: 0.2, lock_in_risk: 'high', escape_difficulty: 'hard' }
      ]
    }
  },

  async providers() {
    // Mock providers data for now
    return {
      providers: [
        { type: 'sovereign', name: 'Ollama', enabled: true, sovereignty_score: 1.0 },
        { type: 'fallback', name: 'OpenAI', enabled: false, sovereignty_score: 0.2 }
      ]
    }
  }
}