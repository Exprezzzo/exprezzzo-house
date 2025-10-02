# How to Connect Exprezzzo Suite to House Infrastructure

The House provides these services:
- PostgreSQL: postgresql://exprezzzo:Exp3zzz0_2025@localhost:5432/exprezzzo
- Redis: redis://:Exp3zzz0_Redis@localhost:6379
- Ollama: http://localhost:11434

Add to Suite's .env.local:
DATABASE_URL="postgresql://exprezzzo:Exp3zzz0_2025@localhost:5432/exprezzzo"
REDIS_URL="redis://:Exp3zzz0_Redis@localhost:6379"
