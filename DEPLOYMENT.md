# EXPREZZZO Sovereign House - Deployment Guide

🎰 **Vegas-First, Sovereign-Always, $0.001/Request** 🎰

## Production Deployment Options

### Option 1: Docker Compose (Recommended)
Complete EXPREZZZO stack with all dependencies:

```bash
# Build and run everything
docker compose up --build -d

# View logs
docker compose logs -f exprezzzo-house

# Scale services
docker compose up --scale exprezzzo-house=3
```

**Services:**
- `exprezzzo-house:3000` - Main Next.js application
- `exprezzzo-postgres:5432` - PostgreSQL 16 with sovereignty schema
- `exprezzzo-redis:6379` - Redis cache with persistence  
- `exprezzzo-ollama:11434` - Local LLM service
- `exprezzzo-caddy:80/443` - Reverse proxy with HTTPS

### Option 2: Production Build Script
Manual build and packaging:

```bash
# Build production bundle
./build-production.sh

# Deploy the created tarball
tar -xzf exprezzzo-house-deploy.tar.gz
node server.js
```

### Option 3: Container Only
Just the EXPREZZZO application:

```bash
# Build container
docker build -t exprezzzo-house .

# Run with environment
docker run -p 3000:3000 \
  -e SOVEREIGNTY_ENFORCED=true \
  -e TARGET_COST=0.001 \
  exprezzzo-house
```

## Environment Variables

### Production Settings
```env
NODE_ENV=production
SOVEREIGNTY_ENFORCED=true
TARGET_COST=0.001
```

### Database Configuration
```env
POSTGRES_URL=postgres://sovereign:vegas@postgres:5432/exprezzzo
REDIS_URL=redis://redis:6379
OLLAMA_URL=http://ollama:11434
```

### Custom Domain
```env
DOMAIN=exprezzzo.house
```

## Security Features

### HTTPS & Headers
- ✅ Automatic HTTPS via Caddy
- ✅ Security headers (XSS, CSRF, etc.)
- ✅ Sovereignty headers (`X-Sovereignty: ENFORCED`)
- ✅ Cost transparency (`X-Cost-Per-Request: $0.001`)

### Container Security
- ✅ Non-root user (nextjs:nodejs)
- ✅ Alpine Linux base (minimal attack surface)
- ✅ Network isolation
- ✅ Volume persistence

## Monitoring & Health Checks

### API Endpoints
- `GET /api/status` - Sovereignty status and health
- `GET /api/chat/sse` - SSE streaming endpoint
- `GET /health` - Container health check

### Database Schema
- **users** - Sovereignty scores, degradation tracking
- **requests** - Full audit trail with costs
- **rooms** - 7-room architecture
- **metrics** - System sovereignty metrics

## Scaling & Performance

### Horizontal Scaling
```bash
# Scale application containers
docker compose up --scale exprezzzo-house=5

# Load balance with Caddy
# (Caddy automatically discovers multiple containers)
```

### Resource Limits
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

## Troubleshooting

### Container Issues
```bash
# Check container status
docker compose ps

# View all logs
docker compose logs

# Restart specific service
docker compose restart exprezzzo-house

# Clean rebuild
docker compose down -v
docker compose up --build
```

### Sovereignty Verification
```bash
# Check sovereignty status
curl -s http://localhost:3000/api/status | jq .sovereignty

# Test SSE streaming  
curl -s "http://localhost:3000/api/chat/sse?prompt=Test"

# Verify cost tracking
curl -I http://localhost:3000 | grep X-Cost
```

---

## Vegas First™ Deployment Checklist

- [ ] All containers healthy (`docker compose ps`)
- [ ] Database schema initialized (`/api/status`)
- [ ] Ollama models loaded (`docker logs exprezzzo-ollama`)
- [ ] SSE streaming functional (`/api/chat/sse`)
- [ ] Sovereignty enforced (`X-Sovereignty: ENFORCED`)
- [ ] Cost tracking active (`$0.001/request`)
- [ ] HTTPS configured (`https://exprezzzo.house`)

🌹 **The Rose Blooms in Production!** 🌹