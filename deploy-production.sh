#!/bin/bash
# EXPREZZZO v4.1 Production Deployment

echo "🏠 EXPREZZZO SOVEREIGN HOUSE - PRODUCTION DEPLOY"
echo "================================================"

# Run sovereignty check
echo "🛡️ Running sovereignty check..."
node scripts/sovereignty-check.js || exit 1

# Build
echo "🏗️ Building for production..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

echo ""
echo "✅ THE HOUSE IS LIVE AND SOVEREIGN!"
echo "🌹 Vegas First, Sovereignty Always"
echo "💎 EXPREZZZO = 3 Z's, Forward-Only Forever"
