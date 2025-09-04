#!/bin/bash

echo "
🎰 EXPREZZZO VERCEL DEPLOYMENT READINESS CHECK 🎰
===============================================
"

# Check vercel.json exists
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json configuration ready"
else
    echo "❌ vercel.json missing"
    exit 1
fi

# Check .vercelignore exists  
if [ -f ".vercelignore" ]; then
    echo "✅ .vercelignore optimization ready"
else
    echo "❌ .vercelignore missing"
fi

# Check Next.js config
if [ -f "apps/web/next.config.js" ]; then
    echo "✅ Next.js configuration ready"
else
    echo "❌ next.config.js missing"
    exit 1
fi

# Check build works
echo "🏗️  Testing production build..."
cd apps/web
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Production build successful"
else
    echo "❌ Production build failed"
    exit 1
fi

# Check sovereignty headers
echo "🛡️  Testing sovereignty configuration..."
if grep -q "X-Sovereignty" next.config.js; then
    echo "✅ Sovereignty headers configured"
else
    echo "❌ Sovereignty headers missing"
fi

cd ..

echo "
╔═══════════════════════════════════════════╗
║    EXPREZZZO READY FOR VERCEL DEPLOY     ║
║                                           ║
║  Next step: vercel --prod                 ║
║                                           ║
║  🌹 Vegas First, Sovereignty Always 🌹   ║
╚═══════════════════════════════════════════╝
"
