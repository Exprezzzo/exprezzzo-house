#!/bin/bash
echo "🚀 EXPREZZZO Complete Deployment"

# Verify build
./verify-build.sh

# Git operations
git add .
git commit -m "🎰 Deploy: $(date +%Y%m%d-%H%M%S)

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main

# Vercel deployment
vercel --prod

echo "✅ Deployment complete!"
echo "🏠 GitHub: https://github.com/Exprezzzo/exprezzzo-house"
echo "🌐 Live: Check 'vercel ls' for latest URL"
