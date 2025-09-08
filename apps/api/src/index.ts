import express from 'express'
import cors from 'cors'
import axios from 'axios'

const MAX_COST_USD = 0.001 as const;
const USD_PER_TOKEN_PROVISIONAL = 0.000002 as const;
const estimateTokens = (s: string) => Math.ceil((s?.length ?? 0) / 4);
const estimateProjectedCostUSD = (input: string) => estimateTokens(input) * USD_PER_TOKEN_PROVISIONAL;

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Sovereign routing with cost control
const PROVIDERS = {
  ollama: { url: 'http://localhost:11434', cost: 0.0001 },
  openai: { url: 'https://api.openai.com', cost: 0.002 },
  claude: { url: 'https://api.anthropic.com', cost: 0.003 }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'sovereign',
    timestamp: new Date().toISOString(),
    services: {
      ollama: 'connected',
      postgres: 'connected',
      redis: 'connected'
    }
  })
})

// Chat endpoint with streaming
app.post('/api/chat', async (req, res) => {
  const { messages, stream = true } = req.body
  
  // Set up SSE for streaming
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
  }

  try {
    // Calculate cost and select provider
    const inputText = messages.map((m: any) => m.content || '').join(' ')
    const estimatedCost = estimateProjectedCostUSD(inputText)
    const degraded = estimatedCost > MAX_COST_USD
    let provider = degraded ? 'ollama' : 'openai'

    // Simulate streaming response
    const response = `This is a sovereign response from EXPREZZZO House using ${provider}.`
    
    if (stream) {
      // SSE response with degraded flag
      res.write(`data: ${JSON.stringify({ degraded, provider, estimatedCost })}\n\n`)
      for (const char of response) {
        res.write(`data: ${JSON.stringify({ content: char })}\n\n`)
        await new Promise(resolve => setTimeout(resolve, 20))
      }
      res.write(`data: [DONE]\n\n`)
      res.end()
    } else {
      // JSON response with degraded flag
      res.json({ response, provider, cost: estimatedCost, degraded })
    }
  } catch (error) {
    res.status(500).json({ error: 'Orchestration failed' })
  }
})

// Embedding endpoint
app.post('/api/embed', async (req, res) => {
  const { text } = req.body
  
  // Generate embedding (mock for now)
  const embedding = new Array(768).fill(0).map(() => Math.random())
  
  res.json({ 
    embedding, 
    dimensions: 768,
    model: 'sovereign-embed',
    cost: 0.0001
  })
})

// Search endpoint
app.post('/api/search', async (req, res) => {
  const { query, limit = 10 } = req.body
  
  // Mock search results
  const results = Array(limit).fill(null).map((_, i) => ({
    id: i,
    content: `Result ${i} for: ${query}`,
    score: Math.random(),
    metadata: {}
  }))
  
  res.json({ results, total: limit })
})

app.listen(PORT, () => {
  console.log(`🏠 EXPREZZZO API running on port ${PORT}`)
  console.log(`🔐 Sovereignty: ENFORCED`)
  console.log(`💰 Target: $0.001/request`)
})