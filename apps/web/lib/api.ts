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
  }
}