# 🎰 EXPREZZZO House - Vercel Deployment Guide

## Pre-Deployment Checklist

### ✅ Files Ready
- [x] `vercel.json` - Production configuration
- [x] `.vercelignore` - Deployment optimization  
- [x] All rooms built and verified
- [x] SSE endpoints functional
- [x] Sovereignty headers configured

### ✅ Environment Variables (Set in Vercel Dashboard)
```bash
SOVEREIGNTY_ENFORCED=true
TARGET_COST=0.001
NEXT_PUBLIC_SOVEREIGNTY=ENFORCED
NEXT_PUBLIC_COST=0.001

# Optional (for external services)
OLLAMA_URL=your-ollama-endpoint
REDIS_URL=your-redis-endpoint  
POSTGRES_URL=your-postgres-endpoint
```

## Deployment Commands

### Option 1: Production Deploy
```bash
cd ~/exprezzzo-house
vercel --prod
```

### Option 2: Preview Deploy
```bash
vercel
```

### Option 3: Full Verification + Deploy
```bash
./quick-deploy.sh
vercel --prod
```

## Post-Deployment Verification

1. **Sovereignty Check**:
   ```bash
   curl -I https://exprezzzo-house.vercel.app
   # Should see: X-Sovereignty: ENFORCED
   ```

2. **API Status**:
   ```bash
   curl https://exprezzzo-house.vercel.app/api/status
   # Should return: {"sovereignty": "SOVEREIGN"}
   ```

3. **Room Navigation**:
   - Visit: https://exprezzzo-house.vercel.app/rooms/master
   - Check: All 7 rooms accessible

4. **SSE Streaming**:
   - Visit: https://exprezzzo-house.vercel.app/rooms/chat/sse-page
   - Test: Real-time chat functionality

## Troubleshooting

### Build Issues
- Check `apps/web/package.json` dependencies
- Verify Next.js 14.2.0 compatibility
- Review build logs in Vercel dashboard

### Function Timeout
- API routes default to 10s on Hobby plan
- Upgrade to Pro for 60s timeout
- Optimize SSE streaming for quick responses

### Environment Variables
- Set in Vercel Project Settings
- Use `@` prefix for secrets
- Restart deployment after changes

## Success Indicators

✅ Build completes without errors
✅ All pages load correctly
✅ Sovereignty headers present
✅ API endpoints respond
✅ SSE streaming functional
✅ Vegas gold theme applied
✅ $0.001 cost tracking active

---

🌹 **The Rose Blooms on Vercel!** 🌹
