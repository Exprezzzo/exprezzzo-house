#!/bin/bash
echo "🏠 Deploying EXPREZZZO Sovereign House..."

# Install dependencies
npm install

# Build all packages (web only for now)
cd apps/web
npm install
npm run build
cd ../..

# Deploy to Vercel
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Visit: https://exprezzzo-house.vercel.app"