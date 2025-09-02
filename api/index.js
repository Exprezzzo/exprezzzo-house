// Vercel-compatible API endpoint for EXPREZZZO Sovereign House
import { z } from 'zod';

const VEGAS_COLORS = {
  gold: process.env.BRAND_GOLD || '#C5B358',
  chocolate: process.env.BRAND_CHOCOLATE || '#381819',
  sand: process.env.BRAND_SAND || '#EDC9AF',
  rose: process.env.BRAND_ROSE || '#C72C41'
};

const SOVEREIGNTY_SCORES = [
  { vendor_name: 'Ollama', sovereignty_score: 1.00, lock_in_risk: 'None', escape_difficulty: 'Trivial' },
  { vendor_name: 'PostgreSQL', sovereignty_score: 1.00, lock_in_risk: 'None', escape_difficulty: 'Easy' },
  { vendor_name: 'Redis', sovereignty_score: 0.95, lock_in_risk: 'Minimal', escape_difficulty: 'Easy' },
  { vendor_name: 'Groq', sovereignty_score: 0.75, lock_in_risk: 'Low', escape_difficulty: 'Easy' },
  { vendor_name: 'Together', sovereignty_score: 0.70, lock_in_risk: 'Low', escape_difficulty: 'Easy' },
  { vendor_name: 'Fireworks', sovereignty_score: 0.68, lock_in_risk: 'Medium', escape_difficulty: 'Medium' },
  { vendor_name: 'OpenAI', sovereignty_score: 0.30, lock_in_risk: 'High', escape_difficulty: 'Hard' },
  { vendor_name: 'Firebase', sovereignty_score: 0.25, lock_in_risk: 'Very High', escape_difficulty: 'Very Hard' }
];

const PROVIDERS = [
  { name: 'Ollama', type: 'sovereign', enabled: true, sovereignty_score: 1.00 },
  { name: 'Groq', type: 'flash', enabled: false, sovereignty_score: 0.75 },
  { name: 'Together', type: 'flash', enabled: false, sovereignty_score: 0.70 },
  { name: 'Fireworks', type: 'flash', enabled: false, sovereignty_score: 0.68 },
  { name: 'OpenAI', type: 'premium', enabled: false, sovereignty_score: 0.30 }
];

