#!/bin/bash
# 🏠 EXPREZZZO SOVEREIGN HOUSE - OVERNIGHT MODE SHUTDOWN
# Kills all local services while keeping Vercel deployment live for mobile

echo "🌙 EXPREZZZO OVERNIGHT MODE - LOCAL SHUTDOWN"
echo "============================================="
echo "Shutting down local services..."
echo "Vercel deployment will remain live for mobile access"
echo ""

# ========================================
# STEP 1: VERIFY VERCEL SYNC
# ========================================
echo "📱 Checking Vercel deployment status..."

# Get latest git commit
LATEST_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
LATEST_MESSAGE=$(git log -1 --pretty=%B 2>/dev/null || echo "No commit message")

echo "Latest local commit: $LATEST_COMMIT"
echo "Message: $LATEST_MESSAGE"

# Check if there are uncommitted changes
if [[ -n $(git status -s 2>/dev/null) ]]; then
    echo "⚠️ WARNING: You have uncommitted changes!"
    echo "Run these commands first:"
    echo "  git add ."
    echo "  git commit -m '[EP-HOUSE] Overnight sync'"
    echo "  git push origin main"
    echo "  vercel --prod"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ========================================
# STEP 2: OPTIONAL VERCEL SYNC
# ========================================
if [ "$1" == "--sync" ]; then
    echo "🚀 Syncing to Vercel before shutdown..."
    git add . 2>/dev/null
    git commit -m "[EP-HOUSE] Overnight sync - mobile ready" 2>/dev/null
    git push origin main 2>/dev/null
    vercel --prod --yes
    echo "✅ Vercel deployment updated!"
    sleep 3
fi

# ========================================
# STEP 3: KILL LOCAL DEVELOPMENT SERVERS
# ========================================
echo ""
echo "🔴 Stopping local development servers..."

# Kill Next.js
pkill -f "next dev" 2>/dev/null && echo "  ✓ Next.js dev server stopped" || echo "  - Next.js not running"

# Kill Node/Express servers
pkill -f "node server" 2>/dev/null && echo "  ✓ Express server stopped" || echo "  - Express not running"
pkill -f "nodemon" 2>/dev/null && echo "  ✓ Nodemon stopped" || echo "  - Nodemon not running"

# Force kill ports
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "  ✓ Port 3000 cleared" || echo "  - Port 3000 already free"
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "  ✓ Port 3001 cleared" || echo "  - Port 3001 already free"

# ========================================
# STEP 4: STOP NATIVE SERVICES
# ========================================
echo ""
echo "🔧 Stopping native services..."

# Stop Ollama
sudo systemctl stop ollama 2>/dev/null && echo "  ✓ Ollama stopped" || echo "  - Ollama not running"
pkill -f ollama 2>/dev/null

# Stop PostgreSQL
sudo service postgresql stop 2>/dev/null && echo "  ✓ PostgreSQL stopped" || echo "  - PostgreSQL not running"

# Stop Redis
sudo service redis-server stop 2>/dev/null && echo "  ✓ Redis stopped" || echo "  - Redis not running"

# ========================================
# STEP 5: STOP DOCKER
# ========================================
echo ""
echo "🐳 Stopping Docker containers..."
docker compose down 2>/dev/null && echo "  ✓ Docker compose stopped" || echo "  - Docker not running"
docker stop $(docker ps -q) 2>/dev/null && echo "  ✓ All containers stopped" || echo "  - No containers running"

# ========================================
# STEP 6: FINAL CLEANUP
# ========================================
echo ""
echo "🧹 Final cleanup..."

# Kill any remaining Node processes
killall node 2>/dev/null || echo "  - No remaining Node processes"

# Clear any PM2 processes
pm2 stop all 2>/dev/null || echo "  - PM2 not in use"
pm2 delete all 2>/dev/null

# ========================================
# STEP 7: VERIFY SHUTDOWN
# ========================================
echo ""
echo "🔍 Verifying local shutdown..."
echo "================================"

# Check ports
PORTS_IN_USE=0
for PORT in 3000 3001 5432 6379 11434; do
    if lsof -i:$PORT >/dev/null 2>&1; then
        echo "  ⚠️ Port $PORT still in use!"
        PORTS_IN_USE=$((PORTS_IN_USE + 1))
    else
        echo "  ✓ Port $PORT is free"
    fi
done

# Check processes
NODE_COUNT=$(pgrep -c node 2>/dev/null || echo 0)
DOCKER_COUNT=$(docker ps -q 2>/dev/null | wc -l)

echo ""
echo "  Node processes remaining: $NODE_COUNT"
echo "  Docker containers running: $DOCKER_COUNT"

# ========================================
# STEP 8: MOBILE ACCESS INFO
# ========================================
echo ""
echo "================================================="
echo "🌙 OVERNIGHT MODE ACTIVATED"
echo "================================================="
echo ""
echo "✅ LOCAL SERVICES: STOPPED"
echo "✅ LAPTOP: READY FOR SHUTDOWN"
echo "✅ VERCEL: LIVE & ACCESSIBLE"
echo ""
echo "📱 MOBILE ACCESS URLs:"
echo ""
echo "  Production: https://web-1vdt1fbla-jays-projects-173147a5.vercel.app"
echo "  Backup: https://web-o1u40i2ju-jays-projects-173147a5.vercel.app"
echo ""
echo "🏠 AVAILABLE ON MOBILE:"
echo "  ✓ Master Dashboard"
echo "  ✓ Chat Room (demo responses)"
echo "  ✓ Library"
echo "  ✓ Workspace"
echo "  ✓ Vault"
echo "  ✓ Network"
echo "  ✓ Admin"
echo ""
echo "💤 Your laptop can now rest. The House remains sovereign on mobile."
echo ""
echo "To restart tomorrow:"
echo "  npm run dev"
echo "  sudo systemctl start ollama"
echo "  sudo service postgresql start"
echo "  sudo service redis-server start"
echo ""
echo "EXPREZZZO = 3 Z's, Always. Sleep well! 🌹"
echo "================================================="

# Exit with appropriate code
if [ $PORTS_IN_USE -eq 0 ] && [ $NODE_COUNT -eq 0 ] && [ $DOCKER_COUNT -eq 0 ]; then
    exit 0
else
    echo ""
    echo "⚠️ Some services may still be running. Force kill with:"
    echo "  sudo killall -9 node postgres redis ollama"
    exit 1
fi