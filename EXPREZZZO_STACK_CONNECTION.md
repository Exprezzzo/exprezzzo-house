# EXPREZZZO SOVEREIGN STACK - TEAM CONNECTION GUIDE

## QUICK START FOR DEVELOPERS

### Prerequisites
- Docker Desktop installed and running
- Git configured
- Access to exprezzzo-house repository

### Connection Details

#### PostgreSQL Database
```bash
Host: localhost
Port: 5432
Database: exprezzzo
Username: exprezzzo
Password: Exp3zzz0_2025
Connection String: postgresql://exprezzzo:Exp3zzz0_2025@localhost:5432/exprezzzo
Redis Cache
bashHost: localhost
Port: 6379
Password: Exp3zzz0_Redis
Connection String: redis://:Exp3zzz0_Redis@localhost:6379
Ollama LLM
bashHost: http://localhost:11434
Model: llama3.2
API Endpoint: http://localhost:11434/api/generate
Starting the Stack
bashcd ~/exprezzzo-house
docker-compose up -d
Verifying Services
bash# Check all running
docker ps

# Test PostgreSQL
docker exec exprezzzo-house-postgres-1 psql -U exprezzzo -d exprezzzo -c "SELECT 1;"

# Test Redis
docker exec exprezzzo-house-redis-1 redis-cli -a Exp3zzz0_Redis ping

# Test Ollama
curl http://localhost:11434/api/tags
Application Configuration (.env)
env# Database
DATABASE_URL=postgresql://exprezzzo:Exp3zzz0_2025@localhost:5432/exprezzzo

# Redis
REDIS_URL=redis://:Exp3zzz0_Redis@localhost:6379

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# EXPREZZZO Settings
EXPREZZZO_ENV=development
EXPREZZZO_COST_TARGET=0.0002
EXPREZZZO_VENDOR_COUNT=800
Node.js Connection Example
javascript// PostgreSQL
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Redis
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

// Ollama
const askOllama = async (prompt) => {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.2',
      prompt: prompt,
      stream: false
    })
  });
  return await response.json();
};
Python Connection Example
python# PostgreSQL
import psycopg2
conn = psycopg2.connect(
    "postgresql://exprezzzo:Exp3zzz0_2025@localhost:5432/exprezzzo"
)

# Redis
import redis
r = redis.Redis(
    host='localhost',
    port=6379,
    password='Exp3zzz0_Redis',
    decode_responses=True
)

# Ollama
import requests
def ask_ollama(prompt):
    response = requests.post(
        'http://localhost:11434/api/generate',
        json={'model': 'llama3.2', 'prompt': prompt, 'stream': False}
    )
    return response.json()
HOUSE LAWS (MANDATORY)

EXPREZZZO = Always 3 Z's (never Expresso/Exprezzo)
PostgreSQL for all core data (no Firebase)
Forward-only development (never delete, only add)
24hr escape routes (all data exportable)
Vegas colors: #C5B358 (gold), #381819 (burgundy), #1DE9B6 (glow)

Troubleshooting

Port conflicts: Stop local services (sudo systemctl stop postgresql/redis/ollama)
Container won't start: docker-compose down && docker-compose up -d
Ollama slow: First request loads model (30s), subsequent are faster
Out of space: docker system prune -a

Support

Repository: github.com/Exprezzzo/exprezzzo-house
Stack location: ~/exprezzzo-house
Logs: docker logs [container-name]

Cost Analysis

Infrastructure: $0/month (local Docker)
Target per request: $0.0002
Current achievement: Ready to measure
Monitoring: docker stats

REMEMBER: The House Always Wins - Through Sovereignty, Not Lock-in

### **STEP 4: SAVE THE FILE**
- Press `Ctrl+O` to save
- Press `Enter` to confirm filename
- Press `Ctrl+X` to exit nano

### **STEP 5: VERIFY IT'S CREATED**
```bash
ls -la EXPREZZZO_STACK_CONNECTION.md
cat EXPREZZZO_STACK_CONNECTION.md | head -10
