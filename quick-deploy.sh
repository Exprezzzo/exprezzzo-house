#!/bin/bash

echo "
🎰 EXPREZZZO QUICK DEPLOY SEQUENCE 🎰
====================================
"

# 1. Make scripts executable
echo "1️⃣  Making scripts executable..."
chmod +x build-production.sh verify-build.sh deploy-production.sh switch-nav.sh

# 2. Run the build
echo "2️⃣  Running production build..."
./build-production.sh

# 3. Verify everything
echo "3️⃣  Verifying build..."
./verify-build.sh

# 4. Start the server (in background for verification)
echo "4️⃣  Starting development server for final check..."
cd apps/web
npm run dev &
SERVER_PID=$!
sleep 10

# Quick health check
echo "🔍 Final health check..."
curl -s http://localhost:3000/api/status | jq '.sovereignty' || echo "Server check failed"

# Stop dev server
kill $SERVER_PID 2>/dev/null

# 5. Deploy to Vercel
echo "5️⃣  Deploying to Vercel..."
echo "Run: vercel --prod"
echo ""
echo "🌹 EXPREZZZO Deployment Sequence Complete! 🌹"
echo "Next step: Run 'vercel --prod' to deploy to production"