const ROOMS = [
  { room_name: 'Master', room_type: 'orchestrator', brand_tokens: { primary: VEGAS_COLORS.gold, secondary: VEGAS_COLORS.chocolate } },
  { room_name: 'Chat', room_type: 'interaction', brand_tokens: { primary: VEGAS_COLORS.gold, secondary: VEGAS_COLORS.chocolate } },
  { room_name: 'Library', room_type: 'knowledge', brand_tokens: { primary: VEGAS_COLORS.sand, secondary: VEGAS_COLORS.chocolate } },
  { room_name: 'Workspace', room_type: 'productivity', brand_tokens: { primary: VEGAS_COLORS.gold, secondary: VEGAS_COLORS.chocolate } },
  { room_name: 'Vault', room_type: 'security', brand_tokens: { primary: VEGAS_COLORS.rose, secondary: VEGAS_COLORS.chocolate } },
  { room_name: 'Network', room_type: 'connections', brand_tokens: { primary: VEGAS_COLORS.gold, secondary: VEGAS_COLORS.chocolate } },
  { room_name: 'Admin', room_type: 'control', brand_tokens: { primary: VEGAS_COLORS.chocolate, secondary: VEGAS_COLORS.gold } }
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  const pathname = new URL(url, `http://${req.headers.host}`).pathname;

  try {
    // Health check endpoint
    if (pathname === '/api/health') {
      return res.json({
        status: 'sovereign',
        house: 'EXPREZZZO',
        deployment: 'vercel',
        services: {
          database: false, // Not available in Vercel
          cache: false,    // Not available in Vercel
          llm: false,      // Not available in Vercel
          models: []
        },
        sovereignty: {
          mode: process.env.SOVEREIGNTY_MODE || 'enforced',
          maxCost: process.env.MAX_COST_PER_REQUEST || '0.001',
          localFirst: 'false', // Vercel is cloud-based
          deployment: 'serverless'
        },
        brand: VEGAS_COLORS,
        note: 'Demo mode - full functionality requires local deployment with Docker'
      });
    }

    // Sovereignty scores endpoint
    if (pathname === '/api/sovereignty') {
      return res.json({
        vendors: SOVEREIGNTY_SCORES,
        recommendation: 'Prioritize vendors with score >= 0.90',
        escapeProtocol: 'Docker compose ready',
        deploymentNote: 'Vercel deployment is for demo purposes - use Docker for full sovereignty'
      });
    }

    // Providers endpoint
    if (pathname === '/api/providers') {
      return res.json({ 
        providers: PROVIDERS,
        note: 'Demo data - connect to real services via environment variables'
      });
    }

    // Rooms endpoint
    if (pathname === '/api/rooms') {
      return res.json({
        rooms: ROOMS,
        brand: VEGAS_COLORS
      });
    }

    // Chat endpoint (demo mode)
    if (pathname === '/api/chat' && method === 'POST') {
      const RequestSchema = z.object({
        message: z.string().min(1).max(10000),
        room: z.string().default('Chat'),
        model: z.enum(['llama3.2', 'mistral', 'codellama:7b']).default('llama3.2'),
        sessionId: z.string().uuid().optional()
      });

      const { message, room, model } = RequestSchema.parse(req.body);
      
      // Demo response
      const demoResponses = [
        "Welcome to the EXPREZZZO Sovereign House! This is a demo deployment on Vercel.",
        "For full functionality with local LLMs, deploy using Docker: `docker-compose up -d`",
        "Sovereignty maintained: This demo preserves the Vegas-first, local-first architecture.",
        "Cost target: $0.001/request maximum - achieved through efficient sovereign infrastructure.",
        "The Rose blooms in the desert. Vegas First. Sovereign Always. 🌹"
      ];

      const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      
      return res.json({
        response: `Demo Mode: ${response}`,
        room: room,
        model: model,
        sovereignty: 'preserved',
        cost: '0.000001',
        tokens: message.length,
        note: 'This is a demo response. Deploy locally for full LLM integration.'
      });
    }

    // Embed endpoint (demo mode)
    if (pathname === '/api/embed' && method === 'POST') {
      const EmbedSchema = z.object({
        content: z.string().min(1).max(50000),
        room: z.string().default('Library')
      });

      const { content, room } = EmbedSchema.parse(req.body);
      
      return res.json({
        id: `demo-${Date.now()}`,
        room: room,
        dimensions: 4096,
        sovereignty: 'preserved',
        note: 'Demo embedding - deploy locally for pgvector integration'
      });
    }

    // Search endpoint (demo mode)
    if (pathname === '/api/search' && method === 'POST') {
      const SearchSchema = z.object({
        query: z.string().min(1).max(1000),
        room: z.string().optional(),
        limit: z.number().min(1).max(50).default(10)
      });

      const { query } = SearchSchema.parse(req.body);
      
      return res.json({
        results: [
          {
            id: `demo-result-${Date.now()}`,
            content: `Demo search result for: "${query}". Deploy locally for full semantic search.`,
            distance: 0.1,
            metadata: { demo: true }
          }
        ],
        count: 1,
        sovereignty: 'preserved'
      });
    }

    // Sessions endpoint (demo mode)
    if (pathname === '/api/sessions') {
      return res.json({ 
        sessions: [
          {
            id: `demo-session-${Date.now()}`,
            total_tokens: 42,
            total_cost: 0.000042,
            updated_at: new Date().toISOString(),
            demo: true
          }
        ]
      });
    }

    // 404 for unknown endpoints
    res.status(404).json({ 
      error: 'Endpoint not found',
      sovereignty: 'preserved',
      available: ['/health', '/sovereignty', '/providers', '/rooms', '/chat', '/embed', '/search', '/sessions']
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      sovereignty: 'preserved',
      message: error.message 
    });
  }
}