# 🏠 EXPREZZZO Sovereign LLM House

[![Sovereignty Check](https://github.com/Exprezzzo/exprezzzo-house/workflows/Sovereignty%20Check/badge.svg)](https://github.com/Exprezzzo/exprezzzo-house/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)](https://nextjs.org/)

> **Vegas-first, sovereign-always, $0.001/request immutable**  
> **Hurricane Spec v4.0 Implementation**

## Architecture Overview

The EXPREZZZO Sovereign LLM House is a complete autonomous system designed with sovereignty principles:

- **Local-First**: Ollama-powered, zero vendor lock-in
- **Vegas Branding**: Consistent gold/chocolate palette
- **Cost-Controlled**: $0.001 maximum per request
- **Escape-Ready**: Docker Compose deployment
- **Hurricane Spec**: Forward-only, autonomous build

## Quick Start

```bash
# Clone and enter directory
cd exprezzzo-house

# Install dependencies
npm install --legacy-peer-deps

# Start services (requires PostgreSQL, Redis, Ollama)
npm run dev

# Run sovereignty checks
npm run sovereignty-check

# Deploy escape protocol
docker-compose up -d
```

## Room Structure

- **Master**: Orchestration center with sovereignty dashboard
- **Chat**: LLM interactions with cost tracking
- **Library**: Vector embeddings and knowledge base
- **Workspace**: Development tools (coming soon)
- **Vault**: Security and secrets (coming soon)
- **Network**: Connections and APIs (coming soon)
- **Admin**: System administration (coming soon)

## Sovereignty Scores

| Vendor | Score | Risk | Difficulty |
|--------|-------|------|------------|
| Ollama | 100% | None | Trivial |
| PostgreSQL | 100% | None | Easy |
| Redis | 95% | Minimal | Easy |
| Groq | 75% | Low | Easy |
| OpenAI | 30% | High | Hard |

## Cost Enforcement

- **Target**: $0.001 per request maximum
- **Pre-pricing**: Token estimation before generation
- **Circuit breaker**: Automatic fallback to sovereign-only
- **Cost tracking**: Per-session and aggregate monitoring

## Escape Protocol

Three-tier escape strategy:

1. **Docker Compose**: Full stack containerized
2. **Local binaries**: Ollama + PostgreSQL + Redis
3. **Source available**: Complete codebase included

## Vegas Palette

- **Vegas Gold**: #C5B358 (primary)
- **Chocolate**: #381819 (background)
- **Desert Sand**: #EDC9AF (accents)
- **Rose Red**: #C72C41 (alerts)
- **Dust**: #A89F91 (muted)
- **Light Sand**: #F5F5DC (text)

## Environment Variables

```env
DATABASE_URL=postgresql://exprezzzo:sovereign@localhost:5432/exprezzzo_house
REDIS_URL=redis://localhost:6379
OLLAMA_BASE_URL=http://localhost:11434
MAX_COST_PER_REQUEST=0.001
SOVEREIGNTY_MODE=enforced
```

## Hurricane Spec Compliance

- ✅ Autonomous build (one-shot execution)
- ✅ Forward-only deployment
- ✅ Sovereignty enforcement
- ✅ Vegas branding consistency
- ✅ Cost controls active
- ✅ Escape protocols ready

## Development

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start

# Sovereignty verification
npm run sovereignty-check

# Docker deployment
docker-compose up -d
```

## API Endpoints

- `GET /health` - System status
- `GET /api/sovereignty` - Vendor scores
- `POST /api/chat` - LLM interaction
- `POST /api/embed` - Vector embedding
- `POST /api/search` - Semantic search

## Security

- Rate limiting: 100 requests/minute
- Cost limits: $0.001/request maximum
- Input validation: Zod schemas
- Headers: Helmet.js security
- Sovereign-first: Local models only

---

**EXPREZZZO Sovereign House** - Built for Vegas, owned by you.

© 2025 EXPREZZZO. Escape Protocol: Ready. Vegas First™.