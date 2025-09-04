#!/bin/bash
echo "🏠 EXPREZZZO House - Production Build"

# Build Next.js app
cd apps/web
npm run build

# Test build
npm run start &
sleep 5
curl -s http://localhost:3000/api/status | grep -q "ENFORCED" && echo "✅ Build verified" || echo "❌ Build failed"
pkill -f "next start"

# Create deployment package
cd ../..
tar -czf exprezzzo-house-deploy.tar.gz \
  apps/web/.next \
  apps/web/public \
  apps/web/package.json \
  server.js \
  orchestrator.js \
  package.json \
  .env.local

echo "✅ Ready for deployment: exprezzzo-house-deploy.tar.gz"