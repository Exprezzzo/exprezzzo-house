#!/bin/bash

echo "
🎰 EXPREZZZO VERCEL ENVIRONMENT SETUP 🎰
=====================================
"

echo "Setting up production environment variables..."

# Required sovereignty variables
echo "✅ Setting SOVEREIGNTY_ENFORCED..."
echo "true" | vercel env add SOVEREIGNTY_ENFORCED production --force 2>/dev/null || echo "Already set"

echo "✅ Setting TARGET_COST..."
echo "0.001" | vercel env add TARGET_COST production --force 2>/dev/null || echo "Already set"

echo "✅ Setting NEXT_PUBLIC_SOVEREIGNTY..."
echo "ENFORCED" | vercel env add NEXT_PUBLIC_SOVEREIGNTY production --force 2>/dev/null || echo "Already set"

echo "✅ Setting NEXT_PUBLIC_COST..."
echo "0.001" | vercel env add NEXT_PUBLIC_COST production --force 2>/dev/null || echo "Already set"

# Optional service URLs (fallback to mock/local if not provided)
echo "🔧 Optional: Set OLLAMA_URL (press Enter to skip):"
read -r OLLAMA_URL
if [ -n "$OLLAMA_URL" ]; then
    echo "$OLLAMA_URL" | vercel env add OLLAMA_URL production --force
    echo "✅ OLLAMA_URL set"
else
    echo "⚠️ OLLAMA_URL not set - using fallback mode"
fi

echo "🔧 Optional: Set REDIS_URL (press Enter to skip):"
read -r REDIS_URL
if [ -n "$REDIS_URL" ]; then
    echo "$REDIS_URL" | vercel env add REDIS_URL production --force
    echo "✅ REDIS_URL set"
else
    echo "⚠️ REDIS_URL not set - using in-memory cache"
fi

echo "🔧 Optional: Set POSTGRES_URL (press Enter to skip):"
read -r POSTGRES_URL
if [ -n "$POSTGRES_URL" ]; then
    echo "$POSTGRES_URL" | vercel env add POSTGRES_URL production --force
    echo "✅ POSTGRES_URL set"
else
    echo "⚠️ POSTGRES_URL not set - using mock data"
fi

echo "
╔═══════════════════════════════════════════╗
║    ENVIRONMENT VARIABLES CONFIGURED      ║
║                                           ║
║  Next: vercel --prod                      ║
║                                           ║
║  🌹 Ready for Vegas Production! 🌹        ║
╚═══════════════════════════════════════════╝
"

echo "Run: vercel --prod to deploy with these settings"
