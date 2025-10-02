/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,  // ← ADD THIS LINE
  
  env: {
    SOVEREIGNTY_ENFORCED: process.env.SOVEREIGNTY_ENFORCED || 'true',
    TARGET_COST: process.env.TARGET_COST || '0.001',
    OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  },
  
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Powered-By',
            value: 'EXPREZZZO-Sovereign-House',
          },
          {
            key: 'X-Sovereignty',
            value: 'ENFORCED',
          },
          {
            key: 'X-Vegas',
            value: 'GOLD',
          },
          {
            key: 'X-Cost-Per-Request',
            value: '$0.001',
          },
        ],
      },
    ]
  },
  
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
